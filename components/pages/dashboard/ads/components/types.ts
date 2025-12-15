export interface Ad {
  id: string
  title: string
  productId: string
  productName: string
  type: string
  status: "active" | "paused" | "completed"
  budget: number
  spent: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  cpc: number
  startDate: string
  endDate: string
  targetCountries: string[]
  targetKeywords: string[]
}

export interface NewAdFormState {
  title: string
  budget: string
  startDate: string
  endDate: string
  targetCountries: string
  targetKeywords: string[]
}

