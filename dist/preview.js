"use strict";
(() => {
  // src/gfx/spriteBuilder.ts
  var PAD = 1;
  function compose(art, layers) {
    const g = Array.from({ length: art.h }, () => Array(art.w).fill("."));
    for (const l of layers) {
      l.rows.forEach((row, ry) => {
        for (let rx = 0; rx < row.length; rx++) {
          const c2 = row[rx];
          if (c2 === "." || c2 === " ") continue;
          const gx = l.x + rx, gy = l.y + ry;
          if (gx >= 0 && gy >= 0 && gx < art.w && gy < art.h) g[gy][gx] = c2 === "~" ? "." : c2;
        }
      });
    }
    return g;
  }
  function canvas(w, h) {
    const c2 = document.createElement("canvas");
    c2.width = w;
    c2.height = h;
    return c2;
  }
  function render(art, g) {
    const W = art.w + PAD * 2, H = art.h + PAD * 2;
    const solid = (x2, y) => {
      const gx = x2 - PAD, gy = y - PAD;
      return gx >= 0 && gy >= 0 && gx < art.w && gy < art.h && g[gy][gx] !== ".";
    };
    const n = canvas(W, H);
    const ctx2 = n.getContext("2d");
    for (let y = 0; y < H; y++) for (let x2 = 0; x2 < W; x2++) {
      if (solid(x2, y)) {
        let ch = g[y - PAD][x2 - PAD];
        if (art.shade[ch] && !solid(x2, y + 1)) ch = art.shade[ch];
        else if (art.shade[ch] && !solid(x2, y + 2) && (x2 + y) % 2 === 0 && false) ch = art.shade[ch];
        ctx2.fillStyle = art.palette[ch] ?? "#f0f";
        ctx2.fillRect(x2, y, 1, 1);
      } else if (solid(x2 - 1, y) || solid(x2 + 1, y) || solid(x2, y - 1) || solid(x2, y + 1)) {
        ctx2.fillStyle = art.outline;
        ctx2.fillRect(x2, y, 1, 1);
      }
    }
    const wn = canvas(W, H);
    const wc = wn.getContext("2d");
    wc.drawImage(n, 0, 0);
    wc.globalCompositeOperation = "source-in";
    wc.fillStyle = "#fff";
    wc.fillRect(0, 0, W, H);
    const flip = (src) => {
      const f = canvas(W, H);
      const fc = f.getContext("2d");
      fc.translate(W, 0);
      fc.scale(-1, 1);
      fc.drawImage(src, 0, 0);
      return f;
    };
    return { n, f: flip(n), wn, wf: flip(wn) };
  }
  function buildSprite(art) {
    const frames = {};
    for (const [name, layers] of Object.entries(art.frames)) frames[name] = render(art, compose(art, layers));
    return { w: art.w + PAD * 2, h: art.h + PAD * 2, ax: art.anchor.x + PAD, ay: art.anchor.y + PAD, frames };
  }

  // src/gfx/art.ts
  var P_HEAD = [
    "..KK.....KK.....",
    "..KK.....KK.....",
    "..YY.....YY.....",
    "..YYY....YYY....",
    "..YYYY..YYYY....",
    ".YYYYYYYYYYYY...",
    "YYYYYYYYYYYYYY..",
    "YYYYYYYYYYYYYYY.",
    "YYYYYYYYYYwKYYY.",
    "YYYYYYYYYYKKYYK.",
    "YYYYYYYYYYKKYYY.",
    "YYYYYYYYYrrrYYY.",
    "YYYYYYYYYrrrYYY.",
    ".YYYYYYYYYYYYY..",
    "..YYYYYYYYYYY..."
  ];
  var P_HEAD_OPEN = [
    ...P_HEAD.slice(0, 12),
    "YYYYYYYYYrrrYKK.",
    ".YYYYYYYYYKppK..",
    "..YYYYYYYYKKK..."
  ];
  var P_BODY = [
    "..YYYYYYYYYY..",
    ".nYYYYYYYYYYY.",
    "nnYYYYYYYYYYyY",
    "YYYYYYYYYYYyyY",
    "nYYYYYYYYYYYYY",
    "YYYYYYYYYYYYY.",
    ".YYYYYYYYYYYY.",
    "..YYYYYYYYYY.."
  ];
  var P_TAIL_A = [
    ".....YYYY",
    ".....YYY.",
    "....YYY..",
    "..YYYYYY.",
    "....YYYY.",
    ".....YY..",
    "....YY...",
    "...YYn...",
    "...nnn...",
    "....nn..."
  ];
  var P_TAIL_B = [
    "....YYYYY",
    "....YYY..",
    "...YYY...",
    ".YYYYYY..",
    "...YYYY..",
    "....YY...",
    "...YY....",
    "..YYn....",
    "..nnn....",
    "...nn...."
  ];
  var P_FEET_STAND = [
    "..YYYY....YYYYY",
    ".YYYYY....YYYYY"
  ];
  var P_FEET_W0 = [
    ".YYYY.......YYY",
    ".........YYYYYY"
  ];
  var P_FEET_W1 = [
    "..YYYYY.....YY.",
    "..YYYYY...YYYYY"
  ];
  var pikaFrame = (head, tail, feet, dy = 0) => [
    { rows: tail, x: 0, y: 12 + dy },
    { rows: P_BODY, x: 5, y: 16 + dy },
    { rows: feet, x: 6, y: 24 + dy },
    { rows: head, x: 9, y: 2 + dy }
  ];
  var PIKACHU_ART = {
    w: 28,
    h: 29,
    anchor: { x: 14, y: 29 },
    palette: {
      Y: "#f8d838",
      y: "#d8a820",
      K: "#2b2030",
      r: "#e84838",
      w: "#ffffff",
      n: "#a8661c",
      p: "#e85868"
    },
    shade: { Y: "y" },
    outline: "#2b2030",
    frames: {
      idle0: pikaFrame(P_HEAD, P_TAIL_A, P_FEET_STAND),
      idle1: pikaFrame(P_HEAD, P_TAIL_B, P_FEET_STAND, 0),
      walk0: pikaFrame(P_HEAD, P_TAIL_B, P_FEET_W0, -1),
      walk1: pikaFrame(P_HEAD, P_TAIL_A, P_FEET_W1, 0),
      atk: pikaFrame(P_HEAD_OPEN, P_TAIL_B, P_FEET_W1, 0)
    }
  };
  var C_HEAD = [
    "...OOOOOOOO.....",
    "..OOOOOOOOOOO...",
    ".OOOOOOOOOOOOO..",
    ".OOOOOOOOOOwKOO.",
    "OOOOOOOOOOOKKOOO",
    "OOOOOOOOOOOKKOOO",
    "OOOOOOOOOOOOOOOK",
    ".OOOOOOOOOOOOOOO",
    ".oOOOOOOOOOOOOK.",
    "..oooOOOOOOOOO.."
  ];
  var C_HEAD_OPEN = [
    ...C_HEAD.slice(0, 7),
    ".OOOOOOOOOOOOKpK",
    ".oOOOOOOOOOOKppK",
    "..oooOOOOOOKKKK."
  ];
  var C_BODY = [
    "..OOOOOOOOOO..",
    ".OOOOOOOOCCCO.",
    "OOOOOOOOOCCCCO",
    "OOOOOOOOOCCCCO",
    "OOOOOOOOCCCCCO",
    "OOOOOOOOCCCCCO",
    ".OOOOOOOCCCCO.",
    ".OOOOOOOOCCCo.",
    "..OOOOOOOOoo.."
  ];
  var C_TAIL_A = [
    "....OO..",
    "...OOO..",
    "..OOO...",
    "..OOO...",
    ".OOOOO..",
    "OOOOOO..",
    ".OOOO..."
  ];
  var C_TAIL_B = [
    ".....OO.",
    "....OOO.",
    "...OOO..",
    "..OOO...",
    ".OOOOO..",
    "OOOOOO..",
    ".OOOO..."
  ];
  var C_FEET_STAND = [
    "..OOOO....OOOOO",
    "..OOOO....OOOOO",
    ".CCCCC....CCCCC"
  ];
  var C_FEET_W0 = [
    ".OOOO.......OOO",
    ".OOOO.......OOO",
    ".CCCC......CCCC"
  ];
  var C_FEET_W1 = [
    "..OOOOO.....OO.",
    "..OOOOO...OOOOO",
    "..CCCCC...CCCCC"
  ];
  var charFrame = (head, tail, feet, dy = 0) => [
    { rows: tail, x: 0, y: 15 + dy },
    { rows: C_BODY, x: 5, y: 17 + dy },
    { rows: feet, x: 6, y: 26 + dy },
    { rows: head, x: 9, y: 7 + dy }
  ];
  var CHARMANDER_ART = {
    w: 28,
    h: 29,
    anchor: { x: 14, y: 29 },
    palette: {
      O: "#f08030",
      o: "#c85820",
      C: "#f8d890",
      c: "#d8b068",
      K: "#2b2030",
      w: "#ffffff",
      p: "#e85868"
    },
    shade: { O: "o", C: "c" },
    outline: "#2b2030",
    frames: {
      idle0: charFrame(C_HEAD, C_TAIL_A, C_FEET_STAND),
      idle1: charFrame(C_HEAD, C_TAIL_B, C_FEET_STAND),
      walk0: charFrame(C_HEAD, C_TAIL_B, C_FEET_W0, -1),
      walk1: charFrame(C_HEAD, C_TAIL_A, C_FEET_W1, 0),
      atk: charFrame(C_HEAD_OPEN, C_TAIL_B, C_FEET_W1, 0)
    }
  };

  // src/gfx/sprites.ts
  var cache = {};
  var ARTS = { pikachu: PIKACHU_ART, charmander: CHARMANDER_ART };
  function getSprite(id) {
    if (!cache[id]) cache[id] = buildSprite(ARTS[id]);
    return cache[id];
  }

  // src/preview.ts
  var c = document.getElementById("c");
  var ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  var x = 4;
  for (const id of ["pikachu", "charmander"]) {
    const s = getSprite(id);
    let xx = 4;
    for (const f of ["idle0", "idle1", "walk0", "walk1", "atk"]) {
      ctx.drawImage(s.frames[f].n, xx, x);
      xx += 30;
    }
    ctx.drawImage(s.frames.idle0.f, xx, x);
    x += 42;
  }
})();
