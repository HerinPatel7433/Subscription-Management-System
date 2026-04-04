import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Package } from 'lucide-react'
import { useForm } from 'react-hook-form'
import Modal from '@/components/Modal'
import { Toast, useToast } from '@/components/Toast'
import { useAuth } from '@/hooks/useAuth'
import {
  getProducts, createProduct, updateProduct, deleteProduct,
  getProductVariants, createVariant, deleteVariant,
  type Product, type ProductVariant,
} from '@/services/subscriptionService'

type ProductForm = {
  name: string; type: string; sales_price: number; cost_price: number
}
type VariantForm = { attribute: string; value: string; extra_price: number }

export default function ProductsPage() {
  const { isAdmin } = useAuth()
  const { toasts, toast, dismiss } = useToast()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [variants, setVariants] = useState<Record<string, ProductVariant[]>>({})

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [variantModalOpen, setVariantModalOpen] = useState(false)
  const [variantProductId, setVariantProductId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProductForm>()
  const { register: rV, handleSubmit: hsV, reset: resetV, formState: { isSubmitting: isSubmittingV } } = useForm<VariantForm>()

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getProducts()
      setProducts(res.data)
    } catch {
      toast('error', 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const toggleExpand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    if (!variants[id]) {
      try {
        const res = await getProductVariants(id)
        setVariants((prev) => ({ ...prev, [id]: res.data }))
      } catch {
        toast('error', 'Could not load variants')
      }
    }
  }

  const openAdd = () => { setEditProduct(null); reset({}); setModalOpen(true) }
  const openEdit = (p: Product) => {
    setEditProduct(p)
    reset({ name: p.name, type: p.type, sales_price: p.sales_price, cost_price: p.cost_price })
    setModalOpen(true)
  }

  const onSaveProduct = async (data: ProductForm) => {
    try {
      if (editProduct) {
        await updateProduct(editProduct.id, data)
        toast('success', 'Product updated')
      } else {
        await createProduct(data)
        toast('success', 'Product created')
      }
      setModalOpen(false)
      fetchProducts()
    } catch {
      toast('error', 'Failed to save product')
    }
  }

  const onDelete = async (id: string) => {
    try {
      await deleteProduct(id)
      toast('success', 'Product deleted')
      setDeleteConfirm(null)
      fetchProducts()
    } catch {
      toast('error', 'Failed to delete product')
    }
  }

  const openAddVariant = (productId: string) => {
    setVariantProductId(productId); resetV({}); setVariantModalOpen(true)
  }

  const onSaveVariant = async (data: VariantForm) => {
    if (!variantProductId) return
    try {
      await createVariant(variantProductId, data)
      const res = await getProductVariants(variantProductId)
      setVariants((prev) => ({ ...prev, [variantProductId]: res.data }))
      toast('success', 'Variant added')
      setVariantModalOpen(false)
    } catch {
      toast('error', 'Failed to add variant')
    }
  }

  const onDeleteVariant = async (productId: string, variantId: string) => {
    try {
      await deleteVariant(productId, variantId)
      setVariants((prev) => ({
        ...prev,
        [productId]: prev[productId].filter((v) => v.id !== variantId),
      }))
      toast('success', 'Variant removed')
    } catch {
      toast('error', 'Failed to remove variant')
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Package size={18} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Products</h1>
            <p className="text-xs text-slate-500">{products.length} total</p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-xl transition-colors shadow-glow"
          >
            <Plus size={15} /> Add Product
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-[#131929] border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="w-8 px-4 py-3" />
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Sales Price</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Cost Price</th>
                {isAdmin && <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No products found</td></tr>
              ) : products.map((p) => (
                <>
                  <tr
                    key={p.id}
                    className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleExpand(p.id)}
                        className="text-slate-500 hover:text-primary-400 transition-colors"
                      >
                        {expandedId === p.id ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{p.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs rounded-md bg-slate-700/60 text-slate-300 capitalize">{p.type}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-medium">₹{Number(p.sales_price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-slate-400">₹{Number(p.cost_price).toFixed(2)}</td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(p.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>

                  {/* Expandable variants row */}
                  {expandedId === p.id && (
                    <tr key={`${p.id}-variants`} className="bg-slate-800/30">
                      <td colSpan={isAdmin ? 6 : 5} className="px-8 py-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Variants ({(variants[p.id] ?? []).length})
                          </p>
                          {isAdmin && (
                            <button
                              onClick={() => openAddVariant(p.id)}
                              className="flex items-center gap-1 text-xs px-3 py-1.5 bg-primary-600/20 hover:bg-primary-600/30 text-primary-400 rounded-lg border border-primary-500/30 transition-colors"
                            >
                              <Plus size={12} /> Add Variant
                            </button>
                          )}
                        </div>
                        {(variants[p.id] ?? []).length === 0 ? (
                          <p className="text-xs text-slate-500 italic">No variants yet</p>
                        ) : (
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-slate-500">
                                <th className="text-left py-1.5 font-medium">Attribute</th>
                                <th className="text-left py-1.5 font-medium">Value</th>
                                <th className="text-right py-1.5 font-medium">Extra Price</th>
                                {isAdmin && <th className="text-right py-1.5 font-medium">Remove</th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/20">
                              {(variants[p.id] ?? []).map((v) => (
                                <tr key={v.id} className="text-slate-300">
                                  <td className="py-1.5">{v.attribute}</td>
                                  <td className="py-1.5">{v.value}</td>
                                  <td className="py-1.5 text-right text-emerald-400">+₹{Number(v.extra_price).toFixed(2)}</td>
                                  {isAdmin && (
                                    <td className="py-1.5 text-right">
                                      <button
                                        onClick={() => onDeleteVariant(p.id, v.id)}
                                        className="text-slate-500 hover:text-red-400 transition-colors"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editProduct ? 'Edit Product' : 'Add Product'}>
        <form onSubmit={handleSubmit(onSaveProduct)} className="space-y-4">
          <div>
            <label className="form-label">Name</label>
            <input className={`form-input ${errors.name ? 'error' : ''}`} {...register('name', { required: 'Required' })} placeholder="Cloud Storage" />
            {errors.name && <p className="field-error">{errors.name.message}</p>}
          </div>
          <div>
            <label className="form-label">Type</label>
            <select className="form-input" {...register('type', { required: 'Required' })}>
              <option value="">Select type</option>
              <option value="digital">Digital</option>
              <option value="service">Service</option>
              <option value="physical">Physical</option>
            </select>
            {errors.type && <p className="field-error">{errors.type.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Sales Price (₹)</label>
              <input type="number" step="0.01" className={`form-input ${errors.sales_price ? 'error' : ''}`}
                {...register('sales_price', { required: 'Required', valueAsNumber: true, min: { value: 0, message: 'Must be ≥ 0' } })} placeholder="999.00" />
              {errors.sales_price && <p className="field-error">{errors.sales_price.message}</p>}
            </div>
            <div>
              <label className="form-label">Cost Price (₹)</label>
              <input type="number" step="0.01" className={`form-input ${errors.cost_price ? 'error' : ''}`}
                {...register('cost_price', { required: 'Required', valueAsNumber: true, min: { value: 0, message: 'Must be ≥ 0' } })} placeholder="400.00" />
              {errors.cost_price && <p className="field-error">{errors.cost_price.message}</p>}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-white/5 transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 btn-primary py-2.5">
              {isSubmitting ? 'Saving…' : (editProduct ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Variant Modal */}
      <Modal open={variantModalOpen} onClose={() => setVariantModalOpen(false)} title="Add Variant">
        <form onSubmit={hsV(onSaveVariant)} className="space-y-4">
          <div>
            <label className="form-label">Attribute</label>
            <input className="form-input" {...rV('attribute', { required: 'Required' })} placeholder="e.g. storage_tier" />
          </div>
          <div>
            <label className="form-label">Value</label>
            <input className="form-input" {...rV('value', { required: 'Required' })} placeholder="e.g. 100 GB" />
          </div>
          <div>
            <label className="form-label">Extra Price (₹)</label>
            <input type="number" step="0.01" className="form-input" {...rV('extra_price', { valueAsNumber: true })} defaultValue={0} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setVariantModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-white/5 transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmittingV} className="flex-1 btn-primary py-2.5">
              {isSubmittingV ? 'Adding…' : 'Add Variant'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Delete">
        <p className="text-slate-300 text-sm mb-6">Are you sure you want to delete this product? This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={() => deleteConfirm && onDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors">Delete</button>
        </div>
      </Modal>

      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
