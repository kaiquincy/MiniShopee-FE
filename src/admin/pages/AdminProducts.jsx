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
  IconButton,
  Input,
  Portal,
  Select,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'
import {
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiPackage,
  FiPower,
  FiRefreshCcw,
  FiRotateCcw,
  FiSearch,
  FiSlash,
  FiX,
} from 'react-icons/fi'
import { toaster } from '../../components/ui/toaster'
import { useTheme } from '../../context/ThemeContext'
import { adminFetchProducts, adminUpdateProductStatus } from '../api/admin'

const STATUS_META = {
  ACTIVE: { label: 'Active', color: '#10B981' },
  INACTIVE: { label: 'Inactive', color: '#64748B' },
  DELETED: { label: 'Deleted', color: '#EF4444' },
  PROCESSING: { label: 'Processing', color: '#F59E0B' },
  REJECTED: { label: 'Rejected', color: '#EF4444' },
  FAILED: { label: 'Failed', color: '#EF4444' },
}

const StatusBadge = ({ s, theme }) => {
  const meta = STATUS_META[s] || { label: s, color: '#64748B' }
  return (
    <Badge
      bg={`${meta.color}15`}
      color={meta.color}
      border="1px solid"
      borderColor={`${meta.color}30`}
      px={3}
      py={1}
      borderRadius="full"
      fontSize="xs"
      fontWeight="bold"
      textTransform="uppercase"
      whiteSpace="nowrap"
    >
      {meta.label}
    </Badge>
  )
}

const statusOptions = createListCollection({
  items: [
    { label: 'All Status', value: '' },
    ...Object.keys(STATUS_META).map((s) => ({ label: STATUS_META[s].label, value: s })),
  ],
})

export default function AdminProducts() {
  const { theme } = useTheme()

  const [list, setList] = useState([])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState([]) // Select.Root expects array
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState({}) // busy by productId

  const load = async () => {
    setLoading(true)
    try {
      const d = await adminFetchProducts()
      const result = d?.result ?? d
      const arr = Array.isArray(result)
        ? result
        : Array.isArray(result?.content)
        ? result.content
        : []
      setList(arr)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const setProductStatus = async (p, nextStatus) => {
    try {
      setBusy((b) => ({ ...b, [p.id]: true }))
      await adminUpdateProductStatus(p.id, nextStatus)
      toaster.create({ type: 'success', description: `${p.name} → ${nextStatus}` })
      await load()
    } catch (e) {
      toaster.create({ type: 'error', description: e?.message || 'Không thể cập nhật' })
    } finally {
      setBusy((b) => ({ ...b, [p.id]: false }))
    }
  }

  const getActions = (p) => {
    const s = p.status

    if (s === 'DELETED') return []

    if (s === 'PROCESSING') {
      return [
        { key: 'approve', label: 'Approve', icon: FiCheck, next: 'ACTIVE' },
        { key: 'reject', label: 'Reject', icon: FiX, next: 'REJECTED' },
      ]
    }

    if (s === 'ACTIVE') {
      return [{ key: 'deactivate', label: 'Deactivate', icon: FiPower, next: 'INACTIVE' }]
    }

    if (s === 'INACTIVE') {
      return [{ key: 'activate', label: 'Activate', icon: FiPower, next: 'ACTIVE' }]
    }

    if (s === 'REJECTED' || s === 'FAILED') {
      return [{ key: 'reprocess', label: 'Reprocess', icon: FiRotateCcw, next: 'PROCESSING' }]
    }

    return []
  }

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase()
    const pickedStatus = status?.[0] || ''

    return list.filter((p) => {
      const matchesKeyword = !keyword
        ? true
        : `${p.id} ${(p.name || '')} ${(p.sku || '')} ${(p.brand || '')}`
            .toLowerCase()
            .includes(keyword)

      const matchesStatus = !pickedStatus ? true : p.status === pickedStatus
      return matchesKeyword && matchesStatus
    })
  }, [list, q, status])

  const stats = useMemo(() => {
    const total = list.length
    const active = list.filter((p) => p.status === 'ACTIVE').length
    const processing = list.filter((p) => p.status === 'PROCESSING').length
    const inactive = list.filter((p) => p.status === 'INACTIVE').length
    return { total, active, processing, inactive }
  }, [list])

  return (
    <Box>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading size="2xl" fontWeight="black" mb={2} color={theme.text}>
            Products
          </Heading>
          <Text color={theme.textSecondary}>Manage and review all products</Text>
        </Box>
      </Flex>

      {/* Stats Cards */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={6} mb={6}>
        <Box bg={theme.cardBg} border="1px solid" borderColor={theme.border} p={5} borderRadius="lg" shadow="sm">
          <HStack gap={5}>
            <Box p={3} bg="#3B82F615" borderRadius="lg">
              <Icon as={FiPackage} boxSize={6} color="#3B82F6" />
            </Box>
            <Box>
              <Text color={theme.text} fontSize="md" fontWeight="medium">
                Total Products
              </Text>
              <Text fontWeight="bold" fontSize="2xl" color="#3B82F6">
                {stats.total}
              </Text>
            </Box>
          </HStack>
        </Box>

        <Box bg={theme.cardBg} border="1px solid" borderColor={theme.border} p={5} borderRadius="lg" shadow="sm">
          <HStack gap={5}>
            <Box p={3} bg="#10B98115" borderRadius="lg">
              <Icon as={FiCheckCircle} boxSize={6} color="#10B981" />
            </Box>
            <Box>
              <Text color={theme.text} fontSize="md" fontWeight="medium">
                Active
              </Text>
              <Text fontWeight="bold" fontSize="2xl" color="#10B981">
                {stats.active}
              </Text>
            </Box>
          </HStack>
        </Box>

        <Box bg={theme.cardBg} border="1px solid" borderColor={theme.border} p={5} borderRadius="lg" shadow="sm">
          <HStack gap={5}>
            <Box p={3} bg="#F59E0B15" borderRadius="lg">
              <Icon as={FiClock} boxSize={6} color="#F59E0B" />
            </Box>
            <Box>
              <Text color={theme.text} fontSize="md" fontWeight="medium">
                Processing
              </Text>
              <Text fontWeight="bold" fontSize="2xl" color="#F59E0B">
                {stats.processing}
              </Text>
            </Box>
          </HStack>
        </Box>

        <Box bg={theme.cardBg} border="1px solid" borderColor={theme.border} p={5} borderRadius="lg" shadow="sm">
          <HStack gap={5}>
            <Box p={3} bg="#64748B15" borderRadius="lg">
              <Icon as={FiSlash} boxSize={6} color="#64748B" />
            </Box>
            <Box>
              <Text color={theme.text} fontSize="md" fontWeight="medium">
                Inactive
              </Text>
              <Text fontWeight="bold" fontSize="2xl" color="#64748B">
                {stats.inactive}
              </Text>
            </Box>
          </HStack>
        </Box>
      </Grid>

      {/* Search + Filters */}
      <Grid
        templateColumns={{ base: '1fr', md: '4fr 1fr 1fr' }}
        gap={3}
        mb={6}
        align="center"
        bg={theme.cardBg}
        border="1px solid"
        borderColor={theme.border}
        borderRadius="lg"
        p={5}
      >
        <Box position="relative">
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
            placeholder="Search by ID, name, sku, brand..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            bg={theme.inputBg}
            border="1px solid"
            borderColor={theme.border}
            color={theme.text}
            pl={12}
            h="48px"
            borderRadius="lg"
            _placeholder={{ color: theme.textSecondary }}
            _focus={{ borderColor: '#3B82F6', boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.10)' }}
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

      {/* Products Table */}
      <Box
        bg={theme.cardBg}
        border="1px solid"
        borderColor={theme.border}
        borderRadius="lg"
        shadow="sm"
        overflow="hidden"
        position="relative"
      >
        {/* Header */}
        <Grid
          templateColumns="140px 1fr 180px 220px"
          py={4}
          px={6}
          fontWeight="bold"
          fontSize="sm"
          color={theme.text}
          textTransform="uppercase"
          letterSpacing="wider"
          borderBottom="1px solid"
          borderColor={theme.borderLight ?? theme.border}
        >
          <Box>ID</Box>
          <Box>Name</Box>
          <Box>Status</Box>
          <Box>Actions</Box>
        </Grid>

        {/* Body */}
        {loading ? (
          <Box p={12} textAlign="center">
            <Text color={theme.textSecondary}>Loading products...</Text>
          </Box>
        ) : filtered.length === 0 ? (
          <Box p={12} textAlign="center">
            <Icon as={FiPackage} boxSize={12} color="#CBD5E1" mb={4} />
            <Text color={theme.textSecondary} fontSize="lg" mb={2}>
              No products found
            </Text>
            <Text color={theme.textSecondary} fontSize="sm">
              {q ? 'Try adjusting your search' : 'Products will appear here'}
            </Text>
          </Box>
        ) : (
          filtered.map((p, idx) => {
            const actions = getActions(p)
            const isRowBusy = !!busy[p.id]

            return (
              <Grid
                key={p.id}
                templateColumns="140px 1fr 180px 220px"
                py={4}
                px={6}
                alignItems="center"
                borderBottom={idx !== filtered.length - 1 ? `1px solid ${theme.borderLight ?? theme.border}` : 'none'}
                transition="all 0.2s"
                _hover={{ bg: theme.hoverBg }}
              >
                {/* ID */}
                <VStack align="start" gap={0}>
                  <Text color="#3B82F6" fontWeight="bold" fontSize="lg">
                    #{p.id}
                  </Text>
                  <Text fontSize="sm" color={theme.textSecondary}>
                    {p.sku ? `SKU: ${p.sku}` : '—'}
                  </Text>
                </VStack>

                {/* Name */}
                <VStack align="start" gap={1}>
                  <Text color={theme.text} fontWeight="semibold" noOfLines={1}>
                    {p.name || '—'}
                  </Text>
                  <Text color={theme.textSecondary} fontSize="sm" noOfLines={1}>
                    {p.brand || 'No brand'}
                  </Text>
                </VStack>

                {/* Status */}
                <Box>
                  <StatusBadge s={p.status} theme={theme} />
                </Box>

                {/* Actions */}
                <HStack justify="flex-start">
                  {actions.length === 0 ? (
                    <Text color={theme.textSecondary} fontSize="sm">
                      —
                    </Text>
                  ) : (
                    actions.map((a) => (
                      <Tooltip.Root key={a.key}>
                        <Tooltip.Trigger asChild>
                          <IconButton
                            aria-label={a.key}
                            size="sm"
                            variant="outline"
                            isLoading={isRowBusy}
                            onClick={() => setProductStatus(p, a.next)}
                            borderColor={theme.border}
                            _hover={{ bg: theme.cardBg }}
                          >
                            <Icon as={a.icon} />
                          </IconButton>
                        </Tooltip.Trigger>
                        <Tooltip.Positioner>
                          <Tooltip.Content>{a.label}</Tooltip.Content>
                        </Tooltip.Positioner>
                      </Tooltip.Root>
                    ))
                  )}
                </HStack>
              </Grid>
            )
          })
        )}
      </Box>
    </Box>
  )
}
