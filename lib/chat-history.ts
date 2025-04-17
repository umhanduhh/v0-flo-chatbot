import redis from "./redis"
import { nanoid } from "nanoid"

export type Message = {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  createdAt?: number
}

export type ChatSession = {
  id: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

const CHAT_TTL = 60 * 60 * 24 * 7 // 7 days in seconds

export async function createChatSession(): Promise<string> {
  const sessionId = nanoid()
  const session: ChatSession = {
    id: sessionId,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  await redis.set(`chat:${sessionId}`, JSON.stringify(session), { ex: CHAT_TTL })
  return sessionId
}

export async function getChatSession(sessionId: string): Promise<ChatSession | null> {
  const session = await redis.get<string>(`chat:${sessionId}`)
  if (!session) return null

  return JSON.parse(session) as ChatSession
}

export async function addMessageToSession(
  sessionId: string,
  message: Omit<Message, "id" | "createdAt">,
): Promise<Message> {
  const session = await getChatSession(sessionId)
  if (!session) throw new Error("Chat session not found")

  const newMessage: Message = {
    id: nanoid(),
    ...message,
    createdAt: Date.now(),
  }

  session.messages.push(newMessage)
  session.updatedAt = Date.now()

  await redis.set(`chat:${sessionId}`, JSON.stringify(session), { ex: CHAT_TTL })
  return newMessage
}

export async function getRecentMessages(sessionId: string, limit = 10): Promise<Message[]> {
  const session = await getChatSession(sessionId)
  if (!session) return []

  return session.messages.slice(-limit)
}
