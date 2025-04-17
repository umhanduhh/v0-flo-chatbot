import { NextResponse } from "next/server"
import { anthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"
import { systemPrompt } from "@/lib/system-prompt"
import { findSimilarContent } from "@/lib/embeddings"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // Get the user's last message
    const userMessage = messages[messages.length - 1]

    // Retrieve relevant content from the help center
    let contextualInformation = ""
    try {
      const similarContent = await findSimilarContent(userMessage.content, 3)

      if (similarContent && similarContent.length > 0) {
        contextualInformation = "Here is some relevant information from the Clipboard Health help center:\n\n"

        for (const content of similarContent) {
          contextualInformation += `Article: ${content.title}\n`
          contextualInformation += `URL: ${content.url}\n`
          contextualInformation += `Content: ${content.chunk_text}\n\n`
        }
      }
    } catch (error) {
      console.error("Error retrieving contextual information:", error)
      // Continue without contextual information if there's an error
    }

    // Prepare messages for Claude with system prompt and contextual information
    const enhancedSystemPrompt = systemPrompt + (contextualInformation ? `\n\n${contextualInformation}` : "")

    const promptMessages = [
      { role: "system", content: enhancedSystemPrompt },
      ...messages.filter((m: any) => m.role !== "system"),
    ]

    // Generate response from Claude
    const { text: response } = await generateText({
      model: anthropic("claude-3-haiku-20240307"),
      messages: promptMessages,
      temperature: 0.7,
      maxTokens: 1000,
    })

    return NextResponse.json({ response })
  } catch (error) {
    console.error("Error in chat test API:", error)
    return NextResponse.json(
      {
        error: "An error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
