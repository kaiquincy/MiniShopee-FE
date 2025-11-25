import {
  Badge,
  Box,
  Button,
  Image as ChakraImage,
  HStack,
  Icon,
  Separator,
  Skeleton,
  Stack,
  Tabs,
  Text,
  VStack
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { FiChevronLeft, FiChevronRight, FiShoppingBag } from 'react-icons/fi'
import { Link } from 'react-router-dom'
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
      <Tabs.Root value={value} onValueChange={(e) => { setValue(e.value); setPage(0); }} variant="plain">
        <Tabs.List overflowX="auto" rounded="l3" p="1" borderColor={theme.border}>
          <Tabs.Trigger value="all" color={theme.textSecondary} transition="all ease-in-out 0.2s" _hover={{ bg: theme.cardBg, transform: "scale(1.02)" }} _selected={{ bg: theme.cardBg, color: theme.text, transform: "scale(1.02)" }}>All</Tabs.Trigger>
          <Tabs.Trigger value="processing" color={theme.textSecondary} transition="all ease-in-out 0.2s" _hover={{ bg: theme.cardBg, transform: "scale(1.02)" }} _selected={{ bg: theme.cardBg, color: theme.text, transform: "scale(1.02)" }}>
            Processing <Badge ml="2" colorPalette="yellow">{counts.processing}</Badge>
          </Tabs.Trigger>
          <Tabs.Trigger value="shipping" color={theme.textSecondary} transition="all ease-in-out 0.2s" _hover={{ bg: theme.cardBg, transform: "scale(1.02)" }} _selected={{ bg: theme.cardBg, color: theme.text, transform: "scale(1.02)" }}>
            Shipping <Badge ml="2" colorPalette="blue">{counts.shipping}</Badge>
          </Tabs.Trigger>
          <Tabs.Trigger value="completed" color={theme.textSecondary} transition="all ease-in-out 0.2s" _hover={{ bg: theme.cardBg, transform: "scale(1.02)" }} _selected={{ bg: theme.cardBg, color: theme.text, transform: "scale(1.02)" }}>
            Completed <Badge ml="2" colorPalette="green">{counts.completed}</Badge>
          </Tabs.Trigger>
          <Tabs.Trigger value="cancelled" color={theme.textSecondary} transition="all ease-in-out 0.2s" _hover={{ bg: theme.cardBg, transform: "scale(1.02)" }} _selected={{ bg: theme.cardBg, color: theme.text, transform: "scale(1.02)" }}>
            Cancelled <Badge ml="2" colorPalette="red">{counts.cancelled}</Badge>
          </Tabs.Trigger>
          <Tabs.Indicator rounded="l2" />
        </Tabs.List>
      </Tabs.Root>

      {/* Pagination
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
      )} */}

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
  const status = up(o.status) || 'pending'
  const style = STATUS_STYLE[status] || STATUS_STYLE.pending
  const created = o.createdAt ? new Date(o.createdAt).toLocaleString() : ''
  const items = Array.isArray(o.items) ? o.items : []
  const [ratingOpen, setRatingOpen] = useState(false)
  const preview = items.slice(0, 3)
  const more = Math.max(0, items.length - preview.length)
  const itemsCount = items.reduce((s, it) => s + (it.quantity || 0), 0)

  return (
    <Box
      bg={theme.cardBg}
      border="1px solid"
      borderColor={theme.border}
      borderLeftWidth="4px"
      borderLeftColor={style.border}
      p={4}
      borderRadius="md"
      transition="all .2s ease"
      _hover={{ boxShadow: 'md', transform: 'translateY(-2px)', borderColor: theme.borderLight }}
    >
      {/* Header: ID + status */}
      <HStack justify="space-between" align="start">
        <HStack>
          <Text color={theme.textMuted}>Order </Text>
          <Text fontWeight="bold" color={theme.text}>#{o.orderId}</Text>
        </HStack>
        <Badge colorPalette={style.palette} variant="solid">{status.toUpperCase()}</Badge>
      </HStack>

      {/* Meta chips */}
      <HStack mt="2" spacing="2" wrap="wrap">
        {created && <Badge variant="subtle" colorPalette="gray">{created}</Badge>}
        <Badge variant="subtle" colorPalette="gray">{itemsCount} products</Badge>
        {o.paymentMethod && (
          <Badge variant="subtle" colorPalette="purple">{o.paymentMethod}</Badge>
        )}
      </HStack>

      {/* Thumbnails + product lines */}
      {preview.length > 0 && (
        <VStack align="stretch" mt={3} spacing={3}>
          <HStack spacing="2">
            {preview.map((it, idx) => (
              <Box key={idx} border="1px solid" borderColor={theme.border} rounded="md" overflow="hidden">
                <ChakraImage
                  src={import.meta.env.VITE_API_URL + "/uploads/" + it.imageUrl || it.productImageUrl || '/placeholder.png'}
                  alt={it.productName}
                  boxSize="48px"
                  objectFit="cover"
                />
              </Box>
            ))}
            {more > 0 && (
              <Box
                boxSize="48px"
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

          {preview.map(it => (
            <HStack key={it.id || it.productId} justify="space-between">
              <VStack align="start" flex={1} spacing={1} ml={3}>
                <Text noOfLines={1} flex={1} color={theme.text}>{it.productName}</Text>
                {it.optionValues && (
                  <HStack spacing={2} flexWrap="wrap">
                    {Object.entries(it.optionValues).map(([k, v]) => (
                      <Badge key={k} colorScheme="purple" variant="subtle">{`${k}: ${v}`}</Badge>
                    ))}
                  </HStack>
                )}
              </VStack>
              <Text color={theme.textMuted}>x{it.quantity}</Text>
              <Text fontWeight="semibold" color={theme.text}>
                {(it.price || 0) * (it.quantity || 0)}$
              </Text>
            </HStack>
          ))}
        </VStack>
      )}

      <Separator my="3" borderColor={theme.border} />

      {/* Total + actions */}
      <HStack justify="space-between" align="center">
        <Text color={theme.textMuted}>Total</Text>
        <Text fontWeight="bold" color={theme.text}>{o.totalAmount}$</Text>
      </HStack>

      <HStack justify="flex-end" mt={3} spacing={2}>
        {status === 'shipping' && (
          <Button as={Link} to={`/orders/${o.id}/track`} size="sm" variant="ghost" color={theme.text} _hover={{ bg: theme.hoverBg }}>
            Track
          </Button>
        )}
        {(status === 'completed' || status === 'cancelled') && (
          <Button as={Link} to={`/orders/${o.id}`} size="sm" variant="ghost" color={theme.text} _hover={{ bg: theme.hoverBg }}>
            Buy Again
          </Button>
        )}
        {status === 'completed' ? (
          <RatingDialog
            order={o}
            items={items} 
            onSubmit={async ({ orderId, orderItemId, productId, variantId, stars, comment, files }) => {
              const fd = new FormData()
              const ratingData = {
                orderItemId,
                stars,
                comment: comment || ''
              }
              fd.append('payload', JSON.stringify(ratingData))
              files.forEach(f => fd.append('images', f))
              await addRating(fd)
            }}
          >
            <Button size="sm" variant="outline" borderColor={theme.border} color={theme.text} _hover={{ bg: theme.hoverBg }}>Rating</Button>
          </RatingDialog>
        ) : (
          <Button as={Link} to={`/orders/${o.id}`} size="sm" variant="outline" borderColor={theme.border} color={theme.text} _hover={{ bg: theme.hoverBg }}>
            Contact Seller
          </Button>
        )}
      </HStack>
    </Box>
  )
}

function OrderSkeletonList({ theme }) {
  return (
    <VStack align="stretch" spacing={4}>
      {[1, 2, 3].map(i => (
        <Box
          key={i}
          bg={theme.cardBg}
          border="1px solid"
          borderColor={theme.border}
          p={4}
          borderRadius="md"
        >
          <Stack>
            <HStack justify="space-between">
              <Skeleton height="16px" width="140px" />
              <Skeleton height="20px" width="80px" />
            </HStack>
            <Skeleton height="14px" width="200px" />
            <Skeleton height="48px" />
            <Skeleton height="18px" width="120px" />
          </Stack>
        </Box>
      ))}
    </VStack>
  )
}