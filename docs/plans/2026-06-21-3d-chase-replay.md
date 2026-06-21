# 3D Chase Replay Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the 2D simulation replay with a stylized 3D replay viewed from a camera behind the athlete.

**Architecture:** Keep the existing replay API and controls. Dynamically load Three.js inside `SimulationAnimation`, construct terrain from `profile_vertices`/`profile_faces`, interpolate rider transforms from replay frames, and update a damped chase camera from horizontal velocity. Isolate chase-camera vector math in a tested dependency-free helper.

**Tech Stack:** React 19, TypeScript, Three.js, Node test runner, Vite.

### Task 1: Chase camera math

**Files:**
- Create: `src/lib/chaseCamera.ts`
- Test: `src/lib/chaseCamera.test.ts`

1. Write failing tests requiring the camera to stay behind and above a moving athlete and to handle zero velocity.
2. Run `node --test src/lib/chaseCamera.test.ts` and confirm the helper is missing.
3. Implement normalized horizontal direction, camera position, and look target calculations.
4. Rerun the test and confirm it passes.

### Task 2: Three.js dependency and renderer

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/components/SimulationAnimation.tsx`

1. Add `three` and its TypeScript declarations.
2. Dynamically import Three.js when replay data mounts.
3. Build the terrain mesh, trajectory line, lights, snow surface, and stylized athlete group.
4. Interpolate position/quaternion per frame and update the chase camera.
5. Dispose renderer, geometry, and materials on unmount.

### Task 3: Controls and responsive behavior

**Files:**
- Modify: `src/components/SimulationAnimation.tsx`

1. Preserve play/pause, replay, scrubber, timecode, and fullscreen controls.
2. Resize renderer/camera from the container without changing replay geometry.
3. Add an HTML status overlay for phase, height, and chase-camera mode.

### Task 4: Verification

1. Run `node --test src/lib/chaseCamera.test.ts`.
2. Run `npm run lint`.
3. Run `npm run build` and confirm Three.js is emitted as a lazy chunk.
4. Browser-test normal and fullscreen replay, scrubber interaction, console health, and behind-athlete camera framing.
