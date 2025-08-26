import {
  Flex,
  SelectContent, SelectItem,
  SelectRoot, SelectTrigger,
  SelectValueText,
  SimpleGrid,
  Spinner
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
  const { addToCart} = useCart()

  const q = params.get('q') || ''

  const query = useMemo(()=>({
    name: q || undefined,
    categoryId: category?.id || undefined,
    sort: sort || undefined, // "priceAsc" | "priceDesc"
    page: 0, size: 20
  }), [q, category, sort])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetchProducts(query)
      setData(res || { content: [], totalElements: 0 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{ load() }, [JSON.stringify(query)])

  const handleAdd = async (pid) => {
    try {
      await addToCart(pid, 1)
      toaster.create({ title: 'Product Added to Cart', status: 'success' })
    } catch (e) {
      toaster.create({ title: 'Không thể thêm', status: 'error' })
    }
  }

  return (
    <>
      <Flex gap={6}>
        <CategorySidebar onChange={setCategory} />
        <Flex direction="column" flex={1} gap={3}>
          <Flex justify="flex-end" gap={3}>
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

          {loading ? <Spinner/> : (
            <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={4}>
              {data?.content?.map(p => <ProductCard key={p.id} p={p} onAdd={handleAdd} />)}
            </SimpleGrid>
          )}
        </Flex>
      </Flex>
    
    </>
  )
}
