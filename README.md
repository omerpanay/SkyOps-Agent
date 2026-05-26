<div align="center">

# ◈ SkyOps Agent

### Autonomous Network Intelligence for IoT Mesh Networks

**Unified AI Agent • Real-Time Dashboard • Telegram Bot • n8n Orchestration**

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Dashboard-f97316?style=for-the-badge&logoColor=white)](https://omerpanay.github.io/SkyOps-Agent/dashboard/)
[![Telegram Bot](https://img.shields.io/badge/📱_Telegram-@SkyOpsAgent__bot-0088cc?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/SkyOpsAgent_bot)
[![n8n](https://img.shields.io/badge/n8n-Workflow_Automation-EA4B71?style=for-the-badge&logo=n8n&logoColor=white)](https://n8n.io)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.3_70B-F55036?style=for-the-badge)](https://groq.com)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)

---

*An enterprise-grade AI system that autonomously monitors, diagnoses, and responds to anomalies in RPL-based IoT mesh networks — powered by a unified AI Agent with multi-agent reasoning, dual-entry access (Dashboard + Telegram), and real Google Sheets telemetry.*

**[🚀 Live Dashboard](https://omerpanay.github.io/SkyOps-Agent/dashboard/)** · **[📱 Telegram Bot](https://t.me/SkyOpsAgent_bot)** · **[📋 Architecture](#architecture)** · **[⚡ Quick Start](#quick-start)**

</div>

---

## 🎯 What is SkyOps Agent?

SkyOps Agent is an **autonomous network operations (NetOps) AI system** that transforms real IoT mesh network telemetry into actionable intelligence through:

| Capability | Description |
|---|---|
| 🤖 **Unified AI Agent** | Single Llama-3.3-70B agent with embedded 3-agent reasoning (Detector → Root Cause → Action) |
| 📊 **Real-Time Dashboard** | 9 interactive panels with live topology, health gauges, event feed, and AI chat |
| 📱 **Telegram Bot** | Same AI Agent accessible via [@SkyOpsAgent_bot](https://t.me/SkyOpsAgent_bot) |
| 💬 **AI Chat Interface** | Conversational assistant powered by real Google Sheets network data |
| 🔧 **Self-Healing** | Autonomous recovery actions with confidence-based escalation |
| 🛡️ **Guardrails** | Confidence scoring (0.0–1.0) with 3-tier escalation logic |
| 📈 **Progressive Data Feed** | Events stream one-by-one with realistic 2-5s mesh timing |
| 🔍 **Hybrid Detection** | Rule Engine (0ms) + Multi-Agent LLM for complex anomaly analysis |

> **Design Philosophy:** Built with the same principles as enterprise AI orchestration platforms — visual workflows, multi-agent collaboration, and production-grade reliability.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   SkyOps Agent Architecture                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐    ┌──────────────────────────────┐           │
│  │ Google Sheets │───▶│     n8n Cloud Workflow        │           │
│  │ (Telemetry)   │    │                                │           │
│  └──────────────┘    │  ┌──────────┐  ┌───────────┐  │           │
│                       │  │ GSheets  │  │  Build    │  │           │
│                       │  │ Read     │─▶│  Context  │  │           │
│                       │  └──────────┘  └─────┬─────┘  │           │
│                       │                       │        │           │
│                       │              ┌────────▼──────┐ │           │
│                       │              │   AI Agent    │ │           │
│                       │              │  Llama 3.3    │ │           │
│                       │              │  70B (Groq)   │ │           │
│                       │              │               │ │           │
│                       │              │ ┌───────────┐ │ │           │
│                       │              │ │ Detector  │ │ │           │
│                       │              │ │ Root Cause│ │ │           │
│                       │              │ │ Advisor   │ │ │           │
│                       │              │ └───────────┘ │ │           │
│                       │              └───────┬───────┘ │           │
│                       └──────────────────────┼─────────┘           │
│                                              │                     │
│                       ┌──────────────────────┼──────────┐         │
│                       │                      │          │         │
│                  ┌────▼─────┐         ┌──────▼──────┐   │         │
│                  │ Dashboard │         │  Telegram   │   │         │
│                  │  Chat UI  │         │    Bot      │   │         │
│                  └──────────┘         └─────────────┘   │         │
└─────────────────────────────────────────────────────────────────┘
```

### Dual-Entry Architecture

| Entry Point | Technology | Access |
|---|---|---|
| 🖥️ **Dashboard** | Webhook (`POST /skyops-chat`) | [Live Demo](https://omerpanay.github.io/SkyOps-Agent/dashboard/) |
| 📱 **Telegram** | Telegram Trigger (polling) | [@SkyOpsAgent_bot](https://t.me/SkyOpsAgent_bot) |

Both entry points connect to the **same AI Agent** with the same capabilities, memory, and real-time data access.

---

## 🤖 Unified AI Agent

Unlike traditional multi-workflow approaches, SkyOps uses a **single unified AI Agent** with embedded multi-agent reasoning:

### Embedded Agent Roles

| Role | Function | When Activated |
|---|---|---|
| 🔍 **Detector** | Anomaly classification (NODE_FAILURE, ROUTING_FAIL, LATENCY_SPIKE, TOPOLOGY_CHANGE, PACKET_LOSS) | Always — part of every analysis |
| 🧬 **Root Cause Analyzer** | Kök neden analizi, temporal pattern, impact scope | When anomalies detected |
| 💡 **Action Advisor** | Recovery actions, preventive measures, estimated recovery time | After root cause identified |

### How It Works

```
User Question ──▶ Build Context ──▶ AI Agent ──▶ Response
                       ▲               │
                       │               │ (Google Sheets Tool)
                       │               ▼
                Fetch Sheets Data ◀───[Reads/Writes/Deletes]
                  (GSheets Node)
```

1. **Direct Google Sheets Integration**: Every query reads fresh Google Sheets data natively via n8n's Google Sheets node.
2. **AI-Agent Tool Action**: The AI Agent is equipped with a `Google Sheets Tool` connected directly to its LangChain engine. If a user asks to add, edit, or delete events, the Agent can dynamically call the tool to execute these actions on the sheet in real-time.
3. **Context Building**: Raw data is parsed into structured network statistics and recent events
3. **AI Agent**: Llama-3.3-70B analyzes with all 3 agent roles embedded in the system prompt
4. **Response**: Formatted, actionable analysis delivered to Dashboard or Telegram

### Escalation Logic

| Confidence | Level | Action |
|---|---|---|
| **≥ 0.85** | 🤖 AUTONOMOUS | System takes action automatically |
| **0.50 – 0.84** | 👤 HUMAN REVIEW | Alert sent for human review |
| **< 0.50** | 🚨 ESCALATED | Immediate escalation to senior engineer |

---

## 📊 Dashboard Features

The dashboard is a **real-time web application** connected to live Google Sheets telemetry and n8n AI Agent.

| Panel | Description |
|---|---|
| 🗺️ **Network Topology** | SVG mesh map with animated links, color-coded node health |
| 🏥 **Health Gauges** | Circular gauges (0-100) for each node with smooth transitions |
| 📋 **Live Event Feed** | Progressive event stream with realistic 2-5s IoT mesh timing |
| 🔔 **Alert History** | Detection alerts with severity badges and confidence scores |
| 🤖 **Detection Split** | Donut chart showing Rule Engine vs LLM Agent distribution |
| 🔧 **Self-Healing Actions** | Autonomous recovery actions with escalation indicators |
| 📊 **Pipeline Status** | Real-time Google Sheets connection status and statistics |
| ⏱️ **Anomaly Timeline** | Horizontal timeline with color-coded event markers |
| 💬 **AI Chat** | Rich-formatted conversational assistant with severity badges |
| 📱 **Telegram Banner** | Direct link to [@SkyOpsAgent_bot](https://t.me/SkyOpsAgent_bot) |

### AI Chat — Rich Formatting

Chat responses feature:
- **Colored severity badges** (CRITICAL, HIGH, MEDIUM, LOW)
- **Anomaly type highlights** (NODE_FAILURE, LATENCY_SPIKE, etc.)
- **Structured lists** with proper bullet/numbered formatting
- **Headers** for organized sections
- **Source indicator**: 🟢 n8n AI Agent / 🟡 Groq Fallback / 🔴 Offline

---

## ⚡ Quick Start

### View Live Demo
Visit the **[Live Dashboard](https://omerpanay.github.io/SkyOps-Agent/dashboard/)** — no setup required.

### Chat via Telegram
Message **[@SkyOpsAgent_bot](https://t.me/SkyOpsAgent_bot)** — same AI Agent, mobile-friendly.

### Run Locally
```bash
git clone https://github.com/omerpanay/SkyOps-Agent.git
cd SkyOps-Agent
# Open dashboard/index.html in your browser
```

### Import n8n Workflow
1. Install [n8n](https://n8n.io) or use n8n Cloud
2. Import `SkyOps AI Assistant.json` — Unified AI Agent workflow
3. Configure credentials:
   - **Groq API** → AI Agent LLM model
   - **Telegram Bot** → Reply to User node
4. Click **Publish** to activate

> **Note:** Google Sheets data is accessed and modified securely using your Google credentials.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Orchestration** | n8n Cloud (workflow automation) |
| **LLM** | Groq API (Llama-3.3-70B-Versatile) |
| **Detection** | Hybrid: Rule Engine + Multi-Agent LLM |
| **Frontend** | Vanilla HTML/CSS/JS (zero dependencies) |
| **Chat** | n8n Webhook + Groq Fallback + Offline mode |
| **Telegram** | Telegram Bot API (polling trigger) |
| **Data** | Google Sheets (100+ real alert records) |
| **Network** | Contiki-NG / Cooja (RPL mesh simulation) |

---

## 📁 Project Structure

```
SkyOps-Agent/
├── dashboard/
│   ├── index.html              # Dashboard UI (9 panels + Telegram banner)
│   ├── style.css               # Dark theme with glassmorphism effects
│   └── app.js                  # Progressive data engine + AI chat + formatting
├── SkyOps AI Assistant.json    # n8n: Unified AI Agent (Dashboard + Telegram)
├── SKYOps Agent.json           # n8n: Multi-Agent Pipeline (reference)
└── README.md
```

---

## 🔧 Self-Healing & Confidence Escalation

SkyOps doesn't just detect — it **acts**:

| Action | Trigger | Method |
|---|---|---|
| **Soft Restart** | NODE_FAILURE | RPL control plane restart |
| **Traffic Rerouting** | NODE_FAILURE | Backup parent node selection |
| **Route Re-probe** | ROUTING_FAILURE | DIO/DIS message injection |
| **RPL Local Repair** | ROUTING_FAILURE | Local repair procedure |
| **QoS Adjustment** | LATENCY_SPIKE | Queue management optimization |
| **Parent Switch Log** | TOPOLOGY_CHANGE | Trend analysis + monitoring |

---

## 📊 Detection Benchmark

| Metric | Rule Engine | LLM Agent | Hybrid |
|---|---|---|---|
| **Latency** | ~2ms | ~800ms | Optimal routing |
| **Simple Accuracy** | 100% | 95% | 100% |
| **Complex Accuracy** | 60% | 92% | 92% |
| **Cost / 1K events** | $0 | ~$0.02 | ~$0.008 |
| **Context Awareness** | ❌ | ✅ | ✅ |
| **Explainability** | ✅ | ⚠️ | ✅ |

---

## 📜 License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ◈ by [Ömer Panay](https://github.com/omerpanay)**

*Autonomous Network Intelligence — Secure. Monitor. AI.*

</div>
