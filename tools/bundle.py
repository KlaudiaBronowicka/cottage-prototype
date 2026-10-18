#!/usr/bin/env python3
"""Optional: inline all CSS/JS into ONE html file (dist/cottage-prototype.html)
so it can be dropped on any static host or sent as a single file.
Art referenced by assets/manifest.js is inlined as data URIs (~4.5 MB).
Not needed to play — index.html works as is. Run: python3 tools/bundle.py"""
import os, re
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html = open(os.path.join(root, 'index.html'), encoding='utf-8').read()
def css(m): return '<style>\n' + open(os.path.join(root, m.group(1)), encoding='utf-8').read() + '\n</style>'
import base64, mimetypes
MIME = {'.webp': 'image/webp', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg'}
def datauri(m):
    p = os.path.join(root, m.group(1))
    if not os.path.exists(p): return m.group(0)
    return '"data:' + MIME[os.path.splitext(p)[1]] + ';base64,' + base64.b64encode(open(p, 'rb').read()).decode() + '"'
def js(m):
    src = open(os.path.join(root, m.group(1)), encoding='utf-8').read()
    if m.group(1) == 'assets/manifest.js':  # inline the art so the single file works anywhere
        src = re.sub(r'"(assets/art/[^"]+)"', datauri, src)
    return '<script>\n' + src.replace('</script', '<\\/script') + '\n</script>'
html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', css, html)
html = re.sub(r'<script src="([^"]+)"></script>', js, html)
os.makedirs(os.path.join(root, 'dist'), exist_ok=True)
out = os.path.join(root, 'dist', 'cottage-prototype.html')
open(out, 'w', encoding='utf-8').write(html)
print('wrote', out, len(html), 'bytes')
