/**
 * Integration Test Utilities
 * Tests complete flows through the agent architecture
 */

import { parentAgent } from "@/lib/agents/parentAgent"
import { programPlanner } from "@/lib/services/programPlanner"
import type { EIAssessment } from "@/lib/types"

/**
 * Test assessment → program → roadmap flow
 */
export async function testAssessmentToProgramFlow() {
  console.log("=== Testing Assessment → Program → Roadmap Flow ===")
  
  // Mock assessment data
  const mockAssessment: EIAssessment = {
    tool: "WLEIS",
    baselineScore: 45,
    domainScores: {
      selfAwareness: 50,
      selfManagement: 35,
      socialAwareness: 48,
      relationshipManagement: 42,
    },
    strengths: ["selfAwareness", "socialAwareness"],
    gaps: ["selfManagement", "relationshipManagement"],
    assessmentDate: new Date(),
    completedAt: new Date(),
  }
  
  const mockNurseProfile = {
    name: "Test Nurse",
    competencyLevel: 1,
    professionalRank: "Developing" as const,
    eiDevelopmentPoints: 0,
    totalEIPoints: 0,
    competencies: {
      "Self-Awareness": 10,
      "Self-Management": 10,
      "Social Awareness": 10,
      "Relationship Management": 10,
      "Clinical Competence": 10,
      "Resilience": 10,
    },
    nextLevelPoints: 100,
    learningStreak: 0,
    skillPoints: 0,
    customAttributes: {},
    theme: "ocean-breeze" as const,
    role: "Nurse" as const,
  }
  
  try {
    // Test program selection
    console.log("1. Testing program selection...")
    const programRecommendation = programPlanner.selectProgram(mockAssessment)
    console.log("✓ Program selected:", programRecommendation.program.name)
    console.log("  Duration:", programRecommendation.program.duration, "weeks")
    console.log("  Rationale:", programRecommendation.rationale)
    
    // Test parent agent orchestration
    console.log("\n2. Testing parent agent orchestration...")
    const response = await parentAgent.orchestrate({
      type: 'assessment-to-program',
      assessment: mockAssessment,
      nurseProfile: mockNurseProfile,
    })
    
    if (!response.success) {
      throw new Error(`Orchestration failed: ${response.error}`)
    }
    
    console.log("✓ Orchestration successful")
    console.log("  Modules generated:", response.modules.length)
    console.log("  Focus areas:", response.roadmap.focusAreas.join(", "))
    console.log("  Fallback used:", response.fallbackUsed)
    
    // Validate modules
    console.log("\n3. Validating generated modules...")
    const invalidModules = response.modules.filter(m => 
      !m.id || !m.title || !m.eiPoints || !m.eiDomain
    )
    
    if (invalidModules.length > 0) {
      throw new Error(`Found ${invalidModules.length} invalid modules`)
    }
    
    console.log("✓ All modules valid")
    
    // Check program context
    const modulesWithProgram = response.modules.filter(m => m.programId)
    console.log("  Modules with program context:", modulesWithProgram.length)
    
    return {
      success: true,
      programRecommendation,
      response,
    }
  } catch (error) {
    console.error("✗ Test failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Test reflection → quest flow
 */
export async function testReflectionToQuestFlow() {
  console.log("\n=== Testing Reflection → Quest Flow ===")
  
  const mockReflection = {
    mood: "Stressed but hopeful",
    emotionalState: "Feeling overwhelmed by patient load but motivated to improve",
    motivationLevel: "6",
    challengesFaced: "Difficult patient interactions, time management",
    lessonsLearned: "Need to work on staying calm under pressure",
    goalsForTomorrow: "Practice deep breathing before stressful situations",
  }
  
  const mockNurseProfile = {
    name: "Test Nurse",
    competencyLevel: 2,
    professionalRank: "Developing" as const,
    eiDevelopmentPoints: 150,
    totalEIPoints: 150,
    competencies: {
      "Self-Awareness": 12,
      "Self-Management": 11,
      "Social Awareness": 13,
      "Relationship Management": 12,
      "Clinical Competence": 11,
      "Resilience": 10,
    },
    nextLevelPoints: 200,
    learningStreak: 3,
    skillPoints: 1,
    customAttributes: {},
    theme: "ocean-breeze" as const,
    role: "Nurse" as const,
  }
  
  try {
    console.log("1. Testing quest generation from reflection...")
    const response = await parentAgent.orchestrate({
      type: 'reflection-to-quest',
      reflection: mockReflection,
      nurseProfile: mockNurseProfile,
      diaryEntries: [],
    })
    
    if (!response.success) {
      throw new Error(`Quest generation failed: ${response.error}`)
    }
    
    console.log("✓ Quest generation successful")
    console.log("  Quests generated:", response.quests.length)
    console.log("  Focus area:", response.suggestions.focusArea)
    console.log("  Fallback used:", response.fallbackUsed)
    
    // Validate quests
    console.log("\n2. Validating generated quests...")
    const invalidQuests = response.quests.filter(q => 
      !q.id || !q.title || !q.eiPoints || !q.eiDomain
    )
    
    if (invalidQuests.length > 0) {
      throw new Error(`Found ${invalidQuests.length} invalid quests`)
    }
    
    console.log("✓ All quests valid")
    
    // Check competency boosts
    const questsWithBoosts = response.quests.filter(q => 
      q.competencyBoosts && Object.keys(q.competencyBoosts).length > 0
    )
    console.log("  Quests with competency boosts:", questsWithBoosts.length)
    
    return {
      success: true,
      response,
    }
  } catch (error) {
    console.error("✗ Test failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Run all integration tests
 */
export async function runAllIntegrationTests() {
  console.log("╔════════════════════════════════════════════════╗")
  console.log("║   Six-File Integration - Integration Tests    ║")
  console.log("╚════════════════════════════════════════════════╝\n")
  
  const results = {
    assessmentFlow: await testAssessmentToProgramFlow(),
    reflectionFlow: await testReflectionToQuestFlow(),
  }
  
  console.log("\n╔════════════════════════════════════════════════╗")
  console.log("║              Test Results Summary              ║")
  console.log("╚════════════════════════════════════════════════╝")
  console.log("Assessment → Program → Roadmap:", results.assessmentFlow.success ? "✓ PASS" : "✗ FAIL")
  console.log("Reflection → Quest Generation:", results.reflectionFlow.success ? "✓ PASS" : "✗ FAIL")
  
  const allPassed = results.assessmentFlow.success && results.reflectionFlow.success
  console.log("\nOverall:", allPassed ? "✓ ALL TESTS PASSED" : "✗ SOME TESTS FAILED")
  
  return {
    success: allPassed,
    results,
  }
}
