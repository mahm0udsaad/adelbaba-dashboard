"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination } from "@/components/ui/pagination"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  InventoryOperationType,
  listInventoryHistory,
  listWarehouses,
  InventoryHistoryItem,
  Warehouse,
} from "@/src/services/inventory-api"
import { useI18n } from "@/lib/i18n/context"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function MovementsPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [skuId, setSkuId] = useState<string>("")
  const [warehouseId, setWarehouseId] = useState<string | undefined>(undefined)
  const [history, setHistory] = useState<{ data: InventoryHistoryItem[]; meta?: any } | null>(null)
  const [loading, setLoading] = useState(false)
  const { t } = useI18n()
  const router = useRouter()

  const openOperatePage = () => {
    router.push("/dashboard/inventory/operate?type=receive")
  }

  useEffect(() => { listWarehouses().then((r) => setWarehouses(r.data || [])) }, [])

  const params = useMemo(() => ({ sku_id: skuId ? Number(skuId) : undefined, warehouse_id: warehouseId ? Number(warehouseId) : undefined, per_page: 15 }), [skuId, warehouseId])
  
  const fetchHistory = () => {
    setLoading(true)
    listInventoryHistory(params)
      .then((r) => setHistory(r))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchHistory()
  }, [params])

  const operationLabels: Record<InventoryOperationType, string> = {
    receive: t.inventoryOperationReceive || "Receive",
    ship: t.inventoryOperationShip || "Ship",
    reserve: t.inventoryOperationReserve || "Reserve",
    release_reservation: t.inventoryOperationRelease || "Release",
    adjust: t.inventoryOperationAdjust || "Adjust",
    count: t.inventoryOperationCount || "Count",
    return: t.inventoryOperationReturn || "Return",
    damage: t.inventoryOperationDamage || "Damage",
    loss: t.inventoryOperationLoss || "Loss",
    transfer: t.inventoryOperationTransfer || "Transfer",
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t.inventoryMovementsTitle || "Inventory Movements"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Input placeholder={t.inventorySkuPlaceholder || "Filter by SKU ID"} value={skuId} onChange={(e) => setSkuId(e.target.value)} />
            <Select value={warehouseId ?? "all"} onValueChange={(v) => setWarehouseId(v === "all" ? undefined : v)}>
              <SelectTrigger>
                <SelectValue placeholder={t.inventoryAllWarehousesOption || "All Warehouses"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.inventoryAllWarehousesOption || "All Warehouses"}</SelectItem>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.inventoryTypeHeader || "Type"}</TableHead>
                  <TableHead>{t.inventoryQuantityHeader || "Qty"}</TableHead>
                  <TableHead>{t.inventoryReservedDeltaHeader || "Reserved Δ"}</TableHead>
                  <TableHead>{t.inventoryOnHandDeltaHeader || "On Hand Δ"}</TableHead>
                  <TableHead>{t.inventoryAtHeader || "Date"}</TableHead>
                  <TableHead>{t.inventoryWarehouseHeader || "Warehouse"}</TableHead>
                  <TableHead className="text-right">{t.inventoryActionsHeader || "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-4"><Loader2 className="animate-spin inline mr-2"/>Loading...</TableCell></TableRow>
                ) : (history?.data || []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Badge variant="secondary">{operationLabels[row.type as InventoryOperationType] || row.type}</Badge>
                    </TableCell>
                    <TableCell>{row.quantity}</TableCell>
                    <TableCell className={row.reserved_delta > 0 ? "text-blue-600" : ""}>{row.reserved_delta}</TableCell>
                    <TableCell className={row.on_hand_delta > 0 ? "text-green-600" : row.on_hand_delta < 0 ? "text-red-600" : ""}>{row.on_hand_delta}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{row.warehouse?.name}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={openOperatePage}>
                        {t.inventoryOperateButton || "Operate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && (!history?.data || history.data.length === 0) && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No movements found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination />
        </CardContent>
      </Card>
    </div>
  )
}

