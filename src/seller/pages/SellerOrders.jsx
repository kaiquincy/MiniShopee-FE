import { Badge, Box, Flex, Grid, Heading, HStack, Icon, Text, VStack } from '@chakra-ui/react'
import { Button } from '@chakra-ui/react/button'
import { Input } from '@chakra-ui/react/input'
import { useEffect, useMemo, useState } from 'react'
import { FiClock, FiDollarSign, FiPackage, FiRefreshCw, FiSearch } from 'react-icons/fi'

import OrderActions from '../../components/OrderActions'
import { toaster } from '../../components/ui/toaster'
import { useTheme } from '../../context/ThemeContext'
import { fetchOrders, updateOrderStatus } from '../api/seller'
import { ALLOWED, ORDER } from '../utils/orderFlow'

const StatusBadge = ({ s }) => {
  const config = {
    [ORDER.CANCELLED]: { color: '#EF4444', label: 'Cancelled' },
    [ORDER.PAID]: { color: '#2563EB', label: 'Paid' },
    [ORDER.SHIPPING]: { color: '#14B8A6', label: 'Shipping' },
    [ORDER.DELIVERED]: { color: '#8B5CF6', label: 'Delivered' },
    [ORDER.COMPLETED]: { color: '#10B981', label: 'Completed' },
    [ORDER.REFUNDED]: { color: '#F59E0B', label: 'Refunded' },
    [ORDER.PENDING]: { color: '#9CA3AF', label: 'Pending' },
    [ORDER.PROCESSING]: { color: '#06B6D4', label: 'Processing' },
  }

  const { color, label } = config[s] || { color: '#9CA3AF', label: s }

  return (
    <Badge
      bg={`${color}20`}
      color={color}
      border="1px solid"
      borderColor={`${color}40`}
      px={3}
      py={1}
      borderRadius="full"
      fontSize="xs"
      fontWeight="bold"
      textTransform="uppercase"
    >
      {label}
    </Badge>
  )
}

export default function SellerOrders() {
  const [list, setList] = useState([])
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingForOrder, setLoadingForOrder] = useState({})
  const { theme } = useTheme()

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchOrders({ status: status || undefined, q: q || undefined })
      const arr = Array.isArray(data) ? data : (data?.content || [])
      setList([...arr])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [status])

  const doAction = async (orderId, target) => {
    try {
      setLoadingForOrder(prev => ({
        ...prev,
        [orderId]: { ...(prev[orderId] || {}), [target]: true }
      }))
      await updateOrderStatus(orderId, target, `Seller changed to ${target}`)
      toaster.create({ type: 'success', description: `Order #${orderId} → ${target}` })
      await load()
    } catch (e) {
      toaster.create({
        type: 'error',
        description: `Failed to update status: ${e?.response?.data?.message || e.message}`
      })
    } finally {
      setLoadingForOrder(prev => ({
        ...prev,
        [orderId]: { ...(prev[orderId] || {}), [target]: false }
      }))
    }
  }

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase()
    if (!keyword) return list
    return list.filter(o => {
      const hay =
        `${o.orderId}`.toLowerCase() + ' ' +
        (o.customerName || '').toLowerCase() + ' ' +
        (o.items || []).map(it => it.productName).join(' ').toLowerCase()
      return hay.includes(keyword)
    })
  }, [list, q])

  // Calculate stats
  const stats = useMemo(() => {
    const total = list.length
    const pending = list.filter(o => o.status === ORDER.PENDING).length
    const completed = list.filter(o => o.status === ORDER.COMPLETED).length
    const totalRevenue = list
      .filter(o => o.status === ORDER.COMPLETED || o.status === ORDER.PAID)
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0)

    return { total, pending, completed, totalRevenue }
  }, [list])

  return (
    <Box color="white" p={8}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading size="2xl" fontWeight="black" mb={2} color={theme.text}>Orders</Heading>
          <Text color={theme.textSecondary}>Manage and track customer orders</Text>
        </Box>
      </Flex>

      {/* Stats Cards */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={4} mb={6}>
        <Box bg={theme.cardBg} border="1px solid" borderColor={theme.border} p={4} borderRadius="lg">
          <HStack gap={4}>
            <Box p={3} bg="#2563EB20" borderRadius="lg">
              <Icon as={FiPackage} boxSize={5} color="#2563EB" />
            </Box>
            <Box>
              <Text color={theme.text} fontSize="md">Total Orders</Text>
              <Text color="#2563EB" fontWeight="bold" fontSize="2xl">{stats.total}</Text>
            </Box>
          </HStack>
        </Box>

        <Box bg={theme.cardBg} border="1px solid" borderColor={theme.border} p={4} borderRadius="lg">
          <HStack gap={4}>
            <Box p={3} bg="#F59E0B20" borderRadius="lg">
              <Icon as={FiClock} boxSize={5} color="#F59E0B" />
            </Box>
            <Box>
              <Text color={theme.text} fontSize="md">Pending</Text>
              <Text color="#F59E0B" fontWeight="bold" fontSize="2xl">{stats.pending}</Text>
            </Box>
          </HStack>
        </Box>

        <Box bg={theme.cardBg} border="1px solid" borderColor={theme.border} p={4} borderRadius="lg">
          <HStack gap={4}>
            <Box p={3} bg="#10B98120" borderRadius="lg">
              <Icon as={FiPackage} boxSize={5} color="#10B981" />
            </Box>
            <Box>
              <Text color={theme.text} fontSize="md">Completed</Text>
              <Text color="#10B981" fontWeight="bold" fontSize="2xl">{stats.completed}</Text>
            </Box>
          </HStack>
        </Box>

        <Box bg={theme.cardBg} border="1px solid" borderColor={theme.border} p={4} borderRadius="lg">
          <HStack gap={4}>
            <Box p={3} bg="#10B98120" borderRadius="lg">
              <Icon as={FiDollarSign} boxSize={5} color="#10B981" />
            </Box>
            <Box>
              <Text color={theme.text} fontSize="md">Revenue</Text>
              <Text color="#10B981" fontWeight="bold" fontSize="xl">${stats.totalRevenue.toLocaleString()}</Text>
            </Box>
          </HStack>
        </Box>
      </Grid>

      {/* Search & Filter */}
      <Flex gap={3} mb={6} bg={theme.cardBg} border="1px solid" borderColor={theme.border} p={5} borderRadius="lg">
        <Box position="relative" flex={1} maxW="500px">
          <Icon
            as={FiSearch}
            position="absolute"
            left={4}
            top="50%"
            transform="translateY(-50%)"
            color={theme.text}
            boxSize={5}
            zIndex={1}
          />
          <Input
            placeholder="Search by order ID, customer name, or product..."
            value={q}
            onChange={e => setQ(e.target.value)}
            bg={theme.inputBg}
            border="1px solid"
            borderColor={theme.border}
            color={theme.text}
            pl={12}
            h="48px"
            _placeholder={{ color: theme.textSecondary }}
            _focus={{ borderColor: "brand.500" }}
          />
        </Box>
        <Button
          onClick={load}
          isLoading={loading}
          bg={theme.buttonBg}
          color="white"
          h="48px"
          px={6}
          border="1px solid"
          borderColor={theme.border}
          leftIcon={<FiRefreshCw />}
          _hover={{ borderColor: "brand.500", bg: "gray.800" }}
        >
          Reload
        </Button>
      </Flex>

      {/* Orders Table */}
      <Box bg={theme.cardBg} border="1px solid" borderColor={theme.border} borderRadius="lg" overflow="hidden">
        {/* Table Header */}
        <Grid
          templateColumns="140px 1fr 160px 200px"
          py={4}
          px={6}
          borderBottom="1px solid"
          borderColor={theme.borderLight}
          fontWeight="bold"
          fontSize="sm"
          color={theme.text}
          textTransform="uppercase"
          letterSpacing="wider"
        >
          <Box>Order ID</Box>
          <Box>Items & Total</Box>
          <Box>Status</Box>
          <Box>Actions</Box>
        </Grid>

        {/* Table Body */}
        {loading ? (
          <Box p={12} textAlign="center">
            <Text color={theme.text}>Loading orders...</Text>
          </Box>
        ) : filtered.length === 0 ? (
          <Box p={12} textAlign="center">
            <Icon as={FiPackage} boxSize={12} color={theme.text} mb={4} />
            <Text color={theme.text} fontSize="lg" mb={2}>No orders found</Text>
            <Text color={theme.textSecondary} fontSize="sm">
              {q ? 'Try adjusting your search' : 'Orders will appear here when customers place them'}
            </Text>
          </Box>
        ) : (
          filtered.map((o, idx) => {
            const allows = ALLOWED[o.status] || []
            const perActionLoading = loadingForOrder[o.orderId] || {}
            
            return (
              <Grid
                key={o.orderId}
                templateColumns="140px 1fr 160px 200px"
                py={4}
                px={6}
                borderBottom={idx !== filtered.length - 1 ? "1px solid" : "none"}
                borderColor={theme.borderLight}
                alignItems="center"
                transition="all 0.2s"
                _hover={{ bg: theme.hoverBg }}
              >
                {/* Order ID & Date */}
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold" color="brand.400">#{o.orderId}</Text>
                  <Text fontSize="sm" color={theme.textSecondary}>
                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ''}
                  </Text>
                  <Text fontSize="sm" color={theme.textSecondary}>
                    {o.createdAt ? new Date(o.createdAt).toLocaleTimeString() : ''}
                  </Text>
                </VStack>

                {/* Items & Total */}
                <VStack align="start" spacing={1}>
                  {(o.items || []).slice(0, 2).map(it => (
                    <Text key={it.id || it.productId} fontSize="md" noOfLines={1} color={theme.text}>
                      • {it.productName} × {it.quantity}
                    </Text>
                  ))}
                  {(o.items || []).length > 2 && (
                    <Text fontSize="xs" color={theme.textMuted}>
                      +{(o.items || []).length - 2} more items
                    </Text>
                  )}
                  <Text mt={2} fontWeight="bold" fontSize="lg" color="brand.400">
                    ${(o.totalAmount || 0).toLocaleString()}
                  </Text>
                </VStack>

                {/* Status Badge */}
                <Box>
                  <StatusBadge s={o.status} />
                </Box>

                {/* Actions */}
                <Flex>
                  <OrderActions
                    status={o.status}
                    onAction={(next) => doAction(o.orderId, next)}
                    loadingFor={perActionLoading}
                    size="lg"
                    variant="ghost"
                    theme={theme}
                  />
                </Flex>
              </Grid>
            )
          })
        )}
      </Box>
    </Box>
  )
}