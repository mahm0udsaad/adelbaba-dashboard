import apiClient from "@/lib/axios"

export interface CompanyContact {
  id?: string | number
  phone: string
  email: string
  is_primary: boolean | number
}

export interface CompanyUpdatePayload {
  logo?: File
  description?: string
  contacts: CompanyContact[]
}

// Alias for backward compatibility with existing hooks
export type CompanyUpdateData = CompanyUpdatePayload

export interface FactoryImage {
  id: number
  file_name: string
  size: string
  human_readable_size: string
  url: string
  type: string
}

export interface FactoryImagesResponse {
  data: FactoryImage[]
}

const BASE_URL = "/v1/company"

export const companyApi = {
  async getCompany(): Promise<any> {
    const res = await apiClient.get(BASE_URL)
    return res.data?.data || res.data
  },

  async updateProfile(payload: CompanyUpdatePayload): Promise<{ message: string }> {
    const fd = new FormData()
    fd.append("_method", "PUT")
    
    if (payload.logo) {
      fd.append("logo", payload.logo)
    }
    
    if (payload.description) {
      fd.append("description", payload.description)
    }
    
    payload.contacts.forEach((contact, idx) => {
      if (contact.id) fd.append(`contacts[${idx}][id]`, String(contact.id))
      fd.append(`contacts[${idx}][phone]`, contact.phone)
      fd.append(`contacts[${idx}][email]`, contact.email)
      fd.append(`contacts[${idx}][is_primary]`, contact.is_primary ? "1" : "0")
    })

    const res = await apiClient.post(`${BASE_URL}/update`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return res.data
  },

  // Alias for backward compatibility
  async updateCompany(data: CompanyUpdateData): Promise<any> {
    await this.updateProfile(data)
    return this.getCompany()
  },

  async getFactoryImages(): Promise<FactoryImagesResponse> {
    const res = await apiClient.get(`${BASE_URL}/factory`)
    return res.data
  },

  async updateFactoryImages(payload: { 
    add?: File[], 
    remove?: (string | number)[] 
  }): Promise<{ message: string }> {
    const fd = new FormData()
    
    if (payload.add && payload.add.length > 0) {
      payload.add.forEach((file) => fd.append("media[add][]", file))
    }
    
    if (payload.remove && payload.remove.length > 0) {
      payload.remove.forEach((id) => fd.append("media[remove][]", String(id)))
    }

    const res = await apiClient.post(`${BASE_URL}/factory`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return res.data
  }
}

// Export as CompanyApiService for backward compatibility with use-company hook
export const CompanyApiService = companyApi
