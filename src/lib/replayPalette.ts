export const REPLAY_COLORS = {
  sky: 0x86bfe5,
  terrain: 0xd7f4c2,
  snow: 0xeaf3f8,
} as const;

export function colorDistance(first: number, second: number) {
  const firstRgb = [(first >> 16) & 0xff, (first >> 8) & 0xff, first & 0xff];
  const secondRgb = [(second >> 16) & 0xff, (second >> 8) & 0xff, second & 0xff];
  return Math.hypot(
    firstRgb[0] - secondRgb[0],
    firstRgb[1] - secondRgb[1],
    firstRgb[2] - secondRgb[2]
  );
}
