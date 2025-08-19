import { useEffect, useState } from 'react'
import { listOrders } from '../api/orders'
import { Box, Heading, VStack, HStack, Text, Badge } from '@chakra-ui/react'

export default function Orders() {
  const [orders, setOrders] = useState([])
  useEffect(()=>{ listOrders().then(setOrders) },[])
  return (
    <Box>
      <Heading size="md" mb={4}>Đơn hàng của tôi</Heading>
      <VStack align="stretch" spacing={3}>
        {orders.map(o=>(
          <Box key={o.id} bg="white" p={3} borderRadius="md" className="glass">
            <HStack justify="space-between">
              <HStack><Text>Order #</Text><Text fontWeight="bold">{o.id}</Text></HStack>
              <Badge>{o.status}</Badge>
            </HStack>
            <Text mt={2} color="gray.600">{new Date(o.createdAt).toLocaleString()}</Text>
            <Text mt={2} fontWeight="bold">Tổng: {(o.grandTotal || 0).toLocaleString()} ₫</Text>
          </Box>
        ))}
      </VStack>
    </Box>
  )
}
