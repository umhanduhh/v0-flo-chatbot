import { anthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"

export const runtime = "nodejs"

export async function GET() {
  try {
    // Test the Anthropic API
    const result = await generateText({
      model: anthropic("claude-3-haiku-20240307"),
      prompt: "Say hello and confirm you're working properly.",
      maxTokens: 100,
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: "Anthropic API is working",
        response: result.text,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Error testing Anthropic API:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to connect to Anthropic API",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
