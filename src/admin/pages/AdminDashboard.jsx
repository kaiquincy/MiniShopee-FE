import { useEffect, useMemo, useState } from 'react'
import { Box, SimpleGrid, Heading, Text, Skeleton, HStack, VStack, Badge, Icon, Tooltip, Separator } from '@chakra-ui/react'
import { Flex } from '@chakra-ui/react/flex'
import { FiShoppingBag, FiTrendingUp, FiUsers, FiPieChart } from 'react-icons/fi'
import { adminFetchOrders, adminFetchUsers } from '../api/admin'

const currency = (n = 0) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(n) || 0)

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
    const total = orders.length
    const revenue = orders.reduce((s, o) => s + (Number(o.grandTotal) || 0), 0)
    const activeUsers = users.length
    const byStatus = orders.reduce((m, o) => ((m[o.status] = (m[o.status] || 0) + 1), m), {})
    return { total, revenue, activeUsers, byStatus }
  }, [orders, users])

  return (
    <Box>
      {console.log('iser' ,users)}

      <Heading size="md" mb="12px">Admin Dashboard</Heading>
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
        <StatCard title="Tổng đơn" value={stats.total} icon={FiShoppingBag} colorPalette="blue" loading={loading}/>
        <StatCard title="Doanh thu" value={currency(stats.revenue)} icon={FiTrendingUp} colorPalette="green" loading={loading}/>
        <StatCard title="Người dùng hoạt động" value={stats.activeUsers} icon={FiUsers} colorPalette="purple" loading={loading}/>
        <StatCard title="Top trạng thái" value={formatStatusShort(stats.byStatus)} icon={FiPieChart} colorPalette="teal" loading={loading}/>
      </SimpleGrid>

      <Box mt={4} bg="white" border="1px solid" borderColor="gray.100" borderRadius="md" p={4}>
        <Text fontWeight="semibold">Phân bố trạng thái</Text>
        <Separator my={3}/>
        <Skeleton loading={loading}>
          <StatusBadges byStatus={stats.byStatus}/>
        </Skeleton>
      </Box>
    </Box>
  )
}

function StatCard({ title, value, icon, colorPalette = 'gray', loading }) {
  return (
    <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="md" p={4}>
      <Skeleton loading={loading}>
        <HStack justify="space-between">
          <VStack align="start" spacing={1}>
            <Text color="gray.500">{title}</Text>
            <Text fontWeight="bold" fontSize="xl">{value}</Text>
          </VStack>
          <Box p="10px" borderRadius="12px" bg={`${colorPalette}.50`} border="1px solid" borderColor={`${colorPalette}.100`}>
            <Icon as={icon} boxSize={5} color={`${colorPalette}.600`} />
          </Box>
        </HStack>
      </Skeleton>
    </Box>
  )
}

function StatusBadges({ byStatus = {} }) {
  const entries = Object.entries(byStatus)
  if (!entries.length) return <Text color="gray.500">—</Text>
  return (
    <HStack wrap="wrap" spacing={2} rowGap={2}>
      {entries.map(([k, v]) => (
        <Badge key={k} colorPalette={pickStatus(k)} variant="soft" px={2} py={1} borderRadius="md">
          {k}: <Box as="span" fontWeight="semibold" ml="4px">{v}</Box>
        </Badge>
      ))}
    </HStack>
  )
}
const pickStatus = (s) => ({
  PENDING:'gray', PAID:'blue', PROCESSING:'cyan', SHIPPING:'teal',
  DELIVERED:'purple', COMPLETED:'green', CANCELLED:'red', REFUNDED:'orange'
}[s] || 'gray')

const formatStatusShort = (m={}) =>
  Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,v])=>`${k}: ${v}`).join(' • ') || '—'
