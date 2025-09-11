import { useEffect, useMemo, useState } from 'react'
import { Box, Text, Select } from '@chakra-ui/react'
import { Flex } from "@chakra-ui/react/flex"
import { Input } from '@chakra-ui/react/input'
import { Button } from '@chakra-ui/react/button'

import { fetchOrders, updateOrderStatus } from '../api/seller'
import { ALLOWED } from '../utils/orderFlow'
import { toaster } from '../../components/ui/toaster'


const StatusBadge = ({ s }) => (
  <span style={{
    padding: '4px 8px', borderRadius: 8,
    background: '#f6f7fb', border: '1px solid #eee', fontSize: 12
  }}>{s}</span>
)

export default function SellerOrders() {
  const [list, setList] = useState([])
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchOrders({ status: status || undefined, q: q || undefined })
      setList(Array.isArray(data) ? data : (data?.content || []))
    } finally { setLoading(false) }
  }
  useEffect(()=>{ load() }, [status])

  const doAction = async (orderId, target) => {
    try {
      await updateOrderStatus(orderId, target, `Seller changed to ${target}`)
      toaster.create({ type:'success', description:`Order #${orderId} → ${target}` })
      load()
    } catch (e) {
      toaster.create({ type:'error', description:`Không thể chuyển trạng thái: ${e?.response?.data?.message || e.message}` })
    }
  }

  return (
    <Box>
      <Flex>
        <Input placeholder="Tìm theo tên / mã… (client filter)" value={q} onChange={e=>setQ(e.target.value)} w="300px"/>
        {/* <Select.Root value={status} onChange={e=>setStatus(e.target.value)} w="220px">
          <option value="">Tất cả trạng thái</option>
          {Object.keys(ALLOWED).map(s => <option key={s} value={s}>{s}</option>)}
        </Select.Root> */}
        <Button onClick={load} isLoading={loading}>Reload</Button>
      </Flex>

      <Box bg="white" borderRadius="md" p={2} border="1px solid #eee">
        <Box display="grid" gridTemplateColumns="120px 1fr 160px 220px" py={2} fontWeight="bold" borderBottom="1px solid #eee">
          <Box>ID</Box><Box>Items</Box><Box>Status</Box><Box>Actions</Box>
        </Box>

        {list.map(o => {
          const allows = ALLOWED[o.status] || []
          return (
            <Box key={o.orderId} display="grid" gridTemplateColumns="120px 1fr 160px 220px"
                 py={3} borderBottom="1px solid #f5f5f5" alignItems="center">
              <Box>#{o.orderId}<br/><Text color="gray.500" fontSize="sm">{new Date(o.createdAt).toLocaleString()}</Text></Box>
              <Box>
                {(o.items || []).slice(0,2).map(it => (
                  <Text key={it.id} noOfLines={1}>• {it.productName} × {it.quantity}</Text>
                ))}
                {(o.items || []).length > 2 && <Text color="gray.500">…và {(o.items || []).length - 2} dòng nữa</Text>}
                <Text mt={1} fontWeight="bold" color="brand.700">Total: {(o.totalAmount || 0).toLocaleString()} $</Text>
              </Box>
              <Box><StatusBadge s={o.status} /></Box>
              <Flex >
                {allows.map(t => (
                  <Button key={t} size="sm" onClick={()=>doAction(o.orderId, t)}>{t}</Button>
                ))}
              </Flex>
            </Box>
          )
        })}
        {list.length===0 && <Box p={6} textAlign="center" color="gray.500">Chưa có đơn</Box>}
      </Box>
    </Box>
  )
}
