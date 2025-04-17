import { anthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"
import { systemPrompt } from "@/lib/system-prompt"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    console.log("Direct Chat API called")
    const { messages, sessionId: providedSessionId, apiKey } = await req.json()
    console.log("Received messages:", messages.length)

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY environment variable is not set")
      return new Response(
        JSON.stringify({
          error: "Anthropic API key is missing",
          message: "Please set the ANTHROPIC_API_KEY environment variable.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Get or create session ID
    const cookieStore = cookies()
    let sessionId = providedSessionId || cookieStore.get("chat_session_id")?.value

    if (!sessionId) {
      console.log("Creating new session")
      try {
        const result = await sql`
          INSERT INTO chat_sessions (user_id)
          VALUES ('user')
          RETURNING id
        `
        sessionId = result[0].id

        cookieStore.set("chat_session_id", sessionId, {
          httpOnly: true,
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: "/",
        })
      } catch (error) {
        console.error("Error creating session:", error)
        // Continue with a temporary session ID
        sessionId = "temp-" + Date.now()
      }
    }

    console.log("Using session ID:", sessionId)

    // Add user message to database if possible
    try {
      const userMessage = messages[messages.length - 1]
      if (userMessage.role === "user") {
        await sql`
          INSERT INTO messages (session_id, role, content)
          VALUES (${sessionId}, 'user', ${userMessage.content})
        `
        console.log("Stored user message in database")
      }
    } catch (error) {
      console.error("Error storing message:", error)
      // Continue even if database storage fails
    }

    // Prepare messages for Claude with system prompt
    const promptMessages = [
      { role: "system", content: systemPrompt },
      ...messages.filter((m: any) => m.role !== "system"),
    ]

    console.log("Sending direct request to Claude")

    // Generate text directly (non-streaming)
    const result = await generateText({
      model: anthropic("claude-3-haiku-20240307"),
      messages: promptMessages,
      temperature: 0.7,
      maxTokens: 1000,
    })

    console.log("Received direct response from Claude")

    // Store the response in the database
    try {
      await sql`
        INSERT INTO messages (session_id, role, content)
        VALUES (${sessionId}, 'assistant', ${result.text})
      `
      console.log("Stored assistant response in database")
    } catch (error) {
      console.error("Error storing assistant response:", error)
    }

    return new Response(
      JSON.stringify({
        id: Date.now().toString(),
        role: "assistant",
        content: result.text,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Error in direct chat API:", error)
    return new Response(
      JSON.stringify({
        error: "An error occurred",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
