import apiClient from "@/lib/axios"

export interface OrderProduct {
  id: number
  name: string
  sku: string
  image?: string
}

export interface OrderItem {
  id: number
  quantity: number
  price_per_unit: string
  customization: string | null
  product: OrderProduct
}

export interface OrderUser {
  id: number
  name: string
  email: string
  phone?: string
  picture?: string
}

export interface OrderListItem {
  id: number
  order_number: string
  status: string
  payment_status?: string
  shipment_status?: string
  total_amount: string
  created_at: string
  updated_at: string
  expires_at: string | null
  user: OrderUser
  items_count?: number
}

export interface OrderDetail extends OrderListItem {
  notes: string | null
  shipping: string | null
  tax: string | null
  items: OrderItem[]
}

export interface Payment {
  id: number
  currency: string
  amount: string
  status: string
  provider: string
  payment_number: string
  updated_at: string
  created_at: string
  user: OrderUser
}

export interface PaginatedResponse<T> {
  data: T[]
  links: {
    first?: string
    last?: string
    prev?: string | null
    next?: string | null
  }
  meta: {
    current_page?: number
    from?: number
    last_page?: number
    per_page?: number
    to?: number
    total?: number
    links?: Array<{
      url: string | null
      label: string
      active: boolean
    }>
    path?: string
  }
}

export interface CreateOrderData {
  order: {
    user_id: number
    notes?: string | null
    shipping?: number | null
    tax?: number | null
    expires_at: string
  }
  items: Array<{
    product_id: number
    sku_id: number
    quantity: number
    price_per_unit: number
    customization?: string
  }>
}

const BASE_URL = "/v1/company/orders"

export async function listOrders(params?: {
  page?: number
  payment_status?: string
  shipment_status?: string
  per_page?: number
  sort?: "asc" | "desc"
}): Promise<PaginatedResponse<OrderListItem>> {
  const res = await apiClient.get(BASE_URL, { params })
  return res.data
}

export async function createOrder(data: CreateOrderData): Promise<{ data: OrderDetail }> {
  const res = await apiClient.post(BASE_URL, data)
  return res.data
}

export async function getOrder(id: number | string): Promise<OrderDetail> {
  const res = await apiClient.get(`${BASE_URL}/${id}`)
  return res.data?.data || res.data
}

export async function updateOrderShipmentStatus(
  id: number | string,
  status: string
): Promise<{ message: string }> {
  const res = await apiClient.patch(`${BASE_URL}/${id}/status`, { status })
  return res.data
}

export async function getOrderInvoice(id: number | string): Promise<Blob> {
  const res = await apiClient.get(`${BASE_URL}/${id}/invoice`, {
    responseType: "blob",
  })
  return res.data
}

export async function listOrderPayments(params?: {
  page?: number
  status?: string
  per_page?: number
  sort?: "asc" | "desc"
}): Promise<PaginatedResponse<Payment>> {
  const res = await apiClient.get(`${BASE_URL}/payments`, { params })
  return res.data
}

export const ordersApi = {
  list: listOrders,
  create: createOrder,
  get: getOrder,
  updateShipmentStatus: updateOrderShipmentStatus,
  getInvoice: getOrderInvoice,
  listPayments: listOrderPayments,
}

