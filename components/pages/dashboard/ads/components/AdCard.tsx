import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Eye, MousePointer, TrendingUp, DollarSign, Target, Calendar, BarChart3, Pause, Play, FileDown, Trash2 } from "lucide-react"
import type { Ad } from "./types"
import { useI18n } from "@/lib/i18n/context"
import { adsApi } from "@/src/services/ads-api"
import { useState } from "react"
import { toEnglishLocaleString, toEnglishLocaleDateString } from "@/lib/utils"

interface AdCardProps {
  ad: Ad
  isArabic: boolean
}

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800"
    case "paused":
      return "bg-yellow-100 text-yellow-800"
    case "completed":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

function formatDate(dateString: string, isArabic: boolean) {
  return toEnglishLocaleDateString(dateString, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function AdCard({ ad, isArabic }: AdCardProps) {
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }

  const handleExportOne = async () => {
    try {
      setBusy(true)
      const blob = await adsApi.exportOne(ad.id, { format: "xlsx" })
      downloadBlob(blob, `ad-${ad.id}.xlsx`)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    try {
      setBusy(true)
      await adsApi.delete(ad.id)
      // Simple UX: reload page data; relying on parent refetch on route.
      window.location.reload()
    } finally {
      setBusy(false)
    }
  }
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{ad.title}</CardTitle>
            <p className="text-muted-foreground">{ad.productName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(ad.status)}>
              {ad.status === "active" ? t.active : ad.status === "paused" ? t.paused : ad.status === "completed" ? t.completed : ad.status}
            </Badge>
            <Button variant="ghost" size="sm">
              {ad.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExportOne} disabled={busy}>
              <FileDown className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDelete} disabled={busy}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{t.budgetUsed}</span>
            <span>
              ${ad.spent.toFixed(2)} / ${ad.budget.toFixed(2)}
            </span>
          </div>
          <Progress value={(ad.spent / ad.budget) * 100} className="h-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{toEnglishLocaleString(ad.impressions)}</p>
              <p className="text-xs text-muted-foreground">{t.impressions}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MousePointer className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{toEnglishLocaleString(ad.clicks)}</p>
              <p className="text-xs text-muted-foreground">{t.clicks}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{ad.conversions}</p>
              <p className="text-xs text-muted-foreground">{t.conversions}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{ad.ctr.toFixed(2)}%</p>
              <p className="text-xs text-muted-foreground">CTR</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">${ad.cpc.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">CPC</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(ad.startDate, isArabic)} - {formatDate(ad.endDate, isArabic)}
            </div>
            <div>{ad.targetCountries.join(", ")}</div>
          </div>
          <Button variant="outline" size="sm" className="bg-transparent">
            <BarChart3 className="h-4 w-4 mr-2" />
            {t.details}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


