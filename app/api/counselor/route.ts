import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export const maxDuration = 60

const GEMINI_MODEL = "gemini-2.5-flash"

// AI Tools available in the system
const AI_TOOLS = {
  "assumptions-lab": {
    name: "Assumptions Lab",
    description: "Deep cognitive belief challenge - helps identify and reframe limiting assumptions",
    route: "/ai-tools/assumptions-lab",
    keywords: ["assumption", "belief", "cognitive", "thinking pattern", "mindset", "negative thought"]
  },
  "control-influence-map": {
    name: "Control & Influence Map",
    description: "Agency restoration under stress - categorize concerns into what you can control, influence, or accept",
    route: "/ai-tools/control-influence-map",
    keywords: ["control", "stress", "overwhelm", "agency", "powerless", "can't change", "out of control"]
  },
  "change-companion": {
    name: "Change Companion",
    description: "Interpersonal reappraisal & relational resilience - navigate difficult relationships",
    route: "/ai-tools/change-companion",
    keywords: ["relationship", "colleague", "conflict", "interpersonal", "team", "communication", "difficult person"]
  },
  "reframe": {
    name: "Reframe",
    description: "Emotional first aid - rapid regulation for immediate distress",
    route: "/ai-tools/reframe",
    keywords: ["upset", "anxious", "angry", "sad", "frustrated", "overwhelmed", "emotional", "distressed", "panic"]
  },
  "breathing-exercise": {
    name: "Breathing Exercise",
    description: "Physiological regulation & grounding - calming breathing techniques",
    route: "/ai-tools/breathing-exercise",
    keywords: ["breathing", "calm", "relax", "grounding", "anxiety", "panic", "stress relief", "tension"]
  }
}

interface UserContext {
  name: string
  level: number
  rank: string
  xp: number
  streak: number
  competencies: Record<string, number>
  completedQuestsCount: number
  activeQuestsCount: number
  recentQuests: Array<{ title: string; realm: string; completed: boolean }>
  recentMood?: string
  achievements: Array<{ title: string; unlocked: boolean }>
}

interface CounselorRequest {
  messages: Array<{ role: string; content: string }>
  userContext: UserContext
  action?: "generate_quest" | "suggest_tool" | "open_tool" | "chat"
  toolId?: string
}

function buildSystemPrompt(userContext: UserContext): string {
  const competencyStr = Object.entries(userContext.competencies)
    .map(([key, val]) => `${key}: ${val}`)
    .join(", ")
  
  const recentQuestsStr = userContext.recentQuests
    .slice(0, 5)
    .map(q => `- ${q.title} (${q.realm}) - ${q.completed ? "Completed" : "Active"}`)
    .join("\n")

  return `You are ARIA (Adaptive Resilience & Insight Assistant), a compassionate AI counselor and personal coach for ${userContext.name}. You have full access to their progress data and can take actions to help them.

## User Profile
- Name: ${userContext.name}
- Level: ${userContext.level} (${userContext.rank})
- XP: ${userContext.xp}
- Learning Streak: ${userContext.streak} days
- EI Competencies: ${competencyStr}
- Completed Quests: ${userContext.completedQuestsCount}
- Active Quests: ${userContext.activeQuestsCount}

## Recent Quest Activity
${recentQuestsStr || "No recent quests"}

## Your Capabilities
1. **Empathetic Counseling**: Provide emotional support, validate feelings, guide through difficult emotions
2. **Progress Awareness**: Reference their actual progress, celebrate achievements, identify growth areas
3. **Quest Generation**: When they need structured practice, offer to create personalized quests
4. **AI Tool Suggestions**: Recommend appropriate AI tools based on their needs:
   - Assumptions Lab: For challenging negative beliefs
   - Control & Influence Map: For feeling overwhelmed or powerless
   - Change Companion: For relationship/interpersonal challenges
   - Reframe: For immediate emotional distress
   - Breathing Exercise: For anxiety, stress, or need to calm down

## Response Guidelines
- Be warm, personal, and use their name naturally
- Reference their actual progress when relevant (celebrate streaks, acknowledge level, etc.)
- When they express a need that matches an AI tool, naturally suggest it
- If they want to practice a skill, offer to generate a quest
- Use conversational language, not clinical jargon
- Keep responses focused and actionable

## Action Triggers
When you detect these needs, include special markers in your response:

1. If user needs immediate emotional regulation:
   [SUGGEST_TOOL:reframe] or [SUGGEST_TOOL:breathing-exercise]

2. If user is dealing with negative thought patterns:
   [SUGGEST_TOOL:assumptions-lab]

3. If user feels overwhelmed or out of control:
   [SUGGEST_TOOL:control-influence-map]

4. If user has relationship/interpersonal challenges:
   [SUGGEST_TOOL:change-companion]

5. If user wants to practice or learn something specific:
   [OFFER_QUEST:description of what they want to practice]

Only include ONE action marker per response, and only when truly relevant.`
}

function extractAction(response: string): { 
  cleanResponse: string
  action?: { type: "suggest_tool" | "offer_quest"; payload: string }
} {
  let cleanResponse = response
  let action: { type: "suggest_tool" | "offer_quest"; payload: string } | undefined

  // Check for tool suggestion
  const toolMatch = response.match(/\[SUGGEST_TOOL:([^\]]+)\]/)
  if (toolMatch) {
    cleanResponse = response.replace(toolMatch[0], "").trim()
    action = { type: "suggest_tool", payload: toolMatch[1] }
  }

  // Check for quest offer
  const questMatch = response.match(/\[OFFER_QUEST:([^\]]+)\]/)
  if (questMatch) {
    cleanResponse = response.replace(questMatch[0], "").trim()
    action = { type: "offer_quest", payload: questMatch[1] }
  }

  return { cleanResponse, action }
}

function generateQuestFromContext(description: string, userContext: UserContext): object {
  // Determine the most appropriate realm based on description
  const realmKeywords: Record<string, string[]> = {
    "Self-Awareness": ["awareness", "recognize", "identify", "notice", "reflect", "understand myself"],
    "Self-Management": ["regulate", "control", "manage", "cope", "calm", "respond"],
    "Social Awareness": ["empathy", "understand others", "perspective", "listen", "observe"],
    "Relationship Management": ["communicate", "collaborate", "conflict", "relationship", "team"],
    "Resilience": ["stress", "bounce back", "adapt", "recover", "challenge"]
  }

  let selectedRealm = "Self-Awareness"
  let maxMatches = 0
  const lowerDesc = description.toLowerCase()

  for (const [realm, keywords] of Object.entries(realmKeywords)) {
    const matches = keywords.filter(k => lowerDesc.includes(k)).length
    if (matches > maxMatches) {
      maxMatches = matches
      selectedRealm = realm
    }
  }

  // Determine difficulty based on user level
  const difficulty = userContext.level < 3 ? "beginner" : userContext.level < 6 ? "intermediate" : "advanced"
  const xp = difficulty === "beginner" ? 20 : difficulty === "intermediate" ? 35 : 50

  return {
    id: `counselor-quest-${Date.now()}`,
    title: `Practice: ${description.slice(0, 50)}${description.length > 50 ? "..." : ""}`,
    description: description,
    realm: selectedRealm,
    xp,
    difficulty,
    duration: "1 day",
    completed: false,
    type: "daily",
    week: 0,
    skillTags: [{ skill: selectedRealm, points: difficulty === "beginner" ? 1 : 2 }],
    source: "ai-counselor"
  }
}

export async function POST(req: Request) {
  try {
    const body: CounselorRequest = await req.json()
    const { messages, userContext, action, toolId } = body

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    // Handle direct actions
    if (action === "generate_quest" && toolId) {
      const quest = generateQuestFromContext(toolId, userContext)
      return NextResponse.json({ 
        type: "quest_generated",
        quest,
        message: `I've created a quest for you: "${(quest as any).title}". It's been added to your quest list!`
      })
    }

    if (action === "open_tool" && toolId) {
      const tool = AI_TOOLS[toolId as keyof typeof AI_TOOLS]
      if (tool) {
        return NextResponse.json({
          type: "open_tool",
          toolId,
          route: tool.route,
          message: `Opening ${tool.name}...`
        })
      }
    }

    // Regular chat with context
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

    const systemPrompt = buildSystemPrompt(userContext)

    const chatHistory = [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      {
        role: "model",
        parts: [{ text: `Hello ${userContext.name}! I'm ARIA, your personal EI coach. I can see you're at Level ${userContext.level} with a ${userContext.streak}-day streak - that's wonderful progress! How can I support you today?` }],
      },
      ...messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
    ]

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 1500,
      },
    })

    const lastMessage = messages[messages.length - 1].content
    const result = await chat.sendMessage(lastMessage)
    const response = result.response
    const aiResponse = response.text()

    // Extract any action markers
    const { cleanResponse, action: detectedAction } = extractAction(aiResponse)

    const responsePayload: any = {
      type: "message",
      message: cleanResponse
    }

    if (detectedAction) {
      if (detectedAction.type === "suggest_tool") {
        const tool = AI_TOOLS[detectedAction.payload as keyof typeof AI_TOOLS]
        if (tool) {
          responsePayload.suggestedTool = {
            id: detectedAction.payload,
            ...tool
          }
        }
      } else if (detectedAction.type === "offer_quest") {
        responsePayload.questOffer = {
          description: detectedAction.payload
        }
      }
    }

    return NextResponse.json(responsePayload)
  } catch (error) {
    console.error("[v0] Counselor API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
