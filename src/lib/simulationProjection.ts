interface SimulationProjectionOptions {
  width: number;
  height: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const PADDING = { left: 28, right: 28, top: 32, bottom: 56 };

export function createSimulationProjection({ width, height, minX, maxX, minZ, maxZ }: SimulationProjectionOptions) {
  const xRange = maxX - minX || 1;
  const zRange = maxZ - minZ || 1;
  const drawWidth = Math.max(width - PADDING.left - PADDING.right, 1);
  const drawHeight = Math.max(height - PADDING.top - PADDING.bottom, 1);
  const scale = Math.min(drawWidth / xRange, drawHeight / zRange);
  const offsetX = PADDING.left + (drawWidth - scale * xRange) / 2;
  const offsetY = PADDING.top + (drawHeight - scale * zRange) / 2;

  return {
    x: (value: number) => offsetX + (value - minX) * scale,
    z: (value: number) => offsetY + (maxZ - value) * scale,
  };
}
