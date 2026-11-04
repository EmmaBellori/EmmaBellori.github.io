#!/usr/bin/env python3
"""Create a draft Klaviyo campaign for newly published Emma Bellori books.

The catalog is canonical. No notification is created for historical titles or
coming-soon entries. Safe default: preview. Requires a private API key for draft.
Automatic sending has a separate explicit opt-in gate.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://emmabellori.github.io/"
API = "https://a.klaviyo.com/api/"
REVISION = "2026-04-15"
LIST_ID = "Rv2JJy"
SENDER = "emmabelloribooks@outlook.com"
STATE_PATH = ROOT / "growth" / "release-email-state.json"
CATALOG_PATH = ROOT / "catalog.json"
OVERRIDES = {"door-teapot": "the-door-inside-the-teapot"}
ID_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def esc(value: object) -> str:
    return html.escape(str(value or ""), quote=True)


def detail_path(book: dict) -> str:
    return "books/" + OVERRIDES.get(book["id"], book["id"]) + ".html"


def eligible(catalog: list, state: dict) -> list[dict]:
    announced = set(state["announced_ids"])
    seen: set[str] = set()
    chosen: list[dict] = []
    for book in catalog:
        if not isinstance(book, dict):
            continue
        bid = str(book.get("id", ""))
        if book.get("status") != "published" or bid in announced or bid in seen:
            continue
        if not ID_RE.fullmatch(bid):
            print("Skipped invalid book ID:", repr(bid))
            continue
        seen.add(bid)
        amazon = str(book.get("amazonUrl") or "")
        cover = str(book.get("cover") or "")
        if not (amazon.startswith("https://www.amazon.com/") or
                amazon.startswith("https://amazon.com/")):
            print("Not ready (Amazon URL missing/invalid):", bid)
            continue
        if not (cover.startswith("images/") and ".." not in cover and
                (ROOT / cover).is_file()):
            print("Not ready (cover missing):", bid)
            continue
        if not str(book.get("title") or "").strip():
            print("Not ready (title missing):", bid)
            continue
        if not (ROOT / detail_path(book)).is_file():
            print("Not ready (static book detail page missing):", bid)
            continue
        chosen.append(book)
    return chosen[:6]


def assert_public_pages(books: list[dict]) -> None:
    """Avoid announcing catalog changes before GitHub Pages has deployed."""
    for book in books:
        for resource in (detail_path(book), str(book["cover"])):
            url = SITE + resource
            ok = False
            for attempt in range(3):
                try:
                    req = urllib.request.Request(url, method="HEAD",
                                                 headers={"User-Agent": "EmmaBelloriReleaseChecker/1.0"})
                    with urllib.request.urlopen(req, timeout=12) as response:
                        ok = response.status == 200
                    if ok:
                        break
                except (urllib.error.URLError, TimeoutError, OSError):
                    pass
                if attempt < 2:
                    time.sleep(10)
            if not ok:
                raise RuntimeError("Page not deployed yet; retry next run: " + url)


def campaign_key(books: list[dict]) -> str:
    ids = ",".join(sorted(b["id"] for b in books))
    return hashlib.sha256(ids.encode("utf-8")).hexdigest()[:12]


def campaign_name(books: list[dict]) -> str:
    return "EB New Releases | " + campaign_key(books) + " | " + ", ".join(b["title"] for b in books)[:100]


def tracked_link(book: dict) -> str:
    return SITE + detail_path(book) + "?" + urllib.parse.urlencode({
        "utm_source": "klaviyo",
        "utm_medium": "email",
        "utm_campaign": "new_book_release",
        "utm_content": book["id"],
    })


def book_card(book: dict) -> str:
    cover = SITE + book["cover"]
    url = tracked_link(book)
    title = esc(book["title"])
    desc = esc(book.get("description") or book.get("theme") or "A new book to explore.")
    label = esc(book.get("series") or "Emma Bellori Books")
    return f"""
    <tr><td style="padding:0 0 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
             style="border:1px solid #E7DDD2;border-radius:15px;background:#F9FAF6;">
        <tr><td align="center" style="padding:24px 20px 14px;">
          <a href="{esc(url)}" style="text-decoration:none;">
            <img src="{esc(cover)}" width="165"
                 alt="Cover of {title}" style="display:block;width:165px;max-width:100%;height:auto;border:0;border-radius:7px;">
          </a>
        </td></tr>
        <tr><td align="center" style="padding:0 24px 20px;">
          <div style="font-size:11px;line-height:1.5;letter-spacing:1.4px;color:#9C6D57;font-weight:bold;">
            {label.upper()}
          </div>
          <h2 style="font-family:Georgia,'Times New Roman',serif;font-size:23px;line-height:1.3;margin:10px 0;color:#233E43;">
            {title}
          </h2>
          <p style="font-size:15px;line-height:1.6;color:#53615E;margin:0 0 18px;">{desc}</p>
          <table role="presentation" cellspacing="0" cellpadding="0" align="center"><tr>
            <td bgcolor="#233E43" style="background:#233E43;border-radius:25px;">
              <a href="{esc(url)}"
                 style="display:inline-block;padding:13px 23px;color:white;font-size:15px;line-height:1.35;text-decoration:none;font-weight:bold;border-radius:25px;">
                Explore the book &rarr;
              </a>
            </td>
          </tr></table>
        </td></tr>
      </table>
    </td></tr>"""


def render_email(books: list[dict]) -> tuple[str, str, str, str]:
    count = len(books)
    subject = (f"{count} new books from Emma Bellori Books 📚"
               if count != 1 else "A new book from Emma Bellori Books 📚")
    headline = "Fresh stories have arrived!" if count != 1 else "A new story has arrived!"
    preheader = ("Discover " + ", ".join(book["title"] for book in books[:2])
                 + (" and more" if count > 2 else "") + ".")
    cards = "\n".join(book_card(b) for b in books)
    unsub = "{% unsubscribe 'Unsubscribe' %}"
    address = "{{ organization.full_address }}"
    out = f"""<!doctype html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#FFFAF5;font-family:Arial,Helvetica,sans-serif;color:#233E43;">
<div style="display:none!important;max-height:0;max-width:0;opacity:0;overflow:hidden;">{esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFAF5;">
<tr><td align="center" style="padding:24px 10px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       style="max-width:600px;background:white;border:1px solid #E7DDD2;border-radius:19px;">
<tr><td style="padding:30px 22px 34px;">
<table role="presentation" width="100%"><tr><td align="center" style="padding:0 0 23px;">
<img src="https://emmabellori.github.io/images/emma-bellori-logo.webp" width="94" height="94"
     alt="Emma Bellori Books illustrated logo"
     style="display:block;width:94px;height:94px;margin:0 auto 10px;border-radius:50%;border:0;">
<div style="font-family:Georgia,'Times New Roman',serif;color:#233E43;font-size:20px;font-weight:bold;">Emma Bellori Books</div>
<div style="font-size:10px;letter-spacing:1.6px;font-weight:bold;color:#99715C;">BOOKS FOR CURIOUS MINDS</div>
</td></tr></table>
<div style="border-top:1px solid #E7DDD2;padding-top:20px;color:#986D58;font-size:11px;letter-spacing:1.8px;font-weight:bold;">
  FREE ACTIVITY CLUB · NEW RELEASES
</div>
<h1 style="font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.24;margin:13px 0 16px;color:#233E43;">
  {esc(headline)}
</h1>
<p style="font-size:16px;line-height:1.65;margin:0 0 25px;color:#344E50;">
  A little something new for curious minds. Explore {('these new books' if count != 1 else 'our newest book')},
  discover their stories, and see which feels right for your family.
</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">{cards}</table>
<p style="font-size:15px;line-height:1.6;color:#53615E;margin:8px 0 23px;">
  No pressure to buy anything. Our
  <a href="https://emmabellori.github.io/guides/?utm_source=klaviyo&amp;utm_medium=email&amp;utm_campaign=new_book_release&amp;utm_content=free_guides"
     style="color:#365C59;text-decoration:underline;">free family guides</a>
  are always here for practical ideas about feelings, friendship and learning.
</p>
<div style="padding-top:19px;border-top:1px solid #E7DDD2;font-size:13px;line-height:1.7;color:#687670;">
  Emma Bellori Books · <a href="https://emmabellori.github.io/" style="color:#365C59;">Website</a>
  · <a href="https://emmabellori.github.io/privacy.html" style="color:#365C59;">Privacy</a>
  · {unsub}
  <div style="margin-top:8px;font-size:12px;line-height:1.5;color:#7C8984;">{address}</div>
</div>
</td></tr></table></td></tr></table></body></html>"""
    text = (headline + "\n\n" + "\n\n".join(
        b["title"] + "\n" +
        str(b.get("description") or b.get("theme") or "") + "\n" + tracked_link(b)
        for b in books
    ) + "\n\nFree guides: https://emmabellori.github.io/guides/"
      + "\n\n" + unsub + "\n" + address)
    return subject, preheader[:200], out, text


class Klaviyo:
    def __init__(self, key: str):
        self.key = key

    def req(self, method: str, url: str, payload: dict | None = None) -> dict:
        if not url.startswith(API):
            raise ValueError("Unexpected API host")
        headers = {
            "Authorization": "Klaviyo-API-Key " + self.key,
            "accept": "application/vnd.api+json",
            "content-type": "application/vnd.api+json",
            "revision": REVISION,
        }
        data = json.dumps(payload).encode("utf-8") if payload is not None else None
        request = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.load(response)
        except urllib.error.HTTPError as exc:
            detail = exc.read(1200).decode("utf-8", errors="replace")
            raise RuntimeError(f"Klaviyo {method} returned HTTP {exc.code}: {detail}") from exc

    def find_campaign(self, name: str) -> dict | None:
        params = urllib.parse.urlencode({"filter": "equals(messages.channel,'email')", "page[size]": 100})
        url = API + "campaigns/?" + params
        for _ in range(25):
            response = self.req("GET", url)
            for item in response.get("data", []):
                if item.get("attributes", {}).get("name") == name:
                    return item
            url = (response.get("links") or {}).get("next")
            if not url:
                break
        return None

    def create_campaign(self, name: str, subject: str, preview: str) -> dict:
        payload = {"data": {"type": "campaign", "attributes": {
            "name": name,
            "audiences": {"included": [LIST_ID]},
            "send_strategy": {"method": "immediate"},
            "send_options": {"use_smart_sending": True},
            "tracking_options": {"is_add_utm": False, "is_tracking_clicks": True, "is_tracking_opens": True},
            "campaign-messages": {"data": [{"type": "campaign-message", "attributes": {"definition": {
                "channel": "email", "label": subject,
                "content": {"subject": subject, "preview_text": preview,
                            "from_email": SENDER, "from_label": "Emma Bellori Books",
                            "reply_to_email": SENDER},
            }}}]},
        }}}
        return self.req("POST", API + "campaigns/", payload)["data"]

    def template(self, name: str, markup: str, plain: str) -> str:
        response = self.req("POST", API + "templates/", {"data": {
            "type": "template", "attributes": {
                "name": name, "editor_type": "CODE", "html": markup, "text": plain,
            }}})
        return response["data"]["id"]

    def get_message(self, campaign: dict) -> str:
        messages = (campaign.get("relationships", {}).get("campaign-messages", {}).get("data") or [])
        if not messages:
            record = self.req("GET", API + "campaigns/" + campaign["id"] + "/")
            messages = record["data"].get("relationships", {}).get("campaign-messages", {}).get("data") or []
        if not messages:
            raise RuntimeError("Klaviyo campaign has no email message")
        return messages[0]["id"]

    def has_template(self, message_id: str) -> bool:
        obj = self.req("GET", API + "campaign-messages/" + message_id + "/?include=template")["data"]
        return bool(obj.get("relationships", {}).get("template", {}).get("data"))

    def assign(self, message_id: str, template_id: str) -> None:
        self.req("POST", API + "campaign-message-assign-template/", {"data": {
            "type": "campaign-message", "id": message_id,
            "relationships": {"template": {"data": {"type": "template", "id": template_id}}},
        }})

    def send(self, campaign_id: str) -> None:
        self.req("POST", API + "campaign-send-jobs/", {
            "data": {"type": "campaign-send-job", "id": campaign_id}
        })


def save_state(path: Path, state: dict) -> None:
    data = json.dumps(state, ensure_ascii=False, indent=2) + "\n"
    temporary = path.with_suffix(".tmp")
    temporary.write_text(data, encoding="utf-8")
    temporary.replace(path)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["preview", "draft", "send"], default="preview")
    parser.add_argument("--preview-ids", default="", help="Comma-separated existing IDs for a non-sending visual preview")
    parser.add_argument("--skip-live-check", action="store_true")
    parser.add_argument("--output-dir", default="artifacts/new-release-email")
    args = parser.parse_args()
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    state = json.loads(STATE_PATH.read_text(encoding="utf-8"))
    if not isinstance(catalog, list) or not isinstance(state.get("announced_ids"), list):
        raise RuntimeError("Invalid catalog or release state")
    books = eligible(catalog, state)
    demo = False
    if args.preview_ids:
        ids = {s.strip() for s in args.preview_ids.split(",") if s.strip()}
        books = [b for b in catalog if b.get("id") in ids and b.get("status") == "published"]
        demo = True
        if not books or len(books) != len(ids):
            raise RuntimeError("Preview IDs must refer to published books")
        if args.mode != "preview":
            raise RuntimeError("Preview IDs can only be used in preview mode")
    if not books:
        print("No new published books. Nothing to announce.")
        return 0
    out = ROOT / args.output_dir
    out.mkdir(parents=True, exist_ok=True)
    subject, preview, markup, plain = render_email(books)
    (out / "newsletter.html").write_text(markup, encoding="utf-8")
    (out / "newsletter.txt").write_text(plain, encoding="utf-8")
    (out / "manifest.json").write_text(json.dumps({
        "mode": args.mode, "demo": demo, "subject": subject,
        "ids": [b["id"] for b in books],
        "urls": [tracked_link(b) for b in books],
    }, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("Prepared:", ", ".join(b["id"] for b in books))
    if args.mode == "preview":
        print("Preview only: no Klaviyo API calls or state changes.")
        return 0
    if args.mode == "send" and os.environ.get("RELEASE_EMAIL_ALLOW_SEND") != "YES_I_APPROVE":
        raise RuntimeError("Automatic send requires RELEASE_EMAIL_ALLOW_SEND=YES_I_APPROVE")
    key = os.environ.get("KLAVIYO_PRIVATE_API_KEY", "").strip()
    if not key:
        print("KLAVIYO_PRIVATE_API_KEY missing: generated previews only; no email/draft created.")
        return 0
    if not args.skip_live_check:
        assert_public_pages(books)
    api = Klaviyo(key)
    name = campaign_name(books)
    campaign = api.find_campaign(name)
    if campaign is None:
        campaign = api.create_campaign(name, subject, preview)
        print("Created Klaviyo draft", campaign["id"])
    else:
        print("Reusing existing Klaviyo campaign", campaign["id"])
    message_id = api.get_message(campaign)
    if not api.has_template(message_id):
        template_id = api.template(name + " | HTML", markup, plain)
        api.assign(message_id, template_id)
        print("Assigned HTML template", template_id)
    current_status = str(campaign.get("attributes", {}).get("status", "")).lower()
    if args.mode == "send" and current_status not in ("sent", "sending", "scheduled"):
        api.send(campaign["id"])
        current_status = "send_requested"
    elif args.mode == "send":
        print("Campaign already sent/processing; no repeat send.")
    else:
        current_status = "draft"
    existing_ids = set(state["announced_ids"])
    state["announced_ids"] = sorted(existing_ids | {b["id"] for b in books})
    state.setdefault("campaigns", []).append({
        "idempotency_key": campaign_key(books),
        "book_ids": [b["id"] for b in books],
        "campaign_id": campaign["id"],
        "status": current_status,
        "recorded_utc": datetime.now(timezone.utc).isoformat(),
    })
    save_state(STATE_PATH, state)
    print("Updated release ledger for", len(books), "book(s).")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, ValueError, RuntimeError, urllib.error.URLError) as exc:
        print("RELEASE EMAIL ERROR:", exc, file=sys.stderr)
        sys.exit(1)
