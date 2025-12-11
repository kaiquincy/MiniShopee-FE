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
  Wrap, WrapItem,
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

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={{ base: 6, md: 10 }} position="relative" mb={40}>
        {/* Gallery */}
        <VStack align="stretch" gap={4}>
          <Box
            position="relative"
            borderRadius="xl"
            boxShadow="sm"
            p={{ base: 1.5, md: 2 }}
            bg={theme.cardBg}
            border="1px solid"
            borderColor={theme.border}
            role="group"
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') nextImg()
              if (e.key === 'ArrowLeft') prevImg()
            }}
            tabIndex={0}
          >
            <Skeleton loading={loading}>
              <AspectRatio ratio={1}>
                <Image
                  src={thumbs[activeIdx] || mainImg}
                  alt={p?.name}
                  borderRadius="lg"
                  objectFit="cover"
                  cursor="zoom-in"
                  onClick={onOpen}
                  _groupHover={{ transform: 'translateY(-1px)' }}
                  transition="transform .15s ease"
                />
              </AspectRatio>
            </Skeleton>

            {/* Prev / Next */}
            <HStack
              position="absolute"
              top="50%"
              left={4}
              right={4}
              px={2}
              justify="space-between"
              transform="translateY(-50%)"
              opacity={0.75}
            >
              <IconButton 
                aria-label="Previous image" 
                onClick={prevImg} 
                size="sm"
                variant="ghost"
                bg={theme.cardBg}
                color={theme.text}
                _hover={{ bg: theme.hoverBg }}
                borderRadius="50%"
              >
                <LuChevronLeft />
              </IconButton>
              <IconButton 
                aria-label="Next image" 
                onClick={nextImg} 
                size="sm" 
                variant="ghost"
                bg={theme.cardBg}
                color={theme.text}
                _hover={{ bg: theme.hoverBg }}
                borderRadius="50%"
              >
                <LuChevronRight />
              </IconButton>
            </HStack>
          </Box>

          {/* Thumbnails */}
          <HStack
            overflowX="auto"
            gap={3}
            py={1}
            px={0.5}
            sx={{
              scrollbarWidth: 'thin',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
            }}
            position="absolute"
            bottom={{ base: "-10%", md: "-8%" , lg:"-20%" }}
          >
            {thumbs.map((src, idx) => {
              const active = idx === activeIdx
              return (
                <Box
                  key={idx}
                  onClick={() => setActiveIdx(idx)}
                  borderRadius="md"
                  overflow="hidden"
                  cursor="pointer"
                  outline={active ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`}
                  transition="all .2s ease"
                  _hover={{ transform: 'translateY(-2px)' }}
                  flex="0 0 88px"
                  position="relative"
                  bg={theme.cardBg}
                >
                  <AspectRatio ratio={1}>
                    <Image src={src} alt={`thumb-${idx}`} objectFit="cover"/>
                  </AspectRatio>
                  {active && (
                    <Badge position="absolute" top={1} left={1} borderRadius="full" px="2" colorPalette="blue">
                      Watching
                    </Badge>
                  )}
                </Box>
              )
            })}
          </HStack>
        </VStack>

        {/* Purchase Panel */}
        <Box
          position={{ base: 'static', lg: 'sticky' }}
          minH="100%"
          top={{ lg: 24 }}
          alignSelf="start"
          bg={theme.cardBg}
          borderRadius="2xl"
          boxShadow="md"
          border="1px solid"
          borderColor={theme.border}
          p={{ base: 4, md: 6 }}
        >
          <VStack align="stretch" gap={5}>
            <Skeleton loading={loading}>
              <Heading size="lg" lineHeight="1.2" color={theme.text}>{p?.name}</Heading>
            </Skeleton>

            {/* Rating */}
            <HStack color={theme.textSecondary} gap={3}>
              <Badge borderRadius="full" px="2.5" py="0.5" fontWeight="semibold" colorPalette="yellow">{avgLabel}★</Badge>
              {renderStars(avg)}
              <Text>({count} ratings)</Text>
              {(() => {
                const stockShown = selectedVariant ? (selectedVariant.stock ?? 0) : (p?.quantity ?? 0)
                return (
                  <>
                    {stockShown <= 5 && stockShown > 0 && (
                      <Badge colorPalette="orange" borderRadius="full">Low In Stock</Badge>
                    )}
                    {stockShown === 0 && (
                      <Badge colorPalette="red" borderRadius="full">Sold Out</Badge>
                    )}
                  </>
                )
              })()}
            </HStack>

            {/* Price */}
            <Box>
              <HStack gap={3} align="baseline" wrap="wrap">
                <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="extrabold" color={theme.accent}>
                  {priceFmt(Number(effectivePrice || 0))} USD
                </Text>
                {(() => {
                  const showStrike = (hasDiscount || (basePrice && basePrice > effectivePrice))
                  const pct = Math.max(0, Math.round(100 - (Number(effectivePrice) / (Number(basePrice) || 1)) * 100))
                  return showStrike && (
                    <HStack gap={2}>
                      <Text as="s" color={theme.textMuted}>{priceFmt(Number(basePrice || 0))} USD</Text>
                      <Badge colorPalette="red">-{pct}%</Badge>
                    </HStack>
                  )
                })()}
              </HStack>
              {p?.shortDescription && (
                <Text mt={2} color={theme.textSecondary}>{p.shortDescription}</Text>
              )}
            </Box>

            {/* Description */}
            {!!p?.description && (
              <Text color={theme.textSecondary} noOfLines={{ base: 5, md: 6 }}>
                {p.description}
              </Text>
            )}

            {/* Variant Selection */}
            {!!groups.length && (
              <VStack align="stretch" gap={4}>
                {groups.map((g) => (
                  <Box key={g.id}>
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="medium" color={theme.text}>{g.name}</Text>
                      {sel[g.name] && <Text color={theme.textSecondary}>Selected: <b>{sel[g.name]}</b></Text>}
                    </HStack>
                    <Wrap>
                      {(g.options||[]).map((op) => {
                        const active = sel[g.name] === op.value
                        const available = isOptionAvailable(g.name, op.value)
                        return (
                          <WrapItem key={op.id}>
                            <Tooltip content={!available ? 'Out Of Stock' : undefined} openDelay={250}>
                              <Button
                                size="sm"
                                variant={active ? 'solid' : 'outline'}
                                onClick={() => setSel(prev => (prev[g.name] === op.value
                                  ? (()=>{ const { [g.name]:_, ...rest } = prev; return rest })()
                                  : { ...prev, [g.name]: op.value }))}
                                isDisabled={!available}
                                borderRadius="full"
                                bg={active ? theme.primary : 'transparent'}
                                color={active ? 'white' : theme.text}
                                borderColor={theme.border}
                                _hover={{ bg: active ? theme.primaryHover : theme.hoverBg }}
                                _disabled={{ opacity: 0.4, cursor: 'not-allowed', textDecoration: 'line-through' }}
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

            {/* SKU & Stock Info */}
            <HStack color={theme.textMuted} fontSize="sm" wrap="wrap" gap={3}>
              <Text>SKU: <b>{selectedVariant?.skuCode || p?.sku || '—'}</b></Text>
              <Text>•</Text>
              <Text>In Stock: <b>{selectedVariant ? (selectedVariant.stock ?? 0) : (p?.quantity ?? 0)}</b></Text>
              <Text>•</Text>
              <HStack>
                <LuCircleCheck />
                <Text>7-day returns</Text>
              </HStack>
              <Text>•</Text>
              <HStack>
                <LuTruck />
                <Text>Fast Delivery</Text>
              </HStack>
            </HStack>

            <Separator borderColor={theme.border} />

            {/* Quantity + Actions */}
            <Stack direction={{ base: 'column', sm: 'row' }} gap={4} align="center">
              <NumberInput.Root
                size="sm"
                min={1}
                max={Math.max(selectedVariant ? (selectedVariant.stock ?? 0) : (p?.quantity ?? 0), 1)}
                defaultValue={qty}
                onValueChange={(v)=>setQty(Number(v.value)||1)}
                w={{ base: 'full', sm: '120px' }}
                aria-label="Số lượng"
              >
                <NumberInput.Control bg={theme.inputBg} borderColor={theme.border} />
                <NumberInput.Input bg={theme.inputBg} color={theme.text} borderColor={theme.border} />
              </NumberInput.Root>

              <Button
                onClick={handleAddToCart}
                isDisabled={!canAdd}
                w={{ base: 'full', sm: 'auto' }}
                size="md"
                bg={theme.primary}
                color="white"
                _hover={{ bg: theme.primaryHover }}
              >
                <LuShoppingCart size={20} /> {(selectedVariant ? (selectedVariant.stock ?? 0) : (p?.quantity ?? 0)) > 0 ? 'Add to cart' : 'Hết hàng'}
              </Button>

              <Tooltip content={hasCopied ? 'Đã sao chép link' : 'Sao chép link sản phẩm'} openDelay={200}>
                <IconButton 
                  aria-label="Share" 
                  variant="outline" 
                  onClick={onCopy}
                  borderColor={theme.border}
                  color={theme.text}
                  _hover={{ bg: theme.hoverBg }}
                >
                  <LuCopy />
                </IconButton>
              </Tooltip>
            </Stack>

            {/* Keyboard shortcuts */}
            <HStack color={theme.textMuted} fontSize="xs">
              <Text>Image navigation:</Text>
              <Kbd bg={theme.secondaryBg} color={theme.text}>←</Kbd>
              <Text>/</Text>
              <Kbd bg={theme.secondaryBg} color={theme.text}>→</Kbd>
            </HStack>
          </VStack>
        </Box>
      </SimpleGrid>

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