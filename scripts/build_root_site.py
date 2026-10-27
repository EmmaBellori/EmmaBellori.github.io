#!/usr/bin/env python3
"""Build the Emma Bellori Books GitHub Pages site for the account root.

The source repository historically publishes as a project site at
https://emmabellori.github.io/emma-bellori-books/.

When the repository is renamed to EmmaBellori.github.io, this build:
1. copies the static site to _site;
2. rewrites absolute SEO/site URLs to https://emmabellori.github.io/;
3. generates legacy redirect pages for URLs listed in sitemap.xml;
4. generates a 404 fallback that redirects old /emma-bellori-books/ paths.
"""

from __future__ import annotations

import html
import json
import shutil
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "_site"

OLD_ROOT = "https://emmabellori.github.io/emma-bellori-books/"
OLD_ROOT_NO_SLASH = OLD_ROOT.rstrip("/")
NEW_ROOT = "https://emmabellori.github.io/"
NEW_ROOT_NO_SLASH = NEW_ROOT.rstrip("/")
OLD_PATH_PREFIX = "/emma-bellori-books/"

TEXT_EXTENSIONS = {
    ".html", ".htm", ".js", ".json", ".xml", ".txt", ".md", ".css", ".yml", ".yaml"
}
EXCLUDED_TOP_LEVEL = {".git", ".github", "_site"}


def legacy_urls_from_sitemap() -> list[tuple[str, str]]:
    sitemap = ROOT / "sitemap.xml"
    if not sitemap.exists():
        return [("", NEW_ROOT)]

    tree = ET.parse(sitemap)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    redirects: list[tuple[str, str]] = []

    for loc in tree.findall("sm:url/sm:loc", ns):
        if not loc.text:
            continue
        url = loc.text.strip()
        if not url.startswith(OLD_ROOT):
            continue
        relative = url[len(OLD_ROOT):]
        target = NEW_ROOT + relative
        redirects.append((relative, target))

    if not any(relative == "" for relative, _ in redirects):
        redirects.insert(0, ("", NEW_ROOT))
    return redirects


def copy_source() -> None:
    if DEST.exists():
        shutil.rmtree(DEST)
    DEST.mkdir(parents=True)

    for item in ROOT.iterdir():
        if item.name in EXCLUDED_TOP_LEVEL:
            continue
        target = DEST / item.name
        if item.is_dir():
            shutil.copytree(item, target)
        else:
            shutil.copy2(item, target)

    # Build tooling should not be part of the public site artifact.
    shutil.rmtree(DEST / "scripts", ignore_errors=True)


def rewrite_absolute_urls() -> None:
    for path in DEST.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in TEXT_EXTENSIONS:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        updated = text.replace(OLD_ROOT, NEW_ROOT).replace(OLD_ROOT_NO_SLASH, NEW_ROOT_NO_SLASH)
        if updated != text:
            path.write_text(updated, encoding="utf-8")


def redirect_document(target: str) -> str:
    escaped_target = html.escape(target, quote=True)
    js_target = json.dumps(target)
    return f"""<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\">
  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">
  <title>Emma Bellori Books — Page moved</title>
  <meta name=\"robots\" content=\"noindex,follow\">
  <link rel=\"canonical\" href=\"{escaped_target}\">
  <meta http-equiv=\"refresh\" content=\"0; url={escaped_target}\">
  <script>window.location.replace({js_target} + window.location.search + window.location.hash);</script>
</head>
<body>
  <p>This page has moved to <a href=\"{escaped_target}\">{escaped_target}</a>.</p>
</body>
</html>
"""


def generate_legacy_redirects(redirects: list[tuple[str, str]]) -> None:
    legacy_root = DEST / "emma-bellori-books"
    legacy_root.mkdir(parents=True, exist_ok=True)

    for relative, target in redirects:
        if not relative:
            redirect_path = legacy_root / "index.html"
        else:
            redirect_path = legacy_root / relative
            if relative.endswith("/"):
                redirect_path = redirect_path / "index.html"
        redirect_path.parent.mkdir(parents=True, exist_ok=True)
        redirect_path.write_text(redirect_document(target), encoding="utf-8")


def generate_404() -> None:
    content = """<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\">
  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">
  <title>Page not found | Emma Bellori Books</title>
  <meta name=\"robots\" content=\"noindex,follow\">
  <script>
  (function () {
    var prefix = '/emma-bellori-books/';
    if (window.location.pathname.indexOf(prefix) === 0) {
      var nextPath = '/' + window.location.pathname.slice(prefix.length);
      window.location.replace(nextPath + window.location.search + window.location.hash);
    }
  }());
  </script>
</head>
<body>
  <main>
    <h1>Page not found</h1>
    <p>The page may have moved. Visit <a href=\"/\">Emma Bellori Books</a>.</p>
  </main>
</body>
</html>
"""
    (DEST / "404.html").write_text(content, encoding="utf-8")


def ensure_root_metadata_files() -> None:
    robots = DEST / "robots.txt"
    robots.write_text(
        "User-agent: *\nAllow: /\nSitemap: https://emmabellori.github.io/sitemap.xml\n",
        encoding="utf-8",
    )


def main() -> None:
    redirects = legacy_urls_from_sitemap()
    copy_source()
    rewrite_absolute_urls()
    generate_legacy_redirects(redirects)
    generate_404()
    ensure_root_metadata_files()
    print(f"Built root site at {DEST} with {len(redirects)} legacy redirects.")


if __name__ == "__main__":
    main()
