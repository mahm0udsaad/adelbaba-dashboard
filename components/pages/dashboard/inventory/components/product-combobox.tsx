"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Image as ImageIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useIsMobile } from "@/hooks/use-mobile"

export type ProductOption = {
  id: number
  name: string
  image?: string | null
  sku?: string | null
}

type Props = {
  value?: ProductOption | null
  onChange: (next: ProductOption | null) => void
  options: ProductOption[]
  loading?: boolean
  disabled?: boolean

  label: string
  placeholder: string
  searchPlaceholder: string
  emptyText: string
  clearText: string
  dialogTitle: string
}

function ProductAvatar({ product }: { product: ProductOption }) {
  const fallback = (product.name || "").trim().slice(0, 1).toUpperCase() || "P"
  return (
    <Avatar className="h-8 w-8 rounded-md">
      {product.image ? <AvatarImage src={product.image} alt={product.name} /> : null}
      <AvatarFallback className="rounded-md text-[10px]">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
        <span className="sr-only">{fallback}</span>
      </AvatarFallback>
    </Avatar>
  )
}

function ProductRow({ product }: { product: ProductOption }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <ProductAvatar product={product} />
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{product.name}</div>
        {product.sku ? <div className="truncate text-xs text-muted-foreground font-mono">{product.sku}</div> : null}
      </div>
    </div>
  )
}

export function ProductCombobox({
  value,
  onChange,
  options,
  loading,
  disabled,
  label,
  placeholder,
  searchPlaceholder,
  emptyText,
  clearText,
  dialogTitle,
}: Props) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)

  const selected = value ? options.find((o) => o.id === value.id) ?? value : null
  const trigger = (
    <Button
      type="button"
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className="w-full justify-between h-12"
      disabled={disabled}
    >
      <div className="flex items-center gap-2 min-w-0">
        {selected ? <ProductAvatar product={selected} /> : null}
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected ? selected.name : placeholder}
        </span>
      </div>
      <ChevronsUpDown className="h-4 w-4 opacity-50" />
    </Button>
  )

  const list = (
    <Command shouldFilter>
      <CommandInput placeholder={searchPlaceholder} />
      <CommandList className="max-h-[50vh]">
        <CommandEmpty>{emptyText}</CommandEmpty>
        <CommandGroup>
          {options.map((p) => (
            <CommandItem
              key={p.id}
              value={`${p.name} ${p.sku ?? ""}`.trim()}
              onSelect={() => {
                onChange(p)
                setOpen(false)
              }}
              className="py-3"
            >
              <div className="flex items-center gap-2 w-full min-w-0">
                <Check className={cn("h-4 w-4", selected?.id === p.id ? "opacity-100" : "opacity-0")} />
                <ProductRow product={p} />
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        {selected ? (
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => onChange(null)}>
            {clearText}
          </Button>
        ) : null}
      </div>

      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>{trigger}</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="pb-2">
              <DrawerTitle>{dialogTitle}</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6">
              {loading ? (
                <div className="py-6 text-sm text-muted-foreground">{searchPlaceholder}</div>
              ) : (
                list
              )}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            {loading ? <div className="p-4 text-sm text-muted-foreground">{searchPlaceholder}</div> : list}
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}


