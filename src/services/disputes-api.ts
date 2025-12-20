import apiClient from "@/lib/axios"

export type DisputeStatus = "open" | "under_review" | "resolved" | "closed" | "withdrawn"

export interface DisputeOrder {
  id: number
  order_number: string
  created_at: string
  total: string
  shipment_status: string
  payment_status: string
  customer: {
    id: number
    name: string
    email: string
  }
}

export interface DisputeUser {
  id: number
  name: string
  picture: string
  email: string
  phone: string
}

export interface DisputeEvidence {
  id: number
  file_name: string
  size: string
  human_readable_size: string
  url: string
  type: string
}

export interface DisputeRecord {
  id: number
  chat_inbox_id: number
  reason: string
  description: string
  requested_action: string
  status: DisputeStatus
  resolved_at: string | null
  platform_decision: string | null
  created_at: string
  updated_at: string
  order: DisputeOrder
  user: DisputeUser
  evidence?: DisputeEvidence[]
}

export interface DisputesListParams {
  page?: number
  per_page?: number
  status?: DisputeStatus | "all"
}

export interface DisputesListResponse {
  data: DisputeRecord[]
  meta: {
    current_page: number
    last_page: number
    total: number
    per_page: number
  }
}

const BASE_URL = "/v1/company/disputes"

export async function listDisputes(params?: DisputesListParams): Promise<DisputesListResponse> {
  const queryParams = { ...params }
  if (queryParams.status === "all") delete queryParams.status
  
  const res = await apiClient.get(BASE_URL, { params: queryParams })
  return res.data
}

export async function showDispute(id: number | string): Promise<{ data: DisputeRecord }> {
  const res = await apiClient.get(`${BASE_URL}/${id}`)
  return res.data
}

export const disputesApi = {
  list: listDisputes,
  show: showDispute,
}
