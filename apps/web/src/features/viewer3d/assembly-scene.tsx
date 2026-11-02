"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import { BufferAttribute, BufferGeometry, Color, Mesh, type MeshStandardMaterial, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MODEL_URLS, paintModel, prepareModel, setupLoader } from "./models";
import { Studio } from "./studio";

type Piece = {
  mesh: Mesh;
  material: MeshStandardMaterial & { sheenColor?: Color };
  step: number;
  from: Vector3;
  to: Vector3;
  rot: number;
  // Только у ткани: серая «глина» → цвет обивки на последнем шаге
  raw?: Color;
  final?: Color;
};

const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const CLAY = new Color("#D8D2C6").multiplyScalar(0.55);

// Геометрия меша в мировых координатах, с обычными float-атрибутами (модель сжата и квантована)
function worldGeometry(mesh: Mesh) {
  const source = mesh.geometry as BufferGeometry;
  const geometry = new BufferGeometry();
  for (const name of ["position", "normal", "uv"]) {
    const attribute = source.getAttribute(name);
    if (!attribute) {
      continue;
    }
    const array = new Float32Array(attribute.count * attribute.itemSize);
    for (let i = 0; i < attribute.count; i++) {
      array[i * attribute.itemSize] = attribute.getX(i);
      array[i * attribute.itemSize + 1] = attribute.getY(i);
      if (attribute.itemSize > 2) {
        array[i * attribute.itemSize + 2] = attribute.getZ(i);
      }
    }
    geometry.setAttribute(name, new BufferAttribute(array, attribute.itemSize));
  }
  if (source.index) {
    geometry.setIndex(Array.from(source.index.array));
  }
  geometry.applyMatrix4(mesh.matrixWorld);
  return geometry.toNonIndexed();
}

// Ткань делится на три секции по положению треугольника: левая, центральная, правая
function splitBySection(geometry: BufferGeometry) {
  const position = geometry.getAttribute("position");
  const groups: Record<"L" | "C" | "R", number[]> = { L: [], C: [], R: [] };
  for (let tri = 0; tri < position.count / 3; tri++) {
    const x = (position.getX(tri * 3) + position.getX(tri * 3 + 1) + position.getX(tri * 3 + 2)) / 3;
    groups[x < -0.38 ? "L" : x > 0.38 ? "R" : "C"].push(tri);
  }
  return (Object.keys(groups) as ("L" | "C" | "R")[]).map((key) => {
    const part = new BufferGeometry();
    for (const name of Object.keys(geometry.attributes)) {
      const attribute = geometry.getAttribute(name);
      const size = attribute.itemSize;
      const array = new Float32Array(groups[key].length * 3 * size);
      groups[key].forEach((tri, i) => {
        for (let v = 0; v < 3; v++) {
          for (let c = 0; c < size; c++) {
            array[(i * 3 + v) * size + c] = attribute.array[(tri * 3 + v) * size + c];
          }
        }
      });
      part.setAttribute(name, new BufferAttribute(array, size));
    }
    return { key, geometry: part };
  });
}

// Деталь стоит в центре своей геометрии — так её удобно двигать и крутить
function makePiece(geometry: BufferGeometry, material: MeshStandardMaterial, step: number, offset: (to: Vector3) => Vector3, rot: number): Piece {
  geometry.computeBoundingBox();
  const to = geometry.boundingBox!.getCenter(new Vector3());
  geometry.translate(-to.x, -to.y, -to.z);
  const ownMaterial = material.clone() as Piece["material"];
  ownMaterial.transparent = true;
  ownMaterial.opacity = 0;
  const mesh = new Mesh(geometry, ownMaterial);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  // Деталь прилетает сверху и немного сбоку от своего места
  const d = offset(to).sub(to);
  const from = to.clone().add(new Vector3(d.x * 0.18, 0.9 + Math.min(0.8, Math.abs(d.y) * 0.12), d.z * 0.18));
  mesh.position.copy(from);
  return { mesh, material: ownMaterial, step, from, to, rot: rot * 0.3 };
}

function AssembledSofa({ progress }: { progress: React.RefObject<number> }) {
  const gltf = useLoader(GLTFLoader, MODEL_URLS.sofa, setupLoader);
  const current = useRef(0);

  const pieces = useMemo(() => {
    const sofa = prepareModel(gltf.scene, "sofa");
    paintModel(sofa, "sofa", { main: "#1F6B55", wood: "#6B4630" });
    sofa.updateMatrixWorld(true);

    const list: Piece[] = [];
    sofa.traverse((node) => {
      if (!(node instanceof Mesh)) {
        return;
      }
      const material = node.material as MeshStandardMaterial;
      const name = material.name.toLowerCase();
      const geometry = worldGeometry(node);
      if (name.includes("fabric")) {
        for (const part of splitBySection(geometry)) {
          const step = part.key === "C" ? 2 : part.key === "L" ? 3 : 4;
          const piece = makePiece(
            part.geometry,
            material,
            step,
            (to) =>
              part.key === "C"
                ? new Vector3(to.x, to.y + 2.4, to.z + 0.4)
                : new Vector3(to.x + (part.key === "L" ? -2.6 : 2.6), to.y + 0.6, to.z + 0.3),
            part.key === "C" ? -0.9 : part.key === "L" ? 1.2 : -1.2,
          );
          piece.final = material.color.clone();
          piece.raw = CLAY.clone();
          list.push(piece);
        }
      } else if (name.includes("leg")) {
        list.push(makePiece(geometry, material, 0, (to) => new Vector3(to.x * 1.5, -1.1, to.z * 2), 2.2));
      } else {
        list.push(makePiece(geometry, material, 1, (to) => new Vector3(to.x * 1.3, -0.9, to.z * 1.6 + 0.6), 1.6));
      }
    });
    return list;
  }, [gltf]);

  useFrame(({ camera }) => {
    // Плавно догоняем прокрутку
    current.current += (progress.current - current.current) * 0.09;
    const p = current.current;
    const paint = ease(clamp(p * 6 - 5));

    for (const piece of pieces) {
      const t = ease(clamp((p * 6 - piece.step) / 0.9));
      piece.mesh.position.lerpVectors(piece.from, piece.to, t);
      piece.mesh.rotation.y = piece.rot * (1 - t);
      piece.mesh.rotation.z = piece.rot * 0.25 * (1 - t);

      const alpha = Math.min(1, t * 2.4);
      piece.material.opacity = alpha;
      piece.material.transparent = alpha < 1;
      piece.material.depthWrite = alpha > 0.7;
      piece.mesh.visible = alpha > 0.01;
      piece.mesh.castShadow = alpha > 0.6;

      if (piece.raw && piece.final) {
        piece.material.color.copy(piece.raw).lerp(piece.final, paint);
        piece.material.sheenColor?.copy(piece.raw).lerp(piece.final, paint);
      }
    }

    const yaw = -0.9 + p * 1.5;
    const pitch = 0.42 - p * 0.14;
    const distance = 4.3 - p * 0.7;
    camera.position.set(
      Math.sin(yaw) * Math.cos(pitch) * distance,
      0.45 + Math.sin(pitch) * distance,
      Math.cos(yaw) * Math.cos(pitch) * distance,
    );
    camera.lookAt(0, 0.38, 0);
  });

  return (
    <>
      {pieces.map((piece, index) => (
        <primitive key={index} object={piece.mesh} />
      ))}
    </>
  );
}

// progress — от 0 до 1, насколько прокручена секция
export default function AssemblyScene({ progress }: { progress: React.RefObject<number> }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ fov: 30, near: 0.1, far: 60 }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.15;
      }}
    >
      <Studio shadow={0.45} />
      <Suspense fallback={null}>
        <AssembledSofa progress={progress} />
      </Suspense>
    </Canvas>
  );
}
