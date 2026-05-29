import { GoogleGenAI } from '@google/genai';
import type { MoveAnalysisRequest, MoveAnalysisResponse, SessionTrendAnalysisRequest, SessionTrendAnalysisResponse } from '@/types';
import { analyzeMove as ruleBasedAnalyzeMove } from './riskEngine';
import { buildMoveAnalysisPrompt, buildSessionTrendPrompt, buildStructuredMoveAnalysisPrompt } from './promptBuilder';
import { getCachedAnalysis, setCachedAnalysis } from './storage';
import { hashRequest } from './hash';

const API_KEY = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || '';

let genAI: GoogleGenAI | null = null;

try {
  if (API_KEY) {
    genAI = new GoogleGenAI({ apiKey: API_KEY });
  }
} catch {
  genAI = null;
}

function getModel() {
  return genAI?.models || null;
}

export function isAIAvailable(): boolean {
  return !!API_KEY && !!genAI;
}

// ============================================
// Move Analysis with Hybrid Rule + AI
// ============================================

interface AIMoveAnalysisExtras {
  coachInsight: string;
  mentalCue?: string;
  bodyPositionTip?: string;
  attemptRecommendation?: string;
  prerequisitesToPractice?: string[];
  confidenceLevel?: string;
}

export async function analyzeMoveWithAI(
  request: MoveAnalysisRequest
): Promise<MoveAnalysisResponse> {
  const requestHash = hashRequest(request);

  // Check cache first
  const cached = getCachedAnalysis(requestHash);
  if (cached) {
    return { ...cached.response, source: 'hybrid' };
  }

  // Always compute rule-based baseline first (instant, works offline)
  const ruleResult = ruleBasedAnalyzeMove(request);

  // If AI unavailable, return rule-based result
  if (!isAIAvailable()) {
    return ruleResult;
  }

  try {
    const model = getModel();
    if (!model) throw new Error('Model not available');

    const prompt = buildStructuredMoveAnalysisPrompt(request);

    const response = await model.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.4,
        maxOutputTokens: 800,
      },
    });

    const text = response.text || '';
    const extras = parseStructuredResponse(text);

    // Merge AI language layer with rule-based physics/scoring
    const merged: MoveAnalysisResponse = {
      ...ruleResult,
      coachInsight: extras.coachInsight || ruleResult.coachInsight,
      source: 'hybrid',
      generatedAt: new Date().toISOString(),
    };

    // Cache the result
    setCachedAnalysis(requestHash, {
      response: merged,
      cachedAt: new Date().toISOString(),
    });

    return merged;
  } catch (err) {
    console.warn('AI analysis failed, falling back to rule-based:', err);
    return ruleResult;
  }
}

/**
 * Non-cached, real-time analysis for when the user is actively tweaking sliders.
 * Skips cache and AI to be instant.
 */
export function analyzeMoveFast(request: MoveAnalysisRequest): MoveAnalysisResponse {
  return ruleBasedAnalyzeMove(request);
}

// ============================================
// Session Trend Analysis (AI only)
// ============================================

export async function analyzeSessionTrends(
  request: SessionTrendAnalysisRequest
): Promise<SessionTrendAnalysisResponse> {
  if (!isAIAvailable()) {
    return generateFallbackTrendAnalysis(request);
  }

  try {
    const model = getModel();
    if (!model) throw new Error('Model not available');

    const prompt = buildSessionTrendPrompt(request);

    const response = await model.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.5,
        maxOutputTokens: 1200,
      },
    });

    const text = response.text || '';
    return parseTrendAnalysisResponse(text);
  } catch (err) {
    console.warn('AI trend analysis failed, using fallback:', err);
    return generateFallbackTrendAnalysis(request);
  }
}

// ============================================
// Response Parsing
// ============================================

function parseStructuredResponse(text: string): AIMoveAnalysisExtras {
  try {
    // Try to extract JSON from the response (it might be wrapped in markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { coachInsight: text };

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      coachInsight: parsed.coachInsight || text,
      mentalCue: parsed.mentalCue,
      bodyPositionTip: parsed.bodyPositionTip,
      attemptRecommendation: parsed.attemptRecommendation,
      prerequisitesToPractice: parsed.prerequisitesToPractice,
      confidenceLevel: parsed.confidenceLevel,
    };
  } catch {
    // If JSON parsing fails, use the raw text as coach insight
    return { coachInsight: text };
  }
}

function parseTrendAnalysisResponse(text: string): SessionTrendAnalysisResponse {
  const insights: SessionTrendAnalysisResponse['patternInsights'] = [];
  const recommendations: string[] = [];
  let riskTrend: SessionTrendAnalysisResponse['riskTrend'] = 'stable';

  // Simple heuristic parsing
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('improving')) riskTrend = 'improving';
    if (lower.includes('worsening')) riskTrend = 'worsening';

    if (line.startsWith('-') || line.startsWith('•') || /^\d+\./.test(line)) {
      if (lower.includes('recommend') || lower.includes('focus') || lower.includes('suggest')) {
        recommendations.push(line.replace(/^[-•\d.\s]+/, '').trim());
      } else {
        insights.push({
          pattern: line.replace(/^[-•\d.\s]+/, '').trim(),
          evidence: 'From session data analysis',
          severity: lower.includes('injury') || lower.includes('danger') ? 'alert' : 'insight',
        });
      }
    }
  }

  return {
    patternInsights: insights.slice(0, 4),
    personalizedRecommendations: recommendations.slice(0, 3),
    riskTrend,
    dangerFactorsOverTime: [],
  };
}

function generateFallbackTrendAnalysis(
  request: SessionTrendAnalysisRequest
): SessionTrendAnalysisResponse {
  const sessions = request.sessions;
  const totalAttempts = sessions.reduce((sum, s) => sum + s.movesAttempted.length, 0);
  const totalLandings = sessions.reduce(
    (sum, s) => sum + s.movesAttempted.filter((m) => m.landed).length,
    0
  );
  const totalInjuries = sessions.reduce(
    (sum, s) => sum + s.movesAttempted.filter((m) => m.injuryOccurred).length,
    0
  );

  const landingRate = totalAttempts > 0 ? totalLandings / totalAttempts : 0;
  const injuryRate = totalAttempts > 0 ? totalInjuries / totalAttempts : 0;

  const insights: SessionTrendAnalysisResponse['patternInsights'] = [];

  if (injuryRate > 0.1) {
    insights.push({
      pattern: `Injury rate of ${Math.round(injuryRate * 100)}% is above safe threshold.`,
      evidence: `${totalInjuries} injuries in ${totalAttempts} attempts.`,
      severity: 'alert',
    });
  }

  if (landingRate < 0.5) {
    insights.push({
      pattern: 'Landing success rate below 50% — consider stepping back difficulty.',
      evidence: `${Math.round(landingRate * 100)}% landing rate across all sessions.`,
      severity: 'warning',
    });
  } else if (landingRate > 0.8) {
    insights.push({
      pattern: 'Strong landing consistency — ready to progress difficulty.',
      evidence: `${Math.round(landingRate * 100)}% landing rate.`,
      severity: 'insight',
    });
  }

  const avgFatigue = sessions.reduce((sum, s) => {
    const fatigueSum = s.movesAttempted.reduce((fs, m) => fs + m.fatigueLevel, 0);
    return sum + (fatigueSum / Math.max(1, s.movesAttempted.length));
  }, 0) / Math.max(1, sessions.length);

  if (avgFatigue > 6) {
    insights.push({
      pattern: 'Sessions consistently attempted at high fatigue levels.',
      evidence: `Average fatigue: ${avgFatigue.toFixed(1)}/10.`,
      severity: 'warning',
    });
  }

  const recommendations: string[] = [];
  if (injuryRate > 0.05) {
    recommendations.push('Reduce session intensity and focus on perfecting lower-risk moves before progressing.');
  }
  if (avgFatigue > 5) {
    recommendations.push('Schedule longer rest periods between attempts, or split training across more days.');
  }
  if (landingRate > 0.7 && injuryRate < 0.05) {
    recommendations.push('Your fundamentals are solid — try incrementing rotation by 180° on your most consistent move.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Maintain current training volume and focus on grab/style refinement.');
  }

  return {
    patternInsights: insights,
    personalizedRecommendations: recommendations,
    riskTrend: injuryRate > 0.08 ? 'worsening' : injuryRate < 0.02 ? 'improving' : 'stable',
    dangerFactorsOverTime: [],
  };
}
