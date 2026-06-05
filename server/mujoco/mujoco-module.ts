/**
 * Shared MuJoCo WASM module loader.
 *
 * MuJoCo WASM uses Embind, which means each module instance has its own
 * type registry. Passing an MjModel created by one instance to mj_step
 * on another instance throws a BindingError. This singleton ensures all
 * simulation code uses the same WASM module.
 */

import loadMujoco from '@mujoco/mujoco';

let mujocoModule: Awaited<ReturnType<typeof loadMujoco>> | null = null;

export async function getMujoco() {
  if (!mujocoModule) {
    mujocoModule = await loadMujoco();
  }
  return mujocoModule;
}
