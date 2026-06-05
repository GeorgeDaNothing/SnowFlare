/**
 * Snowboard Big Air MuJoCo Simulator (JavaScript/WASM)
 *
 * Ported from snowboard/src/snowboard/simulator.py
 * Uses @mujoco/mujoco WASM bindings for Node.js.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getMujoco } from './mujoco-module.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DEFAULT_KICKER_CONFIG_PATH = path.resolve(__dirname, 'config', 'big_air_kicker.json');

// ============================================
// Geometry helpers
// ============================================

export interface ProfilePoint {
  readonly x: number;
  readonly z: number;
  readonly label: string;
}

export interface KickerProfile {
  readonly points: readonly ProfilePoint[];
  readonly width: number;
  readonly aliases: Readonly<Record<string, string>>;
  readonly segments: Readonly<Record<string, readonly [string, string]>>;
}

export function makeKickerProfileReference(): KickerProfile {
  return loadKickerDesign(DEFAULT_KICKER_CONFIG_PATH).profile;
}

export function profilePoint(profile: KickerProfile, label: string): ProfilePoint {
  const resolved = profile.aliases[label] ?? label;
  const point = profile.points.find((p) => p.label === resolved);
  if (!point) throw new Error(`unknown profile point: ${label}`);
  return point;
}

export function segmentAngle(profile: KickerProfile, segment: string): number {
  const segmentPoints: Record<string, readonly [string, string]> = {
    inrun: ['inrun_start', 'inrun_end'],
    takeoff: ['takeoff_start', 'takeoff_lip'],
    landing: ['knuckle', 'landing_mid'],
    ...profile.segments,
  };
  const [startLabel, endLabel] = segmentPoints[segment];
  const start = profilePoint(profile, startLabel);
  const end = profilePoint(profile, endLabel);
  return degrees(Math.atan2(end.z - start.z, end.x - start.x));
}

export function profileIsContinuous(profile: KickerProfile): boolean {
  return profile.points.every((p, i) => i === 0 || p.x >= profile.points[i - 1].x);
}

export function extrudedMesh(profile: KickerProfile): {
  vertices: Array<[number, number, number]>;
  faces: Array<[number, number, number]>;
} {
  const halfWidth = profile.width / 2;
  const vertices: Array<[number, number, number]> = [];
  for (const point of profile.points) {
    vertices.push([point.x, -halfWidth, point.z]);
    vertices.push([point.x, halfWidth, point.z]);
  }

  const faces: Array<[number, number, number]> = [];
  for (let i = 0; i < profile.points.length - 1; i++) {
    const leftA = i * 2;
    const rightA = leftA + 1;
    const leftB = leftA + 2;
    const rightB = leftA + 3;
    faces.push([leftA, leftB, rightA]);
    faces.push([rightA, leftB, rightB]);
  }
  return { vertices, faces };
}

// ============================================
// Start pose & kicker design
// ============================================

export interface StartPose {
  readonly x: number;
  readonly z: number;
  readonly pitchDegrees: number;
}

export interface KickerDesign {
  readonly profile: KickerProfile;
  readonly startPose: StartPose;
}

export function loadKickerDesign(configPath: string = DEFAULT_KICKER_CONFIG_PATH): KickerDesign {
  const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const profileData = data.profile;
  const points: ProfilePoint[] = profileData.points.map((point: any) => ({
    x: Number(point.x),
    z: Number(point.z),
    label: String(point.label),
  }));

  const segments: Record<string, readonly [string, string]> = {};
  for (const [name, labels] of Object.entries(profileData.segments ?? {})) {
    segments[name] = [String((labels as string[])[0]), String((labels as string[])[1])];
  }

  const profile: KickerProfile = {
    points,
    width: Number(profileData.width ?? 5.0),
    aliases: Object.fromEntries(
      Object.entries(profileData.aliases ?? {}).map(([k, v]) => [String(k), String(v)])
    ),
    segments,
  };

  const startPoseData = data.start_pose;
  return {
    profile,
    startPose: {
      x: Number(startPoseData.x),
      z: Number(startPoseData.z),
      pitchDegrees: Number(startPoseData.pitch_degrees),
    },
  };
}

// ============================================
// XML builders
// ============================================

function buildProfileCollisionGeoms(profile: KickerProfile): string {
  const geoms: string[] = [];
  const coveredPairs = new Set<string>();

  for (const [segmentName, labels] of Object.entries(profile.segments)) {
    const [startLabel, endLabel] = labels;
    coveredPairs.add(`${startLabel},${endLabel}`);
    geoms.push(collisionBoxXml(segmentName + '_collision', profilePoint(profile, startLabel), profilePoint(profile, endLabel), profile.width));
  }

  for (let i = 0; i < profile.points.length - 1; i++) {
    const start = profile.points[i];
    const end = profile.points[i + 1];
    if (coveredPairs.has(`${start.label},${end.label}`)) continue;
    if (start.x === end.x && start.z === end.z) continue;
    geoms.push(collisionBoxXml(`profile_collision_${i + 1}`, start, end, profile.width));
  }

  return geoms.join('\n            ');
}

function buildRouteMarkers(profile: KickerProfile): string {
  const colors: Record<string, string> = {
    A: '0.08 0.8 0.2 1',
    B: '0.15 0.45 1 1',
    C: '1 0.85 0.05 1',
    D: '1 0.18 0.12 1',
  };
  const markers: string[] = [];
  for (const label of ['A', 'B', 'C', 'D']) {
    const point = profilePoint(profile, label);
    markers.push(
      `<geom name="marker_${label}" type="sphere" size="0.08" ` +
      `pos="${point.x.toFixed(3)} -2.75 ${(point.z + 0.12).toFixed(3)}" ` +
      `rgba="${colors[label]}" contype="0" conaffinity="0"/>`
    );
  }
  return markers.join('\n            ');
}

function buildPointMarkers(profile: KickerProfile): string {
  const geoms: string[] = [];
  for (let i = 0; i < profile.points.length; i++) {
    const point = profile.points[i];
    const label = safeGeomName(point.label);
    const y = -3.05;
    const z = point.z + 0.18;
    geoms.push(
      `<geom name="point_marker_${label}" type="sphere" size="0.075" ` +
      `pos="${point.x.toFixed(3)} ${y.toFixed(3)} ${z.toFixed(3)}" ` +
      `rgba="1 0 0 1" contype="0" conaffinity="0"/>`
    );
    geoms.push(
      `<geom name="point_label_${label}" type="box" ` +
      `size="${Math.max(0.18, point.label.length * 0.035).toFixed(3)} 0.018 0.045" ` +
      `pos="${(point.x + 0.22).toFixed(3)} ${y.toFixed(3)} ${(z + 0.16 + (i % 2) * 0.08).toFixed(3)}" ` +
      `rgba="1 0 0 1" contype="0" conaffinity="0"/>`
    );
  }
  return geoms.join('\n            ');
}

function safeGeomName(label: string): string {
  return label.replace(/[^a-zA-Z0-9_]/g, '_');
}

function collisionBoxXml(name: string, start: ProfilePoint, end: ProfilePoint, width: number): string {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = degrees(Math.atan2(dz, dx));
  return (
    `<geom name="${name}" type="box" ` +
    `size="${(length / 2).toFixed(3)} ${(width / 2).toFixed(3)} 0.035" ` +
    `pos="${((start.x + end.x) / 2).toFixed(3)} 0 ${((start.z + end.z) / 2 - 0.035).toFixed(3)}" ` +
    `euler="0 ${(-angle).toFixed(3)} 0" friction="0.03 0.005 0.001" ` +
    `rgba="0.8 0.9 1 0.08"/>`
  );
}

function profileHeightAt(profile: KickerProfile, x: number): number {
  if (x <= profile.points[0].x) return profile.points[0].z;
  if (x >= profile.points[profile.points.length - 1].x) return profile.points[profile.points.length - 1].z;

  for (let i = 0; i < profile.points.length - 1; i++) {
    const start = profile.points[i];
    const end = profile.points[i + 1];
    if (start.x <= x && x <= end.x) {
      if (start.x === end.x) return Math.max(start.z, end.z);
      const ratio = (x - start.x) / (end.x - start.x);
      return start.z + ratio * (end.z - start.z);
    }
  }
  return profile.points[profile.points.length - 1].z;
}

// ============================================
// Launch profile & config
// ============================================

export interface LaunchProfile {
  readonly speed: number;
  readonly angleDegrees: number;
  readonly headingDegrees: number;
  readonly yawSpinRate: number;
}

export function makeLaunchProfile(partial: Partial<LaunchProfile> = {}): LaunchProfile {
  const speed = partial.speed ?? 2.5;
  const angleDegrees = partial.angleDegrees ?? 34.0;
  const headingDegrees = partial.headingDegrees ?? 10.0;
  const yawSpinRate = partial.yawSpinRate ?? 4.5;
  if (speed <= 0) throw new Error('speed must be positive');
  if (!(0 < angleDegrees && angleDegrees < 90)) throw new Error('angleDegrees must be between 0 and 90');
  if (!(-75 <= headingDegrees && headingDegrees <= 75)) throw new Error('headingDegrees must be between -75 and 75');
  return { speed, angleDegrees, headingDegrees, yawSpinRate };
}

export function velocityComponents(launch: LaunchProfile): [number, number, number] {
  const pitch = radians(launch.angleDegrees);
  const heading = radians(launch.headingDegrees);
  const horizontalSpeed = launch.speed * Math.cos(pitch);
  return [
    horizontalSpeed * Math.cos(heading),
    horizontalSpeed * Math.sin(heading),
    launch.speed * Math.sin(pitch),
  ];
}

export interface SimulatorConfig {
  readonly timestep: number;
  readonly duration: number;
  readonly boardLength: number;
  readonly boardWidth: number;
  readonly boardThickness: number;
  readonly riderMass: number;
  readonly boardMass: number;
  readonly launch: LaunchProfile;
  readonly kickerConfigPath: string;
}

export function makeSimulatorConfig(partial: Partial<SimulatorConfig> = {}): SimulatorConfig {
  const config: SimulatorConfig = {
    timestep: partial.timestep ?? 0.002,
    duration: partial.duration ?? 5.0,
    boardLength: partial.boardLength ?? 1.65,
    boardWidth: partial.boardWidth ?? 0.28,
    boardThickness: partial.boardThickness ?? 0.045,
    riderMass: partial.riderMass ?? 72.0,
    boardMass: partial.boardMass ?? 5.0,
    launch: partial.launch ?? makeLaunchProfile(),
    kickerConfigPath: partial.kickerConfigPath ?? DEFAULT_KICKER_CONFIG_PATH,
  };

  const positiveFields: Record<string, number> = {
    timestep: config.timestep,
    duration: config.duration,
    boardLength: config.boardLength,
    boardWidth: config.boardWidth,
    boardThickness: config.boardThickness,
    riderMass: config.riderMass,
    boardMass: config.boardMass,
  };

  for (const [name, value] of Object.entries(positiveFields)) {
    if (value <= 0) throw new Error(`${name} must be positive`);
  }

  return config;
}

// ============================================
// Model XML
// ============================================

export function buildModelXml(config: SimulatorConfig): string {
  const kickerDesign = loadKickerDesign(config.kickerConfigPath);
  const profile = kickerDesign.profile;
  const startPose = kickerDesign.startPose;
  const minX = Math.min(...profile.points.map((p) => p.x));
  const maxX = Math.max(...profile.points.map((p) => p.x));
  const minZ = Math.min(...profile.points.map((p) => p.z));
  const maxZ = Math.max(...profile.points.map((p) => p.z));
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;
  const extent = Math.max(maxX - minX, maxZ - minZ, profile.width) * 0.68;
  const startPoint = profile.points[0];
  const takeoffLip = profilePoint(profile, 'C');
  const landingPoint = profilePoint(profile, 'D');
  const { vertices, faces } = extrudedMesh(profile);
  const vertexAttr = vertices.map(([x, y, z]) => `${x.toFixed(3)} ${y.toFixed(3)} ${z.toFixed(3)}`).join(' ');
  const faceAttr = faces.map(([a, b, c]) => `${a} ${b} ${c}`).join(' ');
  const collisionGeoms = buildProfileCollisionGeoms(profile);
  const routeMarkers = buildRouteMarkers(profile);
  const pointMarkers = buildPointMarkers(profile);
  const halfLength = config.boardLength / 2;
  const halfWidth = config.boardWidth / 2;
  const halfThickness = config.boardThickness / 2;
  const boardDensity = config.boardMass / (config.boardLength * config.boardWidth * config.boardThickness);
  const torsoDensity = config.riderMass / (0.36 * 0.22 * 0.68);
  const limbDensity = 50.0;

  return `<mujoco model="snowboard_big_air">
  <compiler angle="degree" autolimits="true"/>
  <option timestep="${config.timestep}" gravity="0 0 -9.81" integrator="RK4"/>
  <statistic center="${centerX.toFixed(3)} 0 ${centerZ.toFixed(3)}" extent="${extent.toFixed(3)}"/>

  <default>
    <geom condim="3" friction="0.08 0.01 0.001" rgba="0.82 0.86 0.92 1"/>
    <joint damping="0.04"/>
  </default>

  <asset>
    <mesh name="big_air_profile_mesh" vertex="${vertexAttr}" face="${faceAttr}"/>
    <texture name="snow" type="2d" builtin="checker" width="256" height="256"
             rgb1="0.9 0.95 1" rgb2="0.72 0.82 0.92"/>
    <material name="snow_mat" texture="snow" texrepeat="8 8" reflectance="0.18"/>
    <material name="board_mat" rgba="0.08 0.11 0.14 1"/>
    <material name="rider_mat" rgba="0.1 0.24 0.72 1"/>
    <material name="pants_mat" rgba="0.03 0.05 0.09 1"/>
    <material name="skin_mat" rgba="0.86 0.62 0.42 1"/>
    <material name="flag_mat" rgba="0.95 0.16 0.1 1"/>
    <material name="rail_mat" rgba="0.18 0.2 0.22 1"/>
  </asset>

  <worldbody>
    <light name="sun" pos="-4 -5 8" dir="0.5 0.6 -1"/>
    <camera name="top_of_kicker" pos="${(takeoffLip.x - 0.85).toFixed(3)} -5.0 ${(takeoffLip.z + 2.27).toFixed(3)}" xyaxes="1 0 0 0 0.48 0.88"/>
    <camera name="start_follow" pos="${(startPoint.x - 0.8).toFixed(3)} -4.8 ${(startPoint.z + 1.27).toFixed(3)}" xyaxes="0.54 -0.84 0 0.45 0.29 0.84"/>
    <camera name="side" pos="${centerX.toFixed(3)} -8 ${(centerZ + 2.4).toFixed(3)}" xyaxes="1 0 0 0 0.42 0.91"/>
    <camera name="three_quarter" pos="${(minX + 0.1 * (maxX - minX)).toFixed(3)} -10 ${(maxZ + 1.5).toFixed(3)}" xyaxes="0.82 -0.57 0 0.31 0.45 0.84"/>
    <camera name="landing" pos="${(landingPoint.x + 5.2).toFixed(3)} -10 ${(landingPoint.z + 3.9).toFixed(3)}" xyaxes="0.93 0.37 0 -0.18 0.45 0.88"/>

    <geom name="big_air_profile" type="mesh" mesh="big_air_profile_mesh"
          material="snow_mat" friction="0.08 0.01 0.001"
          contype="0" conaffinity="0"/>
    ${collisionGeoms}
    <geom name="kicker" type="sphere" size="0.04" pos="${takeoffLip.x.toFixed(3)} 0 ${takeoffLip.z.toFixed(3)}"
          rgba="0.95 0.16 0.1 1" contype="0" conaffinity="0"/>
    ${routeMarkers}
    ${pointMarkers}
    <geom name="start_deck" type="box" size="3.0 3.0 0.08" material="snow_mat"
          pos="${(startPoint.x - 0.6).toFixed(3)} 0 ${(startPoint.z - 0.2).toFixed(3)}" contype="0" conaffinity="0"/>
    <geom name="left_park_rail" type="capsule" size="0.04 8.0" material="rail_mat"
          pos="3.0 4.1 -0.45" euler="90 0 0"/>
    <geom name="right_park_rail" type="capsule" size="0.04 8.0" material="rail_mat"
          pos="3.0 -4.1 -0.45" euler="90 0 0"/>
    <body name="left_boundary_flag" pos="1.2 3.2 0.85">
      <geom name="left_flag_pole" type="capsule" size="0.025 0.8" rgba="0.1 0.1 0.1 1"/>
      <geom name="left_flag" type="box" size="0.35 0.025 0.18" pos="0.35 0 0.55"
            material="flag_mat"/>
    </body>
    <body name="right_boundary_flag" pos="1.2 -3.2 0.85">
      <geom name="right_flag_pole" type="capsule" size="0.025 0.8" rgba="0.1 0.1 0.1 1"/>
      <geom name="right_flag" type="box" size="0.35 0.025 0.18" pos="0.35 0 0.55"
            material="flag_mat"/>
    </body>

    <body name="snowboarder" pos="${startPose.x} 0 ${startPose.z}" euler="0 ${startPose.pitchDegrees} ${config.launch.headingDegrees}">
      <freejoint name="root"/>
      <geom name="snowboard" type="box"
            size="${halfLength.toFixed(4)} ${halfWidth.toFixed(4)} ${halfThickness.toFixed(4)}"
            density="${boardDensity.toFixed(3)}" material="board_mat"
            rgba="0.02 0.02 0.025 1"/>
      <body name="rider" pos="0 0 0.55">
        <geom name="rider_pelvis" type="box" size="0.18 0.12 0.10"
              pos="0 0 0.02" density="${limbDensity.toFixed(3)}" material="pants_mat"
              rgba="0.03 0.05 0.09 1" contype="0" conaffinity="0"/>
        <geom name="rider_torso" type="capsule" fromto="-0.05 0 0.08 -0.08 0 0.46"
              size="0.13" density="${torsoDensity.toFixed(3)}" material="rider_mat"
              rgba="0.05 0.18 0.95 1" contype="0" conaffinity="0"/>
        <geom name="rider_chest" type="capsule" fromto="-0.10 0 0.34 -0.12 0 0.58"
              density="${limbDensity.toFixed(3)}" material="rider_mat"
              size="0.15"
              rgba="0.05 0.18 0.95 1" contype="0" conaffinity="0"/>
        <geom name="neck" type="capsule" size="0.055 0.06" pos="0 0 0.58"
              density="${limbDensity.toFixed(3)}" material="skin_mat"
              rgba="0.86 0.62 0.42 1" contype="0" conaffinity="0"/>
        <geom name="rider_head" type="sphere" size="0.13" pos="0 0 0.72"
              density="${limbDensity.toFixed(3)}" material="skin_mat"
              rgba="0.86 0.62 0.42 1" contype="0" conaffinity="0"/>
        <geom name="helmet" type="sphere" size="0.145" pos="0 0 0.75"
              density="650" rgba="0.95 0.72 0.16 1" contype="0" conaffinity="0"/>
        <geom name="left_upper_arm" type="capsule" fromto="-0.08 0.13 0.40 -0.16 0.30 0.22"
              size="0.045" density="${limbDensity.toFixed(3)}" material="rider_mat"
              rgba="0.05 0.18 0.95 1" contype="0" conaffinity="0"/>
        <geom name="right_upper_arm" type="capsule" fromto="-0.08 -0.13 0.40 -0.16 -0.30 0.22"
              size="0.045" density="${limbDensity.toFixed(3)}" material="rider_mat"
              rgba="0.05 0.18 0.95 1" contype="0" conaffinity="0"/>
        <geom name="left_forearm" type="capsule" fromto="-0.16 0.30 0.22 -0.08 0.38 0.02"
              size="0.04" density="${limbDensity.toFixed(3)}" material="skin_mat"
              rgba="0.86 0.62 0.42 1" contype="0" conaffinity="0"/>
        <geom name="right_forearm" type="capsule" fromto="-0.16 -0.30 0.22 -0.08 -0.38 0.02"
              size="0.04" density="${limbDensity.toFixed(3)}" material="skin_mat"
              rgba="0.86 0.62 0.42 1" contype="0" conaffinity="0"/>
        <geom name="left_thigh" type="capsule" fromto="0.04 0.09 -0.05 0.30 0.10 -0.35"
              size="0.06" density="${limbDensity.toFixed(3)}" material="pants_mat"
              rgba="0.03 0.05 0.09 1" contype="0" conaffinity="0"/>
        <geom name="right_thigh" type="capsule" fromto="0.04 -0.09 -0.05 0.30 -0.10 -0.35"
              size="0.06" density="${limbDensity.toFixed(3)}" material="pants_mat"
              rgba="0.03 0.05 0.09 1" contype="0" conaffinity="0"/>
        <geom name="left_shin" type="capsule" fromto="0.30 0.10 -0.35 0.55 0.10 -0.50"
              size="0.05" density="${limbDensity.toFixed(3)}" material="pants_mat"
              rgba="0.03 0.05 0.09 1" contype="0" conaffinity="0"/>
        <geom name="right_shin" type="capsule" fromto="0.30 -0.10 -0.35 0.55 -0.10 -0.50"
              size="0.05" density="${limbDensity.toFixed(3)}" material="pants_mat"
              rgba="0.03 0.05 0.09 1" contype="0" conaffinity="0"/>
        <geom name="left_boot" type="box" pos="0.62 0.10 -0.52" size="0.12 0.055 0.035"
              density="${limbDensity.toFixed(3)}" rgba="0.01 0.01 0.012 1"
              contype="0" conaffinity="0"/>
        <geom name="right_boot" type="box" pos="0.62 -0.10 -0.52" size="0.12 0.055 0.035"
              density="${limbDensity.toFixed(3)}" rgba="0.01 0.01 0.012 1"
              contype="0" conaffinity="0"/>
      </body>
    </body>
  </worldbody>

  <actuator>
    <motor name="launch_motor_x" joint="root" gear="1 0 0 0 0 0" ctrlrange="-400 400"/>
    <motor name="launch_motor_y" joint="root" gear="0 1 0 0 0 0" ctrlrange="-400 400"/>
    <motor name="launch_motor_z" joint="root" gear="0 0 1 0 0 0" ctrlrange="-400 400"/>
    <motor name="spin_motor_pitch" joint="root" gear="0 0 0 0 1 0" ctrlrange="-120 120"/>
    <motor name="spin_motor_yaw" joint="root" gear="0 0 0 0 0 1" ctrlrange="-120 120"/>
  </actuator>
</mujoco>`;
}

export function writeModelXml(filePath: string, config: SimulatorConfig): string {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, buildModelXml(config), 'utf-8');
  return filePath;
}

// ============================================
// Simulation
// ============================================

export interface SimulationResult {
  duration: number;
  landingTime: number;
  maxHeight: number;
  distance: number;
  lateralOffset: number;
  drop: number;
  reachedB: boolean;
  reachedC: boolean;
  reachedD: boolean;
  takeoffHeight: number;
  landingX: number;
}

export async function createModelAndData(config: SimulatorConfig): Promise<{
  model: any;
  data: any;
  free: () => void;
}> {
  const mujoco = await getMujoco();
  const xml = buildModelXml(config);
  const model = mujoco.MjModel.from_xml_string(xml);
  const data = new mujoco.MjData(model);
  applyLaunchVelocity(model, data, config.launch, mujoco);

  return {
    model,
    data,
    free: () => {
      data.delete();
      model.delete();
    },
  };
}

export async function simulateHeadless(config: SimulatorConfig): Promise<SimulationResult> {
  const mujoco = await getMujoco();
  const { model, data, free } = await createModelAndData(config);
  const profile = loadKickerDesign(config.kickerConfigPath).profile;
  const steps = Math.floor(config.duration / config.timestep);

  let maxHeight = data.qpos[2];
  const startHeight = data.qpos[2];
  const startX = data.qpos[0];
  let landingTime = config.duration;
  let reachedB = false;
  let reachedC = false;
  let reachedD = false;
  const takeoffHeight = profilePoint(profile, 'C').z;
  let landingX = data.qpos[0];

  try {
    for (let step = 0; step < steps; step++) {
      controlTakeoffPop(data, config.launch, profile, mujoco);
      mujoco.mj_step(model, data);

      maxHeight = Math.max(maxHeight, data.qpos[2]);
      reachedB ||= data.qpos[0] >= profilePoint(profile, 'B').x;
      reachedC ||= data.qpos[0] >= profilePoint(profile, 'C').x;
      reachedD ||= data.qpos[0] >= profilePoint(profile, 'D').x;

      if (reachedC && data.qpos[0] >= profilePoint(profile, 'D').x - 0.5) {
        landingX = Math.max(landingX, data.qpos[0]);
      }
      if (step > 20 && data.qpos[2] <= 0.16) {
        landingTime = data.time;
        break;
      }
    }

    return {
      duration: data.time,
      landingTime,
      maxHeight,
      distance: data.qpos[0] - startX,
      lateralOffset: data.qpos[1],
      drop: startHeight - data.qpos[2],
      reachedB,
      reachedC,
      reachedD,
      takeoffHeight,
      landingX,
    };
  } finally {
    free();
  }
}

// ============================================
// Physics helpers
// ============================================

function applyLaunchVelocity(model: any, data: any, launch: LaunchProfile, mujoco: any): void {
  const [vx, vy] = velocityComponents(launch);
  data.qvel[0] = vx;
  data.qvel[1] = vy;
  data.qvel[2] = 0.0;
  data.qvel[3] = 0.0;
  data.qvel[4] = 0.05;
  data.qvel[5] = 0.0;
  mujoco.mj_forward(model, data);
}

export function controlTakeoffPop(
  data: any,
  launch: LaunchProfile,
  profile: KickerProfile,
  mujoco: any
): void {
  const pointC = profilePoint(profile, 'C');
  data.ctrl.fill(0);

  if (data.qpos[0] < pointC.x - 0.15) {
    const targetZ = profileHeightAt(profile, data.qpos[0]) + 0.08;
    const verticalError = targetZ - data.qpos[2];
    data.ctrl[0] = 190.0;
    data.ctrl[1] = 18.0 * Math.sin(radians(launch.headingDegrees));
    data.ctrl[2] = clamp(360.0 * verticalError - 45.0 * data.qvel[2], -380.0, 380.0);
  }

  if (pointC.x - 0.35 < data.qpos[0] && data.qpos[0] < pointC.x + 0.35) {
    const pitch = radians(launch.angleDegrees);
    data.ctrl[0] = 260.0 * Math.cos(pitch);
    data.ctrl[1] = 30.0 * Math.sin(radians(launch.headingDegrees));
    data.ctrl[2] = 420.0 * Math.sin(pitch);
    data.ctrl[3] = 25.0;
    data.ctrl[4] = launch.yawSpinRate * 4.0;
  }
}

// ============================================
// Math utilities
// ============================================

function radians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function degrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
