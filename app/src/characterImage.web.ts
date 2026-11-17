import type * as T from 'three';
import type { CharacterId } from './characters';

// Characters are built from plain 3D shapes with three.js, lit, and rendered once to a small
// transparent PNG per character and colour. Markers and avatars then just show an <img>.
const SIZE = 256;
const FIT = 1.12;
const cache = new Map<string, Promise<string | null>>();
let stage: Promise<{ three: typeof T; renderer: T.WebGLRenderer; scene: T.Scene; camera: T.PerspectiveCamera }> | null = null;

function getStage() {
  stage ??= import('three').then((three) => {
    const renderer = new three.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.setSize(SIZE, SIZE, false);
    renderer.setClearColor(0x000000, 0);
    const scene = new three.Scene();
    scene.add(new three.HemisphereLight(0xffffff, 0x8a96a8, 1.5));
    const key = new three.DirectionalLight(0xffffff, 2.4);
    key.position.set(3, 5, 6);
    const rim = new three.DirectionalLight(0xbfe0ff, 0.9);
    rim.position.set(-4, 2, -3);
    scene.add(key, rim);
    return { three, renderer, scene, camera: new three.PerspectiveCamera(30, 1, 0.1, 80) };
  });
  return stage;
}

type Vec = [number, number, number];

function build(three: typeof T, id: CharacterId, color: string): T.Group {
  const g = new three.Group();
  const col = (c: string | T.Color) => new three.Color(c);
  const fur = col(color);
  const light = col(color).lerp(col('#FFF3DC'), 0.7);
  const dark = col('#2A2A33');
  const cream = col('#FFF3DC');
  const pink = col('#F4A6B5');
  const orange = col('#F59E33');
  const white = col('#FFFFFF');

  const add = (geo: T.BufferGeometry, c: T.Color, pos: Vec, scale: Vec = [1, 1, 1], rot: Vec = [0, 0, 0]) => {
    const m = new three.Mesh(geo, new three.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0 }));
    m.position.set(...pos);
    m.scale.set(...scale);
    m.rotation.set(...rot);
    g.add(m);
    return m;
  };
  const ball = (r: number, c: T.Color, pos: Vec, scale?: Vec, rot?: Vec) => add(new three.SphereGeometry(r, 32, 24), c, pos, scale, rot);
  const cone = (r: number, h: number, c: T.Color, pos: Vec, rot?: Vec, sides = 24) => add(new three.ConeGeometry(r, h, sides), c, pos, undefined, rot);
  const capsule = (r: number, len: number, c: T.Color, pos: Vec, rot?: Vec) => add(new three.CapsuleGeometry(r, len, 8, 16), c, pos, undefined, rot);

  const natural = id === 'panda' || id === 'penguin';
  const headC = id === 'panda' ? white : id === 'penguin' ? dark : fur;
  const bodyC = id === 'panda' ? white : id === 'penguin' ? dark : fur;
  const limbC = id === 'panda' ? dark : id === 'penguin' ? dark : fur;

  // Shared body: head, body, arms, feet.
  ball(1, headC, [0, 0.55, 0], id === 'frog' ? [1.2, 0.8, 1] : [1.05, 0.95, 1]);
  ball(0.85, bodyC, [0, -0.85, 0], [1, 1.05, 0.9]);
  ([-1, 1] as const).forEach((s) => {
    ball(0.28, limbC, [s * 0.9, -0.75, 0.1], [0.8, 1.25, 0.8], [0, 0, s * 0.25]);
    ball(0.34, id === 'penguin' ? orange : limbC, [s * 0.4, -1.62, 0.35], [1, 0.7, 1.3]);
  });

  const eyes = (x = 0.38, y = 0.62, z = 0.92, r = 0.11) =>
    ([-1, 1] as const).forEach((s) => {
      ball(r, dark, [s * x, y, z]);
      ball(r * 0.35, white, [s * x + r * 0.35, y + r * 0.4, z + r * 0.8]);
    });

  if (id === 'fox') {
    ([-1, 1] as const).forEach((s) => {
      cone(0.4, 0.85, fur, [s * 0.62, 1.5, 0], [0, 0, -s * 0.25]);
      cone(0.25, 0.55, dark, [s * 0.62, 1.42, 0.12], [0, 0, -s * 0.25]);
      ball(0.2, light, [s * 0.4, 0.24, 0.8], [1.1, 0.8, 0.7]);
    });
    ball(0.5, light, [0, 0.27, 0.74], [1, 0.62, 0.8]);
    ball(0.12, dark, [0, 0.4, 1.12]);
    eyes();
    ball(0.52, fur, [0.85, -1.25, -0.75], [1, 1, 1.5], [0.4, 0, 0]);
    ball(0.27, cream, [0.95, -1.15, -1.3]);
    ball(0.5, light, [0, -0.85, 0.6], [0.8, 1, 0.5]);
  } else if (id === 'bear') {
    ([-1, 1] as const).forEach((s) => {
      ball(0.36, fur, [s * 0.78, 1.35, 0]);
      ball(0.2, light, [s * 0.78, 1.35, 0.17]);
    });
    ball(0.46, light, [0, 0.3, 0.8], [1, 0.75, 0.7]);
    ball(0.12, dark, [0, 0.42, 1.12], [1.2, 0.8, 0.8]);
    eyes(0.4, 0.68, 0.9);
    ball(0.55, light, [0, -0.85, 0.62], [0.85, 1, 0.45]);
  } else if (id === 'cat') {
    ([-1, 1] as const).forEach((s) => {
      cone(0.42, 0.7, fur, [s * 0.65, 1.42, 0], [0, 0, -s * 0.2], 3);
      cone(0.26, 0.45, pink, [s * 0.65, 1.36, 0.13], [0, 0, -s * 0.2], 3);
      for (const dy of [-0.1, 0.05, 0.2]) capsule(0.012, 0.9, white, [s * 0.88, 0.32 + dy, 0.8], [0, 0, Math.PI / 2 + s * dy * 0.8]);
    });
    ball(0.34, light, [0, 0.3, 0.85], [1.1, 0.7, 0.6]);
    ball(0.1, pink, [0, 0.4, 1.1], [1.2, 0.8, 0.8]);
    eyes(0.4, 0.66, 0.9);
    capsule(0.13, 1, fur, [0.95, -1.15, -0.55], [0.7, 0, -0.5]);
    ball(0.5, light, [0, -0.85, 0.6], [0.8, 1, 0.5]);
  } else if (id === 'bunny') {
    ([-1, 1] as const).forEach((s) => {
      capsule(0.23, 0.95, fur, [s * 0.38, 2, 0], [0, 0, -s * 0.12]);
      capsule(0.13, 0.7, pink, [s * 0.38, 2, 0.1], [0, 0, -s * 0.12]);
    });
    ball(0.38, light, [0, 0.28, 0.8], [1.1, 0.7, 0.6]);
    ball(0.1, pink, [0, 0.4, 1.12], [1.2, 0.8, 0.8]);
    add(new three.BoxGeometry(0.16, 0.2, 0.05), white, [0, 0.12, 1.1]);
    eyes(0.42, 0.68, 0.88);
    ball(0.32, white, [0, -1.3, -0.85]);
    ball(0.55, light, [0, -0.85, 0.6], [0.8, 1, 0.5]);
  } else if (id === 'frog') {
    ([-1, 1] as const).forEach((s) => {
      ball(0.38, fur, [s * 0.58, 1.1, 0.4]);
      ball(0.27, white, [s * 0.58, 1.15, 0.65]);
      ball(0.14, dark, [s * 0.58, 1.15, 0.88]);
      ball(0.1, pink, [s * 0.72, 0.15, 0.85], [1.4, 0.8, 0.5]);
    });
    capsule(0.04, 0.7, dark, [0, 0.12, 0.98], [0, 0, Math.PI / 2]);
    ball(0.6, light, [0, -0.85, 0.62], [0.95, 1.05, 0.5]);
  } else if (id === 'owl') {
    ([-1, 1] as const).forEach((s) => {
      cone(0.3, 0.6, fur, [s * 0.62, 1.52, 0], [0, 0, -s * 0.3]);
      ball(0.4, light, [s * 0.42, 0.65, 0.8], [1, 1, 0.6]);
      ball(0.3, white, [s * 0.42, 0.65, 0.95], [1, 1, 0.5]);
      ball(0.15, dark, [s * 0.42, 0.65, 1.06]);
      ball(0.04, white, [s * 0.46, 0.7, 1.17]);
      ball(0.3, fur, [s * 0.95, -0.85, 0], [0.5, 1.5, 0.9], [0, 0, s * 0.15]);
    });
    cone(0.13, 0.3, orange, [0, 0.33, 1.05], [Math.PI / 2, 0, 0]);
    ball(0.62, light, [0, -0.85, 0.5], [0.9, 1.1, 0.55]);
  } else if (id === 'panda') {
    ([-1, 1] as const).forEach((s) => {
      ball(0.33, dark, [s * 0.76, 1.32, 0]);
      ball(0.27, dark, [s * 0.4, 0.6, 0.82], [0.85, 1.15, 0.55], [0, 0, -s * 0.4]);
      ball(0.075, white, [s * 0.4, 0.62, 1.05]);
    });
    ball(0.12, dark, [0, 0.33, 1.05], [1.3, 0.8, 0.8]);
    capsule(0.03, 0.2, dark, [0, 0.15, 1.04]);
  } else {
    // penguin
    ball(0.8, white, [0, 0.42, 0.72], [0.98, 0.88, 0.55]);
    ball(0.7, white, [0, -0.9, 0.58], [0.95, 1.05, 0.5]);
    eyes(0.3, 0.62, 1.15, 0.1);
    cone(0.14, 0.3, orange, [0, 0.4, 1.25], [Math.PI / 2, 0, 0]);
  }

  // Panda and penguin keep their own colours, so the picked colour goes on a scarf.
  if (natural) add(new three.TorusGeometry(0.78, 0.17, 16, 40), fur, [0, -0.18, 0], [1, 1, 1], [Math.PI / 2 - 0.08, 0, 0]);
  g.rotation.y = -0.4;
  return g;
}

async function render(id: CharacterId, color: string): Promise<string> {
  const { three, renderer, scene, camera } = await getStage();
  const model = build(three, id, color);
  scene.add(model);
  scene.updateMatrixWorld(true);
  const box = new three.Box3().setFromObject(model);
  const size = box.getSize(new three.Vector3());
  const center = box.getCenter(new three.Vector3());
  const half = (Math.max(size.x, size.y) * FIT) / 2;
  camera.position.set(center.x, center.y + half * 0.12, center.z + half / Math.tan((camera.fov * Math.PI) / 360) + size.z / 2);
  camera.lookAt(center);
  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL('image/png');
  scene.remove(model);
  model.traverse((o) => {
    if (o instanceof three.Mesh) {
      o.geometry.dispose();
      o.material.dispose();
    }
  });
  return url;
}

export function characterImage(id: CharacterId, color: string): Promise<string | null> {
  const key = `${id}:${color}`;
  let hit = cache.get(key);
  if (!hit) {
    hit = render(id, color).catch(() => {
      cache.delete(key);
      return null;
    });
    cache.set(key, hit);
  }
  return hit;
}
