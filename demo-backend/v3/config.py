"""
V3 Zentrale Konfiguration — alle Credentials und Constants an einem Ort.
"""

import os
import json
from pathlib import Path

# ── API Keys ─────────────────────────────────────────────────

CLOSE_API_KEY = os.environ.get("CLOSE_API_KEY_V2", os.environ.get("CLOSE_API_KEY", os.environ.get("CLOSE_API", "")))
SLACK_BOT_TOKEN = os.environ.get("SLACK_BOT_TOKEN", "")
CLICKUP_TOKEN = os.environ.get("CLICKUP_API_TOKEN", "")
META_ACCESS_TOKEN = os.environ.get("META_ACCESS_TOKEN", "")
META_AD_ACCOUNT = os.environ.get("META_AD_ACCOUNT_ID", "")
META_PIXEL_ID = os.environ.get("META_PIXEL_ID", "1496553014661154")
META_PAGE_ID = os.environ.get("META_PAGE_ID", "")
MIRO_ACCESS_TOKEN = os.environ.get("MIRO_ACCESS_TOKEN", "")
AIRTABLE_API_KEY = os.environ.get("AIRTABLE_API", "")
AIRTABLE_V3_BASE_ID = os.environ.get("AIRTABLE_V3_BASE_ID", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
NOTION_API_KEY = os.environ.get("NOTION_API_KEY_CLAUDIO", "")

# ── Google OAuth ─────────────────────────────────────────────

_google_raw = os.environ.get("FLOWSTACK_GOOGLE_OAUTH_TOKEN", os.environ.get("GOOGLE_OAUTH_TOKEN", "{}"))
try:
    _google_creds = json.loads(_google_raw)
except json.JSONDecodeError:
    _google_creds = {}

GOOGLE_TOKEN = _google_creds.get("token", "")
GOOGLE_REFRESH_TOKEN = _google_creds.get("refresh_token", "")
GOOGLE_CLIENT_ID = _google_creds.get("client_id", "")
GOOGLE_CLIENT_SECRET = _google_creds.get("client_secret", "")

# ── Close CRM Config ────────────────────────────────────────

_v2_config_path = Path(__file__).parent.parent / "close-v2-config.json"
CLOSE_PIPELINE_ID = ""
CLOSE_STAGES: dict[str, str] = {}

if _v2_config_path.exists():
    with open(_v2_config_path) as f:
        _cfg = json.load(f)
    CLOSE_PIPELINE_ID = _cfg["pipeline"]["id"]
    CLOSE_STAGES = _cfg["pipeline"]["stages"]

# ── ClickUp Config ───────────────────────────────────────────

CLICKUP_SPACE_ID = "90189542355"
CLICKUP_TEAM_ID = "90182362705"
CLICKUP_CLAUDIO = 306633165
CLICKUP_ANAK = 107605639

# ── Slack Config ─────────────────────────────────────────────

SLACK_CHANNELS = {
    "log": "#ff-log",
    "alerts": "#ff-alerts",
    "approvals": "#ff-approvals",
    "digest": "#ff-digest",
}

# ── Pfade ────────────────────────────────────────────────────

BASE_DIR = Path(__file__).parent.parent
STATE_DIR = BASE_DIR / "state"
EXECUTIONS_DIR = STATE_DIR / "executions"
FRAMEWORKS_DIR = BASE_DIR / "frameworks"

# Sicherstellen dass Verzeichnisse existieren
EXECUTIONS_DIR.mkdir(parents=True, exist_ok=True)
