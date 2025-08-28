import { useEffect, useMemo, useState } from 'react'
import { listOrders } from '../api/orders'
import {
  Box, Heading, VStack, HStack, Text, Badge,
  Tabs, Button, Stack, Skeleton, Separator,
  Image as ChakraImage
} from '@chakra-ui/react'
import { Link } from 'react-router-dom'

const STATUS_STYLE = {
  processing: { palette: 'yellow', border: 'yellow.400' },
  shipping:   { palette: 'blue',   border: 'blue.400' },
  completed:  { palette: 'green',  border: 'green.400' },
  cancelled:  { palette: 'red',    border: 'red.400' },
  pending:    { palette: 'gray',   border: 'gray.400' },
}
const up = (s) => (s || '').toLowerCase()
const fmtVND = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0)

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [value, setValue] = useState('all')

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const data = await listOrders()
        setOrders(Array.isArray(data) ? data : [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const counts = useMemo(() => ({
    processing: orders.filter(o => up(o.status) === 'processing').length,
    shipping:   orders.filter(o => up(o.status) === 'shipping').length,
    completed:  orders.filter(o => up(o.status) === 'completed').length,
    cancelled:  orders.filter(o => up(o.status) === 'cancelled').length,
  }), [orders])

  const filtered = useMemo(() => {
    let base = value === 'all' ? orders : orders.filter(o => up(o.status) === value)
    return [...base].reverse()   // đảo ngược mảng
  }, [orders, value])

  return (
    <Box>
      <Heading size="md" mb={3}>My Orders</Heading>

      {/* Thanh bar lọc (Chakra v3 Tabs API) */}
      <Tabs.Root value={value} onValueChange={(e) => setValue(e.value)} variant="plain">
        <Tabs.List overflowX="auto" bg="gray.50" rounded="l3" p="1">
          <Tabs.Trigger value="all">All</Tabs.Trigger>
          <Tabs.Trigger value="processing">
            Processing <Badge ml="2" colorPalette="yellow">{counts.processing}</Badge>
          </Tabs.Trigger>
          <Tabs.Trigger value="shipping">
            Shipping <Badge ml="2" colorPalette="blue">{counts.shipping}</Badge>
          </Tabs.Trigger>
          <Tabs.Trigger value="completed">
            Completed <Badge ml="2" colorPalette="green">{counts.completed}</Badge>
          </Tabs.Trigger>
          <Tabs.Trigger value="cancelled">
            Cancelled <Badge ml="2" colorPalette="red">{counts.cancelled}</Badge>
          </Tabs.Trigger>
          <Tabs.Indicator rounded="l2" />
        </Tabs.List>
      </Tabs.Root>

      {/* Danh sách đơn hàng */}
      <VStack align="stretch" spacing={4} mt={4}>
        {loading && <OrderSkeletonList />}

        {!loading && filtered.length === 0 && (
          <Box
            bg="gray.50"
            border="1px solid"
            borderColor="gray.200"
            p={6}
            borderRadius="md"
            className="glass"
            textAlign="center"
          >
            <Text color="gray.600">
              Không có đơn hàng ở mục “{value[0].toUpperCase() + value.slice(1)}”.
            </Text>
          </Box>
        )}

        {!loading && filtered.map(o => (
          <OrderCard key={o.id} order={o} />
        ))}
      </VStack>
    </Box>
  )
}

function OrderCard({ order: o }) {
  const status = up(o.status) || 'pending'
  const style = STATUS_STYLE[status] || STATUS_STYLE.pending
  const created = o.createdAt ? new Date(o.createdAt).toLocaleString() : ''
  const items = Array.isArray(o.items) ? o.items : []
  const preview = items.slice(0, 3)
  const more = Math.max(0, items.length - preview.length)
  const itemsCount = items.reduce((s, it) => s + (it.quantity || 0), 0)

  return (
    <Box
      bg="gray.50"
      border="1px solid"
      borderColor="gray.200"
      borderLeftWidth="4px"
      borderLeftColor={style.border}
      p={4}
      borderRadius="md"
      className="glass"
      transition="all .2s ease"
      _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
    >
      {/* Header: ID + status */}
      <HStack justify="space-between" align="start">
        <HStack>
          <Text color="gray.600">Order </Text>
          <Text fontWeight="bold">#{o.orderId}</Text>
        </HStack>
        <Badge colorPalette={style.palette} variant="solid">{status.toUpperCase()}</Badge>
      </HStack>

      {/* Meta chips */}
      <HStack mt="2" spacing="2" wrap="wrap">
        {created && <Badge variant="subtle" colorPalette="gray">{created}</Badge>}
        <Badge variant="subtle" colorPalette="gray">{itemsCount} sản phẩm</Badge>
        {o.paymentMethod && (
          <Badge variant="subtle" colorPalette="purple">{o.paymentMethod}</Badge>
        )}
      </HStack>

      {/* Thumbnails + dòng tiền từng item */}
      {preview.length > 0 && (
        <VStack align="stretch" mt={3} spacing={3}>
          <HStack spacing="2">
            {preview.map((it, idx) => (
              <Box key={idx} border="1px solid" borderColor="gray.200" rounded="md" overflow="hidden">
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
                borderColor="gray.300"
                rounded="md"
                color="gray.600"
                fontSize="sm"
              >
                +{more}
              </Box>
            )}
          </HStack>

          {/* Optional: liệt kê 1–3 dòng item */}
          {preview.map(it => (
            <HStack key={it.id || it.productId} justify="space-between">
              <Text noOfLines={1} flex={1}>{it.productName}</Text>
              <Text color="gray.600">x{it.quantity}</Text>
              <Text fontWeight="semibold">
                {(it.price || 0) * (it.quantity || 0)}$
              </Text>
            </HStack>
          ))}
        </VStack>
      )}

      <Separator my="3" />

      {/* Tổng + actions */}
      <HStack justify="space-between" align="center">
        <Text color="gray.600">Total</Text>
        <Text fontWeight="bold">{o.totalAmount}$</Text>
      </HStack>

      <HStack justify="flex-end" mt={3} spacing="2">
        {status === 'shipping' && (
          <Button as={Link} to={`/orders/${o.id}/track`} size="sm" variant="ghost">
            Theo dõi
          </Button>
        )}
        {(status === 'completed' || status === 'cancelled') && (
          <Button as={Link} to={`/orders/${o.id}`} size="sm" variant="ghost">
            Mua lại
          </Button>
        )}
        <Button as={Link} to={`/orders/${o.id}`} size="sm" variant="outline">
          Contact Seller
        </Button>
      </HStack>
    </Box>
  )
}

function OrderSkeletonList() {
  return (
    <VStack align="stretch" spacing={4}>
      {[1, 2, 3].map(i => (
        <Box
          key={i}
          bg="gray.50"
          border="1px solid"
          borderColor="gray.200"
          p={4}
          borderRadius="md"
          className="glass"
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
