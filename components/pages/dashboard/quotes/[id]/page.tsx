"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  FileText,
  DollarSign,
  Clock,
  Calendar,
  Download,
  AlertCircle,
  Building,
  Mail,
  Phone,
  MapPin,
} from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"
import { getQuote, withdrawQuote, type QuoteListItem, type QuoteAttachment } from "@/src/services/quotes-api"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useI18n } from "@/lib/i18n/context"
import { toEnglishLocaleString, toEnglishLocaleDateString } from "@/lib/utils"

const statusColors = {
  Submitted: "bg-blue-100 text-blue-800 border-blue-200",
  Withdrawn: "bg-gray-100 text-gray-800 border-gray-200",
  Awarded: "bg-green-100 text-green-800 border-green-200",
  Rejected: "bg-red-100 text-red-800 border-red-200",
}

interface QuoteWithAttachments extends QuoteListItem {
  attachments?: QuoteAttachment[]
}

export default function QuoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [quote, setQuote] = useState<QuoteWithAttachments | null>(null)
  const [loading, setLoading] = useState(true)
  const { t, formatMessage } = useI18n()

  useEffect(() => {
    fetchQuoteDetails()
  }, [params.id])

  const fetchQuoteDetails = async () => {
    try {
      setLoading(true)
      const response = await getQuote(params.id as string)
      const quoteData = 'data' in response ? response.data : response
      
      if (quoteData) {
        setQuote(quoteData as QuoteWithAttachments)
      } else {
        setQuote(null)
      }
    } catch (error) {
      console.error("Failed to fetch quote details:", error)
      toast({
        title: t.error,
        description: t.quoteLoadError,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!quote) return

    try {
      await withdrawQuote(quote.id)
      toast({
        title: t.quoteWithdrawSuccessTitle,
        description: t.quoteWithdrawSuccessDescription,
      })
      
      // Update local state
      setQuote((prev) => prev ? { ...prev, status: "Withdrawn", withdrawn_at: new Date().toISOString() } : null)
    } catch (error: any) {
      console.error("Error withdrawing quote:", error)
      toast({
        title: t.error,
        description: error?.response?.data?.message || error?.message || t.quoteWithdrawError,
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-muted-foreground">{t.quoteNotFound}</h2>
        <Link href="/dashboard/quotes">
          <Button className="mt-4" variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.quoteBackToQuotes}
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/quotes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.back}
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t.quoteLabel} #{quote.id}
            </h1>
            <p className="text-muted-foreground">
              {t.quoteSubmittedFor} {quote.rfq.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            className={
              statusColors[quote.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800 border-gray-200"
            }
          >
            {quote.status}
          </Badge>
          {quote.status === "Submitted" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {t.quoteWithdrawButton}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t.quoteWithdrawConfirmTitle}</AlertDialogTitle>
                  <AlertDialogDescription>{t.quoteWithdrawConfirmDescription}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleWithdraw}>
                    {t.quoteWithdrawButton}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quote Details */}
          <Card>
            <CardHeader>
              <CardTitle>{t.quoteDetailsTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">{t.quoteMessageLabel}</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{quote.message}</p>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t.quoteCurrencyLabel}</p>
                    <p className="text-sm text-muted-foreground">{quote.currency}</p>
                  </div>
                </div>

                {quote.lead_time_days > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{t.quoteLeadTimeLabel}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatMessage("quoteLeadTimeValue", { days: quote.lead_time_days })}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t.quoteSubmittedAt}</p>
                    <p className="text-sm text-muted-foreground">
                      {toEnglishLocaleDateString(quote.submitted_at, { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </div>
                </div>

                {quote.withdrawn_at && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{t.quoteWithdrawnAt}</p>
                      <p className="text-sm text-muted-foreground">
                        {toEnglishLocaleDateString(quote.withdrawn_at, { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          {quote.attachments && quote.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t.quoteAttachmentsTitle}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {quote.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{attachment.file_name}</p>
                          <p className="text-xs text-muted-foreground">{attachment.human_readable_size}</p>
                        </div>
                      </div>
                      <a href={attachment.url} target="_blank" rel="noopener noreferrer" download>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          {t.download}
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* RFQ Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t.quoteRfqInformationTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">{t.quoteRfqTitleLabel}</p>
                <p className="text-sm text-muted-foreground">{quote.rfq.title}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium">{t.quoteRfqDescriptionLabel}</p>
                <p className="text-sm text-muted-foreground line-clamp-3">{quote.rfq.description}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium">{t.quoteRfqStatusLabel}</p>
                <Badge className="mt-1">{quote.rfq.status}</Badge>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-1">{t.quoteRfqDatesLabel}</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    {t.quoteRfqCreatedLabel} {toEnglishLocaleDateString(quote.rfq.created_at)}
                  </p>
                  <p>
                    {t.quoteRfqUpdatedLabel} {toEnglishLocaleDateString(quote.rfq.updated_at)}
                  </p>
                </div>
              </div>

              <Link href={`/dashboard/rfq/${quote.rfq.id}`} className="block">
                <Button className="w-full mt-4" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  {t.quoteViewRfqDetails}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t.quickActions}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/dashboard/quotes">
                <Button variant="outline" className="w-full bg-transparent">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t.quoteBackToQuotes}
                </Button>
              </Link>
              <Link href="/dashboard/rfq">
                <Button variant="outline" className="w-full bg-transparent">
                  <FileText className="h-4 w-4 mr-2" />
                  {t.quotesBrowseRfqs}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
