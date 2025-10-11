// utils/buildPayload.js
export function buildPayloadObject(p) {
  // đảm bảo mảng số cho categoryIds
  const categoryIds = (p.categoryIds || [])
    .map(Number)
    .filter(n => !Number.isNaN(n))

  // chuẩn hóa variantGroups
  const variantGroups = (p.variantGroups || []).map((g, idx) => ({
    name: g.name,
    sortOrder: g.sortOrder ?? (idx + 1),
    options: (g.options || []).filter(Boolean)
  }))

  // chuẩn hóa variants
  const variants = (p.variants || []).map(v => ({
    optionValues: v.optionValues || {},
    price: Number.isFinite(v.price) ? v.price : 0,
    stock: Number.isFinite(v.stock) ? v.stock : 0,
    skuCode: v.skuCode || '',
    imageKey: v.imageKey // server sẽ dùng key này để đọc file kèm theo
  }))

  return {
    name: p.name ?? '',
    description: p.description ?? '',
    price: Number.isFinite(p.price) ? p.price : 0,
    quantity: Number.isFinite(p.quantity) ? p.quantity : 0,
    categoryIds,
    discountPrice: p.discountPrice ?? undefined,
    sku: p.sku || undefined,
    brand: p.brand || undefined,
    type: Array.isArray(p.type) ? p.type[0] : (p.type || 'PHYSICAL'),
    status: Array.isArray(p.status) ? p.status[0] : (p.status || 'ACTIVE'),
    weight: p.weight ?? undefined,
    dimensions: p.dimensions || undefined,
    isFeatured: !!p.isFeatured,
    variantGroups,
    variants
  }
}
