"""Builds the news story pages, sitemap.xml and robots.txt from data/news.json.

Each published story (its "publish" date has passed) gets its own page at
news/<id>/index.html, written as plain HTML so Google can read it. Run it whenever
data/news.json changes, and on the Thursday a new story becomes due:

    python scripts/build_news.py            # published stories only
    python scripts/build_news.py --preview  # every story, for checking locally (don't push this)

It also writes data/news_live.json, the list of stories whose pages are built and due.
assets/news.js only shows those, so a story's card never appears before its page exists
(the --preview pages are left out of that list).
"""
import datetime
import html
import json
import shutil
import sys
import urllib.parse
from pathlib import Path

SITE = 'https://kickstartyou.org'
ROOT = Path(__file__).resolve().parent.parent
NEWS = ROOT / 'news'
MARKER = '.generated'
WHATSAPP = 'https://whatsapp.com/channel/0029VbEMesjEquiK8Z1TzF3m'
STATIC_PAGES = ['', 'roles/', 'news/', 'about/', 'legal/']

ICONS = {
    'calendar': '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2"/>',
    'passport': '<rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="10" r="3.5"/><path d="M9 17h6"/>',
    'pound': '<path d="M17 20H7c1.5-1.5 2-3.5 2-6V8a4 4 0 0 1 7.5-2M6 13h8"/>',
    'briefcase': '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
}

e = html.escape


def pretty(iso):
    d = datetime.date.fromisoformat(iso)
    return f'{d.day} {d:%B %Y}'


def section(s):
    out = [f'<h2>{e(s["h"])}</h2>']
    out += [f'<p>{e(p)}</p>' for p in s.get('p', [])]
    if s.get('list'):
        out.append('<ul>' + ''.join(f'<li>{e(i)}</li>' for i in s['list']) + '</ul>')
    return '\n'.join(out)


def page(s):
    url = f'{SITE}/news/{s["id"]}/'
    # Link previews (WhatsApp, LinkedIn, Google) use the story's image when it has one.
    share_img = f'{SITE}/{s["image"]}' if s.get('image') else f'{SITE}/logo.png'
    share = 'https://wa.me/?text=' + urllib.parse.quote(f'{s["headline"]} {url}')
    jsonld = json.dumps({
        '@context': 'https://schema.org', '@type': 'NewsArticle',
        'headline': s['headline'], 'description': s['description'],
        'datePublished': s['publish'], 'dateModified': s.get('updated', s['publish']),
        'author': {'@type': 'Organization', 'name': 'KickStartYou', 'url': SITE},
        'publisher': {'@type': 'Organization', 'name': 'KickStartYou', 'logo': {'@type': 'ImageObject', 'url': f'{SITE}/logo.png'}},
        'mainEntityOfPage': url, 'image': share_img,
    }, ensure_ascii=False)
    also = (f'<br>Also see: <a href="{e(s["alsoUrl"])}" target="_blank" rel="noopener">{e(s["alsoName"])}</a>'
            if s.get('alsoUrl') else '')
    icon = ICONS.get(s.get('icon'), ICONS['calendar'])
    # The story's own image (made in the Wednesday prep) if it has one, otherwise the drawn card.
    if s.get('image'):
        picture = (f'<img class="newsimg" src="../../{e(s["image"])}" alt="{e(s["headline"])}" width="1200" height="630">')
    else:
        picture = f'''<div class="newsimg" role="img" aria-label="{e(s["headline"])}"><div class="in"><div class="l">
<div><span class="lab">{e(s["topic"])}</span><div class="hl">{e(s["headline"])}</div></div></div>
<div class="r"><div class="circ"><svg viewBox="0 0 24 24" fill="none" stroke="#4b1e78" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{icon}</svg></div></div></div></div>'''
    body = '\n'.join(section(x) for x in s['sections'])
    return f'''<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(s["seoTitle"])} | KickStartYou</title>
<meta name="description" content="{e(s["description"])}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="KickStartYou">
<meta property="og:title" content="{e(s["headline"])}">
<meta property="og:description" content="{e(s["description"])}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{share_img}">
<meta name="twitter:card" content="{'summary_large_image' if s.get('image') else 'summary'}">
<meta property="article:published_time" content="{s["publish"]}">
<script type="application/ld+json">{jsonld}</script>
<link rel="icon" href="../../logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=DM+Sans:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="../../assets/site.css">
<script src="../../assets/site.js" defer></script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site"><div class="wrap">
<a class="logo" href="../../" aria-label="KickStartYou home"><img src="../../assets/logo-white.png" alt="KickStartYou" width="269" height="112"></a>
<nav class="main" aria-label="Main">
<a href="../../roles/">Roles tracker</a><a href="../" aria-current="page">News</a><a href="../../about/">About</a>
<a href="#" class="btn btn-white" data-open-signup>Subscribe<span class="long"> to The Weekly Kick</span></a>
</nav>
</div></header>

<main id="main">
<article class="wrap story" style="padding-top:48px">
<p class="eyebrow"><a href="../">News</a> · {pretty(s["date"])} · From The Weekly Kick</p>
<span class="tag solid">{e(s["topic"])}</span>
<h1 class="story-title">{e(s["headline"])}</h1>
{picture}
<div class="body">
<p class="intro-p">{e(s["intro"])}</p>
{body}
<h2>Where to check</h2>
<p>Read the official details: <a href="{e(s["sourceUrl"])}" target="_blank" rel="noopener">{e(s["sourceName"])}</a>{also}</p>
</div>
<p class="note">This isn't immigration advice. For your own situation, check gov.uk or a regulated immigration adviser.</p>
<div class="row" style="margin-top:20px"><a class="btn btn-green" target="_blank" rel="noopener" href="{share}">Share on WhatsApp</a><a class="btn" style="border-color:var(--purple);color:var(--purple)" href="../">More news</a></div>
</article>

<section class="wrap section"><div class="band circled">
<div><span class="pastelpill">Free · Every Thursday</span><h2>Read it <span style="color:var(--peri)">a week early</span></h2><p>Why wait a week? Subscribers get every story first, along with the roles you can't miss. Free, every Thursday.</p></div>
<a href="#" class="btn btn-white" data-open-signup>Subscribe</a>
</div></section>
</main>

<footer class="site"><div class="wrap">
<div class="cols">
<div><img src="../../assets/logo-white.png" alt="KickStartYou" width="187" height="78" style="height:78px;width:auto;display:block;margin-left:-12px"><p style="margin:8px 0 0;color:#d6d0de;font-size:15px">Free career support for Black African and Caribbean international students in the UK.</p></div>
<div class="col"><p class="h">Follow</p><a href="{WHATSAPP}" target="_blank" rel="noopener">WhatsApp channel</a><a href="https://www.linkedin.com/in/toluwani-sangosanya" target="_blank" rel="noopener">LinkedIn</a><a href="#" data-open-signup>The Weekly Kick</a></div>
<div class="col"><p class="h">Contact</p><a href="mailto:toluwani@kickstartyou.org">toluwani@kickstartyou.org</a><a href="../../legal/#privacy">Privacy</a><a href="../../legal/#terms">Terms</a><a href="../../legal/#cookies">Cookie policy</a><button type="button" data-cookie-settings>Cookie settings</button></div>
</div>
<p class="bottom">© 2026 KickStartYou. We don't give immigration advice.</p>
</div></footer>
</body>
</html>
'''


def main():
    preview = '--preview' in sys.argv
    today = datetime.date.today()
    stories = json.loads((ROOT / 'data' / 'news.json').read_text(encoding='utf-8'))['stories']
    live = [s for s in stories if preview or datetime.date.fromisoformat(s['publish']) <= today]

    keep = set()
    for s in live:
        folder = NEWS / s['id']
        folder.mkdir(parents=True, exist_ok=True)
        (folder / 'index.html').write_text(page(s), encoding='utf-8')
        (folder / MARKER).write_text('Made by scripts/build_news.py. Edit data/news.json instead.\n', encoding='utf-8')
        keep.add(s['id'])
    # Remove pages this script made earlier for stories that are no longer live.
    for folder in NEWS.iterdir():
        if folder.is_dir() and (folder / MARKER).exists() and folder.name not in keep:
            shutil.rmtree(folder)

    urls = [(f'{SITE}/{p}', None) for p in STATIC_PAGES] + [(f'{SITE}/news/{s["id"]}/', s['publish']) for s in live]
    sitemap = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    sitemap += [f'<url><loc>{u}</loc>' + (f'<lastmod>{d}</lastmod>' if d else '') + '</url>' for u, d in urls]
    sitemap.append('</urlset>')
    (ROOT / 'sitemap.xml').write_text('\n'.join(sitemap) + '\n', encoding='utf-8')
    published = [s['id'] for s in stories if datetime.date.fromisoformat(s['publish']) <= today]
    (ROOT / 'data' / 'news_live.json').write_text(
        json.dumps({'built': today.isoformat(), 'ids': published}, indent=1) + '\n', encoding='utf-8')
    (ROOT / 'robots.txt').write_text(
        'User-agent: *\nDisallow: /join/\nDisallow: /check-inbox/\nDisallow: /subscribed/\nDisallow: /thanks/\n'
        f'\nSitemap: {SITE}/sitemap.xml\n', encoding='utf-8')
    print(f'{len(live)} story page(s) built{" (preview: includes unpublished)" if preview else ""}: {", ".join(sorted(keep)) or "none"}')


if __name__ == '__main__':
    main()
