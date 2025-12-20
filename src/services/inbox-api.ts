import apiClient from "@/lib/axios"

export interface InboxThreadSummary {
  id: string | number
  subject?: string
  from_name?: string
  from_company?: string
  from_email?: string
  avatar_url?: string
  status?: "unread" | "read" | "replied" | "urgent" | string
  priority?: "high" | "medium" | "low" | string
  category?: "inquiry" | "order" | "support" | "general" | string
  created_at?: string
  last_reply_at?: string
  tags?: string[]
}

export interface InboxListResponse {
  data?: InboxThreadSummary[]
  [key: string]: unknown
}

export interface InboxMessageAttachment {
  name: string
  size?: string | number
  type?: string
  url?: string
}

export interface InboxMessageItem {
  id: string | number
  content: string
  sender: "buyer" | "supplier" | string
  timestamp: string
  attachments: InboxMessageAttachment[]
}

export interface InboxThreadMessagesResponse {
  data?: {
    id: string | number
    subject?: string
    messages: InboxMessageItem[]
  }
  [key: string]: unknown
}

const BASE = "/v1/company/inbox"

export const inboxApi = {
  async list(params?: Record<string, unknown>): Promise<InboxThreadSummary[]> {
    try {
      const res = await apiClient.get<InboxListResponse>(`${BASE}`, { params })
      const data = res.data as any
      // Handle Laravel style pagination { data: [...] } or direct array [...]
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
      return rows
    } catch (err) {
      console.error("Inbox API list error:", err)
      return []
    }
  },

  async getMessages(id: string | number): Promise<InboxMessageItem[]> {
    try {
      const res = await apiClient.get<InboxThreadMessagesResponse>(`${BASE}/${id}/messages`)
      const data = res.data as any
      // Handle { data: { messages: [...] } } or { messages: [...] } or direct array [...]
      const payload = data?.data ?? data
      const messages = Array.isArray(payload?.messages) ? payload.messages : Array.isArray(payload) ? payload : []
      return messages
    } catch (err) {
      console.error(`Inbox API getMessages error for id ${id}:`, err)
      return []
    }
  },

  async markRead(id: string | number): Promise<unknown> {
    const res = await apiClient.patch(`${BASE}/${id}/messages`)
    return res.data
  },

  async sendMessage(id: string | number, body: { type: string; content: string }): Promise<unknown> {
    const fd = new FormData()
    fd.append("type", body.type)
    fd.append("content", body.content)
    const res = await apiClient.post(`${BASE}/${id}/messages`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return res.data
  },
}

