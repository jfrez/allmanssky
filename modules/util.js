export function mulberry32(a) {
  return function () {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getRandom(gx, gy) {
  const seed = (gx * 374761393 + gy * 668265263) & 0xffffffff;
  return mulberry32(seed);
}
