import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export const runtime = "nodejs"

// Sample articles to use when populating the database
const SAMPLE_ARTICLES = [
  {
    title: "Getting Started with Clipboard Health",
    url: "https://support.clipboardhealth.com/sample/getting-started",
    content: `
      Welcome to Clipboard Health! This guide will help you get started with our platform.
      
      Clipboard Health connects healthcare professionals with facilities that need staff. Our app makes it easy to find shifts, get paid, and advance your career.
      
      To get started:
      1. Download the Clipboard Health app from the App Store or Google Play
      2. Create an account and complete your profile
      3. Upload your credentials and certifications
      4. Browse and book available shifts
      5. Complete your shifts and get paid
      
      If you have any questions, our support team is available 24/7 to help you.
    `,
  },
  {
    title: "How to Find and Book Shifts",
    url: "https://support.clipboardhealth.com/sample/finding-shifts",
    content: `
      Finding and booking shifts on Clipboard Health is simple.
      
      Open the app and go to the Shifts tab to browse available opportunities. You can filter by:
      - Location and distance
      - Shift type (day, evening, night)
      - Pay rate
      - Facility type
      - Date range
      
      Once you find a shift you like, tap 'Book Shift' to reserve it. You'll receive a confirmation notification once the facility approves your booking.
      
      Pro tip: Set up shift alerts to be notified when new shifts matching your preferences become available.
    `,
  },
  {
    title: "Payment and Earnings",
    url: "https://support.clipboardhealth.com/sample/payments",
    content: `
      Clipboard Health makes getting paid simple and transparent.
      
      After completing a shift, your earnings will be processed according to the following schedule:
      - Submit your timesheet within 24 hours of completing your shift
      - Payments are processed weekly for all approved timesheets
      - Direct deposits typically arrive in your bank account within 2-3 business days
      
      You can view your earnings history, including pending and completed payments, in the Earnings tab of the app.
      
      If you have questions about a payment, please contact support with your shift details and we'll resolve it quickly.
    `,
  },
]

export async function GET() {
  try {
    console.log("Starting database population with sample articles")

    // First, let's check if we need to create or modify tables
    try {
      // Check if help_articles table exists
      await sql`SELECT 1 FROM help_articles LIMIT 1`
      console.log("help_articles table exists")
    } catch (error) {
      console.log("Creating help_articles table")
      await sql`
        CREATE TABLE IF NOT EXISTS help_articles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          url TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT help_articles_url_key UNIQUE (url)
        )
      `
    }

    // Check if we need to create the embeddings table without vector type
    try {
      await sql`SELECT 1 FROM text_chunks LIMIT 1`
      console.log("text_chunks table exists")
    } catch (error) {
      console.log("Creating text_chunks table (without vector embeddings)")
      await sql`
        CREATE TABLE IF NOT EXISTS text_chunks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          article_id UUID NOT NULL REFERENCES help_articles(id) ON DELETE CASCADE,
          chunk_index INTEGER NOT NULL,
          chunk_text TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT text_chunks_article_chunk_key UNIQUE (article_id, chunk_index)
        )
      `
    }

    const results = []

    // Process each sample article
    for (const article of SAMPLE_ARTICLES) {
      try {
        console.log(`Processing article: ${article.title}`)

        // First check if the article already exists
        const existingArticle = await sql`
          SELECT id FROM help_articles WHERE url = ${article.url}
        `

        let articleId

        if (existingArticle.length > 0) {
          // Update existing article
          articleId = existingArticle[0].id
          await sql`
            UPDATE help_articles
            SET title = ${article.title}, 
                content = ${article.content},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${articleId}
          `
          console.log(`Updated existing article with ID: ${articleId}`)
        } else {
          // Insert new article
          const result = await sql`
            INSERT INTO help_articles (title, url, content)
            VALUES (${article.title}, ${article.url}, ${article.content})
            RETURNING id
          `
          articleId = result[0].id
          console.log(`Inserted new article with ID: ${articleId}`)
        }

        // Chunk the content
        const chunks = article.content.split(/\n\s*\n/).filter((chunk) => chunk.trim().length > 0)
        console.log(`Created ${chunks.length} chunks for article`)

        // Store each chunk without vector embeddings
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i].trim()
          if (chunk.length === 0) continue

          // Check if this chunk already exists
          const existingChunk = await sql`
            SELECT id FROM text_chunks 
            WHERE article_id = ${articleId} AND chunk_index = ${i}
          `

          if (existingChunk.length > 0) {
            // Update existing chunk
            await sql`
              UPDATE text_chunks
              SET chunk_text = ${chunk}
              WHERE article_id = ${articleId} AND chunk_index = ${i}
            `
          } else {
            // Insert new chunk
            await sql`
              INSERT INTO text_chunks (article_id, chunk_index, chunk_text)
              VALUES (${articleId}, ${i}, ${chunk})
            `
          }
          console.log(`Stored chunk ${i + 1}/${chunks.length}`)
        }

        results.push({
          title: article.title,
          url: article.url,
          status: "success",
          chunks: chunks.length,
        })
      } catch (error) {
        console.error(`Error processing article ${article.title}:`, error)
        results.push({
          title: article.title,
          url: article.url,
          status: "error",
          message: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error("Error populating database:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
