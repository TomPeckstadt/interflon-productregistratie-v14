"use client"

import { useState, useEffect, useRef } from "react"
import type React from "react"

// Supabase imports
import {
  fetchUsers,
  fetchProducts,
  fetchLocations,
  fetchPurposes,
  fetchCategories,
  fetchRegistrations,
  saveUser,
  saveProduct,
  saveLocation,
  savePurpose,
  saveCategory,
  deleteUser,
  deleteProduct,
  deleteLocation,
  deletePurpose,
  deleteCategory,
  subscribeToUsers,
  subscribeToProducts,
  subscribeToLocations,
  subscribeToPurposes,
  subscribeToCategories,
  subscribeToRegistrations,
  isSupabaseConfigured,
  updateUser,
  updateLocation,
  updatePurpose,
  updateProduct,
  updateCategory,
  testSupabaseConnection,
} from "@/lib/supabase"

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Search, X, Edit } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CategoryManagement } from "@/components/category-management"
import { Package, Download, LogOut, Calendar, MapPin, User, Mail, Phone, Building, Save } from "lucide-react"

interface Product {
  id: string
  name: string
  qrcode?: string
  categoryId?: string
  created_at?: string
  attachmentUrl?: string
  attachmentName?: string
  category: string
  serial_number: string
  purchase_date: string
  warranty_period: number
  location: string
  notes: string
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_company: string
  updated_at: string
}

interface Category {
  id: string
  name: string
  description: string
  created_at: string
}

interface Registration {
  id: string
  user: string
  product: string
  location: string
  purpose: string
  timestamp: string
  date: string
  time: string
  qrcode?: string
  created_at?: string
}

export default function ProductRegistrationApp() {
  // ALL HOOKS MUST BE AT THE TOP - NEVER CONDITIONAL
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState("")

  // Basic state
  const [currentUser, setCurrentUser] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [location, setLocation] = useState("")
  const [purpose, setPurpose] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [importMessage, setImportMessage] = useState("")
  const [importError, setImportError] = useState("")

  // Connection state
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("Controleren...")

  // Data arrays - SINGLE SOURCE OF TRUTH
  const [users, setUsers] = useState<string[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [purposes, setPurposes] = useState<string[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  // New item states
  const [newUserName, setNewUserName] = useState("")
  const [newProductName, setNewProductName] = useState("")
  const [newProductQrCode, setNewProductQrCode] = useState("")
  const [newProductCategory, setNewProductCategory] = useState("none")
  const [newLocationName, setNewLocationName] = useState("")
  const [newPurposeName, setNewPurposeName] = useState("")
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newUserRole, setNewUserRole] = useState("User")

  // Edit states
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [originalCategory, setOriginalCategory] = useState<Category | null>(null)
  const [showEditCategoryDialog, setShowEditCategoryDialog] = useState(false)

  const [editingUser, setEditingUser] = useState<string>("")
  const [originalUser, setOriginalUser] = useState<string>("")
  const [showEditUserDialog, setShowEditUserDialog] = useState(false)

  const [editingLocation, setEditingLocation] = useState<string>("")
  const [originalLocation, setOriginalLocation] = useState<string>("")
  const [showEditLocationDialog, setShowEditLocationDialog] = useState(false)

  const [editingPurpose, setEditingPurpose] = useState<string>("")
  const [originalPurpose, setOriginalPurpose] = useState<string>("")
  const [showEditPurposeDialog, setShowEditPurposeDialog] = useState(false)

  // Product selector states
  const [productSearchQuery, setProductSearchQuery] = useState("")
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const productSelectorRef = useRef<HTMLDivElement>(null)
  const [userSearchQuery, setUserSearchQuery] = useState("")

  // QR Scanner states
  const [showQrScanner, setShowQrScanner] = useState(false)
  const [qrScanResult, setQrScanResult] = useState("")
  const [qrScanMode, setQrScanMode] = useState<"registration" | "product-management">("registration")
  const manualInputRef = useRef<HTMLInputElement>(null)

  // History filtering states
  const [historySearchQuery, setHistorySearchQuery] = useState("")
  const [selectedHistoryUser, setSelectedHistoryUser] = useState("all")
  const [selectedHistoryLocation, setSelectedHistoryLocation] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState("newest")

  // Product search state
  const [productSearchFilter, setProductSearchFilter] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    serial_number: "",
    purchase_date: "",
    warranty_period: "",
    location: "",
    notes: "",
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_company: "",
  })

  // Edit states
  const [originalProduct, setOriginalProduct] = useState<Product | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  // Load data on component mount
  useEffect(() => {
    console.log("🚀 Starting app initialization...")
    loadAllData()
    loadProducts()
    loadCategories()
  }, [])

  // Filter products when search term or category changes
  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, selectedCategory])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productSelectorRef.current && !productSelectorRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Set default user when users are loaded
  useEffect(() => {
    if (!currentUser && users.length > 0) {
      setCurrentUser(users[0])
      console.log("👤 Set default user:", users[0])
    }
  }, [users, currentUser])

  // Auto-focus het QR scanner input veld wanneer de scanner opent
  useEffect(() => {
    if (showQrScanner && manualInputRef.current) {
      // Kleine delay om zeker te zijn dat de modal volledig geladen is
      setTimeout(() => {
        manualInputRef.current?.focus()
      }, 100)
    }
  }, [showQrScanner])

  const loadAllData = async () => {
    console.log("🔄 Loading all data...")
    setConnectionStatus("Verbinden met database...")

    try {
      const supabaseConfigured = isSupabaseConfigured()
      console.log("🔧 Supabase configured:", supabaseConfigured)

      if (supabaseConfigured) {
        console.log("🔄 Testing Supabase connection...")

        // Test connection first
        const connectionTest = await testSupabaseConnection()

        if (connectionTest) {
          console.log("🔄 Loading from Supabase...")
          const [usersResult, productsResult, locationsResult, purposesResult, categoriesResult, registrationsResult] =
            await Promise.all([
              fetchUsers(),
              fetchProducts(),
              fetchLocations(),
              fetchPurposes(),
              fetchCategories(),
              fetchRegistrations(),
            ])

          console.log("📊 Supabase results:", {
            users: { success: !usersResult.error, count: usersResult.data?.length || 0 },
            products: { success: !productsResult.error, count: productsResult.data?.length || 0 },
            locations: { success: !locationsResult.error, count: locationsResult.data?.length || 0 },
            purposes: { success: !locationsResult.error, count: locationsResult.data?.length || 0 },
            categories: { success: !categoriesResult.error, count: categoriesResult.data?.length || 0 },
          })

          // Check if we have successful connection
          const hasErrors = usersResult.error || productsResult.error || categoriesResult.error

          if (!hasErrors) {
            console.log("✅ Supabase connected successfully")
            setIsSupabaseConnected(true)
            setConnectionStatus("Supabase verbonden")

            // Set data from Supabase
            setUsers(usersResult.data || [])
            setProducts(productsResult.data || [])
            setLocations(locationsResult.data || [])
            setPurposes(purposesResult.data || [])
            setCategories(categoriesResult.data || [])
            setRegistrations(registrationsResult.data || [])

            // Set up real-time subscriptions
            setupSubscriptions()
          } else {
            console.log("️ Supabase data fetch failed - using mock data")
            setIsSupabaseConnected(false)
            setConnectionStatus("Mock data actief (data fetch failed)")
            loadMockData()
          }
        } else {
          console.log("⚠️ Supabase connection test failed - using mock data")
          setIsSupabaseConnected(false)
          setConnectionStatus("Mock data actief (connection failed)")
          loadMockData()
        }
      } else {
        console.log("⚠️ Supabase not configured - using mock data")
        setIsSupabaseConnected(false)
        setConnectionStatus("Mock data actief (not configured)")
        loadMockData()
      }

      console.log("🎯 App initialization complete - setting ready state")
      setIsReady(true)
    } catch (error) {
      console.error("❌ Error loading data:", error)
      setError(`Fout bij laden: ${error}`)
      setIsSupabaseConnected(false)
      setConnectionStatus("Mock data actief (error)")
      loadMockData()
      setIsReady(true) // Still show the app with mock data
    }
  }

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("Error loading products:", error)
      setError("Fout bij het laden van producten")
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*").order("name")

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }

  const filterProducts = () => {
    let filtered = products

    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.customer_company.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((product) => product.category === selectedCategory)
    }

    setFilteredProducts(filtered)
  }

  const loadMockData = () => {
    console.log("📱 Loading mock data...")
    const mockUsers = [
      "Tom Peckstadt",
      "Sven De Poorter",
      "Nele Herteleer",
      "Wim Peckstadt",
      "Siegfried Weverbergh",
      "Jan Janssen",
    ]
    const mockProducts = [
      {
        id: "1",
        name: "Interflon Metal Clean spray 500ml",
        qrcode: "IFLS001",
        categoryId: "1",
        category: "Smeermiddelen",
        serial_number: "SN001",
        purchase_date: "2024-01-01",
        warranty_period: 12,
        location: "Magazijn",
        notes: "Voor algemeen gebruik",
        customer_name: "Jan Klaassen",
        customer_email: "jan@klaassen.nl",
        customer_phone: "0612345678",
        customer_company: "Klaassen BV",
        updated_at: "2024-01-01",
      },
      {
        id: "2",
        name: "Interflon Grease LT2 Lube shuttle 400gr",
        qrcode: "IFFL002",
        categoryId: "1",
        category: "Smeermiddelen",
        serial_number: "SN002",
        purchase_date: "2024-01-01",
        warranty_period: 12,
        location: "Magazijn",
        notes: "Voor algemeen gebruik",
        customer_name: "Jan Klaassen",
        customer_email: "jan@klaassen.nl",
        customer_phone: "0612345678",
        customer_company: "Klaassen BV",
        updated_at: "2024-01-01",
      },
      {
        id: "3",
        name: "Interflon Maintenance Kit",
        qrcode: "IFD003",
        categoryId: "2",
        category: "Reinigers",
        serial_number: "SN003",
        purchase_date: "2024-01-01",
        warranty_period: 12,
        location: "Magazijn",
        notes: "Voor algemeen gebruik",
        customer_name: "Jan Klaassen",
        customer_email: "jan@klaassen.nl",
        customer_phone: "0612345678",
        customer_company: "Klaassen BV",
        updated_at: "2024-01-01",
      },
      {
        id: "4",
        name: "Interflon Food Lube spray 500ml",
        qrcode: "IFGR004",
        categoryId: "1",
        category: "Smeermiddelen",
        serial_number: "SN004",
        purchase_date: "2024-01-01",
        warranty_period: 12,
        location: "Magazijn",
        notes: "Voor algemeen gebruik",
        customer_name: "Jan Klaassen",
        customer_email: "jan@klaassen.nl",
        customer_phone: "0612345678",
        customer_company: "Klaassen BV",
        updated_at: "2024-01-01",
      },
      {
        id: "5",
        name: "Interflon Foam Cleaner spray 500ml",
        qrcode: "IFMC005",
        categoryId: "2",
        category: "Reinigers",
        serial_number: "SN005",
        purchase_date: "2024-01-01",
        warranty_period: 12,
        location: "Magazijn",
        notes: "Voor algemeen gebruik",
        customer_name: "Jan Klaassen",
        customer_email: "jan@klaassen.nl",
        customer_phone: "0612345678",
        customer_company: "Klaassen BV",
        updated_at: "2024-01-01",
      },
      {
        id: "6",
        name: "Interflon Fin Super",
        qrcode: "IFMK006",
        categoryId: "3",
        category: "Onderhoud",
        serial_number: "SN006",
        purchase_date: "2024-01-01",
        warranty_period: 12,
        location: "Magazijn",
        notes: "Voor algemeen gebruik",
        customer_name: "Jan Klaassen",
        customer_email: "jan@klaassen.nl",
        customer_phone: "0612345678",
        customer_company: "Klaassen BV",
        updated_at: "2024-01-01",
      },
    ]
    const mockLocations = [
      "Warehouse Dematic groot boven",
      "Warehouse Interflon",
      "Warehouse Dematic klein beneden",
      "Onderhoud werkplaats",
      "Kantoor 1.1",
    ]
    const mockPurposes = ["Presentatie", "Thuiswerken", "Reparatie", "Training", "Demonstratie"]
    const mockCategories = [
      { id: "1", name: "Smeermiddelen", description: "Smeermiddelen", created_at: "2024-01-01" },
      { id: "2", name: "Reinigers", description: "Reinigers", created_at: "2024-01-01" },
      { id: "3", name: "Onderhoud", description: "Onderhoud", created_at: "2024-01-01" },
    ]

    // Mock registrations with realistic data
    const mockRegistrations = [
      {
        id: "1",
        user: "Tom Peckstadt",
        product: "Interflon Metal Clean spray 500ml",
        location: "Warehouse Interflon",
        purpose: "Reparatie",
        timestamp: "2025-06-15T05:41:00Z",
        date: "2025-06-15",
        time: "05:41",
        qrcode: "IFLS001",
      },
      {
        id: "2",
        user: "Nele Herteleer",
        product: "Interflon Metal Clean spray 500ml",
        location: "Warehouse Dematic klein beneden",
        purpose: "Training",
        timestamp: "2025-06-15T05:48:00Z",
        date: "2025-06-15",
        time: "05:48",
        qrcode: "IFLS001",
      },
      {
        id: "3",
        user: "Tom Peckstadt",
        product: "Interflon Grease LT2 Lube shuttle 400gr",
        location: "Warehouse Dematic groot boven",
        purpose: "Reparatie",
        timestamp: "2025-06-15T12:53:00Z",
        date: "2025-06-15",
        time: "12:53",
        qrcode: "IFFL002",
      },
      {
        id: "4",
        user: "Tom Peckstadt",
        product: "Interflon Grease LT2 Lube shuttle 400gr",
        location: "Warehouse Dematic groot boven",
        purpose: "Demonstratie",
        timestamp: "2025-06-16T20:32:00Z",
        date: "2025-06-16",
        time: "20:32",
        qrcode: "IFFL002",
      },
      {
        id: "5",
        user: "Sven De Poorter",
        product: "Interflon Metal Clean spray 500ml",
        location: "Warehouse Dematic groot boven",
        purpose: "Presentatie",
        timestamp: "2025-06-16T21:07:00Z",
        date: "2025-06-16",
        time: "21:07",
        qrcode: "IFLS001",
      },
      {
        id: "6",
        user: "Tom Peckstadt",
        product: "Interflon Maintenance Kit",
        location: "Onderhoud werkplaats",
        purpose: "Reparatie",
        timestamp: "2025-06-14T10:15:00Z",
        date: "2025-06-14",
        time: "10:15",
        qrcode: "IFD003",
      },
      {
        id: "7",
        user: "Siegfried Weverbergh",
        product: "Interflon Food Lube spray 500ml",
        location: "Warehouse Interflon",
        purpose: "Training",
        timestamp: "2025-06-14T14:22:00Z",
        date: "2025-06-14",
        time: "14:22",
        qrcode: "IFGR004",
      },
      {
        id: "8",
        user: "Wim Peckstadt",
        product: "Interflon Foam Cleaner spray 500ml",
        location: "Warehouse Dematic klein beneden",
        purpose: "Demonstratie",
        timestamp: "2025-06-13T09:30:00Z",
        date: "2025-06-13",
        time: "09:30",
        qrcode: "IFMC005",
      },
      {
        id: "9",
        user: "Sven De Poorter",
        product: "Interflon Maintenance Kit",
        location: "Onderhoud werkplaats",
        purpose: "Reparatie",
        timestamp: "2025-06-13T16:45:00Z",
        date: "2025-06-13",
        time: "16:45",
        qrcode: "IFD003",
      },
      {
        id: "10",
        user: "Tom Peckstadt",
        product: "Interflon Metal Clean spray 500ml",
        location: "Warehouse Dematic groot boven",
        purpose: "Presentatie",
        timestamp: "2025-06-12T11:20:00Z",
        date: "2025-06-12",
        time: "11:20",
        qrcode: "IFLS001",
      },
      {
        id: "11",
        user: "Siegfried Weverbergh",
        product: "Interflon Grease LT2 Lube shuttle 400gr",
        location: "Warehouse Interflon",
        purpose: "Training",
        timestamp: "2025-06-12T15:10:00Z",
        date: "2025-06-12",
        time: "15:10",
        qrcode: "IFFL002",
      },
      {
        id: "12",
        user: "Siegfried Weverbergh",
        product: "Interflon Food Lube spray 500ml",
        location: "Warehouse Dematic klein beneden",
        purpose: "Demonstratie",
        timestamp: "2025-06-11T08:55:00Z",
        date: "2025-06-11",
        time: "08:55",
        qrcode: "IFGR004",
      },
      {
        id: "13",
        user: "Tom Peckstadt",
        product: "Interflon Grease LT2 Lube shuttle 400gr",
        location: "Warehouse Dematic groot boven",
        purpose: "Reparatie",
        timestamp: "2025-06-10T13:40:00Z",
        date: "2025-06-10",
        time: "13:40",
        qrcode: "IFFL002",
      },
    ]

    setUsers(mockUsers)
    setProducts(mockProducts)
    setLocations(mockLocations)
    setPurposes(mockPurposes)
    setCategories(mockCategories)
    setRegistrations(mockRegistrations)
    setFilteredProducts(mockProducts)
    setLoading(false)
  }

  const setupSubscriptions = () => {
    console.log("🔔 Setting up real-time subscriptions...")

    const usersSub = subscribeToUsers((newUsers) => {
      console.log("🔔 Users updated via subscription:", newUsers.length)
      setUsers(newUsers)
    })

    const productsSub = subscribeToProducts((newProducts) => {
      console.log("🔔 Products updated via subscription:", newProducts.length)
      setProducts(newProducts)
    })

    const locationsSub = subscribeToLocations((newLocations) => {
      console.log("🔔 Locations updated via subscription:", newLocations.length)
      setLocations(newLocations)
    })

    const purposesSub = subscribeToPurposes((newPurposes) => {
      console.log("🔔 Purposes updated via subscription:", newPurposes.length)
      setPurposes(newPurposes)
    })

    const categoriesSub = subscribeToCategories((newCategories) => {
      console.log("🔔 Categories updated via subscription:", newCategories.length)
      setCategories(newCategories)
    })

    const registrationsSub = subscribeToRegistrations((newRegistrations) => {
      console.log("🔔 Registrations updated via subscription:", newRegistrations.length)
      setRegistrations(newRegistrations)
    })

    // Cleanup subscriptions on unmount
    return () => {
      usersSub?.unsubscribe?.()
      productsSub?.unsubscribe?.()
      locationsSub?.unsubscribe?.()
      purposesSub?.unsubscribe?.()
      categoriesSub?.unsubscribe?.()
      registrationsSub?.unsubscribe?.()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      const productData = {
        ...formData,
        warranty_period: Number.parseInt(formData.warranty_period) || 0,
      }

      if (editingProduct) {
        const { error } = await supabase.from("products").update(productData).eq("id", editingProduct.id)

        if (error) throw error
        setSuccess("Product succesvol bijgewerkt!")
      } else {
        const { error } = await supabase.from("products").insert([productData])

        if (error) throw error
        setSuccess("Product succesvol toegevoegd!")
      }

      // Reset form and reload data
      resetForm()
      loadProducts()
    } catch (error) {
      console.error("Error saving product:", error)
      setError("Fout bij het opslaan van het product")
    }
  }

  const handleEdit = (product: Product) => {
    console.log("🔧 Starting product edit:", product)
    setOriginalProduct({ ...product })
    setEditingProduct({ ...product })
    setShowEditDialog(true)
  }

  const handleEditUserFn = (user: string) => {
    console.log("🔧 Starting user edit:", user)
    setOriginalUser(user)
    setEditingUser(user)
    setShowEditUserDialog(true)
  }

  const handleEditCategoryFn = (category: Category) => {
    console.log("🔧 Starting category edit:", category)
    setOriginalCategory({ ...category })
    setEditingCategory({ ...category })
    setShowEditCategoryDialog(true)
  }

  const handleEditLocationFn = (location: string) => {
    console.log("🔧 Starting location edit:", location)
    setOriginalLocation(location)
    setEditingLocation(location)
    setShowEditLocationDialog(true)
  }

  const handleEditPurposeFn = (purpose: string) => {
    console.log("🔧 Starting purpose edit:", purpose)
    setOriginalPurpose(purpose)
    setEditingPurpose(purpose)
    setShowEditPurposeDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Weet je zeker dat je dit product wilt verwijderen?")) return

    try {
      const { error } = await supabase.from("products").delete().eq("id", id)

      if (error) throw error
      setSuccess("Product succesvol verwijderd!")
      loadProducts()
    } catch (error) {
      console.error("Error deleting product:", error)
      setError("Fout bij het verwijderen van het product")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      serial_number: "",
      purchase_date: "",
      warranty_period: "",
      location: "",
      notes: "",
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      customer_company: "",
    })
    setIsAddingProduct(false)
    setEditingProduct(null)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const exportToCSV = () => {
    const headers = [
      "Naam",
      "Categorie",
      "Serienummer",
      "Aankoopdatum",
      "Garantieperiode (maanden)",
      "Locatie",
      "Opmerkingen",
      "Klant Naam",
      "Klant Email",
      "Klant Telefoon",
      "Klant Bedrijf",
    ]

    const csvContent = [
      headers.join(","),
      ...filteredProducts.map((product) =>
        [
          `"${product.name}"`,
          `"${product.category}"`,
          `"${product.serial_number}"`,
          `"${product.purchase_date}"`,
          product.warranty_period,
          `"${product.location}"`,
          `"${product.notes}"`,
          `"${product.customer_name}"`,
          `"${product.customer_email}"`,
          `"${product.customer_phone}"`,
          `"${product.customer_company}"`,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "producten.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // QR Scanner functions
  const startQrScanner = () => {
    setShowQrScanner(true)
  }

  const stopQrScanner = () => {
    setShowQrScanner(false)
  }

  // QR Code cleaning function voor draadloze scanners met keyboard layout problemen
  const cleanQrCode = (rawQrCode: string): string => {
    console.log("🧹 Cleaning QR code (AZERTY→QWERTY):", rawQrCode)

    // AZERTY naar QWERTY mapping (België/Frankrijk keyboard layout)
    const azertyToQwertyMap: Record<string, string> = {
      // Cijfer rij AZERTY → QWERTY
      "&": "1", // AZERTY 1 → QWERTY 1
      é: "2", // AZERTY 2 → QWERTY 2
      '"': "3", // AZERTY 3 → QWERTY 3
      "'": "4", // AZERTY 4 → QWERTY 4
      "(": "5", // AZERTY 5 → QWERTY 5
      "§": "6", // AZERTY 6 → QWERTY 6
      è: "7", // AZERTY 7 → QWERTY 7
      "!": "8", // AZERTY 8 → QWERTY 8
      ç: "9", // AZERTY 9 → QWERTY 9
      à: "0", // AZERTY 0 → QWERTY 0

      // Speciale karakters AZERTY → QWERTY
      "°": "_", // AZERTY _ → QWERTY _
      "-": "-", // Blijft hetzelfde
      "=": "=", // Blijft hetzelfde maar kan anders zijn

      // Letters die anders kunnen zijn
      a: "a",
      z: "z",
      e: "e",
      r: "r",
      t: "t",
      y: "y",
      u: "u",
      i: "i",
      o: "o",
      p: "p",
      q: "q",
      s: "s",
      d: "d",
      f: "f",
      g: "g",
      h: "h",
      j: "j",
      k: "k",
      l: "l",
      m: "m",
      w: "w",
      x: "x",
      c: "c",
      v: "v",
      b: "b",
      n: "n",

      // Hoofdletters
      A: "A",
      Z: "Z",
      E: "E",
      R: "R",
      T: "T",
      Y: "Y",
      U: "U",
      I: "I",
      O: "O",
      P: "P",
      Q: "Q",
      S: "S",
      D: "D",
      F: "F",
      G: "G",
      H: "H",
      J: "J",
      K: "K",
      L: "L",
      M: "M",
      W: "W",
      X: "X",
      C: "C",
      V: "V",
      B: "B",
      N: "N",
    }

    // Stap 1: Character-by-character mapping
    let cleaned = rawQrCode
      .split("")
      .map((char) => azertyToQwertyMap[char] || char)
      .join("")

    console.log("🔄 After AZERTY→QWERTY mapping:", cleaned)

    // Stap 2: Specifieke patronen voor jouw QR codes
    // Als we weten dat het patroon _581533 zou moeten zijn:
    const knownPatterns = [
      { wrong: '°(!&(""', correct: "_581533" },
      { wrong: "°(!&(", correct: "_5815" },
      // Voeg hier meer patronen toe als je ze tegenkomt
    ]

    for (const pattern of knownPatterns) {
      if (cleaned.includes(pattern.wrong)) {
        cleaned = cleaned.replace(pattern.wrong, pattern.correct)
        console.log(`🎯 Applied pattern fix: ${pattern.wrong} → ${pattern.correct}`)
      }
    }

    // Stap 3: Probeer exacte match met bestaande producten
    const exactMatch = products.find((p) => p.qrcode === cleaned)
    if (exactMatch) {
      console.log("✅ Found exact match after cleaning:", exactMatch.qrcode)
      return cleaned
    }

    // Stap 4: Fuzzy matching
    const fuzzyMatch = products.find(
      (p) =>
        p.qrcode &&
        (p.qrcode.replace(/[^A-Z0-9]/g, "") === cleaned.replace(/[^A-Z0-9]/g, "") ||
          cleaned.includes(p.qrcode.substring(0, 6)) ||
          p.qrcode.includes(cleaned.substring(0, 6))),
    )

    if (fuzzyMatch) {
      console.log("🎯 Found fuzzy match:", fuzzyMatch.qrcode)
      return fuzzyMatch.qrcode!
    }

    console.log("❌ No match found, returning cleaned version:", cleaned)
    return cleaned
  }

  const handleQrCodeDetected = (qrCode: string) => {
    console.log("📱 Raw QR code detected:", qrCode)

    // Clean de QR code voor draadloze scanner problemen
    const cleanedQrCode = cleanQrCode(qrCode)
    console.log("📱 Cleaned QR code:", cleanedQrCode)

    setQrScanResult(cleanedQrCode)

    if (qrScanMode === "registration") {
      // Zoek eerst met de gecleande code
      let foundProduct = products.find((p) => p.qrcode === cleanedQrCode)

      // Als niet gevonden, probeer ook de originele code
      if (!foundProduct) {
        foundProduct = products.find((p) => p.qrcode === qrCode)
      }

      // Als nog steeds niet gevonden, probeer fuzzy matching
      if (!foundProduct && cleanedQrCode.length > 5) {
        foundProduct = products.find(
          (p) =>
            p.qrcode &&
            (p.qrcode.toLowerCase().includes(cleanedQrCode.toLowerCase()) ||
              cleanedQrCode.toLowerCase().includes(p.qrcode.toLowerCase())),
        )
      }

      if (foundProduct) {
        setSelectedProduct(foundProduct.name)
        setProductSearchQuery(foundProduct.name)
        if (foundProduct.categoryId) {
          setSelectedCategory(foundProduct.categoryId)
        }
        setImportMessage(`✅ Product gevonden: ${foundProduct.name}`)
        setTimeout(() => setImportMessage(""), 3000)
      } else {
        setImportError(`❌ Geen product gevonden voor QR code: ${cleanedQrCode} (origineel: ${qrCode})`)
        setTimeout(() => setImportError(""), 5000)
      }
    } else if (qrScanMode === "product-management") {
      setNewProductQrCode(cleanedQrCode)
      setImportMessage(`✅ QR code gescand: ${cleanedQrCode}`)
      setTimeout(() => setImportMessage(""), 3000)
    }

    stopQrScanner()
  }

  // Get filtered products for dropdown
  const getFilteredProducts = () => {
    const filtered = products
      .filter((product) => {
        if (selectedCategory === "all") return true
        return product.categoryId === selectedCategory
      })
      .filter(
        (product) =>
          product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
          (product.qrcode && product.qrcode.toLowerCase().includes(productSearchQuery.toLowerCase())),
      )

    return filtered
  }

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product.name)
    setProductSearchQuery(product.name)
    setShowProductDropdown(false)
  }

  // Edit handlers
  const handleEditProduct = (product: Product) => {
    console.log("🔧 Starting product edit:", product)
    setOriginalProduct({ ...product })
    setEditingProduct({ ...product })
    setShowEditDialog(true)
  }

  const handleEditUser = (user: string) => {
    console.log("🔧 Starting user edit:", user)
    setOriginalUser(user)
    setEditingUser(user)
    setShowEditUserDialog(true)
  }

  const handleEditCategory = (category: Category) => {
    console.log("🔧 Starting category edit:", category)
    setOriginalCategory({ ...category })
    setEditingCategory({ ...category })
    setShowEditCategoryDialog(true)
  }

  const handleEditLocation = (location: string) => {
    console.log("🔧 Starting location edit:", location)
    setOriginalLocation(location)
    setEditingLocation(location)
    setShowEditLocationDialog(true)
  }

  const handleEditPurpose = (purpose: string) => {
    console.log("🔧 Starting purpose edit:", purpose)
    setOriginalPurpose(purpose)
    setEditingPurpose(purpose)
    setShowEditPurposeDialog(true)
  }

  // Save handlers
  const handleSaveProduct = async () => {
    if (!editingProduct || !originalProduct) return

    const hasChanges =
      editingProduct.name !== originalProduct.name ||
      editingProduct.qrcode !== originalProduct.qrcode ||
      editingProduct.categoryId !== originalProduct.categoryId

    if (!hasChanges) {
      setShowEditDialog(false)
      return
    }

    console.log("💾 Saving product changes:", { original: originalProduct, edited: editingProduct })

    const updateData = {
      name: editingProduct.name,
      qr_code: editingProduct.qrcode || null,
      category_id: editingProduct.categoryId ? Number.parseInt(editingProduct.categoryId) : null,
      // Behoud de bestaande attachment gegevens
      attachment_url: originalProduct.attachmentUrl || null,
      attachment_name: originalProduct.attachmentName || null,
    }

    const result = await updateProduct(originalProduct.id, updateData)

    if (result.error) {
      console.error("❌ Error updating product:", result.error)
      setImportError("Fout bij bijwerken product")
      setTimeout(() => setImportError(""), 3000)
    } else {
      console.log("✅ Product updated successfully")
      setImportMessage("✅ Product bijgewerkt!")
      setTimeout(() => setImportMessage(""), 2000)

      // FORCE LOCAL STATE UPDATE
      console.log("🔄 Forcing local products refresh...")
      const refreshResult = await fetchProducts()
      if (refreshResult.data) {
        console.log("🔄 Updating local products state...")
        setProducts(refreshResult.data)
      }
    }

    setShowEditDialog(false)
  }

  const handleSaveUser = async () => {
    if (!editingUser.trim() || !originalUser) return

    const hasChanges = editingUser.trim() !== originalUser
    if (!hasChanges) {
      setShowEditUserDialog(false)
      return
    }

    console.log("💾 Saving user changes:", { original: originalUser, edited: editingUser.trim() })

    const result = await updateUser(originalUser, editingUser.trim())

    if (result.error) {
      console.error("❌ Error updating user:", result.error)
      setImportError("Fout bij bijwerken gebruiker")
      setTimeout(() => setImportError(""), 3000)
    } else {
      console.log("✅ User updated successfully")
      setImportMessage("✅ Gebruiker bijgewerkt!")
      setTimeout(() => setImportMessage(""), 2000)

      // FORCE LOCAL STATE UPDATE
      console.log("🔄 Forcing local users refresh...")
      const refreshResult = await fetchUsers()
      if (refreshResult.data) {
        console.log("🔄 Updating local users state...")
        setUsers(refreshResult.data)
      }
    }

    setShowEditUserDialog(false)
  }

  const handleSaveCategory = async () => {
    if (!editingCategory || !originalCategory) return

    const hasChanges = editingCategory.name.trim() !== originalCategory.name
    if (!hasChanges) {
      setShowEditCategoryDialog(false)
      return
    }

    console.log("💾 Saving category changes:", { original: originalCategory, edited: editingCategory })

    const result = await updateCategory(originalCategory.id, { name: editingCategory.name.trim() })

    if (result.error) {
      console.error("❌ Error updating category:", result.error)
      setImportError("Fout bij bijwerken categorie")
      setTimeout(() => setImportError(""), 3000)
    } else {
      console.log("✅ Category updated successfully")
      setImportMessage("✅ Categorie bijgewerkt!")
      setTimeout(() => setImportMessage(""), 2000)

      // FORCE LOCAL STATE UPDATE
      console.log("🔄 Forcing local categories refresh...")
      const refreshResult = await fetchCategories()
      if (refreshResult.data) {
        console.log("🔄 Updating local categories state...")
        setCategories(refreshResult.data)
      }
    }

    setShowEditCategoryDialog(false)
  }

  const handleSaveLocation = async () => {
    if (!editingLocation.trim() || !originalLocation) return

    const hasChanges = editingLocation.trim() !== originalLocation
    if (!hasChanges) {
      setShowEditLocationDialog(false)
      return
    }

    console.log("💾 Saving location changes:", { original: originalLocation, edited: editingLocation.trim() })

    const result = await updateLocation(originalLocation, editingLocation.trim())

    if (result.error) {
      console.error("❌ Error updating location:", result.error)
      setImportError("Fout bij bijwerken locatie")
      setTimeout(() => setImportError(""), 3000)
    } else {
      console.log("✅ Location updated successfully")
      setImportMessage("✅ Locatie bijgewerkt!")
      setTimeout(() => setImportMessage(""), 2000)

      // FORCE LOCAL STATE UPDATE
      console.log("🔄 Forcing local locations refresh...")
      const refreshResult = await fetchLocations()
      if (refreshResult.data) {
        console.log("🔄 Updating local locations state...")
        setLocations(refreshResult.data)
      }
    }

    setShowEditLocationDialog(false)
  }

  const handleSavePurpose = async () => {
    if (!editingPurpose.trim() || !originalPurpose) return

    const hasChanges = editingPurpose.trim() !== originalPurpose
    if (!hasChanges) {
      setShowEditPurposeDialog(false)
      return
    }

    console.log("💾 Saving purpose changes:", { original: originalPurpose, edited: editingPurpose.trim() })

    const result = await updatePurpose(originalPurpose, editingPurpose.trim())

    if (result.error) {
      console.error("❌ Error updating purpose:", result.error)
      setImportError("Fout bij bijwerken doel")
      setTimeout(() => setImportError(""), 3000)
    } else {
      console.log("✅ Purpose updated successfully")
      setImportMessage("✅ Doel bijgewerkt!")
      setTimeout(() => setImportMessage(""), 2000)

      // FORCE LOCAL STATE UPDATE
      console.log("🔄 Forcing local purposes refresh...")
      const refreshResult = await fetchPurposes()
      if (refreshResult.data) {
        console.log("🔄 Updating local purposes state...")
        setPurposes(refreshResult.data)
      }
    }

    setShowEditPurposeDialog(false)
  }

  // Attachment handlers
  const handleAttachmentUpload = async (product: Product, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      setImportError("Alleen PDF bestanden zijn toegestaan")
      setTimeout(() => setImportError(""), 3000)
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setImportError("Bestand is te groot (max 10MB)")
      setTimeout(() => setImportError(""), 3000)
      return
    }

    try {
      const attachmentUrl = URL.createObjectURL(file)
      const updateData = {
        name: product.name,
        qr_code: product.qrcode || null,
        category_id: product.categoryId ? Number.parseInt(product.categoryId) : null,
        attachment_url: attachmentUrl,
        attachment_name: file.name,
      }

      setImportMessage("📎 Bezig met uploaden...")
      const result = await updateProduct(product.id, updateData)

      if (result.error) {
        setImportError("Fout bij uploaden bijlage")
        setTimeout(() => setImportError(""), 3000)
      } else {
        setImportMessage("✅ Bijlage toegevoegd!")
        setTimeout(() => setImportMessage(""), 2000)

        const refreshResult = await fetchProducts()
        if (refreshResult.data) {
          setProducts(refreshResult.data)
        }
      }
    } catch (error) {
      setImportError("Fout bij uploaden bijlage")
      setTimeout(() => setImportError(""), 3000)
    }

    event.target.value = ""
  }

  const handleRemoveAttachment = async (product: Product) => {
    try {
      const updateData = {
        name: product.name,
        qr_code: product.qrcode || null,
        category_id: product.categoryId ? Number.parseInt(product.categoryId) : null,
        attachment_url: null,
        attachment_name: null,
      }

      setImportMessage("🗑️ Bezig met verwijderen...")
      const result = await updateProduct(product.id, updateData)

      if (result.error) {
        setImportError("Fout bij verwijderen bijlage")
        setTimeout(() => setImportError(""), 3000)
      } else {
        setImportMessage("✅ Bijlage verwijderd!")
        setTimeout(() => setImportMessage(""), 2000)

        const refreshResult = await fetchProducts()
        if (refreshResult.data) {
          setProducts(refreshResult.data)
        }
      }
    } catch (error) {
      setImportError("Fout bij verwijderen bijlage")
      setTimeout(() => setImportError(""), 3000)
    }
  }

  const generateQRCode = async (product: Product) => {
    try {
      // Genereer een unieke QR code voor het product
      const timestamp = Date.now()
      const productCode = product.name.replace(/\s+/g, "").substring(0, 10).toUpperCase()
      const uniqueQRCode = `${productCode}_${timestamp.toString().slice(-6)}`

      const updateData = {
        name: product.name,
        qr_code: uniqueQRCode,
        category_id: product.categoryId ? Number.parseInt(product.categoryId) : null,
        attachment_url: product.attachmentUrl || null,
        attachment_name: product.attachmentName || null,
      }

      setImportMessage("📱 Bezig met QR-code genereren...")
      const result = await updateProduct(product.id, updateData)

      if (result.error) {
        setImportError("Fout bij genereren QR-code")
        setTimeout(() => setImportError(""), 3000)
      } else {
        setImportMessage(`✅ QR-code gegenereerd: ${uniqueQRCode}`)
        setTimeout(() => setImportMessage(""), 3000)

        const refreshResult = await fetchProducts()
        if (refreshResult.data) {
          setProducts(refreshResult.data)
        }
      }
    } catch (error) {
      setImportError("Fout bij genereren QR-code")
      setTimeout(() => setImportError(""), 3000)
    }
  }

  // PROFESSIONELE QR-CODE GENERATIE met externe API
  const generateRealQRCode = (text: string): string => {
    // Gebruik QR Server API voor professionele QR-codes
    const size = 200
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&format=png&ecc=M`
    return apiUrl
  }

  // Print QR code function
  const printQRCode = async (product: Product) => {
    if (!product.qrcode) return

    try {
      const qrImageUrl = generateRealQRCode(product.qrcode)

      // Create a new window for printing
      const printWindow = window.open("", "_blank")
      if (!printWindow) return

      printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${product.name}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
              text-align: center;
            }
            .qr-container {
              display: inline-block;
              border: 2px solid #000;
              padding: 10px;
              margin: 10px;
              background: white;
            }
            .qr-code {
              width: 150px;
              height: 150px;
              margin-bottom: 10px;
            }
            .product-name {
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 5px;
              word-wrap: break-word;
              max-width: 150px;
            }
            .qr-text {
              font-size: 10px;
              font-family: monospace;
              color: #666;
            }
            @media print {
              body { margin: 0; padding: 5px; }
              .qr-container { 
                page-break-inside: avoid;
                margin: 5px;
                padding: 5px;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="product-name">${product.name}</div>
            <img src="${qrImageUrl}" alt="QR Code" class="qr-code" />
            <div class="qr-text">${product.qrcode}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 1000);
            }
          </script>
        </body>
      </html>
    `)
      printWindow.document.close()
    } catch (error) {
      console.error("Error generating QR code for printing:", error)
      setImportError("Fout bij genereren QR-code voor afdrukken")
      setTimeout(() => setImportError(""), 3000)
    }
  }

  // Add functions
  const addNewUser = async () => {
    if (newUserName.trim() && !users.includes(newUserName.trim())) {
      const userName = newUserName.trim()
      const userRole = newUserRole || "User" // Gebruik geselecteerde role of default 'User'

      const result = await saveUser(userName, userRole)
      if (result.error) {
        setImportError("Fout bij opslaan gebruiker")
        setTimeout(() => setImportError(""), 3000)
      } else {
        // FORCE LOCAL STATE UPDATE
        console.log("🔄 Forcing local users refresh...")
        const refreshResult = await fetchUsers()
        if (refreshResult.data) {
          console.log("🔄 Updating local users state...")
          setUsers(refreshResult.data)
        }
        setImportMessage("✅ Gebruiker toegevoegd!")
        setTimeout(() => setImportMessage(""), 2000)
      }
      setNewUserName("")
      setNewUserRole("User") // Reset role naar default
    }
  }

  const addNewProduct = async () => {
    if (newProductName.trim()) {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: newProductName.trim(),
        qrcode: newProductQrCode.trim() || undefined,
        categoryId: newProductCategory === "none" ? undefined : newProductCategory,
        created_at: new Date().toISOString(),
        category: "",
        serial_number: "",
        purchase_date: "",
        warranty_period: 0,
        location: "",
        notes: "",
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        customer_company: "",
        updated_at: "",
      }

      const result = await saveProduct(newProduct)
      if (result.error) {
        setImportError("Fout bij opslaan product")
        setTimeout(() => setImportError(""), 3000)
      } else {
        // FORCE LOCAL STATE UPDATE - TOEGEVOEGD
        console.log("🔄 Forcing local products refresh...")
        const refreshResult = await fetchProducts()
        if (refreshResult.data) {
          console.log("🔄 Updating local products state...")
          setProducts(refreshResult.data)
        }
        setImportMessage("✅ Product toegevoegd!")
        setTimeout(() => setImportMessage(""), 2000)
      }

      setNewProductName("")
      setNewProductQrCode("")
      setNewProductCategory("none")
    }
  }

  const addNewLocation = async () => {
    if (newLocationName.trim() && !locations.includes(newLocationName.trim())) {
      const locationName = newLocationName.trim()
      const result = await saveLocation(locationName)
      if (result.error) {
        setImportError("Fout bij opslaan locatie")
        setTimeout(() => setImportError(""), 3000)
      } else {
        // FORCE LOCAL STATE UPDATE - TOEGEVOEGD
        console.log("🔄 Forcing local locations refresh...")
        const refreshResult = await fetchLocations()
        if (refreshResult.data) {
          console.log("🔄 Updating local locations state...")
          setLocations(refreshResult.data)
        }
        setImportMessage("✅ Locatie toegevoegd!")
        setTimeout(() => setImportMessage(""), 2000)
      }
      setNewLocationName("")
    }
  }

  const addNewPurpose = async () => {
    if (newPurposeName.trim() && !purposes.includes(newPurposeName.trim())) {
      const purposeName = newPurposeName.trim()
      const result = await savePurpose(purposeName)
      if (result.error) {
        setImportError("Fout bij opslaan doel")
        setTimeout(() => setImportError(""), 3000)
      } else {
        // FORCE LOCAL STATE UPDATE - TOEGEVOEGD
        console.log("🔄 Forcing local purposes refresh...")
        const refreshResult = await fetchPurposes()
        if (refreshResult.data) {
          console.log("🔄 Updating local purposes state...")
          setPurposes(refreshResult.data)
        }
        setImportMessage("✅ Doel toegevoegd!")
        setTimeout(() => setImportMessage(""), 2000)
      }
      setNewPurposeName("")
    }
  }

  const addNewCategory = async () => {
    if (newCategoryName.trim() && !categories.find((c) => c.name === newCategoryName.trim())) {
      const categoryName = newCategoryName.trim()
      const result = await saveCategory({ name: categoryName })
      if (result.error) {
        setImportError("Fout bij opslaan categorie")
        setTimeout(() => setImportError(""), 3000)
      } else {
        // FORCE LOCAL STATE UPDATE - TOEGEVOEGD
        console.log("🔄 Forcing local categories refresh...")
        const refreshResult = await fetchCategories()
        if (refreshResult.data) {
          console.log("🔄 Updating local categories state...")
          setCategories(refreshResult.data)
        }
        setImportMessage("✅ Categorie toegevoegd!")
        setTimeout(() => setImportMessage(""), 2000)
      }
      setNewCategoryName("")
    }
  }

  // Remove functions
  const removeUser = async (userToRemove: string) => {
    const result = await deleteUser(userToRemove)
    if (result.error) {
      setImportError("Fout bij verwijderen gebruiker")
      setTimeout(() => setImportError(""), 3000)
    } else {
      const refreshResult = await fetchUsers()
      if (refreshResult.data) {
        setUsers(refreshResult.data)
      }
      setImportMessage("✅ Gebruiker verwijderd!")
      setTimeout(() => setImportMessage(""), 2000)
    }
  }

  const removeProduct = async (productToRemove: Product) => {
    const result = await deleteProduct(productToRemove.id)
    if (result.error) {
      setImportError("Fout bij verwijderen product")
      setTimeout(() => setImportError(""), 3000)
    } else {
      const refreshResult = await fetchProducts()
      if (refreshResult.data) {
        setProducts(refreshResult.data)
      }
      setImportMessage("✅ Product verwijderd!")
      setTimeout(() => setImportMessage(""), 2000)
    }
  }

  const removeLocation = async (locationToRemove: string) => {
    const result = await deleteLocation(locationToRemove)
    if (result.error) {
      setImportError("Fout bij verwijderen locatie")
      setTimeout(() => setImportError(""), 3000)
    } else {
      const refreshResult = await fetchLocations()
      if (refreshResult.data) {
        setLocations(refreshResult.data)
      }
      setImportMessage("✅ Locatie verwijderd!")
      setTimeout(() => setImportMessage(""), 2000)
    }
  }

  const removePurpose = async (purposeToRemove: string) => {
    const result = await deletePurpose(purposeToRemove)
    if (result.error) {
      setImportError("Fout bij verwijderen doel")
      setTimeout(() => setImportError(""), 3000)
    } else {
      const refreshResult = await fetchPurposes()
      if (refreshResult.data) {
        setPurposes(refreshResult.data)
      }
      setImportMessage("✅ Doel verwijderd!")
      setTimeout(() => setImportMessage(""), 2000)
    }
  }

  const removeCategory = async (categoryToRemove: Category) => {
    const result = await deleteCategory(categoryToRemove.id)
    if (result.error) {
      setImportError("Fout bij verwijderen categorie")
      setTimeout(() => setImportError(""), 3000)
    } else {
      const refreshResult = await fetchCategories()
      if (refreshResult.data) {
        setCategories(refreshResult.data)
      }
      setImportMessage("✅ Categorie verwijderd!")
      setTimeout(() => setImportMessage(""), 2000)
    }
  }

  // Function to get filtered and sorted registrations
  const getFilteredAndSortedRegistrations = () => {
    const filtered = registrations.filter((registration) => {
      // Search filter
      if (historySearchQuery) {
        const searchLower = historySearchQuery.toLowerCase()
        const matchesSearch =
          registration.user.toLowerCase().includes(searchLower) ||
          registration.product.toLowerCase().includes(searchLower) ||
          registration.location.toLowerCase().includes(searchLower) ||
          registration.purpose.toLowerCase().includes(searchLower) ||
          (registration.qrcode && registration.qrcode.toLowerCase().includes(searchLower))

        if (!matchesSearch) return false
      }

      // User filter
      if (selectedHistoryUser !== "all" && registration.user !== selectedHistoryUser) {
        return false
      }

      // Location filter
      if (selectedHistoryLocation !== "all" && registration.location !== selectedHistoryLocation) {
        return false
      }

      // Date range filter
      const registrationDate = new Date(registration.timestamp).toISOString().split("T")[0]

      if (dateFrom && registrationDate < dateFrom) {
        return false
      }

      if (dateTo && registrationDate > dateTo) {
        return false
      }

      return true
    })

    // Sort the filtered results
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "date":
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          break
        case "user":
          comparison = a.user.localeCompare(b.user, "nl", { sensitivity: "base" })
          break
        case "product":
          comparison = a.product.localeCompare(b.product, "nl", { sensitivity: "base" })
          break
        case "location":
          comparison = a.location.localeCompare(b.location, "nl", { sensitivity: "base" })
          break
        default:
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      }

      return sortOrder === "newest" ? -comparison : comparison
    })

    return filtered
  }

  // Function to get filtered and sorted users
  const getFilteredAndSortedUsers = () => {
    return users
      .filter((user) => user.toLowerCase().includes(userSearchQuery.toLowerCase()))
      .sort((a, b) => a.localeCompare(b, "nl", { sensitivity: "base" }))
  }

  // Statistics functions
  const getTopUsers = () => {
    const userCounts = registrations.reduce(
      (acc, reg) => {
        acc[reg.user] = (acc[reg.user] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(userCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
  }

  const getTopProducts = () => {
    const productCounts = registrations.reduce(
      (acc, reg) => {
        acc[reg.product] = (acc[reg.product] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
  }

  const getTopLocations = () => {
    const locationCounts = registrations.reduce(
      (acc, reg) => {
        acc[reg.location] = (acc[reg.location] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(locationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
  }

  const getProductChartData = () => {
    const productCounts = registrations.reduce(
      (acc, reg) => {
        acc[reg.product] = (acc[reg.product] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57", "#ff9ff3", "#54a0ff", "#5f27cd"]

    return Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([product, count], index) => ({
        product,
        count,
        color: colors[index % colors.length],
      }))
  }

  // CONDITIONAL RENDERING AFTER ALL HOOKS
  console.log("🎨 Rendering main app interface")

  // Show loading screen
  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">App wordt geladen...</p>
          <p className="text-xs text-gray-500">{connectionStatus}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      </div>
    )
  }

  // Show error if something went wrong
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-4">
              <div className="text-red-500 text-4xl mb-2">⚠️</div>
              <h2 className="text-xl font-bold text-gray-900">Er ging iets mis</h2>
            </div>
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              🔄 Opnieuw Proberen
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="relative w-8 h-8 mr-3">
                <div className="w-8 h-8 border-4 border-red-500 rounded-full relative">
                  <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
              </div>
              <div className="text-xl font-bold text-red-500 tracking-wide">INTERFLON</div>
              <Separator orientation="vertical" className="mx-4 h-6" />
              <h1 className="text-lg font-semibold text-gray-900">Product Registratie</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={exportToCSV} className="flex items-center bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                Exporteren
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center bg-transparent">
                <LogOut className="w-4 h-4 mr-2" />
                Uitloggen
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products">Producten</TabsTrigger>
            <TabsTrigger value="add-product">Product Toevoegen</TabsTrigger>
            <TabsTrigger value="categories">Categorieën</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            {/* Search and Filter */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="w-5 h-5 mr-2" />
                  Zoeken en Filteren
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Zoeken</Label>
                    <Input
                      id="search"
                      placeholder="Zoek op naam, serienummer, klant..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="sm:w-48">
                    <Label htmlFor="category-filter">Categorie</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Alle categorieën" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle categorieën</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products List */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <Badge variant="secondary" className="mt-1">
                          {product.category}
                        </Badge>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Package className="w-4 h-4 mr-2" />
                        <span className="font-medium">SN:</span>
                        <span className="ml-1">{product.serial_number}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span className="font-medium">Gekocht:</span>
                        <span className="ml-1">{new Date(product.purchase_date).toLocaleDateString("nl-NL")}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span className="font-medium">Locatie:</span>
                        <span className="ml-1">{product.location}</span>
                      </div>
                    </div>

                    {product.customer_name && (
                      <div className="pt-2 border-t">
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center text-gray-600">
                            <User className="w-4 h-4 mr-2" />
                            <span>{product.customer_name}</span>
                          </div>
                          {product.customer_company && (
                            <div className="flex items-center text-gray-600">
                              <Building className="w-4 h-4 mr-2" />
                              <span>{product.customer_company}</span>
                            </div>
                          )}
                          {product.customer_email && (
                            <div className="flex items-center text-gray-600">
                              <Mail className="w-4 h-4 mr-2" />
                              <span className="truncate">{product.customer_email}</span>
                            </div>
                          )}
                          {product.customer_phone && (
                            <div className="flex items-center text-gray-600">
                              <Phone className="w-4 h-4 mr-2" />
                              <span>{product.customer_phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {product.notes && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-gray-600">{product.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Geen producten gevonden</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Add Product Tab */}
          <TabsContent value="add-product">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  {editingProduct ? "Product Bewerken" : "Nieuw Product Toevoegen"}
                </CardTitle>
                <CardDescription>Vul de onderstaande gegevens in om een product te registreren</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Product Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Product Informatie</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Productnaam *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Categorie *</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer categorie" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.name}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="serial_number">Serienummer *</Label>
                        <Input
                          id="serial_number"
                          value={formData.serial_number}
                          onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="purchase_date">Aankoopdatum *</Label>
                        <Input
                          id="purchase_date"
                          type="date"
                          value={formData.purchase_date}
                          onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="warranty_period">Garantieperiode (maanden)</Label>
                        <Input
                          id="warranty_period"
                          type="number"
                          min="0"
                          value={formData.warranty_period}
                          onChange={(e) => setFormData({ ...formData, warranty_period: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Locatie</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Opmerkingen</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Customer Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Klant Informatie</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="customer_name">Klant Naam</Label>
                        <Input
                          id="customer_name"
                          value={formData.customer_name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customer_company">Bedrijf</Label>
                        <Input
                          id="customer_company"
                          value={formData.customer_company}
                          onChange={(e) => setFormData({ ...formData, customer_company: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customer_email">E-mail</Label>
                        <Input
                          id="customer_email"
                          type="email"
                          value={formData.customer_email}
                          onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customer_phone">Telefoon</Label>
                        <Input
                          id="customer_phone"
                          value={formData.customer_phone}
                          onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    {editingProduct && (
                      <Button type="button" variant="outline" onClick={resetForm}>
                        <X className="w-4 h-4 mr-2" />
                        Annuleren
                      </Button>
                    )}
                    <Button type="submit" className="bg-red-600 hover:bg-red-700">
                      <Save className="w-4 h-4 mr-2" />
                      {editingProduct ? "Bijwerken" : "Opslaan"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <CategoryManagement categories={categories} onCategoriesChange={loadCategories} />
          </TabsContent>
        </Tabs>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Beheer</h2>

          <div className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Nieuwe Gebruiker Toevoegen</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Nieuwe gebruiker naam"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addNewUser()}
                  className="flex-1"
                />
                <Select value={newUserRole} onValueChange={setNewUserRole}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="User">User</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={addNewUser} className="bg-amber-600 hover:bg-amber-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Toevoegen
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Nieuw Product Toevoegen</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Nieuw product naam"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addNewProduct()}
                  className="flex-1"
                />
                <Input
                  placeholder="QR code (optioneel)"
                  value={newProductQrCode}
                  onChange={(e) => setNewProductQrCode(e.target.value)}
                  className="w-full sm:w-64"
                />
                <Select value={newProductCategory} onValueChange={setNewProductCategory}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Categorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Geen categorie</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addNewProduct} className="bg-amber-600 hover:bg-amber-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Toevoegen
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Nieuwe Locatie Toevoegen</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Nieuwe locatie naam"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addNewLocation()}
                  className="flex-1"
                />
                <Button onClick={addNewLocation} className="bg-amber-600 hover:bg-amber-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Toevoegen
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Nieuw Doel Toevoegen</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Nieuw doel naam"
                  value={newPurposeName}
                  onChange={(e) => setNewPurposeName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addNewPurpose()}
                  className="flex-1"
                />
                <Button onClick={addNewPurpose} className="bg-amber-600 hover:bg-amber-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Toevoegen
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <h2 className="text-xl font-semibold">Gebruikers</h2>
          <div className="flex items-center space-x-2 mb-4">
            <Input
              type="search"
              placeholder="Zoek gebruikers..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {getFilteredAndSortedUsers().map((user) => (
              <Card key={user} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between p-3">
                  <span className="text-sm font-medium">{user}</span>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeUser(user)} className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator />

          <h2 className="text-xl font-semibold">Locaties</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {locations.map((location) => (
              <Card key={location} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between p-3">
                  <span className="text-sm font-medium">{location}</span>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditLocation(location)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLocation(location)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator />

          <h2 className="text-xl font-semibold">Doelen</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {purposes.map((purpose) => (
              <Card key={purpose} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between p-3">
                  <span className="text-sm font-medium">{purpose}</span>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditPurpose(purpose)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removePurpose(purpose)} className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator />

          <h2 className="text-xl font-semibold">Categorieën</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Card key={category.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between p-3">
                  <span className="text-sm font-medium">{category.name}</span>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditCategory(category)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCategory(category)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
