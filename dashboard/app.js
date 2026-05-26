/* =========================================
   SkyOps Agent — Dashboard Application Logic
   Demo Simulation Engine + All UI Panels
   ========================================= */

// ============================================================
// 1. DATA SOURCE: Google Sheets (written by n8n pipeline)
// ============================================================
// No hardcoded scenario — all data comes from Google Sheets
const SHEET_ID = '178rQWaShDZzy5ZdQwhwZeCfNkWFyCSEAx9IWkpWYRaA';
const SHEET_TAB = 'SkyOps Alert';

// ============================================================
// 2. TOPOLOGY CONFIGURATION
// ============================================================
const NODES = {
  "1": { x: 250, y: 55, label: "Node #1", type: "Border Router", radius: 28 },
  "2": { x: 100, y: 200, label: "Node #2", type: "UDP Client", radius: 22 },
  "3": { x: 250, y: 195, label: "Node #3", type: "UDP Client", radius: 22 },
  "4": { x: 330, y: 320, label: "Node #4", type: "UDP Client", radius: 22 },
  "5": { x: 420, y: 150, label: "Node #5", type: "UDP Client", radius: 22 },
};

// Initial RPL parent links: child → parent
const INITIAL_LINKS = [
  { from: "3", to: "1" },
  { from: "2", to: "3" },
  { from: "4", to: "3" },
  { from: "5", to: "1" },
];

// ============================================================
// 3. APPLICATION STATE
// ============================================================
const state = {
  currentStep: 0,
  totalEvents: 0,
  anomalyCount: 0,
  ruleDetections: 0,
  llmDetections: 0,
  healthScores: { "1": 100, "2": 100, "3": 100, "4": 100, "5": 100 },
  links: JSON.parse(JSON.stringify(INITIAL_LINKS)),
  events: [],
  alerts: [],
  nodeStatus: { "1": "healthy", "2": "healthy", "3": "healthy", "4": "healthy", "5": "healthy" },
  intervalId: null,
};

// ============================================================
// 4. UTILITY FUNCTIONS
// ============================================================
function getHealthColor(score) {
  if (score >= 80) return '#22c55e';
  if (score >= 50) return '#eab308';
  if (score >= 25) return '#f97316';
  return '#ef4444';
}

function getHealthStatus(score) {
  if (score >= 80) return { text: 'Healthy', cls: 'status-healthy' };
  if (score >= 50) return { text: 'Warning', cls: 'status-warning' };
  if (score >= 25) return { text: 'Danger', cls: 'status-danger' };
  return { text: 'Critical', cls: 'status-critical' };
}

function getSeverityForEvent(event_type) {
  const map = { NORMAL: 'NORMAL', INITIALIZATION: 'LOW', ROUTING_FAILURE: 'HIGH', TOPOLOGY_CHANGE: 'MEDIUM', NODE_FAILURE: 'CRITICAL' };
  return map[event_type] || 'LOW';
}

function getDetectionMethod(event_type) {
  // NORMAL/INITIALIZATION → Rule Engine, others → LLM (simulating hybrid)
  if (event_type === 'NORMAL' || event_type === 'INITIALIZATION') return 'RULE_BASED';
  return Math.random() > 0.4 ? 'LLM_AGENT' : 'RULE_BASED';
}

function formatTime(timeStr) {
  return timeStr;
}

// ============================================================
// 5. TOPOLOGY RENDERER
// ============================================================
function renderTopology() {
  const linksGroup = document.getElementById('linksGroup');
  const nodesGroup = document.getElementById('nodesGroup');
  linksGroup.innerHTML = '';
  nodesGroup.innerHTML = '';

  // Render links
  state.links.forEach((link, i) => {
    const from = NODES[link.from];
    const to = NODES[link.to];
    const color = getHealthColor(Math.min(state.healthScores[link.from], state.healthScores[link.to]));
    const isWeak = state.healthScores[link.from] < 50 || state.healthScores[link.to] < 50;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', from.x);
    line.setAttribute('y1', from.y);
    line.setAttribute('x2', to.x);
    line.setAttribute('y2', to.y);
    line.setAttribute('stroke', color);
    line.setAttribute('class', `topo-link ${isWeak ? 'inactive' : ''}`);
    line.setAttribute('opacity', isWeak ? '0.3' : '0.7');
    linksGroup.appendChild(line);
  });

  // Render nodes
  Object.entries(NODES).forEach(([id, node]) => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const score = state.healthScores[id];
    const color = getHealthColor(score);

    // Outer glow circle
    const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    glow.setAttribute('cx', node.x);
    glow.setAttribute('cy', node.y);
    glow.setAttribute('r', node.radius + 6);
    glow.setAttribute('fill', color);
    glow.setAttribute('opacity', '0.12');
    glow.setAttribute('filter', 'url(#glow)');
    g.appendChild(glow);

    // Main circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', node.x);
    circle.setAttribute('cy', node.y);
    circle.setAttribute('r', node.radius);
    circle.setAttribute('fill', `${color}22`);
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', id === "1" ? '3' : '2.5');
    circle.setAttribute('class', 'topo-node-circle');
    g.appendChild(circle);

    // Icon in center (BR gets special icon)
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    icon.setAttribute('x', node.x);
    icon.setAttribute('y', node.y + 1);
    icon.setAttribute('text-anchor', 'middle');
    icon.setAttribute('dominant-baseline', 'middle');
    icon.setAttribute('font-size', id === "1" ? '18' : '14');
    icon.textContent = id === "1" ? '🌐' : '📡';
    g.appendChild(icon);

    // Label below
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', node.x);
    label.setAttribute('y', node.y + node.radius + 16);
    label.setAttribute('class', 'topo-node-label');
    label.textContent = node.label;
    g.appendChild(label);

    // Score below label
    const scoreText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    scoreText.setAttribute('x', node.x);
    scoreText.setAttribute('y', node.y + node.radius + 30);
    scoreText.setAttribute('class', 'topo-node-score');
    scoreText.setAttribute('fill', color);
    scoreText.textContent = `${score}/100`;
    g.appendChild(scoreText);

    // Type label
    const typeLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    typeLabel.setAttribute('x', node.x);
    typeLabel.setAttribute('y', node.y + node.radius + 42);
    typeLabel.setAttribute('class', 'topo-node-type');
    typeLabel.textContent = node.type;
    g.appendChild(typeLabel);

    nodesGroup.appendChild(g);
  });
}

// ============================================================
// 6. HEALTH GAUGE RENDERER
// ============================================================
function renderGauges() {
  const container = document.getElementById('gaugesContainer');
  container.innerHTML = '';

  Object.entries(NODES).forEach(([id, node]) => {
    const score = state.healthScores[id];
    const color = getHealthColor(score);
    const status = getHealthStatus(score);
    const circumference = 2 * Math.PI * 40; // r=40
    const dashArray = (score / 100) * circumference;

    const div = document.createElement('div');
    div.className = 'gauge-item';
    div.innerHTML = `
      <svg class="gauge-svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" class="gauge-bg" />
        <circle cx="50" cy="50" r="40" class="gauge-fill"
          stroke="${color}"
          stroke-dasharray="${dashArray} ${circumference}"
          transform="rotate(-90 50 50)" />
        <text x="50" y="50" class="gauge-value" fill="${color}">${score}</text>
      </svg>
      <div class="gauge-label">${node.label}</div>
      <span class="gauge-status ${status.cls}">${status.text}</span>
    `;
    container.appendChild(div);
  });

  // Update avg health
  const avg = Math.round(Object.values(state.healthScores).reduce((a, b) => a + b, 0) / 5);
  document.getElementById('avgHealth').textContent = `Avg: ${avg}`;
}

// ============================================================
// 7. EVENT FEED
// ============================================================
function addEventToFeed(event) {
  const container = document.getElementById('feedContainer');
  const empty = container.querySelector('.feed-empty');
  if (empty) empty.remove();

  const severity = getSeverityForEvent(event.event_type);

  const item = document.createElement('div');
  item.className = `feed-item severity-${severity}`;
  item.innerHTML = `
    <span class="feed-time">${event.time}</span>
    <div class="feed-content">
      <span class="feed-node" style="color:${getHealthColor(state.healthScores[event.node_id])}">Node #${event.node_id}</span>
      <span class="feed-badge badge-${event.event_type}">${event.event_type.replace('_', ' ')}</span>
      <div class="feed-msg">${event.message}</div>
    </div>
  `;

  container.insertBefore(item, container.firstChild);

  // Keep max 25 items
  while (container.children.length > 25) {
    container.removeChild(container.lastChild);
  }

  document.getElementById('feedCount').textContent = `${state.totalEvents} events`;
}

// ============================================================
// 8. ALERT HISTORY
// ============================================================
function addAlert(event, method) {
  const container = document.getElementById('alertsContainer');
  const empty = container.querySelector('.alerts-empty');
  if (empty) empty.remove();

  const severity = getSeverityForEvent(event.event_type);
  const now = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const item = document.createElement('div');
  item.className = 'alert-item';
  item.innerHTML = `
    <div class="alert-top">
      <span class="alert-severity sev-${severity}">${severity}</span>
      <span class="alert-time">${now}</span>
    </div>
    <div class="alert-node">📡 Node #${event.node_id} — ${event.event_type.replace('_', ' ')}</div>
    <div class="alert-method">🤖 ${method === 'LLM_AGENT' ? 'Multi-Agent LLM' : 'Rule Engine'} Detection</div>
  `;

  container.insertBefore(item, container.firstChild);

  while (container.children.length > 8) {
    container.removeChild(container.lastChild);
  }

  state.alerts.push({ event, method, time: now });
  document.getElementById('alertCount').textContent = state.alerts.length;
}

// ============================================================
// 9. DETECTION DONUT CHART
// ============================================================
function updateDonutChart() {
  const total = state.ruleDetections + state.llmDetections;
  const circumference = 2 * Math.PI * 70; // r=70

  if (total === 0) return;

  const ruleRatio = state.ruleDetections / total;
  const llmRatio = state.llmDetections / total;

  const ruleArc = ruleRatio * circumference;
  const llmArc = llmRatio * circumference;

  const ruleCircle = document.getElementById('donutRule');
  const llmCircle = document.getElementById('donutLLM');

  ruleCircle.setAttribute('stroke-dasharray', `${ruleArc} ${circumference}`);
  llmCircle.setAttribute('stroke-dasharray', `${llmArc} ${circumference}`);
  llmCircle.setAttribute('stroke-dashoffset', `-${ruleArc}`);

  document.getElementById('donutTotal').textContent = total;
  document.getElementById('ruleCount').textContent = state.ruleDetections;
  document.getElementById('llmCount').textContent = state.llmDetections;
}

// ============================================================
// 10. TIMELINE RENDERER
// ============================================================
function renderTimeline(sheetsAlerts) {
  const track = document.getElementById('timelineTrack');
  if (!track) return;
  track.innerHTML = '';

  const alerts = sheetsAlerts || [];
  if (alerts.length === 0) {
    track.innerHTML = '<div class="feed-empty" style="text-align:center;padding:20px;">Loading timeline from Google Sheets...</div>';
    return;
  }

  // Progress bar (always full since data is historical)
  const progress = document.createElement('div');
  progress.className = 'timeline-progress';
  progress.style.width = '100%';
  track.appendChild(progress);

  // Dots for each alert (max 20 most recent)
  const recent = alerts.slice(-20);
  recent.forEach((a, i) => {
    const pct = (i / (recent.length - 1)) * 100;
    const eventType = a.Anomaly || 'NORMAL';
    const dot = document.createElement('div');
    dot.className = `timeline-dot dot-${eventType}`;
    dot.style.left = `${Math.max(2, Math.min(98, pct))}%`;

    const nodeId = (a.Node || '').replace('Node #', '').replace('Node#', '');
    const time = String(a.Timestamp).substring(11, 16) || '--:--';
    const tooltip = document.createElement('div');
    tooltip.className = 'timeline-tooltip';
    tooltip.textContent = `${time} • Node #${nodeId} • ${eventType}`;
    dot.appendChild(tooltip);

    track.appendChild(dot);
  });
}

// ============================================================
// 11. KPI UPDATES
// ============================================================
function updateKPIs(event, method) {
  state.totalEvents++;

  // Anomaly count
  if (event.event_type !== 'NORMAL' && event.event_type !== 'INITIALIZATION') {
    state.anomalyCount++;
  }

  // Detection method tracking
  if (method === 'RULE_BASED') state.ruleDetections++;
  else state.llmDetections++;

  // Update health scores
  const id = event.node_id;
  const score = state.healthScores[id];
  switch (event.event_type) {
    case 'NODE_FAILURE':
      state.healthScores[id] = Math.max(0, score - 30);
      break;
    case 'ROUTING_FAILURE':
      state.healthScores[id] = Math.max(0, score - 15);
      break;
    case 'TOPOLOGY_CHANGE':
      state.healthScores[id] = Math.max(0, score - 5);
      break;
    case 'NORMAL':
      state.healthScores[id] = Math.min(100, score + 5);
      break;
  }

  // Update topology links on topology change events
  if (event.event_type === 'TOPOLOGY_CHANGE') {
    updateTopologyLinks(event);
  }

  // Active nodes
  const activeCount = Object.values(state.healthScores).filter(s => s > 0).length;

  // Uptime
  const uptime = Math.round((1 - state.anomalyCount / Math.max(1, state.totalEvents)) * 100);

  // Animate KPI values
  animateKPI('kpiTotalEvents', state.totalEvents);
  animateKPI('kpiAnomalies', state.anomalyCount);
  document.getElementById('kpiUptime').textContent = `${uptime}%`;
  document.getElementById('kpiActiveNodes').textContent = `${activeCount}/5`;
  document.getElementById('kpiDetectionMethod').textContent = method === 'LLM_AGENT' ? 'LLM' : 'Rule';

  // Uptime color
  const uptimeEl = document.getElementById('kpiUptime');
  uptimeEl.className = 'kpi-value ' + (uptime >= 80 ? 'kpi-success' : uptime >= 50 ? '' : 'kpi-danger');
}

function animateKPI(elementId, value) {
  const el = document.getElementById(elementId);
  el.textContent = value;
  el.classList.remove('pulse-anim');
  void el.offsetWidth; // Trigger reflow
  el.classList.add('pulse-anim');
}

// ============================================================
// 12. TOPOLOGY LINK UPDATES
// ============================================================
function updateTopologyLinks(event) {
  const msg = event.message;

  // Parse "parent switch from nodeX to nodeY"
  const match = msg.match(/parent switch from node(\d+) to node(\d+)/i);
  if (!match) return;

  const childId = event.node_id;
  const newParentId = match[2];

  // Update links: remove old parent link for this child, add new one
  state.links = state.links.filter(l => l.from !== childId);
  state.links.push({ from: childId, to: newParentId });
}

// ============================================================
// 13. CLOCK
// ============================================================
function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toLocaleTimeString('tr-TR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

// ============================================================
// 14. SELF-HEALING ENGINE — Autonomous action simulation
// ============================================================
const HEALING_ACTIONS = {
  NODE_FAILURE: [
    { action: '🔄 Initiating soft restart for Node #{node}', detail: 'Sending RST signal via RPL control plane', recovery: '~2 min' },
    { action: '🔀 Rerouting traffic away from Node #{node}', detail: 'Updating RPL DODAG, redirecting via backup parent', recovery: '~30 sec' },
  ],
  ROUTING_FAILURE: [
    { action: '📡 Re-probing route to Node #{node}', detail: 'Sending DIO/DIS messages to verify reachability', recovery: '~45 sec' },
    { action: '🗺️ Requesting parent re-evaluation for Node #{node}', detail: 'Triggering RPL local repair procedure', recovery: '~1 min' },
  ],
  TOPOLOGY_CHANGE: [
    { action: '📋 Logging topology change for Node #{node}', detail: 'Recording parent switch event for trend analysis', recovery: 'Monitoring' },
  ],
};

function triggerSelfHealing(event, method) {
  const actions = HEALING_ACTIONS[event.event_type];
  if (!actions) return;

  const container = document.getElementById('healingContainer');
  const empty = container.querySelector('.healing-empty');
  if (empty) empty.remove();

  // Generate confidence score
  const confidence = event.event_type === 'NODE_FAILURE' ? (0.88 + Math.random() * 0.1) :
    event.event_type === 'ROUTING_FAILURE' ? (0.70 + Math.random() * 0.2) :
      (0.55 + Math.random() * 0.3);
  const confRounded = Math.round(confidence * 100) / 100;

  // Escalation logic based on confidence
  let escalation, escClass;
  if (confidence >= 0.85) {
    escalation = '🤖 AUTONOMOUS';
    escClass = 'action-autonomous';
  } else if (confidence >= 0.5) {
    escalation = '👤 HUMAN REVIEW';
    escClass = 'action-review';
  } else {
    escalation = '🚨 ESCALATED';
    escClass = 'action-escalated';
  }

  const selectedAction = actions[Math.floor(Math.random() * actions.length)];
  const actionText = selectedAction.action.replace('#{node}', event.node_id);
  const isActive = event.event_type === 'NODE_FAILURE' || event.event_type === 'ROUTING_FAILURE';

  const item = document.createElement('div');
  item.className = `healing-item ${isActive ? 'healing-active' : ''}`;
  item.innerHTML = `
    <div class="healing-top">
      <span class="healing-action-type ${escClass}">${escalation}</span>
      <span class="healing-confidence">Confidence: ${confRounded}</span>
    </div>
    <div class="healing-desc">${actionText}</div>
    <div class="healing-detail">${selectedAction.detail} • ETA: ${selectedAction.recovery}</div>
    ${isActive ? '<div class="healing-progress"><div class="healing-progress-bar" style="width: 0%"></div></div>' : ''}
  `;

  container.insertBefore(item, container.firstChild);

  // Animate progress bar
  if (isActive) {
    setTimeout(() => {
      const bar = item.querySelector('.healing-progress-bar');
      if (bar) bar.style.width = '100%';
    }, 100);
  }

  // Keep max 6 items
  while (container.children.length > 6) {
    container.removeChild(container.lastChild);
  }

  // Update status badge
  const badge = document.getElementById('healingStatus');
  badge.textContent = isActive ? 'ACTIVE' : 'MONITORING';
  badge.className = `card-badge healing-badge ${isActive ? 'active' : ''}`;
}

// ============================================================
// 15. (Simulation removed — all data from Google Sheets)
// ============================================================

// ============================================================
// 15. INITIALIZATION — No simulation, 100% Google Sheets data
// ============================================================
function init() {
  renderTopology();
  renderGauges();
  updateClock();
  setInterval(updateClock, 1000);

  // Stagger card animations
  const cards = document.querySelectorAll('.card');
  cards.forEach((card, i) => {
    card.style.animationDelay = `${i * 0.1}s`;
  });

  console.log('🚀 SkyOps AI Assistant initialized');
  console.log('📡 All data from Google Sheets (n8n pipeline)');

  // Initialize Google Sheets data engine (populates ALL panels)
  initPipelinePanel();

  // Initialize chat widget
  initChat();
}

// ============================================================
// 15b. LIVE PIPELINE — Google Sheets → ALL Dashboard Panels
// ============================================================
function initPipelinePanel() {
  // Uses global SHEET_ID and SHEET_TAB constants

  let allAlerts = [];
  let displayedCount = 0;
  const BATCH_SIZE = 1; // Single event at a time — realistic RPL mesh behavior

  async function fetchPipelineData() {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_TAB)}`;
      const res = await fetch(url);
      const text = await res.text();
      const jsonStr = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*?)\);/);
      if (!jsonStr) throw new Error('Invalid response');
      const json = JSON.parse(jsonStr[1]);
      const rows = json.table.rows || [];
      const cols = json.table.cols.map(c => c.label);

      allAlerts = rows.map(row => {
        const obj = {};
        row.c.forEach((cell, i) => {
          obj[cols[i]] = cell ? (cell.v || cell.f || '') : '';
        });
        return obj;
      }).filter(a => a.Timestamp);

      // Start progressive delivery
      displayedCount = 0;
      progressiveLoad();
    } catch (err) {
      console.warn('Pipeline fetch error:', err);
      const statusEl = document.getElementById('pipelineStatus');
      if (statusEl) {
        statusEl.textContent = 'Offline';
        statusEl.className = 'card-badge pipeline-status error';
      }
    }
  }

  // Progressive data delivery — events appear in batches with animation
  function progressiveLoad() {
    if (displayedCount >= allAlerts.length) {
      console.log(`✅ All ${allAlerts.length} events loaded`);
      return;
    }

    const end = Math.min(displayedCount + BATCH_SIZE, allAlerts.length);
    const batch = allAlerts.slice(0, end);
    const newItems = allAlerts.slice(displayedCount, end);

    // Update all panels with cumulative data
    renderPipelineData(batch);
    renderSheetsToKPIs(batch, displayedCount === 0);
    renderSheetsToNodeHealth(batch);
    renderSheetsToDetection(batch, displayedCount === 0);

    // Add only NEW items to feed/alert panels with animation
    newItems.forEach(a => {
      addEventToFeed(a);
      addAlertToHistory(a);
      addHealingAction(a);
    });

    // Update status
    const statusEl = document.getElementById('pipelineStatus');
    if (statusEl) {
      statusEl.textContent = `⏳ ${end}/${allAlerts.length}`;
      statusEl.className = 'card-badge pipeline-status connected';
      if (end >= allAlerts.length) {
        statusEl.textContent = `🟢 ${allAlerts.length} Records`;
      }
    }

    displayedCount = end;
    // Randomized 2-5s interval — mimics real RPL mesh DIO/DAO/sensor timing
    const nextInterval = 2000 + Math.random() * 3000;
    setTimeout(progressiveLoad, nextInterval);
  }

  // === PIPELINE DATA PANEL ===
  function renderPipelineData(alerts) {
    const confidences = alerts.map(a => parseFloat(a.Confidence)).filter(c => !isNaN(c));
    const avgConf = confidences.length > 0 ? (confidences.reduce((a, b) => a + b, 0) / confidences.length).toFixed(2) : '—';
    const autonomous = alerts.filter(a => a.Escalation === 'AUTONOMOUS').length;
    const escalated = alerts.filter(a => a.Escalation === 'ESCALATED').length;

    document.getElementById('psTotalAlerts').textContent = alerts.length;
    document.getElementById('psAvgConfidence').textContent = avgConf;
    document.getElementById('psAutonomous').textContent = autonomous;
    document.getElementById('psEscalated').textContent = escalated;

    const tbody = document.getElementById('pipelineTableBody');
    const recent = [...alerts].reverse().slice(0, 15);
    if (recent.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="pipeline-empty">No alerts in Google Sheets yet</td></tr>';
      return;
    }
    tbody.innerHTML = recent.map(a => {
      const time = String(a.Timestamp).substring(11, 19) || String(a.Timestamp).substring(0, 16);
      return `<tr>
        <td>${time}</td>
        <td>${a.Node || '—'}</td>
        <td><span class="sev-badge sev-${a.Severity}">${a.Severity}</span></td>
        <td><span class="esc-badge esc-${a.Escalation}">${a.Escalation}</span></td>
        <td>${a['Healing Action'] || '—'}</td>
      </tr>`;
    }).join('');

    renderTimeline(alerts);
  }

  // === SINGLE EVENT → FEED (animated) ===
  function addEventToFeed(a) {
    const container = document.getElementById('feedContainer');
    if (!container) return;
    const time = String(a.Timestamp).substring(11, 16) || '--:--';
    const nodeId = (a.Node || '').replace('Node #', '').replace('Node#', '');
    const eventType = a.Anomaly || 'NORMAL';
    const item = document.createElement('div');
    item.className = 'feed-item feed-item-new';
    item.innerHTML = `
      <span class="feed-time">${time}</span>
      <div class="feed-content">
        <span class="feed-node">Node #${nodeId}</span>
        <span class="feed-type type-${eventType}">${eventType.replace('_', ' ')}</span>
        <div class="feed-message">[n8n Pipeline] ${a['Healing Action'] || eventType}</div>
      </div>`;
    container.insertBefore(item, container.firstChild);
    requestAnimationFrame(() => item.classList.remove('feed-item-new'));

    // Trim old items
    while (container.children.length > 15) container.removeChild(container.lastChild);

    const feedCountEl = document.getElementById('feedCount');
    if (feedCountEl) feedCountEl.textContent = `${displayedCount + 1} events`;
  }

  // === SINGLE ALERT → HISTORY (animated) ===
  function addAlertToHistory(a) {
    if (!a.Anomaly || a.Anomaly === 'NORMAL') return;
    const container = document.getElementById('alertsContainer');
    if (!container) return;

    const empty = container.querySelector('.alerts-empty');
    if (empty) empty.remove();

    const time = String(a.Timestamp).substring(11, 19) || '--:--:--';
    const severity = a.Severity || 'LOW';
    const nodeId = (a.Node || '').replace('Node #', '').replace('Node#', '');
    const conf = parseFloat(a.Confidence) || 0;
    const method = conf >= 0.85 ? 'Multi-Agent LLM' : conf >= 0.50 ? 'Hybrid Engine' : 'Rule Engine';

    const item = document.createElement('div');
    item.className = 'alert-item feed-item-new';
    item.innerHTML = `
      <div class="alert-top">
        <span class="alert-severity sev-${severity}">${severity}</span>
        <span class="alert-time">${time}</span>
      </div>
      <div class="alert-node">📡 Node #${nodeId} — ${(a.Anomaly || '').replace('_', ' ')}</div>
      <div class="alert-method">🤖 ${method} Detection • Conf: ${a.Confidence}</div>`;
    container.insertBefore(item, container.firstChild);
    requestAnimationFrame(() => item.classList.remove('feed-item-new'));

    while (container.children.length > 12) container.removeChild(container.lastChild);

    const countEl = document.getElementById('alertCount');
    if (countEl) countEl.textContent = parseInt(countEl.textContent || '0') + 1;
  }

  // === SINGLE HEALING ACTION (animated) ===
  function addHealingAction(a) {
    if (!a['Healing Action'] || a['Healing Action'] === 'No Action') return;
    const container = document.getElementById('healingContainer');
    if (!container) return;

    const existing = container.querySelector('.healing-empty');
    if (existing) existing.remove();

    const nodeId = (a.Node || '').replace('Node #', '').replace('Node#', '');
    const time = String(a.Timestamp).substring(11, 16) || '--:--';
    const action = a['Healing Action'] || '';
    const esc = a.Escalation || '';

    const item = document.createElement('div');
    item.className = 'healing-item healing-active feed-item-new';
    item.innerHTML = `
      <div class="healing-header">
        <span class="healing-action">${esc === 'AUTONOMOUS' ? '🤖' : esc === 'ESCALATED' ? '🚨' : '👤'} ${action} → Node #${nodeId}</span>
        <span class="healing-status status-${esc === 'AUTONOMOUS' ? 'healthy' : esc === 'ESCALATED' ? 'critical' : 'warning'}">${esc}</span>
      </div>
      <div class="healing-detail">${time} • ${a.Anomaly || 'Unknown'} • Confidence: ${a.Confidence || '—'}</div>`;
    container.insertBefore(item, container.firstChild);
    requestAnimationFrame(() => item.classList.remove('feed-item-new'));

    while (container.children.length > 6) container.removeChild(container.lastChild);

    const badge = document.querySelector('#healingCard .card-badge');
    if (badge) {
      badge.textContent = `${container.children.length} Actions`;
      badge.className = 'card-badge status-healthy';
    }
  }

  // === NODE HEALTH from cumulative alerts ===
  function renderSheetsToNodeHealth(alerts) {
    const nodeDamage = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    const sevWeight = { CRITICAL: 8, HIGH: 5, MEDIUM: 3, LOW: 1 };
    alerts.forEach(a => {
      const nodeId = (a.Node || '').replace('Node #', '').replace('Node#', '');
      if (nodeDamage[nodeId] !== undefined) {
        nodeDamage[nodeId] += sevWeight[a.Severity] || 1;
      }
    });
    Object.keys(nodeDamage).forEach(id => {
      if (nodeDamage[id] > 0) {
        const damage = Math.min(nodeDamage[id], 85);
        state.healthScores[id] = Math.max(15, 100 - damage);
      }
    });
    renderGauges();
  }

  // === DETECTION METHODS from cumulative alerts ===
  function renderSheetsToDetection(alerts, reset) {
    const anomalies = alerts.filter(a => a.Anomaly && a.Anomaly !== 'NORMAL');
    let ruleCount = 0, llmCount = 0;
    anomalies.forEach(a => {
      const conf = parseFloat(a.Confidence) || 0;
      if (conf >= 0.70) llmCount++;
      else ruleCount++;
    });
    if (reset) { state.ruleDetections = 0; state.llmDetections = 0; }
    state.ruleDetections = ruleCount;
    state.llmDetections = llmCount;
    updateDonutChart();
  }

  // === KPI BAR from cumulative alerts ===
  function renderSheetsToKPIs(alerts, reset) {
    const anomalies = alerts.filter(a => a.Anomaly && a.Anomaly !== 'NORMAL');
    const totalEl = document.getElementById('kpiTotalEvents');
    const anomalyEl = document.getElementById('kpiAnomalies');
    if (totalEl) totalEl.textContent = alerts.length;
    if (anomalyEl) anomalyEl.textContent = anomalies.length;
  }

  // Initial fetch + auto-refresh every 3 minutes
  fetchPipelineData();
  setInterval(fetchPipelineData, 180000);
}

// ============================================================
// 16. CHAT ENGINE — Smart AI Assistant
// ============================================================
function initChat() {
  const fab = document.getElementById('chatFab');
  const panel = document.getElementById('chatPanel');
  const closeBtn = document.getElementById('chatClose');
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSend');
  const messages = document.getElementById('chatMessages');
  const suggestions = document.querySelectorAll('.chat-suggestion');

  // === CONFIG ===
  // API key is loaded from localStorage or URL hash: index.html#key=gsk_xxx
  const hashStr = window.location.hash.substring(1);
  if (hashStr) {
    const urlParams = new URLSearchParams(hashStr);
    if (urlParams.get('key')) {
      localStorage.setItem('skyops_groq_key', urlParams.get('key'));
    }
    if (urlParams.get('n8n')) {
      localStorage.setItem('skyops_n8n_url', urlParams.get('n8n'));
    }
    history.replaceState(null, '', window.location.pathname);
  }
  const GROQ_API_KEY = localStorage.getItem('skyops_groq_key') || '';
  const N8N_WEBHOOK_URL = localStorage.getItem('skyops_n8n_url') || 'https://omerpanaymsku.app.n8n.cloud/webhook/skyops-chat';
  const GOOGLE_SHEET_ID = '178rQWaShDZzy5ZdQwhwZeCfNkWFyCSEAx9IWkpWYRaA';
  const SHEET_TAB = 'SkyOps Alert';

  // Cache for Google Sheets data (refresh every 2 minutes)
  let sheetsCache = { data: null, lastFetch: 0 };

  // Toggle chat panel
  fab.addEventListener('click', () => {
    panel.classList.add('open');
    fab.style.display = 'none';
    input.focus();
  });

  closeBtn.addEventListener('click', () => {
    panel.classList.remove('open');
    fab.style.display = '';
  });

  // Fetch real alert data from Google Sheets (public sheet, no auth needed)
  async function fetchSheetAlerts() {
    const now = Date.now();
    if (sheetsCache.data && (now - sheetsCache.lastFetch) < 120000) {
      return sheetsCache.data; // Return cached data if less than 2 min old
    }
    try {
      const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_TAB)}`;
      const res = await fetch(url);
      const text = await res.text();
      // Google returns JSONP-like response, extract JSON
      const jsonStr = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*?)\);/);
      if (!jsonStr) return null;
      const json = JSON.parse(jsonStr[1]);
      const rows = json.table.rows || [];
      const cols = json.table.cols.map(c => c.label);

      const alerts = rows.map(row => {
        const obj = {};
        row.c.forEach((cell, i) => {
          obj[cols[i]] = cell ? (cell.v || cell.f || '') : '';
        });
        return obj;
      }).filter(a => a.Timestamp); // Filter empty rows

      sheetsCache = { data: alerts, lastFetch: now };
      console.log(`📊 Fetched ${alerts.length} alerts from Google Sheets`);
      return alerts;
    } catch (err) {
      console.warn('⚠️ Could not fetch Google Sheets:', err.message);
      return null;
    }
  }

  // Build context string from dashboard state + Google Sheets data
  function buildContext(sheetAlerts) {
    let lines = [];

    // Live dashboard state
    lines.push('=== CANLI DASHBOARD VERİLERİ ===');
    const scores = state.healthScores;
    Object.entries(scores).forEach(([id, score]) => {
      const status = score >= 80 ? 'Healthy' : score >= 50 ? 'Warning' : score < 30 ? 'Critical' : 'Danger';
      lines.push(`Node #${id}: ${score}/100 (${status})`);
    });
    lines.push(`Toplam Event: ${state.totalEvents} | Anomali: ${state.anomalyCount}`);

    // Recent alerts from Google Sheets
    if (sheetAlerts && sheetAlerts.length > 0) {
      lines.push('');
      lines.push('=== GOOGLE SHEETS ALERT GEÇMİŞİ ===');
      lines.push(`Toplam kayıtlı alert: ${sheetAlerts.length}`);
      const recent = sheetAlerts.slice(-5);
      recent.forEach(a => {
        lines.push(`[${a.Timestamp}] ${a.Node} — ${a.Severity} — ${a.Anomaly} — Confidence: ${a.Confidence} — Escalation: ${a.Escalation}`);
      });
    }

    // Dashboard alerts
    if (state.alerts.length > 0) {
      lines.push('');
      lines.push('=== SON DASHBOARD ALERTLERİ ===');
      state.alerts.slice(-3).forEach(a => {
        lines.push(`${a.severity}: ${a.message} (Node #${a.node_id})`);
      });
    }

    return lines.join('\n');
  }

  // Call Groq API directly (no n8n needed)
  async function callGroqAI(userMessage, context) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `Sen SkyOps AI Assistant'sın — kurumsal seviye bir IoT mesh ağ izleme ve otonom yönetim platformunun AI asistanısın.

Görevlerin:
1. Ağ durumunu analiz etmek ve raporlamak
2. Anomali tespitlerini açıklamak
3. Kök neden analizi yapmak
4. Aksiyon önerileri sunmak
5. Self-healing kararlarını açıklamak
6. Google Sheets'teki geçmiş alert verilerine dayalı trend analizi yapmak

Kurallar:
- Her zaman Türkçe yanıt ver
- Teknik ama anlaşılır ol
- Kısa ve net cevaplar ver (max 3-4 paragraf)
- Emoji kullan ama abartma
- Confidence score'lara göre escalation seviyesi öner:
  >= 0.85: 🤖 AUTONOMOUS (otomatik aksiyon al)
  0.50-0.84: 👤 HUMAN REVIEW (insan onayı gerekli)
  < 0.50: 🚨 ESCALATED (üst düzey mühendise bildir)

Teknoloji stack: n8n workflow orchestration, 3 uzman AI agent (Detector, Root Cause Analyzer, Action Advisor), RPL mesh protocol, Hybrid Detection (Rule Engine + LLM), Google Sheets reporting, Telegram alerts.

Aşağıda hem canlı dashboard verileri hem de Google Sheets'teki geçmiş alert kayıtları var.`
          },
          {
            role: 'user',
            content: `${context}\n\nKULLANICI SORUSU: ${userMessage}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) throw new Error(`Groq API error: ${response.status}`);
    const data = await response.json();
    return data.choices[0].message.content;
  }

  // Call n8n AI Agent webhook
  async function callN8nAgent(userMessage) {
    if (!N8N_WEBHOOK_URL) throw new Error('No n8n webhook URL configured');
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        sessionId: 'skyops-dashboard',
        state: {
          healthScores: state.healthScores,
          totalEvents: state.totalEvents,
          anomalyCount: state.anomalyCount
        }
      })
    });
    if (!response.ok) throw new Error(`n8n error: ${response.status}`);
    const data = await response.json();
    return data.output || data.text || data.response || JSON.stringify(data);
  }

  // Markdown → rich HTML for chat responses
  function formatMarkdown(text) {
    if (!text) return '<p>Yanıt üretilemedi.</p>';
    let html = text
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre class="chat-code">$1</pre>')
      .replace(/`([^`]+)`/g, '<code class="chat-inline-code">$1</code>')
      // Headers
      .replace(/^### (.+)$/gm, '<h4 class="chat-h4">$1</h4>')
      .replace(/^## (.+)$/gm, '<h3 class="chat-h3">$1</h3>')
      // Bold + italic
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Severity badges
      .replace(/\b(CRITICAL)\b/g, '<span class="chat-badge badge-critical">$1</span>')
      .replace(/\b(HIGH)\b/g, '<span class="chat-badge badge-high">$1</span>')
      .replace(/\b(MEDIUM)\b/g, '<span class="chat-badge badge-medium">$1</span>')
      .replace(/\b(LOW)\b/g, '<span class="chat-badge badge-low">$1</span>')
      .replace(/\b(AUTONOMOUS)\b/g, '<span class="chat-badge badge-autonomous">$1</span>')
      .replace(/\b(ESCALATED)\b/g, '<span class="chat-badge badge-escalated">$1</span>')
      .replace(/\b(HUMAN[_ ]REVIEW)\b/g, '<span class="chat-badge badge-review">$1</span>')
      // Anomaly types
      .replace(/\b(NODE_FAILURE|ROUTING_FAIL(?:URE)?|LATENCY_SPIKE|TOPOLOGY_CHANGE|PACKET_LOSS)\b/g, 
        '<span class="chat-anomaly">$1</span>');
    
    // Process lines for lists and paragraphs
    const lines = html.split('\n');
    let result = '';
    let inList = false;
    let listType = '';
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) { 
        if (inList) { result += listType === 'ul' ? '</ul>' : '</ol>'; inList = false; }
        return; 
      }
      
      // Bullet list
      const bulletMatch = trimmed.match(/^[\-\*•]\s+(.+)/);
      if (bulletMatch) {
        if (!inList || listType !== 'ul') {
          if (inList) result += listType === 'ul' ? '</ul>' : '</ol>';
          result += '<ul class="chat-list">';
          inList = true; listType = 'ul';
        }
        result += `<li>${bulletMatch[1]}</li>`;
        return;
      }
      
      // Numbered list
      const numMatch = trimmed.match(/^(\d+)[\.\)]\s+(.+)/);
      if (numMatch) {
        if (!inList || listType !== 'ol') {
          if (inList) result += listType === 'ul' ? '</ul>' : '</ol>';
          result += '<ol class="chat-list">';
          inList = true; listType = 'ol';
        }
        result += `<li>${numMatch[2]}</li>`;
        return;
      }
      
      // Close list if not a list item
      if (inList) { result += listType === 'ul' ? '</ul>' : '</ol>'; inList = false; }
      
      // Skip if already a block element
      if (trimmed.startsWith('<h') || trimmed.startsWith('<pre')) {
        result += trimmed;
      } else {
        result += `<p>${trimmed}</p>`;
      }
    });
    if (inList) result += listType === 'ul' ? '</ul>' : '</ol>';
    
    return result;
  }

  // Send message — n8n Agent first → Groq fallback → local fallback
  async function sendMessage(text) {
    if (!text.trim()) return;
    addUserMessage(text);
    input.value = '';
    showTyping();

    try {
      // Try 1: n8n AI Agent (has full system context + Sheets data)
      const aiReply = await callN8nAgent(text);
      removeTyping();
      addAIMessage(formatMarkdown(aiReply) + '<p class="chat-msg-hint">🟢 <em>n8n AI Agent</em></p>');
      console.log('🤖 Response from n8n AI Agent');

    } catch (n8nErr) {
      console.warn('⚠️ n8n unavailable, trying Groq fallback:', n8nErr.message);
      try {
        // Try 2: Direct Groq API (with Sheets context)
        const sheetAlerts = await fetchSheetAlerts();
        const context = buildContext(sheetAlerts);
        const aiReply = await callGroqAI(text, context);
        removeTyping();
        addAIMessage(formatMarkdown(aiReply) + '<p class="chat-msg-hint">🟡 <em>Groq LLM (fallback)</em></p>');
        console.log('🧠 Response from Groq API (fallback)');

      } catch (groqErr) {
        console.warn('⚠️ Groq also failed, using local:', groqErr.message);
        removeTyping();
        const fallback = generateResponse(text);
        addAIMessage(fallback + '<p class="chat-msg-hint">🔴 <em>Offline mode</em></p>');
      }
    }
  }

  sendBtn.addEventListener('click', () => sendMessage(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage(input.value);
  });

  suggestions.forEach(btn => {
    btn.addEventListener('click', () => sendMessage(btn.dataset.msg));
  });
}

function addUserMessage(text) {
  const messages = document.getElementById('chatMessages');
  const msg = document.createElement('div');
  msg.className = 'chat-msg chat-msg--user';
  msg.innerHTML = `<span class="chat-msg-avatar">👤</span><div class="chat-msg-bubble"><p>${text}</p></div>`;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

function addAIMessage(html) {
  const messages = document.getElementById('chatMessages');
  const msg = document.createElement('div');
  msg.className = 'chat-msg chat-msg--ai';
  msg.innerHTML = `<span class="chat-msg-avatar">🤖</span><div class="chat-msg-bubble">${html}</div>`;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

function showTyping() {
  const messages = document.getElementById('chatMessages');
  const typing = document.createElement('div');
  typing.className = 'chat-msg chat-msg--ai';
  typing.id = 'typingIndicator';
  typing.innerHTML = `<span class="chat-msg-avatar">🤖</span><div class="chat-typing"><span class="chat-typing-dot"></span><span class="chat-typing-dot"></span><span class="chat-typing-dot"></span></div>`;
  messages.appendChild(typing);
  messages.scrollTop = messages.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

// ============================================================
// 17. SMART RESPONSE GENERATOR — Uses live dashboard state
// ============================================================
function generateResponse(userMsg) {
  const msg = userMsg.toLowerCase();
  const scores = state.healthScores;
  const avg = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 5);
  const problematic = Object.entries(scores).filter(([, s]) => s < 70);
  const critical = Object.entries(scores).filter(([, s]) => s < 30);
  const anomalyPct = state.totalEvents > 0 ? Math.round((state.anomalyCount / state.totalEvents) * 100) : 0;
  const lastEvents = state.events.slice(-5);

  // Intent: Network status overview
  if (msg.match(/durum|status|genel|overview|nasıl|özet|network/i)) {
    let status = avg >= 80 ? '🟢 <strong>Stabil</strong>' : avg >= 50 ? '🟡 <strong>Dikkat Gerektiriyor</strong>' : '🔴 <strong>Kritik</strong>';
    let html = `<p>📊 <strong>Ağ Durumu:</strong> ${status}</p>`;
    html += `<p>Ortalama sağlık skoru: <code>${avg}/100</code></p>`;
    html += `<p>Toplam event: <code>${state.totalEvents}</code> | Anomali: <code>${state.anomalyCount}</code> (${anomalyPct}%)</p>`;
    html += `<p>Node skorları: ${Object.entries(scores).map(([id, s]) => `Node#${id}: <code>${s}</code>`).join(', ')}</p>`;
    if (problematic.length > 0) {
      html += `<p>⚠️ Sorunlu node'lar: ${problematic.map(([id, s]) => `<strong>Node#${id}</strong> (${s}/100)`).join(', ')}</p>`;
    }
    return html;
  }

  // Intent: Specific node query
  const nodeMatch = msg.match(/node\s*#?(\d)/i);
  if (nodeMatch) {
    const nodeId = nodeMatch[1];
    const score = scores[nodeId];
    if (score === undefined) return `<p>Node#${nodeId} bu ağda bulunmuyor. Mevcut node'lar: 1-5.</p>`;
    const status = score >= 80 ? '🟢 Sağlıklı' : score >= 50 ? '🟡 Dikkat' : score < 30 ? '🔴 Kritik' : '🟠 Tehlikede';
    let html = `<p>📡 <strong>Node #${nodeId}</strong> — ${status}</p>`;
    html += `<p>Sağlık Skoru: <code>${score}/100</code></p>`;
    if (score < 50) {
      html += `<p>🔍 <strong>Analiz:</strong> Bu node'da sağlık skoru düşük. Olası nedenler: routing failure, heartbeat timeout, veya parent switch instabilitesi.</p>`;
      html += `<p>💡 <strong>Öneri:</strong> Node'u soft restart yapın ve RPL routing tablosunu kontrol edin.</p>`;
    } else if (score < 80) {
      html += `<p>⚠️ Hafif performans düşüşü var. Topology değişiklikleri izleniyor.</p>`;
    } else {
      html += `<p>✅ Node stabil çalışıyor, herhangi bir sorun tespit edilmedi.</p>`;
    }
    return html;
  }

  // Intent: Problem / anomaly query
  if (msg.match(/sorun|problem|anomali|hata|error|arıza|fail|neden|why/i)) {
    if (problematic.length === 0) {
      return `<p>✅ Şu an ağda aktif bir sorun tespit edilmiyor. Tüm node'lar sağlıklı çalışıyor.</p><p>Anomali oranı: <code>${anomalyPct}%</code></p>`;
    }
    let html = `<p>⚠️ <strong>${problematic.length} node'da sorun tespit edildi:</strong></p>`;
    problematic.forEach(([id, s]) => {
      html += `<p>• <strong>Node#${id}</strong>: Skor <code>${s}/100</code> — `;
      if (s < 30) html += `🔴 Kritik seviye, acil müdahale gerekli</p>`;
      else if (s < 50) html += `🟠 Tehlikede, yakın izleme gerekli</p>`;
      else html += `🟡 Hafif düşüş, izleniyor</p>`;
    });
    html += `<p>🧬 <strong>Kök Neden:</strong> RPL mesh ağında kademeli routing bozulması. Parent switch olayları cascading etkiye yol açıyor.</p>`;
    return html;
  }

  // Intent: Action recommendation
  if (msg.match(/aksiyon|action|öneri|recommend|ne yap|çözüm|solution|tavsiye/i)) {
    if (critical.length > 0) {
      let html = `<p>🚨 <strong>Acil Aksiyon Gerekiyor:</strong></p>`;
      critical.forEach(([id]) => {
        html += `<p>1️⃣ Node#${id} için <strong>soft restart</strong> başlatın</p>`;
      });
      html += `<p>2️⃣ RPL routing tablosunu doğrulayın</p>`;
      html += `<p>3️⃣ Komşu node'ların parent bağlantılarını kontrol edin</p>`;
      html += `<p>4️⃣ Network stabilize olduktan sonra 5 dakika izleyin</p>`;
      html += `<p>⏱️ Tahmini recovery: <code>~2-3 dakika</code></p>`;
      return html;
    } else if (problematic.length > 0) {
      return `<p>💡 <strong>Öneriler:</strong></p><p>1️⃣ Sorunlu node'ları izlemeye devam edin</p><p>2️⃣ Health score 50'nin altına düşerse soft restart planlayın</p><p>3️⃣ Topology değişimlerini loglamaya devam edin</p><p>✅ Acil müdahale gerekmiyor, durum kontrol altında.</p>`;
    }
    return `<p>✅ Ağ stabil durumda. Aktif bir aksiyon gerekmiyor.</p><p>💡 Rutin izlemeye devam edin. SkyOps Agent anomalileri otomatik tespit edecek.</p>`;
  }

  // Intent: Architecture / how it works
  if (msg.match(/nasıl çalış|mimari|architecture|agent|multi.*agent|how|sistem/i)) {
    return `<p>🏗️ <strong>SkyOps Agent Mimarisi:</strong></p>
    <p>Bu sistem <strong>3 uzman AI agent</strong> ile çalışır:</p>
    <p>🔍 <strong>Agent 1 — Detector:</strong> Anomali tespiti ve sınıflandırma</p>
    <p>🧬 <strong>Agent 2 — Root Cause:</strong> Kök neden analizi ve temporal pattern tespiti</p>
    <p>💡 <strong>Agent 3 — Action Advisor:</strong> Aksiyon önerisi ve recovery tahmini</p>
    <p>Her agent bir öncekinin analizini alır ve derinleştirir. Sonuçlar <strong>Consensus Builder</strong>'da birleştirilir.</p>
    <p>📡 Basit event'ler <strong>Rule Engine</strong> ile (0ms), kompleks anomaliler <strong>Multi-Agent LLM</strong> ile analiz edilir (Hybrid Detection).</p>`;
  }

  // Intent: Greeting
  if (msg.match(/merhaba|selam|hey|hello|hi/i)) {
    return `<p>Merhaba! 👋 Ben SkyOps AI Assistant.</p><p>IoT mesh ağınız hakkında sorular sorun — node durumları, anomaliler, aksiyon önerileri konusunda yardımcı olabilirim.</p>`;
  }

  // Default: general response with current state
  return `<p>📊 Sorunuzu analiz ediyorum...</p>
  <p>Şu anki ağ durumu: Ortalama sağlık <code>${avg}/100</code>, ${state.anomalyCount} anomali tespit edildi.</p>
  <p>${problematic.length > 0 ? `⚠️ Sorunlu node'lar: ${problematic.map(([id, s]) => `Node#${id}(${s})`).join(', ')}` : '✅ Tüm node\'lar stabil.'}</p>
  <p>Daha spesifik sorular için şunları deneyin: <em>"Node 3 durumu"</em>, <em>"Anomali özeti"</em>, <em>"Ne yapmalıyım?"</em></p>`;
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
