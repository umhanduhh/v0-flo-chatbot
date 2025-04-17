import { JSDOM } from "jsdom"
import { sql } from "./db"

// Function to fetch and parse a help center article
export async function fetchHelpCenterArticle(url: string) {
  try {
    console.log(`Fetching article from ${url}`)
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FloBot/1.0; +https://clipboardhealth.com)",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch article: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()

    // Parse the HTML
    const dom = new JSDOM(html)
    const document = dom.window.document

    // Extract the title
    const title = document.querySelector("h1")?.textContent?.trim() || "Untitled Article"

    // Extract the content (main article body)
    const contentElement = document.querySelector("article.article")
    let content = ""

    if (contentElement) {
      // Remove any unnecessary elements
      const elementsToRemove = contentElement.querySelectorAll("header, footer, nav, script, style")
      elementsToRemove.forEach((el) => el.remove())

      // Get the cleaned content
      content = contentElement.textContent?.trim() || ""
    }

    return { title, url, content }
  } catch (error) {
    console.error(`Error fetching article from ${url}:`, error)
    throw error
  }
}

// Function to fetch all articles from a help center section
export async function fetchHelpCenterSection(sectionUrl: string) {
  try {
    console.log(`Fetching section from ${sectionUrl}`)
    const response = await fetch(sectionUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FloBot/1.0; +https://clipboardhealth.com)",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch section: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()

    // Parse the HTML
    const dom = new JSDOM(html)
    const document = dom.window.document

    // Extract article links
    const articleLinks = Array.from(document.querySelectorAll("a.article-list-link"))
      .map((link) => {
        const href = link.getAttribute("href")
        if (!href) return null

        // Convert relative URLs to absolute
        const absoluteUrl = new URL(href, "https://support.clipboardhealth.com").href
        return absoluteUrl
      })
      .filter(Boolean) as string[]

    return articleLinks
  } catch (error) {
    console.error(`Error fetching section from ${sectionUrl}:`, error)
    throw error
  }
}

// Function to store an article in the database
export async function storeHelpArticle(article: { title: string; url: string; content: string }) {
  try {
    // Check if article already exists
    const existingArticle = await sql`
      SELECT id FROM help_articles WHERE url = ${article.url}
    `

    if (existingArticle.length > 0) {
      // Update existing article
      await sql`
        UPDATE help_articles
        SET title = ${article.title}, content = ${article.content}, updated_at = CURRENT_TIMESTAMP
        WHERE url = ${article.url}
      `
      return existingArticle[0].id
    } else {
      // Insert new article
      const result = await sql`
        INSERT INTO help_articles (title, url, content)
        VALUES (${article.title}, ${article.url}, ${article.content})
        RETURNING id
      `
      return result[0].id
    }
  } catch (error) {
    console.error(`Error storing article ${article.url}:`, error)
    throw error
  }
}

// Function to chunk article content for embedding
export function chunkArticleContent(content: string, maxChunkSize = 1000) {
  // Split content into paragraphs
  const paragraphs = content.split(/\n\s*\n/)

  const chunks: string[] = []
  let currentChunk = ""

  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed the max chunk size, start a new chunk
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = ""
    }

    currentChunk += paragraph + "\n\n"
  }

  // Add the last chunk if it's not empty
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}
