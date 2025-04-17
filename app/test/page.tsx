"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function TestPage() {
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)

  async function runTests() {
    try {
      setLoading(true)
      const response = await fetch("/api/rag/test")
      const data = await response.json()
      setTestResults(data.testResults)
    } catch (error) {
      console.error("Error running tests:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">RAG Capability Test</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Test Flo's RAG Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={runTests} disabled={loading} className="mb-4">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              "Run Tests"
            )}
          </Button>

          {testResults && (
            <div className="mt-6">
              <h2 className="text-xl font-bold mb-4">Test Results</h2>

              <Accordion type="single" collapsible className="w-full">
                {testResults.map((result: any, index: number) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      <span className="font-medium">{result.question}</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-sm text-gray-500 mb-2">Retrieved Content:</h3>
                          {result.retrievedContent.length > 0 ? (
                            <div className="space-y-2">
                              {result.retrievedContent.map((content: any, i: number) => (
                                <div key={i} className="bg-gray-50 p-3 rounded-md text-sm">
                                  <p className="font-medium">{content.title}</p>
                                  <p className="text-xs text-gray-500">
                                    Similarity: {(content.similarity * 100).toFixed(2)}%
                                  </p>
                                  <p className="mt-1">{content.excerpt}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No relevant content found</p>
                          )}
                        </div>

                        <div>
                          <h3 className="font-semibold text-sm text-gray-500 mb-2">Flo's Response:</h3>
                          <div className="bg-teal-50 p-3 rounded-md">{result.response}</div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
