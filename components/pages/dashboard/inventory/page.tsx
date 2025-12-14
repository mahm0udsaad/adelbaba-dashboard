"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useI18n } from "@/lib/i18n/context"
import {
  InventoryOperationType,
  listInventoryLevels,
  listInventoryHistory,
  listWarehouses,
  operateInventory,
  listLowStock,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  InventoryLevel,
  InventoryHistoryItem,
  LowStockItem,
  Warehouse
} from "@/src/services/inventory-api"
import { 
  Loader2, 
  Package, 
  AlertTriangle, 
  ArrowRightLeft, 
  Warehouse as WarehouseIcon,
  TrendingDown,
  TrendingUp,
  Search,
  Plus,
  RefreshCw,
  PackagePlus,
  PackageMinus,
  RotateCcw,
  Boxes,
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  Building2,
  ChevronRight
} from "lucide-react"

// Operation type labels and icons for better UX
const operationConfig: Record<InventoryOperationType, { label: string; icon: typeof Package; color: string }> = {
  receive: { label: "Receive Stock", icon: PackagePlus, color: "text-green-600 bg-green-50 border-green-200" },
  ship: { label: "Ship Out", icon: PackageMinus, color: "text-blue-600 bg-blue-50 border-blue-200" },
  reserve: { label: "Reserve", icon: Clock, color: "text-orange-600 bg-orange-50 border-orange-200" },
  release_reservation: { label: "Release Reserved", icon: RotateCcw, color: "text-purple-600 bg-purple-50 border-purple-200" },
  adjust: { label: "Adjust Stock", icon: RefreshCw, color: "text-gray-600 bg-gray-50 border-gray-200" },
  count: { label: "Stock Count", icon: Boxes, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  return: { label: "Return", icon: RotateCcw, color: "text-teal-600 bg-teal-50 border-teal-200" },
  damage: { label: "Damaged", icon: AlertCircle, color: "text-red-600 bg-red-50 border-red-200" },
  loss: { label: "Loss", icon: AlertTriangle, color: "text-red-600 bg-red-50 border-red-200" },
  transfer: { label: "Transfer", icon: ArrowRightLeft, color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
}

// Warehouse form type
type WarehouseForm = {
  name: string
  address?: string
  region_id?: number
  state_id?: number
  city_id?: number
  code: string
  manager_name?: string
  manager_email?: string
  manager_phone?: string
  storage_capacity: number
  is_active?: boolean
}

type WarehouseFormErrors = {
  name?: string
  code?: string
  storage_capacity?: string
  general?: string
}

const initialWarehouseForm: WarehouseForm = {
  name: "",
  address: "",
  code: "",
  manager_name: "",
  manager_email: "",
  manager_phone: "",
  storage_capacity: 1000, // Default to 1000 units
  is_active: true,
}

// Generate a warehouse code suggestion
const generateWarehouseCode = () => {
  const prefix = "WH"
  const random = Math.floor(100000 + Math.random() * 900000)
  return `${prefix}-${random}`
}

export default function InventoryPage() {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<string>("overview")
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [warehousesLoading, setWarehousesLoading] = useState(false)

  // Overview stats
  const [overviewStats, setOverviewStats] = useState<{
    totalProducts: number
    lowStockCount: number
    totalOnHand: number
    totalReserved: number
  }>({ totalProducts: 0, lowStockCount: 0, totalOnHand: 0, totalReserved: 0 })

  // Stock Levels state
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all")
  const [search, setSearch] = useState<string>("")
  const [levels, setLevels] = useState<{ data: InventoryLevel[]; meta?: any } | null>(null)
  const [levelsLoading, setLevelsLoading] = useState(false)

  // Low Stock state
  const [lowStock, setLowStock] = useState<{ data: LowStockItem[]; meta?: any } | null>(null)
  const [lowStockLoading, setLowStockLoading] = useState(false)

  // Movements/History state
  const [historySkuId, setHistorySkuId] = useState<string>("")
  const [historyWarehouseId, setHistoryWarehouseId] = useState<string | undefined>(undefined)
  const [history, setHistory] = useState<{ data: InventoryHistoryItem[]; meta?: any } | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  // Warehouse CRUD state
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [warehouseForm, setWarehouseForm] = useState<WarehouseForm>(initialWarehouseForm)
  const [warehouseFormErrors, setWarehouseFormErrors] = useState<WarehouseFormErrors>({})
  const [warehouseSaving, setWarehouseSaving] = useState(false)

  // Operate sheet state
  const [operateOpen, setOperateOpen] = useState(false)
  const [operateForm, setOperateForm] = useState<{
    sku_id?: number
    product_name?: string
    warehouse_id?: number
    type: InventoryOperationType
    quantity: number
    notes?: string
    to_warehouse_id?: number
  }>({ type: "receive", quantity: 1 })
  const [operating, setOperating] = useState(false)

  // Products for search (from levels)
  const [allProducts, setAllProducts] = useState<Array<{ id: number; sku: string; name: string }>>([])

  // Initialize from URL params
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab && ["overview", "levels", "low-stock", "movements", "warehouses"].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Fetch warehouses
  const fetchWarehouses = useCallback(async () => {
    setWarehousesLoading(true)
    try {
      const res = await listWarehouses()
      setWarehouses(res.data || [])
    } catch (e) {
      console.error("Failed to fetch warehouses:", e)
      setWarehouses([])
    } finally {
      setWarehousesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWarehouses()
  }, [fetchWarehouses])

  // Fetch inventory levels
  const levelsParams = useMemo(() => ({ 
    warehouses: selectedWarehouse === "all" ? undefined : selectedWarehouse, 
    per_page: 50 
  }), [selectedWarehouse])
  
  const fetchLevels = useCallback(async () => {
    setLevelsLoading(true)
    try {
      const res = await listInventoryLevels(levelsParams)
      setLevels(res)
      // Extract products for operate sheet search
      const products = (res.data || []).map(l => l.product).filter(Boolean)
      setAllProducts(products)
      // Calculate overview stats
      const totalProducts = res.meta?.total || res.data?.length || 0
      const totalOnHand = res.data?.reduce((sum, l) => sum + l.on_hand, 0) || 0
      const totalReserved = res.data?.reduce((sum, l) => sum + l.reserved, 0) || 0
      setOverviewStats(prev => ({ ...prev, totalProducts, totalOnHand, totalReserved }))
    } catch (e) {
      console.error("Failed to fetch levels:", e)
    } finally {
      setLevelsLoading(false)
    }
  }, [levelsParams])

  // Fetch low stock
  const fetchLowStock = useCallback(async () => {
    setLowStockLoading(true)
    try {
      const res = await listLowStock(levelsParams)
      setLowStock(res)
      setOverviewStats(prev => ({ ...prev, lowStockCount: res.meta?.total || res.data?.length || 0 }))
    } catch (e) {
      console.error("Failed to fetch low stock:", e)
    } finally {
      setLowStockLoading(false)
    }
  }, [levelsParams])

  // Fetch history
  const historyParams = useMemo(() => ({ 
    sku_id: historySkuId ? Number(historySkuId) : undefined, 
    warehouse_id: historyWarehouseId ? Number(historyWarehouseId) : undefined, 
    per_page: 20 
  }), [historySkuId, historyWarehouseId])
  
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const res = await listInventoryHistory(historyParams)
      setHistory(res)
    } catch (e) {
      console.error("Failed to fetch history:", e)
    } finally {
      setHistoryLoading(false)
    }
  }, [historyParams])

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === "overview" || activeTab === "levels") {
      fetchLevels()
      fetchLowStock()
    } else if (activeTab === "low-stock") {
      fetchLowStock()
    } else if (activeTab === "movements") {
      fetchHistory()
    }
  }, [activeTab, fetchLevels, fetchLowStock, fetchHistory])

  // Tab change handler with URL update
  const setTab = (tab: string) => {
    setActiveTab(tab)
    const next = new URLSearchParams(searchParams.toString())
    if (tab === "overview") next.delete("tab")
    else next.set("tab", tab)
    router.replace(`/dashboard/inventory?${next.toString()}`, { scroll: false })
  }

  // Filter levels by search
  const filteredLevels = useMemo(() => {
    if (!levels?.data) return []
    const q = search.trim().toLowerCase()
    if (!q) return levels.data
    return levels.data.filter(row => 
      row.product?.sku?.toLowerCase().includes(q) || 
      row.product?.name?.toLowerCase().includes(q)
    )
  }, [levels?.data, search])

  // Open operate sheet with prefill
  const handleOpenOperate = (prefill?: Partial<typeof operateForm>) => {
    setOperateForm(prev => ({ ...prev, type: "receive", quantity: 1, notes: "", ...prefill }))
    setOperateOpen(true)
  }

  // Submit inventory operation
  const submitOperate = async () => {
    if (!operateForm.sku_id || !operateForm.warehouse_id || !operateForm.quantity) return
    try {
      setOperating(true)
      await operateInventory({
        sku_id: operateForm.sku_id,
        warehouse_id: operateForm.warehouse_id,
        type: operateForm.type,
        quantity: operateForm.quantity,
        notes: operateForm.notes,
        to_warehouse_id: operateForm.type === "transfer" ? operateForm.to_warehouse_id : undefined,
      })
      setOperateOpen(false)
      // Refresh data
      if (activeTab === "levels" || activeTab === "overview") fetchLevels()
      if (activeTab === "low-stock" || activeTab === "overview") fetchLowStock()
      if (activeTab === "movements") fetchHistory()
    } catch (e) {
      console.error("Operation failed:", e)
    } finally {
      setOperating(false)
    }
  }

  // Warehouse CRUD handlers
  const handleEditWarehouse = (w: Warehouse) => {
    setEditingWarehouse(w)
    setWarehouseForm({
      name: w.name,
      address: w.address,
      code: w.code || "",
      manager_name: w.manager_name,
      manager_email: w.manager_email,
      manager_phone: w.manager_phone,
      storage_capacity: w.storage_capacity || 1000,
      is_active: w.is_active ?? true,
      region_id: w.region_id,
      state_id: w.state_id,
      city_id: w.city_id,
    })
    setWarehouseFormErrors({})
    setWarehouseDialogOpen(true)
  }

  const handleNewWarehouse = () => {
    setEditingWarehouse(null)
    setWarehouseForm({
      ...initialWarehouseForm,
      code: generateWarehouseCode(), // Auto-generate a code
    })
    setWarehouseFormErrors({})
    setWarehouseDialogOpen(true)
  }

  const validateWarehouseForm = (): boolean => {
    const errors: WarehouseFormErrors = {}
    
    if (!warehouseForm.name.trim()) {
      errors.name = "Warehouse name is required"
    }
    
    if (!warehouseForm.code.trim()) {
      errors.code = "Warehouse code is required"
    }
    
    if (!warehouseForm.storage_capacity || warehouseForm.storage_capacity < 1) {
      errors.storage_capacity = "Storage capacity must be at least 1"
    }
    
    setWarehouseFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const submitWarehouse = async () => {
    // Clear previous errors
    setWarehouseFormErrors({})
    
    // Validate form
    if (!validateWarehouseForm()) {
      return
    }
    
    const body = {
      ...warehouseForm,
      region_id: warehouseForm.region_id || 1,
      state_id: warehouseForm.state_id || 1,
      city_id: warehouseForm.city_id || 1,
    }
    
    try {
      setWarehouseSaving(true)
      if (editingWarehouse) {
        await updateWarehouse(editingWarehouse.id, body)
      } else {
        await createWarehouse(body)
      }
      setWarehouseDialogOpen(false)
      setEditingWarehouse(null)
      setWarehouseForm(initialWarehouseForm)
      setWarehouseFormErrors({})
      await fetchWarehouses()
    } catch (e: any) {
      console.error("Failed to save warehouse:", e)
      // Parse API validation errors
      if (e?.response?.data?.errors) {
        const apiErrors = e.response.data.errors
        const formErrors: WarehouseFormErrors = {}
        if (apiErrors.name) formErrors.name = apiErrors.name[0]
        if (apiErrors.code) formErrors.code = apiErrors.code[0]
        if (apiErrors.storage_capacity) formErrors.storage_capacity = apiErrors.storage_capacity[0]
        if (Object.keys(formErrors).length > 0) {
          setWarehouseFormErrors(formErrors)
        } else {
          setWarehouseFormErrors({ general: e.response.data.message || "Failed to save warehouse" })
        }
      } else {
        setWarehouseFormErrors({ general: "Failed to save warehouse. Please try again." })
      }
    } finally {
      setWarehouseSaving(false)
    }
  }

  const handleDeleteWarehouse = async (id: number) => {
    if (!confirm("Are you sure you want to delete this warehouse? This action cannot be undone.")) return
    try {
      await deleteWarehouse(id)
      await fetchWarehouses()
    } catch (e) {
      console.error("Failed to delete warehouse:", e)
    }
  }

  // Product search for operate sheet
  const [productSearch, setProductSearch] = useState("")
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return allProducts.slice(0, 10)
    const q = productSearch.toLowerCase()
    return allProducts.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.sku.toLowerCase().includes(q)
    ).slice(0, 10)
  }, [allProducts, productSearch])

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-2 px-4 pt-4">
        <h1 className="text-2xl font-bold tracking-tight">Inventory Management</h1>
        <p className="text-muted-foreground text-sm">Track stock levels, manage warehouses, and record inventory movements</p>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setTab} className="px-4">
        <TabsList className="w-full grid grid-cols-5 h-auto p-1">
          <TabsTrigger value="overview" className="text-xs py-2 px-1">
            <Package className="h-4 w-4 mr-1 hidden sm:inline" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="levels" className="text-xs py-2 px-1">
            <Boxes className="h-4 w-4 mr-1 hidden sm:inline" />
            Stock
          </TabsTrigger>
          <TabsTrigger value="low-stock" className="text-xs py-2 px-1">
            <AlertTriangle className="h-4 w-4 mr-1 hidden sm:inline" />
            Low Stock
          </TabsTrigger>
          <TabsTrigger value="movements" className="text-xs py-2 px-1">
            <ArrowRightLeft className="h-4 w-4 mr-1 hidden sm:inline" />
            History
          </TabsTrigger>
          <TabsTrigger value="warehouses" className="text-xs py-2 px-1">
            <WarehouseIcon className="h-4 w-4 mr-1 hidden sm:inline" />
            Warehouses
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-l-4 border-l-blue-500 bg-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-100 font-medium">Total Products</p>
                    <p className="text-2xl font-bold text-white">{overviewStats.totalProducts}</p>
                  </div>
                  <Package className="h-8 w-8 text-white opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-orange-500 bg-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-purple-100 font-medium">Low Stock Alerts</p>
                    <p className="text-2xl font-bold text-white">{overviewStats.lowStockCount}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-white opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500 bg-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-orange-100 font-medium">Total On Hand</p>
                    <p className="text-2xl font-bold text-white">{overviewStats.totalOnHand.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-white opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500 bg-red-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-red-100 font-medium">Reserved</p>
                    <p className="text-2xl font-bold text-white">{overviewStats.totalReserved.toLocaleString()}</p>
                  </div>
                  <Clock className="h-8 w-8 text-white opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
              <CardDescription>Common inventory operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex flex-col items-center gap-2 bg-green-50 border-green-200 hover:bg-green-100"
                  onClick={() => handleOpenOperate({ type: "receive" })}
                >
                  <PackagePlus className="h-5 w-5 text-green-600" />
                  <span className="text-xs font-medium text-green-700">Receive Stock</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex flex-col items-center gap-2 bg-blue-50 border-blue-200 hover:bg-blue-100"
                  onClick={() => handleOpenOperate({ type: "ship" })}
                >
                  <PackageMinus className="h-5 w-5 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">Ship Out</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex flex-col items-center gap-2 bg-cyan-50 border-cyan-200 hover:bg-cyan-100"
                  onClick={() => handleOpenOperate({ type: "transfer" })}
                >
                  <ArrowRightLeft className="h-5 w-5 text-cyan-600" />
                  <span className="text-xs font-medium text-cyan-700">Transfer</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex flex-col items-center gap-2 bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
                  onClick={() => handleOpenOperate({ type: "count" })}
                >
                  <Boxes className="h-5 w-5 text-indigo-600" />
                  <span className="text-xs font-medium text-indigo-700">Stock Count</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alert List */}
          {overviewStats.lowStockCount > 0 && (
            <Card className="border-orange-200 bg-orange-50/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <CardTitle className="text-base text-orange-700">Low Stock Alerts</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setTab("low-stock")} className="text-orange-600">
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {(lowStock?.data || []).slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.product?.name}</p>
                        <p className="text-xs text-muted-foreground">SKU: {item.product?.sku} • {item.warehouse?.name}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-bold text-red-600">{item.available} left</p>
                        <p className="text-xs text-muted-foreground">Need {item.restock_quantity_needed}</p>
                      </div>
                      <Button 
                        size="sm" 
                        className="ml-3"
                        onClick={() => handleOpenOperate({ 
                          sku_id: item.product?.id, 
                          product_name: item.product?.name,
                          warehouse_id: item.warehouse?.id, 
                          type: "receive", 
                          quantity: item.restock_quantity_needed 
                        })}
                      >
                        Restock
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warehouses Overview */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Warehouses</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setTab("warehouses")}>
                  Manage <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {warehousesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : warehouses.length === 0 ? (
                <div className="text-center py-8">
                  <WarehouseIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No warehouses configured</p>
                  <Button size="sm" className="mt-4" onClick={handleNewWarehouse}>
                    <Plus className="h-4 w-4 mr-1" /> Add Warehouse
                  </Button>
                </div>
              ) : (
                <div className="grid gap-2">
                  {warehouses.slice(0, 4).map((w) => (
                    <div key={w.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${w.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <Building2 className={`h-5 w-5 ${w.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{w.name}</p>
                          <p className="text-xs text-muted-foreground">{w.code || 'No code'}</p>
                        </div>
                      </div>
                      {w.is_active ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-500">Inactive</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Levels Tab */}
        <TabsContent value="levels" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Inventory Levels</CardTitle>
                <Button size="sm" onClick={() => handleOpenOperate()}>
                  <Plus className="h-4 w-4 mr-1" /> New Operation
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Warehouses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Warehouses</SelectItem>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                    placeholder="Search by SKU or product name..." 
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Product</TableHead>
                        <TableHead className="font-semibold text-center">On Hand</TableHead>
                        <TableHead className="font-semibold text-center">Reserved</TableHead>
                        <TableHead className="font-semibold text-center">Available</TableHead>
                        <TableHead className="font-semibold text-center">Status</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {levelsLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin inline mr-2" />
                            Loading inventory...
                          </TableCell>
                        </TableRow>
                      ) : filteredLevels.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            {search ? "No products match your search" : "No inventory data found"}
                          </TableCell>
                        </TableRow>
                      ) : filteredLevels.map((row) => (
                        <TableRow key={row.id} className="hover:bg-muted/30">
                        <TableCell>
                            <div>
                              <p className="font-medium">{row.product?.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{row.product?.sku}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-medium">{row.on_hand}</TableCell>
                          <TableCell className="text-center">
                            <span className={row.reserved > 0 ? "text-orange-600 font-medium" : "text-muted-foreground"}>
                              {row.reserved}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={row.available <= row.reorder_point ? "text-red-600 font-bold" : "text-green-600 font-medium"}>
                              {row.available}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {row.needs_reorder ? (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Restock
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                OK
                              </Badge>
                            )}
                        </TableCell>
                        <TableCell className="text-right">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleOpenOperate({ 
                                sku_id: row.product?.id, 
                                product_name: row.product?.name 
                              })}
                            >
                              Operate
                            </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Low Stock Tab */}
        <TabsContent value="low-stock" className="space-y-4 mt-4">
          <Card className="border-orange-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-lg">Low Stock Items</CardTitle>
              </div>
              <CardDescription>Products that need restocking based on reorder points</CardDescription>
                </CardHeader>
                <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                      <TableRow className="bg-orange-50/50">
                        <TableHead className="font-semibold">Product</TableHead>
                        <TableHead className="font-semibold">Warehouse</TableHead>
                        <TableHead className="font-semibold text-center">Available</TableHead>
                        <TableHead className="font-semibold text-center">Reorder At</TableHead>
                        <TableHead className="font-semibold text-center">Need</TableHead>
                        <TableHead className="font-semibold text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lowStockLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin inline mr-2" />
                            Loading...
                          </TableCell>
                        </TableRow>
                      ) : (lowStock?.data || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
                            <p className="text-muted-foreground">All stock levels are healthy!</p>
                          </TableCell>
                        </TableRow>
                                ) : (lowStock?.data || []).map((row) => (
                        <TableRow key={row.id} className="hover:bg-orange-50/30">
                          <TableCell>
                            <div>
                              <p className="font-medium">{row.product?.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{row.product?.sku}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{row.warehouse?.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-red-600 font-bold text-lg">{row.available}</span>
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">{row.reorder_point}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                              +{row.restock_quantity_needed}
                            </Badge>
                          </TableCell>
                                        <TableCell className="text-right">
                            <Button 
                              size="sm"
                              onClick={() => handleOpenOperate({ 
                                sku_id: row.product?.id, 
                                product_name: row.product?.name,
                                warehouse_id: row.warehouse?.id, 
                                type: "receive", 
                                quantity: row.restock_quantity_needed 
                              })}
                            >
                                                Restock
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        {/* Movements/History Tab */}
        <TabsContent value="movements" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Inventory Movements</CardTitle>
              <CardDescription>Track all stock changes and operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Filter by SKU ID" 
                    value={historySkuId} 
                    onChange={(e) => setHistorySkuId(e.target.value)} 
                    className="pl-9"
                  />
                </div>
                <Select value={historyWarehouseId ?? "all"} onValueChange={(v) => setHistoryWarehouseId(v === "all" ? undefined : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Warehouses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Warehouses</SelectItem>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Operation</TableHead>
                        <TableHead className="font-semibold text-center">Quantity</TableHead>
                        <TableHead className="font-semibold text-center">Stock Change</TableHead>
                        <TableHead className="font-semibold">Warehouse</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin inline mr-2" />
                            Loading...
                          </TableCell>
                      </TableRow>
                      ) : (history?.data || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No movements found
                          </TableCell>
                        </TableRow>
                      ) : (history?.data || []).map((row) => {
                        const config = operationConfig[row.type as InventoryOperationType] || { 
                          label: row.type, 
                          icon: Package, 
                          color: "text-gray-600 bg-gray-50 border-gray-200" 
                        }
                        const OpIcon = config.icon
                        return (
                          <TableRow key={row.id} className="hover:bg-muted/30">
                            <TableCell>
                              <Badge variant="outline" className={`${config.color} gap-1`}>
                                <OpIcon className="h-3 w-3" />
                                {config.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center font-medium">{row.quantity}</TableCell>
                            <TableCell className="text-center">
                              <span className={row.on_hand_delta > 0 ? "text-green-600" : row.on_hand_delta < 0 ? "text-red-600" : ""}>
                                {row.on_hand_delta > 0 ? "+" : ""}{row.on_hand_delta}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{row.warehouse?.name}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs">{row.performedBy?.name}</span>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Warehouses Tab */}
        <TabsContent value="warehouses" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Warehouses</CardTitle>
                  <CardDescription>Manage your storage locations</CardDescription>
                </div>
                <Button size="sm" onClick={handleNewWarehouse}>
                  <Plus className="h-4 w-4 mr-1" /> Add Warehouse
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {warehousesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : warehouses.length === 0 ? (
                <div className="text-center py-12">
                  <WarehouseIcon className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium mb-1">No warehouses yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">Add your first warehouse to start tracking inventory</p>
                  <Button onClick={handleNewWarehouse}>
                    <Plus className="h-4 w-4 mr-2" /> Add Your First Warehouse
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {warehouses.map((w) => (
                    <div key={w.id} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className={`h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${w.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                            <Building2 className={`h-6 w-6 ${w.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold">{w.name}</h3>
                              {w.code && <Badge variant="secondary" className="text-xs font-mono">{w.code}</Badge>}
                              {w.is_active ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Active</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">Inactive</Badge>
                              )}
                            </div>
                            {w.address && <p className="text-sm text-muted-foreground mt-1">{w.address}</p>}
                            {w.manager_name && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Manager: {w.manager_name} {w.manager_email && `• ${w.manager_email}`}
                              </p>
                            )}
                            {w.storage_capacity && (
                              <p className="text-xs text-muted-foreground">
                                Capacity: {w.storage_capacity.toLocaleString()} units
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button size="sm" variant="outline" onClick={() => handleEditWarehouse(w)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteWarehouse(w.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Warehouse Create/Edit Dialog */}
      <Dialog open={warehouseDialogOpen} onOpenChange={(o) => {
        setWarehouseDialogOpen(o)
        if (!o) {
          setEditingWarehouse(null)
          setWarehouseForm(initialWarehouseForm)
          setWarehouseFormErrors({})
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingWarehouse ? "Edit Warehouse" : "Add New Warehouse"}</DialogTitle>
            <DialogDescription>
              {editingWarehouse ? "Update warehouse details" : "Create a new warehouse location"}
            </DialogDescription>
          </DialogHeader>
          
          {/* General Error Message */}
          {warehouseFormErrors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{warehouseFormErrors.general}</span>
            </div>
          )}
          
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="space-y-4 p-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={warehouseForm.name}
                    onChange={(e) => {
                      setWarehouseForm({ ...warehouseForm, name: e.target.value })
                      if (warehouseFormErrors.name) setWarehouseFormErrors(prev => ({ ...prev, name: undefined }))
                    }}
                    placeholder="Main Warehouse"
                    className={warehouseFormErrors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {warehouseFormErrors.name && (
                    <p className="text-xs text-red-500">{warehouseFormErrors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Code *</Label>
                  <Input
                    value={warehouseForm.code}
                    onChange={(e) => {
                      setWarehouseForm({ ...warehouseForm, code: e.target.value })
                      if (warehouseFormErrors.code) setWarehouseFormErrors(prev => ({ ...prev, code: undefined }))
                    }}
                    placeholder="WH-001"
                    className={warehouseFormErrors.code ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {warehouseFormErrors.code && (
                    <p className="text-xs text-red-500">{warehouseFormErrors.code}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={warehouseForm.address || ""}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, address: e.target.value })}
                  placeholder="123 Warehouse Street, City"
                />
              </div>

              <Separator />
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Manager Details</Label>
                <div className="grid grid-cols-1 gap-3">
                  <Input
                    value={warehouseForm.manager_name || ""}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, manager_name: e.target.value })}
                    placeholder="Manager Name"
                  />
                  <Input
                    type="email"
                    value={warehouseForm.manager_email || ""}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, manager_email: e.target.value })}
                    placeholder="manager@example.com"
                  />
                  <Input
                    value={warehouseForm.manager_phone || ""}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, manager_phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Storage Capacity *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={warehouseForm.storage_capacity}
                    onChange={(e) => {
                      setWarehouseForm({ ...warehouseForm, storage_capacity: parseInt(e.target.value) || 0 })
                      if (warehouseFormErrors.storage_capacity) setWarehouseFormErrors(prev => ({ ...prev, storage_capacity: undefined }))
                    }}
                    placeholder="10000"
                    className={warehouseFormErrors.storage_capacity ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {warehouseFormErrors.storage_capacity && (
                    <p className="text-xs text-red-500">{warehouseFormErrors.storage_capacity}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center gap-3 h-10">
                    <Switch
                      checked={warehouseForm.is_active}
                      onCheckedChange={(checked) => setWarehouseForm({ ...warehouseForm, is_active: checked })}
                    />
                    <span className="text-sm">{warehouseForm.is_active ? "Active" : "Inactive"}</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          <div className="flex gap-2 pt-4 border-t mt-4">
            <Button 
              className="flex-1" 
              onClick={submitWarehouse} 
              disabled={warehouseSaving || !warehouseForm.name || !warehouseForm.code || warehouseForm.storage_capacity < 1}
            >
              {warehouseSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                editingWarehouse ? "Save Changes" : "Create Warehouse"
              )}
            </Button>
            <Button variant="outline" onClick={() => setWarehouseDialogOpen(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Inventory Operation Sheet */}
      <Sheet open={operateOpen} onOpenChange={setOperateOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle>Inventory Operation</SheetTitle>
            <SheetDescription>Record stock changes like receiving, shipping, or transfers</SheetDescription>
          </SheetHeader>
          
          <div className="space-y-4">
            {/* Product Selection */}
            <div className="space-y-2">
              <Label>Product *</Label>
              {operateForm.product_name ? (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{operateForm.product_name}</p>
                    <p className="text-xs text-muted-foreground">ID: {operateForm.sku_id}</p>
              </div>
                  <Button size="sm" variant="ghost" onClick={() => setOperateForm(prev => ({ ...prev, sku_id: undefined, product_name: undefined }))}>
                    Change
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by product name or SKU..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {filteredProducts.length > 0 && (
                    <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                      {filteredProducts.map((p) => (
                        <button
                          key={p.id}
                          className="w-full p-3 text-left hover:bg-muted transition-colors"
                          onClick={() => {
                            setOperateForm(prev => ({ ...prev, sku_id: p.id, product_name: p.name }))
                            setProductSearch("")
                          }}
                        >
                          <p className="font-medium text-sm">{p.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
                        </button>
                      ))}
              </div>
                  )}
            </div>
              )}
            </div>

            {/* Warehouse Selection */}
            <div className="space-y-2">
              <Label>Warehouse *</Label>
              <Select 
                value={operateForm.warehouse_id ? String(operateForm.warehouse_id) : ""} 
                onValueChange={(v) => setOperateForm(prev => ({ ...prev, warehouse_id: Number(v) }))}
              >
                    <SelectTrigger>
                  <SelectValue placeholder="Select a warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {w.name}
                      </div>
                    </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
              </div>

            {/* Operation Type Selection */}
            <div className="space-y-2">
              <Label>Operation Type *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.entries(operationConfig) as [InventoryOperationType, typeof operationConfig[InventoryOperationType]][]).map(([type, config]) => {
                  const Icon = config.icon
                  const isSelected = operateForm.type === type
                  return (
                    <button
                      key={type}
                      onClick={() => setOperateForm(prev => ({ ...prev, type }))}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-transparent bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <Icon className={`h-5 w-5 mb-1 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <p className={`text-xs font-medium ${isSelected ? 'text-primary' : ''}`}>{config.label}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label>Quantity *</Label>
              <Input
                type="number"
                min={1}
                value={operateForm.quantity}
                onChange={(e) => setOperateForm(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                className="text-lg font-medium"
              />
            </div>

            {/* Transfer destination */}
            {operateForm.type === "transfer" && (
              <div className="space-y-2">
                <Label>Transfer To Warehouse *</Label>
                <Select 
                  value={operateForm.to_warehouse_id ? String(operateForm.to_warehouse_id) : ""} 
                  onValueChange={(v) => setOperateForm(prev => ({ ...prev, to_warehouse_id: Number(v) }))}
                >
                    <SelectTrigger>
                    <SelectValue placeholder="Select destination warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                    {warehouses.filter(w => w.id !== operateForm.warehouse_id).map((w) => (
                      <SelectItem key={w.id} value={String(w.id)}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {w.name}
                        </div>
                      </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Input
                placeholder="Add any notes about this operation..."
                value={operateForm.notes || ""}
                onChange={(e) => setOperateForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex gap-3 pb-4">
              <Button 
                className="flex-1" 
                size="lg"
                onClick={submitOperate} 
                disabled={operating || !operateForm.sku_id || !operateForm.warehouse_id || !operateForm.quantity}
              >
                {operating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirm Operation
                  </>
                )}
              </Button>
              <Button variant="outline" size="lg" onClick={() => setOperateOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
