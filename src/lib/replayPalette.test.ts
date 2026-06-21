import assert from 'node:assert/strict';
import test from 'node:test';

test('keeps the 3D kicker visually distinct from the horizon', async () => {
  const paletteModule = await import('./replayPalette.ts').catch(() => null);
  assert.ok(paletteModule, '3D replay palette should exist');

  const distance = paletteModule.colorDistance(
    paletteModule.REPLAY_COLORS.sky,
    paletteModule.REPLAY_COLORS.terrain
  );

  assert.ok(distance >= 100, `expected sky/terrain distance >= 100, received ${distance}`);
  assert.equal(paletteModule.REPLAY_COLORS.terrain, 0xd7f4c2);
});
