"use client";

import type { Model3dKey } from "@luxiwood/shared";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Box3, type Group, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { buildWardrobe, type GlbModel, isGlbModel, MODEL_URLS, type ModelColors, paintModel, prepareModel, setupLoader } from "./models";
import { buildProcedural } from "./procedural";
import { Studio } from "./studio";

// Поворот и приближение меняют и мышь, и кнопки на панели — поэтому они в общем ref
export type ViewControls = { yaw: number; zoom: number };

type Props = {
  type: Model3dKey;
  colors: ModelColors;
  // Во сколько раз выбранный размер больше размера по умолчанию: ширина, высота, глубина
  scale: [number, number, number];
  controls: React.RefObject<ViewControls>;
};

const PITCH = 0.32;
const FOV = 30;

// Камера смотрит на модель размера по умолчанию: при выборе большего размера модель заметно растёт
function useCamera(model: Group, controls: React.RefObject<ViewControls>) {
  const { camera, gl } = useThree();
  const base = useMemo(() => new Box3().setFromObject(model).getSize(new Vector3()), [model]);
  const current = useRef({ yaw: controls.current.yaw, zoom: controls.current.zoom });

  useEffect(() => {
    const canvas = gl.domElement;
    let lastX: number | null = null;
    const down = (event: PointerEvent) => {
      lastX = event.clientX;
      canvas.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (lastX === null) return;
      controls.current.yaw -= (event.clientX - lastX) * 0.009;
      lastX = event.clientX;
    };
    const up = () => {
      lastX = null;
    };
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      controls.current.zoom = Math.min(Math.max(controls.current.zoom + event.deltaY * 0.001, 0.55), 1.5);
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("wheel", wheel, { passive: false });
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("wheel", wheel);
    };
  }, [gl, controls]);

  useFrame(() => {
    // Плавно догоняем целевые значения — кнопки поворачивают не рывком
    current.current.yaw += (controls.current.yaw - current.current.yaw) * 0.12;
    current.current.zoom += (controls.current.zoom - current.current.zoom) * 0.12;
    const radius = base.length() / 2;
    const distance = (radius / Math.sin(((FOV / 2) * Math.PI) / 180)) * 0.92 * current.current.zoom;
    const targetY = base.y * 0.5;
    const { yaw } = current.current;
    camera.position.set(
      Math.sin(yaw) * Math.cos(PITCH) * distance,
      targetY + Math.sin(PITCH) * distance,
      Math.cos(yaw) * Math.cos(PITCH) * distance,
    );
    camera.lookAt(0, targetY, 0);
  });
}

function Scaled({ model, scale }: { model: Group; scale: [number, number, number] }) {
  const target = useMemo(() => new Vector3(), []);
  useFrame(() => {
    target.set(...scale);
    model.scale.lerp(target, 0.15);
  });
  return <primitive object={model} />;
}

function GlbFurniture({ type, colors, scale, controls }: Props & { type: GlbModel }) {
  const gltf = useLoader(GLTFLoader, MODEL_URLS[type], setupLoader);
  const model = useMemo(() => prepareModel(gltf.scene, type), [gltf, type]);
  useEffect(() => {
    paintModel(model, type, colors);
  }, [model, type, colors]);
  useCamera(model, controls);
  return <Scaled model={model} scale={scale} />;
}

// Шкаф и мебель без GLB собираются из блоков — при смене цвета собираем заново, это быстро
function BuiltFurniture({ type, colors, scale, controls }: Props) {
  const model = useMemo(
    () => (type === "wardrobe" ? buildWardrobe(colors.main) : buildProcedural(type as Parameters<typeof buildProcedural>[0], colors)),
    [type, colors],
  );
  useCamera(model, controls);
  return <Scaled model={model} scale={scale} />;
}

export default function ProductScene(props: Props) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ fov: FOV, near: 0.1, far: 60 }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.15;
      }}
      style={{ touchAction: "pan-y", cursor: "grab" }}
    >
      <Studio shadow={0.5} />
      <Suspense fallback={null}>
        {isGlbModel(props.type) ? <GlbFurniture {...props} type={props.type} /> : <BuiltFurniture {...props} />}
      </Suspense>
    </Canvas>
  );
}
