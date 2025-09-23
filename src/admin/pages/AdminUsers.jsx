import { useEffect, useState } from 'react'
import { Box, Text, Input, Button, Badge, HStack, Tooltip, IconButton } from '@chakra-ui/react'
import { Flex } from '@chakra-ui/react/flex'
import { Icon } from '@chakra-ui/react/icon'
import { FiUserCheck, FiUserX, FiRefreshCcw } from 'react-icons/fi'
import { adminFetchUsers, adminToggleUserActive } from '../api/admin'
import { toaster } from '../../components/ui/toaster'

export default function AdminUsers() {
  const [list, setList] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState({}) // { userId: bool }

  const load = async () => {
    setLoading(true)
    try {
      const d = await adminFetchUsers()
      const arr = Array.isArray(d) ? d : (d?.content || [])
      setList(arr)
    } finally { setLoading(false) }
  }
  useEffect(()=>{ load() }, [])

  const toggle = async (u) => {
    try {
      setBusy(p => ({ ...p, [u.id]: true }))
      await adminToggleUserActive(u.id, !u.active)
      toaster.create({ type:'success', description:`${u.email} → ${!u.active ? 'Active' : 'Inactive'}` })
      await load()
    } catch (e) {
      toaster.create({ type:'error', description: e?.message || 'Không thể cập nhật' })
    } finally {
      setBusy(p => ({ ...p, [u.id]: false }))
    }
  }

  const filtered = !q ? list : list.filter(u =>
    (u.email||'').toLowerCase().includes(q.toLowerCase()) ||
    (u.name||'').toLowerCase().includes(q.toLowerCase())
  )

  return (
    <Box>
      <Flex gap="10px" mb="12px" align="center" wrap="wrap">
        <Input placeholder="Tìm user (email, tên)" value={q} onChange={e=>setQ(e.target.value)} w="300px"/>
        <Button onClick={load} leftIcon={<Icon as={FiRefreshCcw} />} isLoading={loading}>Reload</Button>
      </Flex>

      <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="md" p={2}>
        <Box display="grid" gridTemplateColumns="60px 1fr 200px 120px" py={2} fontWeight="bold" borderBottom="1px solid #eee">
          <Box>ID</Box><Box>Email</Box><Box>Tên</Box><Box>Actions</Box>
        </Box>

        {filtered.map(u => (
          <Box key={u.id} display="grid" gridTemplateColumns="60px 1fr 200px 120px"
               py={3} borderBottom="1px solid #f5f5f5" alignItems="center">
            <Box>#{u.id}</Box>
            <Box>
              <Text fontWeight="medium">{u.email}</Text>
              <HStack>
                <Badge colorPalette={u.active ? 'green' : 'gray'} variant="subtle">
                  {u.active ? 'Active' : 'Inactive'}
                </Badge>
                {u.role && <Badge variant="surface">{u.role}</Badge>}
              </HStack>
            </Box>
            <Box><Text noOfLines={1}>{u.name || '—'}</Text></Box>
            <HStack>
              <Tooltip content={u.active ? 'Deactivate' : 'Activate'}>
                <IconButton
                  aria-label="toggle-active"
                  size="sm"
                  variant="outline"
                  isLoading={!!busy[u.id]}
                  onClick={() => toggle(u)}
                >
                  <Icon as={u.active ? FiUserX : FiUserCheck} />
                </IconButton>
              </Tooltip>
            </HStack>
          </Box>
        ))}
        {filtered.length === 0 && <Box p={6} textAlign="center" color="gray.500">Không có user</Box>}
      </Box>
    </Box>
  )
}
