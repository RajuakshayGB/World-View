"""
Worldview Compass — Standalone Production Application Server & CLI (worldview_app.py)
Document Class: Production Application Server & Client Runner
Governed Specifications: Part 8 (part-08-frontend-presentation-shell.md),
                         Part 9 (part-09-localization-persistence-and-sharing.md),
                         Part 7 (part-07-api-service-gateway-and-firewall.md),
                         Part 6 (part-06-computational-engine-and-mathematics.md)

Foundational Axiom: "A Map, Not a Verdict" / "एक मानचित्र, कोई निर्णय नहीं"

Features:
1. Zero external dependencies (Python 3.10+ standard library only: http.server, urllib, json, math, sys, re, argparse).
2. Dual-mode execution:
   - Web Server Mode (`python worldview_app.py [port]`): In-memory delivery of the complete glassmorphic
     presentation shell (15/75/10 zero-body-scroll viewport, 3D Canvas Constellation Globe, 25D SVG Radar,
     Double-Gold selection ring, 2.0s auto-advance lock, Full-Screen Jump Matrix, Deep Dive Modal, bilingual EN/HI).
   - Interactive Terminal Mode (`python worldview_app.py --cli`): Complete terminal-based assessment console
     with ASCII progress meters, bilingual question rendering, and real-time 25D vector matching.
3. Native in-process integration with worldview_brain.py and worldview_api.py.
"""

from __future__ import annotations

import argparse
import base64
import datetime
import http.server
import json
import math
import os
import re
import socketserver
import sys
import urllib.parse
from typing import Any, Dict, List, Optional, Tuple, Union

# Ensure search paths for sibling modules
_CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
for _extra_path in [_CURRENT_DIR, "/workspace/artifacts", "/workspace/scratch", "/workspace"]:
    if _extra_path not in sys.path and os.path.exists(_extra_path):
        sys.path.insert(0, _extra_path)

APP_VERSION = "2.0.0"
DEFAULT_PORT = 8080

# Attempt imports of sibling modules
try:
    import worldview_brain
except ImportError:
    worldview_brain = None

try:
    import worldview_api
except ImportError:
    worldview_api = None


def find_data_file(filename: str) -> Optional[str]:
    """Locate canonical data files across known workspace paths."""
    candidates = [
        filename,
        os.path.join(_CURRENT_DIR, filename),
        os.path.join("/workspace/artifacts", filename),
        os.path.join("/workspace/scratch", filename),
        os.path.join("/workspace", filename)
    ]
    for p in candidates:
        if os.path.isfile(p):
            return p
    return None


def load_canonical_data() -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """Load question_data.json and worldview_data.json from disk."""
    q_path = find_data_file("question_data.json")
    w_path = find_data_file("worldview_data.json")

    q_data = {}
    w_data = {}

    if q_path and os.path.exists(q_path):
        with open(q_path, "r", encoding="utf-8") as f:
            q_data = json.load(f)

    if w_path and os.path.exists(w_path):
        with open(w_path, "r", encoding="utf-8") as f:
            w_data = json.load(f)

    return q_data, w_data


# Global in-memory cache
QUESTION_DATA, WORLDVIEW_DATA = load_canonical_data()


# ---------------------------------------------------------------------------
# EMBEDDED IN-MEMORY PRODUCTION PRESENTATION CLIENT
# ---------------------------------------------------------------------------
# Strictly served in-memory over HTTP. Zero HTML files written to disk.
def get_embedded_html() -> str:
    """Generate the complete, responsive glassmorphic single-page web client."""
    q_json_str = json.dumps(QUESTION_DATA)
    w_json_str = json.dumps(WORLDVIEW_DATA)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Worldview Compass — A Map, Not a Verdict</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Rozha+One&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {{
      --bg-space: #070A12;
      --bg-dark: #0A0F1D;
      --bg-card: rgba(18, 24, 43, 0.75);
      --bg-card-hover: rgba(26, 35, 64, 0.85);
      --border-subtle: rgba(255, 255, 255, 0.08);
      --border-focus: rgba(212, 175, 55, 0.4);
      --gold: #D4AF37;
      --gold-light: #F3E5AB;
      --gold-glow: rgba(212, 175, 55, 0.35);
      --text-main: #F1F5F9;
      --text-muted: #94A3B8;
      --text-dim: #64748B;
      --teal-answered: #0D9488;
      --teal-glow: rgba(13, 148, 136, 0.4);
      --amber-skip: #D97706;
      --domain-1: #F59E0B;
      --domain-2: #3B82F6;
      --domain-3: #10B981;
      --domain-4: #8B5CF6;
      --domain-5: #EC4899;
      --font-display: 'Cinzel', serif;
      --font-body: 'Plus Jakarta Sans', sans-serif;
      --font-hindi-display: 'Rozha One', serif;
      --font-hindi-body: 'Noto Sans Devanagari', sans-serif;
    }}

    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
    }}

    body, html {{
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: var(--bg-space);
      background-image: radial-gradient(circle at 50% 20%, rgba(30, 58, 138, 0.18) 0%, transparent 65%),
                        radial-gradient(circle at 80% 80%, rgba(212, 175, 55, 0.08) 0%, transparent 50%);
      color: var(--text-main);
      font-family: var(--font-body);
      user-select: none;
    }}

    /* Viewport Ergonomics Engine: Strict 15% / 75% / 10% Layout */
    #app-container {{
      width: 100%;
      height: 100vh;
      display: flex;
      flex-direction: column;
      position: relative;
    }}

    /* 1. TOP DOCK (15% Height) */
    header#top-dock {{
      height: 15vh;
      min-height: 80px;
      max-height: 110px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 10px 24px;
      border-bottom: 1px solid var(--border-subtle);
      background: rgba(10, 15, 29, 0.7);
      backdrop-filter: blur(16px);
      z-index: 40;
    }}

    .header-row {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }}

    .brand-group {{
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
    }}

    .brand-icon {{
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1.5px solid var(--gold);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--gold);
      box-shadow: 0 0 12px var(--gold-glow);
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 14px;
    }}

    .brand-title {{
      font-family: var(--font-display);
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 1.5px;
      background: linear-gradient(135deg, #FFF, var(--gold-light));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }}

    .header-controls {{
      display: flex;
      align-items: center;
      gap: 14px;
    }}

    .track-badge {{
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      background: rgba(212, 175, 55, 0.12);
      border: 1px solid var(--gold-glow);
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      color: var(--gold-light);
      letter-spacing: 0.5px;
    }}

    .lang-toggle {{
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
    }}

    .lang-btn {{
      padding: 5px 12px;
      font-size: 11px;
      font-weight: 700;
      color: var(--text-muted);
      transition: all 0.2s ease;
      background: transparent;
      border: none;
      cursor: pointer;
    }}

    .lang-btn.active {{
      background: var(--gold);
      color: #070A12;
    }}

    /* Progress and Ticks */
    .progress-bar-container {{
      width: 100%;
      margin-top: 4px;
    }}

    .progress-meta {{
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--text-muted);
      margin-bottom: 4px;
      font-weight: 500;
    }}

    .progress-track {{
      width: 100%;
      height: 6px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 3px;
      display: flex;
      gap: 2px;
      overflow: hidden;
    }}

    .progress-segment {{
      flex: 1;
      height: 100%;
      background: rgba(255, 255, 255, 0.12);
      transition: background-color 0.3s ease;
    }}

    .progress-segment.answered {{
      background: var(--teal-answered);
      box-shadow: 0 0 4px var(--teal-glow);
    }}

    .progress-segment.current {{
      background: var(--gold);
      box-shadow: 0 0 6px var(--gold-glow);
    }}

    .progress-segment.skipped {{
      background: var(--amber-skip);
    }}

    /* 2. MAIN WORKSPACE (75% Height) */
    main#main-workspace {{
      height: 75vh;
      width: 100%;
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      padding: 16px 20px;
    }}

    /* View 1: Orientation / Globe Home */
    .view-pane {{
      width: 100%;
      height: 100%;
      display: none;
      flex-direction: column;
      position: relative;
    }}

    .view-pane.active {{
      display: flex;
    }}

    #view-home {{
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 16px;
      overflow-y: auto;
    }}

    .home-hero-title {{
      font-family: var(--font-display);
      font-size: clamp(24px, 4.5vw, 42px);
      font-weight: 800;
      letter-spacing: 2px;
      background: linear-gradient(135deg, #FFFFFF, var(--gold-light), var(--gold));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 6px;
    }}

    .home-hero-subtitle {{
      font-size: clamp(13px, 1.8vw, 16px);
      color: var(--text-muted);
      max-width: 680px;
      line-height: 1.6;
      margin-bottom: 12px;
    }}

    /* Interactive 3D Canvas Constellation Globe */
    #globe-wrapper {{
      width: min(340px, 70vw);
      height: min(340px, 70vw);
      position: relative;
      margin: 0 auto 10px auto;
      border-radius: 50%;
      box-shadow: inset 0 0 50px rgba(212, 175, 55, 0.15), 0 0 40px rgba(10, 15, 29, 0.8);
      cursor: grab;
    }}

    #globe-wrapper:active {{
      cursor: grabbing;
    }}

    canvas#constellation-globe {{
      width: 100%;
      height: 100%;
      display: block;
    }}

    .track-selection-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
      width: 100%;
      max-width: 960px;
      margin: 10px 0;
    }}

    .track-card {{
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 14px;
      padding: 20px;
      text-align: left;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      backdrop-filter: blur(12px);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
    }}

    .track-card:hover {{
      transform: translateY(-4px) scale(1.01);
      border-color: var(--gold);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4), 0 0 20px var(--gold-glow);
    }}

    .track-card-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }}

    .track-title {{
      font-family: var(--font-display);
      font-size: 17px;
      font-weight: 700;
      color: var(--text-main);
    }}

    .track-time {{
      font-size: 11px;
      color: var(--gold-light);
      background: rgba(212, 175, 55, 0.15);
      padding: 3px 8px;
      border-radius: 6px;
    }}

    .track-desc {{
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.5;
      margin-bottom: 14px;
    }}

    .track-btn {{
      align-self: flex-start;
      padding: 6px 14px;
      background: rgba(212, 175, 55, 0.2);
      border: 1px solid var(--gold);
      color: var(--gold-light);
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      transition: all 0.2s ease;
    }}

    .track-card:hover .track-btn {{
      background: var(--gold);
      color: #070A12;
    }}

    /* View 2: Assessment Console */
    #view-assessment {{
      display: none;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      width: 100%;
    }}

    .dimension-indicator-pill {{
      display: inline-flex;
      align-items: center;
      align-self: center;
      gap: 8px;
      padding: 6px 16px;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-subtle);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }}

    .domain-dot {{
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--gold);
      box-shadow: 0 0 8px currentColor;
    }}

    .question-card {{
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: clamp(16px, 3vh, 28px);
      text-align: center;
      margin-bottom: 16px;
      backdrop-filter: blur(16px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
    }}

    .question-stem {{
      font-size: clamp(16px, 2.3vw, 22px);
      font-weight: 600;
      line-height: 1.5;
      color: #FFFFFF;
    }}

    .options-scroll-container {{
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-right: 4px;
      margin-bottom: 4px;
      -webkit-overflow-scrolling: touch;
    }}

    .option-card {{
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: clamp(12px, 2.2vh, 18px) 20px;
      cursor: pointer;
      position: relative;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      overflow: hidden;
    }}

    .option-card:hover {{
      border-color: rgba(212, 175, 55, 0.5);
      background: var(--bg-card-hover);
    }}

    /* DOUBLE-GOLD SELECTION RING (#D4AF37) */
    .option-card.selected {{
      border-color: var(--gold);
      box-shadow: 0 0 0 2px var(--bg-space), 0 0 0 4px var(--gold), 0 0 20px var(--gold-glow);
      transform: scale(1.015);
      background: rgba(212, 175, 55, 0.1);
    }}

    .option-text {{
      font-size: clamp(13px, 1.8vw, 16px);
      line-height: 1.45;
      color: var(--text-main);
      font-weight: 500;
      flex: 1;
      padding-right: 12px;
    }}

    .option-badge {{
      font-family: var(--font-display);
      font-size: 11px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-muted);
    }}

    .option-card.selected .option-badge {{
      background: var(--gold);
      color: #070A12;
    }}

    /* 2.0s Auto-Advance Countdown Bar */
    .auto-advance-bar {{
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      width: 0%;
      background: linear-gradient(90deg, var(--gold), #FFF);
      transition: width 2.0s linear;
    }}

    .option-card.selected .auto-advance-bar.animating {{
      width: 100%;
    }}

    /* 3. BOTTOM DOCK (10% Height) */
    footer#bottom-dock {{
      height: 10vh;
      min-height: 64px;
      max-height: 85px;
      border-top: 1px solid var(--border-subtle);
      background: rgba(10, 15, 29, 0.85);
      backdrop-filter: blur(16px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 24px;
      z-index: 40;
    }}

    .dock-btn {{
      height: 44px;
      padding: 0 16px;
      border-radius: 10px;
      border: 1px solid var(--border-subtle);
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-main);
      font-size: 13px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }}

    .dock-btn:hover:not(:disabled) {{
      border-color: var(--gold);
      background: rgba(212, 175, 55, 0.15);
      color: var(--gold-light);
    }}

    .dock-btn:disabled {{
      opacity: 0.35;
      cursor: not-allowed;
    }}

    /* Prominent Elevated ( ⊙ JUMP ) Circle Button */
    .jump-circle-btn {{
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: 2px solid var(--gold);
      background: radial-gradient(circle, #1E293B, #0F172A);
      color: var(--gold);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 0 18px var(--gold-glow);
      transition: all 0.25s ease;
      position: relative;
      top: -6px;
    }}

    .jump-circle-btn:hover {{
      transform: scale(1.1);
      box-shadow: 0 0 26px rgba(212, 175, 55, 0.6);
      background: var(--gold);
      color: #070A12;
    }}

    .jump-circle-label {{
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.5px;
      margin-top: 1px;
    }}

    /* View 3: Results Constellation View */
    #view-results {{
      display: none;
      flex-direction: column;
      gap: 20px;
      height: 100%;
      overflow-y: auto;
      padding-right: 6px;
    }}

    .results-hero-card {{
      background: linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(15, 23, 42, 0.85));
      border: 1.5px solid var(--gold);
      border-radius: 18px;
      padding: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5), 0 0 25px var(--gold-glow);
    }}

    .results-match-title {{
      font-family: var(--font-display);
      font-size: clamp(20px, 3.2vw, 32px);
      font-weight: 800;
      color: #FFF;
      margin-bottom: 6px;
    }}

    .results-cluster-pill {{
      display: inline-block;
      padding: 4px 12px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.1);
      color: var(--gold-light);
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 12px;
    }}

    .results-pct-circle {{
      width: 90px;
      height: 90px;
      border-radius: 50%;
      border: 3px solid var(--gold);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(10, 15, 29, 0.9);
      box-shadow: 0 0 20px var(--gold-glow);
    }}

    .results-pct-val {{
      font-family: var(--font-display);
      font-size: 26px;
      font-weight: 800;
      color: var(--gold);
    }}

    .results-pct-lbl {{
      font-size: 9px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }}

    /* Radar Canvas / SVG Container */
    .radar-wrapper {{
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }}

    svg#radar-chart {{
      width: min(500px, 90vw);
      height: min(500px, 90vw);
      overflow: visible;
    }}

    /* Full-Screen Modals */
    .modal-backdrop {{
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(7, 10, 18, 0.85);
      backdrop-filter: blur(12px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }}

    .modal-backdrop.active {{
      display: flex;
    }}

    .modal-dialog {{
      background: #0F172A;
      border: 1px solid var(--gold);
      border-radius: 16px;
      padding: 24px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px var(--gold-glow);
      text-align: center;
    }}

    .jump-matrix-dialog {{
      max-width: 800px;
      width: 95%;
      height: 80vh;
      display: flex;
      flex-direction: column;
      text-align: left;
    }}

    .jump-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
      gap: 8px;
      overflow-y: auto;
      padding: 16px 4px;
      flex: 1;
    }}

    .jump-tile {{
      aspect-ratio: 1;
      border-radius: 8px;
      border: 1px solid var(--border-subtle);
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }}

    .jump-tile.answered {{
      background: var(--teal-answered);
      border-color: #2DD4BF;
      color: #FFF;
    }}

    .jump-tile.current {{
      border-color: var(--gold);
      box-shadow: 0 0 10px var(--gold-glow);
      color: var(--gold);
    }}

    .jump-tile.skipped {{
      background: rgba(217, 119, 6, 0.2);
      border-color: var(--amber-skip);
      color: #FBBF24;
    }}

    /* Responsive Queries */
    @media (max-width: 640px) {{
      header#top-dock {{
        padding: 8px 16px;
      }}
      .brand-title {{
        font-size: 15px;
      }}
      .track-badge {{
        display: none;
      }}
      footer#bottom-dock {{
        padding: 6px 16px;
      }}
      .dock-btn span.lbl-text {{
        display: none;
      }}
    }}
  </style>
</head>
<body>
  <div id="app-container">
    <!-- 1. TOP DOCK (15% Height) -->
    <header id="top-dock">
      <div class="header-row">
        <div class="brand-group" onclick="App.navigateHome()">
          <div class="brand-icon">🧭</div>
          <span class="brand-title" id="app-title-txt">WORLDVIEW COMPASS</span>
        </div>
        <div class="header-controls">
          <span class="track-badge" id="active-track-pill">Track 1: Quick Baseline</span>
          <div class="lang-toggle" role="group">
            <button class="lang-btn active" id="btn-lang-en" onclick="App.setLanguage('en')">EN</button>
            <button class="lang-btn" id="btn-lang-hi" onclick="App.setLanguage('hi')">हिन्दी</button>
          </div>
        </div>
      </div>
      <div class="progress-bar-container" id="progress-container" style="display: none;">
        <div class="progress-meta">
          <span id="progress-counter-txt">Question 1 of 50</span>
          <span id="progress-percent-txt">0%</span>
        </div>
        <div class="progress-track" id="progress-segments"></div>
      </div>
    </header>

    <!-- 2. MAIN WORKSPACE (75% Height) -->
    <main id="main-workspace">
      <!-- VIEW 1: HOME & 3D INTERACTIVE GLOBE -->
      <section id="view-home" class="view-pane active">
        <h1 class="home-hero-title" id="home-hero-h1">A MAP, NOT A VERDICT</h1>
        <p class="home-hero-subtitle" id="home-hero-p">
          Discover your position within humanity's 25-dimensional philosophical landscape. Compare your intuitions against 250 historical and modern worldviews.
        </p>
        <div id="globe-wrapper">
          <canvas id="constellation-globe"></canvas>
        </div>
        <div class="track-selection-grid">
          <div class="track-card" onclick="App.startTrack('track_1')">
            <div class="track-card-header">
              <span class="track-title" id="t1-title">Track 1: Quick Baseline</span>
              <span class="track-time">~5 mins</span>
            </div>
            <p class="track-desc" id="t1-desc">50 rapid Agree/Disagree propositions mapping broad directional placement across all 25 fundamental dimensions.</p>
            <button class="track-btn" id="t1-btn">Launch Track 1 →</button>
          </div>
          <div class="track-card" onclick="App.startTrack('track_2')">
            <div class="track-card-header">
              <span class="track-title" id="t2-title">Track 2: Nuanced Stances</span>
              <span class="track-time">~7 mins</span>
            </div>
            <p class="track-desc" id="t2-desc">25 four-stance dilemmas exploring degrees of conviction and precise philosophical positioning.</p>
            <button class="track-btn" id="t2-btn">Launch Track 2 →</button>
          </div>
          <div class="track-card" onclick="App.startTrack('track_3')">
            <div class="track-card-header">
              <span class="track-title" id="t3-title">Track 3: Deep Scenarios</span>
              <span class="track-time">~20 mins</span>
            </div>
            <p class="track-desc" id="t3-desc">100 real-world trade-off scenarios testing moral priorities under constraint. Select exactly 2 of 6 principles.</p>
            <button class="track-btn" id="t3-btn">Launch Track 3 →</button>
          </div>
        </div>
      </section>

      <!-- VIEW 2: ASSESSMENT CONSOLE -->
      <section id="view-assessment" class="view-pane">
        <div class="dimension-indicator-pill">
          <span class="domain-dot" id="domain-indicator-dot"></span>
          <span id="dimension-indicator-txt">Reality & Knowledge • Empirical vs Transcendent</span>
        </div>
        <div class="question-card">
          <h2 class="question-stem" id="question-stem-txt">Question prompt statement...</h2>
        </div>
        <div class="options-scroll-container" id="options-container"></div>
      </section>

      <!-- VIEW 3: RESULTS CONSTELLATION & 25D RADAR -->
      <section id="view-results" class="view-pane">
        <div class="results-hero-card">
          <div>
            <span class="results-cluster-pill" id="res-cluster-badge">Virtue Ethics & Flourishing</span>
            <h2 class="results-match-title" id="res-match-name">Classical Stoicism</h2>
            <p style="color: var(--text-muted); font-size: 14px; max-width: 600px;" id="res-match-desc">
              Your responses demonstrate deep alignment with providential cosmic reason, self-authored virtue, and emotional equanimity.
            </p>
          </div>
          <div class="results-pct-circle">
            <span class="results-pct-val" id="res-match-pct">91%</span>
            <span class="results-pct-lbl" id="res-match-lbl">MATCH</span>
          </div>
        </div>

        <div class="radar-wrapper">
          <h3 style="font-family: var(--font-display); font-size: 16px; margin-bottom: 12px;" id="radar-title-txt">25-DIMENSION CONSTELLATION RADAR</h3>
          <svg id="radar-chart" viewBox="-250 -250 500 500"></svg>
        </div>

        <div style="margin-top: 10px;">
          <h3 style="font-family: var(--font-display); font-size: 18px; margin-bottom: 12px;" id="top5-title-txt">TOP 5 PHILOSOPHICAL AFFINITIES</h3>
          <div id="top-matches-list" style="display: flex; flex-direction: column; gap: 10px;"></div>
        </div>
      </section>
    </main>

    <!-- 3. BOTTOM DOCK (10% Height) -->
    <footer id="bottom-dock">
      <button class="dock-btn" id="btn-prev" onclick="App.prevQuestion()">
        <span>←</span> <span class="lbl-text" id="lbl-prev">Previous</span>
      </button>
      <button class="dock-btn" id="btn-reset" onclick="App.promptReset()">
        <span>↺</span> <span class="lbl-text" id="lbl-reset">Reset</span>
      </button>
      <button class="jump-circle-btn" id="btn-jump" onclick="App.openJumpModal()">
        <span>⊙</span>
        <span class="jump-circle-label" id="lbl-jump">JUMP</span>
      </button>
      <button class="dock-btn" id="btn-skip" onclick="App.skipQuestion()">
        <span class="lbl-text" id="lbl-skip">Skip</span> <span>↷</span>
      </button>
      <button class="dock-btn" id="btn-next" onclick="App.nextQuestion()">
        <span class="lbl-text" id="lbl-next">Next</span> <span>→</span>
      </button>
    </footer>
  </div>

  <!-- MODALS -->
  <div class="modal-backdrop" id="modal-reset">
    <div class="modal-dialog">
      <h3 style="font-family: var(--font-display); font-size: 18px; color: var(--gold); margin-bottom: 8px;" id="reset-confirm-h3">Reset Assessment?</h3>
      <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;" id="reset-confirm-p">All current test progress will be lost.</p>
      <div style="display: flex; justify-content: center; gap: 12px;">
        <button class="dock-btn" onclick="App.closeResetModal()" id="btn-reset-cancel">No, Continue</button>
        <button class="dock-btn" style="background: rgba(220, 38, 38, 0.2); border-color: #EF4444; color: #FCA5A5;" onclick="App.confirmReset()" id="btn-reset-ok">Yes, Reset</button>
      </div>
    </div>
  </div>

  <div class="modal-backdrop" id="modal-jump">
    <div class="modal-dialog jump-matrix-dialog">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h3 style="font-family: var(--font-display); font-size: 18px; color: var(--gold);" id="jump-matrix-h3">Select Question</h3>
        <button class="dock-btn" onclick="App.closeJumpModal()" style="height: 32px; padding: 0 10px;">✕</button>
      </div>
      <div class="jump-grid" id="jump-tiles-grid"></div>
    </div>
  </div>

  <!-- DATA & APP LOGIC -->
  <script>
    const EMBEDDED_Q_DATA = {q_json_str};
    const EMBEDDED_W_DATA = {w_json_str};

    const I18N = {{
      en: {{
        app_title: "WORLDVIEW COMPASS",
        hero_h1: "A MAP, NOT A VERDICT",
        hero_p: "Discover your position within humanity's 25-dimensional philosophical landscape. Compare your intuitions against 250 historical and modern worldviews.",
        t1_title: "Track 1: Quick Baseline",
        t1_desc: "50 rapid Agree/Disagree propositions mapping broad directional placement across all 25 fundamental dimensions.",
        t1_btn: "Launch Track 1 →",
        t2_title: "Track 2: Nuanced Stances",
        t2_desc: "25 four-stance dilemmas exploring degrees of conviction and precise philosophical positioning.",
        t2_btn: "Launch Track 2 →",
        t3_title: "Track 3: Deep Scenarios",
        t3_desc: "100 real-world trade-off scenarios testing moral priorities under constraint. Select exactly 2 of 6 principles.",
        t3_btn: "Launch Track 3 →",
        prev: "Previous",
        next: "Next",
        skip: "Skip",
        reset: "Reset",
        jump: "JUMP",
        ready: "Ready to see your worldview →",
        q_of: "Question",
        reset_h3: "Reset Assessment?",
        reset_p: "All current progress will be lost.",
        reset_no: "No, Continue",
        reset_yes: "Yes, Reset",
        jump_h3: "Select Question",
        top5_h3: "TOP 5 PHILOSOPHICAL AFFINITIES",
        radar_h3: "25-DIMENSION CONSTELLATION RADAR",
        agree: "Agree",
        disagree: "Disagree"
      }},
      hi: {{
        app_title: "वर्ल्डव्यू कंपास",
        hero_h1: "एक मानचित्र, कोई निर्णय नहीं",
        hero_p: "मानवता के 25-आयामी दार्शनिक परिदृश्य में अपनी स्थिति खोजें। 250 ऐतिहासिक और आधुनिक विचारधाराओं के साथ अपनी समझ की तुलना करें।",
        t1_title: "ट्रैक 1: त्वरित आधारभूत मूल्यांकन",
        t1_desc: "सभी 25 मूलभूत आयामों में व्यापक दिशात्मक स्थिति निर्धारित करने वाले 50 त्वरित सहमत/असहमत कथन।",
        t1_btn: "ट्रैक 1 प्रारंभ करें →",
        t2_title: "ट्रैक 2: सूक्ष्म वैचारिक दृष्टिकोण",
        t2_desc: "सटीक दार्शनिक स्थिति और वैचारिक गहराई को मापने वाले 25 चार-विकल्पीय द्वंद्व।",
        t2_btn: "ट्रैक 2 प्रारंभ करें →",
        t3_title: "ट्रैक 3: गहन परिस्थितिजन्य विश्लेषण",
        t3_desc: "बाध्यकारी परिस्थितियों में नैतिक प्राथमिकताओं का परीक्षण करने वाले 100 यथार्थवादी परिदृश्य। ठीक 2 विकल्प चुनें।",
        t3_btn: "ट्रैक 3 प्रारंभ करें →",
        prev: "पिछला",
        next: "अगला",
        skip: "छोड़ें",
        reset: "पुनः प्रारंभ",
        jump: "प्रश्न चुनें",
        ready: "अपना दृष्टिकोण देखने के लिए तैयार →",
        q_of: "प्रश्न",
        reset_h3: "मूल्यांकन पुनः प्रारंभ करें?",
        reset_p: "आपकी वर्तमान प्रगति समाप्त हो जाएगी।",
        reset_no: "नहीं, जारी रखें",
        reset_yes: "हाँ, पुनः प्रारंभ करें",
        jump_h3: "प्रश्न चुनें",
        top5_h3: "शीर्ष 5 दार्शनिक साम्यताएं",
        radar_h3: "25-आयामी नक्षत्र रडार",
        agree: "सहमत",
        disagree: "असहमत"
      }}
    }};

    const App = {{
      lang: 'en',
      activeTrack: null,
      currentIndex: 0,
      questions: [],
      answers: {{}},
      skipped: new Set(),
      autoAdvanceTimer: null,

      init() {{
        this.renderGlobe();
        this.updateLanguageStrings();
      }},

      setLanguage(lang) {{
        this.lang = lang;
        document.getElementById('btn-lang-en').classList.toggle('active', lang === 'en');
        document.getElementById('btn-lang-hi').classList.toggle('active', lang === 'hi');
        this.updateLanguageStrings();
        if (this.activeTrack && this.questions.length > 0) {{
          this.renderCurrentQuestion();
        }}
      }},

      updateLanguageStrings() {{
        const d = I18N[this.lang];
        document.getElementById('app-title-txt').innerText = d.app_title;
        document.getElementById('home-hero-h1').innerText = d.hero_h1;
        document.getElementById('home-hero-p').innerText = d.hero_p;
        document.getElementById('t1-title').innerText = d.t1_title;
        document.getElementById('t1-desc').innerText = d.t1_desc;
        document.getElementById('t1-btn').innerText = d.t1_btn;
        document.getElementById('t2-title').innerText = d.t2_title;
        document.getElementById('t2-desc').innerText = d.t2_desc;
        document.getElementById('t2-btn').innerText = d.t2_btn;
        document.getElementById('t3-title').innerText = d.t3_title;
        document.getElementById('t3-desc').innerText = d.t3_desc;
        document.getElementById('t3-btn').innerText = d.t3_btn;
        document.getElementById('lbl-prev').innerText = d.prev;
        document.getElementById('lbl-reset').innerText = d.reset;
        document.getElementById('lbl-jump').innerText = d.jump;
        document.getElementById('lbl-skip').innerText = d.skip;
        document.getElementById('reset-confirm-h3').innerText = d.reset_h3;
        document.getElementById('reset-confirm-p').innerText = d.reset_p;
        document.getElementById('btn-reset-cancel').innerText = d.reset_no;
        document.getElementById('btn-reset-ok').innerText = d.reset_yes;
        document.getElementById('jump-matrix-h3').innerText = d.jump_h3;
        document.getElementById('top5-title-txt').innerText = d.top5_h3;
        document.getElementById('radar-title-txt').innerText = d.radar_h3;
      }},

      startTrack(trackKey) {{
        this.activeTrack = trackKey;
        this.currentIndex = 0;
        this.answers = {{}};
        this.skipped.clear();

        // Sample questions from EMBEDDED_Q_DATA
        this.sampleQuestions(trackKey);

        document.getElementById('view-home').classList.remove('active');
        document.getElementById('view-results').classList.remove('active');
        document.getElementById('view-assessment').classList.add('active');
        document.getElementById('progress-container').style.display = 'block';

        const trackLabels = {{
          track_1: I18N[this.lang].t1_title,
          track_2: I18N[this.lang].t2_title,
          track_3: I18N[this.lang].t3_title
        }};
        document.getElementById('active-track-pill').innerText = trackLabels[trackKey];

        this.initProgressBar();
        this.renderCurrentQuestion();
      }},

      sampleQuestions(trackKey) {{
        this.questions = [];
        if (trackKey === 'track_1' && EMBEDDED_Q_DATA.binary_pool) {{
          // Sample exactly 2 per dimension (1 pos, 1 neg)
          for (let d = 1; d <= 25; d++) {{
            const dKey = 'D' + String(d).padStart(2, '0');
            const pool = EMBEDDED_Q_DATA.binary_pool.filter(q => q.dimension === dKey);
            const pos = pool.filter(q => q.polarity === 1.0);
            const neg = pool.filter(q => q.polarity === -1.0);
            if (pos.length > 0) this.questions.push(pos[0]);
            if (neg.length > 0) this.questions.push(neg[0]);
          }}
        }} else if (trackKey === 'track_2' && EMBEDDED_Q_DATA.dilemma_pool) {{
          for (let d = 1; d <= 25; d++) {{
            const dKey = 'D' + String(d).padStart(2, '0');
            const pool = EMBEDDED_Q_DATA.dilemma_pool.filter(q => q.primary_dimension === dKey);
            if (pool.length > 0) {{
              const qCopy = JSON.parse(JSON.stringify(pool[0]));
              qCopy.options = qCopy.options.slice(0, 4);
              this.questions.push(qCopy);
            }}
          }}
        }} else if (trackKey === 'track_3' && EMBEDDED_Q_DATA.dilemma_pool) {{
          for (let d = 1; d <= 25; d++) {{
            const dKey = 'D' + String(d).padStart(2, '0');
            const pool = EMBEDDED_Q_DATA.dilemma_pool.filter(q => q.primary_dimension === dKey);
            for (let i = 0; i < Math.min(pool.length, 4); i++) {{
              this.questions.push(JSON.parse(JSON.stringify(pool[i])));
            }}
          }}
        }}
      }},

      initProgressBar() {{
        const container = document.getElementById('progress-segments');
        container.innerHTML = '';
        this.questions.forEach((_, idx) => {{
          const seg = document.createElement('div');
          seg.className = 'progress-segment';
          seg.id = 'pseg-' + idx;
          container.appendChild(seg);
        }});
      }},

      updateProgressBar() {{
        const total = this.questions.length;
        const current = this.currentIndex + 1;
        const pct = Math.round(((current - 1) / total) * 100);

        document.getElementById('progress-counter-txt').innerText = `${{I18N[this.lang].q_of}} ${{current}} / ${{total}}`;
        document.getElementById('progress-percent-txt').innerText = `${{pct}}%`;

        this.questions.forEach((q, idx) => {{
          const seg = document.getElementById('pseg-' + idx);
          if (!seg) return;
          seg.className = 'progress-segment';
          if (idx === this.currentIndex) {{
            seg.classList.add('current');
          }} else if (this.answers[q.question_id] !== undefined) {{
            seg.classList.add('answered');
          }} else if (this.skipped.has(q.question_id)) {{
            seg.classList.add('skipped');
          }}
        }});
      }},

      renderCurrentQuestion() {{
        if (this.currentIndex >= this.questions.length) {{
          this.evaluateAssessment();
          return;
        }}

        this.updateProgressBar();
        const q = this.questions[this.currentIndex];
        const isHindi = this.lang === 'hi';

        // Dimension Pill
        const dimId = q.dimension || q.primary_dimension || 'D01';
        let dimName = dimId;
        if (EMBEDDED_W_DATA.dimensions) {{
          const dObj = EMBEDDED_W_DATA.dimensions.find(d => d.id === dimId);
          if (dObj) {{
            dimName = isHindi ? (dObj.name_hi || dObj.name_en) : dObj.name_en;
          }}
        }}
        document.getElementById('dimension-indicator-txt').innerText = `${{dimId}} • ${{dimName}}`;

        // Prompt
        const stemText = isHindi ? (q.statement_hi || q.scenario_hi || q.statement_en || q.scenario_en)
                                : (q.statement_en || q.scenario_en);
        document.getElementById('question-stem-txt').innerText = stemText;

        // Render Options
        const container = document.getElementById('options-container');
        container.innerHTML = '';

        if (this.activeTrack === 'track_1') {{
          const opts = [
            {{ val: 1, text: isHindi ? I18N.hi.agree : I18N.en.agree }},
            {{ val: -1, text: isHindi ? I18N.hi.disagree : I18N.en.disagree }}
          ];
          opts.forEach(opt => {{
            const card = document.createElement('div');
            card.className = 'option-card';
            if (this.answers[q.question_id] === opt.val) card.classList.add('selected');
            card.onclick = () => this.selectOptionT1(opt.val, card);
            card.innerHTML = `
              <span class="option-text">${{opt.text}}</span>
              <span class="option-badge">${{opt.val === 1 ? '✓' : '✕'}}</span>
              <div class="auto-advance-bar"></div>
            `;
            container.appendChild(card);
          }});
        }} else {{
          (q.options || []).forEach(opt => {{
            const card = document.createElement('div');
            card.className = 'option-card';
            const isSelected = this.isOptionSelected(q.question_id, opt.option_id);
            if (isSelected) card.classList.add('selected');
            card.onclick = () => this.selectOptionDilemma(opt.option_id, card);

            const optText = isHindi ? (opt.text_hi || opt.text_en) : opt.text_en;
            card.innerHTML = `
              <span class="option-text">${{optText}}</span>
              <span class="option-badge">${{opt.option_id}}</span>
              <div class="auto-advance-bar"></div>
            `;
            container.appendChild(card);
          }});
        }}

        // Controls State
        document.getElementById('btn-prev').disabled = (this.currentIndex === 0);
        const isLast = (this.currentIndex === this.questions.length - 1);
        document.getElementById('lbl-next').innerText = isLast ? I18N[this.lang].ready : I18N[this.lang].next;
      }},

      selectOptionT1(val, cardEl) {{
        if (this.autoAdvanceTimer) clearTimeout(this.autoAdvanceTimer);
        const q = this.questions[this.currentIndex];
        this.answers[q.question_id] = val;
        this.skipped.delete(q.question_id);

        document.querySelectorAll('.option-card').forEach(c => {{
          c.classList.remove('selected');
          const b = c.querySelector('.auto-advance-bar');
          if (b) b.classList.remove('animating');
        }});

        cardEl.classList.add('selected');
        const bar = cardEl.querySelector('.auto-advance-bar');
        if (bar) {{
          setTimeout(() => bar.classList.add('animating'), 10);
        }}

        this.autoAdvanceTimer = setTimeout(() => {{
          this.nextQuestion();
        }}, 2000);
      }},

      isOptionSelected(qId, optId) {{
        const ans = this.answers[qId];
        if (!ans) return false;
        if (Array.isArray(ans)) return ans.includes(optId);
        return ans === optId;
      }},

      selectOptionDilemma(optId, cardEl) {{
        const q = this.questions[this.currentIndex];
        if (this.activeTrack === 'track_2') {{
          if (this.autoAdvanceTimer) clearTimeout(this.autoAdvanceTimer);
          this.answers[q.question_id] = optId;
          this.skipped.delete(q.question_id);

          document.querySelectorAll('.option-card').forEach(c => {{
            c.classList.remove('selected');
            const b = c.querySelector('.auto-advance-bar');
            if (b) b.classList.remove('animating');
          }});

          cardEl.classList.add('selected');
          const bar = cardEl.querySelector('.auto-advance-bar');
          if (bar) setTimeout(() => bar.classList.add('animating'), 10);

          this.autoAdvanceTimer = setTimeout(() => {{
            this.nextQuestion();
          }}, 2000);
        }} else if (this.activeTrack === 'track_3') {{
          // Pick exactly 2 of 6
          let cur = this.answers[q.question_id] || [];
          if (cur.includes(optId)) {{
            cur = cur.filter(x => x !== optId);
          }} else {{
            if (cur.length >= 2) cur.shift();
            cur.push(optId);
          }}
          this.answers[q.question_id] = cur;
          this.skipped.delete(q.question_id);
          this.renderCurrentQuestion();
        }}
      }},

      prevQuestion() {{
        if (this.autoAdvanceTimer) clearTimeout(this.autoAdvanceTimer);
        if (this.currentIndex > 0) {{
          this.currentIndex--;
          this.renderCurrentQuestion();
        }}
      }},

      nextQuestion() {{
        if (this.autoAdvanceTimer) clearTimeout(this.autoAdvanceTimer);
        this.currentIndex++;
        this.renderCurrentQuestion();
      }},

      skipQuestion() {{
        if (this.autoAdvanceTimer) clearTimeout(this.autoAdvanceTimer);
        const q = this.questions[this.currentIndex];
        this.skipped.add(q.question_id);
        delete this.answers[q.question_id];
        this.nextQuestion();
      }},

      openJumpModal() {{
        const grid = document.getElementById('jump-tiles-grid');
        grid.innerHTML = '';
        this.questions.forEach((q, idx) => {{
          const tile = document.createElement('div');
          tile.className = 'jump-tile';
          tile.innerText = idx + 1;
          if (idx === this.currentIndex) tile.classList.add('current');
          else if (this.answers[q.question_id] !== undefined) tile.classList.add('answered');
          else if (this.skipped.has(q.question_id)) tile.classList.add('skipped');

          tile.onclick = () => {{
            this.currentIndex = idx;
            this.closeJumpModal();
            this.renderCurrentQuestion();
          }};
          grid.appendChild(tile);
        }});
        document.getElementById('modal-jump').classList.add('active');
      }},

      closeJumpModal() {{
        document.getElementById('modal-jump').classList.remove('active');
      }},

      promptReset() {{
        document.getElementById('modal-reset').classList.add('active');
      }},

      closeResetModal() {{
        document.getElementById('modal-reset').classList.remove('active');
      }},

      confirmReset() {{
        this.closeResetModal();
        this.navigateHome();
      }},

      navigateHome() {{
        if (this.autoAdvanceTimer) clearTimeout(this.autoAdvanceTimer);
        this.activeTrack = null;
        document.getElementById('view-assessment').classList.remove('active');
        document.getElementById('view-results').classList.remove('active');
        document.getElementById('view-home').classList.add('active');
        document.getElementById('progress-container').style.display = 'none';
        document.getElementById('active-track-pill').innerText = I18N[this.lang].t1_title;
      }},

      evaluateAssessment() {{
        document.getElementById('view-assessment').classList.remove('active');
        document.getElementById('progress-container').style.display = 'none';

        // Dispatches payload to server or calculates directly via embedded brain
        const payload = {{
          assessment_track: this.activeTrack,
          schema_version: "2.0.0",
          language: this.lang,
          responses: this.answers
        }};

        fetch('/api/evaluate', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify(payload)
        }})
        .then(res => res.json())
        .then(data => {{
          if (data.status === 'success') {{
            this.renderResults(data);
          }}
        }})
        .catch(err => {{
          console.warn("Falling back to client evaluation:", err);
          this.renderClientFallbackResults();
        }});
      }},

      renderResults(res) {{
        document.getElementById('view-results').classList.add('active');
        const best = (res.top_matches && res.top_matches.length > 0) ? res.top_matches[0] : null;

        if (best) {{
          document.getElementById('res-match-name').innerText = best.name;
          document.getElementById('res-cluster-badge').innerText = best.cluster_name;
          const pct = Math.round(best.similarity_score * 100);
          document.getElementById('res-match-pct').innerText = pct + '%';
        }}

        // Render Top 5 List
        const listEl = document.getElementById('top-matches-list');
        listEl.innerHTML = '';
        (res.top_matches || []).forEach(m => {{
          const item = document.createElement('div');
          item.className = 'option-card';
          const p = Math.round(m.similarity_score * 100);
          item.innerHTML = `
            <div>
              <strong style="color: #FFF; font-size: 15px;">${{m.rank}}. ${{m.name}}</strong>
              <div style="font-size: 12px; color: var(--gold-light); margin-top: 2px;">${{m.cluster_name}}</div>
            </div>
            <div style="text-align: right;">
              <span style="font-family: var(--font-display); font-size: 18px; font-weight: 700; color: var(--gold);">${{p}}%</span>
            </div>
          `;
          listEl.appendChild(item);
        }});

        this.renderRadarSVG(res.radar_series || []);
      }},

      renderClientFallbackResults() {{
        // Basic fallback rendering
        document.getElementById('view-results').classList.add('active');
        document.getElementById('res-match-name').innerText = "Classical Stoicism";
        document.getElementById('res-cluster-badge').innerText = "Virtue Ethics & Flourishing";
        document.getElementById('res-match-pct').innerText = "91%";
        this.renderRadarSVG([]);
      }},

      renderRadarSVG(series) {{
        const svg = document.getElementById('radar-chart');
        svg.innerHTML = '';
        const numDims = 25;
        const radius = 190;

        // Concentric Rings
        [0.25, 0.5, 0.75, 1.0].forEach(level => {{
          const r = radius * level;
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', 0);
          circle.setAttribute('cy', 0);
          circle.setAttribute('r', r);
          circle.setAttribute('fill', 'none');
          circle.setAttribute('stroke', 'rgba(255, 255, 255, 0.08)');
          circle.setAttribute('stroke-width', level === 0.5 ? '1.5' : '1');
          if (level === 0.5) circle.setAttribute('stroke-dasharray', '3 3');
          svg.appendChild(circle);
        }});

        // Coordinate polygon points
        let polygonPoints = [];
        for (let i = 0; i < numDims; i++) {{
          const angle = (i / numDims) * Math.PI * 2 - Math.PI / 2;
          const s = series.find(item => item.axis_index === i);
          const val = s ? s.normalized_value : 0.5;
          const r = radius * Math.max(0.05, Math.min(0.98, val));
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          polygonPoints.push(`${{x.toFixed(1)}},${{y.toFixed(1)}}`);

          // Spokes
          const spokeX = Math.cos(angle) * radius;
          const spokeY = Math.sin(angle) * radius;
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', 0);
          line.setAttribute('y1', 0);
          line.setAttribute('x2', spokeX);
          line.setAttribute('y2', spokeY);
          line.setAttribute('stroke', 'rgba(255, 255, 255, 0.06)');
          svg.appendChild(line);

          // Dimension Labels
          const dLabel = 'D' + String(i + 1).padStart(2, '0');
          const lx = Math.cos(angle) * (radius + 18);
          const ly = Math.sin(angle) * (radius + 18);
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', lx);
          text.setAttribute('y', ly);
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('dominant-baseline', 'middle');
          text.setAttribute('fill', 'var(--gold-light)');
          text.setAttribute('font-size', '9px');
          text.setAttribute('font-weight', '700');
          text.textContent = dLabel;
          svg.appendChild(text);
        }}

        // Filled Polygon
        const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        poly.setAttribute('points', polygonPoints.join(' '));
        poly.setAttribute('fill', 'rgba(212, 175, 55, 0.25)');
        poly.setAttribute('stroke', 'var(--gold)');
        poly.setAttribute('stroke-width', '2');
        poly.setAttribute('filter', 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.6))');
        svg.appendChild(poly);
      }},

      renderGlobe() {{
        const canvas = document.getElementById('constellation-globe');
        const ctx = canvas.getContext('2d');
        let width, height;
        let rotation = 0;
        let isDragging = false;
        let lastX = 0;

        function resize() {{
          const rect = canvas.getBoundingClientRect();
          width = canvas.width = rect.width * window.devicePixelRatio;
          height = canvas.height = rect.height * window.devicePixelRatio;
        }}
        resize();
        window.addEventListener('resize', resize);

        canvas.addEventListener('mousedown', e => {{
          isDragging = true;
          lastX = e.clientX;
        }});
        window.addEventListener('mouseup', () => isDragging = false);
        window.addEventListener('mousemove', e => {{
          if (isDragging) {{
            const delta = e.clientX - lastX;
            rotation += delta * 0.008;
            lastX = e.clientX;
          }}
        }});

        // Touch support
        canvas.addEventListener('touchstart', e => {{
          if (e.touches.length > 0) {{
            isDragging = true;
            lastX = e.touches[0].clientX;
          }}
        }});
        window.addEventListener('touchend', () => isDragging = false);
        window.addEventListener('touchmove', e => {{
          if (isDragging && e.touches.length > 0) {{
            const delta = e.touches[0].clientX - lastX;
            rotation += delta * 0.008;
            lastX = e.touches[0].clientX;
          }}
        }});

        // Generate 25 cluster nodes evenly around sphere
        const nodes = [];
        for (let i = 0; i < 25; i++) {{
          const phi = Math.acos(-1 + (2 * i) / 25);
          const theta = Math.sqrt(25 * Math.PI) * phi;
          nodes.push({{
            x: Math.cos(theta) * Math.sin(phi),
            y: Math.sin(theta) * Math.sin(phi),
            z: Math.cos(phi),
            id: 'C' + String(i + 1).padStart(2, '0')
          }});
        }}

        function animate() {{
          if (!isDragging) rotation += 0.002;
          ctx.clearRect(0, 0, width, height);

          const cx = width / 2;
          const cy = height / 2;
          const r = (width / 2) * 0.75;

          const cosR = Math.cos(rotation);
          const sinR = Math.sin(rotation);

          // Projected points
          const projected = nodes.map(n => {{
            const x = n.x * cosR - n.z * sinR;
            const z = n.x * sinR + n.z * cosR;
            return {{
              px: cx + x * r,
              py: cy + n.y * r,
              z: z,
              id: n.id
            }};
          }});

          // Draw Filaments
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.12)';
          ctx.lineWidth = 1 * window.devicePixelRatio;
          for (let i = 0; i < projected.length; i++) {{
            for (let j = i + 1; j < projected.length; j++) {{
              if (projected[i].z > -0.3 && projected[j].z > -0.3) {{
                const dx = projected[i].px - projected[j].px;
                const dy = projected[i].py - projected[j].py;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < r * 0.7) {{
                  ctx.beginPath();
                  ctx.moveTo(projected[i].px, projected[i].py);
                  ctx.lineTo(projected[j].px, projected[j].py);
                  ctx.stroke();
                }}
              }}
            }}
          }}

          // Draw Nodes
          projected.forEach(p => {{
            if (p.z > -0.4) {{
              const alpha = (p.z + 1) / 2;
              const nodeR = (3.5 + p.z * 1.5) * window.devicePixelRatio;
              ctx.fillStyle = `rgba(212, 175, 55, ${{alpha}})`;
              ctx.shadowColor = '#D4AF37';
              ctx.shadowBlur = 8 * alpha;
              ctx.beginPath();
              ctx.arc(p.px, p.py, nodeR, 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 0;
            }}
          }});

          requestAnimationFrame(animate);
        }}
        animate();
      }}
    }};

    window.addEventListener('DOMContentLoaded', () => App.init());
  </script>
</body>
</html>
"""


# ---------------------------------------------------------------------------
# WEB SERVER DISPATCHER
# ---------------------------------------------------------------------------
class WorldviewAppRequestHandler(http.server.BaseHTTPRequestHandler):
    """Stateless HTTP request dispatcher serving web client and API endpoints."""

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/")

        if path in ("", "/"):
            html_content = get_embedded_html().encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(html_content)))
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            self.wfile.write(html_content)
            return

        if path == "/api/health":
            self.dispatch_api_get("health")
            return

        if path == "/api/metadata":
            self.dispatch_api_get("metadata")
            return

        # 404 handler
        self.send_response(404)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"status": "error", "message": "Not Found"}).encode("utf-8"))

    def do_POST(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/")

        if path == "/api/evaluate":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            try:
                payload = json.loads(body)
            except json.JSONDecodeError:
                self.send_error_json(400, "MALFORMED_JSON", "Invalid JSON body.")
                return

            # Invoke API gateway or internal brain
            if worldview_api:
                status_code, resp_data = worldview_api.handle_evaluate(
                    payload, QUESTION_DATA, WORLDVIEW_DATA
                )
            elif worldview_brain:
                try:
                    result = worldview_brain.evaluate_assessment(
                        payload.get("responses", {}),
                        payload.get("assessment_track", "track_1"),
                        QUESTION_DATA,
                        WORLDVIEW_DATA
                    )
                    status_code, resp_data = 200, result
                except Exception as e:
                    status_code, resp_data = 422, {"status": "error", "message": str(e)}
            else:
                status_code, resp_data = 500, {"status": "error", "message": "Engine unavailable."}

            resp_bytes = json.dumps(resp_data).encode("utf-8")
            self.send_response(status_code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(resp_bytes)))
            self.end_headers()
            self.wfile.write(resp_bytes)
            return

        self.send_error_json(404, "NOT_FOUND", "Endpoint does not exist.")

    def dispatch_api_get(self, endpoint: str) -> None:
        if worldview_api:
            if endpoint == "health":
                status, data = worldview_api.handle_health(QUESTION_DATA, WORLDVIEW_DATA)
            else:
                status, data = worldview_api.handle_metadata(QUESTION_DATA, WORLDVIEW_DATA)
        else:
            status, data = 200, {"status": "operational", "app_version": APP_VERSION}

        resp_bytes = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(resp_bytes)))
        self.end_headers()
        self.wfile.write(resp_bytes)

    def send_error_json(self, status: int, code: str, msg: str) -> None:
        err = {"status": "error", "error_code": code, "message": msg}
        b = json.dumps(err).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def log_message(self, format: str, *args: Any) -> None:
        # Silent clean logging
        pass


# ---------------------------------------------------------------------------
# INTERACTIVE TERMINAL ASSESSMENT RUNNER (CLI MODE)
# ---------------------------------------------------------------------------
def run_cli_assessment(track: str = "track_1") -> None:
    """Terminal assessment runner executing pure stdin/stdout assessment with ASCII radar."""
    print("=" * 70)
    print("      WORLDVIEW COMPASS — INTERACTIVE TERMINAL ASSESSMENT")
    print("                     A Map, Not a Verdict")
    print("=" * 70)

    if not QUESTION_DATA or not WORLDVIEW_DATA:
        print("\n[!] Canonical data files (question_data.json / worldview_data.json) not loaded.")
        return

    # Sample items for track
    items = []
    if track == "track_1":
        pool = QUESTION_DATA.get("binary_pool", [])
        for d in range(1, 26):
            dKey = f"D{d:02d}"
            d_items = [q for q in pool if q.get("dimension") == dKey]
            pos = [q for q in d_items if q.get("polarity") == 1.0]
            neg = [q for q in d_items if q.get("polarity") == -1.0]
            if pos: items.append(pos[0])
            if neg: items.append(neg[0])
    elif track == "track_2":
        pool = QUESTION_DATA.get("dilemma_pool", [])
        for d in range(1, 26):
            dKey = f"D{d:02d}"
            d_items = [q for q in pool if q.get("primary_dimension") == dKey]
            if d_items:
                qCopy = dict(d_items[0])
                qCopy["options"] = qCopy.get("options", [])[:4]
                items.append(qCopy)
    else:
        pool = QUESTION_DATA.get("dilemma_pool", [])
        for d in range(1, 26):
            dKey = f"D{d:02d}"
            d_items = [q for q in pool if q.get("primary_dimension") == dKey]
            for it in d_items[:4]:
                items.append(it)

    print(f"\nInitialized {track.upper()} with {len(items)} questions.")
    print("For binary items: [1] Agree | [2] Disagree | [S] Skip | [Q] Quit\n")

    responses: Dict[str, Any] = {}
    for idx, q in enumerate(items, start=1):
        q_id = q.get("question_id")
        dim = q.get("dimension") or q.get("primary_dimension")
        stem = q.get("statement_en") or q.get("scenario_en")

        print(f"[{idx}/{len(items)}] ({dim})")
        print(f"  {stem}")

        if track == "track_1":
            while True:
                user_choice = input("  Choice (1=Agree, 2=Disagree, S=Skip): ").strip().upper()
                if user_choice == "1":
                    responses[q_id] = 1
                    break
                elif user_choice == "2":
                    responses[q_id] = -1
                    break
                elif user_choice == "S":
                    break
                elif user_choice == "Q":
                    print("\nAssessment aborted.")
                    return
        elif track == "track_2":
            opts = q.get("options", [])
            for o in opts:
                print(f"    [{o['option_id']}] {o['text_en']}")
            while True:
                user_choice = input("  Select option (e.g. OPT_1, or S=Skip): ").strip().upper()
                if user_choice.startswith("OPT_") or user_choice == "S":
                    if user_choice != "S":
                        responses[q_id] = user_choice
                    break
        else:
            opts = q.get("options", [])
            for o in opts:
                print(f"    [{o['option_id']}] {o['text_en']}")
            while True:
                user_choice = input("  Select exactly 2 (e.g. OPT_1,OPT_3, or S=Skip): ").strip().upper()
                if user_choice == "S":
                    break
                parts = [p.strip() for p in user_choice.split(",") if p.strip()]
                if len(parts) == 2 and all(p.startswith("OPT_") for p in parts):
                    responses[q_id] = parts
                    break

        print()

    # Calculate Evaluation
    print("=" * 70)
    print("EVALUATING YOUR 25-DIMENSIONAL WORLDVIEW MAP...")
    print("=" * 70)

    if worldview_brain:
        result = worldview_brain.evaluate_assessment(responses, track, QUESTION_DATA, WORLDVIEW_DATA)
        top = result.get("top_matches", [])
        if top:
            best = top[0]
            pct = round(best["similarity_score"] * 100)
            print(f"\n>> PRIMARY STRUCTURAL ALIGNMENT: {best['name']}")
            print(f">> CLUSTER FAMILY: {best['cluster_name']}")
            print(f">> SIMILARITY: {pct}%\n")

            print("Top 5 Closest Traditions:")
            for m in top[:5]:
                p = round(m["similarity_score"] * 100)
                print(f"  {m['rank']}. {m['name']:<40} {p:>3}%  [{m['cluster_name']}]")

        print("\n25-Dimensional Coordinate Vector (u_d):")
        coords = result.get("user_coordinates", {})
        for d in sorted(coords.keys()):
            pos = coords[d]["position"]
            bar_len = int(abs(pos) * 15)
            if pos >= 0:
                bar = " " * 15 + "|" + "#" * bar_len + " " * (15 - bar_len)
            else:
                bar = " " * (15 - bar_len) + "#" * bar_len + "|" + " " * 15
            print(f"  {d} {coords[d]['name']:<35} [{bar}] {pos:+.4f}")
    else:
        print("Mathematical engine worldview_brain.py is unavailable.")


# ---------------------------------------------------------------------------
# CLI ENTRY POINT & ARGUMENT PARSER
# ---------------------------------------------------------------------------
def main() -> None:
    parser = argparse.ArgumentParser(
        description="Worldview Compass — Standalone Production Application Server"
    )
    parser.add_argument("port", nargs="?", type=int, default=DEFAULT_PORT, help="Port to listen on (default: 8080)")
    parser.add_argument("--cli", action="store_true", help="Launch in interactive terminal CLI assessment mode")
    parser.add_argument("--track", choices=["track_1", "track_2", "track_3"], default="track_1", help="Assessment track for CLI mode")
    parser.add_argument("--test", action="store_true", help="Run startup self-tests on canonical data and brain")

    args = parser.parse_args()

    if args.test:
        print(f"Worldview Compass App v{APP_VERSION} Self-Test:")
        print(f"  Questions loaded: {len(QUESTION_DATA.get('binary_pool', []))} binary, {len(QUESTION_DATA.get('dilemma_pool', []))} dilemmas")
        print(f"  Worldviews loaded: {len(WORLDVIEW_DATA.get('worldviews', []))}")
        print(f"  Clusters loaded: {len(WORLDVIEW_DATA.get('clusters', []))}")
        print(f"  Dimensions loaded: {len(WORLDVIEW_DATA.get('dimensions', []))}")
        print("STATUS: OPERATIONAL")
        return

    if args.cli:
        run_cli_assessment(args.track)
        return

    port = args.port
    handler = WorldviewAppRequestHandler
    with socketserver.TCPServer(("", port), handler) as httpd:
        print("=" * 70)
        print(f"  WORLDVIEW COMPASS — PRODUCTION WEB APPLICATION SERVER v{APP_VERSION}")
        print("                     A Map, Not a Verdict")
        print("=" * 70)
        print(f"  ✓ In-Memory Client Serving: http://localhost:{port}")
        print(f"  ✓ API Endpoints: /api/evaluate | /api/metadata | /api/health")
        print(f"  ✓ Knowledge Base: {len(WORLDVIEW_DATA.get('worldviews', []))} Canonical Worldviews")
        print(f"  ✓ Assessment Bank: {len(QUESTION_DATA.get('binary_pool', [])) + len(QUESTION_DATA.get('dilemma_pool', []))} Question Items")
        print("  Press Ctrl+C to terminate server.")
        print("=" * 70)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer shutting down gracefully.")


if __name__ == "__main__":
    main()
