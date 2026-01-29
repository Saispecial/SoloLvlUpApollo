import type { ShiftContext, EICompetencies } from "@/lib/types"

export interface ShiftAnalysis {
  shiftType: ShiftContext["shiftType"]
  department: ShiftContext["department"]
  workloadIntensity: ShiftContext["workloadIntensity"]
  normalizedEIScore: number
  fatigueAdjustment: number
  recommendedModules: string[]
  contextNotes: string
}

/**
 * Analyzes shift patterns and normalizes EI scores based on context
 */
export function analyzeShiftContext(
  shiftContext: ShiftContext,
  currentEI: EICompetencies,
): ShiftAnalysis {
  // Base normalization factors by shift type
  const shiftNormalizationFactors: Record<ShiftContext["shiftType"], number> = {
    day: 1.0, // Baseline
    night: 0.85, // Night shifts typically show lower EI due to circadian disruption
    ICU: 0.75, // High-stress environment
    emergency: 0.7, // Highest stress
    other: 1.0,
  }

  // Workload intensity adjustments
  const workloadFactors: Record<ShiftContext["workloadIntensity"], number> = {
    low: 1.1, // Slightly higher EI when workload is manageable
    moderate: 1.0, // Baseline
    high: 0.9, // Slightly lower EI under high workload
    critical: 0.8, // Significantly lower EI during critical workload
  }

  // Department-specific adjustments
  const departmentFactors: Record<ShiftContext["department"], number> = {
    ICU: 0.8, // High emotional demands
    Pediatrics: 0.9, // Requires high empathy, can be emotionally draining
    ER: 0.75, // High stress, trauma exposure
    Oncology: 0.85, // Emotional intensity
    General: 1.0, // Baseline
    Other: 1.0,
  }

  // Calculate normalized EI score
  const baseEIScore =
    (currentEI["Self-Awareness"] +
      currentEI["Self-Management"] +
      currentEI["Social Awareness"] +
      currentEI["Relationship Management"]) /
    4

  const shiftFactor = shiftNormalizationFactors[shiftContext.shiftType]
  const workloadFactor = workloadFactors[shiftContext.workloadIntensity]
  const departmentFactor = departmentFactors[shiftContext.department]
  const criticalIncidentPenalty = shiftContext.criticalIncidentOccurred ? 0.9 : 1.0

  const normalizedEIScore =
    baseEIScore * shiftFactor * workloadFactor * departmentFactor * criticalIncidentPenalty

  // Fatigue adjustment (inverse of normalization - how much to adjust recommendations)
  const fatigueAdjustment = 1 / (shiftFactor * workloadFactor * departmentFactor * criticalIncidentPenalty)

  // Generate context-aware recommendations
  const recommendedModules = generateContextAwareModules(shiftContext, currentEI, fatigueAdjustment)

  // Generate context notes
  const contextNotes = generateContextNotes(shiftContext, normalizedEIScore, fatigueAdjustment)

  return {
    shiftType: shiftContext.shiftType,
    department: shiftContext.department,
    workloadIntensity: shiftContext.workloadIntensity,
    normalizedEIScore,
    fatigueAdjustment,
    recommendedModules,
    contextNotes,
  }
}

function generateContextAwareModules(
  shiftContext: ShiftContext,
  currentEI: EICompetencies,
  fatigueAdjustment: number,
): string[] {
  const modules: string[] = []

  // High fatigue = lighter modules
  if (fatigueAdjustment > 1.3) {
    modules.push("Quick 5-minute breathing exercise")
    modules.push("Gentle self-reflection")
  } else if (fatigueAdjustment > 1.1) {
    modules.push("Short stress management module")
    modules.push("Brief empathy practice")
  } else {
    modules.push("Full training module")
    modules.push("Comprehensive reflection")
  }

  // Department-specific modules
  if (shiftContext.department === "ICU") {
    modules.push("ICU-specific stress management")
    modules.push("Compassion fatigue prevention")
  } else if (shiftContext.department === "Pediatrics") {
    modules.push("Pediatric empathy scenarios")
    modules.push("Family communication skills")
  } else if (shiftContext.department === "ER") {
    modules.push("Trauma response training")
    modules.push("Crisis communication")
  }

  // Critical incident modules
  if (shiftContext.criticalIncidentOccurred) {
    modules.push("Post-critical incident reflection")
    modules.push("Trauma processing support")
  }

  return modules
}

function generateContextNotes(
  shiftContext: ShiftContext,
  normalizedEIScore: number,
  fatigueAdjustment: number,
): string {
  const notes: string[] = []

  if (shiftContext.shiftType === "night") {
    notes.push("Night shifts can naturally lower emotional awareness due to circadian rhythms.")
  }

  if (shiftContext.workloadIntensity === "critical") {
    notes.push("High workload intensity may temporarily impact EI scores. This is normal and expected.")
  }

  if (shiftContext.criticalIncidentOccurred) {
    notes.push(
      "A critical incident occurred during this shift. Your EI scores may be temporarily affected. Please take time to process."
    )
  }

  if (fatigueAdjustment > 1.2) {
    notes.push(
      "You're experiencing higher fatigue levels. Consider lighter training modules and prioritize rest."
    )
  }

  if (normalizedEIScore < 30) {
    notes.push(
      "Your normalized EI score is lower than usual. This may be due to shift context. Consider support resources."
    )
  }

  return notes.join(" ")
}

/**
 * Normalizes EI competencies based on shift context
 */
export function normalizeEIByContext(
  competencies: EICompetencies,
  shiftContext: ShiftContext,
): EICompetencies {
  const analysis = analyzeShiftContext(shiftContext, competencies)
  const adjustmentFactor = analysis.fatigueAdjustment

  // Don't actually modify the competencies, but return context-aware interpretation
  // In practice, you'd store both raw and normalized scores
  return {
    "Self-Awareness": competencies["Self-Awareness"] * (1 / adjustmentFactor),
    "Self-Management": competencies["Self-Management"] * (1 / adjustmentFactor),
    "Social Awareness": competencies["Social Awareness"] * (1 / adjustmentFactor),
    "Relationship Management": competencies["Relationship Management"] * (1 / adjustmentFactor),
    "Clinical Competence": competencies["Clinical Competence"],
    Resilience: competencies.Resilience * (1 / adjustmentFactor),
  }
}
