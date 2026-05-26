# 📡 SkyOps AI Automation — Proje Devir ve Handover Context'i

> **Bu doküman, yeni bir sohbete geçerken başka bir AI Assistant veya sizin kaldığınız yerden projeye %100 hakim şekilde devam edebilmesi için hazırlanmıştır.**
>
> Projenin tüm detaylarını, mimarisini, yapılan değişiklikleri ve sıradaki kritik adımları içerir.

---

## 🎯 Proje Vizyonu ve Hedefi
Projenin amacı, bir IoT RPL mesh ağını (normalde Contiki-NG/Cooja ile simüle edilen) **gerçek zamanlı verilerle, %100 n8n tabanlı bir yapay zeka sistemine bağlamak** ve kurumsal kalitede bir web dashboard üzerinden yönetmektir.
*   **Canlı Demo:** `https://omerpanay.github.io/SkyOps-Agent/dashboard/`
*   **Entegrasyon Parametreleri:** Web dashboard'a URL hash üzerinden Groq API Key ve n8n Webhook URL'i beslenebilir:
    `index.html#key=GROQ_KEY&n8n=N8N_WEBHOOK_URL`
*   **Entegre Sistemler:** `Google Sheets` (Ana Veri Deposu), `n8n Cloud` (Orkestrasyon & Multi-Agent), `Groq Llama 3.3` (LLM Engine) ve `Telegram` (Notification).

---

## 🏗️ Genel Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────────┐
│                    KULLANICI (Tarayıcı)                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │          SkyOps Dashboard (GitHub Pages)              │  │
│  │  ┌─────────────┐  ┌──────────┐  ┌──────────────┐    │  │
│  │  │ Topology    │  │ Health   │  │ Event Feed   │    │  │
│  │  │ (SVG)       │  │ Gauges   │  │ (Sheets)     │    │  │
│  │  ├─────────────┤  ├──────────┤  ├──────────────┤    │  │
│  │  │ Alert       │  │ Self-    │  │ Detection    │    │  │
│  │  │ History     │  │ Healing  │  │ Methods      │    │  │
│  │  ├─────────────┤  ├──────────┤  ├──────────────┤    │  │
│  │  │ Timeline    │  │ Pipeline │  │ Architecture │    │  │
│  │  │ (Sheets)    │  │ Data     │  │ Diagram      │    │  │
│  │  └─────────────┘  └──────────┘  └──────────────┘    │  │
│  │                                                       │  │
│  │  ┌───────────────────────────────────────────────┐    │  │
│  │  │  AI Chat Panel (sağ alt popup, 420x580px)     │    │  │
│  │  │  1. n8n Webhook → 2. Groq API → 3. Lokal     │    │  │
│  │  └───────────────────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
    ┌──────────────┐ ┌────────────┐ ┌──────────────┐
    │ Google Sheets │ │ n8n Cloud  │ │ Groq API     │
    │ (Veri deposu) │ │ (Orkestra) │ │ (LLM Engine) │
    │              │ │            │ │ llama-3.3-70b│
    │ SkyOps Alert │ │ Workflows: │ │              │
    │  (100+ satır)│ │ - AI Asst  │ └──────────────┘
    │ Summaries    │ │ - Demo Rep │
    │  (günlük)    │ │ - Hourly   │
    └──────────────┘ └─────┬──────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Telegram    │
                    │  (Bildirim)  │
                    └──────────────┘
```

---

## 📂 Dosya ve Klasör Yapısı

Platform dosyaları lokalde `c:\new\NetOps_Project` dizinindedir:

```
c:\new\NetOps_Project\
├── dashboard/
│   ├── index.html            # Ana HTML (Tüm Dashboard arayüzü ve AI Chat popup yerleşimi)
│   ├── app.js                # Arayüz ve entegrasyon lojiği (Google Sheets parser + Chat client)
│   └── style.css             # Gelişmiş CSS (Glassmorphism, dark mode ve animasyonlar)
├── SKYOps Agent.json         # n8n: Ana karar mekanizması (3 Uzman AI Agent)
├── SkyOps AI Assistant.json   # n8n: Dashboard Chat entegrasyon webhook'u
├── SkyOps Demo Replay.json   # n8n: Google Sheets'e periyodik gerçekçi anomali yazan workflow
├── SkyOps Hourly Report.json # n8n: Günlük özet ve Telegram rapor workflow'u
├── README.md                 # Proje genel dokümantasyonu
└── pyproject.toml / uv.lock  # Python sanal ortam bağımlılıkları (geliştirici araçları için)
```

---

## 📊 Google Sheets Veri Şeması

Tüm dashboard verileri, n8n tarafından yazılan ve dashboard tarafından okunan tek bir Google E-Tablo'dan beslenmektedir.

*   **Google Sheet ID:** `178rQWaShDZzy5ZdQwhwZeCfNkWFyCSEAx9IWkpWYRaA`
*   **Erişim Tipi:** Public Read-Only (Dashboard API anahtarsız `gviz/tq` ile okur).

### 1. `SkyOps Alert` Sayfası (Canlı Loglar & Anomaliler)
| Sütun | Veri Tipi | Açıklama | Örnek Veri |
|---|---|---|---|
| **Timestamp** | Date/Time | Olayın gerçekleştiği zaman damgası | `2026-05-26 05:32:15` |
| **Node** | String | Etkilenen IoT Node kimliği | `Node #3` |
| **Severity** | String | Tehlike derecesi | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| **Anomaly** | String | Tespit edilen ağ anomalisi | `NODE_FAILURE`, `ROUTING_FAIL`, `LATENCY_SPIKE`, `NORMAL` |
| **Confidence** | Float | Tespit doğruluğu güven skoru | `0.94` |
| **Escalation** | String | Aksiyon yetki seviyesi | `AUTONOMOUS`, `HUMAN_REVIEW`, `ESCALATED` |
| **Healing Action**| String | AI tarafından tetiklenen iyileştirme | `Re-routed via Parent Switch`, `Soft Restart Node` |

### 2. `Summaries` Sayfası (Günlük İstatistikler)
Dashboard'un KPI analizlerinde ve AI Assistant'ın geçmişe dönük raporlamalarında kullanılır. `SkyOps Hourly Report` workflow'u tarafından günlük olarak beslenir.

---

## 🛠️ Dashboard app.js — Teknik Değişiklikler ve Son Durum

Son geliştirme aşamasında **bütün hardcoded 18 adımlık demo simülasyonu (SCENARIO) kaldırılmıştır.** Sistem artık %100 gerçek zamanlı olarak Google Sheets loglarından beslenir.

### 1. Google Sheets Entegrasyonu (`initPipelinePanel()`)
*   `fetchPipelineData()` fonksiyonu Google Sheets public endpoint'inden verileri JSON olarak çeker (Her 2 dakikada bir otomatik yenilenir).
*   Çekilen ham veriler şu alt fonksiyonlara dağıtılarak tüm ekranı dinamik günceller:
    *   `renderSheetsToEventFeed(alerts)`: Canlı olay akışını doldurur.
    *   `renderSheetsToAlertHistory(alerts)`: Anomali geçmişi kartını besler.
    *   `renderSheetsToNodeHealth(alerts)`: Son olaylara bakarak 5 Node'un anlık sağlık puanlarını (100 üzerinden) hesaplar ve SVG Topology ekranındaki bağlantı çizgilerini dinamik renklendirir.
    *   `renderSheetsToSelfHealing(alerts)`: Autonomous ve Human Review kararlarını listeler.
    *   `renderSheetsToKPIs(alerts)`: Üst bar istatistiklerini (Total Events, Active Alerts vb.) hesaplar.
    *   `renderTimeline(alerts)`: Alt kısımdaki anomali zaman çizelgesini gerçek zaman damgalarıyla baştan çizer.

### 2. Akıllı Chat Widget (Popup)
*   **Görsel Düzenleme:** Sağ alttaki chat butonu (FAB), **kullanıcıyı yönlendirici büyük bir hap (pill) tasarıma** kavuşmuştur: `🤖 AI Assistant` yazısı eklenmiş ve dikkat çekici bir anomali-nabız animasyonu entegre edilmiştir.
*   **Panel Boyutu:** Chat paneli tam ekran veya aşırı geniş sidebar yerine, masaüstünde son derece estetik ve profesyonel bir **yüzen popup (420px genişlik, 580px yükseklik)** haline getirilmiştir.
*   **3 Katmanlı Güvenli Fallback Mekanizması:**
    1.  **Öncelikli (n8n AI Agent):** Eğer hash parametresi ile bir n8n Webhook adresi (`#n8n=...`) belirtilmişse, chat tüm mesajları doğrudan n8n sunucusuna POST eder. Bu sayede n8n'deki gelişmiş AI Agent tüm veriye ve geçmişe hakim olarak yanıt döner.
    2.  **İkincil Fallback (Direkt Groq API):** n8n webhook tanımlı değilse veya çevrimdışıysa, tarayıcı kullanıcının Groq API Key'ini (`#key=gsk_...`) kullanarak doğrudan Groq API'sine bağlanır. Dashboard o anki canlı Sheet verilerini ve Node durumlarını derleyerek prompt'a otomatik **Sistem Context'i** olarak ekler.
    3.  **Lokal Fallback (Offline Analiz):** İnternet veya API hatası durumunda `generateResponse()` fonksiyonu devreye girer. Tarayıcı belleğindeki anlık node skorlarını ve anomali oranlarını analiz ederek tamamen lokalde akıllı Türkçe yanıtlar üretir.

---

## 🔌 n8n Workflow Şemaları & Detayları

Lokal dizindeki `.json` dosyalarını yeni açılacak n8n platformunda "Import from File" seçeneğiyle doğrudan yükleyebilirsiniz.

### 1. `SkyOps AI Assistant.json` (Dashboard Asistanı)
*   **Giriş:** Webhook Node (POST `/webhook/skyops-chat`)
*   **Orta Node (Build Context):** Gelen dashboard canlı state'ini JSON'dan ayıklar ve string bir context haline getirir.
*   **Çıkış:** HTTP Request Node (Groq LLM). Groq API'sine `llama-3.3-70b-versatile` modeliyle istek gönderir.
*   **Geliştirme Önerisi:** Bu workflow içerisine bir *Google Sheets Tool* ve *Window Buffer Memory* eklenerek asistanın gerçek zamanlı bir Agent'a dönüştürülmesi planlanmaktadır.

### 2. `SkyOps Demo Replay.json` (Veri Üretici)
*   **Giriş:** Cron/Interval (Örnek: Her 10 dakikada bir)
*   **Lojik:** Belirli olasılıklarla `NODE_FAILURE`, `ROUTING_FAIL` gibi yapay anomaliler veya `NORMAL` loglar üreterek Google Sheets'in `SkyOps Alert` tablosuna ekler.
*   **Önemli Not:** n8n ücretsiz hesap limitlerini (execution sayısı) tüketmemek adına bu workflow'un interval süresi uzun tutulmalı veya test edilip durdurulmalıdır.

### 3. `SkyOps Hourly Report.json` (Analiz Raporlayıcı)
*   **Giriş:** Günlük tetikleyici.
*   **Akış:** Günlük logları çeker, anomalileri gruplar ve özet istatistik çıkarıp Google Sheets `Summaries` tablosuna yazar. İsteğe bağlı olarak Telegram entegrasyonu ile yöneticilere bildirim atar.

---

## 🎯 Yeni Sohbette Atılacak İlk Adımlar (TODO List)

Yeni bir oturuma başladığınızda projenin tamamlanması için aşağıdaki adımları sırayla izleyin:

- [ ] **n8n Webhook Kurulumu:**
  - Yeni n8n Cloud hesabına giriş yapın.
  - `SkyOps AI Assistant.json` workflow dosyasını import edin.
  - Groq API Key'i n8n üzerinde Header Authentication olarak tanımlayın (key localStorage'da veya URL hash'te).
  - Workflow'u **Active** hale getirip **Production Webhook URL**'ini kopyalayın.

- [ ] **Dashboard'a Webhook URL Tanımlama:**
  - Kopyalanan webhook URL'ini kopyalayıp tarayıcıda demo linkine ekleyin:
    `https://omerpanay.github.io/SkyOps-Agent/dashboard/#key=YOUR_GROQ_KEY&n8n=YOUR_N8N_WEBHOOK_URL`
  - Bu sayede tarayıcı otomatik olarak n8n webhook'unuzu hafızaya alacak ve chat mesajlarını n8n üzerinden yönetecektir.

- [ ] **AI Agent Yeteneklerini Artırma:**
  - n8n'deki chat workflow'unu geliştirin. Sadece doğrudan LLM çağrısı yerine, bir *AI Agent* yapısı kurun.
  - Agent'a **Google Sheets okuma ve yazma tool'u** verin. Böylece kullanıcı chat'ten *"Son 1 saatteki anomali trendini Sheets'ten analiz et"* dediğinde, Agent doğrudan veriyi kendisi sorgulayabilecektir.
  - Agent'a **Memory** ekleyerek konuşma akışını hatırlamasını sağlayın.

- [ ] **Demo Data Generator Çalıştırılması:**
  - `SkyOps Demo Replay.json` workflow'unu yeni n8n'e yükleyin ve Sheets'e düzenli veri yazması için aktif edin. Dashboard'daki tüm panellerin dinamik akışını izleyin.
