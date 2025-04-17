import { cookies } from "next/headers"
import { sql } from "@/lib/db"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const sessionId = url.searchParams.get("sessionId")

    // If no session ID is provided, use the one from cookies
    let finalSessionId = sessionId
    if (!finalSessionId) {
      const cookieStore = cookies()
      finalSessionId = cookieStore.get("chat_session_id")?.value
    }

    if (!finalSessionId) {
      return new Response(JSON.stringify({ messages: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Get messages for the session
    const dbMessages = await sql`
      SELECT id, role, content, created_at
      FROM messages
      WHERE session_id = ${finalSessionId}
      ORDER BY created_at ASC
    `

    // Format messages for the chat UI
    const messages = dbMessages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
    }))

    return new Response(JSON.stringify({ messages }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error fetching chat history:", error)
    return new Response(JSON.stringify({ error: "Failed to fetch chat history" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
