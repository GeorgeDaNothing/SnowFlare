import type { MoveAnalysisRequest, PhysicsEstimate } from '@/types';

const G = 9.81; // m/s²

/**
 * Calculate physics estimates for a snowboarding move.
 * Uses simplified projectile motion and rotation kinematics.
 */
export function calculatePhysics(request: MoveAnalysisRequest): PhysicsEstimate {
  const { move, kicker, rider } = request;

  // Estimate approach speed based on kicker type and vertical drop
  // Pro big-air kickers need ~55-65 km/h, slopestyle ~45-55, small kickers ~30-40
  const baseApproachSpeed = estimateBaseApproachSpeed(kicker.type, kicker.verticalDrop);

  // Adjust for rider weight (heavier riders need slightly more speed for same airtime)
  const weightFactor = 1 + (rider.weightKg - 70) * 0.003;
  const requiredApproachSpeedKmh = baseApproachSpeed * weightFactor;

  // Convert to m/s for calculations
  const approachSpeedMs = requiredApproachSpeedKmh / 3.6;

  // Takeoff velocity components
  const takeoffAngleRad = (kicker.takeoffAngle * Math.PI) / 180;
  const v0x = approachSpeedMs * Math.cos(takeoffAngleRad);
  const v0y = approachSpeedMs * Math.sin(takeoffAngleRad);

  // Projectile motion with vertical drop
  // Landing is lower than takeoff by verticalDrop
  // y(t) = v0y * t - 0.5 * g * t² = -verticalDrop
  // Solve: -0.5 * g * t² + v0y * t + verticalDrop = 0
  const a = -0.5 * G;
  const b = v0y;
  const c = kicker.verticalDrop;
  const discriminant = b * b - 4 * a * c;
  const airTimeSec = discriminant > 0 ? (-b - Math.sqrt(discriminant)) / (2 * a) : 1.5;

  // Max height above takeoff point
  const timeToApex = v0y / G;
  const maxHeightAboveTakeoff = v0y * timeToApex - 0.5 * G * timeToApex * timeToApex;
  const estimatedMaxHeightM = Math.max(0, maxHeightAboveTakeoff);

  // Landing velocity
  const vx = v0x; // roughly constant (ignore air resistance)
  const vy = v0y - G * airTimeSec;
  const landingSpeedMs = Math.sqrt(vx * vx + vy * vy);
  const landingAngleDeg = Math.atan2(vy, vx) * (180 / Math.PI);

  // Impact force estimation (simplified)
  // Based on landing velocity, landing angle mismatch, and snow condition
  const landingAngleMismatch = Math.abs(landingAngleDeg + kicker.landingAngle);
  const anglePenalty = Math.max(0, landingAngleMismatch - 10) / 30; // penalty if mismatch > 10°
  const baseImpactG = (landingSpeedMs * landingSpeedMs) / (2 * G * 0.3); // assume 0.3m stopping distance
  const snowDamping = getSnowDamping(kicker.snowCondition);
  const estimatedImpactForceG = Math.max(1, (baseImpactG * (1 + anglePenalty)) / snowDamping);

  // Required rotation speed
  const rotationSpeedRequiredDs = move.rotationDegrees / airTimeSec;

  return {
    estimatedAirTimeSec: round(airTimeSec, 2),
    estimatedMaxHeightM: round(estimatedMaxHeightM, 1),
    estimatedLandingVelocityMs: round(landingSpeedMs, 1),
    estimatedImpactForceG: round(estimatedImpactForceG, 2),
    requiredApproachSpeedKmh: round(requiredApproachSpeedKmh, 1),
    rotationSpeedRequiredDs: round(rotationSpeedRequiredDs, 1),
  };
}

function estimateBaseApproachSpeed(kickerType: string, verticalDrop: number): number {
  switch (kickerType) {
    case 'big-air':
      return 55 + verticalDrop * 2;
    case 'slopestyle':
      return 45 + verticalDrop * 1.5;
    case 'halfpipe':
      return 35 + verticalDrop;
    case 'kicker':
      return 40 + verticalDrop * 1.5;
    case 'rail':
      return 25;
    default:
      return 40;
  }
}

function getSnowDamping(condition: string): number {
  switch (condition) {
    case 'powder':
      return 2.5; // soft landing
    case 'packed':
      return 1.5;
    case 'corduroy':
      return 1.3;
    case 'slush':
      return 1.8;
    case 'icy':
      return 0.8; // hard landing, more force
    default:
      return 1.5;
  }
}

function round(n: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

/**
 * Get human-readable physics interpretation
 */
export function interpretPhysics(physics: PhysicsEstimate): string {
  const parts: string[] = [];

  if (physics.estimatedAirTimeSec < 1.0) {
    parts.push('Very short air time — limited window for rotation/grab.');
  } else if (physics.estimatedAirTimeSec > 3.0) {
    parts.push('Extended air time — high commitment, exposure to wind/environment increases.');
  }

  if (physics.estimatedImpactForceG > 8) {
    parts.push('Extremely high impact force — severe injury risk on hard landing.');
  } else if (physics.estimatedImpactForceG > 5) {
    parts.push('High impact force — proper absorption technique essential.');
  }

  if (physics.rotationSpeedRequiredDs > 600) {
    parts.push('Very fast rotation required — precision timing critical.');
  }

  return parts.join(' ') || 'Physics parameters within normal range.';
}
