import { useEffect, useState } from 'react'
import { Box, Text, Input, Button, Badge, HStack, Tooltip, IconButton } from '@chakra-ui/react'
import { Flex } from '@chakra-ui/react/flex'
import { Icon } from '@chakra-ui/react/icon'
import { FiEye, FiEyeOff, FiRefreshCcw } from 'react-icons/fi'
import { adminFetchProducts, adminToggleProductVisible } from '../api/admin'
import { toaster } from '../../components/ui/toaster'

export default function AdminProducts() {
  const [list, setList] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState({})

  const load = async () => {
    setLoading(true)
    try {
      const d = await adminFetchProducts()
      const arr = Array.isArray(d) ? d : (d?.content || [])
      setList(arr)
    } finally { setLoading(false) }
  }
  useEffect(()=>{ load() }, [])

  const toggle = async (p) => {
    try {
      setBusy(b => ({ ...b, [p.id]: true }))
      await adminToggleProductVisible(p.id, !p.visible)
      toaster.create({ type:'success', description:`${p.name} → ${!p.visible ? 'Visible' : 'Hidden'}` })
      await load()
    } catch (e) {
      toaster.create({ type:'error', description: e?.message || 'Không thể cập nhật' })
    } finally {
      setBusy(b => ({ ...b, [p.id]: false }))
    }
  }

  const filtered = !q ? list : list.filter(p => (p.name||'').toLowerCase().includes(q.toLowerCase()))

  return (
    <Box>
      <Flex gap="10px" mb="12px" align="center" wrap="wrap">
        <Input placeholder="Tìm sản phẩm" value={q} onChange={e=>setQ(e.target.value)} w="300px"/>
        <Button onClick={load} leftIcon={<Icon as={FiRefreshCcw} />} isLoading={loading}>Reload</Button>
      </Flex>

      <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="md" p={2}>
        <Box display="grid" gridTemplateColumns="80px 1fr 140px 120px" py={2} fontWeight="bold" borderBottom="1px solid #eee">
          <Box>ID</Box><Box>Tên</Box><Box>Trạng thái</Box><Box>Actions</Box>
        </Box>

        {filtered.map(p => (
          <Box key={p.id} display="grid" gridTemplateColumns="80px 1fr 140px 120px"
               py={3} borderBottom="1px solid #f5f5f5" alignItems="center">
            <Box>#{p.id}</Box>
            <Text noOfLines={1}>{p.name}</Text>
            <Badge colorPalette={p.visible ? 'green' : 'gray'} variant="subtle">
              {p.visible ? 'Visible' : 'Hidden'}
            </Badge>
            <HStack>
              <Tooltip content={p.visible ? 'Ẩn' : 'Hiện'}>
                <IconButton
                  aria-label="toggle-visible"
                  size="sm"
                  variant="outline"
                  isLoading={!!busy[p.id]}
                  onClick={() => toggle(p)}
                >
                  <Icon as={p.visible ? FiEyeOff : FiEye} />
                </IconButton>
              </Tooltip>
            </HStack>
          </Box>
        ))}
        {filtered.length === 0 && <Box p={6} textAlign="center" color="gray.500">Không có sản phẩm</Box>}
      </Box>
    </Box>
  )
}
