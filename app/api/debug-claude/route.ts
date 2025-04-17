import { anthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    console.log("Testing Claude API connection...")

    // Check if API key is set
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY environment variable is not set")
      return new Response(
        JSON.stringify({
          success: false,
          error: "Anthropic API key is missing",
          message: "Please set the ANTHROPIC_API_KEY environment variable.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Test the Anthropic API with a simple prompt
    try {
      const result = await generateText({
        model: anthropic("claude-3-haiku-20240307"),
        prompt: "Say hello and confirm you're working properly.",
        maxTokens: 100,
      })

      console.log("Claude API response received:", result.text)

      return new Response(
        JSON.stringify({
          success: true,
          message: "Claude API is working",
          response: result.text,
          modelInfo: {
            model: "claude-3-haiku-20240307",
            provider: "anthropic",
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    } catch (claudeError) {
      console.error("Error from Claude API:", claudeError)

      // Provide detailed error information
      const errorDetails = {
        message: claudeError instanceof Error ? claudeError.message : String(claudeError),
        stack: claudeError instanceof Error ? claudeError.stack : undefined,
        name: claudeError instanceof Error ? claudeError.name : undefined,
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to connect to Claude API",
          details: errorDetails,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }
  } catch (error) {
    console.error("Error testing Claude API:", error)

    // Provide more detailed error information
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to connect to Claude API",
        details: errorDetails,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
