#!/usr/bin/env python3
"""Generate high-quality acquisition guides from structured editorial content.

Runs after build_root_site.py so output is static HTML in the Pages artifact.
"""
from __future__ import annotations

import html
import json
import re
from urllib.parse import urlencode
from collections import defaultdict
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "_site"
DATA = ROOT / "growth" / "guides.json"
SITE = "https://emmabellori.github.io/"

STYLE = """
.guide-wrap{max-width:850px;margin:0 auto;padding:42px 22px 70px}.guide-wrap h1{font-size:clamp(2rem,5vw,3.2rem);line-height:1.14}.guide-wrap h2{font-size:1.4rem;margin:32px 0 10px}.guide-wrap h3{font-size:1.08rem;margin:24px 0 8px}.guide-wrap p{line-height:1.75}.guide-wrap .intro{font-size:1.12rem}.guide-links{display:flex;flex-wrap:wrap;gap:12px;margin:26px 0}.guide-links a{display:inline-block;padding:12px 16px;border-radius:14px;background:#f5e7d4;color:#26383a;font-weight:650;text-decoration:none}.note{background:#fdf5e8;border-left:4px solid #e6b976;padding:14px 18px;border-radius:8px;margin:25px 0}.guide-meta{font-size:.9rem;color:#53605e}.guide-wrap .eyebrow{letter-spacing:.12em;text-transform:uppercase;font-size:.78rem;font-weight:700}.guide-breadcrumb{display:flex;flex-wrap:wrap;gap:7px;align-items:center;margin:0 0 22px;font-size:.9rem;color:#697572}.guide-breadcrumb a{color:#365c59;text-decoration:none;font-weight:650}.guide-breadcrumb a:hover{text-decoration:underline}.guide-extra{margin:24px 0;padding:20px 24px;border:1px solid #eadfd2;border-radius:18px;background:#fffdf9}.guide-extra h2{margin:0 0 8px;font-size:1.25rem}.guide-wrap a:focus-visible{outline:3px solid #146d78;outline-offset:3px}.growth-guide-list{max-width:1120px;margin:0 auto;padding:42px 22px 75px}.growth-guide-list h1{font-size:clamp(2rem,5vw,3.2rem)}.growth-cluster{margin:42px 0}.growth-cluster-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:18px}.growth-guide-card{border:1px solid #e9dfd3;border-radius:18px;padding:22px;background:#fffdf9}.growth-guide-card h3{margin:0 0 8px;font-size:1.08rem}.growth-guide-card p{line-height:1.55}.growth-guide-card a{font-weight:700}.growth-home-all-guides{margin:28px 0 0;text-align:center}.growth-home-all-guides a{font-weight:750}@media(max-width:600px){.guide-extra{padding:18px}}
"""


# Companion offers are relevant optional resources, never prerequisites for free guides.
# Match the verified Payhip listings on printables.html by canonical book ID.
PRINTABLES_BY_BOOK = {
    "mistakes": ("try-again", "Try Again Play Kit", "https://payhip.com/b/jShfF"),
    "play": ("room-for-you", "Room for You! Play Kit", "https://payhip.com/b/549Cv"),
    "mad": ("calm-down", "Calm Down & Play On Kit", "https://payhip.com/b/6wMl9"),
    "i-cant-sleep-without-you": ("bedtime", "Together at Bedtime", "https://payhip.com/b/5z6jW"),
    "cute-animals-bold-easy": ("cute-animals", "Cute Animal Friends — Color & Play", "https://payhip.com/b/2UsHd"),
    "bugs": ("bug-detective", "Little Bug Detectives — Explore & Create", "https://payhip.com/b/7kwUS"),
}


def esc(value: object) -> str:
    return html.escape(str(value or ""), quote=True)


def slug_url(slug: str) -> str:
    return SITE + "guides/" + slug + ".html"


def page_html(item: dict, published_books: dict[str, dict] | None = None) -> str:
    slug = item["slug"]
    title = item["title"]
    desc = item["description"]
    canonical = slug_url(slug)
    published_books = published_books or {}
    companion = ""
    product = PRINTABLES_BY_BOOK.get(item.get("book_id", ""))
    book = published_books.get(item.get("book_id", ""))
    if book and product and str(book.get("amazonUrl") or "").startswith("https://www.amazon.com/dp/"):
        kit_id, kit_name, kit_base = product
        kit_url = kit_base + "?" + urlencode({
            "utm_source": "emmabellori_site",
            "utm_medium": "referral",
            "utm_campaign": "growth_guide",
            "utm_content": slug,
        })
        companion = (
            '<section class="guide-extra guide-companion" aria-labelledby="companion-offers">'
            '<p class="eyebrow">KEEP EXPLORING</p>'
            '<h2 id="companion-offers">Try this topic with a story or an activity kit</h2>'
            '<p>Finished the free activity? Explore an optional story or hands-on printable '
            'for another small moment of practice together.</p>'
            '<div class="guide-links">'
            f'<a href="{esc(kit_url)}" data-product-id="{esc(kit_id)}" '
            f'data-placement="growth_guide_companion" target="_blank" rel="noopener noreferrer">'
            f'Explore {esc(kit_name)} on Payhip ↗</a>'
            f'<a href="{esc(book["amazonUrl"])}" data-book-id="{esc(book["id"])}" '
            'data-placement="growth_guide_companion" target="_blank" rel="noopener noreferrer">'
            f'View {esc(book["title"])} on Amazon ↗</a>'
            '</div>'
            '<p class="guide-meta">Optional purchases. The guide and its activities are free.</p>'
            '</section>'
        )
    sections = "".join(
        f'<section><h2>{esc(heading)}</h2><p>{esc(body)}</p></section>'
        for heading, body in item.get("sections", [])
    )
    structured = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Article",
                "@id": canonical + "#article",
                "headline": title,
                "description": desc,
                "author": {"@type": "Person", "name": "Emma Bellori"},
                "publisher": {"@type": "Organization", "name": "Emma Bellori Books", "url": SITE},
                "about": [item.get("cluster", "children and families"), item.get("book_title", "Emma Bellori Books")],
                "mainEntityOfPage": {"@type": "WebPage", "@id": canonical},
                "inLanguage": "en"
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Emma Bellori Books", "item": SITE},
                    {"@type": "ListItem", "position": 2, "name": "Free Guides", "item": SITE + "guides/"},
                    {"@type": "ListItem", "position": 3, "name": title, "item": canonical}
                ]
            }
        ]
    }
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)} | Emma Bellori Books</title><meta name="description" content="{esc(desc)}"><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1"><link rel="canonical" href="{esc(canonical)}">
<meta property="og:type" content="article"><meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(desc)}"><meta property="og:url" content="{esc(canonical)}"><meta property="og:site_name" content="Emma Bellori Books"><meta name="twitter:card" content="summary"><link rel="icon" href="../favicon.png" type="image/png"><link rel="stylesheet" href="../style.css"><style>{STYLE}</style><script type="application/ld+json">{json.dumps(structured, ensure_ascii=False, separators=(',', ':'))}</script></head>
<body><a class="skip-link" href="#article">Skip to article</a><header class="site-header"><a class="brand" href="../index.html#home"><img alt="" class="brand-logo" height="66" src="../images/emma-bellori-logo.webp" width="66"><span class="brand-label">Emma Bellori<span>BOOKS FOR CURIOUS MINDS</span></span></a><nav aria-label="Main navigation"><a href="../index.html#books">Book series</a><a href="index.html">Free guides</a><a href="../index.html#about">About</a></nav></header>
<main class="guide-wrap" id="article"><nav class="guide-breadcrumb" aria-label="Breadcrumb"><a href="../index.html">Home</a><span aria-hidden="true">/</span><a href="index.html">Free guides</a><span aria-hidden="true">/</span><span aria-current="page">{esc(item.get('cluster'))}</span></nav><p class="eyebrow">{esc(item.get('cluster')).upper()} · EMMA BELLORI BOOKS</p><h1>{esc(title)}</h1><p class="intro">{esc(item.get('intro'))}</p><p class="guide-meta">A practical guide for parents and caregivers</p>{sections}
<section class="guide-extra"><h2>{esc(item.get('activity_title'))}</h2><p>{esc(item.get('activity'))}</p></section>{companion}<section><h2>Frequently asked question</h2><h3>{esc(item.get('faq_q'))}</h3><p>{esc(item.get('faq_a'))}</p></section><div class="note"><strong>Every child is different.</strong> These general ideas are educational and are not a substitute for individualized professional support when a concern is persistent, severe or affects daily life.</div>
<section><h2>Explore a related story</h2><p>If this topic feels familiar in your family, <a href="{esc(item.get('book_url'))}">{esc(item.get('book_title'))}</a> offers a story-based way to explore the same theme together.</p><div class="guide-links"><a href="{esc(item.get('book_url'))}">Discover the book →</a><a href="{esc(item.get('hub'))}">Read the core guide →</a><a href="{esc(item.get('series_url'))}">Explore the collection →</a></div></section></main>
<footer><span>© Emma Bellori Books</span><span><a href="../index.html">Home</a> · <a href="https://www.amazon.com/author/emmabellori" rel="noopener noreferrer" target="_blank">Amazon Author Page</a></span></footer><script defer src="../analytics-consent.js"></script></body></html>'''


def make_index(items: list[dict]) -> str:
    groups: dict[str, list[dict]] = defaultdict(list)
    for item in items:
        groups[item.get("cluster", "More guides")].append(item)
    sections = []
    for cluster, entries in groups.items():
        cards = "".join(
            f'<article class="growth-guide-card"><h3><a href="{esc(x["slug"])}.html">{esc(x["title"])}</a></h3><p>{esc(x["description"])}</p><a href="{esc(x["slug"])}.html">Read guide →</a></article>'
            for x in entries
        )
        sections.append(f'<section class="growth-cluster"><p class="eyebrow">TOPIC COLLECTION</p><h2>{esc(cluster)}</h2><div class="growth-cluster-grid">{cards}</div></section>')
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Free Parenting & Activity Guides | Emma Bellori Books</title><meta name="description" content="Browse free practical guides from Emma Bellori Books about big feelings, friendship, confidence, bedtime and everyday learning."><meta name="robots" content="index,follow"><link rel="canonical" href="{SITE}guides/"><link rel="icon" href="../favicon.png"><link rel="stylesheet" href="../style.css"><style>{STYLE}</style></head><body><header class="site-header"><a class="brand" href="../index.html"><img alt="" class="brand-logo" src="../images/emma-bellori-logo.webp" width="66" height="66"><span class="brand-label">Emma Bellori<span>BOOKS FOR CURIOUS MINDS</span></span></a><nav aria-label="Main navigation"><a href="../index.html#books">Book series</a><a href="../index.html#about">About</a></nav></header><main class="growth-guide-list"><p class="eyebrow">FREE EMMA BELLORI RESOURCES</p><h1>Guides for everyday childhood moments</h1><p>Practical, low-pressure ideas for parents and caregivers. Start with the problem you are trying to solve, then explore a related story if it helps your family continue the conversation.</p>{''.join(sections)}</main><footer><span>© Emma Bellori Books</span><span><a href="../index.html">Home</a></span></footer><script defer src="../analytics-consent.js"></script></body></html>'''


def add_hub_links(items: list[dict]) -> None:
    by_hub: dict[str, list[dict]] = defaultdict(list)
    for item in items:
        by_hub[item["hub"]].append(item)
    for hub, entries in by_hub.items():
        path = DEST / "guides" / hub
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        if 'data-growth-cluster="true"' in text:
            continue
        links = "".join(f'<a href="{esc(x["slug"])}.html">{esc(x["title"])}</a>' for x in entries)
        block = f'<section class="guide-extra" data-growth-cluster="true"><h2>Explore this topic further</h2><p>Choose the situation that is closest to what your family is experiencing.</p><div class="guide-links">{links}</div></section>'
        text = text.replace("</main>", block + "</main>", 1)
        path.write_text(text, encoding="utf-8")


def add_home_link() -> None:
    path = DEST / "index.html"
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    if 'class="growth-home-all-guides"' in text:
        return
    marker = '\n    </section>\n\n    <section class="home-about-strip"'
    if marker in text:
        insert = '\n      <p class="growth-home-all-guides"><a href="guides/index.html">Browse all free guides →</a></p>'
        text = text.replace(marker, insert + marker, 1)
        path.write_text(text, encoding="utf-8")


def update_sitemap(items: list[dict]) -> None:
    path = DEST / "sitemap.xml"
    if not path.exists():
        return
    ET.register_namespace('', 'http://www.sitemaps.org/schemas/sitemap/0.9')
    tree = ET.parse(path)
    root = tree.getroot()
    ns = {'sm': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    existing = {loc.text for loc in root.findall('sm:url/sm:loc', ns) if loc.text}
    urls = [SITE + 'guides/'] + [slug_url(x['slug']) for x in items]
    for url in urls:
        if url in existing:
            continue
        node = ET.SubElement(root, '{http://www.sitemaps.org/schemas/sitemap/0.9}url')
        ET.SubElement(node, '{http://www.sitemaps.org/schemas/sitemap/0.9}loc').text = url
    tree.write(path, encoding='utf-8', xml_declaration=True)


def main() -> None:
    items = json.loads(DATA.read_text(encoding="utf-8"))
    published_books = {
        book["id"]: book
        for book in json.loads((ROOT / "catalog.json").read_text(encoding="utf-8"))
        if book.get("status") == "published" and book.get("id")
    }
    guides_dir = DEST / "guides"
    guides_dir.mkdir(parents=True, exist_ok=True)
    for item in items:
        (guides_dir / f"{item['slug']}.html").write_text(page_html(item, published_books), encoding="utf-8")
    (guides_dir / "index.html").write_text(make_index(items), encoding="utf-8")
    add_hub_links(items)
    add_home_link()
    update_sitemap(items)
    print(f"Generated {len(items)} growth guides plus the free-guides hub.")


if __name__ == "__main__":
    main()
