import {
  Badge,
  Box,
  createListCollection,
  Grid,
  Heading,
  HStack,
  Portal,
  Select,
  Separator,
  Skeleton,
  Text,
  VStack
} from '@chakra-ui/react'
import { Flex } from '@chakra-ui/react/flex'
import { Icon } from '@chakra-ui/react/icon'
import { useEffect, useMemo, useState } from 'react'
import { Tooltip } from '../../components/ui/tooltip'
import { fetchOrders } from '../api/seller'

// Charts
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Tooltip as ChartTooltip,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts'

// Icons
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiShoppingBag,
  FiTrendingUp,
  FiXCircle
} from 'react-icons/fi'

const currency = (n = 0) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
    .format(Number(n) || 0)

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899']

export default function SellerAnalytics() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [range, setRange] = useState("last7days")

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const d = await fetchOrders()
        setOrders(Array.isArray(d) ? d : (d?.content || []))
      } catch (e) {
        setError(e?.message || 'Không tải được dữ liệu')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((s, o) => s + (o.status === "PAID" ? Number(o.totalAmount) || 0 : 0), 0)
    const completedRevenue = orders.reduce((s, o) => s + (o.status === "COMPLETED" ? Number(o.totalAmount) || 0 : 0), 0)

    const byStatus = orders.reduce((m, o) => {
        m[o.status] = (m[o.status] || 0) + 1
        return m
    }, {})

    const totalOrders = orders.length
    const completedOrders = byStatus['COMPLETED'] || 0
    const pendingOrders = byStatus['PENDING'] || 0
    const cancelledOrders = byStatus['CANCELLED'] || 0
    const successRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0
    const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(0) : 0

    const pipeline = pickPipelinePercents(byStatus, totalOrders)

    let chartData = []

    if (range === "last7days") {
        const today = new Date()
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date()
            d.setDate(today.getDate() - (6 - i))
            return { label: `${d.getDate()}/${d.getMonth() + 1}`, date: d }
        })

        chartData = days.map(({ label, date }) => {
            const filtered = orders.filter(o => {
                const d = new Date(o.createdAt)
                return (
                    d.getDate() === date.getDate() &&
                    d.getMonth() === date.getMonth() &&
                    d.getFullYear() === date.getFullYear()
                )
            })
            return {
                day: label,
                orders: filtered.length,
                revenue: filtered.reduce((s, o) => s + (o.status === "PAID" ? Number(o.totalAmount) || 0 : 0), 0),
            }
        })
    }

    if (range === "thismonth") {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth()
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const days = Array.from({ length: daysInMonth }, (_, i) => {
            return { label: `${i + 1}/${month + 1}`, date: new Date(year, month, i + 1) }
        })

        chartData = days.map(({ label, date }) => {
            const filtered = orders.filter(o => {
                const d = new Date(o.createdAt)
                return d.getDate() === date.getDate() && d.getMonth() === date.getMonth()
            })
            return {
                day: label,
                orders: filtered.length,
                revenue: filtered.reduce((s, o) => s + (o.status === "PAID" ? Number(o.totalAmount) || 0 : 0), 0),
            }
        })
    }

    if (range === "last6months") {
      const now = new Date()
      const months = []
      for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          months.push({
              label: `${d.getMonth() + 1}/${d.getFullYear()}`,
              year: d.getFullYear(),
              month: d.getMonth(),
          })
      }

      chartData = months.map(({ label, year, month }) => {
          const filtered = orders.filter(o => {
              const d = new Date(o.createdAt)
              return d.getMonth() === month && d.getFullYear() === year
          })
          return {
              day: label,
              orders: filtered.length,
              revenue: filtered.reduce((s, o) => s + (o.status === "PAID" ? Number(o.totalAmount) || 0 : 0), 0),
          }
      })
    }

    // Pie chart data
    const pieData = Object.entries(byStatus).map(([status, count]) => ({
      name: status,
      value: count,
      color: getStatusColor(status)
    }))

    return { 
      totalOrders, 
      totalRevenue, 
      completedRevenue,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      successRate,
      avgOrderValue,
      byStatus, 
      pipeline, 
      chartData,
      pieData
    }
  }, [orders, range])

  return (
    <Box color="white">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading size="2xl" fontWeight="black" mb={2}>Analytics Dashboard</Heading>
          <Text color="whiteAlpha.600">Track your store performance and insights</Text>
        </Box>
        <Select.Root
          collection={ranges}
          width="220px"
          value={[range]}
          onValueChange={(e) => setRange(e.value[0])}
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger bg="gray.900" borderColor="whiteAlpha.300" color="white">
              <Select.ValueText placeholder="Select range" />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content bg="gray.900" color="white" borderColor="whiteAlpha.300">
                {ranges.items.map((range) => (
                  <Select.Item item={range} key={range.value} _hover={{ bg: "whiteAlpha.200" }}>
                    {range.label}
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
      </Flex>

      {/* KPI Cards */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={6} mb={8}>
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={FiShoppingBag}
          color="#2563EB"
          loading={loading}
          trend="+12.5%"
        />
        <StatCard
          title="Total Revenue"
          value={currency(stats.totalRevenue)}
          icon={FiDollarSign}
          color="#10B981"
          loading={loading}
          trend="+8.3%"
        />
        <StatCard
          title="Avg Order Value"
          value={currency(stats.avgOrderValue)}
          icon={FiTrendingUp}
          color="#F59E0B"
          loading={loading}
        />
        <StatCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          icon={FiCheckCircle}
          color="#8B5CF6"
          loading={loading}
          trend="+2.1%"
        />
      </Grid>

      {/* Quick Stats */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6} mb={8}>
        <QuickStatCard
          label="Pending Orders"
          value={stats.pendingOrders}
          icon={FiClock}
          color="#F59E0B"
          loading={loading}
        />
        <QuickStatCard
          label="Completed Orders"
          value={stats.completedOrders}
          icon={FiCheckCircle}
          color="#10B981"
          loading={loading}
        />
        <QuickStatCard
          label="Cancelled Orders"
          value={stats.cancelledOrders}
          icon={FiXCircle}
          color="#EF4444"
          loading={loading}
        />
      </Grid>

      {/* Charts Grid */}
      <Grid templateColumns={{ base: "1fr", xl: "2fr 1fr" }} gap={6} mb={8}>
        {/* Revenue Trend */}
        <Box bg="gray.900" border="1px solid" borderColor="whiteAlpha.200" p={6}>
          <Heading size="md" mb={4}>Revenue Trend</Heading>
          <Box h="350px">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <ChartTooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(v) => currency(v)} 
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        {/* Order Status Distribution */}
        <Box bg="gray.900" border="1px solid" borderColor="whiteAlpha.200" p={6}>
          <Heading size="md" mb={4}>Order Status</Heading>
          <Box h="350px">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </Grid>

      {/* Orders Chart */}
      <Box bg="gray.900" border="1px solid" borderColor="whiteAlpha.200" p={6} mb={8}>
        <Heading size="md" mb={4}>Orders Overview</Heading>
        <Box h="350px">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
              <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
              <ChartTooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="orders" 
                stroke="#2563EB" 
                strokeWidth={3}
                dot={{ fill: '#2563EB', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      {/* Status Pipeline */}
      <Box bg="gray.900" border="1px solid" borderColor="whiteAlpha.200" p={6}>
        <HStack justify="space-between" mb={4}>
          <Heading size="md">Order Pipeline</Heading>
          {!loading && error && (
            <HStack color="red.400" fontSize="sm">
              <Icon as={FiAlertCircle} />
              <Text>{error}</Text>
            </HStack>
          )}
        </HStack>

        <Skeleton loading={loading} borderRadius="md">
          <PipelineBar pipeline={stats.pipeline} total={stats.totalOrders} />
        </Skeleton>

        <Separator my={4} borderColor="whiteAlpha.200" />

        <Skeleton loading={loading} borderRadius="md">
          <StatusBadges byStatus={stats.byStatus} />
        </Skeleton>
      </Box>
    </Box>
  )
}

/* ---------- Components ---------- */

function StatCard({ title, value, icon, color, loading = false, trend }) {
  return (
    <Box
      bg="gray.900"
      border="1px solid"
      borderColor="whiteAlpha.200"
      p={6}
      position="relative"
      overflow="hidden"
      transition="all 0.3s"
      _hover={{ borderColor: color }}
    >
      {/* Decorative gradient */}
      <Box
        position="absolute"
        top="-50%"
        right="-30%"
        w="150px"
        h="150px"
        bg={color}
        opacity={0.1}
        filter="blur(40px)"
        pointerEvents="none"
      />

      <Skeleton loading={loading} borderRadius="md">
        <VStack align="start" spacing={3} position="relative">
          <HStack justify="space-between" w="full">
            <Box
              p={3}
              bg={`${color}20`}
              borderRadius="lg"
            >
              <Icon as={icon} boxSize={6} color={color} />
            </Box>
            {trend && (
              <Badge colorPalette="green" variant="subtle" px={2} py={1}>
                {trend}
              </Badge>
            )}
          </HStack>
          <Box>
            <Text color="whiteAlpha.600" fontSize="sm" mb={1}>{title}</Text>
            <Text fontWeight="black" fontSize="3xl">{value}</Text>
          </Box>
        </VStack>
      </Skeleton>
    </Box>
  )
}

function QuickStatCard({ label, value, icon, color, loading }) {
  return (
    <Box
      bg="gray.900"
      border="1px solid"
      borderColor="whiteAlpha.200"
      p={4}
    >
      <Skeleton loading={loading}>
        <HStack spacing={4}>
          <Box p={3} bg={`${color}20`} borderRadius="lg">
            <Icon as={icon} boxSize={5} color={color} />
          </Box>
          <Box>
            <Text color="whiteAlpha.600" fontSize="sm">{label}</Text>
            <Text fontWeight="bold" fontSize="2xl">{value}</Text>
          </Box>
        </HStack>
      </Skeleton>
    </Box>
  )
}

function PipelineBar({ pipeline, total }) {
  if (!total) {
    return <Box h="16px" bg="gray.800" borderRadius="full" border="1px solid" borderColor="whiteAlpha.200" />
  }

  return (
    <Tooltip
      content={
        <VStack align="start" spacing="6px">
          {pipeline.map(seg => (
            <HStack key={seg.key} spacing="8px">
              <Box w="12px" h="12px" borderRadius="sm" bg={seg.color} />
              <Text>{seg.label}: {seg.percent}%</Text>
            </HStack>
          ))}
        </VStack>
      }
      openDelay={150}
    >
      <Flex h="16px" borderRadius="full" overflow="hidden" border="1px solid" borderColor="whiteAlpha.200">
        {pipeline.map(seg => (
          <Box
            key={seg.key}
            flex={`${seg.percent} 0 auto`}
            bg={seg.color}
          />
        ))}
      </Flex>
    </Tooltip>
  )
}

function StatusBadges({ byStatus = {} }) {
  const entries = Object.entries(byStatus)
  if (entries.length === 0) {
    return <Text color="whiteAlpha.500">—</Text>
  }

  return (
    <HStack wrap="wrap" spacing={2} rowGap={2}>
      {entries.map(([k, v]) => {
        const color = getStatusColor(k)
        return (
          <Badge 
            key={k} 
            bg={`${color}20`}
            color={color}
            border="1px solid"
            borderColor={`${color}40`}
            px={3} 
            py={1} 
            borderRadius="md"
            fontWeight="semibold"
          >
            {k}: {v}
          </Badge>
        )
      })}
    </HStack>
  )
}

/* ---------- Helpers ---------- */

function getStatusColor(status) {
  switch (status) {
    case 'PENDING': return '#9CA3AF'
    case 'PAID': return '#2563EB'
    case 'PROCESSING': return '#06B6D4'
    case 'SHIPPING': return '#14B8A6'
    case 'DELIVERED': return '#8B5CF6'
    case 'COMPLETED': return '#10B981'
    case 'CANCELLED': return '#EF4444'
    case 'REFUNDED': return '#F59E0B'
    default: return '#9CA3AF'
  }
}

function pickPipelinePercents(byStatus = {}, total = 0) {
  const order = [
    { key: 'PENDING',    label: 'Pending',    color: '#9CA3AF'   },
    { key: 'PAID',       label: 'Paid',       color: '#2563EB'   },
    { key: 'PROCESSING', label: 'Processing', color: '#06B6D4'   },
    { key: 'SHIPPING',   label: 'Shipping',   color: '#14B8A6'   },
    { key: 'DELIVERED',  label: 'Delivered',  color: '#8B5CF6' },
    { key: 'COMPLETED',  label: 'Completed',  color: '#10B981'  },
    { key: 'CANCELLED',  label: 'Cancelled',  color: '#EF4444'    },
    { key: 'REFUNDED',   label: 'Refunded',   color: '#F59E0B' },
  ]
  if (!total) {
    return order.map(o => ({ ...o, percent: 0 }))
  }
  return order.map(o => {
    const count = byStatus[o.key] || 0
    const percent = Math.round((count / total) * 100)
    return { ...o, percent }
  }).filter(seg => seg.percent > 0)
}

const ranges = createListCollection({
  items: [
    { label: "Last 7 days", value: "last7days" },
    { label: "This month", value: "thismonth" },
    { label: "Last 6 months", value: "last6months" },
  ],
})