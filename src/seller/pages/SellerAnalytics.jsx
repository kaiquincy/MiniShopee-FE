import {
  Badge,
  Box,
  createListCollection,
  Grid,
  Heading,
  HStack,
  Portal,
  Select,
  Skeleton,
  Text,
  VStack
} from '@chakra-ui/react'
import { Flex } from '@chakra-ui/react/flex'
import { Icon } from '@chakra-ui/react/icon'
import { useEffect, useMemo, useState } from 'react'
import { Tooltip } from '../../components/ui/Tooltip'
import { useTheme } from '../../context/ThemeContext'
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

  const { theme } = useTheme()

  useEffect(() => {
    let alive = true

    const load = async () => {
      try {
        setError(null)
        setLoading(true)
        const d = await fetchOrders()
        if (!alive) return
        setOrders(Array.isArray(d) ? d : (d?.content || []))
      } catch (e) {
        if (alive) setError(e?.message || "Cannot load data")
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()

    const id = setInterval(() => {
      load()
    }, 60_000)

    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  function getDataRangeLabel(data, { prefix = "Data from", locale = "en-US" } = {}) {
    if (!Array.isArray(data) || data.length === 0) return ""

    const toDate = (v) => (v instanceof Date ? v : v ? new Date(v) : null)

    const dates = data
      .map((d) => toDate(d.dateObj))
      .filter((d) => d && !Number.isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())

    if (dates.length === 0) return ""

    const fmt = (d) => d.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })

    return `${prefix} ${fmt(dates[0])} to ${fmt(dates[dates.length - 1])}`
  }

  const stats = useMemo(() => {
    const safeNumber = (v) => Number(v) || 0

    const isCompletedOrder = (o) => {
      const st = String(o?.status || '').toUpperCase()
      return st === 'COMPLETED' || st === 'COMPLETE'
    }

    // ---- Date helpers (LOCAL day boundaries) ----
    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const addDays = (d, n) => {
      const x = new Date(d)
      x.setDate(x.getDate() + n)
      return x
    }
    const pad2 = (n) => String(n).padStart(2, '0')
    const dayKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

    const formatMD = (d) => `${d.getMonth() + 1}/${d.getDate()}`
    const formatFull = (d) =>
      d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

    // If range crosses years, include year in labels to prevent confusion
    const formatMDY = (d) => `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
    const shouldShowYear = (days) => days > 30 // simple rule; adjust if you want

    // ---- Build date range (inclusive days), all at start-of-day ----
    const generateDateRange = (daysRaw) => {
      const days = Math.max(1, parseInt(daysRaw || 0, 10))
      const todayStart = startOfDay(new Date())

      return Array.from({ length: days }, (_, i) => {
        const d = addDays(todayStart, i - (days - 1))
        return {
          dateObj: d,
          key: dayKey(d),
          label: shouldShowYear(days) ? formatMDY(d) : formatMD(d),
          fullDate: formatFull(d),
        }
      })
    }

    // ---- Group into intervals (e.g. weekly chunks for 180d) ----
    const groupByInterval = (dateRange, intervalDays) => {
      const grouped = []
      for (let i = 0; i < dateRange.length; i += intervalDays) {
        const chunk = dateRange.slice(i, i + intervalDays)
        if (!chunk.length) continue

        const start = chunk[0].dateObj
        const endExclusive = addDays(chunk[chunk.length - 1].dateObj, 1)

        const startLabel = chunk[0].label
        const endLabel = chunk[chunk.length - 1].label

        grouped.push({
          dates: chunk,
          start,
          endExclusive,
          label: intervalDays === 1 ? startLabel : `${startLabel}-${endLabel}`,
          fullDate: chunk[0].fullDate,
        })
      }
      return grouped
    }

    // ---- Basic totals ----
    const totalOrders = orders.length
    const completedOrdersList = orders.filter(isCompletedOrder)
    const totalRevenue = completedOrdersList.reduce((s, o) => s + safeNumber(o.totalAmount), 0)
    
    // ---- Group orders by status (counts + lists) ----
    const statusMap = orders.reduce((m, o) => {
      const st = o.status || 'UNKNOWN'
      if (!m[st]) m[st] = { count: 0, orders: [] }
      m[st].count += 1
      m[st].orders.push(o)
      return m
    }, {})
    
    const pendingOrders = statusMap['PENDING']?.count || 0
    const completedOrders = statusMap['COMPLETED']?.count || 0
    const cancelledOrders = statusMap['CANCELLED']?.count || 0
    const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0

    // ---- Build ONE daily bucket map for fast lookups ----
    // Buckets by LOCAL day key (yyyy-mm-dd)
    const dailyBuckets = new Map()
    for (const o of completedOrdersList) {
      const created = new Date(o.createdAt)
      if (Number.isNaN(created.getTime())) continue

      const k = dayKey(startOfDay(created))
      if (!dailyBuckets.has(k)) dailyBuckets.set(k, { revenue: 0, orders: 0, ordersList: [] })

      const b = dailyBuckets.get(k)
      b.revenue += safeNumber(o.totalAmount)
      b.orders += 1
      b.ordersList.push(o)
    }

    const buildSeries = (daysRaw) => {
      const days = Math.max(1, parseInt(daysRaw || 0, 10))
      const range = generateDateRange(days)
      const groups = days === 180 ? groupByInterval(range, 7) : groupByInterval(range, 1)

      return groups.map((g) => {
        // sum by looking up each day in the group
        let revenue = 0
        let ordersCount = 0
        const ordersList = []

        for (const d of g.dates) {
          const b = dailyBuckets.get(d.key)
          if (!b) continue
          revenue += b.revenue
          ordersCount += b.orders
          ordersList.push(...b.ordersList)
        }

        return {
          date: g.label,
          fullDate: g.fullDate,
          dateObj: g.start,
          revenue,
          orders: ordersCount,
          ordersList,
        }
      })
    }

    const revenueByDay = buildSeries(revenueRange)
    const ordersByDay = buildSeries(ordersRange)

    // ---- Status distribution for pie chart ----
    const statusData = Object.entries(statusMap).map(([status, info]) => ({
      name: status,
      value: info.count,
      color: getStatusColor(status),
      orders: info.orders,
    }))

    // ---- Recent orders (last 5) ----
    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)

    const byStatusCounts = Object.fromEntries(
      Object.entries(statusMap).map(([k, v]) => [k, v.count])
    )

    const pipeline = pickPipelinePercents(byStatusCounts, totalOrders)

    return {
      totalOrders,
      totalRevenue,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      avgOrderValue,
      byStatus: byStatusCounts,
      revenueByDay,
      ordersByDay,
      statusData,
      recentOrders,
      pipeline,
    }
  }, [orders, revenueRange, ordersRange])


  console.log(orders)

  return (
    <Box color="white" p={8} position="relative">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading size="2xl" fontWeight="black" mb={2} color={theme.text}>Analytics Dashboard</Heading>
          <Text color={theme.textSecondary}>Track your store performance and insights</Text>
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
          theme={theme}
        />
        <StatCard
          title="Total Revenue"
          value={currency(stats.totalRevenue)}
          icon={FiDollarSign}
          color="#10B981"
          loading={loading}
          theme={theme}
        />
        <StatCard
          title="Avg Order Value"
          value={currency(stats.avgOrderValue)}
          icon={FiTrendingUp}
          color="#F59E0B"
          loading={loading}
          theme={theme}
        />
        <StatCard
          title="Completed Orders"
          value={stats.completedOrders}
          icon={FiCheckCircle}
          color="#8B5CF6"
          loading={loading}
          theme={theme}
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
          theme={theme}
        />
        <QuickStatCard
          label="Completed Orders"
          value={stats.completedOrders}
          icon={FiCheckCircle}
          color="#10B981"
          loading={loading}
          theme={theme}
        />
        <QuickStatCard
          label="Cancelled Orders"
          value={stats.cancelledOrders}
          icon={FiXCircle}
          color="#EF4444"
          loading={loading}
          theme={theme}
        />
      </Grid>

      {/* Revenue Trend & Daily Breakdown */}
      <Grid templateColumns={{ base: "1fr", xl: "1.5fr 1fr" }} gap={6} mb={8}>
        {/* Revenue Trend */}
        <Box
          bg={theme.cardBg}
          border="1px solid"
          borderColor={theme.border}
          p={6}
          borderRadius="lg"
          position="relative"
        >
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md" color={theme.text}>Revenue Trend</Heading>

            <Select.Root
              collection={timeRangeOptions}
              value={[revenueRange]}
              onValueChange={(e) => setRevenueRange(e.value[0])}
              size="sm"
              width="150px"
            >
              <Select.HiddenSelect />

              <Select.Control>
                <Select.Trigger
                  bg={theme.inputBg}
                  color={theme.text}
                  h="36px"
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={theme.border}
                  _hover={{ bg: theme.hoverBg }}
                >
                  <Select.ValueText placeholder="Select range" />
                </Select.Trigger>

                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>

              <Portal>
                <Select.Positioner zIndex={20}>
                  <Select.Content
                    bg={theme.inputBg}
                    color={theme.text}
                    border="1px solid"
                    borderColor={theme.border}
                    borderRadius="lg"
                  >
                    {timeRangeOptions.items.map((option) => (
                      <Select.Item
                        key={option.value}
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
          </Flex>

          <Box h="360px">
            <ResponsiveContainer width="100%" height="90%">
              <AreaChart data={stats.revenueByDay}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" stroke={theme.chartStroke} tick={{ fontSize: 12 }} />
                <YAxis stroke={theme.chartStroke} tick={{ fontSize: 12 }} />

                <ChartTooltip
                  contentStyle={{
                    backgroundColor: theme.bg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
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

              <Text mt={2} fontSize="md" color={theme.textSecondary ?? theme.text} textAlign="center">
                {getDataRangeLabel(stats.revenueByDay)}
              </Text>
            </ResponsiveContainer>
          </Box>
        </Box>

        {/* Daily Revenue Details */}
        <Box
          bg={theme.cardBg}
          border="1px solid"
          borderColor={theme.border}
          p={6}
          borderRadius="lg"
          position="relative"
        >
          <Heading size="md" mb={4} color={theme.text}>
            {revenueRange === "180" ? "Weekly Breakdown" : "Daily Breakdown"}
          </Heading>

          <VStack align="stretch" spacing={3} maxH="360px" overflowY="auto">
            {stats.revenueByDay
              .slice()
              .reverse()
              .map((day, idx) => (
                <Box
                  key={idx}
                  p={3}
                  bg={day.orders > 0 ? theme.inputBg : theme.secondaryBg}
                  borderRadius="md"
                  border="1px solid"
                  borderColor={theme.borderLight}
                >
                  <Flex justify="space-between" align="center" mb={1}>
                    <HStack spacing={2}>
                      <Icon as={FiCalendar} boxSize={4} color={theme.textSecondary} />
                      <Text fontSize="sm" fontWeight="semibold" color={theme.text}>
                        {day.fullDate}
                      </Text>
                    </HStack>

                    <Badge
                      bg="#3B82F615"
                      color="#3B82F6"
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

      {/* Card 1: Order Status */}
      <Box
        w="100%"
        bg={theme.cardBg}
        border="1px solid"
        borderColor={theme.border}
        p={6}
        borderRadius="lg"
        mb={8}
        position="relative"
      >
        <Heading size="lg" mb={4} color={theme.text}>
          Order Status
        </Heading>

        <Grid templateColumns={{ base: "1fr", xl: "1fr 1.25fr" }} gap={6}>
          {/* Pie Chart */}
          <Box>
            <Box h={{ base: "280px", md: "320px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={150}
                    dataKey="value"
                  >
                    {stats.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>

                  <ChartTooltip
                    contentStyle={{
                      backgroundColor: theme.bg,
                      border: `1px solid ${theme.border}`,
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    }}
                    labelStyle={{ color: theme.text }}
                    itemStyle={{ color: theme.text }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Box>

          {/* Status Breakdown */}
          <Box>
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={3}>
              {stats.statusData.map((status) => (
                <Box
                  key={status.name}
                  p={4}
                  bg={theme.pageBg}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={theme.border}
                >
                  <Flex justify="space-between" align="start">
                    <Flex flexDir="column" justifyContent="space-between" minH="64px">
                      <Badge
                        bg={`${status.color}15`}
                        color={status.color}
                        border="1px solid"
                        borderColor={`${status.color}30`}
                        px={2}
                        py={1}
                        borderRadius="md"
                        fontSize="xs"
                        fontWeight="semibold"
                      >
                        {status.name}
                      </Badge>

                      <Text fontSize="xs" color={theme.textSecondary ?? theme.text}>
                        {stats.totalOrders > 0
                          ? ((status.value / stats.totalOrders) * 100).toFixed(1)
                          : "0.0"}
                        % of total
                      </Text>
                    </Flex>

                    <Text fontSize="4xl" fontWeight="black" color={status.color}>
                      {status.value}
                    </Text>
                  </Flex>
                </Box>
              ))}
            </Grid>
          </Box>
        </Grid>
      </Box>

      {/* Card 2: Orders Trend + Recent Orders (2-column on md+) */}
      <Box
        w="100%"
        bg={theme.cardBg}
        border="1px solid"
        borderColor={theme.border}
        p={6}
        borderRadius="lg"
        mb={8}
        position="relative"
      >
        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={10}>
          {/* Left: Line chart */}
          <Box>
            <Flex justify="space-between" align="center" mb={4} gap={4} flexWrap="wrap">
              <Heading size="lg" color={theme.text}>
                Orders Trend
              </Heading>

              <Select.Root
                collection={timeRangeOptions}
                value={[ordersRange]}
                onValueChange={(e) => setOrdersRange(e.value[0])}
                size="sm"
                width="150px"
              >
                <Select.HiddenSelect />

                <Select.Control>
                  <Select.Trigger
                    bg={theme.inputBg}
                    color={theme.text}
                    h="36px"
                    borderRadius="lg"
                    border="1px solid"
                    borderColor={theme.border}
                    _hover={{ bg: theme.hoverBg }}
                  >
                    <Select.ValueText placeholder="Select range" />
                  </Select.Trigger>

                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>

                <Portal>
                  <Select.Positioner zIndex={20}>
                    <Select.Content
                      bg={theme.inputBg}
                      color={theme.text}
                      border="1px solid"
                      borderColor={theme.border}
                      borderRadius="lg"
                    >
                      {timeRangeOptions.items.map((option) => (
                        <Select.Item
                          key={option.value}
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
            </Flex>
            <Box h={{ base: "320px", md: "380px" }}>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={stats.ordersByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" stroke={theme.chartStroke} tick={{ fontSize: 12 }} />
                  <YAxis stroke={theme.chartStroke} tick={{ fontSize: 12 }} />

                  <ChartTooltip
                    contentStyle={{
                      backgroundColor: theme.bg,
                      border: `1px solid ${theme.border}`,
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    }}
                    labelStyle={{ color: theme.text }}
                    itemStyle={{ color: theme.text }}
                  />

                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#2563EB"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>

                <Text mt={2} fontSize="md" color={theme.textSecondary ?? theme.text} textAlign="center">
                  {getDataRangeLabel(stats.ordersByDay)}
                </Text>
              </ResponsiveContainer>
            </Box>
          </Box>

          {/* Right: Recent orders */}
          <Box>
            <Heading size="md" mb={4} color={theme.text}>
              Recent Orders
            </Heading>

            {stats.recentOrders.length > 0 ? (
              <VStack
                align="stretch"
                spacing={3}
                maxH={{ base: "320px", md: "348px" }}
                overflowY="auto"
              >
                {stats.recentOrders.map((order) => (
                  <Box
                    key={order.orderId}
                    p={3}
                    bg={theme.inputBg}
                    borderRadius="md"
                    border="1px solid"
                    borderColor={theme.borderLight}
                  >
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontSize="sm" fontWeight="bold" color={theme.text}>
                        Order #{order.orderId}
                      </Text>

                      <Badge
                        bg={`${getStatusColor(order.status)}15`}
                        color={getStatusColor(order.status)}
                        border="1px solid"
                        borderColor={`${getStatusColor(order.status)}30`}
                        px={2}
                        py={0.5}
                        borderRadius="md"
                        fontSize="xs"
                      >
                        {order.status}
                      </Badge>
                    </Flex>

                    <Flex justify="space-between" align="center">
                      <Text fontSize="xs" color={theme.textSecondary ?? theme.text}>
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
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
                <Icon as={FiShoppingBag} boxSize={10} color={theme.textSecondary ?? theme.text} mb={2} />
                <Text color={theme.textSecondary ?? theme.text} fontSize="sm">
                  No orders yet
                </Text>
              </Box>
            )}
          </Box>
        </Grid>
      </Box>

    </Box>
  )
}

/* ---------- Components ---------- */

function StatCard({ title, value, icon, color, loading = false, theme }) {
  return (
    <Box
      bg={theme.cardBg}
      border="1px solid"
      borderColor={theme.border}
      p={6}
      position="relative"
      overflow="hidden"
      transition="all 0.3s"
      _hover={{ borderColor: color }}
      borderRadius="lg"
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
            <Text color={theme.text} fontSize="sm" mb={1}>{title}</Text>
            <Text color={color} fontWeight="black" fontSize="3xl">{value}</Text>
          </Box>
        </VStack>
      </Skeleton>
    </Box>
  )
}

function QuickStatCard({ label, value, icon, color, loading, theme }) {
  return (
    <Box
      bg={theme.cardBg}
      border="1px solid"
      borderColor={theme.border}
      p={4}
      borderRadius="lg"
    >
      <Skeleton loading={loading}>
        <HStack spacing={4}>
          <Box p={3} bg={`${color}20`} borderRadius="lg">
            <Icon as={icon} boxSize={5} color={color} />
          </Box>
          <Box>
            <Text color={theme.text} fontSize="sm">{label}</Text>
            <Text color={color} fontWeight="bold" fontSize="2xl">{value}</Text>
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