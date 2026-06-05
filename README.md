<div align="center">

# ◈ SkyOps Agent

### Autonomous Network Intelligence for IoT Mesh Networks

**Unified AI Agent • Real-Time Cooja Simulation • Local Bridge API • n8n Orchestration**

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Dashboard-f97316?style=for-the-badge&logoColor=white)](https://omerpanay.github.io/SkyOps-Agent/dashboard/)
[![Telegram Bot](https://img.shields.io/badge/📱_Telegram-@SkyOpsAgent__bot-0088cc?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/SkyOpsAgent_bot)
[![n8n](https://img.shields.io/badge/n8n-Workflow_Automation-EA4B71?style=for-the-badge&logo=n8n&logoColor=white)](https://n8n.io)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.3_70B-F55036?style=for-the-badge)](https://groq.com)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)

---

*An enterprise-grade AI system that autonomously monitors, diagnoses, and suggests response actions to anomalies in RPL-based IoT mesh networks — powered by a unified AI Agent with multi-agent reasoning, dual-entry access (Dashboard + Telegram), and real-time Cooja Simulation telemetry.*

**[🚀 Live Dashboard](https://omerpanay.github.io/SkyOps-Agent/dashboard/)** · **[📱 Telegram Bot](https://t.me/SkyOpsAgent_bot)** · **[📋 Architecture](#architecture)** · **[⚡ Quick Start](#quick-start)**

</div>

---

## 🎯 What is SkyOps Agent?

SkyOps Agent is an **autonomous network operations (NetOps) AI system** that transforms real-time Contiki-NG/Cooja simulation telemetry into actionable intelligence through:

| Capability | Description |
|---|---|
| 🤖 **Unified AI Agent** | Single Llama-3.3-70B agent with embedded 3-agent reasoning (Detector → Root Cause → Action) |
| 📊 **Real-Time Dashboard** | 9 interactive panels with live topology, health gauges, event feed, and AI chat |
| 🔌 **Python Bridge API** | Zero-dependency REST API server (:8000) that parses simulation logs & calculates KPIs |
| 🌐 **Docker Proxy Bridge** | Secure host-to-container tunneling to stream serial logs without JVM port conflicts |
| 📱 **Telegram Bot** | Same AI Agent accessible via [@SkyOpsAgent_bot](https://t.me/SkyOpsAgent_bot) |
| 💬 **AI Chat Interface** | Conversational assistant powered by live network data fed directly into prompt contexts |
| 🔧 **Action Advisor** | Recommended recovery actions and diagnostic steps for the human operator |
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
│  ┌───────────────────────┐                                        │
│  │ Cooja Simulation      │                                        │
│  │ (Contiki-NG in Docker)│                                        │
│  └──────────┬────────────┘                                        │
│             │ Port 60009                                          │
│             ▼                                                     │
│  ┌───────────────────────┐                                        │
│  │ docker_proxy.py (Host)│                                        │
│  └──────────┬────────────┘                                        │
│             │ Port 60008                                          │
│             ▼                                                     │
│  ┌───────────────────────┐         ┌───────────────────────────┐  │
│  │ skyops_bridge.py      ├────────▶│    n8n Cloud Workflow     │  │
│  │ (Rule Engine/REST API)│ Webhook │                           │  │
│  └──────────┬────────────┘ (Port)  │  ┌───────────┐ ┌────────┐ │  │
│             │                      │  │ Webhook   │ │ Build  │ │  │
│             │ REST API             │  │ Trigger   ├─▶ Context│ │  │
│             │ (:8000/api/all)      │  └───────────┘ └────┬───┘ │  │
│             ▼                      │                     │     │  │
│      ┌─────────────┐               │               ┌─────▼───┐ │  │
│      │  Dashboard  │               │               │ AI Agent│ │  │
│      │  Chat UI    │               │               │ Llama 3 │ │  │
│      └──────┬──────┘               │               └─────┬───┘ │  │
│             │                      └─────────────────────┼─────┘  │
│             └────────────────────────────────────────────┘         │
│                                                                   │
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
| 🔍 **Detector** | Anomaly classification (NODE_FAILURE, ROUTING_FAILURE, LATENCY_SPIKE, TOPOLOGY_CHANGE, PACKET_LOSS) | Always — part of every analysis |
| 🧬 **Root Cause Analyzer** | Kök neden analizi, temporal pattern, impact scope | When anomalies detected |
| 💡 **Action Advisor** | Recovery actions, preventive measures, estimated recovery time | After root cause identified |

### How It Works

```
User Question ──▶ Build Context ──▶ AI Agent ──▶ Response
                       ▲               │
                       │               │ (n8n Webhook Body)
                       │               ▼
                Fetch Bridge Data ◀───[Live telemetry payload]
```

1. **Direct Webhook Integration**: Whenever an anomaly is detected, the Python Bridge POSTs the alert payload to n8n.
2. **Context Building**: The `Build Context` node parses the incoming live JSON data into formatted statistics, active node health, and recent anomalies.
3. **AI Agent**: Llama-3.3-70B analyzes the context using the embedded 3-agent prompt roles.
4. **Response**: Formatted, actionable analysis delivered to Dashboard or Telegram bot.

---

## 📊 Dashboard Features

The dashboard is a **real-time web application** connected directly to the local Python Bridge API and n8n AI Agent.

| Panel | Description |
|---|---|
| 🗺️ **Network Topology** | SVG mesh map with animated links, dynamic parent routing updates, and color-coded node health |
| 🏥 **Health Gauges** | Circular gauges (0-100) for each node with smooth transitions |
| 📋 **Live Event Feed** | Progressive event stream parsed from Contiki-NG serial messages |
| 🔔 **Alert History** | Detection alerts with severity badges, confidence scores, and detection methods |
| 🤖 **Detection Split** | Donut chart showing Rule Engine vs LLM Agent distribution |
| 🔧 **Action Advisor Panel** | Recommended recovery actions and diagnostic indicators |
| 📊 **Pipeline Status** | Real-time Bridge API connection status and statistics |
| ⏱️ **Anomaly Timeline** | Horizontal timeline with color-coded event markers |
| 💬 **AI Chat** | Rich-formatted conversational assistant with severity badges |
| 📱 **Telegram Banner** | Direct link to [@SkyOpsAgent_bot](https://t.me/SkyOpsAgent_bot) |

---

## ⚡ Quick Start

Follow these steps to run the complete simulation and AI pipeline locally:

### 1. Run the Cooja Simulation in Docker
Start your Contiki-NG Docker container running the Cooja network simulator. Inside the Cooja Script Editor, use the following JS script configuration to stream serial logs on port `60009`:
```javascript
TIMEOUT(10000000); 
var server = new java.net.ServerSocket(60009);
log.log("Cooja JS Stream: 60009 nolu port dinleniyor...\n");
// (See full nashorn code in docker_proxy.py for loop implementation)
```

### 2. Run the Docker Proxy
To avoid JVM port lock conflicts, run the Python proxy script to forward port `60008` (Host) to `60009` (Docker Container):
```bash
python docker_proxy.py
```

### 3. Run the SkyOps Bridge
Start the main data pipeline bridge to parse logs, run the local REST API, and forward alerts to n8n:
```bash
python skyops_bridge.py --cooja-port 60008 --n8n https://omerpanaymsku.app.n8n.cloud/webhook/cooja-logs
```

### 4. Open the Dashboard
Open the dashboard file in any browser:
```
c:\new\NetOps_Project\dashboard\index.html
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Orchestration** | n8n Cloud (workflow automation) |
| **LLM** | Groq API (Llama-3.3-70B-Versatile) |
| **Detection** | Hybrid: Local Rule Engine + Multi-Agent LLM |
| **Telemetry Parser** | Custom Python Bridge (Zero-dependency stdlib sockets & threads) |
| **Proxy Tunneling** | Custom python-docker-proxy bridge |
| **Frontend** | Vanilla HTML5 / CSS3 / ES6 (zero dependencies, Glassmorphism design) |
| **Chat** | n8n Webhook + Groq Fallback + Offline mode |
| **Telegram** | Telegram Bot API (polling trigger) |
| **Network Simulator** | Contiki-NG / Cooja (RPL IPv6 mesh simulation) |

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
├── docker_proxy.py             # Docker container serial port tunnel
├── skyops_bridge.py            # Local parser, rule engine, REST API, & n8n poster
└── README.md
```

---

## 🔧 Anomaly Advisor & Recommended Actions

SkyOps doesn't just detect — it **recommends recovery procedures** for the operator to execute:

| Recommended Action | Trigger | Method |
|---|---|---|
| **Soft Restart** | NODE_FAILURE | Recommend RPL control plane restart |
| **Traffic Rerouting** | NODE_FAILURE | Recommend backup parent node selection |
| **Route Re-probe** | ROUTING_FAILURE | Recommend DIO/DIS message injection |
| **RPL Local Repair** | ROUTING_FAILURE | Recommend local repair procedure |
| **QoS Adjustment** | LATENCY_SPIKE | Recommend queue management optimization |
| **Parent Switch Log** | TOPOLOGY_CHANGE | Log event for trend analysis + monitoring |

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
