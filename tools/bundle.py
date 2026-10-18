#!/usr/bin/env python3
"""Optional: inline all CSS/JS into ONE html file (dist/cottage-prototype.html)
so it can be dropped on any static host or sent as a single file.
Not needed to play — index.html works as is. Run: python3 tools/bundle.py"""
import os, re
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html = open(os.path.join(root, 'index.html'), encoding='utf-8').read()
def css(m): return '<style>\n' + open(os.path.join(root, m.group(1)), encoding='utf-8').read() + '\n</style>'
def js(m): return '<script>\n' + open(os.path.join(root, m.group(1)), encoding='utf-8').read().replace('</script', '<\\/script') + '\n</script>'
html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', css, html)
html = re.sub(r'<script src="([^"]+)"></script>', js, html)
os.makedirs(os.path.join(root, 'dist'), exist_ok=True)
out = os.path.join(root, 'dist', 'cottage-prototype.html')
open(out, 'w', encoding='utf-8').write(html)
print('wrote', out, len(html), 'bytes')
