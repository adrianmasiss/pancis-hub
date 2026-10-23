"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { ROTULOS } from "../lib/muscle-map";
import {
  MODEL_REGIONS,
  PECTORAL_CONTOUR,
  REGION_PROFILES,
  encuadreDe,
  modelRegionAt,
} from "../lib/model-regions";

type Props = {
  highlight: Record<string, number>;
  view: "front" | "back";
  onPick?: (muscle: string) => void;
  onViewChange?: (view: "front" | "back") => void;
  className?: string;
  /**
   * `anatomia`: acabado mineral cálido compartido por Entrenamiento y Progreso.
   * `maniqui`: cuerpo negro mate y músculos que se encienden en blanco
   * cálido, para fondos naranjas.
   * `piel`: cuerpo en tono piel y el músculo que trabaja en rojo anaranjado,
   * como un músculo y no como pintura. Variante opcional; se fija al montar.
   */
  tone?: "anatomia" | "maniqui" | "piel";
  /** Músculos a los que se acerca la cámara. Vacío o nulo: el cuerpo entero. */
  focus?: string[] | null;
  /** Los músculos encendidos laten despacio, como si trabajaran. */
  pulse?: boolean;
};

/* Un latido cada 1,8 s: lento, de respiración, no de alarma. */
const LATIDO_MS = 1800;

/* `borde` decide cuánto se difumina el contorno de cada zona. Las zonas son
   contornos aproximados sobre una sola malla (el modelo no trae los músculos
   separados), así que con el degradado entero cada músculo se ve como una
   mancha difusa. Más alto: lleno por dentro y un filo corto de transición.
   Las zonas se evalúan por píxel en el shader: pintadas por vértice, la malla
   no tiene resolución para un borde limpio y salían dentadas, como pelo. */
const TONOS = {
  anatomia: {
    base: new THREE.Color("#a99a89"),
    primary: new THREE.Color("#bb4936"),
    secondary: new THREE.Color("#c59860"),
    mezcla: 0.88,
    borde: 1.6,
  },
  /* Los principales, en blanco cálido apenas por encima de 1: con el mapeo de
     tonos se leen como luz. Los asistentes, en gris claro y no en un tono
     piel: un beige sobre cuerpo negro parecía un parche, no un músculo que
     trabaja menos. */
  maniqui: {
    base: new THREE.Color("#1c1a19"),
    primary: new THREE.Color(1.12, 1.05, 0.97),
    secondary: new THREE.Color("#8f8780"),
    mezcla: 1,
    borde: 2.6,
  },
  /* Piel media y cálida; el músculo, en un rojo anaranjado que se distingue
     de la piel sin parecer una herida. El asistente, a medio camino. */
  piel: {
    base: new THREE.Color("#c69276"),
    primary: new THREE.Color("#e04a22"),
    secondary: new THREE.Color("#d9774f"),
    mezcla: 0.9,
    borde: 1.7,
  },
} as const;

const N_ZONAS = MODEL_REGIONS.length;
const LADO = { front: 0, back: 1, both: 2 } as const;

/* La zona con más fuerza en este píxel decide su color: la misma regla que
   `modelRegionAt`, que sigue sirviendo para saber qué se toca. */
const FRAGMENTO_ZONAS = /* glsl */ `
uniform vec4 uZona[${N_ZONAS}];
uniform vec2 uChest[${PECTORAL_CONTOUR.length}];
uniform vec3 uZonaInfo[${N_ZONAS}];
uniform vec2 uProfile[${N_ZONAS}];
uniform vec3 uBase;
uniform vec3 uPrimary;
uniform vec3 uSecondary;
uniform float uBorde;
uniform float uMezcla;
uniform float uMix;
uniform float uGlow;
varying vec3 vLocal;
varying float vLocalNz;
float chestInterior(vec2 p) {
  p.x = abs(p.x);
  bool inside = false;
  float edge = 1.0;
  for (int j = 0; j < ${PECTORAL_CONTOUR.length}; j++) {
    vec2 a = uChest[j], b = uChest[(j + 1) % ${PECTORAL_CONTOUR.length}];
    if ((a.y > p.y) != (b.y > p.y)) {
      if (p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
    }
    vec2 e = b - a;
    edge = min(edge, length(p - a - e * clamp(dot(p - a, e) / dot(e, e), 0.0, 1.0)));
  }
  return inside ? edge : 0.0;
}
// Microtextura tridimensional: no necesita UV y no tiene costuras al girar.
float surfaceHash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.13, 0.27, 0.41));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float surfaceNoise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(surfaceHash(i), surfaceHash(i + vec3(1,0,0)), f.x),
                 mix(surfaceHash(i + vec3(0,1,0)), surfaceHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(surfaceHash(i + vec3(0,0,1)), surfaceHash(i + vec3(1,0,1)), f.x),
                 mix(surfaceHash(i + vec3(0,1,1)), surfaceHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
`;
const COLOR_ZONAS = /* glsl */ `
float zonaFuerza = 0.0;
float zonaPeso = 0.0;
for (int i = 0; i < ${N_ZONAS}; i++) {
  vec4 z = uZona[i];
  vec3 info = uZonaInfo[i];
  float facing = info.x < 0.5 ? vLocalNz : (info.x < 1.5 ? -vLocalNz : 1.0);
  if (facing <= 0.0) continue;
  if (z.x != 0.0 && vLocal.x * z.x <= 0.0) continue;
  vec2 profile = uProfile[i];
  float dy = (vLocal.y - z.y) / z.w;
  float dx = (abs(vLocal.x) - abs(z.x) + profile.x * (vLocal.y - z.y)) / z.z / max(0.65, 1.0 + profile.y * dy);
  vec2 d = vec2(dx, dy);
  float dist = dot(d, d);
  float fuerza;
  if (info.y > 0.5) {
    if (vLocal.x * z.x <= 0.0) continue;
    float interior = chestInterior(vLocal.xy);
    if (interior <= 0.0) continue;
    fuerza = min(1.0, interior / 0.012);
  } else {
    if (dist >= 1.0) continue;
    fuerza = min(1.0, (1.0 - dist) * 1.35);
  }
  fuerza *= min(1.0, facing / 0.35);
  if (fuerza > zonaFuerza) { zonaFuerza = fuerza; zonaPeso = info.z; }
}
vec3 zonaColor = zonaPeso >= 0.75 ? uPrimary : uSecondary;
float zonaMezcla = zonaPeso > 0.0 ? min(1.0, zonaFuerza * uBorde) * uMezcla : 0.0;
diffuseColor.rgb *= mix(uBase, zonaColor, zonaMezcla * uMix);
float surfaceDetail = surfaceNoise(vLocal * 650.0);
// Filtra el grano cuando su escala cae por debajo de un píxel.
float detailVisibility = 1.0 - smoothstep(0.0008, 0.003, max(length(dFdx(vLocal)), length(dFdy(vLocal))));
diffuseColor.rgb *= 1.0 + (surfaceDetail - 0.5) * 0.055 * detailVisibility;
`;

/** Modelo local optimizado, con render bajo demanda y una alternativa textual. */
export function MuscleModel({
  highlight,
  view,
  onPick,
  onViewChange,
  className,
  tone = "anatomia",
  focus = null,
  pulse = false,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const latest = useRef({
    highlight,
    view,
    onPick,
    onViewChange,
    tone,
    focus,
    pulse,
  });
  const controls = useRef<{ paint: () => void; turn: () => void } | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  useEffect(() => {
    latest.current = {
      highlight,
      view,
      onPick,
      onViewChange,
      tone,
      focus,
      pulse,
    };
    controls.current?.paint();
    controls.current?.turn();
  }, [highlight, view, onPick, onViewChange, tone, focus, pulse]);

  useEffect(() => {
    const host = hostRef.current;
    const tip = tipRef.current;
    if (!host || !tip) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      // WebGL is an external capability that can only be initialized after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("error");
      return;
    }
    let disposed = false;
    let frame = 0;
    let target = latest.current.view === "back" ? Math.PI : 0;
    // La vista controlada es un atajo; el ángulo libre se conserva entre renders.
    let lastView = latest.current.view;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scene = new THREE.Scene();
    const body = new THREE.Group();
    body.rotation.y = target;
    body.position.y = -0.5;
    scene.add(body);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 20);
    camera.position.set(0, 0, 2.05);
    camera.lookAt(0, 0, 0);
    /* Dónde va la cámara y hacia dónde mira. `baseZ` es la distancia a la
       que cabe el cuerpo entero; el zoom a un ejercicio se acerca desde ahí. */
    let baseZ = 2.05;
    const camGoal = new THREE.Vector3(0, 0, baseZ);
    const look = new THREE.Vector3();
    const lookGoal = new THREE.Vector3();
    let visible = true;
    /* 1,5× basta para un cuerpo mate sin texto encima; a 2× en una pantalla
       Retina se pintaban casi el doble de píxeles en cada cuadro del latido. */
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearAlpha(0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    // El latido cambia el color, no la geometría: reutiliza sus sombras.
    renderer.shadowMap.autoUpdate = false;
    const studio = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(studio, 0.04);
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.35;
    studio.dispose();
    pmrem.dispose();
    host.append(renderer.domElement);
    const canvas = renderer.domElement;
    canvas.style.touchAction = "pan-y";
    scene.add(new THREE.HemisphereLight(0xe8edf5, 0x55463d, 0.65));
    const key = new THREE.DirectionalLight(0xffeee0, 3.2);
    key.position.set(-1.8, 2.4, 2.6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, {
      left: -0.7,
      right: 0.7,
      top: 0.7,
      bottom: -0.7,
      near: 0.1,
      far: 6,
    });
    key.shadow.camera.updateProjectionMatrix();
    key.shadow.normalBias = 0.002;
    key.shadow.bias = -0.0001;
    key.shadow.intensity = 0.75;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xdce7f5, 0.65);
    fill.position.set(2, 0.6, 2);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xc4d6ed, 2.2);
    rim.position.set(-2, 1, -3);
    scene.add(rim);
    const meshes: THREE.Mesh[] = [];
    const { base, primary, secondary, mezcla, borde } =
      TONOS[latest.current.tone];
    /* Todo el color va en el shader: el peso de cada zona es un uniforme, así
       que cambiar de ejercicio no recorre la malla, y el latido sólo mueve
       `uMix` y `uGlow`. */
    const uniforms = {
      uChest: {
        value: PECTORAL_CONTOUR.map(([x, y]) => new THREE.Vector2(x, y)),
      },
      uZona: {
        value: MODEL_REGIONS.map(
          (z) => new THREE.Vector4(z.x, z.y, z.rx, z.ry),
        ),
      },
      uProfile: {
        value: MODEL_REGIONS.map(
          (z) => new THREE.Vector2(...(REGION_PROFILES[z.muscle] ?? [0, 0])),
        ),
      },
      uZonaInfo: {
        value: MODEL_REGIONS.map(
          (z) =>
            new THREE.Vector3(LADO[z.side], z.muscle === "pectoral" ? 1 : 0, 0),
        ),
      },
      uBase: { value: base.clone() },
      uPrimary: { value: primary.clone() },
      uSecondary: { value: secondary.clone() },
      uBorde: { value: borde },
      uMezcla: { value: mezcla },
      uMix: { value: 1 },
      uGlow: { value: 0 },
    };
    const aim = () => {
      const encuadre = latest.current.focus?.length
        ? encuadreDe(latest.current.focus)
        : null;
      if (!encuadre) {
        camGoal.set(0, 0, baseZ);
        lookGoal.set(0, 0, 0);
        return;
      }
      /* De espaldas el cuerpo está girado media vuelta: la x se invierte. */
      const x = encuadre.x * Math.cos(target);
      const y = encuadre.y + body.position.y;
      const half =
        Math.max(encuadre.halfH, encuadre.halfW / camera.aspect) * 1.9 + 0.04;
      const z = THREE.MathUtils.clamp(
        half / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)),
        0.6,
        baseZ,
      );
      camGoal.set(x, y, z);
      lookGoal.set(x, y, 0);
    };
    /* El latido es lento (1,8 s): a 24 fps se ve igual de suave que a 60 y
       cuesta menos de la mitad. A 60 sólo se pinta mientras algo se mueve de
       verdad (giro o cámara). */
    const LATIDO_FRAME_MS = 1000 / 24;
    let lastPaint = 0;
    const tick = (now: number) => {
      frame = 0;
      const moving =
        body.rotation.y !== target ||
        !camera.position.equals(camGoal) ||
        !look.equals(lookGoal);
      if (
        !moving &&
        latest.current.pulse &&
        visible &&
        now - lastPaint < LATIDO_FRAME_MS
      ) {
        frame = requestAnimationFrame(tick);
        return;
      }
      lastPaint = now;
      const snap = reduced.matches;
      const previousRotation = body.rotation.y;
      body.rotation.y = snap
        ? target
        : THREE.MathUtils.lerp(body.rotation.y, target, 0.16);
      if (Math.abs(body.rotation.y - target) < 0.001) body.rotation.y = target;
      if (previousRotation !== body.rotation.y)
        renderer.shadowMap.needsUpdate = true;
      if (snap) {
        camera.position.copy(camGoal);
        look.copy(lookGoal);
      } else {
        camera.position.lerp(camGoal, 0.09);
        look.lerp(lookGoal, 0.09);
        if (camera.position.distanceTo(camGoal) < 0.0005)
          camera.position.copy(camGoal);
        if (look.distanceTo(lookGoal) < 0.0005) look.copy(lookGoal);
      }
      camera.lookAt(look);
      const latiendo = latest.current.pulse && !snap && visible;
      if (latiendo) {
        const fase = Math.sin(((now % LATIDO_MS) / LATIDO_MS) * Math.PI) ** 2;
        uniforms.uMix.value = 0.72 + 0.28 * fase;
        uniforms.uGlow.value = 0.015 + 0.035 * fase;
      } else {
        uniforms.uMix.value = 1;
        uniforms.uGlow.value = latest.current.pulse ? 0.025 : 0;
      }
      renderer.render(scene, camera);
      if (
        latiendo ||
        body.rotation.y !== target ||
        !camera.position.equals(camGoal) ||
        !look.equals(lookGoal)
      )
        frame = requestAnimationFrame(tick);
    };
    const render = () => {
      if (!disposed && !frame) frame = requestAnimationFrame(tick);
    };
    const paint = () => {
      MODEL_REGIONS.forEach((zona, i) => {
        uniforms.uZonaInfo.value[i]!.z =
          latest.current.highlight[zona.muscle] ?? 0;
      });
      render();
    };
    controls.current = {
      paint,
      turn: () => {
        if (latest.current.view !== lastView) {
          lastView = latest.current.view;
          const desired = lastView === "back" ? Math.PI : 0;
          // Toma el camino corto incluso después de varias vueltas completas.
          target += Math.atan2(
            Math.sin(desired - target),
            Math.cos(desired - target),
          );
        }
        aim();
        render();
      },
    };
    const disposeModel = (root: THREE.Object3D) =>
      root.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          for (const material of Array.isArray(object.material)
            ? object.material
            : [object.material])
            material.dispose();
        }
      });
    void new GLTFLoader()
      .loadAsync("/anatomy/muscle-body.glb")
      .then((gltf) => {
        if (disposed) {
          disposeModel(gltf.scene);
          return;
        }
        gltf.scene.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          for (const material of Array.isArray(object.material)
            ? object.material
            : [object.material])
            material.dispose();
          const material = new THREE.MeshStandardMaterial({
            roughness: 0.62,
            vertexColors: object.geometry.hasAttribute("color"),
            metalness: 0,
          });
          /* Las zonas están en el espacio de la malla, como en
             `modelRegionAt`: se pasan la posición y la normal sin transformar. */
          material.onBeforeCompile = (shader) => {
            Object.assign(shader.uniforms, uniforms);
            shader.vertexShader =
              "varying vec3 vLocal;\nvarying float vLocalNz;\n" +
              shader.vertexShader.replace(
                "#include <begin_vertex>",
                "#include <begin_vertex>\nvLocal = position;\nvLocalNz = normal.z;",
              );
            shader.fragmentShader =
              FRAGMENTO_ZONAS +
              shader.fragmentShader
                .replace(
                  "#include <color_fragment>",
                  "#include <color_fragment>\n" + COLOR_ZONAS,
                )
                .replace(
                  "#include <roughnessmap_fragment>",
                  "#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor + (surfaceDetail - 0.5) * 0.12 * detailVisibility, 0.45, 0.8);",
                )
                .replace(
                  "#include <normal_fragment_maps>",
                  `#include <normal_fragment_maps>
vec3 sx = normalize(dFdx(-vViewPosition));
vec3 sy = normalize(dFdy(-vViewPosition));
vec3 r1 = cross(sy, normal), r2 = cross(normal, sx);
float det = dot(sx, r1) * faceDirection;
vec2 grain = vec2(dFdx(surfaceDetail), dFdy(surfaceDetail)) * 0.075 * detailVisibility;
normal = normalize(max(abs(det), 0.0001) * normal - sign(det) * (grain.x * r1 + grain.y * r2));`,
                )
                .replace(
                  "#include <emissivemap_fragment>",
                  "#include <emissivemap_fragment>\ntotalEmissiveRadiance += zonaColor * zonaMezcla * uGlow;",
                );
          };
          object.material = material;
          object.castShadow = true;
          object.receiveShadow = true;
          meshes.push(object);
        });
        body.add(gltf.scene);
        renderer.shadowMap.needsUpdate = true;
        paint();
        setStatus("ready");
      })
      .catch(() => {
        if (!disposed) setStatus("error");
      });
    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      renderer.setSize(Math.max(width, 1), Math.max(height, 1), false);
      camera.aspect = width / Math.max(height, 1);
      baseZ = Math.max(2.05, 1.05 / Math.max(camera.aspect, 0.1));
      camera.updateProjectionMatrix();
      aim();
      /* Al medir no se anima: el primer cuadro ya sale encuadrado. */
      if (!latest.current.focus?.length) camera.position.copy(camGoal);
      render();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    /* Fuera de pantalla no late: no se gasta GPU en algo que nadie ve. */
    let onViewport = true;
    const updateVisible = () => {
      visible = onViewport && document.visibilityState === "visible";
      render();
    };
    const onScreen = new IntersectionObserver(([entry]) => {
      onViewport = entry?.isIntersecting ?? true;
      updateVisible();
    });
    /* Con la pestaña oculta tampoco late. */
    document.addEventListener("visibilitychange", updateVisible);
    onScreen.observe(host);
    resize();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const hitAt = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(meshes, false)[0];
      if (!hit || !hit.face) return null;
      const point = hit.object.worldToLocal(hit.point.clone());
      return modelRegionAt(point.x, point.y, hit.face.normal.z);
    };
    let drag: {
      id: number;
      x: number;
      rotation: number;
      moved: boolean;
    } | null = null;
    const down = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary || drag) return;
      canvas.setPointerCapture(event.pointerId);
      drag = {
        id: event.pointerId,
        x: event.clientX,
        rotation: body.rotation.y,
        moved: false,
      };
      canvas.style.cursor = "grabbing";
    };
    const move = (event: PointerEvent) => {
      if (drag) {
        if (event.pointerId !== drag.id) return;
        const dx = event.clientX - drag.x;
        drag.moved ||= Math.abs(dx) > 5;
        if (!drag.moved) return;
        target = drag.rotation + dx * 0.012;
        aim();
        tip.removeAttribute("data-on");
        render();
        return;
      }
      const hit = hitAt(event);
      canvas.style.cursor = hit ? "pointer" : "grab";
      if (!hit) {
        tip.removeAttribute("data-on");
        return;
      }
      const rect = host.getBoundingClientRect();
      tip.textContent = ROTULOS[hit.muscle] ?? hit.muscle;
      tip.style.left = `${Math.max(60, Math.min(rect.width - 60, event.clientX - rect.left))}px`;
      tip.style.top = `${event.clientY - rect.top}px`;
      tip.setAttribute("data-on", "");
    };
    const up = (event: PointerEvent) => {
      if (drag && event.pointerId !== drag.id) return;
      const previous = drag;
      drag = null;
      canvas.style.cursor = "grab";
      if (canvas.hasPointerCapture(event.pointerId))
        canvas.releasePointerCapture(event.pointerId);
      if (previous && !previous.moved) {
        const hit = hitAt(event);
        if (hit) latest.current.onPick?.(hit.muscle);
      } else if (previous) {
        // Actualiza el indicador sin convertir el ángulo en 0 o 180 grados.
        lastView = Math.cos(target) < 0 ? "back" : "front";
        aim();
        latest.current.onViewChange?.(lastView);
        render();
      }
    };
    const cancel = () => {
      drag = null;
      canvas.style.cursor = "grab";
      tip.removeAttribute("data-on");
    };
    const contextLost = (event: Event) => {
      event.preventDefault();
      setStatus("error");
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", cancel);
    canvas.addEventListener("pointerleave", cancel);
    canvas.addEventListener("webglcontextlost", contextLost);
    return () => {
      disposed = true;
      controls.current = null;
      cancelAnimationFrame(frame);
      observer.disconnect();
      onScreen.disconnect();
      document.removeEventListener("visibilitychange", updateVisible);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", cancel);
      canvas.removeEventListener("pointerleave", cancel);
      canvas.removeEventListener("webglcontextlost", contextLost);
      disposeModel(body);
      key.shadow.dispose();
      environment.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  return (
    <div className={className} data-model-status={status}>
      <div ref={hostRef} className="muscle-model-stage" />
      <div ref={tipRef} className="muscle-model-tip" aria-hidden="true" />
      {status !== "ready" && (
        <p className="muscle-model-status" role="status">
          {status === "loading"
            ? "Cargando modelo 3D…"
            : "El modelo 3D no está disponible. Consulta los músculos en la lista."}
        </p>
      )}
    </div>
  );
}
