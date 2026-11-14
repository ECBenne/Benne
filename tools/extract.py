# Stellt die Figuren aus dem Sprite-Sheet frei – nutzt den Alpha-Kanal des PNG (Schein/Schatten sind nur schwach deckend)
import cv2, numpy as np, json
SC = '/tmp/claude-0/-home-user-Benne/f5e1a4b9-a4b0-5f24-aa82-26c1ebeac27f/scratchpad/'
src = cv2.imread('assets/mon/sheet.png', cv2.IMREAD_UNCHANGED)
alpha = src[:, :, 3]
T = 200                                   # ab hier gehört ein Pixel zur Figur
mask = (alpha >= T).astype(np.uint8)
mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
n, lab, stats, cent = cv2.connectedComponentsWithStats(mask, connectivity=8)
keep = [i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] > 1200]
print('Komponenten:', len(keep), '(erwartet 56)')
# kleine Teile (z. B. abgetrennte Flammenspitzen) dem nächsten großen Teil zuschlagen
big = set(keep)
out = np.zeros(alpha.shape, np.uint8)
for i in range(1, n):
    if i in big: out[lab == i] = i
np.save(SC + 'lab.npy', np.where(out > 0, lab, 0))
json.dump([[int(stats[i, 0]), int(stats[i, 1]), int(stats[i, 2]), int(stats[i, 3]), int(stats[i, 4]), int(i), float(cent[i][0]), float(cent[i][1])] for i in keep], open(SC + 'comps.json', 'w'))
vis = src[:, :, :3].copy(); vis[(out == 0)] = 0
cv2.imwrite(SC + 'maskvis.png', vis)
small = [i for i in range(1, n) if 40 < stats[i, cv2.CC_STAT_AREA] <= 1200]
print('abgetrennte Kleinteile:', len(small))
