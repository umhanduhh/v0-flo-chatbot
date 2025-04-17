"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function DebugPage() {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState("")
  const [envKeyAvailable, setEnvKeyAvailable] = useState<boolean | null>(null)

  // Check if environment variable is set
  useEffect(() => {
    async function checkEnvKey() {
      try {
        setChecking(true)
        const response = await fetch("/api/debug-claude")
        const data = await response.json()

        setEnvKeyAvailable(data.success)
        if (data.success) {
          setResult(data)
        }
      } catch (error) {
        console.error("Error checking environment variable:", error)
        setEnvKeyAvailable(false)
      } finally {
        setChecking(false)
      }
    }

    checkEnvKey()
  }, [])

  const testClaudeConnection = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/debug-claude" + (apiKey ? `?apiKey=${encodeURIComponent(apiKey)}` : ""))
      const data = await response.json()

      setResult(data)
    } catch (error) {
      console.error("Error testing Claude:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 bg-silver-light min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-plum">Debug Page</h1>

      {checking ? (
        <Card className="mb-8 border-plum-light shadow-md">
          <CardContent className="pt-6 bg-white">
            <div className="flex items-center">
              <Loader2 className="h-5 w-5 animate-spin mr-2 text-plum" />
              <p>Checking for Anthropic API key in environment variables...</p>
            </div>
          </CardContent>
        </Card>
      ) : envKeyAvailable ? (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">API Key Available</AlertTitle>
          <AlertDescription className="text-green-700">
            The Anthropic API key is properly set in your environment variables.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="warning" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>API Key Required</AlertTitle>
          <AlertDescription>
            The Anthropic API key is not set in your environment variables. Please enter your API key below for testing
            purposes.
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-8 border-plum-light shadow-md">
        <CardHeader className="bg-gradient-to-r from-plum to-yinmn text-white">
          <CardTitle>Test Claude API Connection</CardTitle>
        </CardHeader>
        <CardContent className="bg-white">
          {!envKeyAvailable && (
            <div className="mb-4">
              <Label htmlFor="api-key">Anthropic API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Anthropic API key"
                className="mb-2"
              />
              <p className="text-xs text-gray-500">This key will only be used for testing and won't be stored.</p>
            </div>
          )}

          <Button
            onClick={testClaudeConnection}
            disabled={loading || (!envKeyAvailable && !apiKey)}
            className="mb-4 bg-plum hover:bg-plum-dark"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              "Test Claude Connection"
            )}
          </Button>

          {error && (
            <div className="p-4 rounded-md bg-red-100 text-red-800 mb-4">
              <h3 className="font-bold mb-2">Error</h3>
              <p>{error}</p>
            </div>
          )}

          {result && (
            <div
              className={`p-4 rounded-md ${result.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
              <h3 className="font-bold mb-2">{result.success ? "Success!" : "Error"}</h3>
              {result.success ? (
                <>
                  <p className="mb-2">{result.message}</p>
                  <div className="bg-white p-3 rounded border">
                    <p className="font-semibold">Claude's Response:</p>
                    <p>{result.response}</p>
                  </div>
                </>
              ) : (
                <p>{result.error}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
