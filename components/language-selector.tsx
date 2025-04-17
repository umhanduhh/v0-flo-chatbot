"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from "@/lib/language"

type LanguageSelectorProps = {
  sessionId: string | null
  onLanguageChange: (languageCode: string) => void
  initialLanguage?: string
}

export function LanguageSelector({
  sessionId,
  onLanguageChange,
  initialLanguage = DEFAULT_LANGUAGE,
}: LanguageSelectorProps) {
  const [currentLanguage, setCurrentLanguage] = useState(initialLanguage)

  useEffect(() => {
    if (initialLanguage) {
      setCurrentLanguage(initialLanguage)
    }
  }, [initialLanguage])

  const handleLanguageSelect = async (languageCode: string) => {
    setCurrentLanguage(languageCode)
    onLanguageChange(languageCode)

    // Save language preference if session exists
    if (sessionId) {
      try {
        await fetch("/api/language", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            languageCode,
          }),
        })
      } catch (error) {
        console.error("Error saving language preference:", error)
      }
    }
  }

  // Find the current language object
  const currentLangObj = SUPPORTED_LANGUAGES.find((lang) => lang.code === currentLanguage) || SUPPORTED_LANGUAGES[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1 bg-white bg-opacity-20 text-white">
          <Globe className="h-4 w-4" />
          <span>{currentLangObj.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LANGUAGES.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageSelect(language.code)}
            className={`flex items-center gap-2 ${currentLanguage === language.code ? "bg-slate-100" : ""}`}
          >
            <span>{language.flag}</span>
            <span>{language.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
