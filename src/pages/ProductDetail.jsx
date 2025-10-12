import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchProductById } from '../api/products'
import { getRatings, toggleRatingLike, getRatingSummary as getsum } from '../api/ratings'
import {
  Box, Image, Heading, Text, Button, VStack, HStack, Badge, Wrap, WrapItem,
  Separator, NumberInput, SimpleGrid, Skeleton, AspectRatio, Stack,
  IconButton, useDisclosure, useClipboard, Kbd, Icon, CloseButton,
  Dialog, Portal, Avatar, SelectRoot, SelectTrigger, SelectValueText, SelectContent, SelectItem,
} from '@chakra-ui/react'

import { LuStar, LuChevronLeft, LuChevronRight, LuCopy, LuCircleCheck, LuTruck, LuThumbsUp } from 'react-icons/lu'
import { toaster } from '../components/ui/toaster'
import { useCart } from '../context/CartContext'
import { Tooltip } from '../components/ui/Tooltip'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [p, setP] = useState(null)
  const [ratingSummary, setRatingSummary] = useState(null)

  // Ratings + pageable
  const [ratings, setRatings] = useState([])
  const [ratingPage, setRatingPage] = useState(0)               // 0-based
  const [ratingSize, setRatingSize] = useState(5)
  const [ratingSortKey, setRatingSortKey] = useState('createdAtDesc');

  const [ratingSort, setRatingSort] = useState('createdAt,DESC')
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
  const [activeIdx, setActiveIdx] = useState(0) // ảnh Watching

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

  // ===== ratings like counts from payload (fallback 0) =====
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
  }, [id, ratingSize, ratingSort])

  // Reset khi đổi id/sort/size
  useEffect(() => {
    setRatings([])
    setRatingPage(0)
    setRatingHasMore(false)
    setRatingTotal(0)
    loadRatings(0, false)
  }, [id, ratingSort, ratingSize, loadRatings])

  // Infinite scroll (tùy chọn)
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

  const avg = Number((ratingSummary?.averageStars) || 0)
  const avgLabel = avg.toFixed(1)
  const count = ratingSummary?.totalRatings || 0

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
    if (!canAdd) {
      toaster.create({ title: 'Vui lòng chọn đầy đủ biến thể', status: 'warning' })
      return
    }
    try {
      await addToCart(p.id, qty, selectedVariant?.id)
      toaster.create({ title: 'Đã thêm vào giỏ', status: 'success' })
    } catch {
      toaster.create({ title: 'Không thể thêm vào giỏ', status: 'error' })
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
          <Icon key={i} boxSize="14px" color={i < full ? 'yellow.400' : 'gray.300'}>
            <LuStar />
          </Icon>
        ))}
      </HStack>
    )
  }

  return (
    <Box w="full" px={{ base: 4, sm: 6, md: 10, lg: 24 }} py={{ base: 6, md: 8 }}>
      {/* Breadcrumb đơn giản */}
      <HStack gap={2} color="gray.500" fontSize="sm" mb={4}>
        <Button variant="ghost" size="xs" onClick={() => navigate(-1)}>← Trở lại</Button>
        <Text>•</Text>
        <Text noOfLines={1}>{p?.categoryName || '...'}</Text>
        <Text>›</Text>
        <Text noOfLines={1}>{p?.name || '...'}</Text>
      </HStack>

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={{ base: 6, md: 10 }}>
        {/* Cột trái: gallery */}
        <VStack align="stretch" gap={4}>
          <Box
            position="relative"
            borderRadius="xl"
            boxShadow="sm"
            p={{ base: 1.5, md: 2 }}
            bgGradient="linear(to-br, white, gray.50)"
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
              left={0}
              right={0}
              px={2}
              justify="space-between"
              transform="translateY(-50%)"
            >
              <IconButton aria-label="Ảnh trước" onClick={prevImg} size="sm" variant="ghost">
                <LuChevronLeft />
              </IconButton>
              <IconButton aria-label="Ảnh sau" onClick={nextImg} size="sm" variant="ghost">
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
                  outline={active ? '2px solid var(--chakra-colors-brand-500, #3182CE)' : '1px solid var(--chakra-colors-gray-200)'}
                  transition="all .2s ease"
                  _hover={{ transform: 'translateY(-2px)' }}
                  flex="0 0 88px"
                  position="relative"
                >
                  <AspectRatio ratio={1}>
                    <Image src={src} alt={`thumb-${idx}`} objectFit="cover"/>
                  </AspectRatio>
                  {active && (
                    <Badge position="absolute" top={1} left={1} borderRadius="full" px="2">
                      Watching
                    </Badge>
                  )}
                </Box>
              )
            })}
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
          <VStack align="stretch" gap={5}>
            <Skeleton loading={loading}>
              <Heading size="lg" lineHeight="1.2">{p?.name}</Heading>
            </Skeleton>

            {/* Rating + số đánh giá */}
            <HStack color="gray.600" gap={3}>
              <Badge borderRadius="full" px="2.5" py="0.5" fontWeight="semibold">{avgLabel}★</Badge>
              {renderStars(avg)}
              <Text>({count} đánh giá)</Text>
              {(() => {
                const stockShown = selectedVariant ? (selectedVariant.stock ?? 0) : (p?.quantity ?? 0)
                return (
                  <>
                    {stockShown <= 5 && stockShown > 0 && (
                      <Badge colorPalette="orange" borderRadius="full">Sắp hết</Badge>
                    )}
                    {stockShown === 0 && (
                      <Badge colorPalette="red" borderRadius="full">Hết hàng</Badge>
                    )}
                  </>
                )
              })()}
            </HStack>

            {/* Giá */}
            <Box>
              <HStack gap={3} align="baseline" wrap="wrap">
                <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="extrabold" color="brand.700">
                  {priceFmt(Number(effectivePrice || 0))} USD
                </Text>
                {(() => {
                  const showStrike = (hasDiscount || (basePrice && basePrice > effectivePrice))
                  const pct = Math.max(0, Math.round(100 - (Number(effectivePrice) / (Number(basePrice) || 1)) * 100))
                  return showStrike && (
                    <HStack gap={2}>
                      <Text as="s" color="gray.500">{priceFmt(Number(basePrice || 0))} USD</Text>
                      <Badge colorPalette="red">-{pct}%</Badge>
                    </HStack>
                  )
                })()}
              </HStack>
              {p?.shortDescription && (
                <Text mt={2} color="gray.700">{p.shortDescription}</Text>
              )}
            </Box>

            {/* Mô tả */}
            {!!p?.description && (
              <Text color="gray.700" noOfLines={{ base: 5, md: 6 }}>
                {p.description}
              </Text>
            )}

            {/* Select biến thể */}
            {!!groups.length && (
              <VStack align="stretch" gap={4}>
                {groups.map((g) => (
                  <Box key={g.id}>
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="medium">{g.name}</Text>
                      {sel[g.name] && <Text color="gray.600">Đã chọn: <b>{sel[g.name]}</b></Text>}
                    </HStack>
                    <Wrap>
                      {(g.options||[]).map((op) => {
                        const active = sel[g.name] === op.value
                        const available = isOptionAvailable(g.name, op.value)
                        return (
                          <WrapItem key={op.id}>
                            <Tooltip content={!available ? 'Hết hàng ở cấu hình này' : undefined} openDelay={250}>
                              <Button
                                size="sm"
                                variant={active ? 'solid' : 'outline'}
                                onClick={() => setSel(prev => (prev[g.name] === op.value
                                  ? (()=>{ const { [g.name]:_, ...rest } = prev; return rest })()
                                  : { ...prev, [g.name]: op.value }))}
                                isDisabled={!available}
                                borderRadius="full"
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

            {/* SKU & tồn + tiện ích */}
            <HStack color="gray.600" fontSize="sm" wrap="wrap" gap={3}>
              <Text>Mã SKU: <b>{selectedVariant?.skuCode || p?.sku || '—'}</b></Text>
              <Text>•</Text>
              <Text>Tồn: <b>{selectedVariant ? (selectedVariant.stock ?? 0) : (p?.quantity ?? 0)}</b></Text>
              <Text>•</Text>
              <HStack>
                <LuCircleCheck />
                <Text>Đổi trả 7 ngày</Text>
              </HStack>
              <Text>•</Text>
              <HStack>
                <LuTruck />
                <Text>Giao hàng nhanh</Text>
              </HStack>
            </HStack>

            <Separator />

            {/* Số lượng + hành động */}
            <Stack direction={{ base: 'column', sm: 'row' }} gap={4} align="center">
              <NumberInput.Root
                size="sm"
                min={1}
                max={Math.max(selectedVariant ? (selectedVariant.stock ?? 0) : (p?.quantity ?? 0), 1)}
                value={qty}
                onChange={(v)=>setQty(Number(v)||1)}
                w={{ base: 'full', sm: '120px' }}
                aria-label="Số lượng"
              >
                <NumberInput.Control>
                  <NumberInput.IncrementTrigger aria-label="Tăng (↑)" />
                  <NumberInput.DecrementTrigger aria-label="Giảm (↓)" />
                </NumberInput.Control>
                <NumberInput.Input />
              </NumberInput.Root>

              <Button
                onClick={handleAddToCart}
                isDisabled={!canAdd}
                w={{ base: 'full', sm: 'auto' }}
                size="md"
              >
                {(selectedVariant ? (selectedVariant.stock ?? 0) : (p?.quantity ?? 0)) > 0 ? 'Thêm vào giỏ' : 'Hết hàng'}
              </Button>

              <Tooltip content={hasCopied ? 'Đã sao chép link' : 'Sao chép link sản phẩm'} openDelay={200}>
                <IconButton aria-label="Share" variant="outline" onClick={onCopy}>
                  <LuCopy />
                </IconButton>
              </Tooltip>
            </Stack>

            {/* Gợi ý phím tắt nhỏ */}
            <HStack color="gray.500" fontSize="xs">
              <Text>Điều hướng ảnh:</Text>
              <Kbd>←</Kbd><Text>/</Text><Kbd>→</Kbd>
            </HStack>
          </VStack>
        </Box>
      </SimpleGrid>

      {/* Đánh giá */}
      <Box mt={{ base: 8, md: 12 }}>
        <HStack justify="space-between" align="center" mb={3}>
          <Heading size="md">Đánh giá</Heading>
          <HStack gap={3}>
            <Text color="gray.600" fontSize="sm">
              {ratings.length}/{ratingTotal} mục
            </Text>
            <SelectRoot
              value={[String(ratingSize)]}
              onValueChange={(e) => {
                const raw = e.value?.[0];
                const next = parseInt(raw ?? '', 10);
                if (!Number.isNaN(next)) setRatingSize(next);
              }}
            >
              <SelectTrigger w="140px" bg="white">
                <SelectValueText placeholder="Số dòng / trang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem item="5">5/trang</SelectItem>
                <SelectItem item="10">10/trang</SelectItem>
                <SelectItem item="20">20/trang</SelectItem>
              </SelectContent>
            </SelectRoot>


            <SelectRoot
              value={[ratingSortKey]}
              onValueChange={(e) => setRatingSortKey(e.value?.[0] || 'createdAtDesc')}
            >
              <SelectTrigger w="220px" bg="white">
                <SelectValueText placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem item="createdAtDesc">Mới nhất</SelectItem>
                <SelectItem item="createdAtAsc">Cũ nhất</SelectItem>
                <SelectItem item="likeCountDesc">Hữu ích nhất</SelectItem>
                <SelectItem item="starsDesc">Sao cao → thấp</SelectItem>
                <SelectItem item="starsAsc">Sao thấp → cao</SelectItem>
              </SelectContent>
            </SelectRoot>

          </HStack>
        </HStack>
        <Separator mb={4} />

        <VStack align="stretch" gap={3}>
          {ratings.map(r => (
            <Box
              key={r.id}
              bg="white"
              p={4}
              borderRadius="lg"
              boxShadow="sm"
              _hover={{ boxShadow: 'md' }}
            >
              <HStack justify="space-between" align="start">
                <HStack>
                  <Avatar.Root>
                    <Avatar.Fallback name={r.anonymous ? 'Anonymous' : r.username} />
                    <Avatar.Image src={avatarSrcOf(r)} />
                  </Avatar.Root>

                  <VStack align="start" gap={0}>
                    <HStack>
                      <Badge>{r.stars}★</Badge>
                      <Text color="gray.700" fontWeight="medium">
                        {r.anonymous ? 'Người dùng ẩn danh' : (r.username || 'User')}
                      </Text>
                    </HStack>
                    <Text color="gray.500" fontSize="xs">
                      {new Date(r.createdAt).toLocaleString()}
                    </Text>
                  </VStack>
                </HStack>

                <HStack gap={1}>
                  <IconButton
                    aria-label={likedIds.has(r.id) ? 'Bỏ thích' : 'Thích'}
                    size="xs"
                    variant={likedIds.has(r.id) ? 'solid' : 'outline'}
                    colorPalette={likedIds.has(r.id) ? 'blue' : 'gray'}
                    onClick={() => handleToggleLike(r.id)}
                    aria-pressed={likedIds.has(r.id)}
                  >
                    <LuThumbsUp />
                  </IconButton>
                  <Text fontSize="sm" color="gray.700" minW="1.5ch" textAlign="right">
                    {likeCounts[r.id] ?? 0}
                  </Text>
                </HStack>
              </HStack>

              {/* Nội dung bình luận */}
              {!!r.comment && <Text mt={2} color="gray.800">{r.comment}</Text>}

              {/* Ảnh đính kèm */}
              {!!r.imageUrls?.length && (
                <Wrap mt={3} gap={2}>
                  {r.imageUrls.map((img, i) => (
                    <WrapItem key={i}>
                      <Box
                        borderRadius="md"
                        overflow="hidden"
                        border="1px solid"
                        borderColor="gray.200"
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

          {loadingRatings && <Text color="gray.500">Đang tải...</Text>}
          {(!loadingRatings && ratings.length === 0) && <Text color="gray.500">Chưa có đánh giá</Text>}

          {/* Footer: nút xem thêm + sentinel cho infinite scroll */}
          {ratingHasMore && (
            <VStack>
              <Button
                onClick={() => loadRatings(ratingPage + 1, true)}
                isLoading={loadingRatings}
                variant="outline"
                size="sm"
              >
                Xem thêm
              </Button>
              <Box ref={moreRef} h="1px" w="100%" />
            </VStack>
          )}
        </VStack>
      </Box>

      {/* Sticky action bar (mobile) */}
      <Box
        display={{ base: 'block', md: 'none' }}
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        bg="white"
        boxShadow="0 -6px 24px rgba(0,0,0,.06)"
        p={3}
        zIndex={1000}
      >
        <HStack justify="space-between">
          <VStack align="start" gap={0}>
            <Text fontSize="md" fontWeight="bold">{priceFmt(Number(effectivePrice || 0))} USD</Text>
            {(hasDiscount || (basePrice && basePrice > effectivePrice)) && (
              <HStack gap={2} fontSize="xs" color="gray.500">
                <Text as="s">{priceFmt(Number(basePrice || 0))} USD</Text>
                <Badge colorPalette="red">
                  -{Math.max(0, Math.round(100 - (Number(effectivePrice) / (Number(basePrice) || 1)) * 100))}%
                </Badge>
              </HStack>
            )}
          </VStack>
          <Button size="md" onClick={handleAddToCart} isDisabled={!canAdd}>
            {(selectedVariant ? (selectedVariant.stock ?? 0) : (p?.quantity ?? 0)) > 0 ? 'Thêm vào giỏ' : 'Hết hàng'}
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
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content bg="transparent" boxShadow="none" p={0}>
              <Dialog.CloseTrigger asChild>
                <CloseButton bg="white" _hover={{ bg: 'gray.100' }} position="absolute" top="2" right="2" />
              </Dialog.CloseTrigger>
              <Dialog.Body p={0}>
                <AspectRatio ratio={1}>
                  <Image
                    src={thumbs[activeIdx] || mainImg}
                    alt={p?.name}
                    objectFit="contain"
                    bg="black"
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
