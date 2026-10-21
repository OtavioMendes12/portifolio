/*
 * Escudo do Galo em 3D (three.js), a partir de public/galo/escudo-3d.bin
 * (gerado por scripts/stl-to-mesh.mjs a partir do STL fornecido).
 * O STL não tem cor: pintamos por camada de relevo.
 */
import {
  AmbientLight, BufferGeometry, Color, DirectionalLight, Float32BufferAttribute, Mesh,
  MeshStandardMaterial, PerspectiveCamera, PointLight, Scene, WebGLRenderer,
} from 'three';

// camadas: 0 = lados/fundo, 1 = face, 2 = relevo (listras e letras)
const LAYER_COLORS = ['#3d3d3d', '#0d0d0d', '#f4f4f4'];

let geometryPromise = null;

export function loadCrestGeometry() {
  geometryPromise ??= fetch('/galo/escudo-3d.bin')
    .then((r) => {
      if (!r.ok) throw new Error(`escudo-3d ${r.status}`);
      return r.arrayBuffer();
    })
    .then((buf) => {
      const n = new DataView(buf).getUint32(0, true);
      const raw = new Int16Array(buf, 4, n * 9);
      const layers = new Uint8Array(buf, 4 + n * 18, n);
      const positions = new Float32Array(n * 9);
      for (let i = 0; i < raw.length; i++) positions[i] = raw[i] / 32767;
      const colors = new Float32Array(n * 9);
      const palette = LAYER_COLORS.map((c) => new Color(c).convertSRGBToLinear());
      for (let t = 0; t < n; t++) {
        const c = palette[layers[t]];
        for (let v = 0; v < 3; v++) colors.set([c.r, c.g, c.b], t * 9 + v * 3);
      }
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
      geometry.computeVertexNormals(); // não indexado = normais por face (arestas nítidas)
      return geometry;
    });
  return geometryPromise;
}

/** O navegador consegue WebGL? (checado antes, para não poluir o console com erros do three.js) */
export const supportsWebGL = () => {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
};

/** Monta renderer + cena num canvas. rim = cor da luz de contorno (o --accent do tema). */
export function createCrestScene(canvas, geometry, { rim = '#ffd503', width, height, preserve = false } = {}) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: preserve });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, width / height, 0.1, 20);
  camera.position.set(0, 0, 4.4);

  const material = new MeshStandardMaterial({ vertexColors: true, metalness: 0.35, roughness: 0.45 });
  const mesh = new Mesh(geometry, material);
  scene.add(mesh);

  scene.add(new AmbientLight('#ffffff', 0.9));
  const key = new DirectionalLight('#ffffff', 2.2);
  key.position.set(1.5, 2, 4);
  scene.add(key);
  const rimLight = new PointLight(rim, 18, 0, 2);
  rimLight.position.set(-2.5, 1.5, 1.2);
  scene.add(rimLight);

  return {
    renderer,
    mesh,
    render: () => renderer.render(scene, camera),
    setRim: (color) => rimLight.color.set(color),
    dispose: () => {
      material.dispose();
      renderer.dispose();
    },
  };
}

/** Foto de frente do escudo (data URL), usada pelo neofetch para gerar a arte braille. */
export async function crestSnapshot(size = 240) {
  const geometry = await loadCrestGeometry();
  const canvas = document.createElement('canvas');
  const ctx = createCrestScene(canvas, geometry, { width: size, height: size, preserve: true, rim: '#ffffff' });
  ctx.renderer.setPixelRatio(1);
  ctx.renderer.setSize(size, size, false);
  ctx.render();
  const url = canvas.toDataURL('image/png');
  ctx.dispose();
  return url;
}
