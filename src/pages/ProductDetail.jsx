import {
  AspectRatio,
  Avatar,
  Badge,
  Box,
  Button,
  CloseButton,
  Dialog,
  Heading,
  HStack,
  Icon,
  IconButton,
  Image,
  Kbd,
  NumberInput,
  Portal,
  SelectContent, SelectItem,
  SelectRoot, SelectTrigger, SelectValueText,
  Separator,
  SimpleGrid, Skeleton,
  Stack,
  Text,
  useClipboard,
  useDisclosure,
  VStack,
  Wrap, WrapItem,Accordion
  ,Flex
} from '@chakra-ui/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchProductById, getSimilarProducts } from '../api/products'
import { getRatings, getRatingSummary as getsum, toggleRatingLike } from '../api/ratings'

import { LuChevronLeft, LuChevronRight, LuCircleCheck, LuCopy, LuPackage, LuShoppingCart, LuStar, LuThumbsUp, LuTruck } from 'react-icons/lu'
import ProductCard from '../components/ProductCard'
import { toaster } from '../components/ui/toaster'
import { Tooltip } from '../components/ui/Tooltip'
import { useCart } from '../context/CartContext'
import { useTheme } from '../context/ThemeContext'

export default function ProductDetail() {
  const { theme } = useTheme()
  const { id } = useParams()
  const navigate = useNavigate()
  const [p, setP] = useState(null)
  const [ratingSummary, setRatingSummary] = useState(null)

  // Ratings + pageable
  const [ratings, setRatings] = useState([])
  const [ratingPage, setRatingPage] = useState(0)
  const [ratingSize, setRatingSize] = useState(5)
  const [ratingSortKey, setRatingSortKey] = useState('createdAtDesc');

  const [ratingSort, setRatingSort] = useState('createdAt,DESC')
  const [similar, setSimilar] = useState([])
  const [loadingSimilar, setLoadingSimilar] = useState(false)
  const railRef = useRef(null)
  const [ratingTotal, setRatingTotal] = useState(0)
  const [ratingHasMore, setRatingHasMore] = useState(false)
  const [loadingRatings, setLoadingRatings] = useState(false)

  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()

  // like optimistic
  const [likedIds, setLikedIds] = useState(new Set())
  const [likeCounts, setLikeCounts] = useState({})

  // selections: { [groupName]: optionValue }
  const [sel, setSel] = useState({})
  const [activeIdx, setActiveIdx] = useState(0)

  const { isOpen, onOpen, onClose } = useDisclosure()

  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''
  const { onCopy, hasCopied } = useClipboard(pageUrl)

  const imgBase = import.meta.env.VITE_API_URL + '/uploads/'
  const urlOrNull = (path) => path ? (path.startsWith('http') ? path : imgBase + path) : null

  const moreRef = useRef(null)
  const abortRatingsRef = useRef(null)

  const SORT_MAP = {
    createdAtDesc: 'createdAt,DESC',
    createdAtAsc:  'createdAt,ASC',
    likeCountDesc: 'likeCount,DESC',
    starsDesc:     'stars,DESC',
    starsAsc:      'stars,ASC',
  };
  const backendSort = SORT_MAP[ratingSortKey] ?? 'createdAt,DESC';

  // ===== fetch product =====
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

    getsum(id).then(setRatingSummary).catch(() => {})
    return () => { mounted = false }
  }, [id])

  // ===== similar products by category =====
  useEffect(() => {
    let alive = true
    setLoadingSimilar(true)
    getSimilarProducts(id, { limit: 12 })
      .then(list => { if (alive) setSimilar(list || []) })
      .catch(() => { if (alive) setSimilar([]) })
      .finally(() => { if (alive) setLoadingSimilar(false) })
    return () => { alive = false }
  }, [id])

  // ===== ratings like counts from payload =====
  useEffect(() => {
    const nextCounts = {}
    const nextLiked = new Set()
    ratings.forEach(r => {
      nextCounts[r.id] = typeof r.likeCount === 'number' ? r.likeCount : 0
      if (r.likedByMe) nextLiked.add(r.id)
    })
    setLikeCounts(nextCounts)
    setLikedIds(nextLiked)
  }, [ratings])

  // ===== pageable loader =====
  const loadRatings = useCallback(async (page = 0, append = false) => {
    if (abortRatingsRef.current) abortRatingsRef.current.abort()
    abortRatingsRef.current = new AbortController()

    setLoadingRatings(true)
    try {
      const res = await getRatings(id, { page, size: ratingSize, sort: backendSort });
      setRatingTotal(res.totalElements ?? 0)
      setRatingPage(res.number ?? page)
      setRatingHasMore(!res.last)

      setRatings(prev => append ? [...prev, ...(res.content || [])] : (res.content || []))
    } catch (e) {
      toaster.create({ title: 'Không tải được đánh giá', status: 'error' })
      if (!append) setRatings([])
      setRatingHasMore(false)
    } finally {
      setLoadingRatings(false)
    }
  }, [id, ratingSize, backendSort])

  // Reset khi đổi id/sort/size
  useEffect(() => {
    setRatings([])
    setRatingPage(0)
    setRatingHasMore(false)
    setRatingTotal(0)
    loadRatings(0, false)
  }, [id, ratingSort, ratingSize, loadRatings])

  // Infinite scroll
  useEffect(() => {
    const el = moreRef.current
    if (!el) return
    const io = new IntersectionObserver(entries => {
      const [e] = entries
      if (e.isIntersecting && ratingHasMore && !loadingRatings) {
        loadRatings(ratingPage + 1, true)
      }
    }, { rootMargin: '120px' })
    io.observe(el)
    return () => io.disconnect()
  }, [moreRef, ratingHasMore, loadingRatings, ratingPage, loadRatings])

  const handleToggleLike = async (ratingId) => {
    const isLiked = likedIds.has(ratingId)

    // optimistic
    setLikedIds(prev => {
      const s = new Set(prev)
      isLiked ? s.delete(ratingId) : s.add(ratingId)
      return s
    })
    setLikeCounts(prev => ({
      ...prev,
      [ratingId]: Math.max(0, (prev[ratingId] ?? 0) + (isLiked ? -1 : 1))
    }))

    try {
      await toggleRatingLike(ratingId, !isLiked)
    } catch (e) {
      // revert
      setLikedIds(prev => {
        const s = new Set(prev)
        isLiked ? s.add(ratingId) : s.delete(ratingId)
        return s
      })
      setLikeCounts(prev => ({
        ...prev,
        [ratingId]: Math.max(0, (prev[ratingId] ?? 0) + (isLiked ? 1 : -1))
      }))
      toaster.create({ title: 'Không thể cập nhật lượt thích', status: 'error' })
    }
  }

  const avatarSrcOf = (r) => {
    const raw = r.avatarUrl || r.userAvatar || r.photoUrl
    if (raw) return raw.startsWith('http') ? raw : `${import.meta.env.VITE_API_URL}/uploads/${raw}`
    const seed = encodeURIComponent(r.username || 'User')
    return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`
  }

  if (!p && !loading) return null

  const mainImg = useMemo(() => {
    if (!p) return 'https://dummyimage.com/800x600/228be6/ffffff.jpg&text=Loading'
    if (p.variants && Object.keys(sel).length) {
      const v = matchedVariant(p, sel)
      if (v?.imageUrl) return imgBase + v.imageUrl
    }
    return p.imageUrl ? (imgBase + p.imageUrl) : 'https://dummyimage.com/800x600/228be6/ffffff.jpg&text=No+Image'
  }, [p, sel])

  const thumbs = useMemo(() => {
    if (!p) return [mainImg]
    const set = new Set()
    const arr = []
    const pushImg = (url) => { if (url && !set.has(url)) { set.add(url); arr.push(url) } }
    pushImg(p.imageUrl ? imgBase + p.imageUrl : null)
    ;(p.variants || []).forEach(v => pushImg(v.imageUrl ? imgBase + v.imageUrl : null))
    return arr.length ? arr : [mainImg]
  }, [p, mainImg])

  const avg = Number((ratingSummary?.averageStars) || 0)
  const avgLabel = avg.toFixed(1)
  const count = ratingSummary?.totalRatings || 0

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
    if (!canAdd) {
      toaster.create({ title: 'Vui lòng chọn đầy đủ biến thể', status: 'warning' })
      return
    }
    try {
      await addToCart(p.id, qty, selectedVariant?.id)
      toaster.create({ title: 'Đã Add to cart', status: 'success' })
    } catch {
      toaster.create({ title: 'Không thể Add to cart', status: 'error' })
    }
  }

  const nextImg = () => setActiveIdx(i => (i + 1) % thumbs.length)
  const prevImg = () => setActiveIdx(i => (i - 1 + thumbs.length) % thumbs.length)

  const priceFmt = (n) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n)

  const renderStars = (value) => {
    const full = Math.round(value)
    return (
      <HStack gap={0.5}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Icon key={i} boxSize="14px" color={i < full ? 'yellow.400' : theme.isLight ? 'gray.300' : 'gray.600'}>
            <LuStar />
          </Icon>
        ))}
      </HStack>
    )
  }

  return (
    <Box w="full" px={{ base: 4, sm: 6, md: 10, lg: 24 }} py={{ base: 6, md: 8 }} bg={theme.pageBg} minH="100vh">
      {/* Breadcrumb */}
      <HStack gap={2} color={theme.textMuted} fontSize="sm" mb={4}>
        <Button variant="ghost" size="xs" onClick={() => navigate(-1)} color={theme.textSecondary} _hover={{ bg: theme.hoverBg }}>← Back</Button>
        <Text>•</Text>
        <Text noOfLines={1}>{p?.categoryName || '...'}</Text>
        <Text>›</Text>
        <Text noOfLines={1}>{p?.name || '...'}</Text>
      </HStack>

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={{ base: 8, lg: 12 }} mb={16}>

        {/* LEFT: Editorial Gallery */}
        <Box
          bg={theme.cardBg}
          border="1px solid"
          borderColor={theme.border}
          borderRadius="2xl"
          p={{ base: 3, md: 4 }}
        >
          <SimpleGrid columns={{ base: 1, md: 6 }} gap={4}>

            {/* Thumbs (vertical) */}
            <Box
              display={{ base: "none", md: "block" }}
              gridColumn="span 1"
              maxH="560px"
              overflowY="auto"
              pr={1}
              sx={{ scrollbarWidth: "thin" }}
            >
              <VStack align="stretch" gap={3}>
                {thumbs.map((src, idx) => {
                  const active = idx === activeIdx
                  return (
                    <Box
                      key={idx}
                      onClick={() => setActiveIdx(idx)}
                      cursor="pointer"
                      borderRadius="lg"
                      overflow="hidden"
                      border="1px solid"
                      borderColor={active ? theme.text : theme.border}
                      opacity={active ? 1 : 0.7}
                      transition="all .15s ease"
                      _hover={{ opacity: 1, transform: "translateY(-1px)" }}
                    >
                      <AspectRatio ratio={1}>
                        <Image src={src} alt={`thumb-${idx}`} objectFit="cover" />
                      </AspectRatio>
                    </Box>
                  )
                })}
              </VStack>
            </Box>

            {/* Main Image */}
            <Box
              gridColumn={{ base: "span 1", md: "span 5" }}
              position="relative"
              borderRadius="2xl"
              overflow="hidden"
              border="1px solid"
              borderColor={theme.border}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") nextImg()
                if (e.key === "ArrowLeft") prevImg()
              }}
              tabIndex={0}
              role="group"
            >
              <Skeleton loading={loading}>
                <AspectRatio ratio={1}>
                  <Image
                    src={thumbs[activeIdx] || mainImg}
                    alt={p?.name}
                    objectFit="cover"
                    cursor="zoom-in"
                    onClick={onOpen}
                    transition="transform .2s ease"
                    _groupHover={{ transform: "scale(1.01)" }}
                  />
                </AspectRatio>
              </Skeleton>

              {/* Minimal nav (bottom overlay, not floating circles) */}
              <HStack
                position="absolute"
                left={0}
                right={0}
                bottom={0}
                p={3}
                justify="space-between"
                bg="rgba(0,0,0,0.35)"
                backdropFilter="blur(6px)"
              >
                <Button
                  onClick={prevImg}
                  size="sm"
                  variant="ghost"
                  color="white"
                  _hover={{ bg: "rgba(255,255,255,0.12)" }}
                  leftIcon={<LuChevronLeft />}
                >
                  Prev
                </Button>

                <Text color="whiteAlpha.800" fontSize="sm">
                  {activeIdx + 1} / {thumbs.length}
                </Text>

                <Button
                  onClick={nextImg}
                  size="sm"
                  variant="ghost"
                  color="white"
                  _hover={{ bg: "rgba(255,255,255,0.12)" }}
                  rightIcon={<LuChevronRight />}
                >
                  Next
                </Button>
              </HStack>
            </Box>
          </SimpleGrid>

          {/* Mobile thumbs (horizontal, clean) */}
          <HStack
            display={{ base: "flex", md: "none" }}
            mt={4}
            overflowX="auto"
            gap={3}
            py={1}
            sx={{ scrollbarWidth: "thin" }}
          >
            {thumbs.map((src, idx) => {
              const active = idx === activeIdx
              return (
                <Box
                  key={idx}
                  onClick={() => setActiveIdx(idx)}
                  flex="0 0 72px"
                  borderRadius="lg"
                  overflow="hidden"
                  border="1px solid"
                  borderColor={active ? theme.text : theme.border}
                  opacity={active ? 1 : 0.75}
                >
                  <AspectRatio ratio={1}>
                    <Image src={src} alt={`m-thumb-${idx}`} objectFit="cover" />
                  </AspectRatio>
                </Box>
              )
            })}
          </HStack>
        </Box>

        {/* RIGHT: Purchase Panel (quiet, structured) */}
        <Box
          position={{ base: "static", lg: "sticky" }}
          top={{ lg: 24 }}
          alignSelf="start"
          bg={theme.cardBg}
          border="1px solid"
          borderColor={theme.border}
          borderRadius="2xl"
          p={{ base: 4, md: 6 }}
        >
          <VStack align="stretch" gap={5}>

            {/* Title + meta */}
            <Skeleton loading={loading}>
              <VStack align="stretch" gap={2}>
                <Heading size="lg" letterSpacing="-0.02em" color={theme.text}>
                  {p?.name}
                </Heading>

                <HStack gap={3} color={theme.textSecondary} fontSize="sm" wrap="wrap">
                  <HStack gap={2}>
                    <Badge variant="subtle" borderRadius="full">{avgLabel}★</Badge>
                    {renderStars(avg)}
                    <Text>({count})</Text>
                  </HStack>

                  <Text>•</Text>

                  {(() => {
                    const stockShown = selectedVariant ? (selectedVariant.stock ?? 0) : (p?.quantity ?? 0)
                    return (
                      <Text>
                        Stock: <b>{stockShown}</b>
                        {stockShown <= 5 && stockShown > 0 && <Text as="span"> · low</Text>}
                        {stockShown === 0 && <Text as="span"> · sold out</Text>}
                      </Text>
                    )
                  })()}
                </HStack>
              </VStack>
            </Skeleton>

            {/* Price block as hero */}
<Box
  border="1px solid"
  borderColor={theme.border}
  borderRadius="lg"
  px={5}
  py={4}
  bg={theme.secondaryBg}
>
  {(() => {
    const base = Number(basePrice || 0)
    const effective = Number(effectivePrice || 0)
    const hasDiscount = base > effective && base > 0

    const pct = hasDiscount
      ? Math.round(((base - effective) / base) * 100)
      : 0

    return (
      <VStack align="flex-start" spacing={1}>
        {/* Main price + discount */}
        <HStack spacing={3} align="center">
          <HStack spacing={2} align="baseline">
            <Text
              fontSize={{ base: "32px", md: "40px" }}
              fontWeight="800"
              lineHeight="1"
              color={theme.text}
            >
              {priceFmt(effective)}
            </Text>
            <Text
              fontSize="sm"
              fontWeight="700"
              color={theme.textSecondary}
            >
              USD
            </Text>
          </HStack>

          {hasDiscount && (
            <Badge
              colorScheme="red"
              fontSize="sm"
              fontWeight="800"
              borderRadius="md"
              px={2}
              py={1}
            >
              -{pct}%
            </Badge>
          )}
        </HStack>

        {/* Base price */}
        {hasDiscount && (
          <Text fontSize="sm" color={theme.textMuted}>
            <Text as="s">{priceFmt(base)}</Text> USD
          </Text>
        )}

        {/* Short description */}
        {p?.shortDescription && (
          <Text fontSize="sm" color={theme.textSecondary} pt={1}>
            {p.shortDescription}
          </Text>
        )}
      </VStack>
    )
  })()}
</Box>




            {/* Variants (minimal pills) */}
            {!!groups.length && (
              <VStack align="stretch" gap={4}>
                {groups.map((g) => (
                  <Box key={g.id}>
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="semibold" color={theme.text}>{g.name}</Text>
                      {sel[g.name] && (
                        <Text fontSize="sm" color={theme.textSecondary}>
                          {sel[g.name]}
                        </Text>
                      )}
                    </HStack>

                    <Wrap spacing={2}>
                      {(g.options || []).map((op) => {
                        const active = sel[g.name] === op.value
                        const available = isOptionAvailable(g.name, op.value)
                        return (
                          <WrapItem key={op.id}>
                            <Tooltip content={!available ? "Out of stock" : undefined} openDelay={250}>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSel(prev => (prev[g.name] === op.value
                                  ? (() => { const { [g.name]: _, ...rest } = prev; return rest })()
                                  : { ...prev, [g.name]: op.value }
                                ))}
                                isDisabled={!available}
                                borderRadius="full"
                                borderColor={active ? theme.text : theme.border}
                                bg={active ? theme.hoverBg : "transparent"}
                                color={theme.text}
                                _hover={{ bg: theme.hoverBg }}
                                _disabled={{ opacity: 0.35, textDecoration: "line-through" }}
                                aria-pressed={active}
                                role="radio"
                              >
                                {op.value}
                              </Button>
                            </Tooltip>
                          </WrapItem>
                        )
                      })}
                    </Wrap>
                  </Box>
                ))}
              </VStack>
            )}

            {/* Meta row (compact) */}
            <HStack color={theme.textMuted} fontSize="sm" wrap="wrap" gap={3}>
              <Text>SKU: <b>{selectedVariant?.skuCode || p?.sku || "—"}</b></Text>
              <Text>•</Text>
              <HStack gap={2}><LuCircleCheck /><Text>7-day returns</Text></HStack>
              <Text>•</Text>
              <HStack gap={2}><LuTruck /><Text>Fast delivery</Text></HStack>
            </HStack>

            <Separator borderColor={theme.border} />

            {/* Actions (CTA dominates, share is quiet) */}
            <Stack direction={{ base: "column", sm: "row" }} gap={3} align="stretch">
              <NumberInput.Root
                size="sm"
                min={1}
                max={Math.max(selectedVariant ? (selectedVariant.stock ?? 0) : (p?.quantity ?? 0), 1)}
                defaultValue={qty}
                onValueChange={(v) => setQty(Number(v.value) || 1)}
                w={{ base: "full", sm: "140px" }}
              >
                <NumberInput.Control bg={theme.inputBg} borderColor={theme.border} />
                <NumberInput.Input bg={theme.inputBg} color={theme.text} borderColor={theme.border} />
              </NumberInput.Root>

              <Button
                onClick={handleAddToCart}
                isDisabled={!canAdd}
                size="md"
                w="full"
                bg={theme.text}         // CTA = black/near-black
                color={theme.cardBg}    // text = white/near-white
                _hover={{ opacity: 0.9 }}
                borderRadius="xl"
              >
                <LuShoppingCart size={18} />
                <Text ml={2}>
                  {(selectedVariant ? (selectedVariant.stock ?? 0) : (p?.quantity ?? 0)) > 0 ? "Add to cart" : "Hết hàng"}
                </Text>
              </Button>

              <Tooltip content={hasCopied ? "Đã sao chép link" : "Sao chép link"} openDelay={200}>
                <IconButton
                  aria-label="Share"
                  variant="outline"
                  onClick={onCopy}
                  borderColor={theme.border}
                  color={theme.text}
                  _hover={{ bg: theme.hoverBg }}
                  borderRadius="xl"
                >
                  <LuCopy />
                </IconButton>
              </Tooltip>
            </Stack>



          </VStack>
        </Box>
      </SimpleGrid>


<Box
  maxW="7xl"
  mx="auto"
  px={{ base: 4, md: 6 }}
  pb={20}
>
  <Box
    borderTop="1px solid"
    borderColor={theme.border}
    pt={{ base: 8, md: 12 }}
  >
    <Accordion.Root collapsible> {/* collapsible để cho phép thu gọn hoàn toàn */}
      <Accordion.Item border="none">
        {/* Trigger: phần clickable, thay AccordionButton */}
        <Accordion.ItemTrigger
          py={6}
          _hover={{ bg: 'gray.50' }} // Hover effect nhẹ
          borderRadius="md"
        >
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={10} width="full" alignItems="center">
            {/* Left: Title nổi bật */}
            <VStack align="start" spacing={3}>
              <Heading size="lg" letterSpacing="-0.02em" fontWeight="bold">
                Product Details
              </Heading>
              <Text fontSize="sm" color={theme.textMuted}>
                Everything you need to know about this product
              </Text>
            </VStack>

            {/* Right: Icon chevron chỉ thị mở/rút gọn */}
            <Box gridColumn={{ md: "span 2" }} textAlign="right">
              <Accordion.ItemIndicator boxSize={8} />
            </Box>
          </SimpleGrid>
        </Accordion.ItemTrigger>

        {/* Content: phần mở ra */}
        <Accordion.ItemContent
          pb={8}
          // Offset để align với cột phải trong grid
          ml={{ md: '33.333%' }} // Tương đương offset 1 cột trong grid 3
        >
          <Accordion.ItemBody>
            <Text
              color={theme.textSecondary}
              fontSize="md"
              lineHeight="1.9"
              whiteSpace="pre-line"
            >
              {p?.description}
            </Text>
          </Accordion.ItemBody>
        </Accordion.ItemContent>
      </Accordion.Item>
    </Accordion.Root>
  </Box>
</Box>

      {/* Ratings Section */}
      <Box mt={{ base: 8, md: 12 }}>
        <HStack justify="space-between" align="center" mb={3}>
          <HStack gap={2} align="center">
            <Icon as={LuStar} color="yellow.400" boxSize={5} />
            <Heading size="md" lineHeight="1.2" color={theme.text}>
              Ratings {ratingSummary && `(${avgLabel}★)`}
            </Heading>
          </HStack>

          <HStack gap={3}>
            <SelectRoot
              value={[ratingSortKey]}
              onValueChange={(e) => setRatingSortKey(e.value?.[0] || 'createdAtDesc')}
              position="relative"
            >
              <SelectTrigger w="220px" bg={theme.cardBg} color={theme.text} borderColor={theme.border}>
                <SelectValueText placeholder="Sort" />
              </SelectTrigger>
              <SelectContent position="absolute" width="220px" top="120%" bg={theme.cardBg} borderColor={theme.border}>
                <SelectItem cursor="pointer" item="createdAtDesc" color={theme.text} _hover={{ bg: theme.hoverBg }}>Newest</SelectItem>
                <SelectItem cursor="pointer" item="createdAtAsc" color={theme.text} _hover={{ bg: theme.hoverBg }}>Oldest</SelectItem>
                <SelectItem cursor="pointer" item="likeCountDesc" color={theme.text} _hover={{ bg: theme.hoverBg }}>Most Likes</SelectItem>
                <SelectItem cursor="pointer" item="starsDesc" color={theme.text} _hover={{ bg: theme.hoverBg }}>Ratings High → Low</SelectItem>
                <SelectItem cursor="pointer" item="starsAsc" color={theme.text} _hover={{ bg: theme.hoverBg }}>Ratings Low → High</SelectItem>
              </SelectContent>
            </SelectRoot>
          </HStack>
        </HStack>
        <Separator mb={4} borderColor={theme.border} />

        <VStack align="stretch" gap={3}>
          {ratings.map(r => (
            <Box
              key={r.id}
              bg={theme.cardBg}
              p={4}
              borderRadius="lg"
              boxShadow="sm"
              border="1px solid"
              borderColor={theme.border}
              _hover={{ boxShadow: 'md', borderColor: theme.borderLight }}
            >
              <HStack justify="space-between" align="start">
                <HStack>
                  <Avatar.Root>
                    <Avatar.Fallback name={r.anonymous ? 'Anonymous' : r.username} />
                    <Avatar.Image src={avatarSrcOf(r)} />
                  </Avatar.Root>

                  <VStack align="start" gap={0}>
                    <HStack>
                      <Badge colorPalette="yellow">{r.stars}★</Badge>
                      <Text color={theme.text} fontWeight="medium">
                        {r.anonymous ? 'AnonymouseUser' : (r.username || 'User')}
                      </Text>
                    </HStack>
                    <Text color={theme.textMuted} fontSize="xs">
                      {new Date(r.createdAt).toLocaleString()}
                    </Text>
                  </VStack>
                </HStack>

                <HStack gap={1}>
                  <IconButton
                    aria-label={likedIds.has(r.id) ? 'Unlike' : 'Like'}
                    size="xs"
                    variant={likedIds.has(r.id) ? 'solid' : 'outline'}
                    colorPalette={likedIds.has(r.id) ? 'blue' : 'gray'}
                    onClick={() => handleToggleLike(r.id)}
                    aria-pressed={likedIds.has(r.id)}
                  >
                    <LuThumbsUp />
                  </IconButton>
                  <Text fontSize="sm" color={theme.textSecondary} minW="1.5ch" textAlign="right">
                    {likeCounts[r.id] ?? 0}
                  </Text>
                </HStack>
              </HStack>

              {/* Comment */}
              {!!r.comment && <Text mt={2} color={theme.text}>{r.comment}</Text>}

              {/* Images */}
              {!!r.imageUrls?.length && (
                <Wrap mt={3} gap={2}>
                  {r.imageUrls.map((img, i) => (
                    <WrapItem key={i}>
                      <Box
                        borderRadius="md"
                        overflow="hidden"
                        border="1px solid"
                        borderColor={theme.border}
                        cursor="zoom-in"
                        onClick={() => onOpen()}
                      >
                        <AspectRatio ratio={1} w="72px">
                          <Image src={urlOrNull(img)} alt={`review-${r.id}-${i}`} objectFit="cover" />
                        </AspectRatio>
                      </Box>
                    </WrapItem>
                  ))}
                </Wrap>
              )}
            </Box>
          ))}

          {loadingRatings && <Text color={theme.textMuted}>Loading...</Text>}
          {(!loadingRatings && ratings.length === 0) && <Text color={theme.textMuted}>No reviews yet</Text>}

          {/* Load more */}
          {ratingHasMore && (
            <VStack>
              <Button
                onClick={() => loadRatings(ratingPage + 1, true)}
                isLoading={loadingRatings}
                variant="outline"
                size="sm"
                borderColor={theme.border}
                color={theme.text}
                _hover={{ bg: theme.hoverBg }}
              >
                Xem thêm
              </Button>
              <Box ref={moreRef} h="1px" w="100%" />
            </VStack>
          )}
        </VStack>
      </Box>

      {/* Similar Products */}
      <Box mt={{ base: 10, md: 12 }}>
        <HStack justify="space-between" align="center" mb={3}>
          <HStack gap={2} align="center">
            <Icon as={LuPackage} color={theme.accent} boxSize={5} />
            <Heading size="md" lineHeight="1.2" color={theme.text}>
              Similar products {similar.length > 0 && `(${similar.length})`}
            </Heading>
          </HStack>
          
          {p?.categoryIds?.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/category/${p.categoryIds[0]}`)}
              color={theme.textSecondary}
              _hover={{ bg: theme.hoverBg, color: theme.text }}
            >
              See all →
            </Button>
          )}
        </HStack>

        <Box position="relative">
          {/* Scroll buttons */}
          <IconButton
            aria-label="Prev"
            variant="ghost"
            position="absolute"
            left={-2}
            top="50%"
            transform="translateY(-50%)"
            onClick={() => { if (railRef.current) railRef.current.scrollBy({ left: -320, behavior: 'smooth' }) }}
            display={{ base: 'none', md: 'flex' }}
            zIndex={1}
            bg={theme.cardBg}
            color={theme.text}
            _hover={{ bg: theme.hoverBg }}
          >
            <LuChevronLeft />
          </IconButton>

          <IconButton
            aria-label="Next"
            variant="ghost"
            position="absolute"
            right={-2}
            top="50%"
            transform="translateY(-50%)"
            onClick={() => { if (railRef.current) railRef.current.scrollBy({ left: 320, behavior: 'smooth' }) }}
            display={{ base: 'none', md: 'flex' }}
            zIndex={1}
            bg={theme.cardBg}
            color={theme.text}
            _hover={{ bg: theme.hoverBg }}
          >
            <LuChevronRight />
          </IconButton>

          <HStack
            ref={railRef}
            overflowX="auto"
            gap={3}
            py={2}
            px={1}
            sx={{ scrollbarWidth: 'thin' }}
          >
            {!loadingSimilar && similar.length === 0 && (
              <Text color={theme.textMuted} px="2">No similar products found.</Text>
            )}

            <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} gap={4} mb={6} w="full">
              {!loadingSimilar && similar.map(item => (
                <ProductCard
                  key={item.id}
                  p={item}
                  onAdd={() => navigate(`/product/${item.id}`)}
                  theme={theme}
                />
              ))}
            </SimpleGrid>
          </HStack>
        </Box>
      </Box>

      {/* Sticky Mobile Action Bar */}
      <Box
        display={{ base: 'block', md: 'none' }}
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        bg={theme.cardBg}
        boxShadow="0 -6px 24px rgba(0,0,0,.06)"
        borderTop="1px solid"
        borderColor={theme.border}
        p={3}
        zIndex={1000}
      >
        <HStack justify="space-between">
          <VStack align="start" gap={0}>
            <Text fontSize="md" fontWeight="bold" color={theme.text}>{priceFmt(Number(effectivePrice || 0))} USD</Text>
            {(hasDiscount || (basePrice && basePrice > effectivePrice)) && (
              <HStack gap={2} fontSize="xs" color={theme.textMuted}>
                <Text as="s">{priceFmt(Number(basePrice || 0))} USD</Text>
                <Badge colorPalette="red">
                  -{Math.max(0, Math.round(100 - (Number(effectivePrice) / (Number(basePrice) || 1)) * 100))}%
                </Badge>
              </HStack>
            )}
          </VStack>
          <Button 
            leftIcon={<LuShoppingCart size={20} />} 
            size="md" 
            onClick={handleAddToCart} 
            isDisabled={!canAdd}
            bg={theme.primary}
            color="white"
            _hover={{ bg: theme.primaryHover }}
          >
            <LuShoppingCart size={20} /> {(selectedVariant ? (selectedVariant.stock ?? 0) : (p?.quantity ?? 0)) > 0 ? 'Add to cart' : 'Out of stock'}
          </Button>
        </HStack>
      </Box>

      {/* Lightbox */}
      <Dialog.Root
        open={isOpen}
        onOpenChange={(next) => (next ? onOpen() : onClose())}
        size="4xl"
        placement="center"
      >
        <Portal>
          <Dialog.Backdrop bg={theme.isLight ? 'blackAlpha.600' : 'blackAlpha.800'} />
          <Dialog.Positioner>
            <Dialog.Content bg="transparent" boxShadow="none" p={0}>
              <Dialog.CloseTrigger asChild>
                <CloseButton 
                  bg={theme.cardBg} 
                  color={theme.text}
                  _hover={{ bg: theme.hoverBg }} 
                  position="absolute" 
                  top="2" 
                  right="2" 
                />
              </Dialog.CloseTrigger>
              <Dialog.Body p={0}>
                <AspectRatio ratio={1}>
                  <Image
                    src={thumbs[activeIdx] || mainImg}
                    alt={p?.name}
                    objectFit="contain"
                    bg={theme.isLight ? 'black' : theme.cardBg}
                  />
                </AspectRatio>
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  )
}