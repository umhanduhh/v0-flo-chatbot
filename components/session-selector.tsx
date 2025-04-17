"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

type Session = {
  id: string
  user_id: string
  created_at: string
}

export function SessionSelector({ onSessionChange }: { onSessionChange: (sessionId: string) => void }) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<string>("")

  useEffect(() => {
    async function fetchSessions() {
      try {
        const response = await fetch("/api/sessions")
        const data = await response.json()
        setSessions(data.sessions)
        setLoading(false)
      } catch (error) {
        console.error("Failed to load sessions:", error)
        setLoading(false)
      }
    }

    fetchSessions()
  }, [])

  const handleSessionChange = (sessionId: string) => {
    setSelectedSession(sessionId)
    onSessionChange(sessionId)
  }

  const handleNewSession = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/sessions", {
        method: "POST",
      })
      const data = await response.json()

      // Add the new session to the list
      setSessions([...sessions, data.session])

      // Select the new session
      setSelectedSession(data.session.id)
      onSessionChange(data.session.id)

      setLoading(false)
    } catch (error) {
      console.error("Failed to create new session:", error)
      setLoading(false)
    }
  }

  if (loading) {
    return <Loader2 className="h-5 w-5 animate-spin text-white" />
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedSession} onValueChange={handleSessionChange}>
        <SelectTrigger className="w-[200px] bg-white bg-opacity-20 border-white text-white">
          <SelectValue placeholder="Select a conversation" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          {sessions.map((session) => (
            <SelectItem key={session.id} value={session.id}>
              {session.user_id || "Anonymous"} - {new Date(session.created_at).toLocaleDateString()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        onClick={handleNewSession}
        className="bg-white bg-opacity-20 text-white border-white hover:bg-white hover:bg-opacity-30"
      >
        New Chat
      </Button>
    </div>
  )
}
