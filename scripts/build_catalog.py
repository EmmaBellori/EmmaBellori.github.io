#!/usr/bin/env python3
"""Build catalog JS, new book landing pages, and sitemap from books.json. No dependencies."""
import json, re, html, sys
from pathlib import Path
from urllib.parse import urlparse
from xml.etree import ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
BASE='https://emmabellori.github.io/emma-bellori-books/'
ALLOWED={'feelings','friendship','explorers','activity','adult'}
def esc(x): return html.escape(str(x),quote=True)
def check(b,seen):
    required=('id','title','category','theme','description','cover','amazonUrl')
    for k in required:
        if not isinstance(b.get(k),str) or not b[k].strip(): raise ValueError(f"Book {b.get('id','?')}: missing {k}")
    slug=b['id']
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',slug) or slug in seen: raise ValueError('Invalid/duplicate id: '+slug)
    seen.add(slug)
    if b['category'] not in ALLOWED: raise ValueError(f'{slug}: category must be one of {sorted(ALLOWED)}')
    if not b['cover'].startswith('images/') or '..' in b['cover'] or not (ROOT/b['cover']).is_file(): raise ValueError(f'{slug}: missing cover file {b["cover"]}')
    u=urlparse(b['amazonUrl'])
    if u.scheme!='https' or u.hostname not in ('www.amazon.com','amazon.com'): raise ValueError(f'{slug}: use a verified Amazon.com https link')
    if b.get('format') is not None and not isinstance(b['format'],str): raise ValueError(f'{slug}: format must be text')
    if b.get('featured') is not None and not isinstance(b['featured'],bool): raise ValueError(f'{slug}: featured must be true/false')

def page(b):
    title,slug,desc,theme=map(esc,(b['title'],b['id'],b['description'],b['theme']))
    cover=esc('../'+b['cover']);amazon=esc(b['amazonUrl']);canonical=BASE+'books/'+slug+'.html';image=BASE+b['cover']
    ld={'@context':'https://schema.org','@type':'Book','name':b['title'],'author':{'@type':'Person','name':'Emma Bellori'},'image':image,'url':canonical,'inLanguage':'en','description':b['description'],'offers':{'@type':'Offer','url':b['amazonUrl']}}
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title} | Emma Bellori Books</title><meta name="description" content="{desc}"><link rel="canonical" href="{canonical}"><meta property="og:type" content="book"><meta property="og:title" content="{title} | Emma Bellori Books"><meta property="og:description" content="{desc}"><meta property="og:url" content="{canonical}"><meta property="og:image" content="{esc(image)}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="../favicon.png"><link rel="stylesheet" href="../style.css"><link rel="stylesheet" href="../book-pages.css"><script type="application/ld+json">{json.dumps(ld,ensure_ascii=False).replace('<','\\u003c')}</script></head><body><a class="skip-link" href="#book-content">Skip to book details</a><header class="site-header"><a class="brand" href="../index.html"><img class="brand-logo" alt="" src="../images/emma-bellori-logo.webp" width="66" height="66"><span class="brand-label">Emma Bellori<span>BOOKS FOR CURIOUS MINDS</span></span></a><nav aria-label="Main navigation"><a href="../index.html#books">All books</a><a href="../index.html#collections">Collections</a><a href="../index.html#about">About</a></nav></header><main class="detail-main" id="book-content"><a class="back-link" href="../index.html#books">← Back to all books</a><section class="detail-hero"><div class="detail-cover-art v4-cover"><img src="{cover}" alt="Cover of {title} by Emma Bellori" decoding="async" fetchpriority="high"></div><div class="detail-copy"><p class="eyebrow">EMMA BELLORI BOOKS</p><h1>{title}</h1><p class="detail-subtitle">{theme}</p><p class="lead">{desc}</p><a class="button primary-book-cta" href="{amazon}" target="_blank" rel="noopener noreferrer sponsored">See book on Amazon ↗</a><p class="fineprint">You will be redirected to Amazon.com for current formats, prices and availability.</p></div></section><section class="v4-info"><p class="eyebrow">EXPLORE THE BOOK</p><h2>About this book</h2><p>{desc}</p></section><div class="v4-bottom-cta"><p>Interested in <strong>{title}</strong>?</p><a class="button" href="{amazon}" target="_blank" rel="noopener noreferrer sponsored">View on Amazon ↗</a></div></main><footer><span>© Emma Bellori Books</span><span><a href="../index.html">Home</a> · <a href="https://www.amazon.com/author/emmabellori">Amazon Author Page</a></span></footer><script defer src="../analytics-consent.js"></script></body></html>'''

def main():
    books=json.loads((ROOT/'books.json').read_text(encoding='utf-8'))
    if not isinstance(books,list): raise ValueError('books.json must contain a list')
    seen=set()
    for b in books: check(b,seen)
    (ROOT/'books.js').write_text('/* Generated automatically from books.json. Do not edit. */\nwindow.EMMA_BOOKS = '+json.dumps(books,ensure_ascii=False,indent=2).replace('<','\\u003c')+';\n',encoding='utf-8')
    existing={'mistakes','play','bugs','mad','christmas','halloween'}
    for b in books:
        target=ROOT/'books'/f'{b["id"]}.html'
        if b['id'] not in existing: target.write_text(page(b),encoding='utf-8')
    ns='http://www.sitemaps.org/schemas/sitemap/0.9';ET.register_namespace('',ns)
    root=ET.Element('{'+ns+'}urlset')
    urls=[BASE]+[BASE+'books/'+b['id']+'.html' for b in books]+[BASE+str(f.relative_to(ROOT)).replace('\\','/') for f in sorted((ROOT/'guides').glob('*.html'))]
    for url in urls: ET.SubElement(ET.SubElement(root,'{'+ns+'}url'),'{'+ns+'}loc').text=url
    ET.ElementTree(root).write(ROOT/'sitemap.xml',encoding='utf-8',xml_declaration=True)
    print(f'Built {len(books)} books, {len(urls)} sitemap URLs')
if __name__=='__main__':
    try: main()
    except (ValueError,KeyError) as e: print('CATALOG ERROR:',e,file=sys.stderr);sys.exit(1)
