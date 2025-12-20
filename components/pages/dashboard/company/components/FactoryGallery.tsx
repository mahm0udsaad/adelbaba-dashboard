"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/context"
import { Upload, X, ImageIcon, Loader2 } from "lucide-react"
import { FactoryImage } from "@/src/services/company-api"
import { cn } from "@/lib/utils"

interface FactoryGalleryProps {
  images: FactoryImage[]
  onRemove: (id: number) => void
  onAdd: (files: File[]) => void
  isUpdating?: boolean
}

export function FactoryGallery({ images, onRemove, onAdd, isUpdating }: FactoryGalleryProps) {
  const { t } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onAdd(files)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t.factoryImages}</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUpdating}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
          {t.uploadFactoryImages}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-xl bg-muted/20 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mb-4 opacity-20" />
          <p className="text-sm">No factory images yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative aspect-video rounded-lg overflow-hidden border bg-muted"
            >
              <img
                src={image.url}
                alt={image.file_name}
                className="object-cover w-full h-full transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onRemove(image.id)}
                  disabled={isUpdating}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

