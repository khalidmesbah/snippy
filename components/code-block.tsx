"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface CodeBlockProps {
  code: string
  language: string
  title?: string
}

export function CodeBlock({ code, language, title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const lines = code.split("\n")
  const maxLineNumberWidth = lines.length.toString().length

  return (
    <div className="relative group">
      <div className="rounded-lg overflow-hidden border">
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{title}</span>
              <Badge variant="outline" className="capitalize">
                {language}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied && <span className="ml-2 text-xs">Copied!</span>}
            </Button>
          </div>
        )}
        <div className="relative">
          {!title && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          )}

          <div className="flex bg-[#1e1e1e] text-[#d4d4d4]">
            {/* Line numbers */}
            <div className="select-none text-[#858585] text-sm font-mono leading-6 p-4 pr-3 border-r border-[#3e3e3e]">
              {lines.map((_, index) => (
                <div key={index} className="text-right" style={{ minWidth: `${maxLineNumberWidth}ch` }}>
                  {index + 1}
                </div>
              ))}
            </div>
            {/* Code content */}
            <div className="flex-1 overflow-x-auto">
              <pre className="text-sm font-mono leading-6 p-4 m-0">
                <code className="block whitespace-pre">{code}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
