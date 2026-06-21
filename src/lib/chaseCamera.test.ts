import assert from 'node:assert/strict';
import test from 'node:test';

test('places the camera behind and above the athlete direction of travel', async () => {
  const cameraModule = await import('./chaseCamera.ts').catch(() => null);
  assert.ok(cameraModule, 'chase camera helper should exist');

  const pose = cameraModule.getChaseCameraPose({
    position: [10, 2, 5],
    velocity: [4, 0, 1],
  });

  assert.ok(pose.position[0] < 10, 'camera should trail the athlete');
  assert.ok(pose.position[2] > 5, 'camera should be above the athlete');
  assert.ok(pose.target[0] > 10, 'camera should look ahead of the athlete');
});

test('uses a stable forward fallback when horizontal speed is zero', async () => {
  const cameraModule = await import('./chaseCamera.ts').catch(() => null);
  assert.ok(cameraModule, 'chase camera helper should exist');

  const pose = cameraModule.getChaseCameraPose({
    position: [0, 0, 4],
    velocity: [0, 0, -2],
  });

  assert.deepEqual(pose.forward, [1, 0, 0]);
  assert.ok(pose.position[0] < 0);
});

test('raises the trailing camera above uphill terrain during a steep descent', async () => {
  const { getChaseCameraPose } = await import('./chaseCamera.ts');
  const pose = getChaseCameraPose({
    position: [10, 0, 5],
    velocity: [4, 0, -3],
  });

  assert.ok(pose.position[2] > 10, 'camera should follow the downhill pitch from above');
});

test('keeps the look target on the athlete during upward flight', async () => {
  const { getChaseCameraPose } = await import('./chaseCamera.ts');
  const pose = getChaseCameraPose({
    position: [10, 0, 5],
    velocity: [4, 0, 3],
  });

  assert.equal(pose.target[2], 5.8);
});
