import { useEffect, useMemo, useState } from 'react'
import { Box, Text, Select, Badge } from '@chakra-ui/react'
import { Flex } from "@chakra-ui/react/flex"
import { Input } from '@chakra-ui/react/input'
import { Button } from '@chakra-ui/react/button'

import { fetchOrders, updateOrderStatus } from '../api/seller'
import { ALLOWED, ORDER } from '../utils/orderFlow'
import { toaster } from '../../components/ui/toaster'
import  OrderActions  from '../../components/OrderActions'
const StatusBadge = ({ s }) => {
  const scheme =
    s === ORDER.CANCELLED  ? 'red'    :
    s === ORDER.PAID       ? 'blue'   :
    s === ORDER.SHIPPING   ? 'teal'   :
    s === ORDER.DELIVERED  ? 'purple' :
    s === ORDER.COMPLETED  ? 'green'  :
    s === ORDER.REFUNDED   ? 'orange' :
    'gray'

  return (
    <Badge colorPalette={scheme} variant="subtle" px={2} py={1} borderRadius="md">
      {s}
    </Badge>
  )
}

export default function SellerOrders() {
  const [list, setList] = useState([])
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)

  // loading theo từng đơn & action để hiện spinner icon
  const [loadingForOrder, setLoadingForOrder] = useState({}) 
  // shape: { [orderId]: { [ORDER.*]: boolean } }

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchOrders({ status: status || undefined, q: q || undefined })
      const arr = Array.isArray(data) ? data : (data?.content || [])
      // Đảo ngược: mới nhất lên trước
      setList([...arr].reverse())
    } finally { setLoading(false) }
  }
  useEffect(()=>{ load() }, [status])

  const doAction = async (orderId, target) => {
    try {
      setLoadingForOrder(prev => ({
        ...prev,
        [orderId]: { ...(prev[orderId] || {}), [target]: true }
      }))
      await updateOrderStatus(orderId, target, `Seller changed to ${target}`)
      toaster.create({ type:'success', description:`Order #${orderId} → ${target}` })
      await load()
    } catch (e) {
      toaster.create({
        type:'error',
        description:`Không thể chuyển trạng thái: ${e?.response?.data?.message || e.message}`
      })
    } finally {
      setLoadingForOrder(prev => ({
        ...prev,
        [orderId]: { ...(prev[orderId] || {}), [target]: false }
      }))
    }
  }

  // (client filter nhanh theo q)
  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase()
    if (!keyword) return list
    return list.filter(o => {
      const hay =
        `${o.orderId}`.toLowerCase() + ' ' +
        (o.customerName || '').toLowerCase() + ' ' +
        (o.items || []).map(it => it.productName).join(' ').toLowerCase()
      return hay.includes(keyword)
    })
  }, [list, q])

  return (
    <Box>
      <Flex gap="10px" mb={3} align="center" wrap="wrap">
        <Input
          placeholder="Tìm theo tên / mã… (client filter)"
          value={q}
          onChange={e=>setQ(e.target.value)}
          w="300px"
        />
        {/* Bật filter theo trạng thái nếu cần */}
        {/* <Select value={status} onChange={e=>setStatus(e.target.value)} w="220px">
          <option value="">Tất cả trạng thái</option>
          {Object.keys(ALLOWED).map(s => <option key={s} value={s}>{s}</option>)}
        </Select> */}
        <Button onClick={load} isLoading={loading}>Reload</Button>
      </Flex>

      <Box bg="white" borderRadius="md" p={2} border="1px solid #eee">
        <Box
          display="grid"
          gridTemplateColumns="120px 1fr 160px 180px"
          py={2}
          fontWeight="bold"
          borderBottom="1px solid #eee"
        >
          <Box>ID</Box><Box>Items</Box><Box>Status</Box><Box>Actions</Box>
        </Box>

        {filtered.map(o => {
          const allows = ALLOWED[o.status] || []
          const perActionLoading = loadingForOrder[o.orderId] || {}
          return (
            <Box
              key={o.orderId}
              display="grid"
              gridTemplateColumns="120px 1fr 160px 180px"
              py={3}
              borderBottom="1px solid #f5f5f5"
              alignItems="center"
              columnGap="12px"
            >
              <Box>
                #{o.orderId}
                <br/>
                <Text color="gray.500" fontSize="sm">
                  {o.createdAt ? new Date(o.createdAt).toLocaleString() : ''}
                </Text>
              </Box>

              <Box>
                {(o.items || []).slice(0,2).map(it => (
                  <Text key={it.id || it.productId} noOfLines={1}>
                    • {it.productName} × {it.quantity}
                  </Text>
                ))}
                {(o.items || []).length > 2 && (
                  <Text color="gray.500">…và {(o.items || []).length - 2} dòng nữa</Text>
                )}
                <Text mt={1} fontWeight="bold" color="brand.700">
                  Total: {(o.totalAmount || 0).toLocaleString()} $
                </Text>
              </Box>

              <Box><StatusBadge s={o.status} /></Box>

              {/* ICON-ONLY actions */}
              <Flex>
                <OrderActions
                  status={o.status}
                  onAction={(next) => doAction(o.orderId, next)}
                  loadingFor={perActionLoading}
                  size="sm"
                  variant="ghost"
                />
              </Flex>
            </Box>
          )
        })}

        {filtered.length === 0 && (
          <Box p={6} textAlign="center" color="gray.500">Chưa có đơn</Box>
        )}
      </Box>
    </Box>
  )
}
