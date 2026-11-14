# Packt die freigestellten Figuren zu einem Spielsheet (8 Richtungen x 7 Laufbilder)
import cv2, numpy as np, json
from PIL import Image
SC = '/tmp/claude-0/-home-user-Benne/f5e1a4b9-a4b0-5f24-aa82-26c1ebeac27f/scratchpad/'
src = cv2.imread('assets/mon/sheet.png', cv2.IMREAD_UNCHANGED)[:, :, :3]
lab = np.load(SC + 'lab.npy'); comps = json.load(open(SC + 'comps.json'))
# Gitter: Reihen nach y, Spalten nach x clustern
ys = sorted(c[7] for c in comps); xs = sorted(c[6] for c in comps)
def cluster(v, n):
    v = np.array(v, np.float32).reshape(-1, 1)
    _, l, ctr = cv2.kmeans(v, n, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 100, 0.01), 5, cv2.KMEANS_PP_CENTERS)
    return sorted(float(c) for c in ctr.ravel())
rows = cluster(ys, 8); cols = cluster(xs, 7)
grid = {}
for c in comps:
    r = int(np.argmin([abs(c[7] - y) for y in rows])); k = int(np.argmin([abs(c[6] - x) for x in cols]))
    grid.setdefault((r, k), []).append(c)
print('Zellen', len(grid), 'doppelt:', [k for k, v in grid.items() if len(v) > 1])
SCALE = 0.37
AX_W, UP, DOWN = 84, 138, 12            # Ausschnitt um den Fußpunkt (Sheet-Pixel)
CW, CH = int((2 * AX_W) * SCALE) + 1, int((UP + DOWN) * SCALE) + 1
ANCH = (CW // 2, int(UP * SCALE))
print('Zelle', CW, CH, 'Anker', ANCH)
# Fußpunkt je Reihe: Median der Unterkanten; x je Spalte: Median der Mittelpunkte
bottom = {r: float(np.median([max(v, key=lambda c: c[4])[1] + max(v, key=lambda c: c[4])[3] for (rr, k), v in grid.items() if rr == r])) for r in range(8)}
colx = {k: float(np.median([max(v, key=lambda c: c[4])[0] + max(v, key=lambda c: c[4])[2] / 2 for (r, kk), v in grid.items() if kk == k])) for k in range(7)}
cells = []
for r in range(8):
    for k in range(7):
        c = max(grid[(r, k)], key=lambda c: c[4])
        m = (lab == c[5]).astype(np.uint8)
        # Schattenreste unter den Füßen entfernen: unterste Zeilen nur behalten, wenn sie hell/dunkel genug
        bgr = src.copy()
        ax, ay = int(round(colx[k])), int(round(bottom[r])) - 6
        x0, y0 = ax - AX_W, ay - UP
        crop = np.zeros((UP + DOWN, 2 * AX_W, 4), np.float32)
        sx0, sy0 = max(0, x0), max(0, y0); sx1, sy1 = min(src.shape[1], x0 + 2 * AX_W), min(src.shape[0], y0 + UP + DOWN)
        crop[sy0 - y0:sy1 - y0, sx0 - x0:sx1 - x0, :3] = bgr[sy0:sy1, sx0:sx1]
        crop[sy0 - y0:sy1 - y0, sx0 - x0:sx1 - x0, 3] = m[sy0:sy1, sx0:sx1] * 255
        # Rand der Maske leicht erodieren (Halo-Saum weg)
        a = cv2.erode(crop[:, :, 3].astype(np.uint8), np.ones((3, 3), np.uint8)).astype(np.float32)
        # farbe vormultipliziert herunterskalieren
        pm = crop[:, :, :3] * (a[:, :, None] / 255)
        small_pm = cv2.resize(pm, (CW, CH), interpolation=cv2.INTER_AREA)
        small_a = cv2.resize(a / 255, (CW, CH), interpolation=cv2.INTER_AREA)
        col = small_pm / np.maximum(small_a[:, :, None], 1e-3)
        cells.append((r, k, col, small_a))
# globale Palette (k-means über alle sichtbaren Pixel)
pix = np.concatenate([c[2][c[3] > 0.55] for c in cells]).astype(np.float32)
rng = np.random.default_rng(1); sample = pix[rng.choice(len(pix), min(len(pix), 60000), replace=False)]
_, _, pal = cv2.kmeans(sample, 44, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 60, 0.1), 3, cv2.KMEANS_PP_CENTERS)
pal = pal.astype(np.float32)
sheet = np.zeros((8 * CH, 7 * CW, 4), np.uint8)
for r, k, col, a in cells:
    idx = np.argmin(((col[:, :, None, :] - pal[None, None, :, :]) ** 2).sum(axis=3), axis=2)
    rgb = pal[idx][:, :, ::-1]  # BGR -> RGB
    alpha = (a > 0.5).astype(np.uint8) * 255
    cell = np.dstack([rgb.astype(np.uint8), alpha])
    sheet[r * CH:(r + 1) * CH, k * CW:(k + 1) * CW] = cell
Image.fromarray(sheet, 'RGBA').save('src/gfx/img/mon.png')
json.dump({'cw': CW, 'ch': CH, 'ax': ANCH[0], 'ay': ANCH[1], 'rows': 8, 'cols': 7}, open('src/gfx/img/mon.json', 'w'))
# Vorschau auf Wiese, 4x
prev = Image.new('RGBA', (sheet.shape[1], sheet.shape[0]), (110, 190, 80, 255)); prev.alpha_composite(Image.fromarray(sheet, 'RGBA'))
prev.resize((prev.width * 3, prev.height * 3), Image.NEAREST).save(SC + 'monprev.png'); print(prev.size)
