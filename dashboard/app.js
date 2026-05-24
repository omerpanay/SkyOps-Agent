/* =========================================
   SkyOps Agent — Dashboard Application Logic
   Demo Simulation Engine + All UI Panels
   ========================================= */

// ============================================================
// 1. SCENARIO DATA — 18-step dramatik senaryo
// ============================================================
const SCENARIO = [
  { step:1,  time:"00:00", node_id:"1", event_type:"NORMAL",          message:"[INFO: BR] IPv6 addresses: fe80::201:1:1:1",               severity:"LOW" },
  { step:2,  time:"00:10", node_id:"2", event_type:"NORMAL",          message:"[INFO: App] UDP packet sent to server",                    severity:"LOW" },
  { step:3,  time:"00:20", node_id:"3", event_type:"NORMAL",          message:"[INFO: App] UDP packet sent to server",                    severity:"LOW" },
  { step:4,  time:"00:30", node_id:"4", event_type:"NORMAL",          message:"[INFO: App] UDP packet sent to server",                    severity:"LOW" },
  { step:5,  time:"00:40", node_id:"5", event_type:"NORMAL",          message:"[INFO: App] UDP packet sent to server",                    severity:"LOW" },
  { step:6,  time:"00:50", node_id:"3", event_type:"ROUTING_FAILURE", message:"[INFO: App] Not reachable yet",                            severity:"HIGH" },
  { step:7,  time:"01:10", node_id:"3", event_type:"TOPOLOGY_CHANGE", message:"[INFO: RPL] parent switch from node2 to node1",            severity:"MEDIUM" },
  { step:8,  time:"01:30", node_id:"4", event_type:"TOPOLOGY_CHANGE", message:"[INFO: RPL] parent switch from node3 to node2",            severity:"MEDIUM" },
  { step:9,  time:"01:50", node_id:"3", event_type:"ROUTING_FAILURE", message:"[INFO: App] Not reachable yet",                            severity:"HIGH" },
  { step:10, time:"02:10", node_id:"3", event_type:"NODE_FAILURE",    message:"[ERROR] Node heartbeat timeout after 3 retries",           severity:"CRITICAL" },
  { step:11, time:"02:30", node_id:"5", event_type:"ROUTING_FAILURE", message:"[INFO: App] Not reachable yet",                            severity:"HIGH" },
  { step:12, time:"02:50", node_id:"2", event_type:"TOPOLOGY_CHANGE", message:"[INFO: RPL] parent switch from node3 to node1",            severity:"MEDIUM" },
  { step:13, time:"03:10", node_id:"3", event_type:"ROUTING_FAILURE", message:"[INFO: App] Attempting reconnection...",                   severity:"HIGH" },
  { step:14, time:"03:30", node_id:"3", event_type:"NORMAL",          message:"[INFO: App] Reconnected. UDP packet sent",                 severity:"LOW" },
  { step:15, time:"03:50", node_id:"5", event_type:"NORMAL",          message:"[INFO: App] UDP packet sent to server",                    severity:"LOW" },
  { step:16, time:"04:10", node_id:"4", event_type:"NORMAL",          message:"[INFO: App] UDP packet sent to server",                    severity:"LOW" },
  { step:17, time:"04:30", node_id:"2", event_type:"NORMAL",          message:"[INFO: App] Network stable, UDP sent",                     severity:"LOW" },
  { step:18, time:"04:50", node_id:"1", event_type:"NORMAL",          message:"[INFO: BR] All nodes reachable",                           severity:"LOW" },
];

// ============================================================
// 2. TOPOLOGY CONFIGURATION
// ============================================================
const NODES = {
  "1": { x: 250, y: 55,  label: "Node #1", type: "Border Router", radius: 28 },
  "2": { x: 100, y: 200, label: "Node #2", type: "UDP Client",    radius: 22 },
  "3": { x: 250, y: 195, label: "Node #3", type: "UDP Client",    radius: 22 },
  "4": { x: 330, y: 320, label: "Node #4", type: "UDP Client",    radius: 22 },
  "5": { x: 420, y: 150, label: "Node #5", type: "UDP Client",    radius: 22 },
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
// 14. SIMULATION ENGINE
// ============================================================
function processEvent(event) {
  const method = getDetectionMethod(event.event_type);

  // Update state
  updateKPIs(event, method);

  // Update scenario step display
  document.getElementById('scenarioStep').textContent = `Step ${state.currentStep}/${SCENARIO.length}`;

  // Add to event feed
  addEventToFeed(event);

  // Add alert for anomalies
  if (event.event_type !== 'NORMAL' && event.event_type !== 'INITIALIZATION') {
    addAlert(event, method);
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
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
