import { door, obstacles, obstacleVersion, ROOM } from './sim';

export type P2 = [number, number];

const CELL = 0.5;
const CLEARANCE = 0.75;
const BLOCK_MIN_TOP = 0.9;
const BLOCK_MAX_BOTTOM = 3.2;

let cols = 0;
let rows = 0;
let x0 = 0;
let z0 = 0;
let blocked = new Uint8Array(0);
let builtFor = -1;
let builtRoom = '';

const idx = (c: number, r: number) => r * cols + c;
const cellX = (c: number) => x0 + (c + 0.5) * CELL;
const cellZ = (r: number) => z0 + (r + 0.5) * CELL;
const toCol = (x: number) => Math.floor((x - x0) / CELL);
const toRow = (z: number) => Math.floor((z - z0) / CELL);

function build() {
  const key = `${ROOM.halfX}:${ROOM.halfZ}`;
  if (builtFor === obstacleVersion.n && builtRoom === key) return;
  builtFor = obstacleVersion.n;
  builtRoom = key;
  const m = 0.9;
  x0 = -ROOM.halfX + m;
  z0 = -ROOM.halfZ + m;
  cols = Math.max(1, Math.floor((ROOM.halfX * 2 - m * 2) / CELL));
  rows = Math.max(1, Math.floor((ROOM.halfZ * 2 - m * 2) / CELL));
  blocked = new Uint8Array(cols * rows);
  for (const b of obstacles) {
    if (b.max.y < BLOCK_MIN_TOP || b.min.y > BLOCK_MAX_BOTTOM) continue;
    const c0 = Math.max(0, toCol(b.min.x - CLEARANCE));
    const c1 = Math.min(cols - 1, toCol(b.max.x + CLEARANCE));
    const r0 = Math.max(0, toRow(b.min.z - CLEARANCE));
    const r1 = Math.min(rows - 1, toRow(b.max.z + CLEARANCE));
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) blocked[idx(c, r)] = 1;
  }
}

function nearestFree(c: number, r: number): [number, number] | null {
  c = Math.min(cols - 1, Math.max(0, c));
  r = Math.min(rows - 1, Math.max(0, r));
  if (!blocked[idx(c, r)]) return [c, r];
  for (let d = 1; d < Math.max(cols, rows); d++) {
    let best: [number, number] | null = null;
    let bestD = Infinity;
    for (let dr = -d; dr <= d; dr++) {
      for (let dc = -d; dc <= d; dc++) {
        if (Math.max(Math.abs(dr), Math.abs(dc)) !== d) continue;
        const cc = c + dc;
        const rr = r + dr;
        if (cc < 0 || rr < 0 || cc >= cols || rr >= rows || blocked[idx(cc, rr)]) continue;
        const dist = dc * dc + dr * dr;
        if (dist < bestD) { bestD = dist; best = [cc, rr]; }
      }
    }
    if (best) return best;
  }
  return null;
}

function lineClear(ax: number, az: number, bx: number, bz: number) {
  const steps = Math.ceil(Math.hypot(bx - ax, bz - az) / (CELL * 0.5));
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    const c = toCol(ax + (bx - ax) * t);
    const r = toRow(az + (bz - az) * t);
    if (c < 0 || r < 0 || c >= cols || r >= rows || blocked[idx(c, r)]) return false;
  }
  return true;
}

export function findPath(sx: number, sz: number, gx: number, gz: number): P2[] {
  build();
  const s = nearestFree(toCol(sx), toRow(sz));
  const g = nearestFree(toCol(gx), toRow(gz));
  if (!s || !g) return [[gx, gz]];
  const gxw = cellX(g[0]);
  const gzw = cellZ(g[1]);
  if (lineClear(sx, sz, gxw, gzw) && !blocked[idx(toCol(sx), toRow(sz))]) return [[gxw, gzw]];

  const n = cols * rows;
  const gScore = new Float32Array(n).fill(Infinity);
  const from = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const open: number[] = [];
  const start = idx(s[0], s[1]);
  const goal = idx(g[0], g[1]);
  gScore[start] = 0;
  open.push(start);
  const h = (i: number) => Math.hypot((i % cols) - g[0], Math.floor(i / cols) - g[1]);
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (gScore[open[i]] + h(open[i]) < gScore[open[bi]] + h(open[bi])) bi = i;
    const cur = open.splice(bi, 1)[0];
    if (cur === goal) break;
    closed[cur] = 1;
    const cc = cur % cols;
    const cr = Math.floor(cur / cols);
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dc && !dr) continue;
        const nc = cc + dc;
        const nr = cr + dr;
        if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
        const ni = idx(nc, nr);
        if (blocked[ni] || closed[ni]) continue;
        if (dc && dr && (blocked[idx(cc + dc, cr)] || blocked[idx(cc, cr + dr)])) continue;
        const cost = gScore[cur] + (dc && dr ? 1.414 : 1);
        if (cost < gScore[ni]) {
          gScore[ni] = cost;
          from[ni] = cur;
          if (!open.includes(ni)) open.push(ni);
        }
      }
    }
  }
  if (from[goal] === -1 && start !== goal) return [[gxw, gzw]];
  const cells: P2[] = [];
  for (let i = goal; i !== -1; i = from[i]) cells.push([cellX(i % cols), cellZ(Math.floor(i / cols))]);
  cells.reverse();
  const out: P2[] = [];
  let ax = sx;
  let az = sz;
  let i = 0;
  while (i < cells.length) {
    let j = cells.length - 1;
    while (j > i && !lineClear(ax, az, cells[j][0], cells[j][1])) j--;
    out.push(cells[j]);
    ax = cells[j][0];
    az = cells[j][1];
    i = j + 1;
  }
  return out;
}

export function farthestFree(fromX: number, fromZ: number, awayX: number, awayZ: number, minStep = 3): P2 {
  build();
  let best: P2 = [fromX, fromZ];
  let bestScore = -Infinity;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (blocked[idx(c, r)]) continue;
      const x = cellX(c);
      const z = cellZ(r);
      const away = Math.hypot(x - awayX, z - awayZ);
      const travel = Math.hypot(x - fromX, z - fromZ);
      if (travel < minStep) continue;
      const score = away * 1.2 - travel * 0.45;
      if (score > bestScore) { bestScore = score; best = [x, z]; }
    }
  }
  return best;
}

export function isFree(x: number, z: number) {
  build();
  const c = toCol(x);
  const r = toRow(z);
  return c >= 0 && r >= 0 && c < cols && r < rows && !blocked[idx(c, r)];
}

export function doorApproach(): P2 {
  return [-ROOM.halfX + 1.3, door.z];
}
