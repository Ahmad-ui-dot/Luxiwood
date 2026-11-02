"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { cameraFor, MODEL_URLS, paintModel, prepareModel, setupLoader } from "./models";
import { Studio } from "./studio";

const PITCH = 0.36;
const FIT = 0.86;

// Диван с выбранной обивкой. Тянешь мышью или пальцем — поворачивается вокруг своей оси
function Sofa({ fabricHex }: { fabricHex: string }) {
  const gltf = useLoader(GLTFLoader, MODEL_URLS.sofa, setupLoader);
  const sofa = useMemo(() => prepareModel(gltf.scene, "sofa"), [gltf]);
  const { camera, gl } = useThree();
  const yaw = useRef(-0.62);

  useEffect(() => {
    paintModel(sofa, "sofa", { main: fabricHex, wood: "#6B4630" });
  }, [sofa, fabricHex]);
  useEffect(() => {
    const canvas = gl.domElement;
    let lastX: number | null = null;
    const down = (event: PointerEvent) => {
      lastX = event.clientX;
      canvas.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (lastX === null) {
        return;
      }
      yaw.current -= (event.clientX - lastX) * 0.009;
      lastX = event.clientX;
    };
    const up = () => {
      lastX = null;
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    };
  }, [gl]);

  useFrame(() => {
    const view = cameraFor(sofa, yaw.current, PITCH, FIT);
    camera.position.copy(view.position);
    camera.lookAt(view.target);
  });

  return <primitive object={sofa} />;
}

export default function HeroSofaScene({ fabricHex }: { fabricHex: string }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ fov: 30, near: 0.1, far: 60 }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.2;
      }}
      style={{ touchAction: "pan-y", cursor: "grab" }}
    >
      <Studio shadow={0.5} />
      <Suspense fallback={null}>
        <Sofa fabricHex={fabricHex} />
      </Suspense>
    </Canvas>
  );
}
