# Stellt die Figuren eines Sprite-Sheets frei (Alpha-Kanal). Nutzung: python3 tools/extract.py <tag> <schwelle>
import cv2, numpy as np, json, sys
tag, T = sys.argv[1], int(sys.argv[2])
SC = '/tmp/claude-0/-home-user-Benne/f5e1a4b9-a4b0-5f24-aa82-26c1ebeac27f/scratchpad/'
src = cv2.imread(f'assets/mon/{tag}.png', cv2.IMREAD_UNCHANGED)
mask = (src[:, :, 3] >= T).astype(np.uint8)
mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
n, lab, stats, cent = cv2.connectedComponentsWithStats(mask, connectivity=8)
keep = [i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] > 1200]
print(tag, 'Komponenten:', len(keep), '(erwartet 56)')
np.save(SC + tag + '_lab.npy', lab)
json.dump([[int(stats[i, 0]), int(stats[i, 1]), int(stats[i, 2]), int(stats[i, 3]), int(stats[i, 4]), int(i), float(cent[i][0]), float(cent[i][1])] for i in keep], open(SC + tag + '_comps.json', 'w'))
vis = src[:, :, :3].copy(); keepmask = np.isin(lab, keep); vis[~keepmask] = 0
cv2.imwrite(SC + tag + '_maskvis.png', vis)
