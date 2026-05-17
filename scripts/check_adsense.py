import json
import os
import sys
from datetime import date, timedelta
from pathlib import Path

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


def load_env(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip())


load_env(Path(__file__).resolve().parent.parent / ".env.local")

CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
REFRESH_TOKEN = os.environ.get("ADSENSE_REFRESH_TOKEN")
if not CLIENT_ID or not CLIENT_SECRET or not REFRESH_TOKEN:
    sys.exit("Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET en ADSENSE_REFRESH_TOKEN (zie .env.local).")

TOKEN_URI = "https://oauth2.googleapis.com/token"

creds = Credentials(
    token=None,
    refresh_token=REFRESH_TOKEN,
    token_uri=TOKEN_URI,
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    scopes=["https://www.googleapis.com/auth/adsense.readonly"],
)

service = build("adsense", "v2", credentials=creds)
ACCOUNT = "accounts/pub-6978384984633173"

end = date.today()
start = end - timedelta(days=7)

report = service.accounts().reports().generate(
    account=ACCOUNT,
    dateRange="LAST_7_DAYS",
    metrics=["ESTIMATED_EARNINGS", "IMPRESSIONS", "CLICKS", "PAGE_VIEWS", "IMPRESSIONS_RPM"],
    dimensions=["DATE", "DOMAIN_NAME"],
    orderBy=["+DATE"],
).execute()

print(json.dumps(report, indent=2))
