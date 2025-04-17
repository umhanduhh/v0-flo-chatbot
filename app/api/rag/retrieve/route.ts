import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const { query } = await req.json()

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    // Simple text-based search instead of vector similarity
    const results = await sql`
      SELECT 
        tc.chunk_text, 
        ha.title, 
        ha.url,
        1.0 as similarity
      FROM 
        text_chunks tc
      JOIN 
        help_articles ha ON tc.article_id = ha.id
      WHERE 
        tc.chunk_text ILIKE ${"%" + query + "%"}
      ORDER BY 
        similarity DESC
      LIMIT 3
    `

    // If no direct matches, return some default chunks
    if (results.length === 0) {
      const defaultResults = await sql`
        SELECT 
          tc.chunk_text, 
          ha.title, 
          ha.url,
          0.5 as similarity
        FROM 
          text_chunks tc
        JOIN 
          help_articles ha ON tc.article_id = ha.id
        ORDER BY 
          tc.id
        LIMIT 3
      `
      return NextResponse.json({ results: defaultResults })
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error retrieving content:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
