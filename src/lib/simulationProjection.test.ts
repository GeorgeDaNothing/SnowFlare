import assert from 'node:assert/strict';
import test from 'node:test';

test('fits the complete simulation bounds inside CSS canvas dimensions', async () => {
  const projectionModule = await import('./simulationProjection.ts').catch(() => null);
  assert.ok(projectionModule, 'simulation projection helper should exist');

  const width = 928;
  const height = 404;
  const projection = projectionModule.createSimulationProjection({
    width,
    height,
    minX: -48,
    maxX: 33.3,
    minZ: -6.4,
    maxZ: 34.08,
  });

  assert.ok(projection.x(-48) >= 0);
  assert.ok(projection.x(33.3) <= width);
  assert.ok(projection.z(34.08) >= 0);
  assert.ok(projection.z(-6.4) <= height);
});
