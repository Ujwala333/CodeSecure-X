"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export function MichiBotHero() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0.15, 6.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);

    const modelRoot = new THREE.Group();
    modelRoot.rotation.y = -0.15;
    scene.add(modelRoot);

    const pointerTarget = { x: 0, y: 0 };
    const ambient = new THREE.HemisphereLight(0xd9f1ff, 0x111827, 2.2);
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
    keyLight.position.set(3.2, 4.5, 5);
    const rimLight = new THREE.DirectionalLight(0x2798ff, 2.2);
    rimLight.position.set(-3.5, 2.2, -2.5);
    const fillLight = new THREE.PointLight(0x36a3ff, 2.4, 8);
    fillLight.position.set(0.5, -1.3, 2.4);
    scene.add(ambient, keyLight, rimLight, fillLight);

    const resize = () => {
      const width = Math.max(mount.clientWidth, 1);
      const height = Math.max(mount.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = width < 640 ? 7.4 : 6.2;
      camera.updateProjectionMatrix();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (reducedMotion) return;
      pointerTarget.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointerTarget.y = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    const loader = new GLTFLoader();
    let loadedScene: THREE.Object3D | null = null;
    let disposed = false;

    loader.load(
      "/michi_bot.glb",
      (gltf) => {
        if (disposed) return;

        const bot = gltf.scene;
        const box = new THREE.Box3().setFromObject(bot);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z) || 1;
        const scale = 3.75 / maxDimension;

        bot.scale.setScalar(scale);
        bot.position.set(-center.x * scale, -center.y * scale - 0.05, -center.z * scale);
        bot.traverse((object) => {
          const mesh = object as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        });

        loadedScene = bot;
        modelRoot.add(bot);
      },
      undefined,
      (error) => {
        console.error("Failed to load michi_bot.glb", error);
      }
    );

    let frameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      if (!reducedMotion) {
        const targetY = -0.15 + pointerTarget.x * 0.32;
        const targetX = -pointerTarget.y * 0.16;
        modelRoot.rotation.y += (targetY - modelRoot.rotation.y) * 0.06;
        modelRoot.rotation.x += (targetX - modelRoot.rotation.x) * 0.06;
        modelRoot.rotation.z = Math.sin(elapsed * 0.9) * 0.025;
        modelRoot.position.y = Math.sin(elapsed * 1.25) * 0.1;
      }

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    window.addEventListener("pointermove", onPointerMove);
    animate();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);

      if (loadedScene) {
        loadedScene.traverse((object) => {
          const mesh = object as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.geometry?.dispose();
          const material = mesh.material;
          if (Array.isArray(material)) {
            material.forEach((item) => item.dispose());
          } else {
            material?.dispose();
          }
        });
      }

      renderer.dispose();
      renderer.domElement.remove();
      scene.clear();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="michiBotCanvas"
      aria-hidden="true"
    />
  );
}
