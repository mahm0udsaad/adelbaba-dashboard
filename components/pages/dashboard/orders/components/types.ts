export interface OrderItem {
  productId: string
  productName: string
  sku: string
  qty: number
  unitPrice: number
  totalPrice: number
}

export interface Order {
  id: string
  number: string
  buyerCompany: string
  items: OrderItem[]
  currency: string
  total: number
  tradeAssurance: {
    enabled: boolean
    escrowStatus: string | null
    escrowAmount: number
  }
  shipping: {
    carrier: string | null
    tracking: string | null
    method: string | null
  }
  status: string
  priority: string
  paymentStatus: string
  createdAt: string
  updatedAt: string
}

export interface OrdersFiltersState {
  search: string
  status: string
}

