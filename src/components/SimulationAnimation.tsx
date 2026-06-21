import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, Pause, Play, RotateCcw } from 'lucide-react';
import { getChaseCameraPose } from '@/lib/chaseCamera';
import { REPLAY_COLORS } from '@/lib/replayPalette';
import { cn } from '@/lib/utils';
import type { ReplayData } from '@/types';
import type * as Three from 'three';

interface SimulationAnimationProps {
  replay: ReplayData;
  className?: string;
}

type ThreeModule = typeof import('three');

interface ThreeRuntime {
  THREE: ThreeModule;
  renderer: Three.WebGLRenderer;
  scene: Three.Scene;
  camera: Three.PerspectiveCamera;
  cameraTarget: Three.Vector3;
  rider: Three.Group;
  torso: Three.Mesh;
  head: Three.Mesh;
}

function addShadows(object: Three.Object3D) {
  object.traverse((child) => {
    if ('isMesh' in child && child.isMesh) {
      const mesh = child as Three.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  });
}

function disposeScene(scene: Three.Scene) {
  scene.traverse((object) => {
    const mesh = object as Three.Mesh;
    mesh.geometry?.dispose();
    if (Array.isArray(mesh.material)) mesh.material.forEach((material) => material.dispose());
    else mesh.material?.dispose();
  });
}

function createStylizedRider(THREE: ThreeModule) {
  const rider = new THREE.Group();

  const board = new THREE.Mesh(
    new THREE.BoxGeometry(1.68, 0.3, 0.07),
    new THREE.MeshStandardMaterial({ color: 0x172033, roughness: 0.42, metalness: 0.08 })
  );
  rider.add(board);

  const bootMaterial = new THREE.MeshStandardMaterial({ color: 0x27364d, roughness: 0.7 });
  for (const x of [-0.3, 0.3]) {
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.16), bootMaterial);
    boot.position.set(x, 0, 0.12);
    rider.add(boot);
  }

  const legMaterial = new THREE.MeshStandardMaterial({ color: 0x24324a, roughness: 0.8 });
  for (const x of [-0.25, 0.25]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.48, 10), legMaterial);
    leg.rotateX(Math.PI / 2);
    leg.position.set(x, 0, 0.38);
    rider.add(leg);
  }

  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.19, 0.55, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0xab3500, roughness: 0.66 })
  );
  torso.rotateX(Math.PI / 2);
  torso.position.set(0, 0, 0.82);
  rider.add(torso);

  const armMaterial = new THREE.MeshStandardMaterial({ color: 0x7f2907, roughness: 0.7 });
  for (const y of [-0.28, 0.28]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.58, 10), armMaterial);
    arm.rotateZ(Math.PI / 2);
    arm.position.set(0, y, 0.82);
    rider.add(arm);
  }

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 18, 18),
    new THREE.MeshStandardMaterial({ color: 0xf0b56d, roughness: 0.75 })
  );
  head.position.set(0, 0, 1.28);
  rider.add(head);

  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
    new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.45 })
  );
  helmet.position.set(0, 0, 1.31);
  rider.add(helmet);

  addShadows(rider);
  return { rider, torso, head };
}

export function SimulationAnimation({ replay, className }: SimulationAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runtimeRef = useRef<ThreeRuntime | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef(0);
  const cameraReadyRef = useRef(false);
  const forwardRef = useRef<[number, number, number]>([1, 0, 0]);
  const [playing, setPlaying] = useState(true);
  const [replayTime, setReplayTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [rendererReady, setRendererReady] = useState(false);
  const [rendererError, setRendererError] = useState<string | null>(null);

  const frames = replay.frames;

  useEffect(() => {
    if (frames.length > 0) {
      setDuration(frames[frames.length - 1].time);
      setReplayTime(frames[0].time);
    }
  }, [frames]);

  const sampleFrame = useCallback(
    (time: number): { a: (typeof frames)[0]; b: (typeof frames)[0]; alpha: number } => {
      if (time <= frames[0].time) return { a: frames[0], b: frames[0], alpha: 0 };
      for (let i = 0; i < frames.length - 1; i++) {
        const a = frames[i];
        const b = frames[i + 1];
        if (a.time <= time && time <= b.time) {
          const span = Math.max(b.time - a.time, 0.000001);
          return { a, b, alpha: (time - a.time) / span };
        }
      }
      const last = frames[frames.length - 1];
      return { a: last, b: last, alpha: 0 };
    },
    [frames]
  );

  useEffect(() => {
    let cancelled = false;
    setRendererReady(false);
    setRendererError(null);

    const initialize = async () => {
      try {
        const THREE = await import('three');
        const canvas = canvasRef.current;
        if (cancelled || !canvas) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(REPLAY_COLORS.sky);
        scene.fog = new THREE.Fog(REPLAY_COLORS.sky, 45, 145);

        const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 500);
        camera.up.set(0, 0, 1);
        const cameraTarget = new THREE.Vector3();

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        scene.add(new THREE.HemisphereLight(0xffffff, 0x7890a0, 2.4));
        const sun = new THREE.DirectionalLight(0xffffff, 2.8);
        sun.position.set(-25, -20, 45);
        sun.castShadow = true;
        sun.shadow.mapSize.set(1024, 1024);
        sun.shadow.camera.left = -70;
        sun.shadow.camera.right = 70;
        sun.shadow.camera.top = 70;
        sun.shadow.camera.bottom = -70;
        scene.add(sun);

        if (replay.profile_vertices.length > 0 && replay.profile_faces.length > 0) {
          const terrainGeometry = new THREE.BufferGeometry();
          terrainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(replay.profile_vertices.flat(), 3));
          terrainGeometry.setIndex(replay.profile_faces.flat());
          terrainGeometry.computeVertexNormals();
          const terrain = new THREE.Mesh(
            terrainGeometry,
            new THREE.MeshStandardMaterial({ color: REPLAY_COLORS.terrain, roughness: 0.88, metalness: 0.01, side: THREE.DoubleSide })
          );
          terrain.receiveShadow = true;
          scene.add(terrain);
        }

        const minZ = Math.min(...replay.config_points.map((point) => point.position[2]), ...frames.map((frame) => frame.position[2]));
        const snow = new THREE.Mesh(
          new THREE.PlaneGeometry(260, 100),
          new THREE.MeshStandardMaterial({ color: REPLAY_COLORS.snow, roughness: 0.96 })
        );
        snow.position.set(25, 0, minZ - 0.35);
        snow.receiveShadow = true;
        scene.add(snow);

        const trajectoryGeometry = new THREE.BufferGeometry().setFromPoints(
          frames.map((frame) => new THREE.Vector3(...frame.position))
        );
        const trajectory = new THREE.Line(
          trajectoryGeometry,
          new THREE.LineDashedMaterial({ color: 0x2d74da, transparent: true, opacity: 0.55, dashSize: 0.7, gapSize: 0.45 })
        );
        trajectory.computeLineDistances();
        scene.add(trajectory);

        const { rider, torso, head } = createStylizedRider(THREE);
        scene.add(rider);

        runtimeRef.current = { THREE, renderer, scene, camera, cameraTarget, rider, torso, head };
        cameraReadyRef.current = false;
        setRendererReady(true);
      } catch (error) {
        if (!cancelled) setRendererError(error instanceof Error ? error.message : 'Could not initialize 3D replay.');
      }
    };

    initialize();

    return () => {
      cancelled = true;
      const runtime = runtimeRef.current;
      if (runtime) {
        disposeScene(runtime.scene);
        runtime.renderer.dispose();
        runtimeRef.current = null;
      }
    };
  }, [frames, replay.config_points, replay.profile_faces, replay.profile_vertices]);

  const draw = useCallback(
    (time: number) => {
      const runtime = runtimeRef.current;
      const container = containerRef.current;
      if (!runtime || !container || frames.length === 0) return;

      const { THREE, renderer, scene, camera, cameraTarget, rider, torso, head } = runtime;
      const rect = container.getBoundingClientRect();
      const width = Math.max(Math.floor(rect.width), 1);
      const height = Math.max(Math.floor(rect.height), 1);
      const canvas = renderer.domElement;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.floor(width * pixelRatio) || canvas.height !== Math.floor(height * pixelRatio)) {
        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }

      const { a, b, alpha } = sampleFrame(time);
      const position = new THREE.Vector3(...a.position).lerp(new THREE.Vector3(...b.position), alpha);
      const velocity = new THREE.Vector3(...a.velocity).lerp(new THREE.Vector3(...b.velocity), alpha);
      const quaternion = new THREE.Quaternion(...a.quaternion).slerp(new THREE.Quaternion(...b.quaternion), alpha);
      rider.position.copy(position);
      rider.quaternion.copy(quaternion);

      const startControl = a.body_control ?? { compression: 0, forward_lean: 0 };
      const endControl = b.body_control ?? { compression: 0, forward_lean: 0 };
      const compression = startControl.compression + (endControl.compression - startControl.compression) * alpha;
      torso.position.z = 0.82 - 0.2 * compression;
      head.position.z = 1.28 - 0.25 * compression;

      const chasePose = getChaseCameraPose({
        position: position.toArray() as [number, number, number],
        velocity: velocity.toArray() as [number, number, number],
        fallbackForward: forwardRef.current,
      });
      forwardRef.current = chasePose.forward;
      const desiredCamera = new THREE.Vector3(...chasePose.position);
      const desiredTarget = new THREE.Vector3(...chasePose.target);
      if (!cameraReadyRef.current) {
        camera.position.copy(desiredCamera);
        cameraTarget.copy(desiredTarget);
        cameraReadyRef.current = true;
      } else {
        camera.position.lerp(desiredCamera, 0.09);
        cameraTarget.lerp(desiredTarget, 0.13);
      }
      camera.lookAt(cameraTarget);
      renderer.render(scene, camera);
    },
    [frames, sampleFrame]
  );

  useEffect(() => {
    let mounted = true;

    const loop = (timestamp: number) => {
      if (!mounted) return;
      if (!lastTsRef.current) lastTsRef.current = timestamp;
      const delta = (timestamp - lastTsRef.current) / 1000;
      lastTsRef.current = timestamp;

      setReplayTime((previous) => {
        const next = playing ? (previous + delta) % duration : previous;
        draw(next);
        return next;
      });
      rafRef.current = requestAnimationFrame(loop);
    };

    if (duration > 0) rafRef.current = requestAnimationFrame(loop);

    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [duration, playing, draw, rendererReady]);

  if (frames.length === 0) {
    return <div className="p-4 rounded-xl bg-error-container text-error">Replay contains no animation frames.</div>;
  }

  const currentFrame = sampleFrame(replayTime).a;

  const handleScrub = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPlaying(false);
    cameraReadyRef.current = false;
    const next = (Number(event.target.value) / 1000) * duration;
    setReplayTime(next);
    draw(next);
  };

  const reset = () => {
    cameraReadyRef.current = false;
    setReplayTime(0);
    draw(0);
    setPlaying(true);
  };

  const toggleExpand = () => {
    setExpanded((previous) => !previous);
    requestAnimationFrame(() => draw(replayTime));
  };

  const card = (
    <div className={cn('bg-surface-container-low rounded-xl border border-outline-variant/10 overflow-hidden flex flex-col', expanded && 'h-full w-full max-w-7xl', className)}>
      <div ref={containerRef} className={cn('relative w-full bg-slate-200', expanded ? 'flex-1 min-h-0' : 'aspect-video min-h-[280px] max-h-[620px]')}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <div className="absolute top-4 left-4 rounded-lg bg-slate-950/65 px-3 py-2 text-white backdrop-blur-sm pointer-events-none">
          <p className="text-xs font-bold">Phase: <span className="capitalize">{currentFrame.phase || 'inrun'}</span></p>
          <p className="text-[11px] text-white/75 mt-0.5">Height: {currentFrame.position[2].toFixed(2)}m</p>
        </div>
        <div className="absolute top-4 right-4 rounded-full bg-primary/90 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-on-primary pointer-events-none">
          3D Chase Camera
        </div>
        {!rendererReady && !rendererError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-200 text-sm font-medium text-slate-600">Preparing 3D replay…</div>
        )}
        {rendererError && (
          <div className="absolute inset-0 flex items-center justify-center bg-error-container p-6 text-sm text-error">{rendererError}</div>
        )}
      </div>

      <div className="flex items-center gap-3 px-4 py-3 bg-surface-container-high border-t border-outline-variant/10 shrink-0">
        <button onClick={() => setPlaying((value) => !value)} className="p-2 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors" aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <button onClick={reset} className="p-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-highest transition-colors" aria-label="Replay">
          <RotateCcw className="w-4 h-4" />
        </button>
        <button onClick={toggleExpand} className="p-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-highest transition-colors" aria-label={expanded ? 'Collapse' : 'Expand'} title={expanded ? 'Collapse' : 'Expand'}>
          {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
        <input type="range" min={0} max={1000} value={duration > 0 ? (replayTime / duration) * 1000 : 0} onChange={handleScrub} className="flex-1 h-2 bg-surface-container rounded-full appearance-none cursor-pointer accent-primary" aria-label="Replay timeline" />
        <span className="text-xs font-mono text-on-surface-variant w-16 text-right">{replayTime.toFixed(2)}s</span>
      </div>
    </div>
  );

  return (
    <div className={cn(expanded && 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 md:p-8')}>
      {card}
    </div>
  );
}
