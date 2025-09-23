import { useEffect, useState } from 'react'
import { Box, Text, Input, Button, Badge, Tooltip } from '@chakra-ui/react'
import { Flex } from '@chakra-ui/react/flex'
import { adminFetchOrders, adminUpdateOrderStatus } from '../api/admin'
import { ORDER, ALLOWED } from '../../seller/utils/orderFlow'
import OrderActions from '../../components/OrderActions'
import { toaster } from '../../components/ui/toaster'

const StatusBadge = ({ s }) => {
  const palette = {
    PENDING:'gray', PAID:'blue', PROCESSING:'cyan', SHIPPING:'teal',
    DELIVERED:'purple', COMPLETED:'green', CANCELLED:'red', REFUNDED:'orange'
  }[s] || 'gray'
  return <Badge colorPalette={palette} variant="subtle" px={2} py={1} borderRadius="md">{s}</Badge>
}

export default function AdminOrders() {
  const [list, setList] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingFor, setLoadingFor] = useState({}) // { [orderId]: { [status]: bool } }

  const load = async () => {
    setLoading(true)
    try {
      const d = await adminFetchOrders()
      const arr = Array.isArray(d) ? d : (d?.content || [])
      setList([...arr].reverse())
    } finally { setLoading(false) }
  }
  useEffect(()=>{ load() },[])

  const doAction = async (orderId, target) => {
    try {
      setLoadingFor(p => ({ ...p, [orderId]: { ...(p[orderId]||{}), [target]: true }}))
      await adminUpdateOrderStatus(orderId, target, `Admin changed to ${target}`)
      toaster.create({ type:'success', description:`Order #${orderId} → ${target}` })
      await load()
    } catch (e) {
      toaster.create({ type:'error', description: e?.message || 'Không thể cập nhật' })
    } finally {
      setLoadingFor(p => ({ ...p, [orderId]: { ...(p[orderId]||{}), [target]: false }}))
    }
  }

  const filtered = !q ? list : list.filter(o =>
    `${o.orderId}`.includes(q) ||
    (o.customerName || '').toLowerCase().includes(q.toLowerCase())
  )

  return (
    <Box>
      <Flex gap="10px" mb="12px" align="center" wrap="wrap">
        <Input placeholder="Tìm ID / tên khách" value={q} onChange={e=>setQ(e.target.value)} w="280px"/>
        <Button onClick={load} isLoading={loading}>Reload</Button>
      </Flex>

      <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="md" p={2}>
        <Box display="grid" gridTemplateColumns="120px 1fr 160px 220px" py={2} fontWeight="bold" borderBottom="1px solid #eee">
          <Box>ID</Box><Box>Items</Box><Box>Status</Box><Box>Actions</Box>
        </Box>

        {filtered.map(o => {
          const allows = ALLOWED[o.status] || []
          return (
            <Box key={o.orderId} display="grid" gridTemplateColumns="120px 1fr 160px 220px"
                 py={3} borderBottom="1px solid #f5f5f5" alignItems="center">
              <Box>#{o.orderId}<br/><Text color="gray.500" fontSize="sm">{o.createdAt && new Date(o.createdAt).toLocaleString()}</Text></Box>
              <Box>
                {(o.items || []).slice(0,2).map(it => (
                  <Text key={it.id || it.productId} noOfLines={1}>• {it.productName} × {it.quantity}</Text>
                ))}
                {(o.items || []).length > 2 && <Text color="gray.500">…và {(o.items || []).length - 2} dòng nữa</Text>}
                <Text mt={1} fontWeight="bold" color="brand.700">Total: {(o.totalAmount || o.grandTotal || 0).toLocaleString()} ₫</Text>
              </Box>
              <Box><StatusBadge s={o.status} /></Box>
              <Flex>
                <OrderActions
                  status={o.status}
                  onAction={(next)=>doAction(o.orderId, next)}
                  loadingFor={loadingFor[o.orderId] || {}}
                  size="sm"
                  variant="ghost"
                />
              </Flex>
            </Box>
          )
        })}
        {filtered.length === 0 && <Box p={6} textAlign="center" color="gray.500">Không có đơn</Box>}
      </Box>
    </Box>
  )
}
