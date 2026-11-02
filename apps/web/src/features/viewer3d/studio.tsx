"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { PMREMGenerator } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// Студийный свет как на холсте: мягкое окружение комнаты, ключевой свет с тенью, тёплый контровой и тень на полу
export function Studio({ shadow = 0.45 }: { shadow?: number }) {
  const { gl, scene } = useThree();

  useEffect(() => {
    const generator = new PMREMGenerator(gl);
    const environment = generator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = environment;
    generator.dispose();
    return () => {
      scene.environment = null;
      environment.dispose();
    };
  }, [gl, scene]);

  return (
    <>
      <hemisphereLight args={["#fff4e2", "#3a3833", 0.8]} />
      <directionalLight
        position={[3, 6, 4]}
        intensity={2.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-radius={5}
        shadow-bias={-0.0006}
      />
      <directionalLight position={[-4, 3, -3]} intensity={1.6} color="#ffc98a" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <shadowMaterial opacity={shadow} />
      </mesh>
    </>
  );
}
