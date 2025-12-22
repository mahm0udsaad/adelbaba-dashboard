"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Phone, MapPin, Calendar, ShoppingCart, DollarSign, MoreHorizontal } from "lucide-react"
import type { CRMContactItem } from "@/src/services/crm-api"
import { formatDate } from "./types"
import { useI18n } from "@/lib/i18n/context"
import { toEnglishLocaleString } from "@/lib/utils"

export function ContactCard({ contact }: { contact: CRMContactItem }) {
  const { t, isArabic } = useI18n()
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <img
                src={contact.customer.picture || "https://placehold.co/48x48/png?text=%20"}
                alt={contact.customer.name}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold text-lg">{contact.customer.name}</h3>
                <p className="text-muted-foreground">
                  {contact.customer.has_company && contact.customer.company_name ? contact.customer.company_name : ""}
                </p>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                {contact.customer.email}
              </div>
              {contact.customer.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {contact.customer.phone}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {contact.customer.has_company && contact.customer.company_name ? contact.customer.company_name : t.company}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {formatDate(contact.updated_at || contact.created_at || new Date().toISOString(), isArabic)}
              </div>
            </div>

            <div className="flex items-center gap-6 mb-3 flex-wrap">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{contact.placed_orders}</span>
                <span className="text-sm text-muted-foreground">{t.ordersLower}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">${toEnglishLocaleString(contact.total_spent)}</span>
                <span className="text-sm text-muted-foreground">{t.revenue}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t.paid || "Paid"}</span>
                <span className="font-medium">{contact.paid_orders}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t.rfqs || "RFQs"}</span>
                <span className="font-medium">{contact.rfqs_count}</span>
              </div>
            </div>

            {contact.tags && contact.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {contact.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Link href={`/dashboard/crm/${contact.id}`}>
              <Button variant="outline" size="sm" className="bg-transparent">
                {t.view}
              </Button>
            </Link>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


