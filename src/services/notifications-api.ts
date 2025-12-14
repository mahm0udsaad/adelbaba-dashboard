import apiClient from "@/lib/axios"

export interface Notification {
  id: string
  type?: string
  data?: Record<string, any>
  read_at?: string | null
  created_at?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  links: unknown
  meta: {
    current_page?: number
    last_page?: number
    per_page?: number
    total?: number
  }
}

const BASE_URL = "/v1/company/notifications"

export async function listNotifications(params?: {
  page?: number
}): Promise<PaginatedResponse<Notification>> {
  const res = await apiClient.get(BASE_URL, { params })
  return res.data
}

export async function sendNotification(data: {
  title: string
  message: string
  type?: string
  recipients?: number[]
}): Promise<{ message: string }> {
  const res = await apiClient.post(`${BASE_URL}/send`, data)
  return res.data
}

export const notificationsApi = {
  list: listNotifications,
  send: sendNotification,
}

