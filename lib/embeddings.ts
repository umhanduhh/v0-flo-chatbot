import { openai } from "@ai-sdk/openai"
import { generateEmbedding } from "ai"
import { sql } from "./db"
import { chunkArticleContent } from "./help-center-scraper"

// Function to generate embeddings for a text chunk
export async function generateEmbeddingForText(text: string) {
  try {
    // Ensure text is not empty
    if (!text || text.trim().length === 0) {
      console.warn("Empty text provided for embedding generation")
      return new Array(1536).fill(0) // Return zero vector for empty text
    }

    const { embedding } = await generateEmbedding({
      model: openai("text-embedding-3-small"),
      input: text,
    })

    return embedding
  } catch (error) {
    console.error("Error generating embedding:", error)
    // Return a zero vector as fallback
    return new Array(1536).fill(0)
  }
}

// Function to store embeddings for an article
export async function storeEmbeddingsForArticle(articleId: string, content: string) {
  try {
    // Chunk the article content
    const chunks = chunkArticleContent(content)
    console.log(`Created ${chunks.length} chunks for article ${articleId}`)

    // Generate and store embeddings for each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]

      try {
        // Generate embedding
        const embedding = await generateEmbeddingForText(chunk)

        // Check if embedding already exists
        const existingEmbedding = await sql`
          SELECT id FROM embeddings 
          WHERE article_id = ${articleId} AND chunk_index = ${i}
        `

        if (existingEmbedding.length > 0) {
          // Update existing embedding
          await sql`
            UPDATE embeddings
            SET chunk_text = ${chunk}, embedding = ${embedding}
            WHERE article_id = ${articleId} AND chunk_index = ${i}
          `
        } else {
          // Insert new embedding
          await sql`
            INSERT INTO embeddings (article_id, chunk_index, chunk_text, embedding)
            VALUES (${articleId}, ${i}, ${chunk}, ${embedding})
          `
        }
        console.log(`Stored embedding ${i + 1}/${chunks.length} for article ${articleId}`)
      } catch (chunkError) {
        console.error(`Error processing chunk ${i} for article ${articleId}:`, chunkError)
        // Continue with next chunk instead of failing the entire process
      }
    }

    console.log(`Stored ${chunks.length} embeddings for article ${articleId}`)
    return chunks.length
  } catch (error) {
    console.error(`Error storing embeddings for article ${articleId}:`, error)
    throw error
  }
}

// Function to find similar content based on a query
export async function findSimilarContent(query: string, limit = 3) {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbeddingForText(query)

    // Find similar content using vector similarity search
    const results = await sql`
      SELECT e.chunk_text, h.title, h.url, 
             1 - (e.embedding <=> ${queryEmbedding}) as similarity
      FROM embeddings e
      JOIN help_articles h ON e.article_id = h.id
      ORDER BY similarity DESC
      LIMIT ${limit}
    `

    return results
  } catch (error) {
    console.error("Error finding similar content:", error)
    return []
  }
}
