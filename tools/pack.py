# Packt ein freigestelltes Sheet zum Spielsheet (8 Richtungen x 7 Laufbilder). Nutzung: python3 tools/pack.py <tag> <maßstab>
import cv2, numpy as np, json, sys
from PIL import Image
tag, SCALE = sys.argv[1], float(sys.argv[2])
R_IN = int(sys.argv[3]) if len(sys.argv) > 3 else 8     # Richtungen im Quell-Sheet (7 = ohne Süd-West)
C_IN = int(sys.argv[4]) if len(sys.argv) > 4 else 7     # Laufbilder
SC = '/tmp/claude-0/-home-user-Benne/f5e1a4b9-a4b0-5f24-aa82-26c1ebeac27f/scratchpad/'
src = cv2.imread(f'assets/mon/{tag}.png', cv2.IMREAD_UNCHANGED)[:, :, :3]
lab = np.load(SC + tag + '_lab.npy'); comps = json.load(open(SC + tag + '_comps.json'))
def cluster(v, n):
    v = np.array(v, np.float32).reshape(-1, 1)
    _, l, ctr = cv2.kmeans(v, n, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 100, 0.01), 5, cv2.KMEANS_PP_CENTERS)
    return sorted(float(c) for c in ctr.ravel())
rows = cluster([c[7] for c in comps], R_IN); cols = cluster([c[6] for c in comps], C_IN)
grid = {}
for c in comps:
    r = int(np.argmin([abs(c[7] - y) for y in rows])); k = int(np.argmin([abs(c[6] - x) for x in cols]))
    grid.setdefault((r, k), []).append(c)
assert len(grid) == R_IN * C_IN, len(grid)
best = {rk: max(v, key=lambda c: c[4]) for rk, v in grid.items()}
bottom = {r: float(np.median([best[(r, k)][1] + best[(r, k)][3] for k in range(C_IN)])) for r in range(R_IN)}
colx = {k: float(np.median([best[(r, k)][0] + best[(r, k)][2] / 2 for r in range(R_IN)])) for k in range(C_IN)}
# Größenabgleich: jede Blickrichtung wird so skaliert, dass die wahrgenommene Größe (Wurzel der Fläche) gleich ist
area = {r: float(np.mean([best[(r, k)][4] for k in range(C_IN)])) ** 0.5 for r in range(R_IN)}
ref = float(np.median(list(area.values())))
ROWSC = {r: float(np.clip(ref / area[r], 0.8, 1.25)) for r in range(R_IN)}
print(tag, 'Zeilen-Faktoren', {r: round(v, 2) for r, v in ROWSC.items()})
# Ausschnitt automatisch so groß, dass jede Figur hineinpasst
AX_W = int(max(max(colx[k] - best[(r, k)][0], best[(r, k)][0] + best[(r, k)][2] - colx[k]) for (r, k) in best)) + 3
UP = int(max(bottom[r] - best[(r, k)][1] for (r, k) in best)) + 3
DOWN = 12
SMAX = SCALE * max(ROWSC.values())
CW, CH = int((2 * AX_W) * SMAX) + 2, int((UP + DOWN) * SMAX) + 2
ANCH = (CW // 2, int(UP * SMAX) + 1)
print(tag, 'Zelle', CW, CH, 'Anker', ANCH, 'Figurhöhe ~', int(max(bottom[r] - best[(r, 0)][1] for r in range(R_IN)) * SCALE))
cells = []
for r in range(R_IN):
    for k in range(C_IN):
        c = best[(r, k)]
        m = (lab == c[5]).astype(np.uint8)
        ax, ay = int(round(colx[k])), int(round(bottom[r])); x0, y0 = ax - AX_W, ay - UP
        crop = np.zeros((UP + DOWN, 2 * AX_W, 4), np.float32)
        sx0, sy0 = max(0, x0), max(0, y0); sx1, sy1 = min(src.shape[1], x0 + 2 * AX_W), min(src.shape[0], y0 + UP + DOWN)
        crop[sy0 - y0:sy1 - y0, sx0 - x0:sx1 - x0, :3] = src[sy0:sy1, sx0:sx1]
        crop[sy0 - y0:sy1 - y0, sx0 - x0:sx1 - x0, 3] = m[sy0:sy1, sx0:sx1] * 255
        a = crop[:, :, 3]
        pm = crop[:, :, :3] * (a[:, :, None] / 255)
        sc = SCALE * ROWSC[r]
        tw, th = max(1, int(round(2 * AX_W * sc))), max(1, int(round((UP + DOWN) * sc)))
        sp_ = cv2.resize(pm, (tw, th), interpolation=cv2.INTER_AREA); sa_ = cv2.resize(a / 255, (tw, th), interpolation=cv2.INTER_AREA)
        small_pm = np.zeros((CH, CW, 3), np.float32); small_a = np.zeros((CH, CW), np.float32)
        ox, oy = int(round(ANCH[0] - AX_W * sc)), int(round(ANCH[1] - UP * sc))   # Fußpunkt bleibt auf dem Anker
        x0c, y0c = max(0, ox), max(0, oy); x1c, y1c = min(CW, ox + tw), min(CH, oy + th)
        small_pm[y0c:y1c, x0c:x1c] = sp_[y0c - oy:y1c - oy, x0c - ox:x1c - ox]; small_a[y0c:y1c, x0c:x1c] = sa_[y0c - oy:y1c - oy, x0c - ox:x1c - ox]
        cells.append((r, k, small_pm / np.maximum(small_a[:, :, None], 1e-3), small_a))
pix = np.concatenate([c[2][c[3] > 0.55] for c in cells]).astype(np.float32)
rng = np.random.default_rng(1); sample = pix[rng.choice(len(pix), min(len(pix), 60000), replace=False)]
_, _, pal = cv2.kmeans(sample, 44, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 60, 0.1), 3, cv2.KMEANS_PP_CENTERS)
pal = pal.astype(np.float32)
sheet = np.zeros((8 * CH, C_IN * CW, 4), np.uint8)
for r, k, col, a in cells:
    idx = np.argmin(((col[:, :, None, :] - pal[None, None, :, :]) ** 2).sum(axis=3), axis=2)
    rgb = pal[idx][:, :, ::-1]
    sheet[r * CH:(r + 1) * CH, k * CW:(k + 1) * CW] = np.dstack([rgb.astype(np.uint8), (a > 0.5).astype(np.uint8) * 255])
if R_IN == 7:   # fehlende Richtung Süd-West (Zeile 7) = gespiegeltes Süd-Ost (Zeile 1)
    for k in range(C_IN):
        sheet[7 * CH:8 * CH, k * CW:(k + 1) * CW] = sheet[1 * CH:2 * CH, k * CW:(k + 1) * CW][:, ::-1]
Image.fromarray(sheet, 'RGBA').save(f'src/gfx/img/{tag}.png')
json.dump({'cw': CW, 'ch': CH, 'ax': ANCH[0], 'ay': ANCH[1], 'rows': 8, 'cols': C_IN}, open(f'src/gfx/img/{tag}.json', 'w'))
prev = Image.new('RGBA', (sheet.shape[1], sheet.shape[0]), (110, 190, 80, 255)); prev.alpha_composite(Image.fromarray(sheet, 'RGBA'))
prev.crop((0, 0, C_IN * CW, 8 * CH)).resize((C_IN * CW * 2, 8 * CH * 2), Image.NEAREST).save(SC + tag + '_prev.png')
