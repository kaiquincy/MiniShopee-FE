import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  Text,
  Tooltip
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { FiCheck, FiPower, FiRefreshCcw, FiRotateCcw, FiX } from 'react-icons/fi'
import { toaster } from '../../components/ui/toaster'
import { adminFetchProducts, adminUpdateProductStatus } from '../api/admin'

const STATUS_META = {
  ACTIVE:     { label: 'Active',     color: 'green' },
  INACTIVE:   { label: 'Inactive',   color: 'gray'  },
  DELETED:    { label: 'Deleted',    color: 'red'   },
  PROCESSING: { label: 'Processing', color: 'yellow'},
  REJECTED:   { label: 'Rejected',   color: 'red'   },
  FAILED:     { label: 'Failed',     color: 'red'   },
}

export default function AdminProducts() {
  const [list, setList] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState({}) // busy by productId

  const load = async () => {
    setLoading(true)
    try {
      const d = await adminFetchProducts()
      const result = d?.result ?? d
      const arr = Array.isArray(result) ? result : Array.isArray(result?.content) ? result.content : []
      setList(arr)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const setStatus = async (p, nextStatus) => {
    try {
      setBusy(b => ({ ...b, [p.id]: true }))
      await adminUpdateProductStatus(p.id, nextStatus)
      toaster.create({ type: 'success', description: `${p.name} → ${nextStatus}` })
      await load()
    } catch (e) {
      toaster.create({ type: 'error', description: e?.message || 'Không thể cập nhật' })
    } finally {
      setBusy(b => ({ ...b, [p.id]: false }))
    }
  }

  const getActions = (p) => {
    const s = p.status

    // DELETED thường không cho action
    if (s === 'DELETED') return []

    // PROCESSING: có 2 nút Active + Rejected
    if (s === 'PROCESSING') {
      return [
        {
          key: 'approve',
          label: 'Duyệt',
          icon: FiCheck,
          next: 'ACTIVE',
        },
        {
          key: 'reject',
          label: 'Từ chối',
          icon: FiX,
          next: 'REJECTED',
        },
      ]
    }

    // ACTIVE <-> INACTIVE
    if (s === 'ACTIVE') {
      return [
        {
          key: 'deactivate',
          label: 'Tạm ngưng',
          icon: FiPower,
          next: 'INACTIVE',
        },
      ]
    }

    if (s === 'INACTIVE') {
      return [
        {
          key: 'activate',
          label: 'Kích hoạt',
          icon: FiPower,
          next: 'ACTIVE',
        },
      ]
    }

    // REJECTED/FAILED: tuỳ chính sách, ví dụ cho duyệt lại (PROCESSING)
    if (s === 'REJECTED' || s === 'FAILED') {
      return [
        {
          key: 'reprocess',
          label: 'Duyệt lại',
          icon: FiRotateCcw,
          next: 'PROCESSING',
        },
      ]
    }

    return []
  }

  const filtered = !q
    ? list
    : list.filter(p => (p.name || '').toLowerCase().includes(q.toLowerCase()))

  return (
    <Box>
      <Flex gap="10px" mb="12px" align="center" wrap="wrap">
        <Input placeholder="Tìm sản phẩm" value={q} onChange={e => setQ(e.target.value)} w="300px" />
        <Button onClick={load} leftIcon={<Icon as={FiRefreshCcw} />} isLoading={loading}>
          Reload
        </Button>
      </Flex>

      <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="md" p={2}>
        <Box display="grid" gridTemplateColumns="80px 1fr 160px 220px" py={2} fontWeight="bold" borderBottom="1px solid #eee">
          <Box>ID</Box><Box>Name</Box><Box>Status</Box><Box>Actions</Box>
        </Box>

        {filtered.map(p => {
          const meta = STATUS_META[p.status] || { label: p.status, color: 'gray' }
          const actions = getActions(p)

          return (
            <Box
              key={p.id}
              display="grid"
              gridTemplateColumns="80px 1fr 160px 220px"
              py={3}
              borderBottom="1px solid #f5f5f5"
              alignItems="center"
            >
              <Box>#{p.id}</Box>

              <Text noOfLines={1}>{p.name}</Text>

              <Badge colorPalette={meta.color} variant="subtle">
                {meta.label}
              </Badge>

              <HStack>
                {actions.length === 0 ? (
                  <Text color="gray.400" fontSize="sm">—</Text>
                ) : actions.map(a => (
                  <Tooltip.Root key={a.key}>
                    <Tooltip.Trigger asChild>
                      <IconButton
                        aria-label={a.key}
                        size="sm"
                        variant="outline"
                        isLoading={!!busy[p.id]}
                        onClick={() => setStatus(p, a.next)}
                      >
                        <Icon as={a.icon} />
                      </IconButton>
                    </Tooltip.Trigger>
                    <Tooltip.Positioner>
                      <Tooltip.Content>{a.label}</Tooltip.Content>
                    </Tooltip.Positioner>
                  </Tooltip.Root>
                ))}
              </HStack>
            </Box>
          )
        })}

        {filtered.length === 0 && (
          <Box p={6} textAlign="center" color="gray.500">Không có sản phẩm</Box>
        )}
      </Box>
    </Box>
  )
}
