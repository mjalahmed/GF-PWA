import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { RequireGarageSetup } from '../../components/business/RequireGarageSetup'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import {
  createBusinessProduct,
  deactivateBusinessProduct,
  listBusinessProducts,
  updateBusinessSettings,
} from '../../services/api/business'
import { listProductCategories } from '../../services/api/catalog'

export function BusinessProductsPage() {
  const { businessId = '' } = useParams()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [price, setPrice] = useState('10')
  const [brand, setBrand] = useState('')

  const productsQuery = useQuery({
    queryKey: ['business-products', businessId],
    queryFn: () => listBusinessProducts(businessId),
    enabled: Boolean(businessId),
  })
  const categoriesQuery = useQuery({
    queryKey: ['product-categories'],
    queryFn: listProductCategories,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      await updateBusinessSettings(businessId, { productsEnabled: true })
      return createBusinessProduct(businessId, {
        categoryId,
        name: name.trim(),
        brand: brand.trim() || null,
        price: Number(price),
        stockStatus: 'in_stock',
      })
    },
    onSuccess: () => {
      setName('')
      setBrand('')
      setError('')
      void queryClient.invalidateQueries({ queryKey: ['business-products', businessId] })
    },
    onError: (err: Error) => setError(err.message),
  })

  const removeMutation = useMutation({
    mutationFn: (productId: string) => deactivateBusinessProduct(businessId, productId),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ['business-products', businessId] }),
    onError: (err: Error) => setError(err.message),
  })

  if (productsQuery.isLoading) return <Spinner />

  return (
    <RequireGarageSetup businessId={businessId}>
      <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <Link to={`/business/garages/${businessId}`} className="text-sm text-primary">
          ← Garage
        </Link>
        <h2 className="text-xl font-semibold">Products</h2>
        <p className="text-sm text-text-muted">Parts and products listed on your public page.</p>
        {error && <p className="text-sm text-error">{error}</p>}

        <ul className="space-y-2">
          {(productsQuery.data ?? []).filter((p) => p.isActive !== false).length === 0 && (
            <li className="text-sm text-text-muted">No products yet.</li>
          )}
          {(productsQuery.data ?? [])
            .filter((p) => p.isActive !== false)
            .map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm"
              >
                <span>
                  {p.name} · {p.price} BHD
                  {p.brand ? ` · ${p.brand}` : ''}
                </span>
                <button
                  type="button"
                  className="text-xs text-error"
                  onClick={() => removeMutation.mutate(p.id)}
                >
                  Remove
                </button>
              </li>
            ))}
        </ul>

        <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Brand (optional)" value={brand} onChange={(e) => setBrand(e.target.value)} />
          <Input label="Price (BHD)" value={price} onChange={(e) => setPrice(e.target.value)} />
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Category</span>
            <select
              className="w-full rounded-xl border border-border bg-background px-3 py-2"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Select…</option>
              {(categoriesQuery.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <Button
            loading={createMutation.isPending}
            disabled={!name.trim() || !categoryId}
            onClick={() => createMutation.mutate()}
          >
            Add product
          </Button>
        </div>
      </section>
    </RequireGarageSetup>
  )
}
