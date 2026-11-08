#!/usr/bin/env python3
"""Conservative static-site hardening for the GitHub Pages build.

These HTML meta directives are safe with the site's current JavaScript, consent,
Turnstile, GA4 and Klaviyo integrations. This is deliberately NOT a full
script-src CSP or a substitute for HTTP response headers / edge WAF rules.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "_site"
CSP = "object-src 'none'; base-uri 'self'; upgrade-insecure-requests"
SECURITY_META = (
    '<meta http-equiv="Content-Security-Policy" content="'
    + CSP + '">'
    '<meta name="referrer" content="strict-origin-when-cross-origin">'
)
# High-confidence credential patterns, not variable names or public API keys.
SECRET_PATTERNS = {
    "GitHub PAT": re.compile(r"\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b"),
    "GitHub fine-grained token": re.compile(r"\bgithub_pat_[A-Za-z0-9_]{70,}\b"),
    "Supabase secret API key": re.compile(r"\bsb_secret_[A-Za-z0-9_-]{20,}\b"),
    "Private key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "Stripe secret key": re.compile(r"\bsk_live_[A-Za-z0-9]{20,}\b"),
}
DANGEROUS_FILES = re.compile(
    r"(^|/)(?:\.env(?:\.[^/]+)?|id_(?:rsa|ed25519)|credentials(?:\.[^/]+)?|"
    r"service-account(?:\.[^/]+)?\.(?:json|pem)|[^/]+\.(?:pem|p12|pfx|key))$",
    re.I,
)
TEXT_EXTENSIONS = {".html", ".htm", ".js", ".json", ".css", ".xml", ".txt", ".md", ".yml", ".yaml", ".py"}
RE_URL = re.compile(r'''(?:src|href)\s*=\s*["'](http://[^"']+)["']''', re.I)


def scan_directory(directory: Path) -> list[str]:
    problems = []
    for path in directory.rglob("*"):
        if not path.is_file() or any(part in {".git", "__pycache__", "_site", ".venv"} for part in path.relative_to(directory).parts):
            continue
        relative = path.relative_to(directory).as_posix()
        if DANGEROUS_FILES.search(relative):
            problems.append(f"{relative}: credential-like filename must not be committed or deployed")
        if path.suffix.lower() not in TEXT_EXTENSIONS:
            continue
        try:
            contents = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        for label, pattern in SECRET_PATTERNS.items():
            if pattern.search(contents):
                problems.append(f"{relative}: possible {label} exposure (redacted)")
        if path.suffix.lower() in {".html", ".htm"} and RE_URL.search(contents):
            problems.append(f"{relative}: insecure http:// link or asset")
    return problems


def harden_html() -> int:
    if not OUT.is_dir():
        raise RuntimeError("No _site/ build output; run the Pages builder first")
    modified = 0
    for path in OUT.rglob("*.html"):
        html = path.read_text(encoding="utf-8")
        if ('http-equiv="Content-Security-Policy"' in html and
                'name="referrer"' in html):
            continue
        match = re.search(r"</head\s*>", html, re.I)
        if not match:
            continue
        # This is deliberately inserted before </head>, after any existing metadata.
        html = html[:match.start()] + SECURITY_META + html[match.start():]
        path.write_text(html, encoding="utf-8")
        modified += 1
    return modified


def main() -> int:
    # Scan source first (including all public files but not generated _site).
    issues = scan_directory(ROOT)
    if issues:
        for issue in issues:
            print("SECURITY CHECK:", issue, file=sys.stderr)
        return 1
    if "--scan-only" in sys.argv:
        print("Repository secret and insecure-URL checks passed.")
        return 0
    count = harden_html()
    # Scan output separately so future build steps cannot add secrets afterward.
    # scan_directory ignores _site subfolders only relative to the supplied root.
    issues = scan_directory(OUT)
    if issues:
        for issue in issues:
            print("DEPLOY BLOCKED:", issue, file=sys.stderr)
        return 1
    print(f"Site security metadata applied to {count} HTML pages; no credential-like artifacts found.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
