import { sql } from "@/lib/db"
import { cookies } from "next/headers"

export const runtime = "nodejs"

export async function GET() {
  try {
    const sessions = await sql`
      SELECT id, user_id, created_at
      FROM chat_sessions
      ORDER BY updated_at DESC
    `

    return new Response(JSON.stringify({ sessions }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return new Response(JSON.stringify({ error: "Failed to fetch sessions" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

export async function POST() {
  try {
    const cookieStore = cookies()

    // Generate a UUID for the new session
    const sessionId = crypto.randomUUID()

    // Create a new session
    const result = await sql`
      INSERT INTO chat_sessions (id, user_id, created_at, updated_at)
      VALUES (${sessionId}, 'user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, user_id, created_at
    `

    const session = result[0]

    // Set the session cookie
    cookieStore.set("chat_session_id", session.id, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    // Add welcome message from Flo
    await sql`
      INSERT INTO messages (session_id, role, content)
      VALUES (
        ${session.id}, 
        'assistant', 
        'Hi there! I''m Flo, your personal guide to Clipboard Health. Whether you have questions about shifts, the app, or just need some encouragement, I''m here to help. How can I support you today?'
      )
    `

    return new Response(JSON.stringify({ session }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error creating session:", error)
    return new Response(JSON.stringify({ error: "Failed to create session" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
