# 🧭 Worldview Compass

> **"A Map, Not a Verdict"** — An analytical measurement instrument and spatial exploration engine designed to map human philosophical intuitions across a continuous 25-dimensional coordinate space.

---

## 🚀 Quickstart: Running on Streamlit

### Option 1: Run Locally via Streamlit

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/worldview-compass.git
   cd worldview-compass
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Launch the Streamlit app:**
   ```bash
   streamlit run streamlit_app.py
   ```
   Open `http://localhost:8501` in your browser.

---

### Option 2: Deploy to Streamlit Community Cloud (Free)

1. Push this repository to **GitHub**.
2. Visit [share.streamlit.io](https://share.streamlit.io/) and log in with your GitHub account.
3. Click **"New app"** and select:
   * **Repository:** `your-username/worldview-compass`
   * **Branch:** `main`
   * **Main file path:** `streamlit_app.py`
4. Click **Deploy!** 
   *(The app will automatically detect `.streamlit/config.toml` for the custom dark gold theme).*

---

## 💻 Alternative: Running via Standalone Python Server (Zero Dependencies)

If you don't have Streamlit installed, you can run the app directly using standard Python 3.10+:

```bash
python worldview_app.py
```
Open `http://localhost:8080` in any browser.

---

## 📁 Repository Structure

```
worldview-compass/
├── streamlit_app.py           # Streamlit application entrypoint
├── requirements.txt           # Python dependencies (streamlit, plotly)
├── worldview_brain.py         # Pure mathematical scoring engine (stateless core)
├── worldview_api.py           # Stateless REST API gateway & contract firewall
├── worldview_app.py           # Standalone Python web server & CLI runner
├── worldview_app.tsx          # Production React/TypeScript presentation shell
├── worldview_data.json        # Canonical Knowledge Base (25D, 25C, 250W)
├── question_data.json         # Master Assessment Instrument (The 750 Model)
├── validate_system.py         # Automated Level 1–4 release engineering gate
└── .streamlit/
    └── config.toml            # Deep space dark slate theme configuration
```

---

## 🛡️ System Verification Gate

To execute the automated release engineering suite across all layers:
```bash
python validate_system.py
```
*Executes 46 automated checks verifying syntax, referential integrity, spatial metrics, and layer isolation with a 100% pass guarantee.*
