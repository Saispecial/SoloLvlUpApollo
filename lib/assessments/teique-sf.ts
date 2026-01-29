import type { EIAssessment } from "@/lib/types"
import { TEIQUE_QUESTIONS } from "./teique-sf-questions"

/**
 * Scores TEIQue-SF assessment
 * Note: This is a simplified implementation. Full implementation would include all 30 items
 * and proper domain scoring based on TEIQue-SF methodology
 */
export function scoreTEIQueSF(answers: Record<number, number>): EIAssessment {
  // Group answers by domain
  // Note: answers use 0-based index (question position in array), not question ID
  const domainScoresMap: Record<string, number[]> = {
    selfAwareness: [],
    selfManagement: [],
    socialAwareness: [],
    relationshipManagement: [],
  }

  // Process each answer
  Object.entries(answers).forEach(([questionIndexStr, answerValue]) => {
    const questionIndex = Number.parseInt(questionIndexStr)
    const question = TEIQUE_QUESTIONS[questionIndex]
    
    if (!question) return

    // Handle reverse-scored items: invert the score (1->5, 2->4, 3->3, 4->2, 5->1)
    let adjustedScore = answerValue
    if (question.reverse) {
      adjustedScore = 6 - answerValue // Reverse: 1->5, 2->4, 3->3, 4->2, 5->1
    }

    // Add to the appropriate domain
    domainScoresMap[question.domain].push(adjustedScore)
  })

  // Calculate domain scores: average * 20 to get 0-100 scale
  const selfAwareness = domainScoresMap.selfAwareness.length > 0
    ? (domainScoresMap.selfAwareness.reduce((a, b) => a + b, 0) / domainScoresMap.selfAwareness.length) * 20
    : 50

  const selfManagement = domainScoresMap.selfManagement.length > 0
    ? (domainScoresMap.selfManagement.reduce((a, b) => a + b, 0) / domainScoresMap.selfManagement.length) * 20
    : 50

  const socialAwareness = domainScoresMap.socialAwareness.length > 0
    ? (domainScoresMap.socialAwareness.reduce((a, b) => a + b, 0) / domainScoresMap.socialAwareness.length) * 20
    : 50

  const relationshipManagement = domainScoresMap.relationshipManagement.length > 0
    ? (domainScoresMap.relationshipManagement.reduce((a, b) => a + b, 0) / domainScoresMap.relationshipManagement.length) * 20
    : 50

  const baselineScore = (selfAwareness + selfManagement + socialAwareness + relationshipManagement) / 4

  // Identify strengths and gaps based on actual scores
  const domainScores = { selfAwareness, selfManagement, socialAwareness, relationshipManagement }
  const sortedDomains = Object.entries(domainScores).sort((a, b) => b[1] - a[1])
  const strengths = sortedDomains.slice(0, 2).map(([domain]) => domain)
  const gaps = sortedDomains.slice(-2).map(([domain]) => domain)

  return {
    id: Math.random().toString(36).substr(2, 9),
    tool: "TEIQue-SF",
    baselineScore,
    domainScores: {
      selfAwareness,
      selfManagement,
      socialAwareness,
      relationshipManagement,
    },
    strengths,
    gaps,
    assessmentDate: new Date(),
    completedAt: new Date(),
  }
}
