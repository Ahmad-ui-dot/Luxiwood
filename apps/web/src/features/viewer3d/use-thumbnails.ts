"use client";

import type { Model3dKey } from "@luxiwood/shared";
import { useEffect, useState } from "react";
import {
  ACESFilmicToneMapping,
  DirectionalLight,
  HemisphereLight,
  type Group,
  Mesh,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShadowMaterial,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { buildWardrobe, cameraFor, createLoader, type GlbModel, isGlbModel, MODEL_URLS, type ModelColors, paintModel, prepareModel } from "./models";
import { buildProcedural } from "./procedural";

export type ThumbnailRequest = { key: string; type: Model3dKey; colors: ModelColors };

// Рисует каждую модель в своём цвете в невидимом canvas 480×480 и возвращает картинки { key: dataURL }.
// Один рендер на все карточки — вместо отдельной 3D-сцены в каждой
export function useThumbnails(requests: ThumbnailRequest[]) {
  const [images, setImages] = useState<Record<string, string>>({});
  const signature = JSON.stringify(requests);

  useEffect(() => {
    let cancelled = false;
    const renderer = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(480, 480, false);
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;

    const scene = new Scene();
    const generator = new PMREMGenerator(renderer);
    scene.environment = generator.fromScene(new RoomEnvironment(), 0.04).texture;
    generator.dispose();
    scene.add(new HemisphereLight("#fff4e2", "#4a4d45", 0.8));
    const key = new DirectionalLight("#ffffff", 2.8);
    key.position.set(3, 6, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);
    const rim = new DirectionalLight("#ffd9a8", 1.4);
    rim.position.set(-4, 3, -3);
    scene.add(rim);
    const floor = new Mesh(new PlaneGeometry(30, 30), new ShadowMaterial({ opacity: 0.3 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const camera = new PerspectiveCamera(30, 1, 0.1, 60);

    const loader = createLoader();
    const parsed = JSON.parse(signature) as ThumbnailRequest[];
    // Каждый GLB грузится один раз; prepareModel сам делает копию
    const sources = new Map<GlbModel, Promise<Group>>();

    async function run() {
      for (const request of parsed) {
        let model: Group;
        if (request.type === "wardrobe") {
          model = buildWardrobe(request.colors.main);
        } else if (!isGlbModel(request.type)) {
          model = buildProcedural(request.type, request.colors);
        } else {
          if (!sources.has(request.type)) {
            sources.set(request.type, loader.loadAsync(MODEL_URLS[request.type]).then((gltf) => gltf.scene));
          }
          const source = await sources.get(request.type)!;
          model = prepareModel(source, request.type);
          paintModel(model, request.type, request.colors);
        }
        if (cancelled) {
          return;
        }
        scene.add(model);
        const view = cameraFor(model, -0.65, 0.3, 0.92);
        camera.position.copy(view.position);
        camera.lookAt(view.target);
        renderer.render(scene, camera);
        const url = renderer.domElement.toDataURL("image/png");
        scene.remove(model);
        // Картинки появляются по одной; пауза между ними — чтобы страница не замирала, пока рисуются десятки превью
        setImages((current) => ({ ...current, [request.key]: url }));
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
    }

    run().catch(() => {});
    return () => {
      cancelled = true;
      renderer.dispose();
    };
  }, [signature]);

  return images;
}
