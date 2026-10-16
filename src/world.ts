import * as THREE from 'three';
import { OUTFITS, SETTINGS, WORLDS, type OutfitId, type WorldId } from './config';

export type HotspotAction = WorldId | 'wardrobe' | 'focus' | 'board';
export interface Hotspot { title: string; subtitle: string; action: HotspotAction; position: THREE.Vector3; labelHeight: number; color: string }
const palette = {
  stone: '#f4efe2', light: '#fffbef', side: '#d7d2c4', gold: '#b59a61', darkGold: '#8e7441',
  teal: '#71bfc0', leaf: '#547b54', trunk: '#8b7860', ink: '#304b59',
};
const materials = new Map<string, THREE.MeshStandardMaterial>();
function mat(color: string, metalness = 0, roughness = .7) {
  const key = `${color}-${metalness}-${roughness}`;
  if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, metalness, roughness }));
  return materials.get(key)!;
}
function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z);
  object.receiveShadow = true;
  parent.add(object);
  return object;
}
function box(parent: THREE.Object3D, x: number, y: number, z: number, w: number, h: number, d: number, color = palette.stone) {
  const m = mesh(parent, new THREE.BoxGeometry(w, h, d), mat(color), x, y, z);
  m.castShadow = h > .5;
  return m;
}
function cylinder(parent: THREE.Object3D, x: number, y: number, z: number, rt: number, rb: number, h: number, color = palette.stone, segments = 32) {
  const m = mesh(parent, new THREE.CylinderGeometry(rt, rb, h, segments), mat(color), x, y, z);
  m.castShadow = h > .5;
  return m;
}
function ring(parent: THREE.Object3D, radius: number, tube: number, x: number, y: number, z: number, color = palette.gold) {
  const m = mesh(parent, new THREE.TorusGeometry(radius, tube, 8, 80), mat(color, .55, .28), x, y, z);
  m.rotation.x = -Math.PI / 2;
  return m;
}
function column(parent: THREE.Object3D, x: number, z: number, height = 7) {
  box(parent, x, .2, z, 1.65, .4, 1.65);
  box(parent, x, .5, z, 1.3, .2, 1.3, palette.side);
  cylinder(parent, x, height / 2 + .6, z, .43, .56, height);
  cylinder(parent, x, height + .6, z, .68, .5, .3, palette.gold);
  box(parent, x, height + .9, z, 1.5, .35, 1.5);
  // Subtle vertical fluting gives the marble columns their rhythm.
  const fluteCount = matchMedia('(pointer: coarse)').matches ? 4 : 8;
  for (let j = 0; j < fluteCount; j++) {
    const a = j * Math.PI * 2 / fluteCount;
    cylinder(parent, x + Math.sin(a) * .46, height / 2 + .6, z + Math.cos(a) * .46, .035, .035, height - .2, palette.light, 5);
  }
}
function tree(parent: THREE.Object3D, x: number, z: number, scale = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(scale); parent.add(g);
  cylinder(g, 0, .25, 0, 1.35, 1.45, .5, palette.light);
  cylinder(g, 0, .53, 0, 1.12, 1.12, .08, '#809174');
  cylinder(g, 0, 1.65, 0, .13, .21, 2.3, palette.trunk, 8);
  const crown = mesh(g, new THREE.IcosahedronGeometry(1.3, 1), mat(palette.leaf), 0, 3.2, 0);
  crown.scale.set(1.15, 1.1, .95); crown.castShadow = true;
  mesh(g, new THREE.IcosahedronGeometry(.95, 1), mat('#77976c'), .55, 3.7, .1).castShadow = true;
}
function steps(parent: THREE.Object3D, x: number, z: number, width = 8) {
  for (let i = 0; i < 3; i++) box(parent, x, .1 + i * .16, z - i * .6, width, .2 + i * .32, 2.6 - i * .6);
}
function desk(parent: THREE.Object3D, x: number, z: number, copper = false) {
  const c = copper ? '#a97656' : palette.gold;
  box(parent, x, 1.55, z, 4.4, .2, 2, palette.light);
  for (const dx of [-1.8, 1.8]) box(parent, x + dx, .8, z, .16, 1.5, 1.4, c);
  box(parent, x - .65, 1.71, z, .9, .12, .7, '#335764');
  box(parent, x - .65, 1.79, z, .8, .025, .6, '#f5edd7');
  cylinder(parent, x + 1.2, 1.85, z, .12, .19, .4, c, 12);
  cylinder(parent, x + 1.2, 2.24, z, .38, .25, .28, '#eee2be', 16);
  box(parent, x, .65, z + 2, 1.1, .18, 1.1, '#54777b');
  box(parent, x, 1.1, z + 2.45, 1.1, 1, .15, '#54777b');
  for (const dx of [-.4, .4]) for (const dz of [1.6, 2.4]) box(parent, x + dx, .3, z + dz, .09, .6, .09, c);
}

export function makeAvatar(outfit: OutfitId): THREE.Group {
  const group = new THREE.Group();
  const { color, accent } = OUTFITS[outfit];
  // Gender-neutral sculptural mannequin. Three silhouettes, not just recolors.
  for (const x of [-.19, .19]) {
    box(group, x, .13, .08, .26, .21, .49, '#35434b');
    const leg = box(group, x, .61, 0, .25, .85, .29, outfit === 'mythic' ? '#e3dbc6' : '#344953');
    leg.name = x < 0 ? 'leftLeg' : 'rightLeg';
  }
  const torso = mesh(group, new THREE.CylinderGeometry(.34, outfit === 'techwear' ? .4 : .3, .72, 8), mat(color), 0, 1.35, 0);
  torso.castShadow = true;
  cylinder(group, 0, 1.82, 0, .12, .12, .18, '#b78c6a', 12);
  mesh(group, new THREE.SphereGeometry(.25, 16, 12), mat('#b78c6a'), 0, 2.03, 0).castShadow = true;
  const hair = mesh(group, new THREE.SphereGeometry(.258, 16, 12, 0, Math.PI * 2, 0, Math.PI * .55), mat('#302e2b'), 0, 2.07, 0);
  hair.rotation.x = -.15;
  for (const x of [-.45, .45]) {
    const arm = box(group, x, 1.29, 0, .2, .75, .25, color);
    arm.rotation.z = x < 0 ? -.12 : .12;
    arm.name = x < 0 ? 'leftArm' : 'rightArm';
    mesh(group, new THREE.SphereGeometry(.11, 10, 8), mat('#b78c6a'), x * 1.05, .87, 0);
  }
  if (outfit === 'tailored') {
    box(group, 0, 1.25, .185, .09, .7, .04, accent);
    for (const x of [-.19, .19]) {
      const lapel = box(group, x, 1.55, .2, .16, .36, .04, accent); lapel.rotation.z = x < 0 ? -.3 : .3;
    }
    box(group, 0, .98, -.08, .72, .26, .42, color);
  } else if (outfit === 'techwear') {
    box(group, 0, 1.38, -.29, .52, .65, .24, '#1c303b'); // backpack
    box(group, -.22, .68, .19, .32, .25, .14, '#4d6068');
    const strap = box(group, 0, 1.4, .3, .1, .76, .08, accent); strap.rotation.z = -.55;
    box(group, .32, 1.5, 0, .18, .23, .35, accent);
  } else {
    cylinder(group, 0, .87, 0, .32, .6, .75, color, 12);
    cylinder(group, 0, 1.22, 0, .35, .35, .1, accent, 12);
    const cape = mesh(group, new THREE.ConeGeometry(.68, 1.2, 5, 1, true, 0, Math.PI), mat('#b5c9c1'), 0, 1.1, -.15);
    cape.rotation.y = Math.PI / 2;
    const circlet = ring(group, .25, .035, 0, 2.14, 0, accent); circlet.rotation.x = Math.PI / 2;
    mesh(group, new THREE.SphereGeometry(.07, 8, 8), mat(accent, .6), .39, 1.65, .1);
  }
  // Architecture uses a cached shadow map; a light contact shadow follows the avatar.
  group.traverse(o => { if (o instanceof THREE.Mesh) o.castShadow = false; });
  const shadow = mesh(group, new THREE.CircleGeometry(.65, 24), new THREE.MeshBasicMaterial({ color: '#45574c', transparent: true, opacity: .17, depthWrite: false }), 0, .035, 0);
  shadow.rotation.x = -Math.PI / 2; shadow.scale.y = .65; shadow.receiveShadow = false;
  return group;
}

export class Universe {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(44, 1, .1, 300);
  world = new THREE.Group();
  avatar: THREE.Group;
  hotspots: Hotspot[] = [];
  current: WorldId = 'hub';
  active = false;
  keys = new Set<string>();
  touch = new THREE.Vector2();
  onInteract: (action: HotspotAction) => void = () => {};
  onNear: (hotspot: Hotspot | null) => void = () => {};
  onFrame: (hotspots: Hotspot[], camera: THREE.Camera) => void = () => {};
  private clock = new THREE.Clock();
  private elapsed = 0;
  private obstacles: { x: number; z: number; radius: number }[] = [];
  private movingParts: THREE.Object3D[] = [];
  private water: THREE.Mesh | null = null;
  private near: Hotspot | null = null;
  private paused = false;
  private target = new THREE.Vector3();
  private pointerStart: { x: number; y: number } | null = null;
  private rendererRunning = true;
  private sun: THREE.DirectionalLight;
  private needsFrame = true;

  constructor(private canvas: HTMLCanvasElement, outfit: OutfitId) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, SETTINGS.maxPixelRatio));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.scene.background = new THREE.Color('#a5d0ed');
    this.scene.fog = new THREE.Fog('#cee4ec', 65, 170);
    this.scene.add(new THREE.HemisphereLight('#e5f4ff', '#b7b098', 2.5));
    const sun = new THREE.DirectionalLight('#fff4db', 3.7);
    this.sun = sun;
    sun.position.set(-22, 38, 16); sun.castShadow = true;
    const shadowSize = matchMedia('(pointer: coarse)').matches ? 1024 : 2048;
    sun.shadow.mapSize.set(shadowSize, shadowSize);
    Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 1, far: 100 });
    sun.shadow.bias = -.0005; sun.shadow.normalBias = .04;
    sun.shadow.autoUpdate = false;
    this.scene.add(sun);
    this.buildHorizon();
    this.scene.add(this.world);
    this.avatar = makeAvatar(outfit); this.scene.add(this.avatar);
    this.loadWorld('hub');
    this.camera.position.set(34, 30, 43); this.camera.lookAt(-2, 0, 0);
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('keydown', e => {
      if (!this.active || this.paused || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
      this.keys.add(e.key.toLowerCase());
      if (e.key.toLowerCase() === 'e' && !e.repeat && this.near) this.onInteract(this.near.action);
    });
    window.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.clearMovement());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.clearMovement(); });
    canvas.addEventListener('pointerdown', e => { this.pointerStart = { x: e.clientX, y: e.clientY }; });
    canvas.addEventListener('pointerup', e => {
      if (!this.active || this.paused || !this.pointerStart || Math.hypot(e.clientX - this.pointerStart.x, e.clientY - this.pointerStart.y) > 12) return;
      const p = new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1);
      const ray = new THREE.Raycaster(); ray.setFromCamera(p, this.camera);
      const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const hit = new THREE.Vector3();
      if (ray.ray.intersectPlane(ground, hit)) {
        const spot = this.hotspots.find(h => Math.hypot(h.position.x - hit.x, h.position.z - hit.z) < 3);
        if (spot && this.avatar.position.distanceTo(spot.position) < SETTINGS.interactionDistance + 1) this.onInteract(spot.action);
      }
    });
    canvas.addEventListener('webglcontextlost', e => {
      e.preventDefault(); this.rendererRunning = false;
      document.dispatchEvent(new CustomEvent('aether:graphics-lost'));
    });
    this.animate();
  }

  setPaused(paused: boolean) { this.paused = paused; this.needsFrame = true; this.clearMovement(); }
  clearMovement() { this.keys.clear(); this.touch.set(0, 0); }
  changeOutfit(id: OutfitId) {
    const pos = this.avatar.position.clone(); const rotation = this.avatar.rotation.y;
    this.scene.remove(this.avatar); this.disposeGeometry(this.avatar);
    this.avatar = makeAvatar(id); this.avatar.position.copy(pos); this.avatar.rotation.y = rotation; this.scene.add(this.avatar);
  }
  private disposeGeometry(root: THREE.Object3D) {
    root.traverse(o => { if (o instanceof THREE.Mesh) o.geometry.dispose(); });
  }
  private resize() {
    this.renderer.setSize(innerWidth, innerHeight, false);
    this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix();
    this.needsFrame = true;
  }
  private buildHorizon() {
    const horizon = new THREE.Group(); this.scene.add(horizon);
    for (let i = 0; i < 30; i++) {
      const a = i * 2.39996; const r = 65 + i % 4 * 12;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      const cloud = mesh(horizon, new THREE.SphereGeometry(7 + i % 5, 12, 8), mat('#f2f1e7'), x, -8 - i % 4 * 2, z);
      cloud.scale.set(2.2, .4, 1.1);
      if (i % 3 === 0) {
        const island = mesh(horizon, new THREE.ConeGeometry(7, 14, 6), mat('#b6c2bc'), x, -9, z);
        island.rotation.z = Math.PI;
        cylinder(horizon, x, -1.5, z, 7, 6.5, 1, '#e1dfcf', 24);
        for (const dx of [-3, 0, 3]) cylinder(horizon, x + dx, 1.5, z, .35, .45, 5, '#eeebdf', 8);
        box(horizon, x, 4.1, z, 9, .55, 2);
      }
    }
  }
  loadWorld(id: WorldId) {
    this.current = id; this.clearMovement();
    this.scene.remove(this.world); this.disposeGeometry(this.world);
    this.world = new THREE.Group(); this.scene.add(this.world);
    this.hotspots = []; this.obstacles = []; this.movingParts = []; this.water = null; this.near = null;
    this.platform();
    if (id === 'hub') this.hub();
    if (id === 'observatory') this.observatory();
    if (id === 'atelier') this.atelier();
    const [x, z] = WORLDS[id].spawn;
    this.avatar.position.set(x, 0, z); this.avatar.rotation.y = Math.PI;
    this.sun.shadow.needsUpdate = true;
    this.needsFrame = true;
    this.onNear(null);
  }
  private platform() {
    cylinder(this.world, 0, -1.25, 0, 26, 24, 2.2, palette.side, 96);
    cylinder(this.world, 0, -.12, 0, 26.5, 26.5, .24, palette.light, 96);
    ring(this.world, 25.8, .07, 0, .025, 0);
    ring(this.world, 23.8, .025, 0, .02, 0, '#c9c1ac');
    ring(this.world, 17.8, .018, 0, .025, 0, '#c9c1ac');
    ring(this.world, 10.5, .025, 0, .025, 0, '#c9c1ac');
    // Radial stone joints and the main arrival path.
    for (let i = 0; i < 32; i++) {
      const a = i * Math.PI / 16;
      const line = box(this.world, Math.sin(a) * 17.2, .015, Math.cos(a) * 17.2, .022, .015, 16.5, '#dbd6c8');
      line.rotation.y = a;
    }
    for (const x of [-2.65, 2.65]) box(this.world, x, .03, 15, .05, .025, 17, palette.gold);
    // Terraced rail, deliberately open at the front for a sky view.
    for (let i = 0; i < 22; i++) {
      const a = Math.PI * .55 + i / 21 * Math.PI * .9;
      const x = Math.cos(a) * 24.5, z = -Math.sin(a) * 24.5;
      box(this.world, x, .7, z, .4, 1.4, .4);
    }
    for (const x of [-20, 20]) for (const z of [2, 12]) tree(this.world, x, z, .85 + (z === 2 ? .1 : 0));
    for (const x of [-7, 7]) tree(this.world, x, 16, .7);
  }
  private addHotspot(title: string, subtitle: string, action: HotspotAction, x: number, z: number, labelHeight: number, color: string) {
    this.hotspots.push({ title, subtitle, action, position: new THREE.Vector3(x, 0, z), labelHeight, color });
    ring(this.world, 2.7, .025, x, .045, z, color);
  }
  private portal(x: number, z: number, id: 'observatory' | 'atelier') {
    const color = WORLDS[id].color;
    cylinder(this.world, x, .14, z, 3.5, 3.7, .28, palette.light, 48);
    const frame = ring(this.world, 2.35, .13, x, 2.8, z); frame.rotation.x = 0;
    const inner = ring(this.world, 2.14, .045, x, 2.8, z, color); inner.rotation.x = 0;
    const portalMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .65, transparent: true, opacity: .26, side: THREE.DoubleSide, depthWrite: false, roughness: .1 });
    mesh(this.world, new THREE.CircleGeometry(2.1, 64), portalMat, x, 2.8, z);
    for (const dx of [-2.9, 2.9]) {
      box(this.world, x + dx, 2.5, z, .65, 5, .85);
      box(this.world, x + dx, 5.15, z, .85, .3, 1, palette.gold);
      mesh(this.world, new THREE.OctahedronGeometry(.32), mat(color, .3), x + dx, 5.7, z);
    }
    // World symbols suspended in each doorway.
    const icon = new THREE.Group(); icon.position.set(x, 2.8, z + .12); this.world.add(icon);
    if (id === 'observatory') {
      const orbit = ring(icon, .83, .035, 0, 0, 0, '#e5f3ec'); orbit.rotation.set(.4, .5, 0);
      mesh(icon, new THREE.OctahedronGeometry(.4), mat('#f0f8e4', .4), 0, 0, 0);
    } else {
      const diamond = mesh(icon, new THREE.OctahedronGeometry(.7, 0), mat('#fff0d1', .45), 0, 0, 0);
      diamond.scale.set(.7, 1, .4);
    }
    this.movingParts.push(icon);
    this.addHotspot(WORLDS[id].name, id === 'observatory' ? 'LEARN · REFLECT · DISCOVER' : 'CREATE · APPLY · EVOLVE', id, x, z, 6.5, color);
    this.obstacles.push({ x, z, radius: 1.6 });
  }
  private hub() {
    cylinder(this.world, 0, .12, -1, 5.2, 5.3, .24, palette.light, 64);
    ring(this.world, 4.9, .065, 0, .3, -1);
    const waterMat = new THREE.MeshPhysicalMaterial({ color: '#64b8bf', metalness: .35, roughness: .15, transparent: true, opacity: .86, clearcoat: 1 });
    this.water = mesh(this.world, new THREE.CylinderGeometry(4.85, 4.85, .06, 64), waterMat, 0, .27, -1);
    for (const r of [2, 3, 4]) ring(this.world, r, .016, 0, .32, -1, '#a9dfd7');
    cylinder(this.world, 0, .62, -1, 1.5, 1.8, .7);
    cylinder(this.world, 0, 1.3, -1, .75, 1, .8, palette.gold);
    const sculpture = new THREE.Group(); sculpture.position.set(0, 3.05, -1); this.world.add(sculpture);
    mesh(sculpture, new THREE.SphereGeometry(.85, 32, 24), mat('#d0b879', .72, .23));
    for (const [radius, rx, rz] of [[1.9, .8, .3], [1.65, -.7, -.5], [1.35, .1, 1.2]]) {
      const orbit = ring(sculpture, radius, .045, 0, 0, 0); orbit.rotation.set(rx, 0, rz);
    }
    this.movingParts.push(sculpture);
    this.obstacles.push({ x: 0, z: -1, radius: 5.35 });
    this.portal(-12, -7, 'observatory'); this.portal(12, -7, 'atelier');
    // Monumental open colonnade behind the celestial plaza.
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * .17 + i / 8 * Math.PI * .66;
      const x = Math.cos(a) * 22, z = -Math.sin(a) * 22;
      column(this.world, x, z, i === 4 ? 10 : 8);
      const lintel = box(this.world, x, (i === 4 ? 11 : 9), z, 6.3, .65, 1.7);
      lintel.rotation.y = Math.PI / 2 - a;
      const trim = box(this.world, x, (i === 4 ? 11.4 : 9.4), z, 6.3, .12, 1.8, palette.gold);
      trim.rotation.y = Math.PI / 2 - a;
    }
    steps(this.world, 0, -14, 9);
    // A wardrobe pavilion with a suspended faceted garment emblem.
    const wx = 15, wz = 7;
    cylinder(this.world, wx, .15, wz, 3.1, 3.25, .3);
    for (const dx of [-2, 2]) column(this.world, wx + dx, wz - 1, 4.4);
    box(this.world, wx, 5.45, wz - 1, 5.6, .35, 3.3);
    box(this.world, wx, 5.7, wz - 1, 5.7, .12, 3.4, palette.gold);
    const symbol = mesh(this.world, new THREE.OctahedronGeometry(.8), mat('#b9ad8a', .6), wx, 2.8, wz);
    symbol.scale.set(.55, 1, .55); this.movingParts.push(symbol);
    this.addHotspot('Wardrobe Atelier', 'A DIFFERENT EXPRESSION OF YOU', 'wardrobe', wx, wz, 6.6, '#9b8659');
    this.obstacles.push({ x: wx, z: wz, radius: 1 });
    for (const x of [-18, 18]) tree(this.world, x, -13, 1.2);
  }
  private observatory() {
    for (const x of [-16, -8, 0, 8, 16]) column(this.world, x, -17, 8);
    box(this.world, 0, 9.1, -17, 35, .6, 2);
    box(this.world, 0, 9.5, -17, 35.5, .12, 2.2, palette.gold);
    // Open dome ribs and an articulated telescope.
    const dome = new THREE.Group(); dome.position.set(0, 4.5, -11); this.world.add(dome);
    for (let i = 0; i < 5; i++) {
      const arc = mesh(dome, new THREE.TorusGeometry(6, .07, 8, 64, Math.PI), mat('#789fa9', .4));
      arc.rotation.y = i * Math.PI / 5;
    }
    cylinder(this.world, 0, .3, -10, 5, 5.2, .6);
    cylinder(this.world, 0, 1.8, -10, .45, .85, 3, '#93a7a9');
    const telescope = new THREE.Group(); telescope.position.set(0, 3.8, -10); telescope.rotation.z = -.65; this.world.add(telescope);
    cylinder(telescope, 0, 0, 0, .65, .4, 4, '#e6e6dc');
    cylinder(telescope, 0, 2, 0, .72, .72, .3, palette.gold);
    cylinder(telescope, 0, 2.17, 0, .58, .58, .05, '#3d7189');
    this.obstacles.push({ x: 0, z: -10, radius: 4.2 });
    for (const x of [-13, 13]) {
      box(this.world, x, 2.2, -9, 5, 4.4, 1, '#d3c9ac');
      for (let y = .4; y < 4.4; y += 1.05) {
        box(this.world, x, y, -8.4, 4.8, .12, 1, palette.light);
        for (let j = 0; j < 11; j++) box(this.world, x - 2 + j * .39, y + .42, -8.5, .22, .65 + j % 3 * .08, .65, ['#6a8992', '#b9a271', '#f2e9cf', '#415c65'][j % 4]);
      }
      this.obstacles.push({ x, z: -9, radius: 3 });
    }
    desk(this.world, 0, 1);
    this.obstacles.push({ x: 0, z: 1, radius: 1.8 });
    this.addHotspot('Focus + Notes', 'A QUIET MOMENT FOR CURIOSITY', 'focus', 0, 1, 4.5, '#4285a4');
    for (const x of [-13, 13]) tree(this.world, x, 6);
    // Floor constellation points.
    for (let i = 0; i < 14; i++) {
      const a = i * 2.399;
      cylinder(this.world, Math.cos(a) * (9 + i % 3), .05, Math.sin(a) * (9 + i % 3), .065, .065, .04, '#85a7b2', 8);
    }
  }
  private atelier() {
    for (const x of [-17, 17]) {
      for (const z of [-13, -6, 1]) column(this.world, x, z, 7);
      box(this.world, x, 8.2, -6, 2, .5, 19);
      box(this.world, x, 8.55, -6, 2.1, .1, 19, '#b78560');
    }
    // Slatted skylight, pin boards and generous worktables.
    for (let x = -15; x <= 15; x += 3) box(this.world, x, 8.5, -12, .16, .24, 10, '#cfb78b');
    for (const x of [-9, 9]) {
      desk(this.world, x, -9, true);
      box(this.world, x, 3.3, -13, 5.5, 4, .3, '#ad9677');
      box(this.world, x, 3.3, -12.8, 5.1, 3.6, .08, '#ece3cd');
      for (let i = 0; i < 6; i++) {
        const paper = box(this.world, x - 1.6 + i % 3 * 1.55, 2.5 + Math.floor(i / 3) * 1.6, -12.7, 1.1, 1.1, .025, ['#9eb6ae', '#e1c294', '#afc5d0'][i % 3]);
        paper.rotation.z = (i % 2 ? 1 : -1) * .06;
      }
      this.obstacles.push({ x, z: -9, radius: 3 });
    }
    desk(this.world, 0, 1, true);
    box(this.world, .7, 2.35, .7, 1.7, 1.2, .12, '#a87955');
    box(this.world, .7, 2.35, .79, 1.5, .98, .03, '#415d65');
    box(this.world, .7, 1.8, .7, .15, .4, .15, '#a87955');
    this.addHotspot('Workflow Board', 'TURN A SPARK INTO SOMETHING REAL', 'board', 0, 1, 4.7, '#b6754d');
    this.obstacles.push({ x: 0, z: 1, radius: 1.8 });
    for (const x of [-12, 12]) tree(this.world, x, 7);
    cylinder(this.world, 0, .2, -10, 3.8, 4, .4);
    const sculpture = new THREE.Group(); sculpture.position.set(0, 2.6, -10); this.world.add(sculpture);
    const cube = mesh(sculpture, new THREE.BoxGeometry(2.4, 2.4, 2.4), mat('#a1b9b4', .35)); cube.rotation.set(.3, .4, .2);
    const orbit = ring(sculpture, 2.5, .055, 0, 0, 0, '#b78560'); orbit.rotation.x = .6;
    this.movingParts.push(sculpture); this.obstacles.push({ x: 0, z: -10, radius: 4 });
  }
  private animate = () => {
    requestAnimationFrame(this.animate);
    if (!this.rendererRunning) return;
    const dt = Math.min(this.clock.getDelta(), .1); this.elapsed += dt;
    if (document.hidden || (this.paused && !this.needsFrame)) return;
    this.needsFrame = false;
    const time = this.elapsed;
    for (const part of this.movingParts) part.rotation.y += dt * .18;
    if (this.water) (this.water.material as THREE.MeshPhysicalMaterial).roughness = .16 + Math.sin(time * .4) * .04;
    if (this.active) {
      const direction = new THREE.Vector2();
      if (!this.paused) {
        direction.set(Number(this.keys.has('d') || this.keys.has('arrowright')) - Number(this.keys.has('a') || this.keys.has('arrowleft')) + this.touch.x,
          Number(this.keys.has('s') || this.keys.has('arrowdown')) - Number(this.keys.has('w') || this.keys.has('arrowup')) + this.touch.y);
      }
      if (direction.lengthSq() > 0) {
        direction.normalize();
        const next = this.avatar.position.clone().add(new THREE.Vector3(direction.x, 0, direction.y).multiplyScalar(dt * SETTINGS.speed));
        const canMove = (x: number, z: number) => Math.hypot(x, z) < SETTINGS.worldRadius && !this.obstacles.some(o => Math.hypot(x - o.x, z - o.z) < o.radius + .35);
        // Separate axes allow sliding along architecture instead of getting stuck.
        if (canMove(next.x, this.avatar.position.z)) this.avatar.position.x = next.x;
        if (canMove(this.avatar.position.x, next.z)) this.avatar.position.z = next.z;
        const desired = Math.atan2(direction.x, direction.y);
        this.avatar.rotation.y += Math.atan2(Math.sin(desired - this.avatar.rotation.y), Math.cos(desired - this.avatar.rotation.y)) * Math.min(1, dt * 13);
      }
      for (const [name, phase] of [['leftLeg', 0], ['rightLeg', Math.PI], ['leftArm', Math.PI], ['rightArm', 0]] as const) {
        const limb = this.avatar.getObjectByName(name);
        if (limb) limb.rotation.x = direction.lengthSq() ? Math.sin(time * 12 + phase) * .4 : 0;
      }
      this.target.copy(this.avatar.position).add(new THREE.Vector3(0, 18.5, innerWidth < 700 ? 30 : 25));
      this.camera.position.lerp(this.target, 1 - Math.exp(-dt * 3));
      this.target.copy(this.avatar.position).add(new THREE.Vector3(0, 0, -11));
      this.camera.lookAt(this.target);
      const near = this.hotspots.find(h => this.avatar.position.distanceTo(h.position) < SETTINGS.interactionDistance) ?? null;
      if (near !== this.near) { this.near = near; this.onNear(near); }
    } else {
      this.camera.position.x = 34 + Math.sin(time * .06) * 3;
      this.camera.lookAt(-2, 0, 0);
    }
    this.renderer.render(this.scene, this.camera);
    this.onFrame(this.hotspots, this.camera);
  };
}

export class AvatarPreview {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, .1, 30);
  private avatar: THREE.Group;
  visible = false;
  constructor(private canvas: HTMLCanvasElement, outfit: OutfitId) {
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.scene.add(new THREE.HemisphereLight('#ffffff', '#b3ac97', 3));
    const light = new THREE.DirectionalLight('#fff4dc', 4); light.position.set(3, 5, 4); this.scene.add(light);
    this.avatar = makeAvatar(outfit); this.scene.add(this.avatar);
    cylinder(this.scene, 0, -.08, 0, .95, 1, .15, '#d9d2be');
    ring(this.scene, .92, .025, 0, .01, 0);
    this.camera.position.set(3, 2.8, 5.7); this.camera.lookAt(0, 1.1, 0);
    this.animate();
  }
  change(id: OutfitId) {
    this.scene.remove(this.avatar);
    this.avatar.traverse(o => { if (o instanceof THREE.Mesh) o.geometry.dispose(); });
    this.avatar = makeAvatar(id); this.scene.add(this.avatar);
  }
  private animate = () => {
    requestAnimationFrame(this.animate);
    if (!this.visible) return;
    const { width, height } = this.canvas.getBoundingClientRect();
    if (!width || !height) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
    this.avatar.rotation.y = Math.sin(performance.now() * .0003) * .35;
    this.renderer.render(this.scene, this.camera);
  };
}
