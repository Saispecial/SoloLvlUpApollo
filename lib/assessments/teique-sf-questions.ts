// TEIQue-SF 30 items (simplified - full implementation would have all questions)
export const TEIQUE_QUESTIONS = [
  { id: 1, text: "I usually find it difficult to regulate my emotions.", domain: "selfManagement", reverse: true },
  { id: 2, text: "I'm usually able to influence the way other people feel.", domain: "relationshipManagement", reverse: false },
  { id: 3, text: "I usually find it difficult to recognize my emotions.", domain: "selfAwareness", reverse: true },
  { id: 4, text: "I'm usually able to stand back and look at myself in a detached way.", domain: "selfAwareness", reverse: false },
  { id: 5, text: "I usually find it difficult to control my thoughts.", domain: "selfManagement", reverse: true },
  // Add more questions for socialAwareness and relationshipManagement
  { id: 6, text: "I'm usually able to understand how others are feeling.", domain: "socialAwareness", reverse: false },
  { id: 7, text: "I usually find it difficult to empathize with others.", domain: "socialAwareness", reverse: true },
  { id: 8, text: "I'm usually able to build strong relationships with others.", domain: "relationshipManagement", reverse: false },
  { id: 9, text: "I usually find it difficult to manage conflicts with others.", domain: "relationshipManagement", reverse: true },
  { id: 10, text: "I'm usually aware of my emotional reactions.", domain: "selfAwareness", reverse: false },
  // ... (In full implementation, all 30 items would be here)
]
