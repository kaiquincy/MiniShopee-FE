import {
  Badge,
  Box,
  Button,
  createListCollection,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  Input,
  Portal,
  Select,
  Text,
  VStack
} from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'
import { FiCheckCircle, FiClock, FiDollarSign, FiPackage, FiRefreshCcw, FiSearch } from 'react-icons/fi'
import OrderActions from '../../components/OrderActions'
import { toaster } from '../../components/ui/toaster'
import { useTheme } from '../../context/ThemeContext'
import { ORDER } from '../../seller/utils/orderFlow'
import { adminFetchOrders, adminUpdateOrderStatus } from '../api/admin'

const StatusBadge = ({ s }) => {
  const palette = {
    [ORDER.PENDING]: '#6B7280',
    [ORDER.PAID]: '#2563EB',
    [ORDER.PROCESSING]: '#06B6D4',
    [ORDER.SHIPPING]: '#14B8A6',
    [ORDER.DELIVERED]: '#8B5CF6',
    [ORDER.COMPLETED]: '#10B981',
    [ORDER.CANCELLED]: '#EF4444',
    [ORDER.REFUNDED]: '#F59E0B',
  }[s] || '#6B7280'

  return (
    <Badge
      bg={`${palette}15`}
      color={palette}
      border="1px solid"
      borderColor={`${palette}30`}
      px={3}
      py={1}
      borderRadius="full"
      fontSize="xs"
      fontWeight="bold"
      textTransform="uppercase"
    >
      {s}
    </Badge>
  )
}

const statusOptions = createListCollection({
  items: [
    { label: 'All Status', value: '' },
    ...Object.values(ORDER).map((s) => ({ label: s, value: s }))
  ]
})

export default function AdminOrders() {
  const [list, setList] = useState([])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingFor, setLoadingFor] = useState({})
  const { theme } = useTheme()

  const load = async () => {
    setLoading(true)
    try {
      const d = await adminFetchOrders({
        q: q.trim() || undefined,
        status: status[0] || undefined,
      })
      const arr = Array.isArray(d?.result)
        ? d.result
        : Array.isArray(d)
        ? d
        : d?.content || []
      setList([...arr].reverse())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [status])

  const doAction = async (orderId, target) => {
    try {
      setLoadingFor((p) => ({
        ...p,
        [orderId]: { ...(p[orderId] || {}), [target]: true },
      }))
      await adminUpdateOrderStatus(orderId, target, `Admin changed to ${target}`)
      toaster.create({ type: 'success', description: `Order #${orderId} → ${target}` })
      await load()
    } catch (e) {
      toaster.create({ type: 'error', description: e?.message || 'Failed to update status' })
    } finally {
      setLoadingFor((p) => ({
        ...p,
        [orderId]: { ...(p[orderId] || {}), [target]: false },
      }))
    }
  }

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase()
    if (!keyword) return list
    return list.filter((o) => {
      const hay =
        `${o.orderId}`.toLowerCase() +
        ' ' +
        (o.customerName || '').toLowerCase() +
        ' ' +
        (o.items || []).map((it) => it.productName).join(' ').toLowerCase()
      return hay.includes(keyword)
    })
  }, [list, q])

  const stats = useMemo(() => {
    const total = list.length
    const pending = list.filter(o => o.status === ORDER.PENDING).length
    const completed = list.filter(o => o.status === ORDER.COMPLETED).length
    const totalRevenue = list
      .filter(o => o.status === ORDER.COMPLETED || o.status === ORDER.PAID)
      .reduce((sum, o) => sum + (o.totalAmount || o.grandTotal || 0), 0)

    return { total, pending, completed, totalRevenue }
  }, [list])

  console.log(list)

  return (
    <Box>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading size="2xl" fontWeight="black" mb={2} color={theme.text}>Orders</Heading>
          <Text color={theme.textSecondary}>Manage and track all orders</Text>
        </Box>
      </Flex>

      {/* Stats Cards */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={6} mb={6}>
        <Box bg={theme.cardBg} border="1px solid" borderColor={theme.border} p={5} borderRadius="lg" shadow="sm">
          <HStack gap={5}>
            <Box p={3} bg="#3B82F615" borderRadius="lg">
              <Icon as={FiPackage} boxSize={6} color="#3B82F6" />
            </Box>
            <Box>
              <Text color={theme.text} fontSize="md" fontWeight="medium">Total Orders</Text>
              <Text fontWeight="bold" fontSize="2xl" color="#3B82F6">{stats.total}</Text>
            </Box>
          </HStack>
        </Box>

        <Box bg={theme.cardBg} border="1px solid" borderColor={theme.border} p={5} borderRadius="lg" shadow="sm">
          <HStack gap={5}>
            <Box p={3} bg="#F59E0B15" borderRadius="lg">
              <Icon as={FiClock} boxSize={6} color="#F59E0B" />
            </Box>
            <Box>
              <Text color={theme.text} fontSize="md" fontWeight="medium">Pending</Text>
              <Text fontWeight="bold" fontSize="2xl" color="#F59E0B">{stats.pending}</Text>
            </Box>
          </HStack>
        </Box>

        <Box bg={theme.cardBg} border="1px solid" borderColor={theme.border} p={5} borderRadius="lg" shadow="sm">
          <HStack gap={5}>
            <Box p={3} bg="#10B98115" borderRadius="lg">
              <Icon as={FiCheckCircle} boxSize={6} color="#10B981" />
            </Box>
            <Box>
              <Text color={theme.text} fontSize="md" fontWeight="medium">Completed</Text>
              <Text fontWeight="bold" fontSize="2xl" color="#10B981">{stats.completed}</Text>
            </Box>
          </HStack>
        </Box>

        <Box bg={theme.cardBg} border="1px solid" borderColor={theme.border} p={5} borderRadius="lg" shadow="sm">
          <HStack gap={5}>
            <Box p={3} bg="#10B98115" borderRadius="lg">
              <Icon as={FiDollarSign} boxSize={6} color="#10B981" />
            </Box>
            <Box>
              <Text color={theme.text} fontSize="md" fontWeight="medium">Revenue</Text>
              <Text fontWeight="bold" fontSize="xl" color="#10B981">${stats.totalRevenue.toLocaleString()}</Text>
            </Box>
          </HStack>
        </Box>
      </Grid>

      {/* Search + Filters */}
      <Grid templateColumns={{ base: "1fr", md: "4fr 1fr 1fr" }} gap={3} mb={6} wrap="wrap" align="center" bg={theme.cardBg} border="1px solid" borderColor={theme.border} borderRadius="lg" p={5}>
        <Box position="relative" flex="1">
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
            onChange={(e) => setQ(e.target.value)}
            bg={theme.inputBg}
            border="1px solid"
            borderColor={theme.border}
            color="#1E293B"
            pl={12}
            h="48px"
            borderRadius="lg"
            _placeholder={{ color: '#94A3B8' }}
            _focus={{ borderColor: '#3B82F6', boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)' }}
          />
        </Box>

        <Select.Root
          collection={statusOptions}
          value={status}
          onValueChange={(e) => setStatus(e.value)}
          width={{ base: 'full', md: '220px' }}
          flexShrink={0}
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger
              bg={theme.inputBg}
              border="1px solid"
              borderColor={theme.border}
              color={theme.text}
              h="48px"
              borderRadius="lg"
              _hover={{ bg: theme.hoverBg }}
            >
              <Select.ValueText placeholder="All Status" />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content
                bg={theme.inputBg}
                shadow="lg"
                borderRadius="lg"
                border="1px solid"
                borderColor={theme.border}
              >
                {statusOptions.items.map((option) => (
                  <Select.Item
                    key={option.value || 'all'}
                    item={option}
                    _hover={{ bg: theme.hoverBg }}
                  >
                    {option.label}
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>

        <Button
          onClick={load}
          leftIcon={<FiRefreshCcw />}
          isLoading={loading}
          bg={theme.buttonBg}
          outline="none"
          color="white"
          fontSize="md"
          fontWeight="bold"
          border="1px solid"
          borderColor={theme.border}
          h="48px"
          px={6}
          borderRadius="lg"
          _hover={{ bg: theme.buttonHoverBg }}
        >
          Reload
        </Button>
      </Grid>

      {/* Orders Table */}
      <Box bg={theme.cardBg} border="1px solid" borderColor={theme.border} borderRadius="lg" shadow="sm" overflow="hidden" position="relative">
        {/* Header */}
        <Grid
          templateColumns="140px 1fr 160px 220px"
          py={4}
          px={6}
          fontWeight="bold"
          fontSize="sm"
          color={theme.text}
          textTransform="uppercase"
          letterSpacing="wider"
          borderBottom="1px solid"
          borderColor={theme.borderLight}
        >
          <Box>Order ID</Box>
          <Box>Items & Total</Box>
          <Box>Status</Box>
          <Box>Actions</Box>
        </Grid>

        {/* Body */}
        {loading ? (
          <Box p={12} textAlign="center">
            <Text color="#64748B">Loading orders...</Text>
          </Box>
        ) : filtered.length === 0 ? (
          <Box p={12} textAlign="center">
            <Icon as={FiPackage} boxSize={12} color="#CBD5E1" mb={4} />
            <Text color="#64748B" fontSize="lg" mb={2}>No orders found</Text>
            <Text color="#94A3B8" fontSize="sm">
              {q ? 'Try adjusting your search' : 'Orders will appear here'}
            </Text>
          </Box>
        ) : (
          filtered.map((o, idx) => {
            const perOrderLoading = loadingFor[o.orderId] || {}
            return (
              <Grid
                key={o.orderId}
                templateColumns="140px 1fr 160px 220px"
                py={4}
                px={6}
                alignItems="center"
                borderBottom={idx !== filtered.length - 1 ? `1px solid ${theme.borderLight}` : 'none'}
                transition="all 0.2s"
                _hover={{ bg: theme.hoverBg }}
              >
                {/* Order ID */}
                <VStack align="start" gap={1}>
                  <Text color="#3B82F6" fontWeight="bold" fontSize="lg">#{o.orderId}</Text>
                  <Text color="#64748B" fontSize="sm">
                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}
                  </Text>
                  <Text color="#64748B" fontSize="sm">
                    {o.createdAt ? new Date(o.createdAt).toLocaleTimeString() : ''}
                  </Text>
                </VStack>

                {/* Items & Total */}
                <VStack align="start" spacing={1}>
                  {(o.items || []).slice(0, 2).map((it) => (
                    <Text key={it.id || it.productId} fontSize="sm" noOfLines={1} color={theme.text}>
                      • {it.productName} × {it.quantity}
                    </Text>
                  ))}
                  {(o.items || []).length > 2 && (
                    <Text color={theme.textSecondary} fontSize="xs">
                      +{(o.items || []).length - 2} more items
                    </Text>
                  )}
                  <Text mt={2} fontWeight="bold" fontSize="lg" color="#3B82F6">
                    ${(o.totalAmount || o.grandTotal || 0).toLocaleString()}
                  </Text>
                </VStack>

                {/* Status */}
                <Box>
                  <StatusBadge s={o.status} />
                </Box>

                {/* Actions */}
                <Flex>
                  <OrderActions
                    status={o.status}
                    onAction={(next) => doAction(o.orderId, next)}
                    loadingFor={perOrderLoading}
                    size="md"
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