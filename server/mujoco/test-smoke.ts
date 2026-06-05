/**
 * Smoke test — verifies the JS simulation modules load and compile.
 * Does NOT run a full simulation (MuJoCo WASM needs to load).
 */

import {
  loadKickerDesign,
  makeSimulatorConfig,
  buildModelXml,
  makeLaunchProfile,
} from './simulator.js';

console.log('=== Smoke Test: Snowboard MuJoCo JS ===');

const design = loadKickerDesign();
console.log('Kicker design loaded:', design.profile.points.length, 'points');
console.log('Start pose:', design.startPose);

const config = makeSimulatorConfig({
  launch: makeLaunchProfile({ speed: 3.0, angleDegrees: 30 }),
});
console.log('Simulator config:', config);

const xml = buildModelXml(config);
console.log('XML generated:', xml.length, 'chars');
console.log('XML starts with:', xml.slice(0, 40));

console.log('Smoke test passed!');
