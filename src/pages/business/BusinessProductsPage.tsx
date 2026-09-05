import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { RequireGarageSetup } from '../../components/business/RequireGarageSetup'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { SearchableSelect } from '../../components/ui/SearchableSelect'
import { Spinner } from '../../components/ui/Spinner'
import { localizedCategoryName } from '../../i18n/localized'
import { useLocale } from '../../i18n/LocaleProvider'
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
  const { t, locale } = useLocale()
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

  const categoryOptions = useMemo(
    () => [
      { value: '', label: t('common.select') },
      ...(categoriesQuery.data ?? []).map((c) => ({
        value: c.id,
        label: localizedCategoryName(locale, c),
        searchText: `${c.name} ${c.nameAr ?? ''}`,
      })),
    ],
    [categoriesQuery.data, locale, t],
  )

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
          ← {t('common.garage')}
        </Link>
        <h2 className="text-xl font-semibold">{t('biz.products.title')}</h2>
        <p className="text-sm text-text-muted">{t('biz.products.hint')}</p>
        {error && <p className="text-sm text-error">{error}</p>}

        <ul className="space-y-2">
          {(productsQuery.data ?? []).filter((p) => p.isActive !== false).length === 0 && (
            <li className="text-sm text-text-muted">{t('biz.products.empty')}</li>
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
                  {t('common.remove')}
                </button>
              </li>
            ))}
        </ul>

        <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
          <Input
            label={t('biz.products.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label={t('biz.products.brandOptional')}
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
          <Input
            label={t('biz.products.price')}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <SearchableSelect
            label={t('biz.products.category')}
            value={categoryId}
            onChange={setCategoryId}
            options={categoryOptions}
          />
          <Button
            loading={createMutation.isPending}
            disabled={!name.trim() || !categoryId}
            onClick={() => createMutation.mutate()}
          >
            {t('biz.products.add')}
          </Button>
        </div>
      </section>
    </RequireGarageSetup>
  )
}
