"use client"

export interface Contact {
  id: string
  name: string
  company: string
  email: string
  phone: string
  country: string
  status: "active" | "prospect" | "inactive"
  lastContact: string
  totalOrders: number
  totalRevenue: number
  tags: string[]
  notes: string
}

export interface NewContactFormData {
  name: string
  company: string
  email: string
  phone: string
  country: string
  status: "prospect" | "active" | "inactive"
  notes: string
  tags: string
}

export const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800"
    case "prospect":
      return "bg-blue-100 text-blue-800"
    case "inactive":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

import { toEnglishLocaleDateString } from "@/lib/utils"

export const formatDate = (dateString: string, isArabic: boolean) => {
  return toEnglishLocaleDateString(dateString, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}


