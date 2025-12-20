"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/context"
import { CompanyContact } from "@/src/services/company-api"
import { Plus, Trash2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ContactsManagerProps {
  contacts: CompanyContact[]
  onChange: (contacts: CompanyContact[]) => void
}

export function ContactsManager({ contacts, onChange }: ContactsManagerProps) {
  const { t } = useI18n()

  const addContact = () => {
    onChange([...contacts, { phone: "", email: "", is_primary: contacts.length === 0 }])
  }

  const removeContact = (idx: number) => {
    const newContacts = contacts.filter((_, i) => i !== idx)
    // Ensure at least one primary if we have contacts
    if (contacts[idx].is_primary && newContacts.length > 0) {
      newContacts[0].is_primary = true
    }
    onChange(newContacts)
  }

  const updateContact = (idx: number, field: keyof CompanyContact, value: any) => {
    const newContacts = contacts.map((c, i) => {
      if (i === idx) {
        return { ...c, [field]: value }
      }
      if (field === "is_primary" && value === true) {
        return { ...c, is_primary: false }
      }
      return c
    })
    onChange(newContacts)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t.manageContacts}</h3>
        <Button type="button" variant="outline" size="sm" onClick={addContact}>
          <Plus className="h-4 w-4 mr-2" />
          {t.addContact}
        </Button>
      </div>

      <div className="grid gap-4">
        {contacts.map((contact, idx) => (
          <Card key={idx} className={cn(contact.is_primary && "border-primary bg-primary/5")}>
            <CardContent className="p-4 relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.phone}</Label>
                  <Input
                    value={contact.phone}
                    onChange={(e) => updateContact(idx, "phone", e.target.value)}
                    placeholder="+1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.email}</Label>
                  <Input
                    type="email"
                    value={contact.email}
                    onChange={(e) => updateContact(idx, "email", e.target.value)}
                    placeholder="email@company.com"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <Button
                  type="button"
                  variant={contact.is_primary ? "default" : "ghost"}
                  size="sm"
                  onClick={() => updateContact(idx, "is_primary", true)}
                  className={cn(!contact.is_primary && "text-muted-foreground")}
                >
                  <CheckCircle2 className={cn("h-4 w-4 mr-2", contact.is_primary ? "text-white" : "text-muted-foreground")} />
                  {t.isPrimary}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeContact(idx)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

