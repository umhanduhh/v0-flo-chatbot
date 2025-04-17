import { NextResponse } from "next/server"
import { fetchHelpCenterSection, fetchHelpCenterArticle, storeHelpArticle } from "@/lib/help-center-scraper"
import { storeEmbeddingsForArticle } from "@/lib/embeddings"
import { anthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"
import { systemPrompt } from "@/lib/system-prompt"
import { findSimilarContent } from "@/lib/embeddings"
import { sql } from "@/lib/db"

export const runtime = "nodejs"

// Sample test questions about Clipboard Health
const TEST_QUESTIONS = [
  "How do I get paid through Clipboard Health?",
  "What should I do if I need to cancel a shift?",
  "How does the rating system work on Clipboard Health?",
  "What documents do I need to upload to get started?",
  "How do I find shifts that pay the most?",
]

export async function GET() {
  try {
    // Check if we have articles in the database
    const articleCount = await sql`SELECT COUNT(*) FROM help_articles`

    // If no articles, populate the database
    if (Number.parseInt(articleCount[0].count) === 0) {
      await populateDatabase()
    }

    // Run the tests
    const testResults = await runTests()

    return NextResponse.json({
      success: true,
      testResults,
    })
  } catch (error) {
    console.error("Error running RAG tests:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

async function populateDatabase() {
  // Fetch articles from the help center section
  const sectionUrl = "https://support.clipboardhealth.com/hc/en-us/sections/30405649129623-Help-Articles"
  const articleUrls = await fetchHelpCenterSection(sectionUrl)

  // Process each article (limit to 5 for testing)
  const limitedUrls = articleUrls.slice(0, 5)

  for (const url of limitedUrls) {
    // Fetch and parse the article
    const article = await fetchHelpCenterArticle(url)

    // Store the article in the database
    const articleId = await storeHelpArticle(article)

    // Generate and store embeddings for the article
    await storeEmbeddingsForArticle(articleId, article.content)
  }

  return limitedUrls.length
}

async function runTests() {
  const results = []

  for (const question of TEST_QUESTIONS) {
    // Get relevant content from the database
    const similarContent = await findSimilarContent(question, 2)

    let contextualInformation = ""
    if (similarContent && similarContent.length > 0) {
      contextualInformation = "Here is some relevant information from the Clipboard Health help center:\n\n"

      for (const content of similarContent) {
        contextualInformation += `Article: ${content.title}\n`
        contextualInformation += `URL: ${content.url}\n`
        contextualInformation += `Content: ${content.chunk_text}\n\n`
      }
    }

    // Prepare the enhanced system prompt
    const enhancedSystemPrompt = systemPrompt + (contextualInformation ? `\n\n${contextualInformation}` : "")

    // Generate a response using Claude
    const { text: response } = await generateText({
      model: anthropic("claude-3-haiku-20240307"),
      messages: [
        { role: "system", content: enhancedSystemPrompt },
        { role: "user", content: question },
      ],
      temperature: 0.7,
      maxTokens: 500,
    })

    // Add to results
    results.push({
      question,
      retrievedContent: similarContent.map((c) => ({
        title: c.title,
        similarity: c.similarity,
        excerpt: c.chunk_text.substring(0, 100) + "...",
      })),
      response,
    })
  }

  return results
}
