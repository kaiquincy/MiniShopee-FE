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
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchProducts } from '../api/products'
import CategorySidebar from '../components/CategorySidebar'
import ProductCard from '../components/ProductCard'
import { toaster } from '../components/ui/toaster'
import { useCart } from '../context/CartContext'

export default function Products() {
  const [loading, setLoading] = useState(true)       // lần tải đầu
  const [loadingPage, setLoadingPage] = useState(false) // tải khi đổi trang
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
    [data?.totalElements, size]
  )

  // Đảm bảo hủy request cũ khi query đổi
  const abortRef = useRef(null)
  useEffect(() => {
    const controller = new AbortController()
    abortRef.current?.abort()
    abortRef.current = controller

    // phân biệt lần đầu vs đổi trang
    const isFirstLoad = page === 0 && data.totalElements === 0 && !loadingPage
    isFirstLoad ? setLoading(true) : setLoadingPage(true)

    ;(async () => {
      try {
        const res = await fetchProducts(query, { signal: controller.signal }) // nhớ pass signal trong api
        setData(res || { content: [], totalElements: 0 })
      } catch (err) {
        if (err?.name !== 'AbortError') {
          setData({ content: [], totalElements: 0 })
          toaster.create({ title: 'Không thể tải sản phẩm', status: 'error' })
        }
      } finally {
        setLoading(false)
        setLoadingPage(false)
      }
    })()

    return () => controller.abort()
  }, [query])

  // Reset về trang 0 khi thay đổi filter/từ khóa/sort
  useEffect(() => { setPage(0) }, [q, category, sort])

  const handleAdd = async (pid) => {
    try {
      await addToCart(pid, 1)
      toaster.create({ title: 'Đã thêm vào giỏ', status: 'success' })
    } catch {
      toaster.create({ title: 'Không thể thêm', status: 'error' })
    }
  }

  const goPrev = () => {
    setPage(p => {
      const next = Math.max(0, p - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return next
    })
  }
  const goNext = () => {
    setPage(p => {
      const next = Math.min(totalPages - 1, p + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return next
    })
  }

  const isFetching = loading || loadingPage

  return (
    <>
      <Flex gap={6} align="start">
        <CategorySidebar onChange={setCategory} activeId={category?.id} />
        <Flex direction="column" flex={1} gap={3}>
          <Flex justify="space-between" align="center">
            <Text fontWeight="medium">
              {isFetching
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

          {isFetching && (
            <Flex py={10} justify="center"><Spinner /></Flex>
          )}

          {!isFetching && (
            <>
              {data.totalElements === 0 ? (
                <Flex direction="column" align="center" py={10} gap={3}>
                  <Text>Không tìm thấy sản phẩm phù hợp.</Text>
                  <Button onClick={() => { setCategory(null); setSort('') }}>
                    Xoá bộ lọc
                  </Button>
                </Flex>
              ) : (
                <>
                  <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={4}>
                    {data?.content?.map((p) => (
                      <ProductCard key={p.id} p={p} onAdd={handleAdd} />
                    ))}
                  </SimpleGrid>

                  {/* Pagination */}
                  <Flex mt={5} justify="center" align="center" gap={4}>
                    <Button
                      onClick={goPrev}
                      isDisabled={page === 0}
                      variant="outline"
                      aria-label="Trang trước"
                    >
                      ←
                    </Button>
                    <Text>Trang {page + 1} / {totalPages}</Text>
                    <Button
                      onClick={goNext}
                      isDisabled={page + 1 >= totalPages}
                      variant="outline"
                      aria-label="Trang sau"
                    >
                      →
                    </Button>
                  </Flex>
                </>
              )}
            </>
          )}
        </Flex>
      </Flex>
    </>
  )
}
