import {
  Badge,
  Box,
  Flex,
  Grid, Heading,
  HStack,
  Icon,
  Separator,
  Skeleton,
  Text,
  VStack
} from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'
import {
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
import { adminFetchOrders, adminFetchUsers } from '../api/admin'

const currency = (n = 0) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(n) || 0)

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899']

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])

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

  const stats = useMemo(() => {
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((s, o) => s + (Number(o.grandTotal) || 0), 0)
    const totalUsers = users.length
    
    const byStatus = orders.reduce((m, o) => {
      m[o.status] = (m[o.status] || 0) + 1
      return m
    }, {})

    const pendingOrders = byStatus['PENDING'] || 0
    const completedOrders = byStatus['COMPLETED'] || 0
    const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0

    // Revenue by day (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return {
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        dateObj: d
      }
    })

    const revenueByDay = last7Days.map(({ date, dateObj }) => {
      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt)
        return (
          orderDate.getDate() === dateObj.getDate() &&
          orderDate.getMonth() === dateObj.getMonth()
        )
      })
      return {
        date,
        revenue: dayOrders.reduce((s, o) => s + (Number(o.grandTotal) || 0), 0),
        orders: dayOrders.length
      }
    })

    // Status distribution for pie chart
    const statusData = Object.entries(byStatus).map(([status, count]) => ({
      name: status,
      value: count,
      color: getStatusColor(status)
    }))

    // User growth (last 30 days)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (29 - i))
      return d
    })

    const usersByDay = last30Days.reduce((acc, date, i) => {
      const usersUpToDate = users.filter(u => {
        const createdDate = new Date(u.createdAt)
        return createdDate <= date
      }).length
      
      if (i % 5 === 0 || i === 29) {
        acc.push({
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          users: usersUpToDate
        })
      }
      return acc
    }, [])

    return { 
      totalOrders, 
      totalRevenue, 
      totalUsers, 
      byStatus, 
      pendingOrders,
      completedOrders,
      avgOrderValue,
      revenueByDay,
      statusData,
      usersByDay
    }
  }, [orders, users])

  return (
    <Box>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading size="2xl" fontWeight="black" mb={2} color="#1E3A8A">Dashboard</Heading>
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
        />
        <StatCard
          title="Total Revenue"
          value={currency(stats.totalRevenue)}
          icon={FiDollarSign}
          color="#10B981"
          loading={loading}
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={FiUsers}
          color="#8B5CF6"
          loading={loading}
        />
        <StatCard
          title="Avg Order Value"
          value={currency(stats.avgOrderValue)}
          icon={FiTrendingUp}
          color="#F59E0B"
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
          label="Active Users"
          value={stats.totalUsers}
          icon={FiUsers}
          color="#3B82F6"
          loading={loading}
        />
      </Grid>

      {/* Charts Grid */}
      <Grid templateColumns={{ base: "1fr", xl: "2fr 1fr" }} gap={6} mb={8}>
        {/* Revenue Trend */}
        <Box bg="white" border="1px solid" borderColor="#E2E8F0" p={6} borderRadius="lg" shadow="sm">
          <Heading size="md" mb={4} color="#1E3A8A">Revenue Trend (Last 7 Days)</Heading>
          <Box h="300px">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenueByDay}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" stroke="#64748B" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 12 }} />
                <ChartTooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E2E8F0',
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
            </ResponsiveContainer>
          </Box>
        </Box>

        {/* Order Status Distribution */}
        <Box bg="white" border="1px solid" borderColor="#E2E8F0" p={6} borderRadius="lg" shadow="sm">
          <Heading size="md" mb={4} color="#1E3A8A">Order Status</Heading>
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
                    backgroundColor: 'white', 
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </Grid>

      {/* Orders & Users Charts */}
      <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={6} mb={8}>
        {/* Orders Per Day */}
        <Box bg="white" border="1px solid" borderColor="#E2E8F0" p={6} borderRadius="lg" shadow="sm">
          <Heading size="md" mb={4} color="#1E3A8A">Orders Per Day</Heading>
          <Box h="300px">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" stroke="#64748B" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 12 }} />
                <ChartTooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="orders" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        {/* User Growth */}
        <Box bg="white" border="1px solid" borderColor="#E2E8F0" p={6} borderRadius="lg" shadow="sm">
          <Heading size="md" mb={4} color="#1E3A8A">User Growth (Last 30 Days)</Heading>
          <Box h="300px">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.usersByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" stroke="#64748B" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 12 }} />
                <ChartTooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E2E8F0',
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
            </ResponsiveContainer>
          </Box>
        </Box>
      </Grid>

      {/* Status Breakdown */}
      <Box bg="white" border="1px solid" borderColor="#E2E8F0" p={6} borderRadius="lg" shadow="sm">
        <Heading size="md" mb={4} color="#1E3A8A">Order Status Breakdown</Heading>
        <Separator borderColor="#E2E8F0" my={4}/>
        <Skeleton loading={loading}>
          <StatusBadges byStatus={stats.byStatus}/>
        </Skeleton>
      </Box>
    </Box>
  )
}

function StatCard({ title, value, icon, color, loading }) {
  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="#E2E8F0"
      p={6}
      borderRadius="lg"
      shadow="sm"
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
        opacity={0.05}
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
            <Text color="#64748B" fontSize="sm" mb={1} fontWeight="medium">{title}</Text>
            <Text fontWeight="black" fontSize="3xl" color="#1E293B">{value}</Text>
          </Box>
        </VStack>
      </Skeleton>
    </Box>
  )
}

function QuickStatCard({ label, value, icon, color, loading }) {
  return (
    <Box bg="white" border="1px solid" borderColor="#E2E8F0" p={5} borderRadius="lg" shadow="sm">
      <Skeleton loading={loading}>
        <HStack spacing={4}>
          <Box p={3} bg={`${color}15`} borderRadius="lg">
            <Icon as={icon} boxSize={5} color={color} />
          </Box>
          <Box>
            <Text color="#64748B" fontSize="sm" fontWeight="medium">{label}</Text>
            <Text fontWeight="bold" fontSize="2xl" color="#1E293B">{value}</Text>
          </Box>
        </HStack>
      </Skeleton>
    </Box>
  )
}

function StatusBadges({ byStatus = {} }) {
  const entries = Object.entries(byStatus)
  if (!entries.length) return <Text color="#64748B">No orders yet</Text>
  return (
    <HStack wrap="wrap" spacing={2} rowGap={2}>
      {entries.map(([k, v]) => {
        const color = getStatusColor(k)
        return (
          <Badge 
            key={k} 
            bg={`${color}15`}
            color={color}
            border="1px solid"
            borderColor={`${color}30`}
            px={3} 
            py={1.5} 
            borderRadius="md"
            fontWeight="semibold"
            fontSize="sm"
          >
            {k}: {v}
          </Badge>
        )
      })}
    </HStack>
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