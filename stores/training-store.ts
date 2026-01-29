"use client"

import { create } from "zustand"
import { persist, createJSONStorage, StateStorage } from "zustand/middleware"

// Safe localStorage wrapper that handles SSR
const safeLocalStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === "undefined") return null
    try {
      return localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(name, value)
    } catch {
      // Silently fail
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === "undefined") return
    try {
      localStorage.removeItem(name)
    } catch {
      // Silently fail
    }
  },
}

// Training Task Type
export interface TrainingTask {
  id: string
  week: number
  day: number
  theme: string
  eiStat: string
  focus: string
  tool: string
  coreFlow: string[]
  video?: {
    url: string
    intent: string
  }
  toolRoute: string
}

// Completion record
export interface TrainingCompletion {
  taskId: string
  completedAt: string
  toolUsed: boolean
  reflectionText?: string
  emotionBefore?: number
  emotionAfter?: number
}

// Training progress state
interface TrainingState {
  // Course start date (when user starts the program)
  courseStartDate: string | null
  
  // Completed tasks
  completedTasks: TrainingCompletion[]
  
  // Current week/day based on course start
  getCurrentWeekDay: () => { week: number; day: number }
  
  // Check if a task is unlocked
  isTaskUnlocked: (week: number, day: number) => boolean
  
  // Check if a task is completed
  isTaskCompleted: (taskId: string) => boolean
  
  // Start course
  startCourse: () => void
  
  // Complete a task
  completeTask: (completion: Omit<TrainingCompletion, "completedAt">) => void
  
  // Get completion for a task
  getTaskCompletion: (taskId: string) => TrainingCompletion | undefined
}

console.log("[v0] Initializing training-store...")

// Week 1 Training Data (from JSON)
export const TRAINING_TASKS: TrainingTask[] = [
  // Day 1 - Awareness & Grounding
  {
    id: "w1-d1-sa",
    week: 1,
    day: 1,
    theme: "Awareness & Grounding",
    eiStat: "Self-Awareness",
    focus: "Identify personal triggers",
    tool: "Assumptions Lab",
    coreFlow: [
      "Recall recent emotional reaction",
      "Counter-frame assumption",
      "Reflect on trigger reality"
    ],
    toolRoute: "/ai-tools/assumptions-lab"
  },
  {
    id: "w1-d1-sm",
    week: 1,
    day: 1,
    theme: "Awareness & Grounding",
    eiStat: "Self-Management",
    focus: "Stress reduction",
    tool: "Breathing Tool",
    video: {
      url: "https://cdn.app/videos/guided-breathing-intro.mp4",
      intent: "Introduce physiological grounding through breath"
    },
    coreFlow: [
      "Emotion check",
      "Guided breathing",
      "Reflect on emotional shift"
    ],
    toolRoute: "/ai-tools/breathing-exercise"
  },
  {
    id: "w1-d1-soa",
    week: 1,
    day: 1,
    theme: "Awareness & Grounding",
    eiStat: "Social Awareness",
    focus: "Empathy in patient interaction",
    tool: "Change Companion",
    coreFlow: [
      "Identify emotional disconnection",
      "Reappraisal",
      "Reflect on future approach"
    ],
    toolRoute: "/ai-tools/change-companion"
  },
  {
    id: "w1-d1-rm",
    week: 1,
    day: 1,
    theme: "Awareness & Grounding",
    eiStat: "Relationship Management",
    focus: "Active listening",
    tool: "Change Companion",
    coreFlow: [
      "Interaction scenario",
      "Perspective shift",
      "Reflect"
    ],
    toolRoute: "/ai-tools/change-companion"
  },
  {
    id: "w1-d1-cc",
    week: 1,
    day: 1,
    theme: "Awareness & Grounding",
    eiStat: "Clinical Competence",
    focus: "Clear communication under pressure",
    tool: "Control & Influence Map",
    video: {
      url: "https://cdn.app/videos/communication-under-pressure.mp4",
      intent: "Frame how emotional clarity supports safe clinical communication"
    },
    coreFlow: [
      "Identify pressure moment",
      "Map control vs influence",
      "Choose one stabilizing communication action"
    ],
    toolRoute: "/ai-tools/control-influence-map"
  },
  {
    id: "w1-d1-res",
    week: 1,
    day: 1,
    theme: "Awareness & Grounding",
    eiStat: "Resilience",
    focus: "Reflect on setbacks calmly",
    tool: "Reframe",
    coreFlow: [
      "Normalize setback",
      "Reframe experience",
      "Reflect"
    ],
    toolRoute: "/ai-tools/reframe"
  },
  
  // Day 2 - Patterns & Control
  {
    id: "w1-d2-sa",
    week: 1,
    day: 2,
    theme: "Patterns & Control",
    eiStat: "Self-Awareness",
    focus: "Analyze emotional patterns",
    tool: "Assumptions Lab",
    coreFlow: [
      "Identify recurring emotional pattern",
      "Counter-frame belief",
      "Reflect"
    ],
    toolRoute: "/ai-tools/assumptions-lab"
  },
  {
    id: "w1-d2-sm",
    week: 1,
    day: 2,
    theme: "Patterns & Control",
    eiStat: "Self-Management",
    focus: "Time management",
    tool: "Control & Influence Map",
    video: {
      url: "https://cdn.app/videos/time-management-under-pressure.mp4",
      intent: "Introduce prioritization and time control under cognitive load"
    },
    coreFlow: [
      "Identify time burden",
      "Map controllables",
      "Set one small action"
    ],
    toolRoute: "/ai-tools/control-influence-map"
  },
  {
    id: "w1-d2-soa",
    week: 1,
    day: 2,
    theme: "Patterns & Control",
    eiStat: "Social Awareness",
    focus: "Recognize team dynamics",
    tool: "Change Companion",
    coreFlow: [
      "Team dynamic issue",
      "Perspective shift",
      "Reflect"
    ],
    toolRoute: "/ai-tools/change-companion"
  },
  {
    id: "w1-d2-rm",
    week: 1,
    day: 2,
    theme: "Patterns & Control",
    eiStat: "Relationship Management",
    focus: "Constructive feedback",
    tool: "Change Companion",
    coreFlow: [
      "Feedback scenario",
      "Facts vs interpretations",
      "Model response"
    ],
    toolRoute: "/ai-tools/change-companion"
  },
  {
    id: "w1-d2-cc",
    week: 1,
    day: 2,
    theme: "Patterns & Control",
    eiStat: "Clinical Competence",
    focus: "Handle patient emotions",
    tool: "Control & Influence Map",
    video: {
      url: "https://cdn.app/videos/emotional-boundaries-patient-care.mp4",
      intent: "Explain emotional boundaries while maintaining empathy"
    },
    coreFlow: [
      "Patient interaction",
      "Map influence",
      "Reflect"
    ],
    toolRoute: "/ai-tools/control-influence-map"
  },
  {
    id: "w1-d2-res",
    week: 1,
    day: 2,
    theme: "Patterns & Control",
    eiStat: "Resilience",
    focus: "Bounce back from errors",
    tool: "Reframe",
    coreFlow: [
      "Reframe mistake",
      "Reflect"
    ],
    toolRoute: "/ai-tools/reframe"
  },
  
  // Day 3 - Decisions & Culture
  {
    id: "w1-d3-sa",
    week: 1,
    day: 3,
    theme: "Decisions & Culture",
    eiStat: "Self-Awareness",
    focus: "Values-based decision-making",
    tool: "Assumptions Lab",
    video: {
      url: "https://cdn.app/videos/values-based-decisions.mp4",
      intent: "Introduce how emotions signal value conflicts during decisions"
    },
    coreFlow: [
      "Recall a recent tough decision",
      "Identify the belief driving your choice",
      "Check alignment with personal and professional values",
      "Reflect on decision clarity"
    ],
    toolRoute: "/ai-tools/assumptions-lab"
  },
  {
    id: "w1-d3-sm",
    week: 1,
    day: 3,
    theme: "Decisions & Culture",
    eiStat: "Self-Management",
    focus: "Emotional regulation during decisions",
    tool: "Reframe",
    video: {
      url: "https://cdn.app/videos/emotional-regulation-decisions.mp4",
      intent: "Explain how unmanaged emotions distort decision quality"
    },
    coreFlow: [
      "Identify emotional reaction linked to a decision",
      "Apply Reframe to soften emotional intensity",
      "Reflect on how regulation improves judgment"
    ],
    toolRoute: "/ai-tools/reframe"
  },
  {
    id: "w1-d3-soa",
    week: 1,
    day: 3,
    theme: "Decisions & Culture",
    eiStat: "Social Awareness",
    focus: "Cultural sensitivity in workplace decisions",
    tool: "Change Companion",
    video: {
      url: "https://cdn.app/videos/cultural-sensitivity-healthcare.mp4",
      intent: "Highlight how culture influences interpretation and response"
    },
    coreFlow: [
      "Recall a cultural misunderstanding at work",
      "Separate intent from interpretation",
      "Reappraise the situation using Change Companion",
      "Reflect on cultural awareness gained"
    ],
    toolRoute: "/ai-tools/change-companion"
  },
  {
    id: "w1-d3-rm",
    week: 1,
    day: 3,
    theme: "Decisions & Culture",
    eiStat: "Relationship Management",
    focus: "Handling value conflicts respectfully",
    tool: "Change Companion",
    coreFlow: [
      "Recall a disagreement based on differing values",
      "Identify emotional escalation points",
      "Choose a response that preserves respect and trust",
      "Reflect on relationship impact"
    ],
    toolRoute: "/ai-tools/change-companion"
  },
  {
    id: "w1-d3-cc",
    week: 1,
    day: 3,
    theme: "Decisions & Culture",
    eiStat: "Clinical Competence",
    focus: "Clinical decisions under uncertainty",
    tool: "Control & Influence Map",
    video: {
      url: "https://cdn.app/videos/clinical-decisions-uncertainty.mp4",
      intent: "Frame safe decision-making when certainty is not possible"
    },
    coreFlow: [
      "Recall a clinically uncertain situation",
      "Map what you can control and influence",
      "Choose one safe, ethical action",
      "Reflect on decision confidence"
    ],
    toolRoute: "/ai-tools/control-influence-map"
  },
  {
    id: "w1-d3-res",
    week: 1,
    day: 3,
    theme: "Decisions & Culture",
    eiStat: "Resilience",
    focus: "Recovering after difficult decisions",
    tool: "Reframe",
    coreFlow: [
      "Recall emotional weight after a hard decision",
      "Normalize doubt and second-guessing",
      "Reframe the experience as learning",
      "Reflect on emotional recovery"
    ],
    toolRoute: "/ai-tools/reframe"
  },
  
  // Day 4 - Strengths & Fatigue
  {
    id: "w1-d4-sa",
    week: 1,
    day: 4,
    theme: "Strengths & Fatigue",
    eiStat: "Self-Awareness",
    focus: "Recognize personal strengths and limits",
    tool: "Assumptions Lab",
    video: {
      url: "https://cdn.app/videos/strengths-vs-fatigue-awareness.mp4",
      intent: "Help nurses distinguish between personal limits and negative self-judgment"
    },
    coreFlow: [
      "Recall a high-energy or low-energy moment at work",
      "Identify the belief formed about your capability",
      "Counter-frame the belief using Assumptions Lab",
      "Reflect on realistic strengths and limits"
    ],
    toolRoute: "/ai-tools/assumptions-lab"
  },
  {
    id: "w1-d4-sm",
    week: 1,
    day: 4,
    theme: "Strengths & Fatigue",
    eiStat: "Self-Management",
    focus: "Respond calmly to emotional triggers",
    tool: "Reframe",
    coreFlow: [
      "Identify a trigger amplified by fatigue",
      "Notice automatic emotional response",
      "Apply Reframe to reduce emotional intensity",
      "Reflect on calmer response options"
    ],
    toolRoute: "/ai-tools/reframe"
  },
  {
    id: "w1-d4-soa",
    week: 1,
    day: 4,
    theme: "Strengths & Fatigue",
    eiStat: "Social Awareness",
    focus: "Decode social cues under tiredness",
    tool: "Change Companion",
    coreFlow: [
      "Recall a confusing interaction during fatigue",
      "Identify assumptions made about others",
      "Reappraise social cues using Change Companion",
      "Reflect on improved interpretation"
    ],
    toolRoute: "/ai-tools/change-companion"
  },
  {
    id: "w1-d4-rm",
    week: 1,
    day: 4,
    theme: "Strengths & Fatigue",
    eiStat: "Relationship Management",
    focus: "Build trust despite low energy",
    tool: "Change Companion",
    coreFlow: [
      "Recall a moment when fatigue strained trust",
      "Identify emotional withdrawal or irritation",
      "Reframe intent versus impact",
      "Choose a trust-preserving response"
    ],
    toolRoute: "/ai-tools/change-companion"
  },
  {
    id: "w1-d4-cc",
    week: 1,
    day: 4,
    theme: "Strengths & Fatigue",
    eiStat: "Clinical Competence",
    focus: "Maintain patient empathy while fatigued",
    tool: "Change Companion",
    video: {
      url: "https://cdn.app/videos/empathy-without-burnout.mp4",
      intent: "Explain how to sustain empathy without emotional overextension"
    },
    coreFlow: [
      "Recall a patient interaction during fatigue",
      "Notice emotional distancing or overload",
      "Reappraise empathy as presence, not exhaustion",
      "Reflect on balanced patient connection"
    ],
    toolRoute: "/ai-tools/change-companion"
  },
  {
    id: "w1-d4-res",
    week: 1,
    day: 4,
    theme: "Strengths & Fatigue",
    eiStat: "Resilience",
    focus: "Manage physical and mental fatigue",
    tool: "Breathing Tool",
    video: {
      url: "https://cdn.app/videos/fatigue-reset-breathing.mp4",
      intent: "Guide nervous system recovery during fatigue"
    },
    coreFlow: [
      "Notice body fatigue signals",
      "Practice guided breathing",
      "Reconnect with body awareness",
      "Reflect on recovery state"
    ],
    toolRoute: "/ai-tools/breathing-exercise"
  },
  
  // Day 5 - Stress & Judgment
  {
    id: "w1-d5-sa",
    week: 1,
    day: 5,
    theme: "Stress & Judgment",
    eiStat: "Self-Awareness",
    focus: "Mindful self-talk",
    tool: "Reframe",
    coreFlow: [
      "Capture stress-driven self-talk",
      "Apply Reframe to soften inner narrative",
      "Reflect on emotional shift"
    ],
    toolRoute: "/ai-tools/reframe"
  },
  {
    id: "w1-d5-sm",
    week: 1,
    day: 5,
    theme: "Stress & Judgment",
    eiStat: "Self-Management",
    focus: "Plan calmly",
    tool: "Control & Influence Map",
    video: {
      url: "https://cdn.app/videos/calm-planning-under-pressure.mp4",
      intent: "Introduce structured planning to reduce stress-driven reactivity"
    },
    coreFlow: [
      "Identify upcoming stressor",
      "Map what can be controlled and influenced",
      "Plan a calm, actionable response"
    ],
    toolRoute: "/ai-tools/control-influence-map"
  },
  {
    id: "w1-d5-soa",
    week: 1,
    day: 5,
    theme: "Stress & Judgment",
    eiStat: "Social Awareness",
    focus: "Respond to social conflict",
    tool: "Change Companion",
    coreFlow: [
      "Recall a tense social interaction",
      "Separate facts from assumptions",
      "Reappraise the interaction",
      "Reflect on improved response"
    ],
    toolRoute: "/ai-tools/change-companion"
  },
  {
    id: "w1-d5-rm",
    week: 1,
    day: 5,
    theme: "Stress & Judgment",
    eiStat: "Relationship Management",
    focus: "Strengthen team bonds",
    tool: "Change Companion",
    coreFlow: [
      "Recall a positive team interaction",
      "Identify behaviors that built trust",
      "Reflect on how to repeat those behaviors"
    ],
    toolRoute: "/ai-tools/change-companion"
  },
  {
    id: "w1-d5-cc",
    week: 1,
    day: 5,
    theme: "Stress & Judgment",
    eiStat: "Clinical Competence",
    focus: "Critical thinking under stress",
    tool: "Assumptions Lab",
    video: {
      url: "https://cdn.app/videos/critical-thinking-under-stress.mp4",
      intent: "Explain how stress-driven assumptions impact clinical judgment and patient safety"
    },
    coreFlow: [
      "Identify a stress-driven clinical assumption",
      "Challenge the assumption",
      "Reframe thinking for clarity",
      "Reflect on safer judgment"
    ],
    toolRoute: "/ai-tools/assumptions-lab"
  },
  {
    id: "w1-d5-res",
    week: 1,
    day: 5,
    theme: "Stress & Judgment",
    eiStat: "Resilience",
    focus: "Reframe setbacks",
    tool: "Assumptions Lab",
    coreFlow: [
      "Recall a recent setback",
      "Identify belief formed after the setback",
      "Reframe the belief",
      "Reflect on emotional recovery"
    ],
    toolRoute: "/ai-tools/assumptions-lab"
  },
  
  // Day 6 - Pressure & Recovery
  {
    id: "w1-d6-sa",
    week: 1,
    day: 6,
    theme: "Pressure & Recovery",
    eiStat: "Self-Awareness",
    focus: "Situational blind spots",
    tool: "Assumptions Lab",
    coreFlow: [
      "Recall a pressured situation",
      "Identify a situational blind spot",
      "Reframe the assumption",
      "Reflect on what was overlooked"
    ],
    toolRoute: "/ai-tools/assumptions-lab"
  },
  {
    id: "w1-d6-sm",
    week: 1,
    day: 6,
    theme: "Pressure & Recovery",
    eiStat: "Self-Management",
    focus: "Manage unexpected events",
    tool: "Control & Influence Map",
    video: {
      url: "https://cdn.app/videos/managing-unexpected-events.mp4",
      intent: "Teach rapid control mapping when plans break under pressure"
    },
    coreFlow: [
      "Recall an unexpected event",
      "Map what can be controlled and influenced",
      "Choose one immediate stabilizing action"
    ],
    toolRoute: "/ai-tools/control-influence-map"
  },
  {
    id: "w1-d6-soa",
    week: 1,
    day: 6,
    theme: "Pressure & Recovery",
    eiStat: "Social Awareness",
    focus: "Reading group dynamics",
    tool: "Change Companion",
    coreFlow: [
      "Recall a team dynamic under pressure",
      "Identify assumptions about others",
      "Reframe perspective on group behavior",
      "Reflect on group insight"
    ],
    toolRoute: "/ai-tools/change-companion"
  },
  {
    id: "w1-d6-rm",
    week: 1,
    day: 6,
    theme: "Pressure & Recovery",
    eiStat: "Relationship Management",
    focus: "Coaching peers",
    tool: "Change Companion",
    coreFlow: [
      "Recall a colleague under stress",
      "Reframe support versus fixing",
      "Choose a supportive response",
      "Reflect on coaching impact"
    ],
    toolRoute: "/ai-tools/change-companion"
  },
  {
    id: "w1-d6-cc",
    week: 1,
    day: 6,
    theme: "Pressure & Recovery",
    eiStat: "Clinical Competence",
    focus: "Communicate under pressure",
    tool: "Control & Influence Map",
    video: {
      url: "https://cdn.app/videos/pressure-communication-clinical.mp4",
      intent: "Frame safe communication choices during high-pressure clinical moments"
    },
    coreFlow: [
      "Recall a pressured communication moment",
      "Map controllable communication behaviors",
      "Select one clarity-focused action",
      "Reflect on communication effectiveness"
    ],
    toolRoute: "/ai-tools/control-influence-map"
  },
  {
    id: "w1-d6-res",
    week: 1,
    day: 6,
    theme: "Pressure & Recovery",
    eiStat: "Resilience",
    focus: "Mental recovery",
    tool: "Reframe",
    coreFlow: [
      "Recall a mentally draining challenge",
      "Normalize emotional fatigue",
      "Reframe the challenge",
      "Reflect on recovery state"
    ],
    toolRoute: "/ai-tools/reframe"
  },
  
  // Day 7 - Integration
  {
    id: "w1-d7-sa",
    week: 1,
    day: 7,
    theme: "Integration",
    eiStat: "Self-Awareness",
    focus: "Reflect on personal growth",
    tool: "Assumptions Lab",
    video: {
      url: "https://cdn.app/videos/weekly-self-reflection.mp4",
      intent: "Guide structured reflection to consolidate emotional insights"
    },
    coreFlow: [
      "Review emotional patterns from the week",
      "Identify belief shifts",
      "Reframe outdated self-assumptions",
      "Capture key insight"
    ],
    toolRoute: "/ai-tools/assumptions-lab"
  },
  {
    id: "w1-d7-sm",
    week: 1,
    day: 7,
    theme: "Integration",
    eiStat: "Self-Management",
    focus: "Review strategies",
    tool: "Control & Influence Map",
    coreFlow: [
      "Review strategies used during the week",
      "Map what worked versus what didn't",
      "Select one strategy to continue"
    ],
    toolRoute: "/ai-tools/control-influence-map"
  },
  {
    id: "w1-d7-soa",
    week: 1,
    day: 7,
    theme: "Integration",
    eiStat: "Social Awareness",
    focus: "Community awareness",
    tool: "Change Companion",
    coreFlow: [
      "Reflect on team or community impact",
      "Reframe role within the group",
      "Identify one forward action"
    ],
    toolRoute: "/ai-tools/change-companion"
  },
  {
    id: "w1-d7-rm",
    week: 1,
    day: 7,
    theme: "Integration",
    eiStat: "Relationship Management",
    focus: "Celebrate team wins",
    tool: "Change Companion",
    coreFlow: [
      "Identify a team success",
      "Reflect on behaviors that enabled it",
      "Commit to reinforcing those behaviors"
    ],
    toolRoute: "/ai-tools/change-companion"
  },
  {
    id: "w1-d7-cc",
    week: 1,
    day: 7,
    theme: "Integration",
    eiStat: "Clinical Competence",
    focus: "Patient-centered reflection",
    tool: "Control & Influence Map",
    video: {
      url: "https://cdn.app/videos/patient-centered-reflection.mp4",
      intent: "Reinforce how emotional regulation impacts patient outcomes"
    },
    coreFlow: [
      "Recall a patient interaction from the week",
      "Map influence on patient experience",
      "Reflect on future patient-centered actions"
    ],
    toolRoute: "/ai-tools/control-influence-map"
  },
  {
    id: "w1-d7-res",
    week: 1,
    day: 7,
    theme: "Integration",
    eiStat: "Resilience",
    focus: "Weekly recovery ritual",
    tool: "Breathing Tool",
    video: {
      url: "https://cdn.app/videos/weekly-recovery-ritual.mp4",
      intent: "Close the week with intentional nervous system reset"
    },
    coreFlow: [
      "Acknowledge emotional labor from the week",
      "Practice extended guided breathing",
      "Set recovery intention",
      "Reflect on readiness for next week"
    ],
    toolRoute: "/ai-tools/breathing-exercise"
  }
]

// Week metadata
export const WEEKS_DATA = [
  { week: 1, title: "Foundation", description: "Build emotional awareness and core regulation skills", totalDays: 7 },
  { week: 2, title: "Deepening", description: "Strengthen patterns and coping strategies", totalDays: 7, locked: true },
  { week: 3, title: "Application", description: "Apply skills in complex scenarios", totalDays: 7, locked: true },
  { week: 4, title: "Mastery", description: "Integrate and sustain emotional intelligence", totalDays: 7, locked: true },
]

// Day themes for Week 1
export const DAY_THEMES: Record<number, Record<number, string>> = {
  1: {
    1: "Awareness & Grounding",
    2: "Patterns & Control",
    3: "Decisions & Culture",
    4: "Strengths & Fatigue",
    5: "Stress & Judgment",
    6: "Pressure & Recovery",
    7: "Integration"
  }
}

// EI Stats colors
export const EI_STAT_COLORS: Record<string, string> = {
  "Self-Awareness": "text-blue-600 bg-blue-50",
  "Self-Management": "text-green-600 bg-green-50",
  "Social Awareness": "text-purple-600 bg-purple-50",
  "Relationship Management": "text-orange-600 bg-orange-50",
  "Clinical Competence": "text-red-600 bg-red-50",
  "Resilience": "text-teal-600 bg-teal-50"
}

export const useTrainingStore = create<TrainingState>()(
  persist(
    (set, get) => {
      console.log("[v0] training-store persist middleware initializing...")
      return {
      courseStartDate: null,
      completedTasks: [],
      
      getCurrentWeekDay: () => {
        const { courseStartDate } = get()
        if (!courseStartDate) return { week: 1, day: 1 }
        
        const start = new Date(courseStartDate)
        const now = new Date()
        const diffTime = now.getTime() - start.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        
        // Each week is 7 days
        const week = Math.floor(diffDays / 7) + 1
        const day = (diffDays % 7) + 1
        
        // Cap at week 4
        return {
          week: Math.min(week, 4),
          day: week > 4 ? 7 : day
        }
      },
      
      isTaskUnlocked: (week: number, day: number) => {
        const { courseStartDate } = get()
        if (!courseStartDate) return week === 1 && day === 1
        
        const current = get().getCurrentWeekDay()
        
        // Past weeks/days are unlocked
        if (week < current.week) return true
        if (week === current.week && day <= current.day) return true
        
        return false
      },
      
      isTaskCompleted: (taskId: string) => {
        return get().completedTasks.some(t => t.taskId === taskId)
      },
      
      startCourse: () => {
        set({ courseStartDate: new Date().toISOString() })
      },
      
      completeTask: (completion) => {
        const existing = get().completedTasks.find(t => t.taskId === completion.taskId)
        if (existing) return // Already completed
        
        set(state => ({
          completedTasks: [
            ...state.completedTasks,
            { ...completion, completedAt: new Date().toISOString() }
          ]
        }))
      },
      
      getTaskCompletion: (taskId: string) => {
        return get().completedTasks.find(t => t.taskId === taskId)
      }
    }},
    {
      name: "training-progress",
      storage: createJSONStorage(() => safeLocalStorage),
    }
  )
)

console.log("[v0] training-store initialized successfully")

// Helper to get tasks by day
export const getTasksByDay = (week: number, day: number): TrainingTask[] => {
  return TRAINING_TASKS.filter(t => t.week === week && t.day === day)
}

// Helper to get day completion status
export const getDayCompletionStatus = (week: number, day: number, completedTasks: TrainingCompletion[]) => {
  const dayTasks = getTasksByDay(week, day)
  const completedCount = dayTasks.filter(t => completedTasks.some(c => c.taskId === t.id)).length
  return {
    total: dayTasks.length,
    completed: completedCount,
    isFullyCompleted: completedCount === dayTasks.length
  }
}
