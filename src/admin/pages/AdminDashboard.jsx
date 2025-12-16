import {
  Badge,
  Box,
  createListCollection,
  Flex,
  Grid, Heading,
  HStack,
  Icon,
  Portal,
  Select,
  Skeleton,
  Text,
  VStack
} from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'
import {
  FiCalendar,
  FiCheckCircle, FiClock,
  FiDollarSign,
  FiShoppingBag, FiTrendingUp, FiUsers
} from 'react-icons/fi'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip as ChartTooltip,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis, YAxis
} from 'recharts'
import { useTheme } from '../../context/ThemeContext'
import { adminFetchOrders, adminFetchUsers } from '../api/admin'


const currency = (n = 0) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(n) || 0)

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  
  // Time range states
  const [revenueRange, setRevenueRange] = useState('7')
  const [ordersRange, setOrdersRange] = useState('7')
  const [usersRange, setUsersRange] = useState('30')

  const timeRangeOptions = createListCollection({
    items: [
      { label: 'Last 7 Days', value: '7' },
      { label: 'Last 30 Days', value: '30' },
      { label: 'Last 6 Months', value: '180' },
    ],
  })

  const { theme } = useTheme()

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const od = await adminFetchOrders()
        setOrders(Array.isArray(od) ? od : (od?.content || []))
        const ud = await adminFetchUsers()
        setUsers(Array.isArray(ud) ? ud : (ud?.content || []))
      } finally {
        setLoading(false)
      }
    })()
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
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0)
    const totalUsers = users.length
    
    const byStatus = orders.reduce((m, o) => {
      m[o.status] = (m[o.status] || 0) + 1
      return m
    }, {})

    const pendingOrders = byStatus['PENDING'] || 0
    const completedOrders = byStatus['COMPLETED'] || 0
    const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0

    // Helper function to generate date ranges
    const generateDateRange = (days) => {
      return Array.from({ length: parseInt(days) }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (days - 1 - i))
        return {
          date: days <= 30 ? `${d.getMonth() + 1}/${d.getDate()}` : `${d.getMonth() + 1}/${d.getDate()}`,
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
          const startDate = chunk[0].dateObj
          const endDate = chunk[chunk.length - 1].dateObj
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
    const revenueGroups = revenueDays === 180 ? groupByInterval(revenueDateRange, 7) : 
                          revenueDateRange.map(d => ({ dates: [d], label: d.date, fullDate: d.fullDate, startDate: d.dateObj, endDate: d.dateObj }))

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

    // User growth by selected range
    const usersDays = parseInt(usersRange)
    const userDateRange = generateDateRange(usersDays)
    const userGroups = usersDays === 180 ? groupByInterval(userDateRange, 7) : 
                       userDateRange.filter((d, i) => usersDays <= 30 || i % 5 === 0 || i === userDateRange.length - 1)
                       .map(d => ({ dates: [d], label: d.date, fullDate: d.fullDate, startDate: d.dateObj, endDate: d.dateObj }))

    const usersByDay = userGroups.map(({ label, fullDate, startDate, endDate }) => {
      const usersUpToDate = users.filter(u => {
        if (!u.createdAt) return false
        const createdDate = new Date(u.createdAt)
        return createdDate <= endDate
      }).length
      
      const newUsersInPeriod = users.filter(u => {
        if (!u.createdAt) return false
        const createdDate = new Date(u.createdAt)
        return createdDate >= startDate && createdDate <= endDate
      })
      
      return {
        date: label,
        fullDate,
        dateObj: startDate,
        users: usersUpToDate,
        newUsers: newUsersInPeriod
      }
    })

    // Recent orders (last 5)
    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)

    // Recent users (last 5)
    const recentUsers = [...users]
      .filter(u => u.createdAt)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)

    return { 
      totalOrders, 
      totalRevenue, 
      totalUsers, 
      byStatus, 
      pendingOrders,
      completedOrders,
      avgOrderValue,
      revenueByDay,
      ordersByDay,
      statusData,
      usersByDay,
      recentOrders,
      recentUsers
    }
  }, [orders, users, revenueRange, ordersRange, usersRange])

  return (
    <Box>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading size="2xl" fontWeight="black" mb={2} color={theme.text}>Dashboard</Heading>
          <Text color="#64748B">Welcome to the admin control center</Text>
        </Box>
      </Flex>

      {/* Main Stats */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={6} mb={8}>
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={FiShoppingBag}
          color="#3B82F6"
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
          title="Total Users"
          value={stats.totalUsers}
          icon={FiUsers}
          color="#8B5CF6"
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
          label="Active Users"
          value={stats.totalUsers}
          icon={FiUsers}
          color="#3B82F6"
          loading={loading}
          theme={theme}
        />
      </Grid>

      {/* Revenue Trend & Details */}
      <Grid templateColumns={{ base: "1fr", xl: "1.5fr 1fr" }} gap={6} mb={8}>
        <Box bg={theme.cardBg} border="1px solid" borderColor={theme.border} p={6} borderRadius="lg" >
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
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" stroke={theme.chartStroke} tick={{ fontSize: 12 }} />
                <YAxis stroke={theme.chartStroke} tick={{ fontSize: 12 }} />
                <ChartTooltip 
                  contentStyle={{ 
                    backgroundColor: theme.bg, 
                    border: `1px solid ${theme.border}`,
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
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
        <Box bg={theme.cardBg} border="1px solid" borderColor={theme.border} p={6} borderRadius="lg" >
          <Heading size="md" mb={4} color={theme.text}>
            {revenueRange === '180' ? 'Weekly Breakdown' : 'Daily Breakdown'}
          </Heading>
          <VStack align="stretch" spacing={3} maxH="360px" overflowY="auto">
            {stats.revenueByDay.slice().reverse().map((day, idx) => (
              <Box 
                key={idx}
                p={3}
                bg={day.orders > 0 ? theme.inputBg : theme.secondaryBg }
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

      {/* Order Status (merged card) */}
      <Box
        w="100%"
        bg={theme.cardBg}
        border="1px solid"
        borderColor={theme.border}
        p={6}
        borderRadius="lg"
        mb={8}
      >
        <Heading size="lg" mb={4} color={theme.text}>
          Order Status
        </Heading>

        {/* responsive: pie left + stats right; stack on small screens */}
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
                        {((status.value / stats.totalOrders) * 100).toFixed(1)}% of total
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

      {/* Orders Per Day & Recent Orders */}
      <Grid templateColumns={{ base: "1fr", xl: "1.5fr 1fr" }} gap={6} mb={8}>
        {/* Orders Per Day Chart */}
        <Box bg={theme.cardBg} border="1px solid" borderColor={theme.border} p={6} borderRadius="lg" >
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md" color={theme.text}>Orders Per Day</Heading>
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
          <Box
            h="350px" 
            px={{ base: 2, md: 6 }}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Box w="100%" h="100%">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.ordersByDay}
                  margin={{ top: 20, right: 20, left: 10, bottom: 10 }} // ✅ more plot area
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" stroke={theme.chartStroke} tick={{ fontSize: 12 }} />
                  <YAxis stroke={theme.chartStroke} tick={{ fontSize: 12 }} />

                  <ChartTooltip
                    cursor={{ fill: theme.hoverBg, fillOpacity: 0.5 }}
                    contentStyle={{
                      backgroundColor: theme.cardBg,
                      border: `1px solid ${theme.border}`,
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    }}
                  />

                  <Bar dataKey="orders" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
                <Text mt={2} fontSize="md" color={theme.textSecondary ?? theme.text} textAlign="center">
                  {getDataRangeLabel(stats.ordersByDay)}
                </Text>
              </ResponsiveContainer>
            </Box>
          </Box>
        </Box>

        {/* Recent Orders */}
        <Box bg={theme.cardBg} border="1px solid" borderColor={theme.border} p={6} borderRadius="lg" >
          <Heading size="md" mb={4} color={theme.text}>Recent Orders</Heading>
          {stats.recentOrders.length > 0 ? (
            <VStack align="stretch" spacing={3}>
              {stats.recentOrders.map((order) => (
                <Box
                  key={order.orderId}
                  p={4}
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
                    <Text fontSize="xs" color={theme.textSecondary}>
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
              <Icon as={FiShoppingBag} boxSize={10} color="#E2E8F0" mb={2} />
              <Text color="#64748B" fontSize="sm">No orders yet</Text>
            </Box>
          )}
        </Box>
      </Grid>

      {/* User Growth & Recent Users */}
      <Grid templateColumns={{ base: "1fr", xl: "1fr 1fr" }} gap={6} mb={8}>
        {/* User Growth Chart */}
        <Box bg={theme.cardBg} border="1px solid" borderColor={theme.border} p={6} borderRadius="lg" >
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md" color={theme.text}>User Growth</Heading>
            <Select.Root 
              collection={timeRangeOptions}
              value={[usersRange]}
              onValueChange={(e) => setUsersRange(e.value[0])}
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
              <LineChart data={stats.usersByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" stroke={theme.chartStroke} tick={{ fontSize: 12 }} />
                <YAxis stroke={theme.chartStroke} tick={{ fontSize: 12 }} />
                <ChartTooltip 
                  contentStyle={{ 
                    backgroundColor: theme.cardBg, 
                    border: `1px solid ${theme.border}`,
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
              <Text mt={2} fontSize="md" color={theme.textSecondary ?? theme.text} textAlign="center">
                {getDataRangeLabel(stats.usersByDay)}
              </Text>
            </ResponsiveContainer>
          </Box>
        </Box>

        {/* Recent Users */}
        <Box bg={theme.cardBg} border="1px solid" borderColor={theme.border} p={6} borderRadius="lg" >
          <Heading size="md" mb={4} color={theme.text}>Recent Users</Heading>
          {stats.recentUsers.length > 0 ? (
            <VStack align="stretch" spacing={3}>
              {stats.recentUsers.map((user) => (
                <Box
                  key={user.id}
                  p={3}
                  bg={theme.pageBg}
                  borderRadius="md"
                  border="1px solid"
                  borderColor={theme.borderLight}
                >
                  <Flex justify="space-between" align="start" mb={2}>
                    <Box>
                      <Text fontSize="md" fontWeight="bold" color={theme.text}>
                        {user.fullName || user.username}
                      </Text>
                      <Text fontSize="sm" color={theme.textSecondary}>
                        @{user.username}
                      </Text>
                    </Box>
                    <Badge 
                      bg={user.role === 'ADMIN' ? '#EF444415' : '#3B82F615'}
                      color={user.role === 'ADMIN' ? '#EF4444' : '#3B82F6'}
                      px={3}
                      py={1}
                      borderRadius="md"
                      fontSize="sm"
                      fontWeight="bold"
                    >
                      {user.role}
                    </Badge>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <Text fontSize="xs" color={theme.textMuted}>
                      {user.email}
                    </Text>
                    <Text fontSize="xs" color={theme.textMuted}>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                        month: 'short',
                        day: 'numeric'
                      }) : 'N/A'}
                    </Text>
                  </Flex>
                </Box>
              ))}
            </VStack>
          ) : (
            <Box textAlign="center" py={8}>
              <Icon as={FiUsers} boxSize={10} color="#E2E8F0" mb={2} />
              <Text color="#64748B" fontSize="sm">No users yet</Text>
            </Box>
          )}
        </Box>
      </Grid>
    </Box>
  )
}

function StatCard({ title, value, icon, color, loading, theme }) {
  return (
    <Box
      bg={theme.cardBg}
      border="1px solid"
      borderColor={theme.border}
      p={6}
      borderRadius="lg"
      
      position="relative"
      overflow="hidden"
      transition="all 0.3s"
      _hover={{ shadow: "md", borderColor: color }}
    >
      <Box
        position="absolute"
        top="-50%"
        right="-30%"
        w="150px"
        h="150px"
        bg={color}
        opacity={0.25}
        filter="blur(40px)"
        pointerEvents="none"
      />
      <Skeleton loading={loading}>
        <VStack align="start" spacing={3} position="relative">
          <HStack justify="space-between" w="full">
            <Box p={3} bg={`${color}15`} borderRadius="lg">
              <Icon as={icon} boxSize={6} color={color} />
            </Box>
          </HStack>
          <Box>
            <Text color={theme.textSecondary} fontSize="sm" mb={1} fontWeight="medium">{title}</Text>
            <Text fontWeight="black" fontSize="3xl" color={theme.text}>{value}</Text>
          </Box>
        </VStack>
      </Skeleton>
    </Box>
  )
}

function QuickStatCard({ label, value, icon, color, loading, theme }) {
  return (
    <Box bg={theme.cardBg} border="1px solid" borderColor={theme.border} p={5} borderRadius="lg" >
      <Skeleton loading={loading}>
        <HStack spacing={4}>
          <Box p={3} bg={`${color}15`} borderRadius="lg">
            <Icon as={icon} boxSize={5} color={color} />
          </Box>
          <Box>
            <Text color={theme.textSecondary} fontSize="sm" fontWeight="medium">{label}</Text>
            <Text fontWeight="bold" fontSize="2xl" color={theme.text}>{value}</Text>
          </Box>
        </HStack>
      </Skeleton>
    </Box>
  )
}

function getStatusColor(status) {
  const colors = {
    PENDING: '#F59E0B',
    PAID: '#3B82F6',
    PROCESSING: '#06B6D4',
    SHIPPING: '#14B8A6',
    DELIVERED: '#8B5CF6',
    COMPLETED: '#10B981',
    CANCELLED: '#EF4444',
    REFUNDED: '#F59E0B'
  }
  return colors[status] || '#64748B'
}