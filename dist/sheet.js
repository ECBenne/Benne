"use strict";
(() => {
  // src/gfx/spriteBuilder.ts
  var canvas = (w, h) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  };
  var PAD = 4;
  function frameOf(c) {
    const wn = canvas(c.width, c.height);
    const wc = wn.getContext("2d");
    wc.drawImage(c, 0, 0);
    wc.globalCompositeOperation = "source-in";
    wc.fillStyle = "#fff";
    wc.fillRect(0, 0, c.width, c.height);
    const flip = (s) => {
      const f = canvas(s.width, s.height);
      const g = f.getContext("2d");
      g.translate(s.width, 0);
      g.scale(-1, 1);
      g.drawImage(s, 0, 0);
      return f;
    };
    return { n: c, f: flip(c), wn, wf: flip(wn) };
  }
  function pose(img, o) {
    const w = img.naturalWidth, h = img.naturalHeight;
    const tw = Math.round(w * (o.sx ?? 1)), th = Math.round(h * (o.sy ?? 1));
    const W = w + PAD * 2 + 4, H = h + PAD * 2;
    const a = canvas(W, H);
    const ag = a.getContext("2d");
    ag.imageSmoothingEnabled = false;
    ag.drawImage(img, 0, 0, w, h, Math.round((W - tw) / 2), H - PAD - th, tw, th);
    if (!o.lean && !o.liftL && !o.liftR) return a;
    const out = canvas(W, H);
    const g = out.getContext("2d");
    g.imageSmoothingEnabled = false;
    const top = H - PAD - th, feetFrom = H - PAD - Math.round(th * 0.24);
    for (let y = top; y < H - PAD; y++) {
      const k = 1 - (y - top) / th;
      const dx = Math.round((o.lean ?? 0) * k * 1.6);
      if (y >= feetFrom) {
        g.drawImage(a, 0, y, W / 2, 1, dx, y - (o.liftL ?? 0), W / 2, 1);
        g.drawImage(a, W / 2, y, W / 2, 1, W / 2 + dx, y - (o.liftR ?? 0), W / 2, 1);
      } else g.drawImage(a, 0, y, W, 1, dx, y, W, 1);
    }
    return out;
  }
  function buildView(img) {
    return {
      idle: frameOf(pose(img, {})),
      walk0: frameOf(pose(img, { lean: 1, liftL: 2 })),
      walk1: frameOf(pose(img, { lean: -1, liftR: 2 })),
      crouch: frameOf(pose(img, { sy: 0.9 })),
      lunge: frameOf(pose(img, { sy: 1.08, lean: 1 }))
    };
  }
  function spriteFromImages(front, back) {
    const f = buildView(front), b = buildView(back);
    return { w: front.naturalWidth, h: front.naturalHeight, front: f, back: b, frames: { idle0: f.idle, idle1: f.idle, walk0: f.walk0, walk1: f.walk1, atk: f.crouch } };
  }

  // src/gfx/img/pikachu.png
  var pikachu_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAhCAYAAABX5MJvAAADm0lEQVR4nKWXK3DjSBCGP6UWKEFZ5lokHxsoB62hwhI2UHXICYvYLTx2C7NMZo7RlaFYwhzoQ7HgMFvIZXZBitkckKXobdn3V6nskXp6/u7px4zBkRBCaACllHHs3CZdRysSQmghbBIi4UlkpHR1+l+pkLNjFRQJ2Uwk+rDkJ/LyqREnkVAqBOBvf3fUvIlEu74s6DgZQggdzy0db6SON1J38cZEksnHG6mTbU1i4iRPfDfXhbHjHJ5TkFHL5GcfT1/qGN8H7QE7DXcGP7baf67OLcvW6bryzgsBnZGYSLTjQE9KHCfQv3mHM2cbBACY/EW8CfX5pSx8/3gPcJxAQ6IXYOYFKFXUnQ3yQQOAWnJxHbUSSefULV4H7/Yl8WIJX2oJAIgBKz866JGLbwHxpuZDYgTx3AIx2HvNrNVxBs2B1ZOSeG7VRv5EohdrEyldZl7V8ivvHCldrrzzTNewX5/SZxOJTverFmLAyq8G3GJt4j/foFSI60u825csRgDe/A+UCnnzP5IXaonjwMg2K7oq2dEV/+z6vAc2b/Nk7D/fVMin395//Av06d3BNIwqus7uA2rdmUdPWKx8KkXpUjwBSZZcXSu825eKroQArBeqUX8+6DRAvCltzb6wpJiNoyz38wEdDhf0hyIh9/i1QCIlYD+ZXFxH5XULFdMAjItvOUtKBADuG5xmL4YVAgCXd0l1VYMtACO7miFN6adHtsmwv8N9sIDMA4U5Qgj9NhcNKuqNyHsyRVNgGtNwxzQEiLT7YLFYm0Cx0PwhFCAaF+yK1uwY2aZ2H3rMxhHTsOq1Lo2rC1q7aFpc3Acrze/mli0GyVOD2Thq/d5GQi/WJlsVAfDn3Y6V/1lsRraZFLnSNqTyeQJZS1DL/bZ2J2FMw53x88lMLGlAedGelGkaslVRFtht6HpI1RMJv5RAKWWs/GKpT8t1+u53z+SGGY4DP59M/MdeZojjwOtr8ZzRicTINnW++VQ67h4zL+CXEp/9AjKvxHOr/K56qOmKtoxwfYkLhTjJL96ETmfMabgz7oOkc76+tgiq5cF6UY6hziT2MOpORQUCHbA3orF3dMJibVYXzI23KsqeOtT1npPukyPb1P5jr/BuNo6yGpAPYsdJjgKzcZRl1ylrNkFPJDo9Z9SdmEa2qVd+IhPPLR3PrVq5kzCyzc8b2Nxqu4Fpko6cyR17d61FegVMLaStn5TmNcmeuj95Zf97j/8D4vXZm78S7XAAAAAASUVORK5CYII=";

  // src/gfx/img/pikachu_b.png
  var pikachu_b_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAClUlEQVR4nLWXrXviQBDG3/CcCP9BZDg3MtRVInsuMpLWEQcSWdlzwUElMq51hwQHch1ERp66Jy4nYMNu2K/wtK8j7Mz8dmZ2NgG+UERUE1Hdxab3lQBc48h3hvgWgF01cIb4UgDGWGcILUDXWqr0OKisa4wZ4E3VAcYTfyRZjGMGo60WgDHWOCOKQET1MkbtktYpMXxMGMD2COLYWApjBnhNGTuAKEKSxcg+noy74uABhc2z+bO+FLYm9DjEE9YA2ze7MkFsTz5KVlyIzFnoAedze8xQL2OlU48xht+Mrk8uTv/9CRubZXy2P2aos7cAmw2k9bqG9LhxMgkBACUrsNkAL7ncUBx0/lxJ6eXrkyy+cV7mebO2ZAV+prc+PQA4ZqhFpyaDNrBJvAwBhQANkf76xPuhknz2xpF/E5wb6er8ksN7SPtYLwojQEDhNVuaMvRMw8IEIR5TVyVZjHafWUexDmIc+U5lkMT2aNv0pCNjgRDpTWfbJtGPJz502RGve+fdX/R3NcCc7ZpmbErg2ljJJMRodFdspZSNRET1lJh2l9LxukMPab9pYmMnL2PUo9FtID58uHhGXIDWi0IactajpOoNU5lUwCq7TyTI87VnzYAYvBm7LSBeknZWlCA0vAKlinkvShzRPLjYgKoAIoztpKSz0gwwjvw6ewsk59Itd1GXHuB++D1j7YH2DZjOSmkIOaVdCPy68qULyWme81Lw4LrUc5g2iCqwM8A48mvxwrLVVTUj0lmpDA44XEa7aqAMoJN0BWt8dAKY0vmdcHvyAQCvK99mIouGjY+7AIBz2nnjPQ4qaxYksT2SLNZ+6Pyw2W9PPkasQEAhErKt1kMAfeVf1gy8HypPdfa7aL0otG9Q/wH9tWcpqmiVcAAAAABJRU5ErkJggg==";

  // src/gfx/img/charmander.png
  var charmander_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAApCAYAAABdnotGAAAEfklEQVR4nLWYIZziOBTGv/I70XHgBllZXHHMKYpjTm1HlXHgkHQVrALUFYmbkYvrql0cRe3iqNvKyuLAbV1OdBJSSEpnDj4TStLkn9eXvJcog/EK11I/GBEA8MINAMDSG5gbE+U9fSjXAHIrExL5CTRTPauL/AReuMHOXhUCK10DBoYGbaAL6zVThdNv4n7RIjcHojBFVBTqf1vo2vowkFuZpLMNImTKHFl646KVPgwU+cnxQQCTqRc8Xx3oIUmkg9AVV10eUF0eMu2mcfk2QLrdltZRGCq6LxXRh4H8zkS471DFP7ZIfkW54FcFqj7WL7ZRHzRYevc2QO6nR7Y6+sGIxEMDeXuQW1Og2220px1YeuO6QO6nR+J8+8G2fuYTOUvd6Tfx+s3PtpeoH4wIjYN/yRqNtRa5M1IfiXsJcOIK0SyEZqoQxTAav6iohep+iO7AYxOjEJqpwp2vAUMAdAQ5wsza2cC4s1eKt2gRx2wymFOIaVzGfr9HZD1k+n+dWWRYPcDSG5l3p3EZ3VMLDZYtcveSNvoTJKAWEmlnr5TIHxEeolNOy+3wO4af/2EwXrhhVtqaaRDmraqZKvamgcrIIpn0g1on7iWovqhC64j0OrPI1tSln4lCyFT3QwBAd+ApzEK8dYA3vymo7sBLP2G/CeD4+aZxOReGB6H/lShM9YVzYADlfvZlftmLZOkNuPM1KqMAdT+EpTeOn2dsQhubAI4rjjo4DwMInJp+qjtDxQEJBss0OjuQfzq3MiEY6HACFQ6ygZSC0N/Wl/PVxqvEW4eH4nXJjxiAoQGGxhxWtP/wgEKg0z/+BEmmLOLUXrg52yRp6uo+TeE+TTN1+599vM4soQuU+MEB4DDPlkW0s1eKO1+nUG9g7nzN6p1+E5W/i3VYmrVXCh3cfUrw9XB07CLW4VUZBaiMAvbsztew9AYqowD7n9lVIrNSiQ58usxPYWjqKUpB7xctQpf41tRRGQWYxmVM4zLqfngGkye2yqqdJhxDQzQLMTs53N0vWsT5TeDWFFbu7JXCYlG/CYdrv4UO1dZQ1YudSHhdjPavM4vo/35HZD3A0huspJYSJWmaqV6EicMIW1M/szgDkuXH3YGnPD8/Q7U1qPb7Z3xJpzl21kIFjjIUKjfpaj7I696ULMRjZYBobkN9g2pYPUg7KHq84RWHkTRpE/oQhaJgO3ul5GV9kS8/EolgkkUktTADmhsTxQs3rGPNVDNg07h8ZqVTyDywOIwQh1HmPVFMywRXSs2npbRME6gAW659utekKQTNAlVbYwOLVOstsTXl/nd2P3S/aBHenPyyjvyE5TAAznIdOvPO2M6BSd+RRXzhhdX9okU6Y1vqyDLJtoVabwkAF2EAyaljZ6+UWi9NxulsZXAyiK9fFmyP4S2ZByMFAtINcQeg1ksDIA8nEw8BiNPXYfWAXU4f77pjpEFUJn7mNPHnRf3Rna+ld45XufSUiYfiz2AApBehN73S6w48pe6HbGVGfgLN+wUv3MD5TYT50E0txEs0uMi5/wNTKYOPKVC9pQAAAABJRU5ErkJggg==";

  // src/gfx/img/charmander_b.png
  var charmander_b_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAoCAYAAABq13MpAAADW0lEQVR4nM2YK3TbMBSG/+QUpExwKeuYYcM81sCeoYalRaOhLcoZ6jFqB8MGkzAPDrrQrGM1q9lMhTozD7jX1ssPOYnbnziWH/n0++rqSgO8o14u3Uw896MQAHAbYVD3XO3FQ4lgT6cj4/U4SGs70Dv0y6WbVcGqelg9wksYOOcSZ6/QTcBxkBa/6b6H1aPm9vBAfJpsHAbKDswcF4wxKfZ7gW4DLLqsti3HXGrvzeku8qMQz9+WmDku7h0Ubn8IaJPLpB881LLM0aGBSHGQSn9eByoq2v4GLpjU1hs00B60Sb2EB00UtvISBmd+AQC4WZwXWaQV9F8XWfNd+9fT1MGF52lZ5EMMxDrNHFdraw39Xm6T4iAtJhoNWoXbB6zJrSaZxgFlHw2aLXRQtsiPXTogTgo28hIGPwoleIptKeW9rnWXCVhsOwn7KbS8hGG9XsO//Sq0shL6dY3s+GyEf3/KXMoWAF/lR/pto3sHWZfQEHV9fQ3ORZN4GR58BQn4vQceAHDOB2otDQgxfRJioDpp66yoXV1WKztRxpRHcUxhcXxW1gwnIQZNX6ELsJot1MquEZqAu4iAbQp+IIecBBEmQVS0eQkz3lsMRHJPHIyiw+p9VcA3i/Pi/HQ6al0k5U7n68FJEGUAtLUhSXKa3D0+GxmB61QVEjaOUxxXDUDSEaC7pzotZhUgj2sTcBVgG8fLDoeZeP75V6jBW9fTtsC2EsMLAFjAssotBNHtDc+Pi2V5I6U/FbrtKrttbIvvelg9AtA3bCSnNxy4YvlvOoq52uTyvhwmiZ2bOa6xcCqgNzz/NHGQAjyUgE21hk0h1HWZlac/BoBL7UcEQLHkR2HhclNhpMafrfwo1MpWcta0HSZBzxxXcqMJNl+r8VZgTS6LkwkAoTiqfr82I1bNQqKWY6511KSm61d3c+mddblZ1HDXwVQF1jaOn3/mq+2mPWlRWp5ejjluefUDpgHYZaCN5qfWz5CGbcLhkNp839aWoSZpMb3rSsNWXsKsQgN4g04+jaXGtjm4686RGBq2LgN19bSyka1qEkQ7f5V0G1u7DABD6qmYQWaOi+WYgzGWqfA0Bp6mzk6w6TbGl7TbTDkA8nC4upsj3cbaDX4UFqCUn/chKldNpWeT/gNOm6Ac0hCrVAAAAABJRU5ErkJggg==";

  // src/gfx/img/squirtle.png
  var squirtle_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAjCAYAAADxG9hnAAAEGUlEQVR4nLWYL3ziSBTHf9ynAhkckcjUhVPJqrQOCS6sonGcS1xbRdcVt7iAalGlEsehCKpEHXFH1aWOcYfLiXSGmSSEdOGeYTKZZL7vzfsXSigo5osb0XG49AAA8/6oVPT5Y3JRFMBsNNncu6LSYXQuoNwXmC9uxAMAwPtmk1o3GQ1Ohvnt0A3D7hSCAIBWpwvD7kSZN08BMexO1Op0C0GcCyblI4bdiWRNz93cC3w21vf+AlnTYdiIfuWYMi2i3Fu5D00tB7c1Fbc1lUHRX3/4+lWGwyB360jQmpfJaAAA+HZ9DSAO5UNrTwZ5uDxuWVsmuKzXTwbIBemHknD2AkDv8Wyb54LImo6nf/4++ED/3kmt/19AwqWH980m5YRUWp0uHhYzBD0X7cnwLBBARmaVJClSb5pI5hFeKFy49ASLTC0HhJCS+eJGtB4BxUrABRCncl2JQ3FqOUdDsDYdoQYgbHTYXLj00HAfoStqBAAeNy9JUkQIyYUpUYikxlPLQcONHTOZV4KeKwD4w1fwVvQCn1mLWilXMwAX4dIDEiC6okJfzHD37RrqTRPgNqYytWKnXbsNbM0ZfmzEbOsBhSEA4OLz/CJZ01MhSy1CteZl7TbY+I/xQPCpX0lwjJavMbzYfh+yKgKG/n4jZ6eBV4JCfMUaAkgWDIUIfZ/9lmUFl0Y1BgoI2styKpeESw+16QijIB2VfIXmoykzfOl41pVR79rAdoXVeA5ZVSHrV8B2xdavxnNmFSrlewttA3ieg8FQgKRDU5hUG0DN+XarRPWuzeYZBABU6gLMs7bDpbXPuIuHJj7We5+iluZ9kDo0bRsOdmiCVLKL23r+gbppxGO3gaZMsJjNhDXmi5uCoH6kKypkTYckSVEuyGrQZ5rzDkqPivoKlbaxH7fGknDPC3x4gY/JaABdUVk7QSUXpN61EQYkBvoEC70/sRrPhXWyEm8qVRR8DH9HpVrGxCSp9/ElodXpCmF+9Ghk/QrUV+pdO742DciqmgICYgfd1uL1r6Ek3KO5iFoH2Id5Jgj7mOIcUsgllTpkRWIwYUDg4Ap91cam0RGybFFJgdDaszSfYo23qz0QB8aLg6u4LCgqC8/qzVtqXcN9ZKUBEJNeKo/8/OuN5RFt/D31smSWpRBJmYwGB5smCsNn3txPzqX5BG38Xdh8+7HDLgzYdbgrp4omEPtDEoS3RjL9p0C8wBc07Ks2lHsLNz0TAFCploGqKoZzhqg3TWHjrM1zQfi2gHp20HPR/uy47v4d4ZkLFj8MkZWwZE2HP3wt3gZkTWaVcdrkXJOkXxFMLSeCe1p3n9nFA7FlqJZTy8kt64SQUvIYgDhK+CKaJwerLyGkxI+PvUiSpOhhMWNVFdgnsCLPn+0fHwrDX3+lMfoPSrMxANjJPF8AAAAASUVORK5CYII=";

  // src/gfx/img/squirtle_b.png
  var squirtle_b_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAiCAYAAAA6RwvCAAADhElEQVR4nMWXLVDjQBiG3zKIypwj7iKD66Aa1IKr3J5qUaHqgktdB8Wco46eolFQBSvjuKhLFdRRGVxwROJyYtl0m2TT0jJz70xmks1+kyff3+7W8IXq3F2nltkojN97IwBAMPRqKlvli88CAECnRSvnDc/7SpjdrwCxzAa+G0b2/BJFCOezwnv34hIA0jKYrUE6d9dpFQQAhPNZNqaC2dkGgrh2mh/LQ+T1EkVo2w40TVuy/ZLQvETRWhDynMYpRTD0tgchrp3qTWttAFnxNAS3XYBsHJrZmG1qiiPfg2U2lsKzVY5sI9FbhLYCiafhRnYtahbGNgZ5cHRcGQkGr34GtS5Y/72JKyNZGvt0Z7VNpA41Udelv2oOstuzyQgiiVUSy0A4n2Hyo1f7NMjDT6QAsLdPMRzxZHUdCjZiiAC4N4+fAoqnYdby1wZ5HJip8MLrM4P2jd8nb/NsThgA1KGZh1Qw8TTEbMxEL6kBa+aIDMFGHCJ5my9BAIBFOCQ7OQAAtG2nMm/kNr8SJA9BneoVVgCxkwOQ92K/8Xt8BU6SZCkalZ31wuQ5wT7ywSL83iLIvLJKfx8ecHh8jMbp4gc0TUtlEOLaqTJHbBNplyzi/h4XQ1EGEwbIoPf2eb6U5YoImRhXgogKqdJtAHRJ+XMYAPSjilZVkN/rV+fIbYCsOsokPCYuGUp0z+HJwcoybpxSdY4IF68jixTH6rrJPXFxXWkrQvTfFj0ZIhh6NaVHIgAs1tBdozJUatsO7r3l/BAfn40Z5MpRghgA7jsJwqDc9avERgy0OQAxEhz2+qB6AhZryPcPIWVoojU/qJpnEQDTX9h37uHqCZySpV9WwSPEtdPZmIHFQBcJLMKrB+BeykPkx/J6fnoCAOiNBqg+h5eUz1vqbgAK8TR8D11S7BmyysIn+sjw5CCz9+bqvrUjIPSmhbbtQD4y6k0LUcvGbVD95xYplru8CzOPOhXWXDXi2mnbdhZ/otiR1897So9ktsEiXPTmEWeTES7rUyRvcxz/rt5y7OhNK/u4DOH3+vB7/ew5atkrm5wID5U2SMejOMuxKtXEAVolcQYR+WKgvJzlTdHZhO/QRb75vb6ybIV2F4edaulNCxG46/8AMHx+ODLAAejpAEEdhQYGQGwBSg/fGchKghyM6Izy/lSoDELYyWEuBZmN2cp9ZRmMcH/+3ab6BwAWtCMBYM8bAAAAAElFTkSuQmCC";

  // src/gfx/sprites.ts
  var SRC = { pikachu: [pikachu_default, pikachu_b_default], charmander: [charmander_default, charmander_b_default], squirtle: [squirtle_default, squirtle_b_default] };
  var cache = {};
  var load = (url) => new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error("Sprite fehlt: " + url.slice(0, 30)));
    i.src = url;
  });
  function loadSprites() {
    return Promise.all(Object.entries(SRC).map(async ([id, [f, b]]) => {
      cache[id] = spriteFromImages(await load(f), await load(b));
    })).then(() => void 0);
  }
  function getSprite(id) {
    return cache[id];
  }

  // src/sheet.ts
  loadSprites().then(() => {
    const c = document.getElementById("c"), g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    const sp = getSprite(window.SP);
    const poses = ["idle", "walk0", "walk1", "crouch", "lunge"];
    [sp.front, sp.back].forEach((v, row) => poses.forEach((p, i) => g.drawImage(v[p].n, 4 + i * 50, 3 + row * 50)));
  });
})();
