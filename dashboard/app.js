/* =========================================
   SkyOps Agent — Dashboard Application Logic
   Demo Simulation Engine + All UI Panels
   ========================================= */

// ============================================================
// 1. SCENARIO DATA — 18-step dramatik senaryo
// ============================================================
const SCENARIO = [
  { step: 1, time: "00:00", node_id: "1", event_type: "NORMAL", message: "[INFO: BR] IPv6 addresses: fe80::201:1:1:1", severity: "LOW" },
  { step: 2, time: "00:10", node_id: "2", event_type: "NORMAL", message: "[INFO: App] UDP packet sent to server", severity: "LOW" },
  { step: 3, time: "00:20", node_id: "3", event_type: "NORMAL", message: "[INFO: App] UDP packet sent to server", severity: "LOW" },
  { step: 4, time: "00:30", node_id: "4", event_type: "NORMAL", message: "[INFO: App] UDP packet sent to server", severity: "LOW" },
  { step: 5, time: "00:40", node_id: "5", event_type: "NORMAL", message: "[INFO: App] UDP packet sent to server", severity: "LOW" },
  { step: 6, time: "00:50", node_id: "3", event_type: "ROUTING_FAILURE", message: "[INFO: App] Not reachable yet", severity: "HIGH" },
  { step: 7, time: "01:10", node_id: "3", event_type: "TOPOLOGY_CHANGE", message: "[INFO: RPL] parent switch from node2 to node1", severity: "MEDIUM" },
  { step: 8, time: "01:30", node_id: "4", event_type: "TOPOLOGY_CHANGE", message: "[INFO: RPL] parent switch from node3 to node2", severity: "MEDIUM" },
  { step: 9, time: "01:50", node_id: "3", event_type: "ROUTING_FAILURE", message: "[INFO: App] Not reachable yet", severity: "HIGH" },
  { step: 10, time: "02:10", node_id: "3", event_type: "NODE_FAILURE", message: "[ERROR] Node heartbeat timeout after 3 retries", severity: "CRITICAL" },
  { step: 11, time: "02:30", node_id: "5", event_type: "ROUTING_FAILURE", message: "[INFO: App] Not reachable yet", severity: "HIGH" },
  { step: 12, time: "02:50", node_id: "2", event_type: "TOPOLOGY_CHANGE", message: "[INFO: RPL] parent switch from node3 to node1", severity: "MEDIUM" },
  { step: 13, time: "03:10", node_id: "3", event_type: "ROUTING_FAILURE", message: "[INFO: App] Attempting reconnection...", severity: "HIGH" },
  { step: 14, time: "03:30", node_id: "3", event_type: "NORMAL", message: "[INFO: App] Reconnected. UDP packet sent", severity: "LOW" },
  { step: 15, time: "03:50", node_id: "5", event_type: "NORMAL", message: "[INFO: App] UDP packet sent to server", severity: "LOW" },
  { step: 16, time: "04:10", node_id: "4", event_type: "NORMAL", message: "[INFO: App] UDP packet sent to server", severity: "LOW" },
  { step: 17, time: "04:30", node_id: "2", event_type: "NORMAL", message: "[INFO: App] Network stable, UDP sent", severity: "LOW" },
  { step: 18, time: "04:50", node_id: "1", event_type: "NORMAL", message: "[INFO: BR] All nodes reachable", severity: "LOW" },
];

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
function renderTimeline() {
  const track = document.getElementById('timelineTrack');
  track.innerHTML = '';

  // Progress bar
  const progress = document.createElement('div');
  progress.className = 'timeline-progress';
  progress.style.width = `${(state.currentStep / SCENARIO.length) * 100}%`;
  track.appendChild(progress);

  // Dots for each scenario step
  SCENARIO.forEach((event, i) => {
    const pct = (i / (SCENARIO.length - 1)) * 100;
    const dot = document.createElement('div');
    dot.className = `timeline-dot dot-${event.event_type} ${i >= state.currentStep ? 'future' : ''}`;
    dot.style.left = `${Math.max(2, Math.min(98, pct))}%`;

    const tooltip = document.createElement('div');
    tooltip.className = 'timeline-tooltip';
    tooltip.textContent = `${event.time} • Node #${event.node_id} • ${event.event_type}`;
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
// 15. SIMULATION ENGINE
// ============================================================
function processEvent(event) {
  const method = getDetectionMethod(event.event_type);

  // Update state
  updateKPIs(event, method);

  // Update scenario step display
  document.getElementById('scenarioStep').textContent = `Step ${state.currentStep}/${SCENARIO.length}`;

  // Add to event feed
  addEventToFeed(event);

  // Add alert for anomalies + trigger self-healing
  if (event.event_type !== 'NORMAL' && event.event_type !== 'INITIALIZATION') {
    addAlert(event, method);
    triggerSelfHealing(event, method);
  }

  // Re-render visual components
  renderTopology();
  renderGauges();
  updateDonutChart();
  renderTimeline();
}

function runSimulation() {
  if (state.currentStep >= SCENARIO.length) {
    // Reset for next cycle
    state.currentStep = 0;
    state.healthScores = { "1": 100, "2": 100, "3": 100, "4": 100, "5": 100 };
    state.links = JSON.parse(JSON.stringify(INITIAL_LINKS));
    state.totalEvents = 0;
    state.anomalyCount = 0;
    state.ruleDetections = 0;
    state.llmDetections = 0;
    state.events = [];
    state.alerts = [];

    // Clear UI
    document.getElementById('feedContainer').innerHTML = '<div class="feed-empty">Restarting scenario...</div>';
    document.getElementById('alertsContainer').innerHTML = '<div class="alerts-empty">No alerts yet</div>';
    document.getElementById('alertCount').textContent = '0';
    document.getElementById('healingContainer').innerHTML = '<div class="healing-empty">No actions triggered yet</div>';
    document.getElementById('healingStatus').textContent = 'STANDBY';
    document.getElementById('healingStatus').className = 'card-badge healing-badge';

    // Small delay before restart
    setTimeout(() => {
      document.getElementById('feedContainer').innerHTML = '<div class="feed-empty">Waiting for events...</div>';
    }, 1500);
    return;
  }

  const event = SCENARIO[state.currentStep];
  state.currentStep++;
  processEvent(event);
}

// ============================================================
// 15. INITIALIZATION
// ============================================================
function init() {
  // Initial render
  renderTopology();
  renderGauges();
  renderTimeline();
  updateClock();

  // Start clock
  setInterval(updateClock, 1000);

  // Start simulation — new event every 3.5 seconds
  setTimeout(() => {
    runSimulation(); // First event immediately after 1s
    state.intervalId = setInterval(runSimulation, 3500);
  }, 1000);

  // Stagger card animations
  const cards = document.querySelectorAll('.card');
  cards.forEach((card, i) => {
    card.style.animationDelay = `${i * 0.1}s`;
  });

  console.log('🚀 SkyOps Agent Dashboard initialized');
  console.log('📊 18-step scenario will play automatically');
  console.log('🔄 Scenario repeats after completion');

  // Initialize chat widget
  initChat();
  console.log('💬 Chat widget ready');

  // Initialize live pipeline data panel
  initPipelinePanel();
  console.log('📡 Pipeline panel ready');
}

// ============================================================
// 15b. LIVE PIPELINE PANEL — Google Sheets Data
// ============================================================
function initPipelinePanel() {
  const SHEET_ID = '178rQWaShDZzy5ZdQwhwZeCfNkWFyCSEAx9IWkpWYRaA';
  const SHEET_TAB = 'SkyOps Alert';

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

      const alerts = rows.map(row => {
        const obj = {};
        row.c.forEach((cell, i) => {
          obj[cols[i]] = cell ? (cell.v || cell.f || '') : '';
        });
        return obj;
      }).filter(a => a.Timestamp);

      renderPipelineData(alerts);
    } catch (err) {
      console.warn('Pipeline fetch error:', err);
      document.getElementById('pipelineStatus').textContent = 'Offline';
      document.getElementById('pipelineStatus').className = 'card-badge pipeline-status error';
    }
  }

  function renderPipelineData(alerts) {
    // Update status badge
    const statusEl = document.getElementById('pipelineStatus');
    statusEl.textContent = `🟢 ${alerts.length} Records`;
    statusEl.className = 'card-badge pipeline-status connected';

    // Calculate stats
    const confidences = alerts.map(a => parseFloat(a.Confidence)).filter(c => !isNaN(c));
    const avgConf = confidences.length > 0 ? (confidences.reduce((a, b) => a + b, 0) / confidences.length).toFixed(2) : '—';
    const autonomous = alerts.filter(a => a.Escalation === 'AUTONOMOUS').length;
    const escalated = alerts.filter(a => a.Escalation === 'ESCALATED').length;

    document.getElementById('psTotalAlerts').textContent = alerts.length;
    document.getElementById('psAvgConfidence').textContent = avgConf;
    document.getElementById('psAutonomous').textContent = autonomous;
    document.getElementById('psEscalated').textContent = escalated;

    // Render table (most recent first)
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
  const urlParams = new URLSearchParams(window.location.hash.substring(1));
  if (urlParams.get('key')) {
    localStorage.setItem('skyops_groq_key', urlParams.get('key'));
    window.location.hash = ''; // Clean URL after saving
  }
  const GROQ_API_KEY = localStorage.getItem('skyops_groq_key') || '';
  const GOOGLE_SHEET_ID = '178rQWaShDZzy5ZdQwhwZeCfNkWFyCSEAx9IWkpWYRaA';
  const SHEET_TAB = 'SkyOps Alert';

  // Cache for Google Sheets data (refresh every 2 minutes)
  let sheetsCache = { data: null, lastFetch: 0 };

  // Toggle chat panel
  fab.addEventListener('click', () => {
    panel.classList.add('open');
    fab.classList.add('hidden');
    input.focus();
  });

  closeBtn.addEventListener('click', () => {
    panel.classList.remove('open');
    fab.classList.remove('hidden');
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
    lines.push(`Demo Adım: ${state.currentStep}/18`);

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

  // Send message — Groq direct → n8n fallback → local fallback
  async function sendMessage(text) {
    if (!text.trim()) return;
    addUserMessage(text);
    input.value = '';
    showTyping();

    try {
      // Step 1: Fetch real alerts from Google Sheets
      const sheetAlerts = await fetchSheetAlerts();
      const context = buildContext(sheetAlerts);

      // Step 2: Call Groq API directly
      const aiReply = await callGroqAI(text, context);
      removeTyping();
      const htmlReply = `<p>${aiReply.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
      addAIMessage(htmlReply);
      console.log('🤖 AI response from Groq LLM (direct)');

    } catch (err) {
      console.warn('⚠️ Groq API error, using local fallback:', err.message);
      removeTyping();
      const fallback = generateResponse(text);
      addAIMessage(fallback + '<p class="chat-msg-hint">💡 <em>Offline mode — lokal analiz</em></p>');
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
