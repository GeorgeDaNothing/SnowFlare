/**
 * Snowboard Big Air MuJoCo JavaScript API
 *
 * Exports the WASM-based snowboard simulation for use in Node.js.
 */

export {
  DEFAULT_KICKER_CONFIG_PATH,
  type ProfilePoint,
  type KickerProfile,
  makeKickerProfileReference,
  profilePoint,
  segmentAngle,
  profileIsContinuous,
  extrudedMesh,
  type StartPose,
  type KickerDesign,
  loadKickerDesign,
  type LaunchProfile,
  makeLaunchProfile,
  velocityComponents,
  type SimulatorConfig,
  makeSimulatorConfig,
  buildModelXml,
  writeModelXml,
  type SimulationResult,
  createModelAndData,
  simulateHeadless,
} from './simulator.js';

export {
  type ReplayFrame,
  type ReplayMetadata,
  type ReplayConfigPoint,
  type ReplayData,
  buildReplayData,
  writeReplayJson,
} from './replay.js';

export {
  buildBrowserViewerHtml,
  writeBrowserViewerHtml,
} from './browser-viewer.js';
