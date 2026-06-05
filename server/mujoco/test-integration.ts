/**
 * Integration test — runs the actual MuJoCo WASM simulation.
 */

import {
  makeSimulatorConfig,
  makeLaunchProfile,
  simulateHeadless,
  writeModelXml,
} from './simulator.js';
import { buildReplayData, writeReplayJson } from './replay.js';
import { writeBrowserViewerHtml } from './browser-viewer.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('=== Integration Test: MuJoCo WASM ===');

  const config = makeSimulatorConfig({
    launch: makeLaunchProfile({ speed: 2.8, angleDegrees: 32 }),
    duration: 4.0,
  });

  console.log('Running headless simulation...');
  const result = await simulateHeadless(config);
  console.log('Simulation result:', result);

  const outDir = path.resolve(__dirname, 'output');

  console.log('Writing model XML...');
  const xmlPath = path.join(outDir, 'model.xml');
  writeModelXml(xmlPath, config);
  console.log('  ->', xmlPath);

  console.log('Building replay data...');
  const replay = await buildReplayData(config, 3);
  console.log('  Frames:', replay.frames.length);
  console.log('  Duration:', replay.metadata.duration);

  console.log('Writing replay JSON...');
  const replayPath = path.join(outDir, 'replay.json');
  writeReplayJson(replayPath, config, 3);
  console.log('  ->', replayPath);

  console.log('Writing browser viewer...');
  const viewerPath = path.join(outDir, 'viewer.html');
  writeBrowserViewerHtml(viewerPath, 'replay.json');
  console.log('  ->', viewerPath);

  console.log('Integration test passed!');
}

main().catch((err) => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
