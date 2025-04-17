import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export const runtime = "nodejs"

export async function GET() {
  try {
    // Check if the table exists first
    try {
      await sql`SELECT 1 FROM help_articles LIMIT 1`
    } catch (tableError) {
      console.log("help_articles table doesn't exist yet")
      return NextResponse.json({ articles: [] })
    }

    const articles = await sql`
      SELECT id, title, url, created_at, updated_at
      FROM help_articles
      ORDER BY updated_at DESC
    `

    return NextResponse.json({ articles })
  } catch (error) {
    console.error("Error fetching articles:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
