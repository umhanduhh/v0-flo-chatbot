"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AdminPage() {
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [populating, setPopulating] = useState(false)
  const [populateResult, setPopulateResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)

  useEffect(() => {
    fetchArticles()
  }, [])

  async function fetchArticles() {
    try {
      setLoading(true)
      setError(null)
      setErrorDetails(null)

      const response = await fetch("/api/rag/articles")

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch articles: ${response.status} ${response.statusText}. ${errorText}`)
      }

      const data = await response.json()
      setArticles(data.articles || [])
    } catch (error) {
      console.error("Error fetching articles:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch articles")
    } finally {
      setLoading(false)
    }
  }

  async function populateDatabase() {
    try {
      setPopulating(true)
      setPopulateResult(null)
      setError(null)
      setErrorDetails(null)

      console.log("Starting database population...")
      const response = await fetch("/api/rag/populate")
      console.log("Response received:", response.status, response.statusText)

      const responseText = await response.text()
      console.log("Response text:", responseText.substring(0, 200) + "...")

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError)
        setErrorDetails(responseText)
        throw new Error(
          `Failed to parse response: ${parseError.message}. Raw response: ${responseText.substring(0, 500)}...`,
        )
      }

      if (!response.ok) {
        throw new Error(`Failed to populate database: ${response.status} ${response.statusText}. ${data?.error || ""}`)
      }

      setPopulateResult(data)
      fetchArticles() // Refresh the article list
    } catch (error) {
      console.error("Error populating database:", error)
      setError(error instanceof Error ? error.message : "Failed to populate database")
      setPopulateResult({ success: false, error: String(error) })
    } finally {
      setPopulating(false)
    }
  }

  return (
    <div className="container mx-auto py-8 bg-silver-light min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-plum">RAG Admin Dashboard</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            <p>{error}</p>
            {errorDetails && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm">Show details</summary>
                <pre className="mt-2 whitespace-pre-wrap text-xs bg-black bg-opacity-10 p-2 rounded">
                  {errorDetails}
                </pre>
              </details>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-8 border-plum-light shadow-md">
        <CardHeader className="bg-gradient-to-r from-plum to-yinmn text-white">
          <CardTitle>Database Management</CardTitle>
        </CardHeader>
        <CardContent className="bg-white">
          <Button onClick={populateDatabase} disabled={populating} className="mb-4 bg-plum hover:bg-plum-dark">
            {populating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Populating Database...
              </>
            ) : (
              "Populate Database with Sample Articles"
            )}
          </Button>

          {populateResult && (
            <div
              className={`p-4 rounded-md ${populateResult.success ? "bg-moonstone-light bg-opacity-20" : "bg-magenta-light bg-opacity-20"}`}
            >
              <h3 className="font-bold mb-2">{populateResult.success ? "Success!" : "Error"}</h3>
              {populateResult.success ? (
                <>
                  <p>Processed {populateResult.processed} articles.</p>
                  <div className="mt-2">
                    <h4 className="font-semibold">Results:</h4>
                    <ul className="list-disc pl-5 mt-1">
                      {populateResult.results?.map((result: any, index: number) => (
                        <li key={index} className={result.status === "success" ? "text-green-600" : "text-red-600"}>
                          {result.title || result.url}: {result.status}
                          {result.chunks && ` (${result.chunks} chunks)`}
                          {result.message && ` - ${result.message}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <p>{populateResult.error}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-plum-light shadow-md">
        <CardHeader className="bg-gradient-to-r from-plum to-yinmn text-white">
          <CardTitle>Help Center Articles</CardTitle>
        </CardHeader>
        <CardContent className="bg-white">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-plum" />
            </div>
          ) : (
            <div className="space-y-4">
              {articles.length === 0 ? (
                <p>No articles found. Use the button above to populate the database.</p>
              ) : (
                articles.map((article) => (
                  <div key={article.id} className="border border-silver p-4 rounded-md">
                    <h3 className="font-bold text-lg text-plum">{article.title}</h3>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-yinmn hover:underline text-sm"
                    >
                      {article.url}
                    </a>
                    <p className="text-sm text-gray-500 mt-2">
                      Last updated: {new Date(article.updated_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
