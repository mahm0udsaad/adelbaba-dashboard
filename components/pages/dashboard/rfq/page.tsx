"use client"

import { useCallback, useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Search, Filter, Eye, DollarSign, TrendingUp, RefreshCw } from "lucide-react"
import { RFQCard } from "./RFQCard"
import Link from "next/link"
import { useApiWithFallback } from "@/hooks/useApiWithFallback"
import { listQuotes, withdrawQuote } from "@/src/services/quotes-api"
import { listMarketRFQs, getDashboardMetrics, type RFQListItem, type RFQFilters } from "@/src/services/rfq-api"
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { toast } from "@/hooks/use-toast"
import { useI18n } from "@/lib/i18n/context"

// Dashboard metrics interface
interface DashboardMetrics {
  openRFQs: number
  quotesSubmitted: number
  awarded: number
  winRate: number
}

// Helper function to normalize API data to display format
const normalizeRFQ = (rfq: RFQListItem): RFQListItem & { 
  buyerCompany: string;
  category: string;
  targetQty: number;
  targetPrice: number;
  quotesCount: number;
  viewsCount: number;
} => {
  return {
    ...rfq,
    buyerCompany: rfq.buyer_company || "",
    category: rfq.category || "",
    targetQty: rfq.target_qty || 0,
    targetPrice: rfq.target_price || 0,
    quotesCount: rfq.quotes_count || 0,
    viewsCount: rfq.views_count || 0,
  }
}

const statusColors = {
  open: "bg-green-100 text-green-800 border-green-200",
  quoted: "bg-blue-100 text-blue-800 border-blue-200",
  awarded: "bg-purple-100 text-purple-800 border-purple-200",
  closed: "bg-gray-100 text-gray-800 border-gray-200",
  expired: "bg-red-100 text-red-800 border-red-200",
}

const priorityColors = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
}

export default function RFQPage() {
  // State for filters and pagination
  const [filters, setFilters] = useState<RFQFilters & { match: boolean }>({
    q: "",
    status: "", // empty means all
    category_id: "", // empty means all
    page: 1,
    per_page: 10,
    match: true,
  })
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics>({
    openRFQs: 0,
    quotesSubmitted: 0,
    awarded: 0,
    winRate: 0
  })
  const [metricsLoading, setMetricsLoading] = useState(false)
  const { t, formatMessage } = useI18n()

  // Fetch dashboard metrics
  const fetchDashboardMetrics = useCallback(async () => {
    setMetricsLoading(true)
    try {
      const metrics = await getDashboardMetrics()
      setDashboardMetrics(metrics)
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error)
      toast({
        title: t.error,
        description: t.rfqMetricsError,
        variant: "destructive",
      })
    } finally {
      setMetricsLoading(false)
    }
  }, [t])

  // Load metrics on component mount
  useEffect(() => {
    fetchDashboardMetrics()
  }, [])

  // RFQ listing (API)
  const fetchRFQs = useCallback(() => {
    const apiFilters: RFQFilters = {
      page: filters.page,
      per_page: filters.per_page,
    }
    
    if (filters.q?.trim()) apiFilters.q = filters.q.trim()
    if (filters.status) apiFilters.status = filters.status
    if (filters.category_id) apiFilters.category_id = filters.category_id
    
    return listMarketRFQs(apiFilters)
  }, [filters])
  
  const fallbackRFQs = useCallback(
    async () => ({
      data: [],
      links: {},
      meta: { current_page: 1, last_page: 1, per_page: 10, total: 0, from: null, to: null },
    }),
    []
  )
  
  const { data: rfqResponse, loading: rfqLoading, refetch: refetchRFQs } = useApiWithFallback({
    fetcher: fetchRFQs,
    fallback: fallbackRFQs,
    deps: [filters],
  })

  // Quotes listing (API)
  const [quotesPage, setQuotesPage] = useState<number>(1)
  const fetchQuotes = useCallback(() => listQuotes({ page: quotesPage }), [quotesPage])
  const fallbackQuotes = useCallback(
    async () => ({
      data: [],
      links: {},
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 0, from: null, to: null },
    }),
    []
  )
  const { data: quotesResponse, loading: quotesLoading, refetch: refetchQuotes, setData: setQuotesResponse } = useApiWithFallback({
    fetcher: fetchQuotes,
    fallback: fallbackQuotes,
    deps: [quotesPage],
  })

  // Process RFQ data from API
  const processedRFQs = useMemo(() => {
    if (!rfqResponse || !rfqResponse.data) return []
    return rfqResponse.data.map(normalizeRFQ)
  }, [rfqResponse])

  // Handle filter changes - this will trigger API refetch
  const handleFilterChange = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ 
      ...prev, 
      ...newFilters,
      page: newFilters.page !== undefined ? newFilters.page : 1 // Reset to page 1 for new filters
    }))
  }, [])

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

    if (days < 0) return t.expired
    if (days === 0) return t.expiresToday
    if (days === 1) return t.expiresTomorrow
    return formatMessage("expiresInDays", { days })
  }

  // Refresh quotes when a new quote is submitted
  const handleQuoteSubmitted = useCallback(() => {
    refetchQuotes()
    fetchDashboardMetrics() // Also refresh metrics
  }, [refetchQuotes, fetchDashboardMetrics])

  return (
    <div className="p-4 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t.rfqs}</h1>
        <p className="text-muted-foreground">{t.rfqSubtitle}</p>
      </div>

      {/* My Quotes (from API) */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t.quotes}</CardTitle>
        </CardHeader>
        <CardContent>
          {quotesLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : !quotesResponse || (Array.isArray(quotesResponse.data) && quotesResponse.data.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-6">
              <FileText className="h-10 w-10 text-muted-foreground mb-2" />
              <div className="text-sm text-muted-foreground">
                {t.quotesEmptyTitle}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Quotes list */}
              <div className="grid gap-3">
                {quotesResponse.data.map((q: any) => (
                  <div key={q.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium">#{q.id}</span>
                      {q.status && (
                        <Badge variant="outline">{q.status}</Badge>
                      )}
                      {q.currency && (
                        <span className="text-muted-foreground">{q.currency}</span>
                      )}
                      {q.created_at && (
                        <span className="text-muted-foreground">{new Date(q.created_at).toLocaleDateString()}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/rfq/${q.rfq?.id ?? ""}`}>
                        <Button size="sm" variant="outline" className="bg-transparent">
                          <Eye className="h-4 w-4 mr-2" />
                          {t.quoteViewRfq}
                        </Button>
                      </Link>
                      {q.status?.toLowerCase() !== "withdrawn" && q.status?.toLowerCase() !== "awarded" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            try {
                              await withdrawQuote(q.id)
                              toast({ 
                                title: t.quoteWithdrawSuccessTitle,
                                description: t.quoteWithdrawSuccessDescription,
                              })
                              // Optimistic update and refresh metrics
                              setQuotesResponse((prev: any) => {
                                if (!prev) return prev
                                const next = { ...prev, data: prev.data.map((it: any) => (it.id === q.id ? { ...it, status: "Withdrawn" } : it)) }
                                return next
                              })
                              // Refresh dashboard metrics
                              fetchDashboardMetrics()
                            } catch (err: any) {
                              console.error('Error withdrawing quote:', err)
                              toast({ 
                                title: t.error,
                                description: err?.response?.data?.message || err?.message || t.quoteWithdrawError,
                                variant: "destructive" 
                              })
                            }
                          }}
                          disabled={metricsLoading}
                        >
                          {t.quoteWithdraw}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {quotesResponse.meta && quotesResponse.meta.last_page && quotesResponse.meta.last_page > 1 && (
                <Pagination className="mt-2">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={(e) => {
                          e.preventDefault()
                          if ((quotesResponse.meta.current_page || 1) > 1) setQuotesPage((p) => p - 1)
                        }}
                        href="#"
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        {(quotesResponse.meta.from ?? 0) === null && (quotesResponse.meta.to ?? 0) === null
                          ? t.noResults
                          : `${quotesResponse.meta.from ?? 0}-${quotesResponse.meta.to ?? 0} / ${quotesResponse.meta.total ?? 0}`}
                      </div>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        onClick={(e) => {
                          e.preventDefault()
                          const current = quotesResponse.meta.current_page || 1
                          const last = quotesResponse.meta.last_page || 1
                          if (current < last) setQuotesPage((p) => p + 1)
                        }}
                        href="#"
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">{t.rfqStatsOpen}</CardTitle>
            <FileText className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-white">
                {metricsLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  dashboardMetrics.openRFQs
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={fetchDashboardMetrics}
                disabled={metricsLoading}
                className="h-6 w-6 p-0 text-white hover:bg-blue-600"
              >
                <RefreshCw className={`h-3 w-3 ${metricsLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">{t.rfqStatsSubmitted}</CardTitle>
            <TrendingUp className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metricsLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                dashboardMetrics.quotesSubmitted
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">{t.rfqStatsAwarded}</CardTitle>
            <DollarSign className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metricsLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                dashboardMetrics.awarded
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">{t.rfqStatsWinRate}</CardTitle>
            <TrendingUp className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metricsLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                `${dashboardMetrics.winRate}%`
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t.searchAndFilter}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.rfqSearchPlaceholder}
                value={filters.q || ""}
                onChange={(e) => handleFilterChange({ q: e.target.value })}
                className="pl-10"
              />
            </div>

            <Select value={filters.status || "all"} onValueChange={(value) => handleFilterChange({ status: value === "all" ? "" : value })}>
              <SelectTrigger>
                <SelectValue placeholder={t.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allStatus}</SelectItem>
                <SelectItem value="open">{t.open}</SelectItem>
                <SelectItem value="quoted">{t.quoted}</SelectItem>
                <SelectItem value="awarded">{t.awarded}</SelectItem>
                <SelectItem value="expired">{t.expired}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.category_id || "all"} onValueChange={(value) => handleFilterChange({ category_id: value === "all" ? "" : value })}>
              <SelectTrigger>
                <SelectValue placeholder={t.category} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allCategories}</SelectItem>
                <SelectItem value="1">{t.electronics}</SelectItem>
                <SelectItem value="2">{t.textiles}</SelectItem>
                <SelectItem value="3">{t.homeKitchen}</SelectItem>
                <SelectItem value="4">{t.construction || "Construction"}</SelectItem>
                <SelectItem value="5">{t.packaging || "Packaging"}</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={filters.match ? "default" : "outline"}
              onClick={() => handleFilterChange({ match: !filters.match })}
              className="bg-transparent"
            >
              {t.rfqMatchingOnly}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* RFQ List */}
      <div className="space-y-4">
        {rfqLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : processedRFQs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">
                {t.rfqEmptyTitle}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t.rfqEmptyDescription}
              </p>
              <Button 
                onClick={() => refetchRFQs()} 
                variant="outline" 
                className="mt-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t.refresh}
              </Button>
            </CardContent>
          </Card>
        ) : (
          processedRFQs.map((rfq) => {
            const expiresAt = rfq.expires_at
            return (
              <RFQCard
                key={rfq.id}
                rfq={rfq as any}
                expiresAt={expiresAt}
                quotesResponse={quotesResponse as any}
                onWithdraw={async (quoteId: number) => {
                  try {
                    await withdrawQuote(quoteId)
                    toast({
                      title: t.quoteWithdrawSuccessTitle,
                      description: t.quoteWithdrawSuccessDescription,
                    })
                    refetchQuotes()
                    fetchDashboardMetrics()
                  } catch (err: any) {
                    console.error("Error withdrawing quote:", err)
                    toast({
                      title: t.error,
                      description: err?.response?.data?.message || err?.message || t.quoteWithdrawError,
                      variant: "destructive",
                    })
                  }
                }}
              />
            )
          })
        )}
        
        {/* Pagination for RFQs */}
        {rfqResponse && rfqResponse.meta && rfqResponse.meta.last_page && rfqResponse.meta.last_page > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={(e) => {
                    e.preventDefault()
                    const currentPage = rfqResponse.meta?.current_page || 1
                    if (currentPage > 1) {
                      handleFilterChange({ page: currentPage - 1 })
                    }
                  }}
                  href="#"
                />
              </PaginationItem>
              <PaginationItem>
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  {rfqResponse.meta.from === null && rfqResponse.meta.to === null
                    ? t.noResults
                    : `${rfqResponse.meta.from || 0}-${rfqResponse.meta.to || 0} / ${rfqResponse.meta.total || 0}`}
                </div>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={(e) => {
                    e.preventDefault()
                    const currentPage = rfqResponse.meta?.current_page || 1
                    const lastPage = rfqResponse.meta?.last_page || 1
                    if (currentPage < lastPage) {
                      handleFilterChange({ page: currentPage + 1 })
                    }
                  }}
                  href="#"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  )
}
