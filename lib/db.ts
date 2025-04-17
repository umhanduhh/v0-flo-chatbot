import { neon } from "@neondatabase/serverless"

// Create a SQL client with the pooled connection
export const sql = neon(process.env.DATABASE_URL!)

// Chat session functions
export async function createChatSession(userId?: string) {
  const result = await sql`
    INSERT INTO chat_sessions (user_id)
    VALUES (${userId || null})
    RETURNING id
  `
  return result[0].id
}

export async function getChatSession(sessionId: string) {
  const result = await sql`
    SELECT * FROM chat_sessions
    WHERE id = ${sessionId}
  `
  return result[0] || null
}

export async function updateChatSession(sessionId: string) {
  await sql`
    UPDATE chat_sessions
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = ${sessionId}
  `
}

// Message functions
export async function addMessage(
  sessionId: string,
  role: "user" | "assistant" | "system",
  content: string,
  metadata?: any,
) {
  const result = await sql`
    INSERT INTO messages (session_id, role, content, metadata)
    VALUES (${sessionId}, ${role}, ${content}, ${metadata ? JSON.stringify(metadata) : null})
    RETURNING id
  `
  return result[0].id
}

export async function getMessages(sessionId: string, limit = 100) {
  const result = await sql`
    SELECT * FROM messages
    WHERE session_id = ${sessionId}
    ORDER BY created_at ASC
    LIMIT ${limit}
  `
  return result
}
