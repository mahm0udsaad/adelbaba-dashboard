"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

type KeywordChipsInputProps = {
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  disabled?: boolean
  minItemsHint?: string
  className?: string
}

function normalizeKeyword(s: string) {
  return s.trim().replace(/\s+/g, " ")
}

export function KeywordChipsInput({
  value,
  onChange,
  placeholder,
  disabled,
  minItemsHint,
  className,
}: KeywordChipsInputProps) {
  const [draft, setDraft] = useState("")

  const deduped = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const k of value) {
      const n = normalizeKeyword(k)
      if (!n) continue
      const key = n.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push(n)
    }
    return out
  }, [value])

  const apply = (next: string[]) => onChange(next)

  const addMany = (items: string[]) => {
    const next = [...deduped]
    for (const raw of items) {
      const n = normalizeKeyword(raw)
      if (!n) continue
      if (next.some((x) => x.toLowerCase() === n.toLowerCase())) continue
      next.push(n)
    }
    apply(next)
  }

  const commitDraft = () => {
    if (!draft.trim()) return
    addMany(draft.split(","))
    setDraft("")
  }

  const removeAt = (idx: number) => {
    const next = deduped.filter((_, i) => i !== idx)
    apply(next)
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Input
        value={draft}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitDraft}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault()
            commitDraft()
            return
          }
          if (e.key === "Backspace" && !draft && deduped.length > 0) {
            e.preventDefault()
            removeAt(deduped.length - 1)
          }
        }}
        onPaste={(e) => {
          const text = e.clipboardData.getData("text")
          if (!text) return
          if (!text.includes(",") && !text.includes("\n")) return
          e.preventDefault()
          addMany(text.split(/,|\n/))
        }}
      />

      {deduped.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {deduped.map((kw, idx) => (
            <Badge key={`${kw}-${idx}`} variant="secondary" className="gap-1 pr-1">
              <span className="max-w-[220px] truncate">{kw}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                disabled={disabled}
                onClick={() => removeAt(idx)}
                aria-label={`Remove ${kw}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </Badge>
          ))}
        </div>
      ) : null}

      {minItemsHint ? <p className="text-xs text-muted-foreground">{minItemsHint}</p> : null}
    </div>
  )
}


