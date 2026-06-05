import type { MoveAnalysisRequest, MoveAnalysisResponse, RiskFactor, ImprovementSuggestion } from '@/types';
import { calculatePhysics, interpretPhysics } from './physics';

const EXPERIENCE_MULTIPLIERS: Record<string, number> = {
  beginner: 2.5,
  intermediate: 1.8,
  advanced: 1.3,
  expert: 1.0,
  pro: 0.8,
};

const FLIP_DIFFICULTY: Record<string, number> = {
  none: 0,
  backflip: 25,
  frontflip: 30,
  rodeo: 40,
  cork: 35,
  'double-cork': 55,
  'triple-cork': 75,
};

const GRAB_DIFFICULTY: Record<string, number> = {
  indy: 5,
  melon: 5,
  mute: 8,
  stalefish: 10,
  tail: 15,
  nose: 15,
  japan: 20,
  method: 18,
  seatbelt: 22,
  truck_driver: 25,
};

/**
 * Rule-based risk engine.
 * Calculates danger scores deterministically from move configuration.
 */
export function analyzeMove(request: MoveAnalysisRequest): MoveAnalysisResponse {
  const { move, kicker, rider, context } = request;
  const physics = calculatePhysics(request);

  const riskFactors: RiskFactor[] = [];
  const improvements: ImprovementSuggestion[] = [];

  // --- Rotation Risk ---
  const rotationBaseRisk = Math.min(100, (move.rotationDegrees / 1440) * 70);
  const experienceMult = EXPERIENCE_MULTIPLIERS[rider.experienceLevel] || 1.5;
  const rotationRisk = rotationBaseRisk * experienceMult;

  if (rotationRisk > 60) {
    riskFactors.push({
      category: 'rotation',
      severity: rotationRisk > 80 ? 'critical' : 'warning',
      title: 'High Rotation Demand',
      description: `${move.rotationDegrees}° requires ${physics.rotationSpeedRequiredDs}°/s rotation speed with only ${physics.estimatedAirTimeSec}s air time.`,
      recommendation: `Master ${Math.round(move.rotationDegrees * 0.6)}° consistently before attempting this rotation.`,
    });
    improvements.push({
      area: 'Rotation Speed',
      currentValue: `${move.rotationDegrees}°`,
      suggestedValue: `${Math.round(move.rotationDegrees * 0.6)}°`,
      expectedBenefit: 'Build muscle memory for spin initiation and landing spotting.',
      difficultyToImplement: 'easy',
    });
  }

  // --- Inversion / Flip Risk ---
  const flipRisk = FLIP_DIFFICULTY[move.flipType] || 0;
  const inversionBonus = (move.inversionDepth / 100) * 30;
  const totalInversionRisk = (flipRisk + inversionBonus) * experienceMult;

  if (totalInversionRisk > 40) {
    riskFactors.push({
      category: 'inversion',
      severity: totalInversionRisk > 70 ? 'critical' : 'warning',
      title: `${move.flipType !== 'none' ? move.flipType : 'Off-axis'} Inversion Risk`,
      description: `Inversion depth ${move.inversionDepth}% combined with ${move.flipType} creates disorientation risk.`,
      recommendation: 'Practice on trampoline or airbag before snow. Focus on visual spotting drills.',
    });
  }

  // --- Grab Risk ---
  if (move.grabType) {
    const grabDiff = GRAB_DIFFICULTY[move.grabType] || 10;
    const grabRisk = grabDiff * (1 + (100 - move.grabDurationPct) / 100);
    if (grabRisk > 15 && move.grabDurationPct < 50) {
      riskFactors.push({
        category: 'grab-timing',
        severity: 'warning',
        title: 'Grab Timing Risk',
        description: `${move.grabType} grab held for only ${move.grabDurationPct}% of airtime may indicate rushed execution.`,
        recommendation: 'Work on grab stability at lower rotation speeds before adding spin.',
      });
      improvements.push({
        area: 'Grab Duration',
        currentValue: `${move.grabDurationPct}%`,
        suggestedValue: '70-90%',
        expectedBenefit: 'More stable body position and cleaner style scoring.',
        difficultyToImplement: 'medium',
      });
    }
  }

  // --- Landing Risk ---
  const landingVelocityRisk = Math.min(100, (physics.estimatedLandingVelocityMs / 15) * 50);
  const impactRisk = Math.min(100, physics.estimatedImpactForceG * 8);
  const landingAngleMismatch = Math.abs(
    (physics.estimatedLandingVelocityMs > 0
      ? Math.atan2(-physics.estimatedLandingVelocityMs, 10) * (180 / Math.PI)
      : 0) + kicker.landingAngle
  );
  const landingGeomRisk = Math.min(100, landingAngleMismatch * 3);

  const totalLandingRisk = Math.max(landingVelocityRisk, impactRisk, landingGeomRisk);

  if (totalLandingRisk > 50) {
    riskFactors.push({
      category: 'landing',
      severity: totalLandingRisk > 75 ? 'critical' : 'warning',
      title: 'High Landing Impact',
      description: `Landing at ${physics.estimatedLandingVelocityMs} m/s with ~${physics.estimatedImpactForceG}G impact force. ${interpretLandingCondition(kicker.snowCondition)}`,
      recommendation: 'Ensure knees are bent at 90° on impact. Consider speed check before takeoff.',
    });
    improvements.push({
      area: 'Landing Preparation',
      currentValue: `${physics.estimatedImpactForceG}G impact`,
      suggestedValue: '< 4G impact',
      expectedBenefit: 'Reduced knee/ankle compression injuries.',
      difficultyToImplement: 'medium',
    });
  }

  // --- Speed / Approach Risk ---
  const speedRisk = Math.min(100, (physics.requiredApproachSpeedKmh / 80) * 60 * experienceMult);
  if (speedRisk > 50) {
    riskFactors.push({
      category: 'speed',
      severity: speedRisk > 70 ? 'critical' : 'warning',
      title: 'High Approach Speed Required',
      description: `${physics.requiredApproachSpeedKmh} km/h approach needed. Errors at this speed amplify exponentially.`,
      recommendation: 'Practice approach run timing and edge control at target speed without jumping.',
    });
  }

  // --- Fatigue Risk ---
  if (context.fatigueLevel > 6) {
    riskFactors.push({
      category: 'fatigue',
      severity: context.fatigueLevel > 8 ? 'critical' : 'warning',
      title: 'Elevated Fatigue',
      description: `Fatigue level ${context.fatigueLevel}/10 reduces reaction time and increases micro-errors.`,
      recommendation: `Rest ${context.fatigueLevel > 8 ? '30-45 min' : '15-20 min'} before attempting. Hydrate and reassess.`,
    });
    improvements.push({
      area: 'Fatigue Management',
      currentValue: `${context.fatigueLevel}/10`,
      suggestedValue: '< 5/10',
      expectedBenefit: 'Sharper proprioception and faster correction reflexes.',
      difficultyToImplement: 'easy',
    });
  }

  // --- Experience Match ---
  const totalMoveDifficulty = rotationBaseRisk + flipRisk + inversionBonus;
  const expectedDifficultyForLevel = getExpectedDifficultyForLevel(rider.experienceLevel);
  if (totalMoveDifficulty > expectedDifficultyForLevel * 1.5) {
    riskFactors.push({
      category: 'experience-match',
      severity: 'critical',
      title: 'Experience Level Mismatch',
      description: `This move is significantly beyond typical ${rider.experienceLevel} progression.`,
      recommendation: `Complete ${getPrerequisiteMoves(move).join(', ')} with confidence first.`,
    });
  }

  // --- Wind Direction Risk ---
  const windDirectionRisk = getWindDirectionRisk(context.windDirection || 'tailwind', context.weather);
  if (windDirectionRisk > 15) {
    riskFactors.push({
      category: 'environment',
      severity: windDirectionRisk > 25 ? 'critical' : 'warning',
      title: 'Adverse Wind Direction',
      description: `${context.windDirection || 'tailwind'} at ${context.weather === 'windy' ? 'high' : 'moderate'} speed can destabilize rotation and push you off axis.`,
      recommendation: 'Consider waiting for calmer conditions or reducing rotation complexity.',
    });
  }

  // --- Environment Risk ---
  const envMultiplier = getEnvironmentMultiplier(context.weather, context.visibility);
  if (envMultiplier > 1.3) {
    riskFactors.push({
      category: 'environment',
      severity: envMultiplier > 1.6 ? 'critical' : 'warning',
      title: 'Adverse Conditions',
      description: `${context.weather} weather with ${context.visibility} visibility increases spatial disorientation risk.`,
      recommendation: 'Postpone until conditions improve, or reduce rotation complexity by one level.',
    });
    improvements.push({
      area: 'Environmental Conditions',
      currentValue: `${context.weather}, ${context.visibility} visibility`,
      suggestedValue: 'Clear weather, good+ visibility',
      expectedBenefit: 'Better depth perception and landing spotting.',
      difficultyToImplement: 'easy',
    });
  }

  // --- Overall Scoring ---
  const rawScore = Math.max(rotationRisk, totalInversionRisk, totalLandingRisk, speedRisk, windDirectionRisk) * envMultiplier;
  const fatigueMultiplier = 1 + (context.fatigueLevel / 20);
  const overallRiskScore = Math.min(100, Math.round(rawScore * fatigueMultiplier));

  const dangerLevel: MoveAnalysisResponse['dangerLevel'] =
    overallRiskScore >= 80 ? 'extreme' :
    overallRiskScore >= 60 ? 'high' :
    overallRiskScore >= 35 ? 'moderate' : 'low';

  const landingConfidence = Math.max(0, Math.round(100 - totalLandingRisk * fatigueMultiplier));

  // --- Prerequisite & Progression Moves ---
  const prerequisiteMoves = getPrerequisiteMoves(move);
  const nextProgressionMoves = getNextProgressionMoves(move);

  return {
    overallRiskScore,
    dangerLevel,
    landingConfidence,
    physics,
    riskFactors,
    improvements,
    coachInsight: generateCoachInsight(move, rider, overallRiskScore, riskFactors),
    prerequisiteMoves,
    nextProgressionMoves,
    analysisConfidence: 0.85,
    source: 'rule',
    generatedAt: new Date().toISOString(),
  };
}

// --- Helpers ---

function getExpectedDifficultyForLevel(level: string): number {
  switch (level) {
    case 'beginner': return 15;
    case 'intermediate': return 35;
    case 'advanced': return 55;
    case 'expert': return 75;
    case 'pro': return 90;
    default: return 50;
  }
}

function getWindDirectionRisk(direction: string, weather: string): number {
  let base = 0;
  switch (direction) {
    case 'headwind': base = 15; break;
    case 'right-crosswind':
    case 'left-crosswind': base = 20; break;
    case 'tailwind': base = 5; break;
    default: base = 5;
  }
  if (weather === 'windy') base *= 1.5;
  return base;
}

function getEnvironmentMultiplier(weather: string, visibility: string): number {
  let mult = 1.0;
  switch (weather) {
    case 'windy': mult += 0.3; break;
    case 'snowing': mult += 0.25; break;
    case 'foggy': mult += 0.35; break;
    case 'cloudy': mult += 0.05; break;
  }
  switch (visibility) {
    case 'poor': mult += 0.3; break;
    case 'fair': mult += 0.15; break;
    case 'good': mult += 0.05; break;
  }
  return mult;
}

function interpretLandingCondition(snow: string): string {
  switch (snow) {
    case 'icy': return 'Icy landing surface will amplify impact.';
    case 'powder': return 'Powder will cushion impact significantly.';
    case 'slush': return 'Slush may cause drag or uneven absorption.';
    default: return '';
  }
}

function getPrerequisiteMoves(move: MoveAnalysisRequest['move']): string[] {
  const prereqs: string[] = [];

  if (move.rotationDegrees >= 1080) {
    prereqs.push(`${move.direction} 720`);
    prereqs.push(`${move.direction} 900`);
  } else if (move.rotationDegrees >= 720) {
    prereqs.push(`${move.direction} 540`);
    prereqs.push(`${move.direction} 360`);
  } else if (move.rotationDegrees >= 540) {
    prereqs.push(`${move.direction} 360`);
  }

  if (move.flipType === 'triple-cork') {
    prereqs.push('Double Cork');
    prereqs.push('Cork 720');
  } else if (move.flipType === 'double-cork') {
    prereqs.push('Cork 540');
    prereqs.push('Cork 360');
  } else if (move.flipType === 'cork' || move.flipType === 'rodeo') {
    prereqs.push(`${move.direction} 360`);
  } else if (move.flipType === 'backflip') {
    prereqs.push('Frontflip (optional but helpful)');
  }

  if (move.inversionDepth > 60) {
    prereqs.push('Basic inverted air awareness (trampoline)');
  }

  if (move.grabType && ['japan', 'method', 'seatbelt', 'truck_driver'].includes(move.grabType)) {
    prereqs.push('Basic Indy/Melon grab');
  }

  return prereqs.length > 0 ? prereqs : ['Straight air with stable landing'];
}

function getNextProgressionMoves(move: MoveAnalysisRequest['move']): string[] {
  const next: string[] = [];

  if (move.rotationDegrees < 1440) {
    next.push(`${move.direction} ${move.rotationDegrees + 180}`);
  }
  if (move.flipType === 'none' && move.inversionDepth < 30) {
    next.push(`${move.direction} Backflip`);
  } else if (move.flipType === 'backflip') {
    next.push('Rodeo 540');
  } else if (move.flipType === 'cork') {
    next.push('Double Cork');
  }

  return next;
}

function generateCoachInsight(
  move: MoveAnalysisRequest['move'],
  rider: MoveAnalysisRequest['rider'],
  riskScore: number,
  factors: RiskFactor[]
): string {
  if (riskScore < 20) {
    return `This ${move.name} is well within your ${rider.experienceLevel} ability range. Focus on style and grab cleanliness rather than survival.`;
  }

  const criticalFactors = factors.filter((f) => f.severity === 'critical');
  if (criticalFactors.length > 0) {
    const topIssue = criticalFactors[0];
    return `Critical attention needed: ${topIssue.title}. ${topIssue.recommendation} Do not attempt without spotter or airbag practice.`;
  }

  const warnings = factors.filter((f) => f.severity === 'warning');
  if (warnings.length > 0) {
    const mainWarning = warnings[0];
    return `${mainWarning.title} is your primary concern. ${mainWarning.recommendation} With focused practice, this move is achievable within 2-3 sessions.`;
  }

  return `${move.name} is a solid progression target. Maintain current training focus and ensure you're well-rested before attempting.`;
}
