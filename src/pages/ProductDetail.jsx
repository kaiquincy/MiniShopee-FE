import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchProductById } from '../api/products'
import { getRatings } from '../api/ratings'
import {
  Box, Image, Heading, Text, Button, VStack, HStack, Badge, Wrap, WrapItem,
  Separator, NumberInput, SimpleGrid, Skeleton, AspectRatio, Stack
} from '@chakra-ui/react'
import { toaster } from '../components/ui/toaster'
import { useCart } from '../context/CartContext'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [p, setP] = useState(null)
  const [ratings, setRatings] = useState([])
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()

  // selections: { [groupName]: optionValue }
  const [sel, setSel] = useState({})
  const [activeIdx, setActiveIdx] = useState(0) // ảnh đang xem

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const prod = await fetchProductById(id)
        if (!mounted) return
        setP(prod)
        setSel({})
        setActiveIdx(0)
      } catch (e) {
        toaster.create({ title: 'Không tải được sản phẩm', status: 'error' })
      } finally {
        setLoading(false)
      }
    })()
    getRatings(id).then(setRatings).catch(() => {})
    return () => { mounted = false }
  }, [id])

  const imgBase = import.meta.env.VITE_API_URL + '/uploads/'
  const mainImg = useMemo(() => {
    if (!p) return 'https://via.placeholder.com/800x600?text=Loading'
    // nếu biến thể có ảnh riêng => ưu tiên
    if (p.variants && Object.keys(sel).length) {
      const v = matchedVariant(p, sel)
      if (v?.imageUrl) return imgBase + v.imageUrl
    }
    return p.imageUrl ? (imgBase + p.imageUrl) : 'https://via.placeholder.com/800x600?text=No+Image'
  }, [p, sel])

  // danh sách thumbnail (ảnh chính + ảnh biến thể có ảnh)
  const thumbs = useMemo(() => {
    if (!p) return [mainImg]
    const set = new Set()
    const arr = []
    const pushImg = (url) => { if (url && !set.has(url)) { set.add(url); arr.push(url) } }
    pushImg(p.imageUrl ? imgBase + p.imageUrl : null)
    ;(p.variants || []).forEach(v => pushImg(v.imageUrl ? imgBase + v.imageUrl : null))
    return arr.length ? arr : [mainImg]
  }, [p, mainImg])

  if (!p && !loading) return null

  const avg = Number(p?.averageStars ?? p?.ratingAvg ?? 0).toFixed(1)
  const count = p?.totalRatings ?? p?.ratingCount ?? 0

  // ===== Variant helpers =====
  const groups = (p?.variantGroups || []).slice().sort((a,b) => (a.sortOrder||0)-(b.sortOrder||0))

  function matchedVariant(product, selection) {
    if (!product?.variants?.length) return null
    const gNames = (product.variantGroups||[]).map(g=>g.name)
    if (!gNames.every(n => selection[n])) return null
    return product.variants.find(v => gNames.every(n => v.optionValues?.[n] === selection[n])) || null
  }

  function isOptionAvailable(groupName, optionValue) {
    if (!p?.variants?.length) return true
    const tentative = { ...sel, [groupName]: optionValue }
    return p.variants.some(v => {
      for (const [gName, val] of Object.entries(tentative)) {
        if ((v.optionValues?.[gName] ?? null) !== val) return false
      }
      return (v.stock ?? 0) > 0
    })
  }

  const selectedVariant = matchedVariant(p, sel)
  const effectivePrice = selectedVariant?.price ?? (p?.discountPrice ?? p?.price)
  const basePrice = selectedVariant ? selectedVariant.price : p?.price
  const hasDiscount = !selectedVariant && p?.discountPrice && p?.discountPrice < p?.price
  const stockShown = selectedVariant ? (selectedVariant.stock ?? 0) : (p?.quantity ?? 0)

  const canAdd = (stockShown > 0) && (!groups.length || !!selectedVariant || groups.length === Object.keys(sel).length)

  async function handleAddToCart() {
    try {
      await addToCart(p.id, qty, selectedVariant?.id)
      toaster.create({ title: 'Đã thêm vào giỏ', status: 'success' })
    } catch {
      toaster.create({ title: 'Không thể thêm vào giỏ', status: 'error' })
    }
  }

  return (
    <Box w="full" px={{ base: 3, md: 6 }} py={{ base: 4, md: 8 }}>
      {/* Breadcrumb đơn giản */}
      <HStack spacing={2} color="gray.500" fontSize="sm" mb={3}>
        <Button variant="ghost" size="xs" onClick={() => navigate(-1)}>← Quay lại</Button>
        <Text>•</Text>
        <Text noOfLines={1}>{p?.name || '...'}</Text>
      </HStack>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 6, lg: 10 }}>
        {/* Cột trái: gallery */}
        <VStack align="stretch" spacing={4}>
          <Box
            bgGradient="to-br"
            gradientFrom="white"
            gradientTo="gray.50"
            borderRadius="xl"
            boxShadow="sm"
            p={{ base: 2, md: 3 }}
          >
            <Skeleton loading={loading}>
              <AspectRatio ratio={4/3}>
                <Image
                  src={thumbs[activeIdx] || mainImg}
                  alt={p?.name}
                  borderRadius="lg"
                  objectFit="cover"
                />
              </AspectRatio>
            </Skeleton>
          </Box>

          {/* Thumbnails */}
          <HStack overflowX="auto" spacing={3} py={1}>
            {thumbs.map((src, idx) => (
              <Box
                key={idx}
                onClick={() => setActiveIdx(idx)}
                borderRadius="md"
                overflow="hidden"
                cursor="pointer"
                outline={idx === activeIdx ? '2px solid var(--chakra-colors-brand-500, #3182CE)' : '1px solid var(--chakra-colors-gray-200)'}
                transition="all .2s ease"
                _hover={{ transform: 'translateY(-2px)' }}
                flex="0 0 88px"
              >
                <AspectRatio ratio={1}>
                  <Image src={src} alt={`thumb-${idx}`} objectFit="cover"/>
                </AspectRatio>
              </Box>
            ))}
          </HStack>
        </VStack>

        {/* Cột phải: panel mua hàng (sticky) */}
        <Box
          position={{ base: 'static', lg: 'sticky' }}
          top={{ lg: 24 }}
          alignSelf="start"
          bg="white"
          borderRadius="2xl"
          boxShadow="md"
          p={{ base: 4, md: 6 }}
        >
          <VStack align="stretch" spacing={5}>
            <Skeleton loading={loading}>
              <Heading size="lg" lineHeight="1.2">{p?.name}</Heading>
            </Skeleton>

            {/* Rating + số đánh giá */}
            <HStack color="gray.600" spacing={3}>
              <Badge borderRadius="full" px="2.5" py="0.5" fontWeight="semibold">{avg}★</Badge>
              <Text>({count} đánh giá)</Text>
              {stockShown <= 5 && (
                <Badge colorScheme="orange" borderRadius="full">Sắp hết</Badge>
              )}
            </HStack>

            {/* Giá */}
            <Box>
              <HStack spacing={3} align="baseline" wrap="wrap">
                <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="extrabold" color="brand.700">
                  {Number(effectivePrice || 0).toLocaleString()} USD
                </Text>
                {(hasDiscount || (basePrice && basePrice > effectivePrice)) && (
                  <HStack spacing={2}>
                    <Text as="s" color="gray.500">{Number(basePrice || 0).toLocaleString()} USD</Text>
                    <Badge colorScheme="red">
                      -{Math.round(100 - (effectivePrice / (basePrice || 1)) * 100)}%
                    </Badge>
                  </HStack>
                )}
              </HStack>
              {p?.shortDescription && (
                <Text mt={2} color="gray.700">{p.shortDescription}</Text>
              )}
            </Box>

            {/* Mô tả ngắn / dài */}
            {!!p?.description && (
              <Text color="gray.700" noOfLines={{ base: 5, md: 6 }}>
                {p.description}
              </Text>
            )}

            {/* Select biến thể */}
            {!!groups.length && (
              <VStack align="stretch" spacing={4}>
                {groups.map((g) => (
                  <Box key={g.id}>
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="medium">{g.name}</Text>
                      {sel[g.name] && <Text color="gray.600">Đã chọn: <b>{sel[g.name]}</b></Text>}
                    </HStack>
                    <Wrap>
                      {(g.options||[]).map(op => {
                        const active = sel[g.name] === op.value
                        const available = isOptionAvailable(g.name, op.value)
                        return (
                          <WrapItem key={op.id}>
                            <Button
                              size="sm"
                              variant={active ? 'solid' : 'outline'}
                              onClick={() => setSel(prev => (prev[g.name] === op.value
                                ? (()=>{ const { [g.name]:_, ...rest } = prev; return rest })()
                                : { ...prev, [g.name]: op.value }))}
                              isDisabled={!available}
                              borderRadius="full"
                              _disabled={{ opacity: 0.4, cursor: 'not-allowed' }}
                            >
                              {op.value}
                            </Button>
                          </WrapItem>
                        )
                      })}
                    </Wrap>
                  </Box>
                ))}
              </VStack>
            )}

            {/* SKU & tồn */}
            <HStack color="gray.600" fontSize="sm">
              <Text>Mã SKU: <b>{selectedVariant?.skuCode || p?.sku || '—'}</b></Text>
              <Text>•</Text>
              <Text>Tồn: <b>{stockShown}</b></Text>
            </HStack>

            <Separator />

            {/* Số lượng + hành động */}
            <Stack direction={{ base: 'column', sm: 'row' }} spacing={4} align="center">
              <NumberInput.Root
                size="sm"
                min={1}
                max={Math.max(stockShown, 1)}
                value={qty}
                onChange={(v)=>setQty(Number(v)||1)}
                w={{ base: 'full', sm: '120px' }}
              >
                <NumberInput.Control>
                  <NumberInput.IncrementTrigger />
                  <NumberInput.DecrementTrigger />
                </NumberInput.Control>
                <NumberInput.Input />
              </NumberInput.Root>

              <Button
                onClick={handleAddToCart}
                isDisabled={!canAdd}
                w={{ base: 'full', sm: 'auto' }}
                size="md"
              >
                {stockShown > 0 ? 'Thêm vào giỏ' : 'Hết hàng'}
              </Button>
              <Button variant="outline" onClick={() => navigate(-1)} w={{ base: 'full', sm: 'auto' }}>
                Quay lại
              </Button>
            </Stack>
          </VStack>
        </Box>
      </SimpleGrid>

      {/* Đánh giá */}
      <Box mt={{ base: 8, md: 12 }}>
        <Heading size="md" mb={3}>Đánh giá</Heading>
        <Separator mb={4} />
        <VStack align="stretch" spacing={3}>
          {ratings.map(r => (
            <Box
              key={r.id}
              bg="white"
              p={4}
              borderRadius="lg"
              boxShadow="sm"
              _hover={{ boxShadow: 'md' }}
            >
              <HStack justify="space-between">
                <HStack>
                  <Badge>{r.stars}★</Badge>
                  <Text color="gray.700">{r.username}</Text>
                </HStack>
                <Text color="gray.500" fontSize="sm">{new Date(r.createdAt).toLocaleString()}</Text>
              </HStack>
              <Text mt={2} color="gray.800">{r.comment || '—'}</Text>
            </Box>
          ))}
          {ratings.length === 0 && <Text color="gray.500">Chưa có đánh giá</Text>}
        </VStack>
      </Box>
    </Box>
  )
}