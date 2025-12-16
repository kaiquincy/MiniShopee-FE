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
import { Tooltip } from '../../components/ui/Tooltip'
import { fetchOrders } from '../api/seller'

// Charts
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip as ChartTooltip,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts'

// Icons
import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiShoppingBag,
  FiTrendingUp,
  FiXCircle
} from 'react-icons/fi'

const currency = (n = 0) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    .format(Number(n) || 0)

export default function SellerAnalytics() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Time range states for different charts
  const [revenueRange, setRevenueRange] = useState('7')
  const [ordersRange, setOrdersRange] = useState('7')

  const timeRangeOptions = createListCollection({
    items: [
      { label: 'Last 7 Days', value: '7' },
      { label: 'Last 30 Days', value: '30' },
      { label: 'Last 6 Months', value: '180' },
    ],
  })

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const d = await fetchOrders()
        setOrders(Array.isArray(d) ? d : (d?.content || []))
      } catch (e) {
        setError(e?.message || 'Cannot load data')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const stats = useMemo(() => {
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0)
    
    const byStatus = orders.reduce((m, o) => {
      m[o.status] = (m[o.status] || 0) + 1
      return m
    }, {})

    const pendingOrders = byStatus['PENDING'] || 0
    const completedOrders = byStatus['COMPLETED'] || 0
    const cancelledOrders = byStatus['CANCELLED'] || 0
    const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0

    // Helper function to generate date ranges
    const generateDateRange = (days) => {
      const n = parseInt(days)
      return Array.from({ length: n }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (n - 1 - i))
        d.setHours(0, 0, 0, 0) // ✅ reset về đầu ngày

        return {
          date: `${d.getMonth() + 1}/${d.getDate()}`,
          dateObj: d,
          fullDate: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        }
      })
    }


    // Helper to group by interval for 6 months
    const groupByInterval = (dateRange, intervalDays) => {
      const grouped = []
      for (let i = 0; i < dateRange.length; i += intervalDays) {
        const chunk = dateRange.slice(i, Math.min(i + intervalDays, dateRange.length))
        if (chunk.length > 0) {
          const startDate = new Date(chunk[0].dateObj)
          startDate.setHours(0, 0, 0, 0)
          const endDate = new Date(chunk[chunk.length - 1].dateObj)
          endDate.setHours(23, 59, 59, 999)
          grouped.push({
            dates: chunk,
            label: intervalDays === 1 ? chunk[0].date : 
                  `${startDate.getMonth() + 1}/${startDate.getDate()}-${endDate.getMonth() + 1}/${endDate.getDate()}`,
            fullDate: chunk[0].fullDate,
            startDate,
            endDate
          })
        }
      }
      return grouped
    }

    // Revenue by selected range
    const revenueDays = parseInt(revenueRange)
    const revenueDateRange = generateDateRange(revenueDays)
    const revenueGroups =
      revenueDays === 180
        ? groupByInterval(revenueDateRange, 7)
        : revenueDateRange.map(d => {
            const start = new Date(d.dateObj)
            start.setHours(0, 0, 0, 0)

            const end = new Date(d.dateObj)
            end.setHours(23, 59, 59, 999) // ✅ cuối ngày

            return { dates: [d], label: d.date, fullDate: d.fullDate, startDate: start, endDate: end }
          })


    const revenueByDay = revenueGroups.map(({ dates, label, fullDate, startDate, endDate }) => {
      const periodOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt)
        return orderDate >= startDate && orderDate <= endDate
      })
      return {
        date: label,
        fullDate,
        dateObj: startDate,
        revenue: periodOrders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0),
        orders: periodOrders.length,
        ordersList: periodOrders
      }
    })

    // Orders by selected range
    const ordersDays = parseInt(ordersRange)
    const orderDateRange = generateDateRange(ordersDays)
    const orderGroups = ordersDays === 180 ? groupByInterval(orderDateRange, 7) : 
                        orderDateRange.map(d => ({ dates: [d], label: d.date, fullDate: d.fullDate, startDate: d.dateObj, endDate: d.dateObj }))

    const ordersByDay = orderGroups.map(({ dates, label, fullDate, startDate, endDate }) => {
      const periodOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt)
        return orderDate >= startDate && orderDate <= endDate
      })
      return {
        date: label,
        fullDate,
        dateObj: startDate,
        revenue: periodOrders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0),
        orders: periodOrders.length,
        ordersList: periodOrders
      }
    })

    // Status distribution for pie chart
    const statusData = Object.entries(byStatus).map(([status, count]) => ({
      name: status,
      value: count,
      color: getStatusColor(status),
      orders: orders.filter(o => o.status === status)
    }))

    // Recent orders (last 5)
    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)

    const pipeline = pickPipelinePercents(byStatus, totalOrders)

    return { 
      totalOrders, 
      totalRevenue, 
      completedOrders,
      pendingOrders,
      cancelledOrders,
      avgOrderValue,
      byStatus, 
      revenueByDay,
      ordersByDay,
      statusData,
      recentOrders,
      pipeline
    }
  }, [orders, revenueRange, ordersRange])

  return (
    <Box color="white" p={8}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading size="2xl" fontWeight="black" mb={2}>Analytics Dashboard</Heading>
          <Text color="whiteAlpha.600">Track your store performance and insights</Text>
        </Box>
      </Flex>

      {/* KPI Cards */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={6} mb={8}>
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={FiShoppingBag}
          color="#2563EB"
          loading={loading}
        />
        <StatCard
          title="Total Revenue"
          value={currency(stats.totalRevenue)}
          icon={FiDollarSign}
          color="#10B981"
          loading={loading}
        />
        <StatCard
          title="Avg Order Value"
          value={currency(stats.avgOrderValue)}
          icon={FiTrendingUp}
          color="#F59E0B"
          loading={loading}
        />
        <StatCard
          title="Completed Orders"
          value={stats.completedOrders}
          icon={FiCheckCircle}
          color="#8B5CF6"
          loading={loading}
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

      {/* Revenue Trend & Daily Breakdown */}
      <Grid templateColumns={{ base: "1fr", xl: "1.5fr 1fr" }} gap={6} mb={8}>
        {/* Revenue Trend */}
        <Box bg="gray.900" border="1px solid" borderColor="whiteAlpha.200" p={6}>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md">Revenue Trend</Heading>
            <Select.Root 
              collection={timeRangeOptions}
              value={[revenueRange]}
              onValueChange={(e) => setRevenueRange(e.value[0])}
              size="sm"
              width="150px"
            >
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger bg="gray.800" borderColor="whiteAlpha.300" color="white">
                  <Select.ValueText placeholder="Select range" />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner zIndex={20}>
                  <Select.Content bg="gray.900" color="white" borderColor="whiteAlpha.300">
                    {timeRangeOptions.items.map((option) => (
                      <Select.Item
                        key={option.value}
                        item={option}
                        _hover={{ bg: "whiteAlpha.200" }}
                      >
                        {option.label}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
          </Flex>
          <Box h="300px">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenueByDay}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
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
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        {/* Daily Revenue Details */}
        <Box bg="gray.900" border="1px solid" borderColor="whiteAlpha.200" p={6}>
          <Heading size="md" mb={4}>
            {revenueRange === '180' ? 'Weekly Breakdown' : 'Daily Breakdown'}
          </Heading>
          <VStack align="stretch" spacing={3} maxH="300px" overflowY="auto">

            {/* {console.log(stats.revenueByDay)} */}
            {stats.revenueByDay.slice().reverse().map((day, idx) => (
              <Box 
                key={idx}
                p={3}
                bg={day.orders > 0 ? "whiteAlpha.50" : "transparent"}
                borderRadius="md"
                border="1px solid"
                borderColor={day.orders > 0 ? "whiteAlpha.200" : "transparent"}
              >           
                <Flex justify="space-between" align="center" mb={1}>
                  <HStack spacing={2}>
                    <Icon as={FiCalendar} boxSize={4} color="whiteAlpha.600" />
                    <Text fontSize="sm" fontWeight="semibold" color="white">
                      {day.fullDate}
                    </Text>
                  </HStack>
                  <Badge 
                    bg="blue.900"
                    color="blue.300"
                    px={2}
                    py={0.5}
                    borderRadius="md"
                    fontSize="xs"
                  >
                    {day.orders} orders
                  </Badge>
                </Flex>
                <Text fontSize="lg" fontWeight="bold" color="#10B981">
                  {currency(day.revenue)}
                </Text>
              </Box>
            ))}
          </VStack>
        </Box>
      </Grid>

      {/* Order Status & Orders Per Day */}
      <Grid templateColumns={{ base: "1fr", xl: "1fr 1.5fr" }} gap={6} mb={8}>
        {/* Order Status Pie Chart */}
        <Box bg="gray.900" border="1px solid" borderColor="whiteAlpha.200" p={6}>
          <Heading size="md" mb={4}>Order Status</Heading>
          <Box h="300px">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.statusData.map((entry, index) => (
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

        {/* Orders Per Day Chart */}
        <Box bg="gray.900" border="1px solid" borderColor="whiteAlpha.200" p={6}>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md">Orders Per Day</Heading>
            <Select.Root 
              collection={timeRangeOptions}
              value={[ordersRange]}
              onValueChange={(e) => setOrdersRange(e.value[0])}
              size="sm"
              width="150px"
            >
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger bg="gray.800" borderColor="whiteAlpha.300" color="white">
                  <Select.ValueText placeholder="Select range" />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner zIndex={20}>
                  <Select.Content bg="gray.900" color="white" borderColor="whiteAlpha.300">
                    {timeRangeOptions.items.map((option) => (
                      <Select.Item
                        key={option.value}
                        item={option}
                        _hover={{ bg: "whiteAlpha.200" }}
                      >
                        {option.label}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
          </Flex>
          <Box h="300px">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.ordersByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <ChartTooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="orders" fill="#2563EB" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </Grid>

      {/* Recent Orders */}
      <Box bg="gray.900" border="1px solid" borderColor="whiteAlpha.200" p={6} mb={8}>
        <Heading size="md" mb={4}>Recent Orders</Heading>
        {stats.recentOrders.length > 0 ? (
          <VStack align="stretch" spacing={3}>
            {stats.recentOrders.map((order) => (
              <Box
                key={order.orderId}
                p={3}
                bg="whiteAlpha.50"
                borderRadius="md"
                border="1px solid"
                borderColor="whiteAlpha.200"
              >
                <Flex justify="space-between" align="center" mb={2}>
                  <Text fontSize="sm" fontWeight="bold" color="white">
                    Order #{order.orderId}
                  </Text>
                  <Badge 
                    bg={`${getStatusColor(order.status)}20`}
                    color={getStatusColor(order.status)}
                    border="1px solid"
                    borderColor={`${getStatusColor(order.status)}40`}
                    px={2}
                    py={0.5}
                    borderRadius="md"
                    fontSize="xs"
                  >
                    {order.status}
                  </Badge>
                </Flex>
                <Flex justify="space-between" align="center">
                  <Text fontSize="xs" color="whiteAlpha.600">
                    {new Date(order.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                  <Text fontSize="md" fontWeight="bold" color="#10B981">
                    {currency(order.totalAmount)}
                  </Text>
                </Flex>
              </Box>
            ))}
          </VStack>
        ) : (
          <Box textAlign="center" py={8}>
            <Icon as={FiShoppingBag} boxSize={10} color="whiteAlpha.300" mb={2} />
            <Text color="whiteAlpha.600" fontSize="sm">No orders yet</Text>
          </Box>
        )}
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

function StatCard({ title, value, icon, color, loading = false }) {
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