// ============================================================================
// quality level, chosen before anything is built
// ============================================================================
// LV: 0 High, 1 Medium, 2 Low. Medium and Low keep every 2nd / 4th leaf, glint and pebble and bake fewer shadows;
// Low also drops anti-aliasing and uses coarser meshes, cheaper filtering and fewer light shaft steps.
// localStorage.abyssal = "level,pixels,detail". abyssalLoad is set while the world is built: still set on the next
// visit means that load crashed the tab, so this one runs a level lower.
// Device detect (v2.9): pointer:coarse, deviceMemory, hardwareConcurrency, screen size and devicePixelRatio.
// Weak phone (mem <= 4 or cores <= 4) = Low with DPR cap 1.5; mid phone = Medium with DPR cap 2;
// strong desktop = High with DPR cap 2. DPRCAP is applied where DW/DH are computed in main.js, so the
// first frame costs less on phones. TIERNAME / DEVKIND feed the loading screen lines in main.js.
const mob = matchMedia('(pointer:coarse)').matches, mem = navigator.deviceMemory;
const cores = navigator.hardwareConcurrency || 4;
const scrMin = Math.min(screen.width || 0, screen.height || 0);
const keep = (k, v) => { try { localStorage[k] = v; } catch {} };
let SV = [], LV, bad;
try { SV = (localStorage.abyssal || '').split(','); bad = localStorage.abyssalLoad; } catch {}
// saved level wins (manual Low/Medium/High buttons); otherwise detect from the device
if (SV[0]) LV = +SV[0];
else if (mob) LV = (mem !== undefined && mem <= 4) || cores <= 4 || scrMin <= 360 ? 2 : 1;
else LV = mem !== undefined && mem <= 4 ? 2 : 0;
let TIERNAME = ['High', 'Medium', 'Low'][LV] || 'High';
const DEVKIND = mob ? 'Phone' : 'Desktop';
let DPRCAP = LV === 2 ? 1.5 : 2;
// auto detail is always on: start at High, step down while the game stays slow (see frame())
const AUTO = true;
if (bad && LV < 2) { SV = [++LV]; keep('abyssal', LV); TIERNAME = ['High', 'Medium', 'Low'][LV]; DPRCAP = LV === 2 ? 1.5 : 2; }
const THIN = 1 << LV, SHADOW = LV ? 2048 : 4096, AA = LV > 1 ? 1 : 4, WATER = LV > 1 ? 256 : 512, RAYN = LV > 1 ? 12 : 34;
