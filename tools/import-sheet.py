#!/usr/bin/env python3
"""Importiert ein Monster-Sheet (7 Zeilen S,SO,O,NO,N,NW,W x 8 Spalten, große PNG) in das Spielformat
(8 Zeilen, Südwest = gespiegeltes Südost, kleine Zellen, scharfe Kanten).
Figuren werden als zusammenhängende Flächen über das ganze Bild gesucht (ragen Teile über den Zellrand, bleiben sie ganz)
und dann der Rasterzelle ihres Schwerpunkts zugeordnet.
Aufruf: import-sheet.py <png> <id> <zielgröße>   (Zielgröße = Maß in Pixeln, etwa 44/54/66)"""
import sys, json, numpy as np
from PIL import Image, ImageOps
from scipy import ndimage as ndi
src, mid, target = sys.argv[1], sys.argv[2], float(sys.argv[3])
im = Image.open(src).convert('RGBA'); W, H = im.size
COLS, ROWS = 8, 7
arr = np.array(im); alpha = arr[..., 3] > 40
cw, ch = W / COLS, H / ROWS
def components(it):
    lab, n = ndi.label(ndi.binary_dilation(alpha, iterations=it) if it else alpha)
    return lab, n
for it in (7, 5, 3, 2, 1, 0):          # so stark verbinden, wie es geht, ohne Nachbarfiguren zu verschmelzen
    lab, n = components(it)
    objs = ndi.find_objects(lab)
    if all((o[1].stop - o[1].start) <= 1.3 * cw and (o[0].stop - o[0].start) <= 1.3 * ch for o in objs): break
cellmask = {}
for i in range(1, n + 1):
    m = (lab == i) & alpha
    if m.sum() < 300: continue                               # Splitter ignorieren
    ys, xs = np.where(m)
    c = min(COLS - 1, int(xs.mean() / cw)); r = min(ROWS - 1, int(ys.mean() / ch))
    cellmask[(r, c)] = cellmask.get((r, c), np.zeros_like(alpha)) | m
miss = [(r, c) for r in range(ROWS) for c in range(COLS) if (r, c) not in cellmask]
if miss: print('WARNUNG: Zellen ohne Figur:', miss)
def crop_of(m):
    ys, xs = np.where(m); x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    sub = arr[y0:y1, x0:x1].copy(); sub[..., 3] = np.where(m[y0:y1, x0:x1], sub[..., 3], 0)
    return Image.fromarray(sub)
crops = {k: crop_of(m) for k, m in cellmask.items()}
metric = [max(c.height, 0.75 * c.width) for c in crops.values()]
k = target / float(np.median(metric))
smalls = {}
for key, c in crops.items():
    s = c.resize((max(1, round(c.width * k)), max(1, round(c.height * k))), Image.LANCZOS)
    a = np.array(s); a[..., 3] = np.where(a[..., 3] >= 120, 255, 0); smalls[key] = Image.fromarray(a)
mw = max(s.width for s in smalls.values()); mh = max(s.height for s in smalls.values())
OW = int(mw + 8 + (mw % 2)); OH = int(mh + 10); AX, AY = OW // 2, OH - 5
sheet = Image.new('RGBA', (OW * COLS, OH * 8), (0, 0, 0, 0))
def foot(s):
    a = np.array(s)[..., 3] > 0; lo = a[int(s.height * 0.75):]
    return float(np.where(lo.any(0))[0].mean()) if lo.any() else s.width / 2
for (r, c), s in smalls.items():
    fx = foot(s); sheet.alpha_composite(s, (c * OW + int(round(AX - fx)), r * OH + AY - s.height))
    if r == 1:   # Südwest = gespiegeltes Südost
        mir = ImageOps.mirror(s); sheet.alpha_composite(mir, (c * OW + int(round(AX - (s.width - 1 - fx))), 7 * OH + AY - s.height))
sheet = sheet.quantize(colors=56, method=Image.FASTOCTREE, dither=Image.NONE)   # Palette: kleiner und pixelartiger
sheet.save(f'src/gfx/img/{mid}.png', optimize=True)
json.dump({'cw': OW, 'ch': OH, 'ax': AX, 'ay': AY, 'rows': 8, 'cols': COLS}, open(f'src/gfx/img/{mid}.json', 'w'))
hs = sorted(s.height for s in smalls.values()); ws = sorted(s.width for s in smalls.values())
print(f'{mid}: Zelle {OW}x{OH} Skala {k:.3f} | Höhe Median {hs[len(hs)//2]} max {hs[-1]} | Breite Median {ws[len(ws)//2]} max {ws[-1]}')
