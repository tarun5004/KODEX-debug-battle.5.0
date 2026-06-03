import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Warehouse,
  Settings,
  User,
  LogOut,
  Plus,
  Trash2,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  UserCircle,
  Shield,
  Briefcase,
  GraduationCap,
  MapPin,
  RefreshCw,
  Search,
  Filter,
  Layers
} from 'lucide-react';

const Dashboard = () => {
  const { user, setUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Navigation state
  const [activeTab, setActiveTab] = useState('overview');

  // Business state
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Settings state (Persisted in localStorage)
  const [storeSettings, setStoreSettings] = useState(() => {
    const saved = localStorage.getItem('storeSettings');
    return saved ? JSON.parse(saved) : {
      storeName: 'GravyCart Admin',
      currency: '$',
      taxRate: '8',
      defaultWarehouse: 'Main Warehouse'
    };
  });

  // Profile local states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    skills: '',
    post: '',
    roles: '',
    address: ''
  });

  const [showProductModal, setShowProductModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);

  const [showProductViewModal, setShowProductViewModal] = useState(false);
  const [showOrderViewModal, setShowOrderViewModal] = useState(false);
  const [selectedViewProduct, setSelectedViewProduct] = useState(null);
  const [selectedViewOrder, setSelectedViewOrder] = useState(null);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    // Dev note: pehle array ko direct mutate kar rahe the; React ko naya array dene se toast reliably render hota hai.
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Form states
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    sku: '',
    category: '',
    initialStock: '0',
    warehouse: storeSettings.defaultWarehouse
  });

  const [productImage, setProductImage] = useState(null);

  // Variations Builder states
  const [productVariants, setProductVariants] = useState([]);
  const [variantDraft, setVariantDraft] = useState({
    size: '',
    color: '',
    price: '',
    stock: '',
    sku: ''
  });

  const [newOrder, setNewOrder] = useState({
    customerName: '',
    status: 'Pending',
    items: [{ productId: '', variantSku: '', quantity: 1 }]
  });

  const [newInventory, setNewInventory] = useState({
    productId: '',
    variantSku: '',
    quantity: '',
    warehouse: storeSettings.defaultWarehouse,
    mode: 'add' // 'add' or 'set'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, ordRes, invRes] = await Promise.all([
        axios.get('/products'),
        axios.get('/orders'),
        axios.get('/inventory')
      ]);
      setProducts(prodRes.data);
      setOrders(ordRes.data);
      setInventory(invRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      // Dev note: API fail hone par spinner stuck tha; catch me loading false karke user ko retry/toast dikhate hain.
      setLoading(false);
      showToast(err.response?.data?.message || 'Failed to load dashboard data', 'destructive');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync profile editing data
  useEffect(() => {
    if (user && user.profile) {
      setProfileData({
        skills: user.profile.skills || '',
        post: user.profile.post || '',
        roles: user.profile.roles || '',
        address: user.profile.address || ''
      });
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Add Variant Draft to List
  const handleAddVariantDraft = () => {
    if (!variantDraft.price || !variantDraft.stock) {
      alert('Price and Stock are required to define a product variant.');
      return;
    }

    const varSku = variantDraft.sku.trim() || 'VAR-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    // Check if variant SKU is unique in draft list
    if (productVariants.some(v => v.sku === varSku)) {
      alert('A variation with this SKU already exists.');
      return;
    }

    setProductVariants([
      ...productVariants,
      {
        sku: varSku,
        price: Number(variantDraft.price),
        stock: Number(variantDraft.stock),
        size: variantDraft.size.trim(),
        color: variantDraft.color.trim()
      }
    ]);

    // Reset draft fields
    setVariantDraft({ size: '', color: '', price: '', stock: '', sku: '' });
  };

  const handleRemoveVariant = (skuToRemove) => {
    setProductVariants(productVariants.filter(v => v.sku !== skuToRemove));
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', newProduct.name);
      formData.append('description', newProduct.description);
      formData.append('price', newProduct.price);
      formData.append('sku', newProduct.sku);
      formData.append('category', newProduct.category);
      formData.append('initialStock', newProduct.initialStock);
      formData.append('warehouse', newProduct.warehouse);
      // Dev note: FormData me object direct bhejne se "[object Object]" ja raha tha; backend JSON.parse karta hai, isliye JSON string bheji.
      formData.append('variants', JSON.stringify(productVariants));

      if (productImage) {
        formData.append('image', productImage);
      }

      // Dev note: server.js me route /api/products mounted hai; singular /product se 404 aa raha tha.
      await axios.post('/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setShowProductModal(false);
      setProductImage(null);
      setProductVariants([]);
      setNewProduct({
        name: '',
        description: '',
        price: '',
        sku: '',
        category: '',
        initialStock: '0',
        warehouse: storeSettings.defaultWarehouse
      });
      showToast(`Product "${newProduct.name}" created successfully.`, 'success');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add product', 'destructive');
    }
  };

  // Add Order handlers
  const handleOrderItemsChange = (index, field, value) => {
    const updatedItems = [...newOrder.items];
    updatedItems[index][field] = value;
    
    // If product is changed, clear selected variantSku
    if (field === 'productId') {
      updatedItems[index]['variantSku'] = '';
    }
    
    setNewOrder({ ...newOrder, items: updatedItems });
  };

  const addOrderItemField = () => {
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, { productId: '', variantSku: '', quantity: 1 }]
    });
  };

  const removeOrderItemField = (index) => {
    const updatedItems = newOrder.items.filter((_, i) => i !== index);
    setNewOrder({ ...newOrder, items: updatedItems });
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    
    const invalid = newOrder.items.some(item => {
      if (!item.productId || item.quantity <= 0) return true;
      const prod = products.find(p => p._id === item.productId);
      if (prod && prod.variants && prod.variants.length > 0 && !item.variantSku) {
        return true;
      }
      return false;
    });

    if (invalid) {
      showToast('Please fill out all product and variant selections, and verify quantities are positive.', 'warning');
      return;
    }

    try {
      const payload = {
        customerName: newOrder.customerName,
        status: newOrder.status,
        items: newOrder.items.map(item => ({
          productId: item.productId,
          variantSku: item.variantSku || undefined,
          quantity: Number(item.quantity)
        }))
      };
      // Dev note: order route bhi plural /api/orders hai; frontend URL ko backend route ke saath match kiya.
      const response = await axios.post('/orders', payload);
      showToast(`Order ${response.data.orderNumber} created successfully.`, 'success');
      setShowOrderModal(false);
      setNewOrder({
        customerName: '',
        status: 'Pending',
        items: [{ productId: '', variantSku: '', quantity: 1 }]
      });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create order', 'destructive');
    }
  };

  // Create/Adjust Inventory handler
  const handleInventorySubmit = async (e) => {
    e.preventDefault();
    if (!newInventory.productId || newInventory.quantity === '') {
      showToast('Please fill all fields', 'warning');
      return;
    }

    const selectedInventoryProduct = products.find(p => p._id === newInventory.productId);
    if (selectedInventoryProduct?.variants?.length > 0 && !newInventory.variantSku) {
      // Dev note: variant product me stock variant level pe manage hota hai; base stock backend sum karta hai, isliye variant select karwana zaroori hai.
      showToast('Please select a variant before adjusting stock for this product.', 'warning');
      return;
    }

    try {
      const qty = Number(newInventory.quantity);
      if (newInventory.mode === 'add') {
        // Increment stock
        await axios.post('/inventory', {
          productId: newInventory.productId,
          variantSku: newInventory.variantSku || undefined,
          quantity: qty,
          warehouse: newInventory.warehouse
        });
      } else {
        // Direct set stock. Need to locate inventory item id if it exists.
        const existingInv = inventory.find(inv => 
          inv.product?._id === newInventory.productId && 
          (inv.variantSku || '') === (newInventory.variantSku || '') &&
          inv.warehouse === newInventory.warehouse
        );

        if (existingInv) {
          await axios.put(`/inventory/${existingInv._id}`, {
            quantity: qty,
            warehouse: newInventory.warehouse
          });
        } else {
          // If no existing inventory in that warehouse, create one
          await axios.post('/inventory', {
            productId: newInventory.productId,
            variantSku: newInventory.variantSku || undefined,
            quantity: qty,
            warehouse: newInventory.warehouse
          });
        }
      }
      showToast('Stock adjusted successfully.', 'success');
      setShowInventoryModal(false);
      setNewInventory({
        productId: '',
        variantSku: '',
        quantity: '',
        warehouse: storeSettings.defaultWarehouse,
        mode: 'add'
      });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to adjust stock', 'destructive');
    }
  };

  // Save Settings handler
  const handleSettingsSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('storeSettings', JSON.stringify(storeSettings));
    showToast('Store settings saved successfully.', 'success');
  };

  // Save Profile handler
  const handleProfileSave = async () => {
    try {
      const response = await axios.put('/users/profile', profileData);
      setUser(response.data);
      setIsEditingProfile(false);
      showToast('Profile updated successfully.', 'success');
    } catch (err) {
      console.error('Failed to update profile', err);
      showToast('Failed to update profile.', 'destructive');
    }
  };

  // Helpers for summary metrics
  const totalSales = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  // Dev note: base inventory already variants ka total rakhta hai; variant rows dobara count karne se dashboard stock double ho raha tha.
  const summaryInventory = inventory.filter(i => !i.variantSku);
  const totalStockItems = summaryInventory.reduce((sum, i) => sum + i.quantity, 0);
  const lowStockCount = summaryInventory.filter(i => i.quantity > 0 && i.quantity < 10).length;
  const outOfStockCount = summaryInventory.filter(i => i.quantity === 0).length;

  if (!user) return null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-zinc-100 font-sans">
      
      {/* Sidebar Navigation - Black Theme */}
      <aside className="w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col shrink-0">
        {/* Brand / Logo - Monochrome */}
        <div className="h-16 flex items-center gap-3 px-6 bg-black border-b border-zinc-900">
          <ShoppingBag className="h-6 w-6 text-white" />
          <span className="font-bold text-sm tracking-wider text-white uppercase">{storeSettings.storeName}</span>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-zinc-900 bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-white uppercase text-xs">
              {user.username?.charAt(0) || '?'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate text-zinc-200">{user.username}</p>
              <span className="text-[10px] text-zinc-400 font-mono px-2 py-0.5 rounded border border-zinc-800 bg-black mt-1 inline-block">
                {user.profile?.roles || 'Admin'}
              </span>
            </div>
          </div>
        </div>

        {/* Menu Navigation - Monochrome */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'products', label: 'Products', icon: ShoppingBag },
            { id: 'orders', label: 'Orders', icon: ShoppingCart },
            { id: 'inventory', label: 'Inventory', icon: Warehouse },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'profile', label: 'Profile', icon: User }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-zinc-900 bg-zinc-950">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 justify-start text-zinc-400 hover:text-white hover:bg-zinc-900 py-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-black">
        
        {/* Top Navbar */}
        <header className="h-16 border-b border-zinc-900 bg-zinc-950/60 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-wide capitalize text-white">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={fetchData}
              disabled={loading}
              className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <span className="text-xs font-mono text-zinc-500 border-l border-zinc-900 pl-4">
              {new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}

          {!loading && (
            <div className="max-w-7xl mx-auto space-y-6">
              
              {/* SECTION: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Grid Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="bg-zinc-950 border-zinc-900 hover:border-zinc-800 transition-all duration-300 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-zinc-400"></div>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-mono text-zinc-400">TOTAL REVENUE</CardTitle>
                        <DollarSign className="h-4 w-4 text-zinc-400" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-semibold text-white">
                          {storeSettings.currency}{totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-1">Excludes cancelled orders</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-zinc-950 border-zinc-900 hover:border-zinc-800 transition-all duration-300 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-zinc-400"></div>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-mono text-zinc-400">TOTAL ORDERS</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-zinc-400" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-semibold text-white">{orders.length}</div>
                        <p className="text-[10px] text-zinc-500 mt-1">Recorded sales logs</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-zinc-950 border-zinc-900 hover:border-zinc-800 transition-all duration-300 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-zinc-400"></div>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-mono text-zinc-400">UNIQUE PRODUCTS</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-zinc-400" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-semibold text-white">{products.length}</div>
                        <p className="text-[10px] text-zinc-500 mt-1">Catalog items listed</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-zinc-950 border-zinc-900 hover:border-zinc-800 transition-all duration-300 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-zinc-400"></div>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-mono text-zinc-400">WAREHOUSE STOCK</CardTitle>
                        <Warehouse className="h-4 w-4 text-zinc-400" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-semibold text-white">{totalStockItems}</div>
                        <p className="text-[10px] text-zinc-450 mt-1">
                          {lowStockCount} low stock • {outOfStockCount} out of stock
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Stock Warnings */}
                  {(lowStockCount > 0 || outOfStockCount > 0) && (
                    <div className="bg-zinc-950 border border-zinc-800 p-4 rounded flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-white shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-white">Inventory Attention Required</h4>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          There are currently <span className="font-semibold text-white">{outOfStockCount}</span> items out of stock and <span className="font-semibold text-white">{lowStockCount}</span> items low in stock. Please visit the Inventory tab to replenish items.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Split Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Orders */}
                    <Card className="lg:col-span-2 bg-zinc-950 border-zinc-900">
                      <CardHeader>
                        <CardTitle className="text-white text-base">Recent Orders</CardTitle>
                        <CardDescription className="text-zinc-500">Latest shop activities log</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {orders.length === 0 ? (
                          <p className="text-sm text-zinc-550 py-6 text-center">No orders created yet.</p>
                        ) : (
                          <Table>
                            <TableHeader className="border-zinc-900">
                              <TableRow className="hover:bg-transparent border-zinc-900">
                                <TableHead className="text-zinc-400">Order #</TableHead>
                                <TableHead className="text-zinc-400">Customer</TableHead>
                                <TableHead className="text-zinc-400">Total</TableHead>
                                <TableHead className="text-zinc-400">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {orders.slice(-5).reverse().map((order) => (
                               <TableRow 
                                  key={order._id} 
                                  className="border-zinc-900 hover:bg-zinc-900/40 cursor-pointer"
                                  onClick={() => {
                                    setSelectedViewOrder(order);
                                    setShowOrderViewModal(true);
                                  }}
                                >
                                  <TableCell className="font-mono text-white text-xs">{order.orderNumber}</TableCell>
                                  <TableCell>{order.customerName}</TableCell>
                                  <TableCell className="text-white font-medium">{storeSettings.currency}{order.totalAmount.toFixed(2)}</TableCell>
                                  <TableCell>
                                    <Badge variant={
                                      order.status === 'Delivered' ? 'success' :
                                      order.status === 'Cancelled' ? 'destructive' :
                                      order.status === 'Shipped' ? 'info' :
                                      'warning'
                                    }>
                                      {order.status}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>

                    {/* Recently Added Products */}
                    <Card className="bg-zinc-950 border-zinc-900">
                      <CardHeader>
                        <CardTitle className="text-white text-base">Catalog Highlights</CardTitle>
                        <CardDescription className="text-zinc-500">Newly added items</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {products.length === 0 ? (
                          <p className="text-sm text-zinc-550 py-6 text-center">No products in catalog.</p>
                        ) : (
                          <div className="space-y-3">
                            {products.slice(-4).reverse().map((product) => (
                              <div 
                                key={product._id} 
                                className="flex justify-between items-center p-3 rounded bg-zinc-900/50 border border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors"
                                onClick={() => {
                                  setSelectedViewProduct(product);
                                  setShowProductViewModal(true);
                                }}
                              >
                                <div>
                                  <h4 className="text-sm font-semibold text-white">{product.name}</h4>
                                  <p className="text-xs text-zinc-550 mt-0.5">{product.category} • SKU: {product.sku}</p>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-semibold text-white">{storeSettings.currency}{product.price.toFixed(2)}</span>
                                  <p className="text-xs text-zinc-500 mt-0.5">Stock: {product.stock}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* SECTION: PRODUCTS */}
              {activeTab === 'products' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-zinc-950 p-6 rounded border border-zinc-900">
                    <div>
                      <h2 className="text-lg font-bold text-white">Product Catalog</h2>
                      <p className="text-sm text-zinc-550">List, add, and inspect details of all products in inventory.</p>
                    </div>
                    <Button onClick={() => setShowProductModal(true)} className="bg-white text-black hover:bg-zinc-200 flex items-center gap-2 font-medium shadow">
                      <Plus className="h-4 w-4" />
                      Add Product
                    </Button>
                  </div>

                  <Card className="bg-zinc-950 border-zinc-900">
                    <CardContent className="p-6">
                      {products.length === 0 ? (
                        <div className="text-center py-12">
                          <ShoppingBag className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
                          <h3 className="font-semibold text-zinc-300">No Products Listed</h3>
                          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">Get started by creating your first product item in the database catalog.</p>
                          <Button onClick={() => setShowProductModal(true)} className="mt-4 bg-white text-black hover:bg-zinc-250">
                            Create Product
                          </Button>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader className="border-zinc-900">
                            <TableRow className="hover:bg-transparent border-zinc-900">
                              <TableHead className="text-zinc-400">SKU</TableHead>
                              <TableHead className="text-zinc-400">Product Name</TableHead>
                              <TableHead className="text-zinc-400">Category</TableHead>
                              <TableHead className="text-zinc-400">Price</TableHead>
                              <TableHead className="text-zinc-400">Warehouse Stock</TableHead>
                              <TableHead className="text-zinc-400">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {products.map((product) => (
                              <TableRow 
                                key={product._id} 
                                className="border-zinc-900 hover:bg-zinc-900/40 cursor-pointer"
                                onClick={() => {
                                  setSelectedViewProduct(product);
                                  setShowProductViewModal(true);
                                }}
                              >
                                <TableCell className="font-mono text-white text-xs">{product.sku}</TableCell>
                                <TableCell className="font-semibold text-zinc-200">
                                  <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-3">
                                      {product.image ? (
                                        <img 
                                          src={product.image} 
                                          alt={product.name} 
                                          className="h-9 w-9 object-cover rounded border border-zinc-800 bg-zinc-900 shrink-0" 
                                        />
                                      ) : (
                                        <div className="h-9 w-9 rounded border border-zinc-800 bg-zinc-900 flex items-center justify-center text-[9px] text-zinc-500 font-medium shrink-0">
                                          No Img
                                        </div>
                                      )}
                                      <span className="truncate max-w-[180px]">{product.name}</span>
                                    </div>
                                    {/* Variation indicators */}
                                    {product.variants && product.variants.length > 0 && (
                                      <div className="flex flex-wrap gap-1 pl-12">
                                        {product.variants.map((v) => (
                                          <Badge key={v._id || v.sku} variant="secondary" className="text-[9px] px-1 py-0 bg-zinc-900 border-zinc-800 text-zinc-400 uppercase font-mono">
                                            {v.size || ''}{v.size && v.color ? '/' : ''}{v.color || ''} ({v.stock})
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{product.category}</TableCell>
                                <TableCell className="text-white font-medium">
                                  {product.variants && product.variants.length > 0 ? (
                                    <span className="text-xs text-zinc-400 font-mono">
                                      {storeSettings.currency}{Math.min(...product.variants.map(v => v.price))} - {storeSettings.currency}{Math.max(...product.variants.map(v => v.price))}
                                    </span>
                                  ) : (
                                    `${storeSettings.currency}${product.price.toFixed(2)}`
                                  )}
                                </TableCell>
                                <TableCell className="text-zinc-300 font-mono">{product.stock}</TableCell>
                                <TableCell>
                                  {product.stock === 0 ? (
                                    <Badge variant="destructive">Out of stock</Badge>
                                  ) : product.stock < 10 ? (
                                    <Badge variant="warning" className="animate-pulse">Low stock</Badge>
                                  ) : (
                                    <Badge variant="success">In stock</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* SECTION: ORDERS */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-zinc-950 p-6 rounded border border-zinc-900">
                    <div>
                      <h2 className="text-lg font-bold text-white">Orders Log</h2>
                      <p className="text-sm text-zinc-550">Record customer billing details and monitor order progress.</p>
                    </div>
                    <Button 
                      onClick={() => {
                        if (products.length === 0) {
                          alert('Please create at least one product before placing an order.');
                          return;
                        }
                        setShowOrderModal(true);
                      }} 
                      className="bg-white text-black hover:bg-zinc-200 flex items-center gap-2 font-medium shadow"
                    >
                      <Plus className="h-4 w-4" />
                      Add Order
                    </Button>
                  </div>

                  <Card className="bg-zinc-950 border-zinc-900">
                    <CardContent className="p-6">
                      {orders.length === 0 ? (
                        <div className="text-center py-12">
                          <ShoppingCart className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
                          <h3 className="font-semibold text-zinc-300">No Orders Placed</h3>
                          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">Draft a custom order by clicking the create order button above.</p>
                          <Button 
                            onClick={() => {
                              if (products.length === 0) {
                                alert('Please create at least one product before placing an order.');
                                return;
                              }
                              setShowOrderModal(true);
                            }} 
                            className="mt-4 bg-white text-black hover:bg-zinc-200"
                          >
                            Add Order
                          </Button>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader className="border-zinc-900">
                            <TableRow className="hover:bg-transparent border-zinc-900">
                              <TableHead className="text-zinc-400">Order #</TableHead>
                              <TableHead className="text-zinc-400">Customer Name</TableHead>
                              <TableHead className="text-zinc-400">Items (SKU)</TableHead>
                              <TableHead className="text-zinc-400">Date</TableHead>
                              <TableHead className="text-zinc-400">Total Amount</TableHead>
                              <TableHead className="text-zinc-400">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {orders.map((order) => {
                              return (
                                <TableRow 
                                  key={order._id} 
                                  className="border-zinc-900 hover:bg-zinc-900/40 cursor-pointer"
                                  onClick={() => {
                                    setSelectedViewOrder(order);
                                    setShowOrderViewModal(true);
                                  }}
                                >
                                  <TableCell className="font-mono text-white text-xs">{order.orderNumber}</TableCell>
                                  <TableCell className="font-semibold text-zinc-200">{order.customerName}</TableCell>
                                  <TableCell>
                                    <div className="flex flex-col gap-1">
                                      {order.items?.map((item, i) => (
                                        <span key={i} className="text-xs text-zinc-400">
                                          {item.product?.name || 'Deleted Product'} ({item.quantity}x)
                                          {item.variantSku && (
                                            <code className="ml-1.5 bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 px-1 py-0.2 rounded font-mono">
                                              {item.variantSku}
                                            </code>
                                          )}
                                        </span>
                                      ))}
                                    </div>
                                  </TableCell>
                                  <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                                  <TableCell className="text-white font-medium">{storeSettings.currency}{order.totalAmount.toFixed(2)}</TableCell>
                                  <TableCell>
                                    <Badge variant={
                                      order.status === 'Delivered' ? 'success' :
                                      order.status === 'Cancelled' ? 'destructive' :
                                      order.status === 'Shipped' ? 'info' :
                                      'warning'
                                    }>
                                      {order.status}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* SECTION: INVENTORY */}
              {activeTab === 'inventory' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-zinc-950 p-6 rounded border border-zinc-900">
                    <div>
                      <h2 className="text-lg font-bold text-white">Stock Allocation</h2>
                      <p className="text-sm text-zinc-550">Configure warehoused products and handle stock levels manually.</p>
                    </div>
                    <Button 
                      onClick={() => {
                        if (products.length === 0) {
                          alert('Create a product in catalog first.');
                          return;
                        }
                        setShowInventoryModal(true);
                      }} 
                      className="bg-white text-black hover:bg-zinc-200 flex items-center gap-2 font-medium shadow"
                    >
                      <Plus className="h-4 w-4" />
                      Create/Adjust Stock
                    </Button>
                  </div>

                  <Card className="bg-zinc-950 border-zinc-900">
                    <CardContent className="p-6">
                      {inventory.length === 0 ? (
                        <div className="text-center py-12">
                          <Warehouse className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
                          <h3 className="font-semibold text-zinc-300">No Inventory Records Found</h3>
                          <p className="text-xs text-zinc-550 max-w-sm mx-auto mt-1">Products currently do not have inventory associations.</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader className="border-zinc-900">
                            <TableRow className="hover:bg-transparent border-zinc-900">
                              <TableHead className="text-zinc-400">Warehouse Location</TableHead>
                              <TableHead className="text-zinc-400">Product Name</TableHead>
                              <TableHead className="text-zinc-400">Variant SKU</TableHead>
                              <TableHead className="text-zinc-400">Qty on Hand</TableHead>
                              <TableHead className="text-zinc-400">Last Updated</TableHead>
                              <TableHead className="text-zinc-400">Stock Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {inventory.map((inv) => (
                              <TableRow key={inv._id} className="border-zinc-900 hover:bg-zinc-900/40">
                                <TableCell className="font-semibold text-zinc-200">{inv.warehouse}</TableCell>
                                <TableCell className="text-zinc-300">{inv.product?.name || 'Deleted Product'}</TableCell>
                                <TableCell className="font-mono text-zinc-400 text-xs">{inv.variantSku || '(Base Product)'}</TableCell>
                                <TableCell className="font-mono font-bold text-white">{inv.quantity}</TableCell>
                                <TableCell className="text-xs">{new Date(inv.updatedAt).toLocaleString()}</TableCell>
                                <TableCell>
                                  {inv.quantity === 0 ? (
                                    <Badge variant="destructive">Stock Empty</Badge>
                                  ) : inv.quantity < 10 ? (
                                    <Badge variant="warning">Restock Soon</Badge>
                                  ) : (
                                    <Badge variant="success">Full Stock</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* SECTION: SETTINGS */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <Card className="bg-zinc-950 border-zinc-900">
                    <CardHeader>
                      <CardTitle className="text-white">Store Configurations</CardTitle>
                      <CardDescription className="text-zinc-450">Configure localized settings for the administration panel.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSettingsSubmit} className="space-y-6 max-w-2xl">
                        <div className="space-y-2">
                          <Label htmlFor="storeName" className="text-zinc-300">Store Title Name</Label>
                          <Input
                            id="storeName"
                            type="text"
                            value={storeSettings.storeName}
                            onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                            className="bg-black border-zinc-800 text-white"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="currency" className="text-zinc-300">Currency Symbol</Label>
                            <Select 
                              value={storeSettings.currency} 
                              onValueChange={(val) => setStoreSettings({ ...storeSettings, currency: val })}
                            >
                              <SelectTrigger className="bg-black border-zinc-800 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-200">
                                <SelectItem value="$">USD ($)</SelectItem>
                                <SelectItem value="€">EUR (€)</SelectItem>
                                <SelectItem value="£">GBP (£)</SelectItem>
                                <SelectItem value="₹">INR (₹)</SelectItem>
                                <SelectItem value="¥">JPY (¥)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="taxRate" className="text-zinc-300">Default Tax Rate (%)</Label>
                            <Input
                              id="taxRate"
                              type="number"
                              value={storeSettings.taxRate}
                              onChange={(e) => setStoreSettings({ ...storeSettings, taxRate: e.target.value })}
                              className="bg-black border-zinc-800 text-white"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="defaultWarehouse" className="text-zinc-300">Default Storage Warehouse</Label>
                          <Input
                            id="defaultWarehouse"
                            type="text"
                            value={storeSettings.defaultWarehouse}
                            onChange={(e) => setStoreSettings({ ...storeSettings, defaultWarehouse: e.target.value })}
                            className="bg-black border-zinc-800 text-white"
                          />
                        </div>
                        <Button type="submit" className="bg-white text-black hover:bg-zinc-200 font-medium">
                          Save Settings
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* SECTION: PROFILE */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* User Identity Card */}
                  <Card className="bg-zinc-950 border-zinc-900">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                        <div className="h-20 w-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-3xl font-semibold text-white uppercase shrink-0">
                          {user?.username?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 w-full">
                          <div className="flex justify-between items-start">
                            <div>
                              <h2 className="text-xl font-bold text-white">{user?.username || 'Unknown User'}</h2>
                              <p className="text-zinc-450 text-sm">{user.email}</p>
                            </div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono bg-zinc-900 text-zinc-300 border border-zinc-800">
                              System Administrator
                            </span>
                          </div>

                          <div className="mt-6 bg-zinc-900/50 border border-zinc-800 rounded p-4 text-xs">
                            <div className="flex items-center gap-2 mb-2 text-zinc-300 font-semibold">
                              <UserCircle className="h-4 w-4 text-zinc-400" />
                              Technical Profile Details
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-450">
                              <p><span className="font-semibold text-zinc-350">ID:</span> {user.id || user._id}</p>
                              <p><span className="font-semibold text-zinc-355">Username:</span> {user.username}</p>
                              <p><span className="font-semibold text-zinc-355">Email:</span> {user.email}</p>
                              {/* Dev note: backend ab password hash nahi bhejta; profile me secret display karna production risk tha. */}
                              <p className="sm:col-span-2 break-all">
                                <span className="font-semibold text-zinc-355">Password:</span>{' '}
                                <span className="text-zinc-500">Hidden for security</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Professional profile settings */}
                  <Card className="bg-zinc-950 border-zinc-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div>
                        <CardTitle className="text-white text-base">Professional Settings</CardTitle>
                        <CardDescription className="text-zinc-500">Administrate system metadata preferences.</CardDescription>
                      </div>
                      {!isEditingProfile ? (
                        <Button onClick={() => setIsEditingProfile(true)} className="bg-white text-black hover:bg-zinc-200">Edit Profile</Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setIsEditingProfile(false)} className="border-zinc-850 text-zinc-300">Cancel</Button>
                          <Button onClick={handleProfileSave} className="bg-white text-black hover:bg-zinc-200">Save Changes</Button>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      {isEditingProfile ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                          <div className="space-y-2">
                            <Label className="text-zinc-300 text-xs">Primary Skill</Label>
                            <Select value={profileData.skills} onValueChange={(val) => setProfileData({ ...profileData, skills: val })}>
                              <SelectTrigger className="bg-black border-zinc-800 text-white">
                                <SelectValue placeholder="Select a skill..." />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-200">
                                <SelectItem value="React">React</SelectItem>
                                <SelectItem value="Node.js">Node.js</SelectItem>
                                <SelectItem value="Python">Python</SelectItem>
                                <SelectItem value="Java">Java</SelectItem>
                                <SelectItem value="UI/UX Design">UI/UX Design</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-zinc-300 text-xs">Post / Position</Label>
                            <Select value={profileData.post} onValueChange={(val) => setProfileData({ ...profileData, post: val })}>
                              <SelectTrigger className="bg-black border-zinc-800 text-white">
                                <SelectValue placeholder="Select a position..." />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-200">
                                <SelectItem value="Junior Developer">Junior Developer</SelectItem>
                                <SelectItem value="Senior Developer">Senior Developer</SelectItem>
                                <SelectItem value="Tech Lead">Tech Lead</SelectItem>
                                <SelectItem value="Product Manager">Product Manager</SelectItem>
                                <SelectItem value="Designer">Designer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-zinc-300 text-xs">Roles</Label>
                            <Select value={profileData.roles} onValueChange={(val) => setProfileData({ ...profileData, roles: val })}>
                              <SelectTrigger className="bg-black border-zinc-800 text-white">
                                <SelectValue placeholder="Select a role..." />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-200">
                                <SelectItem value="User">User</SelectItem>
                                <SelectItem value="Editor">Editor</SelectItem>
                                <SelectItem value="Admin">Admin</SelectItem>
                                <SelectItem value="Super Admin">Super Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-zinc-300 text-xs">Personal Address</Label>
                            <Input 
                              type="text" 
                              name="address" 
                              value={profileData.address} 
                              onChange={(e) => setProfileData({ ...profileData, address: e.target.value })} 
                              placeholder="e.g. 123 Main St, City"
                              className="bg-black border-zinc-800 text-white"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="p-4 rounded bg-zinc-900/40 border border-zinc-800 flex items-start gap-3">
                            <div className="bg-black p-2 rounded border border-zinc-900">
                              <GraduationCap className="h-5 w-5 text-zinc-300" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-zinc-250">Primary Skill</h3>
                              <p className="text-zinc-400 mt-1">{user.profile?.skills || 'Not specified'}</p>
                            </div>
                          </div>

                          <div className="p-4 rounded bg-zinc-900/40 border border-zinc-800 flex items-start gap-3">
                            <div className="bg-black p-2 rounded border border-zinc-900">
                              <Briefcase className="h-5 w-5 text-zinc-300" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-zinc-250">Post / Position</h3>
                              <p className="text-zinc-400 mt-1">{user.profile?.post || 'Not specified'}</p>
                            </div>
                          </div>

                          <div className="p-4 rounded bg-zinc-900/40 border border-zinc-800 flex items-start gap-3">
                            <div className="bg-black p-2 rounded border border-zinc-900">
                              <Shield className="h-5 w-5 text-zinc-300" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-zinc-250">Roles</h3>
                              <p className="text-zinc-400 mt-1">{user.profile?.roles || 'Not specified'}</p>
                            </div>
                          </div>

                          <div className="p-4 rounded bg-zinc-900/40 border border-zinc-800 flex items-start gap-3">
                            <div className="bg-black p-2 rounded border border-zinc-900">
                              <MapPin className="h-5 w-5 text-zinc-300" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-zinc-250">Personal Address</h3>
                              <p className="text-zinc-400 mt-1">{user.profile?.address || 'Not specified'}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* MODALS */}

      {/* Modal: Add Product with Variations */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="sm:max-w-2xl border-zinc-900 bg-zinc-950 text-slate-100 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-bold">Add New Product</DialogTitle>
            <DialogDescription className="text-zinc-450">
              Create a new product item with optional size and color variants.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProductSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label htmlFor="prod-name" className="text-zinc-300 text-xs">Product Name *</Label>
                <Input
                  id="prod-name"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="bg-black border-zinc-800 text-white"
                  placeholder="e.g. Graphic Tee"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="prod-price" className="text-zinc-300 text-xs">Price ({storeSettings.currency}) *</Label>
                <Input
                  id="prod-price"
                  type="number"
                  step="0.01"
                  required={productVariants.length === 0}
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  className="bg-black border-zinc-800 text-white disabled:opacity-50"
                  placeholder="99.99"
                  disabled={productVariants.length > 0}
                />
                {productVariants.length > 0 && (
                  <p className="text-[10px] text-zinc-500 mt-0.5">Price is defined by variants below.</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="prod-category" className="text-zinc-400 text-xs">Category</Label>
                <Input
                  id="prod-category"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="bg-black border-zinc-800 text-white"
                  placeholder="Apparel"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="prod-sku" className="text-zinc-400 text-xs">Base SKU (Auto-generated if empty)</Label>
                <Input
                  id="prod-sku"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                  className="bg-black border-zinc-800 text-white"
                  placeholder="e.g. AP-TSHIRT"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="prod-stock" className="text-zinc-400 text-xs">Base Stock (Only if no variants)</Label>
                <Input
                  id="prod-stock"
                  type="number"
                  value={newProduct.initialStock}
                  onChange={(e) => setNewProduct({ ...newProduct, initialStock: e.target.value })}
                  className="bg-black border-zinc-800 text-white disabled:opacity-50"
                  disabled={productVariants.length > 0}
                />
                {productVariants.length > 0 && (
                  <p className="text-[10px] text-zinc-500 mt-0.5">Stock is defined by variants below.</p>
                )}
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="prod-image" className="text-zinc-400 text-xs">Product Image Photo</Label>
                <Input
                  id="prod-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProductImage(e.target.files[0])}
                  className="bg-black border-zinc-800 text-zinc-350 cursor-pointer file:bg-zinc-900 file:text-zinc-300 file:border-0 file:rounded file:px-2 file:py-0.5 file:mr-2 hover:file:bg-zinc-800"
                />
              </div>
            </div>

            {/* VARIATIONS BUILDER SECTION */}
            <div className="border border-zinc-800 rounded p-4 bg-zinc-900/30 space-y-3">
              <h4 className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 border-b border-zinc-800 pb-2">
                <Layers className="h-4 w-4 text-zinc-400" />
                Product Variations (Size, Color, Custom Pricing & Stock)
              </h4>

              {/* Added Variants List */}
              {productVariants.length > 0 && (
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                  {productVariants.map((v) => (
                    <div key={v.sku} className="flex justify-between items-center bg-black/50 border border-zinc-850/80 px-3 py-1.5 rounded text-xs font-mono">
                      <span>
                        Size: <strong className="text-white">{v.size || 'N/A'}</strong> | 
                        Color: <strong className="text-white">{v.color || 'N/A'}</strong> | 
                        SKU: <strong className="text-zinc-300">{v.sku}</strong>
                      </span>
                      <div className="flex items-center gap-4">
                        <span>{storeSettings.currency}{v.price.toFixed(2)} ({v.stock} in stock)</span>
                        <button type="button" onClick={() => handleRemoveVariant(v.sku)} className="text-red-400 hover:text-red-300">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Variation Draft Inputs */}
              <div className="grid grid-cols-5 gap-2.5 items-end">
                <div className="space-y-1">
                  <Label className="text-[10px] text-zinc-400">Size</Label>
                  <Input 
                    value={variantDraft.size} 
                    onChange={e => setVariantDraft({ ...variantDraft, size: e.target.value })}
                    placeholder="e.g. L"
                    className="h-8 text-xs bg-black border-zinc-800 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-zinc-400">Color</Label>
                  <Input 
                    value={variantDraft.color} 
                    onChange={e => setVariantDraft({ ...variantDraft, color: e.target.value })}
                    placeholder="e.g. Red"
                    className="h-8 text-xs bg-black border-zinc-800 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-zinc-400">Price *</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={variantDraft.price} 
                    onChange={e => setVariantDraft({ ...variantDraft, price: e.target.value })}
                    placeholder="24.99"
                    className="h-8 text-xs bg-black border-zinc-800 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-zinc-400">Stock *</Label>
                  <Input 
                    type="number"
                    value={variantDraft.stock} 
                    onChange={e => setVariantDraft({ ...variantDraft, stock: e.target.value })}
                    placeholder="15"
                    className="h-8 text-xs bg-black border-zinc-800 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-zinc-400">SKU</Label>
                  <Input 
                    value={variantDraft.sku} 
                    onChange={e => setVariantDraft({ ...variantDraft, sku: e.target.value })}
                    placeholder="T-L-RED"
                    className="h-8 text-xs bg-black border-zinc-800 text-white"
                  />
                </div>
                <div className="col-span-5 flex justify-end">
                  <Button 
                    type="button" 
                    onClick={handleAddVariantDraft} 
                    variant="outline"
                    className="h-8 text-xs border-zinc-800 text-zinc-300 hover:bg-zinc-900"
                  >
                    + Add Variation Row
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="prod-desc" className="text-zinc-400 text-xs">Product Description</Label>
              <textarea
                id="prod-desc"
                rows="3"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                className="w-full bg-black border border-zinc-800 rounded p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-zinc-650"
                placeholder="Describe your product catalog details..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900">
              <Button type="button" variant="outline" onClick={() => setShowProductModal(false)} className="border-zinc-800 text-zinc-450">Cancel</Button>
              <Button type="submit" className="bg-white text-black hover:bg-zinc-200">Save Product</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Create Order with Variant Selection */}
      <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
        <DialogContent className="sm:max-w-2xl border-zinc-900 bg-zinc-950 text-slate-100 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-bold">Add New Customer Order</DialogTitle>
            <DialogDescription className="text-zinc-450">
              Draft and log a customer transaction order.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleOrderSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="ord-cust" className="text-zinc-400 text-xs">Customer Name *</Label>
                <Input
                  id="ord-cust"
                  required
                  value={newOrder.customerName}
                  onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                  className="bg-black border-zinc-800 text-white"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ord-status" className="text-zinc-400 text-xs">Status</Label>
                <Select 
                  value={newOrder.status} 
                  onValueChange={(val) => setNewOrder({ ...newOrder, status: val })}
                >
                  <SelectTrigger className="bg-black border-zinc-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-900 text-slate-200">
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="Shipped">Shipped</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Order Items List */}
            <div className="space-y-3 pt-3">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                <h4 className="text-sm font-semibold text-zinc-300 flex items-center gap-1.5">
                  <ShoppingCart className="h-4 w-4 text-zinc-400" />
                  Ordered Items
                </h4>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addOrderItemField} 
                  className="border-zinc-800 text-xs h-8 text-zinc-350 hover:bg-zinc-900 flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Item Line
                </Button>
              </div>

              <div className="space-y-3">
                {newOrder.items.map((item, idx) => {
                  const selectedProduct = products.find(p => p._id === item.productId);
                  const hasVariants = selectedProduct?.variants && selectedProduct.variants.length > 0;

                  return (
                    <div key={idx} className="flex flex-col gap-3 bg-zinc-900/30 border border-zinc-850 p-4 rounded">
                      <div className="flex gap-4 items-end">
                        <div className="flex-1 space-y-1">
                          <Label className="text-zinc-400 text-[10px]">Select Product</Label>
                          <Select 
                            value={item.productId} 
                            onValueChange={(val) => handleOrderItemsChange(idx, 'productId', val)}
                          >
                            <SelectTrigger className="bg-black border-zinc-800 text-white h-9">
                              <SelectValue placeholder="Choose a product..." />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-950 border-zinc-900 text-slate-200">
                              {products.map(p => (
                                <SelectItem key={p._id} value={p._id}>
                                  {p.name} (Base SKU: {p.sku})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-24 space-y-1">
                          <Label className="text-zinc-400 text-[10px]">Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            required
                            value={item.quantity}
                            onChange={(e) => handleOrderItemsChange(idx, 'quantity', e.target.value)}
                            className="bg-black border-zinc-800 text-white h-9"
                          />
                        </div>
                        {newOrder.items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => removeOrderItemField(idx)}
                            className="text-red-400 hover:text-red-300 hover:bg-zinc-900/50 h-9 px-3 shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Variant selector dropdown if product has variations */}
                      {hasVariants && (
                        <div className="space-y-1">
                          <Label className="text-zinc-400 text-[10px]">Select Variation *</Label>
                          <Select 
                            value={item.variantSku} 
                            onValueChange={(val) => handleOrderItemsChange(idx, 'variantSku', val)}
                          >
                            <SelectTrigger className="bg-black border-zinc-800 text-white h-9">
                              <SelectValue placeholder="Choose size / color variant..." />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-950 border-zinc-900 text-slate-200">
                              {selectedProduct.variants.map(v => (
                                <SelectItem key={v.sku} value={v.sku}>
                                  {v.size ? `Size: ${v.size} ` : ''} 
                                  {v.color ? `Color: ${v.color} ` : ''} 
                                  ({storeSettings.currency}{v.price.toFixed(2)} - Stock: {v.stock})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900">
              <Button type="button" variant="outline" onClick={() => setShowOrderModal(false)} className="border-zinc-800 text-zinc-355">Cancel</Button>
              <Button type="submit" className="bg-white text-black hover:bg-zinc-200">Submit Order</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Adjust Inventory */}
      <Dialog open={showInventoryModal} onOpenChange={setShowInventoryModal}>
        <DialogContent className="sm:max-w-md border-zinc-900 bg-zinc-950 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-bold">Create / Adjust Inventory</DialogTitle>
            <DialogDescription className="text-slate-400">
              Increase, decrease, or overwrite stock quantities.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInventorySubmit} className="p-6 space-y-4">
            <div className="space-y-1">
              <Label className="text-zinc-355 text-xs">Select Product *</Label>
              <Select 
                value={newInventory.productId} 
                onValueChange={(val) => setNewInventory({ ...newInventory, productId: val, variantSku: '' })}
              >
                <SelectTrigger className="bg-black border-zinc-800 text-white">
                  <SelectValue placeholder="Choose product..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-900 text-slate-200">
                  {products.map(p => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name} (SKU: {p.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* If product has variations, allow choosing which variation inventory to adjust */}
            {newInventory.productId && products.find(p => p._id === newInventory.productId)?.variants?.length > 0 && (
              <div className="space-y-1">
                <Label className="text-zinc-355 text-xs">Select Variant *</Label>
                <Select 
                  value={newInventory.variantSku} 
                  onValueChange={(val) => setNewInventory({ ...newInventory, variantSku: val })}
                >
                  <SelectTrigger className="bg-black border-zinc-800 text-white">
                    <SelectValue placeholder="Choose variant SKU..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-900 text-slate-200">
                    {/* Dev note: Radix Select empty string value allow nahi karta; blank base option hata diya so dropdown crash na kare. */}
                    {products.find(p => p._id === newInventory.productId).variants.map(v => (
                      <SelectItem key={v.sku} value={v.sku}>
                        {v.sku} ({v.size || ''}{v.size && v.color ? '/' : ''}{v.color || ''})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="inv-warehouse" className="text-zinc-355 text-xs">Warehouse Location</Label>
              <Input
                id="inv-warehouse"
                required
                value={newInventory.warehouse}
                onChange={(e) => setNewInventory({ ...newInventory, warehouse: e.target.value })}
                className="bg-black border-zinc-800 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-zinc-455 text-xs">Adjustment Method</Label>
                <Select 
                  value={newInventory.mode} 
                  onValueChange={(val) => setNewInventory({ ...newInventory, mode: val })}
                >
                  <SelectTrigger className="bg-black border-zinc-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-900 text-slate-200">
                    <SelectItem value="add">Add/Deduct Stock (+/-)</SelectItem>
                    <SelectItem value="set">Overwrite Stock (Direct)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="inv-qty" className="text-zinc-300 text-xs">Quantity *</Label>
                <Input
                  id="inv-qty"
                  type="number"
                  required
                  value={newInventory.quantity}
                  onChange={(e) => setNewInventory({ ...newInventory, quantity: e.target.value })}
                  className="bg-black border-zinc-800 text-white"
                  placeholder="e.g. 50 or -10"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900">
              <Button type="button" variant="outline" onClick={() => setShowInventoryModal(false)} className="border-zinc-800 text-zinc-350">Cancel</Button>
              <Button type="submit" className="bg-white text-black hover:bg-zinc-200">Apply Adjustment</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: View Product Details */}
      <Dialog open={showProductViewModal} onOpenChange={setShowProductViewModal}>
        <DialogContent className="sm:max-w-xl border-zinc-900 bg-zinc-950 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-bold">Product Details</DialogTitle>
            <DialogDescription className="text-zinc-500">Detailed catalog overview</DialogDescription>
          </DialogHeader>
          {selectedViewProduct && (
            <div className="space-y-6 mt-4">
              <div className="flex gap-6 items-start">
                {selectedViewProduct.image ? (
                  <img 
                    src={selectedViewProduct.image} 
                    alt={selectedViewProduct.name} 
                    className="h-24 w-24 object-cover rounded border border-zinc-800 bg-zinc-900 shrink-0" 
                  />
                ) : (
                  <div className="h-24 w-24 rounded border border-zinc-800 bg-zinc-900 flex items-center justify-center text-xs text-zinc-500 font-medium shrink-0">
                    No Image
                  </div>
                )}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white truncate">{selectedViewProduct.name}</h3>
                  <p className="text-xs text-zinc-400 font-mono">Base SKU: {selectedViewProduct.sku}</p>
                  <p className="text-xs text-zinc-450">Category: {selectedViewProduct.category}</p>
                  <div className="pt-1.5">
                    {selectedViewProduct.variants && selectedViewProduct.variants.length > 0 ? (
                      <Badge variant="secondary" className="bg-zinc-900 border-zinc-800 text-zinc-300 font-mono text-[10px]">
                        {selectedViewProduct.variants.length} Variations
                      </Badge>
                    ) : (
                      <Badge variant={selectedViewProduct.stock > 0 ? "success" : "destructive"}>
                        {selectedViewProduct.stock > 0 ? `${selectedViewProduct.stock} In Stock` : 'Out of Stock'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {selectedViewProduct.description && (
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-zinc-400 font-mono uppercase tracking-wider">Description</h4>
                  <p className="text-xs text-zinc-300 bg-zinc-900/40 p-3 rounded border border-zinc-900 leading-relaxed">
                    {selectedViewProduct.description}
                  </p>
                </div>
              )}

              {/* Pricing / Variations list */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-zinc-400 font-mono uppercase tracking-wider">
                  {selectedViewProduct.variants && selectedViewProduct.variants.length > 0 ? 'Variations & Pricing' : 'Pricing'}
                </h4>
                {selectedViewProduct.variants && selectedViewProduct.variants.length > 0 ? (
                  <div className="border border-zinc-900 rounded overflow-hidden">
                    <Table>
                      <TableHeader className="bg-zinc-900/30 border-zinc-900">
                        <TableRow className="hover:bg-transparent border-zinc-900">
                          <TableHead className="text-zinc-455 h-8 text-[10px] uppercase font-mono">SKU</TableHead>
                          <TableHead className="text-zinc-455 h-8 text-[10px] uppercase font-mono">Variant</TableHead>
                          <TableHead className="text-zinc-455 h-8 text-[10px] uppercase font-mono">Price</TableHead>
                          <TableHead className="text-zinc-455 h-8 text-[10px] uppercase font-mono">Stock</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedViewProduct.variants.map((v) => (
                          <TableRow key={v.sku} className="border-zinc-900 hover:bg-zinc-900/20">
                            <TableCell className="font-mono text-xs text-zinc-300 py-2">{v.sku}</TableCell>
                            <TableCell className="text-xs text-zinc-200 py-2">
                              {v.size || ''}{v.size && v.color ? ' / ' : ''}{v.color || 'N/A'}
                            </TableCell>
                            <TableCell className="text-xs text-white font-mono py-2">{storeSettings.currency}{v.price.toFixed(2)}</TableCell>
                            <TableCell className="text-xs py-2">
                              <span className={v.stock === 0 ? 'text-red-400 font-bold' : v.stock < 10 ? 'text-yellow-400' : 'text-zinc-300'}>
                                {v.stock}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="bg-zinc-900/20 p-3 rounded border border-zinc-900 flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Base Unit Price</span>
                    <strong className="text-white font-mono text-sm">{storeSettings.currency}{selectedViewProduct.price?.toFixed(2)}</strong>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-zinc-900">
                <Button onClick={() => setShowProductViewModal(false)} className="bg-white text-black hover:bg-zinc-250">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: View Order Details */}
      <Dialog open={showOrderViewModal} onOpenChange={setShowOrderViewModal}>
        <DialogContent className="sm:max-w-xl border-zinc-900 bg-zinc-950 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-bold">Order Details</DialogTitle>
            <DialogDescription className="text-zinc-500">Transaction invoice record</DialogDescription>
          </DialogHeader>
          {selectedViewOrder && (
            <div className="space-y-6 mt-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Order Reference</span>
                  <h3 className="text-lg font-bold text-white font-mono">{selectedViewOrder.orderNumber}</h3>
                  <p className="text-xs text-zinc-400">Date: {new Date(selectedViewOrder.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Status</span>
                  <Badge variant={
                    selectedViewOrder.status === 'Delivered' ? 'success' :
                    selectedViewOrder.status === 'Cancelled' ? 'destructive' :
                    selectedViewOrder.status === 'Shipped' ? 'info' :
                    'warning'
                  }>
                    {selectedViewOrder.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-zinc-900/30 p-4 rounded border border-zinc-900 text-xs">
                <div>
                  <h4 className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-1">Customer</h4>
                  <p className="font-semibold text-white">{selectedViewOrder.customerName}</p>
                </div>
                <div className="text-right">
                  <h4 className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-1">Payment Method</h4>
                  <p className="text-zinc-300">Credit / Debit Card</p>
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold text-zinc-400 font-mono uppercase tracking-wider">Items Summary</h4>
                <div className="border border-zinc-900 rounded overflow-hidden">
                  <Table>
                    <TableHeader className="bg-zinc-900/30 border-zinc-900">
                      <TableRow className="hover:bg-transparent border-zinc-900">
                        <TableHead className="text-zinc-455 h-8 text-[10px] uppercase font-mono">Product / Sku</TableHead>
                        <TableHead className="text-zinc-455 h-8 text-[10px] uppercase font-mono text-center">Qty</TableHead>
                        <TableHead className="text-zinc-455 h-8 text-[10px] uppercase font-mono text-right">Unit</TableHead>
                        <TableHead className="text-zinc-455 h-8 text-[10px] uppercase font-mono text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedViewOrder.items?.map((item, i) => (
                        <TableRow key={i} className="border-zinc-900 hover:bg-zinc-900/20">
                          <TableCell className="py-2">
                            <div className="font-medium text-zinc-200 text-xs">{item.product?.name || 'Deleted Product'}</div>
                            {item.variantSku && (
                              <code className="text-[9px] text-zinc-400 font-mono bg-zinc-900 px-1 py-0.2 rounded border border-zinc-800/80 mt-0.5 inline-block">
                                {item.variantSku}
                              </code>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs text-zinc-300 py-2">{item.quantity}x</TableCell>
                          <TableCell className="text-right font-mono text-xs text-zinc-300 py-2">{storeSettings.currency}{item.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono text-xs text-white py-2">{storeSettings.currency}{(item.price * item.quantity).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="border-t border-zinc-900 pt-4 flex justify-between items-center">
                <span className="text-sm text-zinc-400">Total Order Amount</span>
                <strong className="text-lg text-white font-mono">{storeSettings.currency}{selectedViewOrder.totalAmount.toFixed(2)}</strong>
              </div>

              <div className="flex justify-end pt-4 border-t border-zinc-900">
                <Button onClick={() => setShowOrderViewModal(false)} className="bg-white text-black hover:bg-zinc-250">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-md border shadow-lg transition-all duration-300 animate-in slide-in-from-bottom-5 ${
              toast.type === 'destructive'
                ? 'bg-zinc-950 border-red-900/50 text-red-200'
                : toast.type === 'warning'
                ? 'bg-zinc-950 border-yellow-900/50 text-yellow-200'
                : 'bg-zinc-950 border-zinc-800 text-zinc-150'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === 'destructive' ? (
                <AlertTriangle className="h-4.5 w-4.5 text-red-400 shrink-0" />
              ) : toast.type === 'warning' ? (
                <AlertTriangle className="h-4.5 w-4.5 text-yellow-400 shrink-0" />
              ) : (
                <CheckCircle className="h-4.5 w-4.5 text-white shrink-0" />
              )}
              <span className="text-xs font-medium">{toast.message}</span>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="ml-4 text-zinc-500 hover:text-zinc-300 text-xs font-bold font-mono"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
