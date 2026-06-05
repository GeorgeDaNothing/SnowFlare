/**
 * Snowboard Big Air Replay Generator (JavaScript/WASM)
 *
 * Ported from snowboard/src/snowboard/replay.py
 */

import fs from 'fs';
import path from 'path';
import {
  loadKickerDesign,
  profilePoint,
  extrudedMesh,
  createModelAndData,
  controlTakeoffPop,
  type SimulatorConfig,
} from './simulator.js';
import { getMujoco } from './mujoco-module.js';

export interface ReplayFrame {
  time: number;
  phase: string;
  body_control: { compression: number; forward_lean: number };
  position: [number, number, number];
  quaternion: [number, number, number, number]; // x, y, z, w (Three.js order)
  velocity: [number, number, number];
  angular_velocity: [number, number, number];
}

export interface ReplayMetadata {
  schema_version: number;
  duration: number;
  simulation_timestep: number;
  frame_stride: number;
  coordinate_system: string;
}

export interface ReplayConfigPoint {
  label: string;
  position: [number, number, number];
}

export interface ReplayData {
  metadata: ReplayMetadata;
  config_points: ReplayConfigPoint[];
  profile_vertices: Array<[number, number, number]>;
  profile_faces: Array<[number, number, number]>;
  frames: ReplayFrame[];
}

export async function buildReplayData(config: SimulatorConfig, frameStride = 5): Promise<ReplayData> {
  if (frameStride <= 0) throw new Error('frame_stride must be positive');

  const design = loadKickerDesign(config.kickerConfigPath);
  const profile = design.profile;
  const { vertices, faces } = extrudedMesh(profile);
  const { model, data, free } = await createModelAndData(config);
  const mujoco = await getMujoco();

  const steps = Math.floor(config.duration / config.timestep);
  const frames: ReplayFrame[] = [];
  const takeoffX = profilePoint(profile, 'C').x;
  const landingX = profilePoint(profile, 'D').x;
  let landingReachedTime: number | null = null;

  function phaseForFrame(): { phase: string; bodyControl: { compression: number; forward_lean: number } } {
    const x = data.qpos[0];
    const neutralControl = { compression: 0.0, forward_lean: 0.0 };
    if (x < takeoffX - 0.25) return { phase: 'inrun', bodyControl: neutralControl };
    if (x < takeoffX + 0.5) return { phase: 'takeoff', bodyControl: { compression: 0.18, forward_lean: 0.08 } };
    if (x < landingX) return { phase: 'airborne', bodyControl: { compression: 0.08, forward_lean: 0.04 } };
    if (landingReachedTime === null) return { phase: 'landing', bodyControl: { compression: 0.55, forward_lean: 0.18 } };
    const secondsAfterLanding = Math.max(0.0, data.time - landingReachedTime);
    if (secondsAfterLanding < 0.8) {
      const compression = Math.max(0.22, 0.62 * (1.0 - secondsAfterLanding / 0.8));
      return {
        phase: 'landing',
        bodyControl: {
          compression,
          forward_lean: 0.22 * (1.0 - secondsAfterLanding / 1.2),
        },
      };
    }
    return { phase: 'rideout', bodyControl: { compression: 0.12, forward_lean: 0.06 } };
  }

  function appendFrame(): void {
    const { phase, bodyControl } = phaseForFrame();
    // MuJoCo freejoint qpos stores quaternion as w, x, y, z. Three.js uses x, y, z, w.
    frames.push({
      time: data.time,
      phase,
      body_control: bodyControl,
      position: [data.qpos[0], data.qpos[1], data.qpos[2]],
      quaternion: [data.qpos[4], data.qpos[5], data.qpos[6], data.qpos[3]],
      velocity: [data.qvel[0], data.qvel[1], data.qvel[2]],
      angular_velocity: [data.qvel[3], data.qvel[4], data.qvel[5]],
    });
  }

  try {
    appendFrame();
    for (let step = 1; step <= steps; step++) {
      controlTakeoffPop(data, config.launch, profile, mujoco);
      mujoco.mj_step(model, data);
      if (landingReachedTime === null && data.qpos[0] >= landingX) {
        landingReachedTime = data.time;
      }
      if (step % frameStride === 0 || step === steps) {
        appendFrame();
      }
    }

    return {
      metadata: {
        schema_version: 1,
        duration: config.duration,
        simulation_timestep: config.timestep,
        frame_stride: frameStride,
        coordinate_system: 'mujoco_xyz',
      },
      config_points: profile.points.map((point) => ({
        label: point.label,
        position: [point.x, 0.0, point.z] as [number, number, number],
      })),
      profile_vertices: vertices,
      profile_faces: faces,
      frames,
    };
  } finally {
    free();
  }
}

export async function writeReplayJson(
  outputPath: string,
  config: SimulatorConfig,
  frameStride = 5
): Promise<string> {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const replay = await buildReplayData(config, frameStride);
  fs.writeFileSync(outputPath, JSON.stringify(replay, null, 2), 'utf-8');
  return outputPath;
}
