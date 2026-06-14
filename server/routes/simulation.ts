import { Router } from 'express';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth';
import {
  makeSimulatorConfig,
  makeLaunchProfile,
  buildReplayData,
  type SimulatorConfig,
} from '../mujoco/index.js';
import type { MoveAnalysisRequest } from '../../src/types/index.js';

const router = Router();

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function estimateLaunchSpeedMs(request: MoveAnalysisRequest): number {
  // MuJoCo applies motors during the inrun, so the initial speed at the start
  // of the run-in should be modest. The motors accelerate the rider to the
  // appropriate takeoff speed for the kicker profile.
  switch (request.kicker.type) {
    case 'big-air':
      return 1.5;
    case 'slopestyle':
      return 1.3;
    case 'halfpipe':
      return 1.1;
    case 'rail':
      return 0.8;
    case 'kicker':
    default:
      return 1.2;
  }
}

function mapRequestToConfig(request: MoveAnalysisRequest): SimulatorConfig {
  const board = (request as any).board;

  const boardLength = board?.lengthCm ? board.lengthCm / 100 : 1.65;
  const boardWidth = board?.widthCm ? board.widthCm / 100 : 0.28;
  const boardThickness = board?.thicknessCm ? board.thicknessCm / 100 : 0.045;

  return makeSimulatorConfig({
    timestep: 0.002,
    duration: 4.0,
    riderMass: request.rider.weightKg || 72,
    boardLength: clamp(boardLength, 1.0, 2.0),
    boardWidth: clamp(boardWidth, 0.2, 0.4),
    boardThickness: clamp(boardThickness, 0.02, 0.08),
    launch: makeLaunchProfile({
      speed: clamp(estimateLaunchSpeedMs(request), 1, 10),
      angleDegrees: clamp(request.kicker.takeoffAngle, 10, 60),
      headingDegrees: 0,
      yawSpinRate: request.move.rotationDegrees / 360,
    }),
  });
}

// ============================================
// POST /api/simulation/run
// Run MuJoCo and return frame-by-frame replay data.
// ============================================
router.post('/run', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const request = req.body as MoveAnalysisRequest;

    if (!request?.move || !request?.kicker || !request?.rider) {
      res.status(400).json({ success: false, message: 'move, kicker, and rider are required.' });
      return;
    }

    const config = mapRequestToConfig(request);
    const replay = await buildReplayData(config, 3);

    res.json({
      success: true,
      replay,
    });
  } catch (err: any) {
    console.error('[simulation] MuJoCo replay failed:', err);
    res.status(500).json({
      success: false,
      message: err?.message || 'Physics simulation failed.',
    });
  }
});

export default router;
