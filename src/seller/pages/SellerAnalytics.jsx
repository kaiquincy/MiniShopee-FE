import { useEffect, useState } from 'react'
import { Box, SimpleGrid, Heading, Text } from '@chakra-ui/react'
import { fetchOrders } from '../api/seller'

export default function SellerAnalytics() {
  const [orders, setOrders] = useState([])
  useEffect(()=>{ fetchOrders().then(d=> setOrders(Array.isArray(d)?d:(d?.content||[]))) },[])
  const total = orders.reduce((s,o)=> s + (o.grandTotal || 0), 0)
  const byStatus = orders.reduce((m,o)=> (m[o.status]=(m[o.status]||0)+1, m), {})

  return (
    <Box>
      <Heading size="md" mb={4}>Tổng quan</Heading>
      <SimpleGrid columns={{base:1, md:3}} spacing={4}>
        <StatCard title="Tổng đơn" value={orders.length}/>
        <StatCard title="Doanh thu ước tính" value={(total).toLocaleString() + ' ₫'}/>
        <StatCard title="Trạng thái" value={Object.entries(byStatus).map(([k,v])=>`${k}:${v}`).join('  •  ') || '—'}/>
      </SimpleGrid>
    </Box>
  )
}

function StatCard({ title, value }) {
  return (
    <Box bg="white" borderRadius="md" p={4} border="1px solid #eee">
      <Text color="gray.500" mb={2}>{title}</Text>
      <Text fontWeight="bold" fontSize="xl">{value}</Text>
    </Box>
  )
}
