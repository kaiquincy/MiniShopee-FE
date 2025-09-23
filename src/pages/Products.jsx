import {
  Flex,
  SelectContent, SelectItem,
  SelectRoot, SelectTrigger,
  SelectValueText,
  SimpleGrid,
  Spinner,
  Button,
  Text
} from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchProducts } from '../api/products'
import CategorySidebar from '../components/CategorySidebar'
import ProductCard from '../components/ProductCard'
import { toaster } from '../components/ui/toaster'
import { useCart } from '../context/CartContext'

export default function Products() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ content: [], totalElements: 0 })
  const [category, setCategory] = useState(null)
  const [sort, setSort] = useState('')

  const [params] = useSearchParams()
  const { addToCart } = useCart()

  const q = params.get('q') || ''

  // --- Pagination ---
  const [page, setPage] = useState(0)
  const size = 20

  const query = useMemo(() => ({
    name: q || undefined,
    categoryId: category?.id || undefined,
    sort: sort || undefined, // "priceAsc" | "priceDesc"
    page,
    size
  }), [q, category, sort, page])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.totalElements || 0) / size)),
    [data?.totalElements]
  )

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetchProducts(query)
      setData(res || { content: [], totalElements: 0 })
    } finally {
      setLoading(false)
    }
  }

  // Reset về trang 0 khi thay đổi filter/từ khóa/sort
  useEffect(() => { setPage(0) }, [q, category, sort])

  // Load dữ liệu khi query thay đổi
  useEffect(() => { load() }, [JSON.stringify(query)])

  const handleAdd = async (pid) => {
    try {
      await addToCart(pid, 1)
      toaster.create({ title: 'Đã thêm vào giỏ', status: 'success' })
    } catch (e) {
      toaster.create({ title: 'Không thể thêm', status: 'error' })
    }
  }

  return (
    <>
      <Flex gap={6}>
        <CategorySidebar onChange={setCategory} />
        <Flex direction="column" flex={1} gap={3}>
          <Flex justify="space-between" align="center">
            <Text fontWeight="medium">
              {loading
                ? 'Đang tải...'
                : data.totalElements
                  ? `${data.totalElements} sản phẩm`
                  : 'Không có sản phẩm phù hợp'}
            </Text>

            <SelectRoot
              value={sort ? [sort] : []}
              onValueChange={(e) => setSort(e.value?.[0] || '')}
            >
              <SelectTrigger w="220px" bg="white">
                <SelectValueText placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem item="priceAsc">Giá: thấp → cao</SelectItem>
                <SelectItem item="priceDesc">Giá: cao → thấp</SelectItem>
              </SelectContent>
            </SelectRoot>
          </Flex>

          {loading ? (
            <Flex py={10} justify="center"><Spinner /></Flex>
          ) : (
            <>
              <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={4}>
                {data?.content?.map((p) => (
                  <ProductCard key={p.id} p={p} onAdd={handleAdd} />
                ))}
              </SimpleGrid>

              {/* Pagination */}
              {data.totalElements > 0 && (
                <Flex mt={5} justify="center" align="center" gap={4}>
                  <Button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    isDisabled={page === 0}
                    variant="outline"
                  >
                    ← 
                  </Button>
                  <Text>Pages {page + 1} / {totalPages}</Text>
                  <Button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    isDisabled={page + 1 >= totalPages}
                    variant="outline"
                  >
                     →
                  </Button>
                </Flex>
              )}
            </>
          )}
        </Flex>
      </Flex>
    </>
  )
}
