# Schneidet die Figuren aus dem Sprite-Sheet frei:
#  1) grobe Maske -> 2) Hintergrund glatt aus der Umgebung auffüllen (normierte Faltung) -> 3) Differenz -> Maske
import cv2, numpy as np, json
SC = '/tmp/claude-0/-home-user-Benne/f5e1a4b9-a4b0-5f24-aa82-26c1ebeac27f/scratchpad/'
src = cv2.imread('assets/mon/sheet.png', cv2.IMREAD_UNCHANGED)
img = src[:, :, :3].astype(np.float32)
H, W = img.shape[:2]

def est_bg(excl):
    w = (1 - excl).astype(np.float32)
    out = np.zeros_like(img)
    den = cv2.GaussianBlur(w, (0, 0), 14) + 1e-4
    for c in range(3):
        out[:, :, c] = cv2.GaussianBlur(img[:, :, c] * w, (0, 0), 14) / den
    return out

# grobe Maske aus Median-Schätzung
small = cv2.resize(src[:, :, :3], (W // 4, H // 4), interpolation=cv2.INTER_AREA)
bg0 = cv2.resize(cv2.GaussianBlur(cv2.medianBlur(small, 61), (0, 0), 6), (W, H), interpolation=cv2.INTER_CUBIC).astype(np.float32)
d0 = np.sqrt(((img - bg0) ** 2).sum(axis=2))
excl = cv2.dilate((d0 > 60).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41)))
for _ in range(2):
    bg = est_bg(excl)
    d = np.sqrt(((img - bg) ** 2).sum(axis=2))
    excl = cv2.dilate((d > 50).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (35, 35)))
bg = est_bg(excl)
diff = np.sqrt(((img - bg) ** 2).sum(axis=2))
np.save(SC + 'diff.npy', diff)

T = 58
mask = (diff > T).astype(np.uint8)
mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
flood = mask.copy(); ff = np.zeros((H + 2, W + 2), np.uint8)
cv2.floodFill(flood, ff, (0, 0), 2); mask[flood == 0] = 1
mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
n, lab, stats, cent = cv2.connectedComponentsWithStats(mask, connectivity=8)
keep = [i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] > 1500]
print('Komponenten:', len(keep), 'Maskenanteil', mask.mean())
out = np.zeros((H, W), np.uint8)
for i in keep: out[lab == i] = 255
cv2.imwrite(SC + 'mask.png', out)
vis = src[:, :, :3].copy(); vis[out == 0] = (vis[out == 0] * 0.2).astype(np.uint8)
cv2.imwrite(SC + 'maskvis.png', vis)
np.save(SC + 'lab.npy', lab)
json.dump([[int(stats[i, 0]), int(stats[i, 1]), int(stats[i, 2]), int(stats[i, 3]), int(stats[i, 4]), int(i), float(cent[i][0]), float(cent[i][1])] for i in keep], open(SC + 'comps.json', 'w'))
