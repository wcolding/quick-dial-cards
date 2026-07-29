#!/usr/bin/env python3
"""Generate index.html (fast-lookup app) from print.html (canonical deck).

Card content is extracted VERBATIM from the print deck — this script never
rewrites procedures. Edit print.html (via the normal deck pipeline), then run:
    python3 tools/build_app.py
"""
import re, html, pathlib, urllib.parse

ROOT = pathlib.Path(__file__).resolve().parent.parent
src = (ROOT / "print.html").read_text(encoding='utf-8')

BRANDS = ["Sennheiser", "Shure", "Sony", "Wisycom", "Lectrosonics",
          "Comtek", "Sound Devices", "Zaxcom", "Teradek"]

def slugify(t):
    t = re.sub(r"&[a-z]+;", " ", t)
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", t.lower())).strip("-")

cards = []
for sheet in src.split('<section class="sheet">')[1:]:
    h1 = re.search(r"<h1>(.*?)</h1>", sheet, re.S).group(1)
    h1 = re.sub(r"\s+", " ", h1).strip()
    h1 = html.unescape(h1)
    if h1.startswith("Wireless Quick-Dial"):
        continue  # index/legend page — the app home replaces it
    subm = re.search(r'<div class="sub">(.*?)</div>', sheet, re.S)
    sub = re.sub(r"\s+", " ", subm.group(1)).strip() if subm else ""
    body = re.search(r'(<div class="meta">.*?)\s*<footer class="foot">', sheet, re.S).group(1)
    brand = next((b for b in BRANDS if h1.startswith(b)), 'Reference')
    model = h1[len(brand):].strip() if brand != 'Reference' else h1
    badge = re.search(r'<span class="tag ([a-z-]+)">([^<]*)</span>', body)
    cards.append(dict(slug=slugify(h1), title=h1, brand=brand, model=model,
                      sub=sub, body=body,
                      badgecls=badge.group(1), badgetxt=badge.group(2)))

assert len(cards) == 25, f"expected 16 cards, got {len(cards)}"

ISSUE = "https://github.com/gothamsound/quick-dial-cards/issues/new"
sections = []
for c in cards:
    fix = f"{ISSUE}?template=suggest-change.yml&card={urllib.parse.quote(c['title'])}&title={urllib.parse.quote('[Card change]: ' + c['title'])}"
    mailbody = urllib.parse.quote(f"Card: {c['title']}\n\nWhat it says now:\n\nWhat it should say:\n\nSource:\n\nCredit me as (or say no thanks):\n")
    sections.append(f'''<section class="card" id="{c['slug']}" data-brand="{html.escape(c['brand'])}" data-model="{html.escape(c['model'])}" data-title="{html.escape(c['title'])}" data-badgecls="{c['badgecls']}" data-badgetxt="{html.escape(c['badgetxt'])}" hidden>
<div class="cardhead"><div class="ch-brand">{html.escape(c['brand'])}</div><h2>{html.escape(c['model'])}</h2><div class="ch-sub">{c['sub']}</div></div>
{c['body']}
<div class="cardfoot"><a href="{fix}" target="_blank" rel="noopener">Something wrong on this card? Suggest a fix →</a><br>No GitHub account (you really should)? <a href="mailto:peters@gothamsound.com?subject=quickdialchange&body={mailbody}">Email it here</a>.</div>
</section>''')

page = (ROOT / "template.html").read_text(encoding='utf-8')

out = page.replace("@@SECTIONS@@", "\n".join(sections))
(ROOT / "index.html").write_text(out, encoding='utf-8')
print(f"wrote index.html ({len(out)//1024} KB, {len(cards)} cards)")
