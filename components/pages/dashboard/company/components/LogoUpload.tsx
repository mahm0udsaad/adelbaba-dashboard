"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/context"
import { Camera, X, Upload } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface LogoUploadProps {
  currentLogoUrl?: string
  onChange: (file: File | undefined) => void
}

export function LogoUpload({ currentLogoUrl, onChange }: LogoUploadProps) {
  const { t } = useI18n()
  const [preview, setPreview] = useState<string | undefined>(currentLogoUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync preview when currentLogoUrl changes (e.g. after save)
  useEffect(() => {
    // Only update if we don't have a pending file upload preview or if it's the same
    // Actually, safest is to assume if prop changes, it's the source of truth
    if (currentLogoUrl) {
      setPreview(currentLogoUrl)
    }
  }, [currentLogoUrl])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPreview(url)
      onChange(file)
    }
  }

  const clear = () => {
    setPreview(currentLogoUrl)
    onChange(undefined)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t.companyLogo}</h3>
      <div className="flex items-center gap-6">
        <div className="relative group">
          <Avatar className="h-24 w-24 border-2 border-muted overflow-hidden">
            <AvatarImage src={preview} className="object-cover" />
            <AvatarFallback className="bg-primary/5 text-primary">
              <Camera className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          {preview !== currentLogoUrl && (
            <button
              onClick={clear}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm hover:bg-destructive/90 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            {t.uploadLogo}
          </Button>
          <p className="text-xs text-muted-foreground">
            PNG, JPG or WEBP. Max 2MB.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  )
}

