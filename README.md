<div align="center">

# ◈ SkyOps Agent

### Autonomous Network Intelligence for IoT Mesh Networks

**Multi-Agent AI • Real-Time Dashboard • Hybrid Detection • n8n Orchestration**

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Dashboard-f97316?style=for-the-badge&logoColor=white)](https://omerpanay.github.io/SkyOps-Agent/dashboard/)
[![n8n](https://img.shields.io/badge/n8n-Workflow_Automation-EA4B71?style=for-the-badge&logo=n8n&logoColor=white)](https://n8n.io)
[![Groq](https://img.shields.io/badge/Groq-LLM_Inference-F55036?style=for-the-badge)](https://groq.com)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)

---

*An enterprise-grade AI system that autonomously monitors, diagnoses, and responds to anomalies in RPL-based IoT mesh networks — powered by a 3-agent LLM pipeline and hybrid rule/AI detection.*

**[🚀 Live Dashboard](https://omerpanay.github.io/SkyOps-Agent/dashboard/)** · **[📋 Architecture](#architecture)** · **[🤖 Multi-Agent Pipeline](#multi-agent-pipeline)** · **[⚡ Quick Start](#quick-start)**

</div>

---

## 🎯 What is SkyOps Agent?

SkyOps Agent is an **autonomous network operations (NetOps) AI system** that transforms raw IoT mesh network logs into actionable intelligence through:

| Capability | Description |
|---|---|
| 🔍 **Hybrid Detection** | Rule Engine for instant (0ms) classification + Multi-Agent LLM for complex anomaly analysis |
| 🤖 **Multi-Agent AI** | 3 specialized agents collaborate: Detector → Root Cause Analyzer → Action Advisor |
| 📊 **Real-Time Dashboard** | 7 interactive panels with live topology map, health gauges, event feed, and AI chat |
| 💬 **AI Chat Interface** | Conversational assistant that answers questions using live network state |
| 📱 **Telegram Alerts** | Automated multi-agent reports delivered to operations team |
| 🔄 **Demo-Ready** | Self-contained simulation engine — no backend required |

> **Design Philosophy:** Built with the same principles as enterprise AI orchestration platforms — visual workflows, multi-agent collaboration, and production-grade reliability.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    SkyOps Agent Architecture                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────┐     ┌───────────┐     ┌────────────┐                │
│  │ IoT Mesh │────▶│ n8n Cloud │────▶│  Telegram   │               │
│  │ Network  │     │ Workflow  │     │  Alerts     │               │
│  └─────────┘     └─────┬─────┘     └────────────┘                │
│                         │                                          │
│              ┌──────────┴──────────┐                              │
│              │   Detection Layer   │                              │
│              ├─────────┬──────────┤                              │
│              │         │          │                              │
│         ┌────▼───┐  ┌──▼───────────▼──────────────┐              │
│         │  Rule  │  │   Multi-Agent LLM Pipeline   │              │
│         │ Engine │  │                               │              │
│         │ (0ms)  │  │  ┌──────────┐  ┌──────────┐ │              │
│         └────┬───┘  │  │ Agent 1  │─▶│ Agent 2  │ │              │
│              │      │  │ Detector │  │ Root     │ │              │
│              │      │  └──────────┘  │ Cause    │ │              │
│              │      │                └────┬─────┘ │              │
│              │      │           ┌─────────▼─────┐ │              │
│              │      │           │   Agent 3     │ │              │
│              │      │           │ Action Advisor│ │              │
│              │      │           └───────┬───────┘ │              │
│              │      │          ┌────────▼────────┐│              │
│              │      │          │   Consensus     ││              │
│              │      │          │   Builder       ││              │
│              │      │          └────────┬────────┘│              │
│              │      └──────────────────┬─────────┘              │
│              │                         │                          │
│              └───────────┬─────────────┘                          │
│                          │                                        │
│                ┌─────────▼─────────┐                              │
│                │   Dashboard UI    │                              │
│                │  + AI Chat Widget │                              │
│                └───────────────────┘                              │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🤖 Multi-Agent Pipeline

Unlike traditional single-LLM approaches, SkyOps uses a **3-agent chain** where each agent builds on the previous analysis:

### Agent 1 — Anomaly Detector
```
Input:  Raw log + health score + node history
Output: anomaly_type, severity, confidence_score, preliminary_diagnosis
Model:  Llama-3.1-8b-instant (via Groq)
```

### Agent 2 — Root Cause Analyzer
```
Input:  Agent 1's detection + temporal context + network state
Output: root_cause, contributing_factors, impact_scope, temporal_pattern
Model:  Llama-3.1-8b-instant (via Groq)
```

### Agent 3 — Action Advisor
```
Input:  Agent 1 + Agent 2 outputs + full context
Output: immediate_action, preventive_measures, estimated_recovery, escalation_needed
Model:  Llama-3.1-8b-instant (via Groq)
```

### Consensus Builder
Merges all 3 agent outputs into a unified report:
- Takes the **highest severity** (conservative approach)
- Averages **confidence scores** across agents
- Produces a single actionable alert

**Example Telegram Alert:**
```
🚨 SkyOps Multi-Agent Alert — CRITICAL

📡 Node: Node #3
⚠️ Anomaly: NODE_FAILURE
🎯 Confidence: 0.91

🔍 DETECTOR: Heartbeat timeout after 3 retries
🧬 ROOT CAUSE: Progressive routing degradation
💡 ACTION: Initiate soft restart, reroute traffic

🛡️ Impact: MULTI_NODE
⏱️ Recovery: ~2 minutes
🤖 Agents: 3/3 ✅
```

---

## 📊 Dashboard Features

The dashboard is a **self-contained web application** — no backend required. It runs a built-in 18-step demo simulation.

| Panel | Description |
|---|---|
| 🗺️ **Network Topology** | SVG mesh map with animated links, color-coded node health |
| 🏥 **Health Gauges** | Circular gauges (0-100) for each node with smooth transitions |
| 📋 **Live Event Feed** | Scrollable log with severity badges and timestamps |
| 🔔 **Alert History** | Detection alerts with severity, node, and method info |
| 🤖 **Detection Split** | Donut chart showing Rule Engine vs LLM Agent distribution |
| ⏱️ **Anomaly Timeline** | Horizontal timeline with color-coded event markers |
| 💬 **AI Chat** | Conversational assistant using live dashboard state |

### AI Chat Assistant

The embedded chat widget allows natural language queries about the network:

- *"What's the status of Node 3?"* → Returns real-time health score and diagnosis
- *"Are there any problems?"* → Analyzes all nodes and highlights issues
- *"What should I do?"* → Provides actionable recommendations based on current state
- *"How does the system work?"* → Explains the multi-agent architecture

---

## ⚡ Quick Start

### View Live Demo
Visit the **[Live Dashboard](https://omerpanay.github.io/SkyOps-Agent/dashboard/)** — no setup required.

### Run Locally
```bash
# Clone the repository
git clone https://github.com/omerpanay/SkyOps-Agent.git
cd SkyOps-Agent

# Open the dashboard
open dashboard/index.html
# or simply double-click the file in your file explorer
```

### Import n8n Workflows
1. Install [n8n](https://n8n.io) or use n8n Cloud
2. Import `SKYOps Agent.json` — Multi-Agent detection pipeline
3. Import `SkyOps Demo Replay.json` — Mock data generator
4. Configure Groq API credentials
5. Activate both workflows

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Orchestration** | n8n (workflow automation) |
| **LLM** | Groq API (Llama-3.1-8b-instant) |
| **Detection** | Hybrid: Rule Engine + Multi-Agent LLM |
| **Frontend** | Vanilla HTML/CSS/JS (zero dependencies) |
| **Alerts** | Telegram Bot API |
| **Network** | Contiki-NG / Cooja (RPL mesh simulation) |
| **Data** | Mock Engine (18-step scenario for demo) |

---

## 📁 Project Structure

```
SkyOps-Agent/
├── dashboard/
│   ├── index.html          # Dashboard UI structure
│   ├── style.css           # SKYMOD-inspired dark theme
│   └── app.js              # Simulation engine + chat + all panels
├── SKYOps Agent.json       # n8n workflow: Multi-Agent Pipeline
├── SkyOps Demo Replay.json # n8n workflow: Mock Data Generator
└── README.md
```

---

## 🔮 Roadmap

- [ ] n8n Cloud deployment for 24/7 availability
- [ ] Webhook integration: Dashboard ↔ n8n real-time sync
- [ ] Additional agent: Predictive Maintenance Agent
- [ ] Multi-network support (fleet monitoring)
- [ ] Prometheus/Grafana metrics export
- [ ] Role-based access control (RBAC)

---

## 📜 License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ◈ by [Ömer Panay](https://github.com/omerpanay)**

*Autonomous Network Intelligence — Secure. Monitor. AI.*

</div>
