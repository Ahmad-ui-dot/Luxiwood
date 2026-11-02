// Настоящие 3D-модели мебели (как на холсте Luxiwood) и их перекраска.
// Модели: диван «Glam Velvet Sofa» © 2021 Wayfair (CC BY 4.0), кресло «Sheen Chair» © 2020 Wayfair (CC0),
// кровать «Gothic Bed 01» Poly Haven (CC0), стол — pmndrs market (CC0). Шкафа в GLB нет — он собирается из блоков.
import type { Model3dKey } from "@luxiwood/shared";
import { Box3, BoxGeometry, Color, Group, Mesh, MeshStandardMaterial, type Object3D, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

export type GlbModel = "sofa" | "armchair" | "bed" | "table";
export type ModelColors = { main: string; wood?: string };

// Цвета превью — как на холсте: изумрудный диван, карамельное кресло, кровать «полночь», шкаф и стол из дерева
export const PREVIEW_COLORS: Record<Model3dKey, { main: string; wood: string }> = {
  sofa: { main: "#1F6B55", wood: "#8A5A3A" },
  armchair: { main: "#B8834F", wood: "#1E1C1A" },
  bed: { main: "#26365C", wood: "#C29A6B" },
  wardrobe: { main: "#6B4630", wood: "#6B4630" },
  table: { main: "#C29A6B", wood: "#C29A6B" },
  chair: { main: "#B8834F", wood: "#6B4630" },
  dresser: { main: "#8A5A3A", wood: "#8A5A3A" },
  nightstand: { main: "#C29A6B", wood: "#C29A6B" },
  shelf: { main: "#D9BE94", wood: "#D9BE94" },
  pouf: { main: "#7A2638", wood: "#3B2A20" },
  bench: { main: "#6B4630", wood: "#6B4630" },
};

export function isGlbModel(type: Model3dKey): type is GlbModel {
  return type in MODEL_URLS;
}

export const MODEL_URLS: Record<GlbModel, string> = {
  sofa: "/models/sofa.glb",
  armchair: "/models/armchair.glb",
  bed: "/models/bed.glb",
  table: "/models/table.glb",
};

// Ширина модели в метрах — чтобы все модели были в одном масштабе
const WIDTH_M: Record<GlbModel, number> = { sofa: 2.1, armchair: 0.86, bed: 1.9, table: 1.6 };

// Модели сжаты meshopt, поэтому загрузчику нужен декодер
export function setupLoader(loader: GLTFLoader) {
  loader.setMeshoptDecoder(MeshoptDecoder);
}

export function createLoader() {
  const loader = new GLTFLoader();
  setupLoader(loader);
  return loader;
}

// Копия модели: по центру, стоит на полу, нужной ширины, с тенями
export function prepareModel(scene: Object3D, id: GlbModel): Group {
  const root = scene.clone(true);
  root.updateMatrixWorld(true);
  const box = new Box3().setFromObject(root);
  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  root.position.set(-center.x, -box.min.y, -center.z);

  const inner = new Group();
  inner.add(root);
  inner.scale.setScalar(WIDTH_M[id] / Math.max(size.x, 0.001));

  const group = new Group();
  group.add(inner);
  group.traverse((node) => {
    if (node instanceof Mesh) {
      node.castShadow = true;
      node.receiveShadow = true;
      node.material = node.material.clone();
    }
  });
  return group;
}

// Перекраска ткани и дерева. Коэффициенты подобраны на холсте, чтобы бархат и дерево выглядели естественно
export function paintModel(group: Group, id: GlbModel, colors: ModelColors) {
  const main = new Color(colors.main);
  const wood = new Color(colors.wood ?? "#6B4630");
  group.traverse((node) => {
    if (!(node instanceof Mesh)) {
      return;
    }
    const material = node.material as MeshStandardMaterial & { sheenColor?: Color };
    const name = (material.name || "").toLowerCase();
    if (id === "sofa" && name.includes("fabric")) {
      material.color.copy(main).multiplyScalar(0.45);
      material.sheenColor?.copy(main);
    }
    if (id === "armchair" && name.includes("fabric")) {
      material.map = null;
      material.color.copy(main).multiplyScalar(0.7);
      material.sheenColor?.copy(main);
      material.needsUpdate = true;
    }
    if (id === "armchair" && name.includes("wood")) {
      material.color.copy(wood).multiplyScalar(2.2);
    }
    if (id === "table" && name.includes("wood")) {
      material.color.copy(main).multiplyScalar(2.6);
    }
  });
}

// Шкаф из блоков: цоколь, корпус, три двери, латунные ручки, карниз
export function buildWardrobe(color: string): Group {
  const group = new Group();
  const body = new MeshStandardMaterial({ color, roughness: 0.5 });
  const brass = new MeshStandardMaterial({ color: "#c9a25a", roughness: 0.3, metalness: 0.8 });

  const box = (w: number, h: number, d: number, x: number, y: number, z: number, material: MeshStandardMaterial) => {
    const mesh = new Mesh(new BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  };

  box(1.56, 0.08, 0.56, 0, 0.04, 0, body);
  box(1.6, 2.04, 0.6, 0, 1.1, 0, body);
  box(1.66, 0.06, 0.64, 0, 2.15, 0, body);
  [-0.52, 0, 0.52].forEach((x) => {
    box(0.5, 1.96, 0.02, x, 1.1, 0.31, body);
    box(0.015, 0.22, 0.03, x + 0.2, 1.1, 0.33, brass);
  });
  return group;
}

// Камера смотрит на модель целиком: расстояние по размеру модели, yaw — поворот, pitch — наклон
export function cameraFor(object: Object3D, yaw: number, pitch: number, fit: number, fov = 30) {
  const size = new Box3().setFromObject(object).getSize(new Vector3());
  const radius = size.length() / 2;
  const distance = (radius / Math.sin(((fov / 2) * Math.PI) / 180)) * fit;
  const targetY = size.y * 0.48;
  const position = new Vector3(
    Math.sin(yaw) * Math.cos(pitch) * distance,
    targetY + Math.sin(pitch) * distance,
    Math.cos(yaw) * Math.cos(pitch) * distance,
  );
  return { position, target: new Vector3(0, targetY, 0) };
}
