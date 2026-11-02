// Мебель, для которой нет GLB-модели, собирается в коде из простых блоков: стул, комод, тумба, стеллаж, пуф, скамья.
// Размеры — в метрах, начало координат — на полу по центру
import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry } from "three";
import type { ModelColors } from "./models";

export type ProceduralModel = "chair" | "dresser" | "nightstand" | "shelf" | "pouf" | "bench";

const brass = () => new MeshStandardMaterial({ color: "#c9a25a", roughness: 0.3, metalness: 0.8 });
const wood = (color: string) => new MeshStandardMaterial({ color, roughness: 0.55 });
const fabric = (color: string) => new MeshStandardMaterial({ color, roughness: 0.9 });

// Добавляет в группу блок w×h×d с центром в (x, y, z)
function addBox(group: Group, size: [number, number, number], position: [number, number, number], material: MeshStandardMaterial) {
  const mesh = new Mesh(new BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
}

// Четыре ножки по углам прямоугольника width × depth
function addLegs(group: Group, width: number, depth: number, height: number, thickness: number, material: MeshStandardMaterial) {
  for (const x of [-1, 1]) {
    for (const z of [-1, 1]) {
      addBox(group, [thickness, height, thickness], [(x * (width - thickness)) / 2, height / 2, (z * (depth - thickness)) / 2], material);
    }
  }
}

function buildChair(colors: ModelColors) {
  const group = new Group();
  const legs = wood(colors.wood ?? "#8A5A3A");
  const seat = fabric(colors.main);
  addLegs(group, 0.45, 0.45, 0.44, 0.035, legs);
  addBox(group, [0.45, 0.03, 0.45], [0, 0.455, 0], legs);
  addBox(group, [0.44, 0.07, 0.44], [0, 0.505, 0.005], seat);
  for (const x of [-0.2075, 0.2075]) {
    addBox(group, [0.035, 0.46, 0.035], [x, 0.7, -0.2075], legs);
  }
  addBox(group, [0.42, 0.26, 0.05], [0, 0.8, -0.2], seat);
  return group;
}

function buildDresser(colors: ModelColors) {
  const group = new Group();
  const body = wood(colors.main);
  const handle = brass();
  addLegs(group, 0.96, 0.42, 0.08, 0.05, body);
  addBox(group, [1, 0.8, 0.45], [0, 0.48, 0], body);
  addBox(group, [1.04, 0.03, 0.48], [0, 0.895, 0], body);
  for (let index = 0; index < 4; index++) {
    const y = 0.18 + index * 0.2;
    addBox(group, [0.94, 0.18, 0.02], [0, y, 0.235], body);
    addBox(group, [0.22, 0.02, 0.025], [0, y, 0.255], handle);
  }
  return group;
}

function buildNightstand(colors: ModelColors) {
  const group = new Group();
  const body = wood(colors.main);
  const inside = new MeshStandardMaterial({ color: "#1a120c", roughness: 0.8 });
  addLegs(group, 0.44, 0.38, 0.14, 0.03, body);
  addBox(group, [0.45, 0.42, 0.4], [0, 0.35, 0], body);
  // Открытая полка снизу — тёмная ниша
  addBox(group, [0.39, 0.15, 0.02], [0, 0.24, 0.191], inside);
  addBox(group, [0.41, 0.14, 0.02], [0, 0.47, 0.205], body);
  addBox(group, [0.12, 0.02, 0.025], [0, 0.47, 0.225], brass());
  return group;
}

function buildShelf(colors: ModelColors) {
  const group = new Group();
  const body = wood(colors.main);
  for (const x of [-0.5, 0.5]) {
    addBox(group, [0.025, 1.9, 0.35], [x, 0.95, 0], body);
  }
  for (let index = 0; index < 5; index++) {
    addBox(group, [1, 0.025, 0.35], [0, 0.05 + index * 0.45, 0], body);
  }
  // Книги на трёх полках — чтобы было видно, что это стеллаж
  const covers = ["#7A2638", "#26365C", "#B8834F", "#1F6B55", "#ECE6D8", "#4A4A4E"];
  for (let shelf = 1; shelf <= 3; shelf++) {
    let x = -0.44;
    for (let book = 0; book < 6 + shelf; book++) {
      const width = 0.04 + ((book * 7 + shelf) % 3) * 0.012;
      const height = 0.24 + ((book * 5 + shelf) % 4) * 0.03;
      addBox(group, [width, height, 0.24], [x + width / 2, 0.0625 + shelf * 0.45 + height / 2, 0], fabric(covers[(book + shelf) % covers.length]));
      x += width + 0.006;
      if (x > 0.3) break;
    }
  }
  return group;
}

function buildPouf(colors: ModelColors) {
  const group = new Group();
  const cover = fabric(colors.main);
  const body = new Mesh(new CylinderGeometry(0.28, 0.27, 0.38, 48), cover);
  body.position.y = 0.21;
  const top = new Mesh(new CylinderGeometry(0.27, 0.28, 0.06, 48), cover);
  top.position.y = 0.43;
  const button = new Mesh(new SphereGeometry(0.02, 16, 12), cover);
  button.position.y = 0.46;
  const base = new Mesh(new CylinderGeometry(0.25, 0.25, 0.02, 48), wood(colors.wood ?? "#3B2A20"));
  base.position.y = 0.01;
  for (const mesh of [body, top, button, base]) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  return group;
}

function buildBench(colors: ModelColors) {
  const group = new Group();
  const body = wood(colors.main);
  addLegs(group, 1.3, 0.32, 0.42, 0.05, body);
  addBox(group, [1.4, 0.05, 0.36], [0, 0.445, 0], body);
  addBox(group, [1.24, 0.025, 0.28], [0, 0.12, 0], body);
  return group;
}

const BUILDERS: Record<ProceduralModel, (colors: ModelColors) => Group> = {
  chair: buildChair,
  dresser: buildDresser,
  nightstand: buildNightstand,
  shelf: buildShelf,
  pouf: buildPouf,
  bench: buildBench,
};

export function buildProcedural(type: ProceduralModel, colors: ModelColors) {
  return BUILDERS[type](colors);
}
