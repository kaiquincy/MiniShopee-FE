import {
  Accordion,
  AspectRatio,
  Avatar,
  Badge,
  Box,
  Button,
  CloseButton,
  Dialog,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Image,
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
  Wrap, WrapItem
} from '@chakra-ui/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchProductById, getSimilarProducts } from '../api/products'
import { openRoom } from '../api/chat'
import { getRatings, getRatingSummary as getsum, toggleRatingLike } from '../api/ratings'

import { LuChevronLeft, LuMessageCircle , LuChevronRight, LuShare2, LuHash, LuPackage, LuShoppingCart, LuStar, LuThumbsUp } from 'react-icons/lu'
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
        toaster.create({ title: 'Không tải được sản phẩm', type: 'error' })
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
      toaster.create({ title: 'Không tải được đánh giá', type: 'error' })
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
      toaster.create({ title: 'Không thể cập nhật lượt thích', type: 'error' })
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
      toaster.create({ title: 'Please select varients!', type: 'warning' })
      return
    }
    try {
      await addToCart(p.id, qty, selectedVariant?.id)
      toaster.create({ title: 'Add successfully', type: 'success' })
    } catch {
      toaster.create({ title: 'Unable to add product', type: 'error' })
    }
  }

  const handleContactSeller = async () => {
    if (!p?.sellerId) {
      toaster.create({ title: 'Unable to find seller', type: 'error' })
      return
    }
    try {
      await openRoom(p.sellerId)
      navigate('/chat')
    } catch (e) {
      const message =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        'Không thể mở chat'
      toaster.create({ title: message, type: 'error' })
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
          p={{ base: 5, md: 6 }}
          boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.05)"
          transition="all 0.2s ease"
          overflow="hidden"
        >
          {/* Subtle gradient overlay */}
          <Box
            position="absolute"
            top="0"
            left="0"
            right="0"
            h="150px"
            background={theme.isLight
              ? 'linear-gradient(180deg, rgba(59, 130, 246, 0.04) 0%, transparent 100%)'
              : 'linear-gradient(180deg, rgba(59, 130, 246, 0.08) 0%, transparent 100%)'
            }
            pointerEvents="none"
          />

          <VStack align="stretch" gap={5} position="relative">
            {/* Title + meta */}
            <Skeleton loading={loading}>
              <VStack align="stretch" gap={3}>
                <Heading 
                  size="xl" 
                  letterSpacing="-0.02em" 
                  color={theme.text}
                  lineHeight="1.2"
                  fontWeight="black"
                >
                  {p?.name}
                </Heading>

                <HStack gap={3} color={theme.textSecondary} fontSize="sm" wrap="wrap">
                  <HStack gap={2}>
                    <Badge 
                      background="linear-gradient(135deg, #FFF3BF 0%, #FFE066 100%)"
                      color="#E67700"
                      border="1px solid"
                      borderColor={theme.isLight ? "#FFD43B" : "#92400E"}
                      borderRadius="full"
                      px={2.5}
                      py={1}
                      fontWeight="bold"
                      boxShadow="0 2px 4px rgba(245, 158, 11, 0.2)"
                    >
                      {avgLabel}★
                    </Badge>
                    {renderStars(avg)}
                    <Text fontWeight="medium">({count} reviews)</Text>
                  </HStack>

                  <Text>•</Text>

                  {(() => {
                    const stockShown = selectedVariant ? (selectedVariant.stock ?? 0) : (p?.quantity ?? 0)
                    return (
                      <HStack gap={2}>
                        <Text fontWeight="medium">Stock: <b>{stockShown}</b></Text>
                        {stockShown <= 5 && stockShown > 0 && (
                          <Badge 
                            background="linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)"
                            color="#92400E"
                            border="1px solid"
                            borderColor="#FCD34D"
                            borderRadius="md"
                            fontSize="xs"
                            px={2}
                            py={0.5}
                          >
                            Low Stock
                          </Badge>
                        )}
                        {stockShown === 0 && (
                          <Badge 
                            background="linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)"
                            color="#991B1B"
                            border="1px solid"
                            borderColor="#FCA5A5"
                            borderRadius="md"
                            fontSize="xs"
                            px={2}
                            py={0.5}
                          >
                            Sold Out
                          </Badge>
                        )}
                      </HStack>
                    )
                  })()}
                </HStack>
              </VStack>
            </Skeleton>


            {/* Price block */}
            {(() => {
              const effective = Number(basePrice || 0)
              const base = Number(effectivePrice || 0)
              const hasDiscount = base > effective && base > 0
              const pct = hasDiscount ? Math.round(((base - effective) / base) * 100) : 0

              return (
                <VStack align="flex-start" spacing={2}>
                  {/* Main price + discount */}
                  <HStack spacing={3} align="baseline" wrap="wrap">
                    <HStack spacing={3} align="baseline" wrap="wrap">
                      <HStack spacing={2} align="baseline">
                        <Text
                          fontSize={{ base: "36px", md: "44px" }}
                          fontWeight="900"
                          lineHeight="1"
                          color={theme.text}
                          letterSpacing="-0.02em"
                        >
                          {priceFmt(effective)}
                        </Text>
                        <Text
                          fontSize="md"
                          fontWeight="bold"
                          color={theme.textSecondary}
                        >
                          USD
                        </Text>
                      </HStack>

                      {hasDiscount && (
                        <Badge
                          background="linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"
                          color="white"
                          fontSize="sm"
                          fontWeight="bold"
                          borderRadius="md"
                          px={3}
                          py={1.5}
                          boxShadow="0 2px 8px rgba(239, 68, 68, 0.4)"
                        >
                          -{pct}% OFF
                        </Badge>
                      )}
                    </HStack>
                  </HStack>

                  {/* Base price */}
                  {hasDiscount && (
                    <HStack spacing={2}>
                      <Text fontSize="md" color={theme.textMuted} fontWeight="medium">
                        <Text as="s">{priceFmt(base)} USD</Text>
                      </Text>
                      <Text fontSize="sm" color={theme.isLight ? "#10B981" : "#34D399"} fontWeight="semibold">
                        Save {priceFmt(base - effective)}
                      </Text>
                    </HStack>
                  )}

                  {/* Short description */}
                  {p?.shortDescription && (
                    <Text fontSize="sm" color={theme.textSecondary} pt={1} lineHeight="1.6">
                      {p.shortDescription}
                    </Text>
                  )}
                </VStack>
              )
            })()}

            <Separator borderColor={theme.border} />

            {/* Variants section */}
            {!!groups.length && (
              <VStack align="stretch" gap={4}>
                {groups.map((g) => (
                  <Box key={g.id}>
                    <HStack justify="space-between" mb={3}>
                      <Text fontWeight="bold" color={theme.text} fontSize="sm">
                        {g.name}
                      </Text>
                      {sel[g.name] && (
                        <Badge
                          background={theme.isLight 
                            ? 'linear-gradient(135deg, #E7F5FF 0%, #D0EBFF 100%)' 
                            : 'linear-gradient(135deg, #1E3A5F 0%, #1E40AF 100%)'
                          }
                          color={theme.isLight ? "#1971C2" : "#60A5FA"}
                          px={2.5}
                          py={1}
                          borderRadius="md"
                          fontSize="xs"
                          fontWeight="semibold"
                          border="1px solid"
                          borderColor={theme.isLight ? "#A5D8FF" : "#1E40AF"}
                        >
                          {sel[g.name]}
                        </Badge>
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
                                onClick={() => setSel(prev => (prev[g.name] === op.value
                                  ? (() => { const { [g.name]: _, ...rest } = prev; return rest })()
                                  : { ...prev, [g.name]: op.value }
                                ))}
                                isDisabled={!available}
                                borderRadius="full"
                                border="2px solid"
                                borderColor={active ? (theme.isLight ? "#3B82F6" : "#2563EB") : theme.border}
                                bg={active ? (theme.isLight ? "#EFF6FF" : "#1E3A5F") : "transparent"}
                                color={active ? (theme.isLight ? "#1E40AF" : "#60A5FA") : theme.text}
                                fontWeight={active ? "bold" : "medium"}
                                px={4}
                                _hover={{ 
                                  bg: active ? undefined : theme.hoverBg,
                                  borderColor: active ? undefined : theme.borderLight,
                                  transform: 'translateY(-2px)'
                                }}
                                _disabled={{ 
                                  opacity: 0.4, 
                                  textDecoration: "line-through",
                                  cursor: "not-allowed"
                                }}
                                aria-pressed={active}
                                role="radio"
                                transition="all 0.2s ease"
                                boxShadow={active ? "0 2px 8px rgba(59, 130, 246, 0.2)" : "none"}
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

            {/* Meta information */}
            <VStack align="stretch" gap={2}>
              <HStack color={theme.textMuted} fontSize="sm" gap={3}>
                <HStack gap={1.5}>
                  <Icon as={LuHash} boxSize={4} />
                  <Text>SKU: <Text as="span" fontWeight="bold" color={theme.text}>{selectedVariant?.skuCode || p?.sku || "—"}</Text></Text>
                </HStack>
              </HStack>
            </VStack>

            <Separator borderColor={theme.border} />

            {/* Actions - Horizontal layout on md+ */}
            <VStack align="stretch" gap={3}>
              {/* Label */}
              <Text fontSize="sm" fontWeight="semibold" color={theme.text}>
                Quantity
              </Text>

              {/* Buttons row */}
              <Stack 
                direction={{ base: "column", md: "row" }} 
                spacing={3}
                align="stretch"
              >
                {/* Quantity */}
                <Box flex={{ base: "1", md: "0 0 67px" }}>
                  <NumberInput.Root
                    size="lg"
                    min={1}
                    max={Math.max(selectedVariant ? (selectedVariant.stock ?? 0) : (p?.quantity ?? 0), 1)}
                    defaultValue={qty}
                    onValueChange={(v) => setQty(Number(v.value) || 1)}
                    w="full"
                    h="52px"
                  >
                    <NumberInput.Control 
                      bg={theme.inputBg} 
                      borderColor={theme.borderLight}
                      borderRadius="lg"
                      _hover={{ borderColor: theme.hoverBg }}
                    />
                    <NumberInput.Input 
                      h="full"
                      bg={theme.inputBg} 
                      color={theme.text} 
                      borderColor={theme.border}
                      fontWeight="semibold"
                      textAlign="left"
                    />
                  </NumberInput.Root>
                </Box>

                {/* Add to Cart - chiếm phần lớn */}
                <Box flex="1">
                  <Button
                    onClick={handleAddToCart}
                    isDisabled={!canAdd}
                    size="lg"
                    w="full"
                    h="52px"
                    background={theme.isLight 
                      ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                      : 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)'
                    }
                    color="white"
                    borderRadius="lg"
                    fontWeight="bold"
                    fontSize="md"
                    boxShadow="0 4px 12px rgba(59, 130, 246, 0.3)"
                    _hover={{ 
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 16px rgba(59, 130, 246, 0.4)'
                    }}
                    _active={{ transform: 'translateY(0)' }}
                    _disabled={{ opacity: 0.6, cursor: 'not-allowed', transform: 'none' }}
                    transition="all 0.2s ease"
                  >
                    <Icon as={LuShoppingCart} boxSize={5} />
                    <Text ml={2}>
                      {stockShown > 0 ? "Add to Cart" : "Out of Stock"}
                    </Text>
                  </Button>
                </Box>

                {/* Chat với người bán */}
                <Box flex={{ base: "1", md: "0 0 16px" }}>
                  <Tooltip content="Contact Seller" openDelay={200}>
                    <Button
                      onClick={handleContactSeller}
                      size="lg"
                      w="full"
                      h="52px"
                      variant="outline"
                      borderColor={theme.borderLight}
                      color={theme.text}
                      borderRadius="lg"
                      fontWeight="bold"
                      fontSize="md"
                      leftIcon={<Icon as={LuMessageCircle} boxSize={5} />}
                      _hover={{ 
                        bg: theme.hoverBg,
                        borderColor: theme.accent || '#3B82F6',
                        transform: 'translateY(-2px)'
                      }}
                      _active={{ transform: 'translateY(0)' }}
                      transition="all 0.2s ease"
                      boxShadow="0 2px 8px rgba(0,0,0,0.05)"
                    >
                      <Icon as={LuMessageCircle} boxSize={5} />
                      <Text display={{ base: "block", md: "none" }}>Chat</Text>
                    </Button>
                  </Tooltip>
                </Box>

                {/* Share */}
                <Box flex={{ base: "1", md: "0 0 auto" }}>
                  <Tooltip content={hasCopied ? "Đã copy link!" : "Share"} openDelay={200}>
                    <Button
                      variant="outline"
                      onClick={onCopy}
                      w="full"
                      h="52px"
                      borderColor={theme.border}
                      color={theme.text}
                      borderRadius="lg"
                      fontWeight="semibold"
                      _hover={{ 
                        bg: theme.hoverBg,
                        borderColor: theme.borderLight
                      }}
                    >
                      <Icon as={LuShare2} boxSize={4} />
                    </Button>
                  </Tooltip>
                </Box>
              </Stack>
            </VStack>
          </VStack>
        </Box>
      </SimpleGrid>



      {/* Product Details Accordion */}
      <Box pb={20}>
        <Accordion.Root collapsible>
          <Accordion.Item border="none">
            <Box
              border="1px solid"
              borderColor={theme.border}
              bg={theme.cardBg}
              borderRadius="2xl"
              overflow="hidden"
              boxShadow={theme.isLight ? "sm" : "0 8px 24px rgba(0,0,0,0.35)"}
            >
              {/* Trigger */}
              <Accordion.ItemTrigger
                w="full"
                px={{ base: 5, md: 7 }}
                py={{ base: 5, md: 6 }}
                transition="all 0.2s ease"
                cursor="pointer"
                _hover={{ bg: theme.hoverBg }}
              >
                <Flex w="full" align="center" gap={{ base: 4, md: 6 }}>
                  {/* Accent */}
                  <Box
                    w="4px"
                    alignSelf="stretch"
                    borderRadius="full"
                    background={theme.isLight 
                      ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                      : 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)'
                    }
                  />

                  {/* Title */}
                  <Box flex="1">
                    <Heading size="lg" letterSpacing="-0.02em" fontWeight="bold" color={theme.text}>
                      Product Details
                    </Heading>
                    <Text mt={1} fontSize="sm" color={theme.textMuted}>
                      Everything you need to know about this product
                    </Text>
                  </Box>

                  {/* Indicator */}
                  <Box
                    w="80px"
                    h="80px"
                    display="grid"
                    placeItems="center"
                  >
                    <Accordion.ItemIndicator boxSize={6} />
                  </Box>
                </Flex>
              </Accordion.ItemTrigger>

              {/* Content */}
              <Accordion.ItemContent>
                <Box
                  px={{ base: 5, md: 7 }}
                  pb={{ base: 6, md: 7 }}
                  pt={0}
                >
                  <Box
                    borderTop="1px solid"
                    borderColor={theme.border}
                    pt={{ base: 4, md: 5 }}
                  >
                    <Accordion.ItemBody>
                      <Text
                        color={theme.textSecondary}
                        fontSize="lg"
                        lineHeight="1.9"
                        whiteSpace="pre-line"
                      >
                        {p?.description}
                      </Text>
                    </Accordion.ItemBody>
                  </Box>
                </Box>
              </Accordion.ItemContent>
            </Box>
          </Accordion.Item>
        </Accordion.Root>
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