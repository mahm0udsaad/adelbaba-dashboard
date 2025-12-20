import apiClient from "@/lib/axios"

export interface AdsListParams {
  page?: number
  per_page?: number
  status?: string
}

export interface AdMedia {
  id?: number
  url?: string
}

export interface AdRecord {
  id: number
  title: string
  status: string
  banner_type?: string
  banner_location?: string
  target_url?: string
  starts_at: string
  ends_at: string
  budget_type: "daily" | "monthly"
  budget_amount: string | number
  spent_amount?: string | number
  target_keywords?: string[]
  target_id?: number
  target_type?: string
  created_at?: string
  updated_at?: string
  ctr?: number
  daily_budget?: number
  days_remaining?: number
  is_active?: boolean
  remaining_budget?: number
  clicks_count?: number | null
  impressions_count?: number | null
  media?: AdMedia[]
}

export interface AdsListResponse {
  data?: AdRecord[]
  links?: unknown
  meta?: unknown
}

const BASE_URL = "/v1/company/ads"

export async function listAds(params?: AdsListParams): Promise<AdsListResponse | { data: AdRecord[] }> {
  const res = await apiClient.get(BASE_URL, { params })
  return res.data
}

export async function showAd(id: number | string): Promise<{ data?: AdRecord } | AdRecord> {
  const res = await apiClient.get(`${BASE_URL}/${id}`)
  return res.data
}

export interface CreateAdPayload {
  ad_type: "banner" | "product"
  ad: {
    title: string
    banner_type?: "banner" | "slideshow"
    banner_location?: "header" | "footer"
    target_url?: string
    starts_at: string
    ends_at: string
    budget_type: "daily" | "monthly"
    budget_amount: number
    target_keywords: string[]
    product_id?: number
  }
  media?: File[]
}

export async function createAd(payload: CreateAdPayload): Promise<{ message: string; ad: AdRecord }> {
  // Build multipart form-data as per docs: media[] files with optional fields
  const isBanner = payload.ad_type === "banner"
  const fd = new FormData()
  // Send primitive fields directly (Laravel style) rather than nested JSON to avoid parsing issues
  fd.set("ad_type", payload.ad_type)
  fd.set("ad[title]", payload.ad.title)
  if (isBanner) {
    if (payload.ad.banner_type) fd.set("ad[banner_type]", payload.ad.banner_type)
    if (payload.ad.banner_location) fd.set("ad[banner_location]", payload.ad.banner_location)
    if (payload.ad.target_url) fd.set("ad[target_url]", payload.ad.target_url)
  }
  if (typeof payload.ad.product_id !== "undefined") {
    fd.set("ad[product_id]", String(payload.ad.product_id))
  }
  fd.set("ad[starts_at]", payload.ad.starts_at)
  fd.set("ad[ends_at]", payload.ad.ends_at)
  fd.set("ad[budget_type]", payload.ad.budget_type)
  fd.set("ad[budget_amount]", String(payload.ad.budget_amount))
  // Use [] array syntax for widest backend compatibility
  payload.ad.target_keywords.forEach((kw) => fd.append("ad[target_keywords][]", kw))

  payload.media?.forEach((file) => fd.append("media[]", file))

  const res = await apiClient.post(BASE_URL, fd, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  })
  return res.data
}

export async function deleteAd(id: number | string): Promise<void> {
  await apiClient.delete(`${BASE_URL}/${id}`)
}

export interface ExportParams {
  date_from?: string
  date_to?: string
  status?: "pending" | "active" | "in_active" | "finished"
  format: "csv" | "xlsx"
}

export async function exportAds(params: ExportParams): Promise<Blob> {
  const res = await apiClient.post(`${BASE_URL}/export`, params, { responseType: "blob" })
  return res.data
}

export async function exportAdReport(id: number | string, params: { date_from?: string; date_to?: string; format: "csv" | "xlsx" }): Promise<Blob> {
  const res = await apiClient.post(`${BASE_URL}/${id}/export`, params, { responseType: "blob" })
  return res.data
}

export const adsApi = {
  list: listAds,
  show: showAd,
  create: createAd,
  delete: deleteAd,
  exportAll: exportAds,
  exportOne: exportAdReport,
}


