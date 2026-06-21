type Vector3Tuple = [number, number, number];

interface ChaseCameraOptions {
  position: Vector3Tuple;
  velocity: Vector3Tuple;
  fallbackForward?: Vector3Tuple;
  distance?: number;
  height?: number;
  lookAhead?: number;
}

function normalizeHorizontal(vector: Vector3Tuple): Vector3Tuple | null {
  const length = Math.hypot(vector[0], vector[1]);
  if (length < 0.001) return null;
  return [vector[0] / length, vector[1] / length, 0];
}

export function getChaseCameraPose({
  position,
  velocity,
  fallbackForward = [1, 0, 0],
  distance = 7,
  height = 2.8,
  lookAhead = 4,
}: ChaseCameraOptions) {
  const forward = normalizeHorizontal(velocity) ?? normalizeHorizontal(fallbackForward) ?? [1, 0, 0];
  const horizontalSpeed = Math.hypot(velocity[0], velocity[1]);
  const slope = horizontalSpeed > 0.001 ? Math.max(-0.8, Math.min(0.6, velocity[2] / horizontalSpeed)) : 0;
  const cameraZ = Math.max(position[2] + 1.8, position[2] - slope * distance + height);

  return {
    forward,
    position: [
      position[0] - forward[0] * distance,
      position[1] - forward[1] * distance,
      cameraZ,
    ] as Vector3Tuple,
    target: [
      position[0] + forward[0] * lookAhead,
      position[1] + forward[1] * lookAhead,
      position[2] + 0.8,
    ] as Vector3Tuple,
  };
}
