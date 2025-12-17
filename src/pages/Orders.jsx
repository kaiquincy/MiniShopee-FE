import {
  Badge,
  Box,
  Button,
  Image as ChakraImage,
  HStack,
  Icon,
  Separator,
  Skeleton,
  Tabs,
  Text,
  VStack
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { FiChevronLeft, FiChevronRight, FiShoppingBag } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import { getOrderCounts, listOrders } from '../api/orders'
import { addRating } from '../api/ratings'
import RatingDialog from '../components/RatingDialog'
import { useTheme } from '../context/ThemeContext'

const STATUS_STYLE = {
  processing: { palette: 'yellow', border: 'yellow.400' },
  shipping:   { palette: 'blue',   border: 'blue.400' },
  completed:  { palette: 'green',  border: 'green.400' },
  cancelled:  { palette: 'red',    border: 'red.400' },
  pending:    { palette: 'gray',   border: 'gray.400' },
}
const up = (s) => (s || '').toLowerCase()

export default function Orders() {
  const { theme } = useTheme()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [value, setValue] = useState('all')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const pageSize = 10
  const navigate = useNavigate()

  const [allOrdersCounts, setAllOrdersCounts] = useState({
    processing: 0,
    shipping: 0,
    completed: 0,
    cancelled: 0,
    pending: 0,
    total: 0,
  })

  // Load order counts (for badges)
  useEffect(() => {
    (async () => {
      try {
        const counts = await getOrderCounts()
        setAllOrdersCounts(counts)
      } catch (err) {
        console.error('Failed to load order counts:', err)
      }
    })()
  }, [])

  // Load paginated orders
  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const data = await listOrders({ 
          page, 
          size: pageSize, 
          status: value !== 'all' ? value : undefined 
        })
        
        setOrders(Array.isArray(data.content) ? data.content : [])
        setTotalPages(data.totalPages || 0)
      } finally {
        setLoading(false)
      }
    })()
  }, [page, value])

  const counts = allOrdersCounts

  const handlePageChange = (newPage) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Box px={{ base: 4, md: 40 }} py={8} bg={theme.pageBg} minH="100vh">
      <Box mb={8}>
        <HStack spacing={3} mb={3}>
          <Icon as={FiShoppingBag} boxSize={7} color={theme.textSecondary} />
          <Text fontSize="4xl" fontWeight="black" color={theme.text}>
            My Orders
          </Text>
        </HStack>
        <Text color={theme.textMuted} fontSize="lg">
          Manage and review your orders
        </Text>
      </Box>

      {/* Filter tabs */}
      <Tabs.Root
        value={value}
        onValueChange={(e) => {
          setValue(e.value)
          setPage(0)
        }}
        variant="plain"
      >
        <Tabs.List
          position="relative"
          overflowX="auto"
          overflowY="hidden"
          p="1"
          gap="1"
          sx={{
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {[
            { v: "all", label: "All" },
            { v: "processing", label: "Processing", count: counts.processing },
            { v: "shipping", label: "Shipping", count: counts.shipping },
            { v: "completed", label: "Completed", count: counts.completed },
            { v: "cancelled", label: "Cancelled", count: counts.cancelled },
          ].map((t) => (
            <Tabs.Trigger
              key={t.v}
              value={t.v}
              px="3"
              py="2"
              rounded="lg"
              fontWeight="semibold"
              color={theme.textSecondary}
              transition="all .15s ease"
              _hover={{ color: theme.text, bg: theme.hoverBg }}
              _selected={{ color: theme.text }}
              display="inline-flex"
              alignItems="center"
              gap="2"
              whiteSpace="nowrap"
              fontSize="md"
            >
              <Text>{t.label}</Text>

              {typeof t.count === "number" && (
                <Badge
                  variant="subtle"
                  rounded="full"
                  px="2"
                  py="1"
                  minW="22px"
                  textAlign="center"
                  color={theme.text}
                  border="1px solid"
                  borderColor={theme.border}
                  bg={theme.inputBg}
                >
                  {t.count}
                </Badge>
              )}
            </Tabs.Trigger>
          ))}

          <Tabs.Indicator
            rounded="lg"
            bg={theme.text}
            boxShadow="xs"
            border="1px solid"
            borderColor={theme.border}
            transition="all .18s ease"
            h="6px"
            position="absolute"
            bottom={0}
          />
        </Tabs.List>
      </Tabs.Root>


      {/* Orders list */}
      <VStack align="stretch" spacing={4} mt={4}>
        {loading && <OrderSkeletonList theme={theme} />}

        {!loading && orders.length === 0 && (
          <Box
            bg={theme.cardBg}
            border="1px solid"
            borderColor={theme.border}
            p={6}
            borderRadius="md"
            textAlign="center"
          >
            <Text color={theme.textMuted}>
              No orders in "{value[0].toUpperCase() + value.slice(1)}".
            </Text>
          </Box>
        )}

        {!loading && orders.map(o => (
          <OrderCard key={o.id} order={o} theme={theme} />
        ))}
      </VStack>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <HStack justify="center" mt={6} spacing={2}>
          <Button
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            isDisabled={page === 0}
            leftIcon={<FiChevronLeft />}
            bg={theme.cardBg}
            color={theme.textSecondary}
            borderColor={theme.border}
            _hover={{ bg: theme.hoverBg }}
          >
            Previous
          </Button>

          <HStack spacing={2}>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i
              } else if (page < 3) {
                pageNum = i
              } else if (page > totalPages - 4) {
                pageNum = totalPages - 5 + i
              } else {
                pageNum = page - 2 + i
              }

              return (
                <Button
                  key={pageNum}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  bg={page === pageNum ? theme.primary : theme.cardBg}
                  color={page === pageNum ? "white" : theme.textSecondary}
                  borderColor={page === pageNum ? theme.primary : theme.border}
                  _hover={{ bg: page === pageNum ? theme.primaryHover : theme.hoverBg }}
                >
                  {pageNum + 1}
                </Button>
              )
            })}
          </HStack>

          <Button
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            isDisabled={page >= totalPages - 1}
            rightIcon={<FiChevronRight />}
            bg={theme.cardBg}
            color={theme.textSecondary}
            borderColor={theme.border}
            _hover={{ bg: theme.hoverBg }}
          >
            Next
          </Button>
        </HStack>
      )}
    </Box>
  )
}

function OrderCard({ order: o, theme }) {
  const status = up(o.status) || "pending"
  const style = STATUS_STYLE[status] || STATUS_STYLE.pending
  const created = o.createdAt ? new Date(o.createdAt).toLocaleString() : ""
  const items = Array.isArray(o.items) ? o.items : []
  const previewThumbs = items.slice(0, 4)
  const more = Math.max(0, items.length - previewThumbs.length)
  const itemsCount = items.reduce((s, it) => s + (it.quantity || 0), 0)

  const allItemsRated = items.length > 0 && items.every(item => item.hasRating === true)
  const unratedItems = items.filter(item => !item.hasRating)

  const imgSrc = (it) =>
    (it.imageUrl
      ? `${import.meta.env.VITE_API_URL}/uploads/${it.imageUrl}`
      : it.productImageUrl) || "/placeholder.png"

  return (
    <Box
      bg={theme.cardBg}
      border="1px solid"
      borderColor={theme.border}
      borderLeftWidth="4px"
      borderLeftColor={style.border}
      p={4}
      borderRadius="md"
    >
      {/* Header */}
      <HStack justify="space-between" align="start">
        <VStack align="start" spacing={1}>
          <HStack spacing={2}>
            <Text color={theme.textMuted}>Order</Text>
            <Text fontWeight="bold" color={theme.text}>
              #{o.orderId}
            </Text>
          </HStack>

          {/* Meta gọn 1 dòng */}
          <Text fontSize="sm" color={theme.textMuted}>
            {created ? created : "—"} • {itemsCount} products
            {o.paymentMethod ? ` • ${o.paymentMethod}` : ""}
          </Text>
        </VStack>

        <Badge colorPalette={style.palette} variant="solid">
          {status.toUpperCase()}
        </Badge>
      </HStack>

      <Separator my="3" borderColor={theme.border} />

      {/* Body */}
      {items.length > 0 ? (
        <HStack align="start" spacing={4}>
          {/* Thumbs cột trái */}
          <VStack spacing={2} align="start" minW="64px">
            <HStack spacing={2} wrap="wrap">
              {previewThumbs.map((it, idx) => (
                <Box
                  key={it.id || it.productId || idx}
                  border="1px solid"
                  borderColor={theme.border}
                  rounded="md"
                  overflow="hidden"
                  boxSize="52px"
                >
                  <ChakraImage
                    src={imgSrc(it)}
                    alt={it.productName}
                    boxSize="52px"
                    objectFit="cover"
                  />
                </Box>
              ))}

              {more > 0 && (
                <Box
                  boxSize="52px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  border="1px dashed"
                  borderColor={theme.border}
                  rounded="md"
                  color={theme.textMuted}
                  fontSize="sm"
                >
                  +{more}
                </Box>
              )}
            </HStack>
          </VStack>

          {/* Items cột phải */}
          <VStack align="stretch" spacing={3} flex={1}>
            {items.slice(0, 3).map((it) => (
              <HStack key={it.id || it.productId} align="start" spacing={3}>
                {/* Name + options */}
                <VStack
                  align="start"
                  spacing={1}
                  flex={1}
                  onClick={() => navigate(`/product/${it.id}`)}
                  _hover={{ cursor: "pointer" }}
                >
                  <Text noOfLines={1} color={theme.text} fontWeight="semibold">
                    {it.productName}
                  </Text>

                  {it.optionValues && (
                    <HStack spacing={2} flexWrap="wrap">
                      {Object.entries(it.optionValues).map(([k, v]) => (
                        <Badge key={k} colorScheme="purple" variant="subtle">
                          {k}: {v}
                        </Badge>
                      ))}
                    </HStack>
                  )}
                </VStack>

                {/* Qty */}
                <Text color={theme.textMuted} minW="44px" textAlign="right">
                  x{it.quantity}
                </Text>

                {/* Line total */}
                <Text fontWeight="semibold" color={theme.text} minW="72px" textAlign="right">
                  {((it.price || 0) * (it.quantity || 0)).toFixed(2)}$
                </Text>
              </HStack>
            ))}

            {/* Nếu nhiều item hơn: gợi ý xem chi tiết */}
            {items.length > 3 && (
              <Text fontSize="sm" color={theme.textMuted}>
                And {items.length - 3} more items…
              </Text>
            )}
          </VStack>
        </HStack>
      ) : (
        <Text color={theme.textMuted}>No items</Text>
      )}

      <Separator my="3" borderColor={theme.border} />

      {/* Footer: Total + actions */}
      <HStack justify="space-between" align="center">
        <VStack align="start" spacing={0}>
          <Text fontSize="sm" color={theme.textMuted}>Total</Text>
          <Text fontWeight="bold" fontSize="lg" color={theme.text}>
            {Number(o.totalAmount || 0).toFixed(2)}$
          </Text>
        </VStack>

        <HStack spacing={2}>
          {status === "shipping" && (
            <Button
              as={Link}
              to={`/orders/${o.id}/track`}
              size="sm"
              bg={theme.inputBg}
              _hover={{ bg: theme.hoverBg }}
              borderColor={theme.border}
              color={theme.text}
            >
              Track
            </Button>
          )}

          {(status === "completed" || status === "cancelled") && (
            <Button
              as={Link}
              to={`/orders/${o.id}`}
              size="sm"
              bg={theme.inputBg}
              _hover={{ bg: theme.hoverBg }}
              borderColor={theme.border}
              color={theme.text}
            >
              Buy Again
            </Button>
          )}

          {status === "completed" && !allItemsRated && unratedItems.length > 0 ? (
            <RatingDialog
              order={o}
              items={unratedItems}
              theme={theme}
              onSubmit={async ({ orderItemId, stars, comment, files }) => {
                try {
                  const fd = new FormData()
                  fd.append(
                    "payload",
                    JSON.stringify({ orderItemId, stars, comment: comment || "" })
                  )
                  files.forEach((f) => fd.append("images", f))
                  await addRating(fd)
                  window.location.reload()
                } catch (error) {
                  console.error("Rating error:", error)
                }
              }}
            >
              <Button
                size="sm"
                variant="solid"
                colorPalette="purple"
              >
                Rating
              </Button>
            </RatingDialog>
          ) : status === "completed" && allItemsRated ? (
            <Button size="sm" bg={theme.secondaryBg} borderColor={theme.border} color={theme.textMuted} cursor="disabled" isDisabled>
              Rated
            </Button>
          ) : status !== "completed" ? (
            <Button
              as={Link}
              to={`/orders/${o.id}`}
              size="sm"
              bg={theme.inputBg}
              _hover={{ bg: theme.hoverBg }}s
              borderColor={theme.border}
              color={theme.text}
            >
              Contact Seller
            </Button>
          ) : null}
        </HStack>
      </HStack>
    </Box>
  )
}


function OrderSkeletonList({ theme }) {
  return (
    <VStack align="stretch" spacing={4}>
      {[1, 2, 3].map((i) => (
        <Box
          key={i}
          bg={theme.cardBg}
          border="1px solid"
          borderColor={theme.border}
          borderLeftWidth="4px"
          borderLeftColor={theme.borderLight || theme.border}
          p={4}
          borderRadius="md"
          transition="all .18s ease"
          _hover={{ transform: "translateY(-2px)", boxShadow: "sm" }}
        >
          {/* Header: order id + status */}
          <HStack justify="space-between" align="start">
            <VStack align="start" spacing={2}>
              <Skeleton height="14px" width="160px" />
              <Skeleton height="12px" width="220px" />
            </VStack>
            <Skeleton height="22px" width="86px" borderRadius="999px" />
          </HStack>

          <Separator my="3" borderColor={theme.border} />

          {/* Body: thumbs + lines */}
          <HStack align="start" spacing={4}>
            {/* Thumbnails column */}
            <HStack spacing={2} wrap="wrap" maxW="120px">
              {[1, 2, 3, 4].map((t) => (
                <Skeleton
                  key={t}
                  height="52px"
                  width="52px"
                  borderRadius="md"
                />
              ))}
            </HStack>

            {/* Items column */}
            <VStack align="stretch" spacing={3} flex={1}>
              {[1, 2, 3].map((row) => (
                <HStack key={row} spacing={3} align="center">
                  <VStack align="start" spacing={2} flex={1}>
                    <Skeleton height="14px" width="70%" />
                    <HStack spacing={2}>
                      <Skeleton height="12px" width="64px" borderRadius="999px" />
                      <Skeleton height="12px" width="72px" borderRadius="999px" />
                    </HStack>
                  </VStack>

                  <Skeleton height="14px" width="44px" />
                  <Skeleton height="14px" width="72px" />
                </HStack>
              ))}

              <Skeleton height="12px" width="160px" />
            </VStack>
          </HStack>

          <Separator my="3" borderColor={theme.border} />

          {/* Footer: total + actions */}
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Skeleton height="12px" width="44px" />
              <Skeleton height="18px" width="110px" />
            </VStack>

            <HStack spacing={2}>
              <Skeleton height="32px" width="92px" borderRadius="md" />
              <Skeleton height="32px" width="92px" borderRadius="md" />
            </HStack>
          </HStack>
        </Box>
      ))}
    </VStack>
  )
}
