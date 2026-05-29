import type { MoveAnalysisRequest, MoveAnalysisResponse, SessionTrendAnalysisRequest } from '@/types';

/**
 * Build a structured prompt for Gemini to analyze a snowboarding move.
 * The prompt asks for natural-language coaching insights while the
 * caller will merge Gemini's output with rule-based physics/risk numbers.
 */
export function buildMoveAnalysisPrompt(request: MoveAnalysisRequest): string {
  const { move, kicker, rider, context } = request;

  return `You are an expert snowboarding coach and biomechanics analyst. Analyze the following move configuration and provide coaching insights.

## Move Configuration
- Name: ${move.name}
- Rotation: ${move.rotationDegrees}° (${move.direction})
- Flip Type: ${move.flipType}
- Inversion Depth: ${move.inversionDepth}%
- Grab: ${move.grabType ?? 'None'}${move.grabType ? ` (held ${move.grabDurationPct}% of airtime)` : ''}

## Kicker / Environment
- Type: ${kicker.type}
- Takeoff Angle: ${kicker.takeoffAngle}°
- Landing Angle: ${kicker.landingAngle}°
- Vertical Drop: ${kicker.verticalDrop}m
- Snow Condition: ${kicker.snowCondition}

## Rider
- Experience: ${rider.experienceLevel} (${rider.yearsExperience} years)
- Height: ${rider.heightCm}cm, Weight: ${rider.weightKg}kg
- Stance: ${rider.stance}\n- Fatigue: ${context.fatigueLevel}/10
- Recent Injuries: ${rider.recentInjuries.join(', ') || 'None'}

## Context
- Attempt #${context.attemptNumber} today
- Weather: ${context.weather}, Visibility: ${context.visibility}
- Previous success rate on similar moves: ${Math.round(context.previousSuccessRate * 100)}%

## Your Task
Provide a concise coaching analysis (3-5 sentences) that:
1. Identifies the most important technique focus for landing this move
2. Gives one specific mental cue or body position tip
3. Mentions what to watch out for given the rider's fatigue/injury state
4. Suggests whether to attempt now or practice prerequisites first

Be direct, actionable, and encouraging but honest about risks. Do NOT list generic advice — tailor it to this specific configuration.`;
}

/**
 * Build a prompt for Gemini to generate a move name based on parameters.
 */
export function buildMoveNamingPrompt(request: MoveAnalysisRequest): string {
  const { move } = request;
  return `Generate a short, cool snowboarding trick name for a move with these parameters:
- ${move.direction}
- ${move.rotationDegrees}° rotation
- ${move.flipType !== 'none' ? move.flipType : 'no flip'}
- ${move.inversionDepth}% inversion
- ${move.grabType ?? 'no grab'}

Return ONLY the name, nothing else. Use snowboarder slang. Examples: "fs_trip_cork_1440", "back_7_melon", "rodeo_5_indy".`;
}

/**
 * Build a prompt for session trend analysis.
 */
export function buildSessionTrendPrompt(request: SessionTrendAnalysisRequest): string {
  const { rider, sessions } = request;

  const sessionSummaries = sessions.map((s) => {
    const moveList = s.movesAttempted
      .map((m) => `- ${m.moveName}: risk ${m.riskScore}, landed: ${m.landed ? 'yes' : 'no'}, injury: ${m.injuryOccurred ? m.injuryType : 'none'}, fatigue: ${m.fatigueLevel}/10`)
      .join('\n');
    return `Session ${s.date}:\n${moveList}`;
  }).join('\n\n');

  return `You are a sports performance analyst reviewing a snowboarder's practice history.

Rider: ${rider.experienceLevel} level, ${rider.yearsExperience} years experience.

## Session History
${sessionSummaries}

## Your Task
Analyze these sessions and provide:

1. **Pattern Insights** (2-4 bullet points): Look for correlations between fatigue, weather, move difficulty, and outcomes. Be specific — reference actual data points.

2. **Personalized Recommendations** (2-3 actionable suggestions): What should this rider focus on in their next 2 weeks of training?

3. **Overall Risk Trend**: Is their risk profile improving, stable, or worsening? One sentence.

Format as plain text. Be concise but evidence-based.`;
}

/**
 * Build a prompt that asks Gemini to structure its response as JSON.
 * Used when we want Gemini to return machine-readable output.
 */
export function buildStructuredMoveAnalysisPrompt(request: MoveAnalysisRequest): string {
  const basePrompt = buildMoveAnalysisPrompt(request);

  return `${basePrompt}

## Output Format
Respond ONLY with valid JSON in this exact structure (no markdown code blocks, no extra text):

{
  "coachInsight": "string: your 3-5 sentence tailored coaching analysis",
  "mentalCue": "string: one specific mental cue for this move",
  "bodyPositionTip": "string: one specific body position to focus on",
  "attemptRecommendation": "string: 'attempt-now', 'practice-prerequisites', or 'wait-for-better-conditions'",
  "prerequisitesToPractice": ["string array: 2-3 specific prerequisite moves or drills"],
  "confidenceLevel": "string: 'high', 'medium', or 'low' based on how well this configuration matches the rider's level"
}`;
}
