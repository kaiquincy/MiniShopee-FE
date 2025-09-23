import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  SimpleGrid,
  Heading,
  Text,
  Skeleton,
  HStack,
  VStack,
  Badge,
  Separator ,
} from '@chakra-ui/react'
import { Flex } from '@chakra-ui/react/flex'
import { Icon } from '@chakra-ui/react/icon'
import { Tooltip } from '../../components/ui/tooltip'
import { fetchOrders } from '../api/seller'

// Icons
import { FiShoppingBag, FiTrendingUp, FiPieChart, FiAlertCircle } from 'react-icons/fi'

const currency = (n = 0) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
    .format(Number(n) || 0)

export default function SellerAnalytics() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const d = await fetchOrders()
        setOrders(Array.isArray(d) ? d : (d?.content || []))
      } catch (e) {
        setError(e?.message || 'Không tải được dữ liệu')
      } finally {
        console.log("Asdddddddddddd")
        setLoading(false)
      }
    })()
  }, [])

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((s, o) => s + (Number(o.grandTotal) || 0), 0)
    const byStatus = orders.reduce((m, o) => {
      m[o.status] = (m[o.status] || 0) + 1
      return m
    }, {})
    const totalOrders = orders.length
    const pipeline = pickPipelinePercents(byStatus, totalOrders)
    return { totalOrders, totalRevenue, byStatus, pipeline }
  }, [orders])

  return (
    <Box>
      <Heading size="md" mb={4}>Tổng quan</Heading>

      {/* KPI Cards */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <StatCard
          title="Tổng đơn"
          value={stats.totalOrders}
          icon={FiShoppingBag}
          colorPalette="blue"
          loading={loading}
        />
        <StatCard
          title="Doanh thu ước tính"
          value={currency(stats.totalRevenue)}
          icon={FiTrendingUp}
          colorPalette="green"
          loading={loading}
        />
        <StatCard
          title="Tỷ trọng trạng thái"
          value={formatStatusShort(stats.byStatus)}
          icon={FiPieChart}
          colorPalette="purple"
          loading={loading}
        />
      </SimpleGrid>

      {/* Pipeline & breakdown */}
      <Box mt={4} bg="white" border="1px solid" borderColor="gray.100" borderRadius="md" p={4}>
        <HStack justify="space-between" mb={2}>
          <Text fontWeight="semibold">Trạng thái đơn hàng</Text>
          {!loading && error && (
            <HStack color="red.600" fontSize="sm">
              <Icon as={FiAlertCircle} />
              <Text>{error}</Text>
            </HStack>
          )}
        </HStack>

        {/* Pipeline bar */}
        <Skeleton loading={loading} borderRadius="md">
          <PipelineBar pipeline={stats.pipeline} total={stats.totalOrders} />
        </Skeleton>

        <Separator  my={3} />

        {/* Breakdown badges */}
        <Skeleton loading={loading} borderRadius="md">
          <StatusBadges byStatus={stats.byStatus} />
        </Skeleton>
      </Box>
    </Box>
  )
}

/* ---------- Components ---------- */

function StatCard({ title, value, icon, colorPalette = 'gray', loading = false }) {
  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="gray.100"
      borderRadius="md"
      p={4}
      boxShadow="0 6px 18px rgba(2,32,71,0.06)"
    >
      <Skeleton loading={loading} borderRadius="md">
        <HStack align="start" justify="space-between">
          <VStack align="start" spacing={1}>
            <Text color="gray.500">{title}</Text>
            <Text fontWeight="bold" fontSize="xl">{value}</Text>
          </VStack>
          <Box
            borderRadius="12px"
            p="10px"
            bg={`${colorPalette}.50`}
            border="1px solid"
            borderColor={`${colorPalette}.100`}
          >
            <Icon as={icon} boxSize={5} color={`${colorPalette}.600`} />
          </Box>
        </HStack>
      </Skeleton>
    </Box>
  )
}

function PipelineBar({ pipeline, total }) {
  if (!total) {
    return <Box h="12px" bg="gray.50" borderRadius="full" border="1px solid" borderColor="gray.100" />
  }

  return (
    <Tooltip
      content={
        <VStack align="start" spacing="6px">
          {pipeline.map(seg => (
            <HStack key={seg.key} spacing="8px">
              <Box w="10px" h="10px" borderRadius="2px" bg={`${seg.colorPalette}.500`} />
              <Text>{seg.label}: {seg.percent}%</Text>
            </HStack>
          ))}
        </VStack>
      }
      openDelay={150}
    >
      <Flex h="12px" borderRadius="full" overflow="hidden" border="1px solid" borderColor="gray.100">
        {pipeline.map(seg => (
          <Box
            key={seg.key}
            flex={`${seg.percent} 0 auto`}
            bg={`${seg.colorPalette}.500`}
            _dark={{ bg: `${seg.colorPalette}.400` }}
          />
        ))}
      </Flex>
    </Tooltip>
  )
}


function StatusBadges({ byStatus = {} }) {
  const entries = Object.entries(byStatus)
  if (entries.length === 0) {
    return <Text color="gray.500">—</Text>
  }

  return (
    <HStack wrap="wrap" spacing={2} rowGap={2}>
      {entries.map(([k, v]) => {
        const palette = pickStatusPalette(k)
        return (
          <Badge key={k} colorPalette={palette} variant="soft" px={2} py={1} borderRadius="md">
            {k}: <Box as="span" fontWeight="semibold" ml="4px">{v}</Box>
          </Badge>
        )
      })}
    </HStack>
  )
}

/* ---------- Helpers ---------- */

function formatStatusShort(byStatus = {}) {
  const entries = Object.entries(byStatus)
  if (entries.length === 0) return '—'
  const short = entries
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' • ')
  return short
}

function pickStatusPalette(status) {
  switch (status) {
    case 'PENDING': return 'gray'
    case 'PAID': return 'blue'
    case 'PROCESSING': return 'cyan'
    case 'SHIPPING': return 'teal'
    case 'DELIVERED': return 'purple'
    case 'COMPLETED': return 'green'
    case 'CANCELLED': return 'red'
    case 'REFUNDED': return 'orange'
    default: return 'gray'
  }
}

function pickPipelinePercents(byStatus = {}, total = 0) {
  const order = [
    { key: 'PENDING',    label: 'Pending',    colorPalette: 'gray'   },
    { key: 'PAID',       label: 'Paid',       colorPalette: 'blue'   },
    { key: 'PROCESSING', label: 'Processing', colorPalette: 'cyan'   },
    { key: 'SHIPPING',   label: 'Shipping',   colorPalette: 'teal'   },
    { key: 'DELIVERED',  label: 'Delivered',  colorPalette: 'purple' },
    { key: 'COMPLETED',  label: 'Completed',  colorPalette: 'green'  },
    { key: 'CANCELLED',  label: 'Cancelled',  colorPalette: 'red'    },
    { key: 'REFUNDED',   label: 'Refunded',   colorPalette: 'orange' },
  ]
  if (!total) {
    return order.map(o => ({ ...o, percent: 0 }))
  }
  return order.map(o => {
    const count = byStatus[o.key] || 0
    const percent = Math.round((count / total) * 100)
    return { ...o, percent }
  }).filter(seg => seg.percent > 0) // ẩn đoạn 0% để bar gọn hơn
}
