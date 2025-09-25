import { useEffect, useMemo, useState } from 'react'
import {
  Box, Text, Input, Button, Badge, HStack, Portal, Dialog , IconButton, Avatar,
  DialogRoot, DialogContent, DialogHeader, DialogTitle, DialogBody,
  DialogFooter, DialogCloseTrigger
} from '@chakra-ui/react'
import { Flex } from '@chakra-ui/react/flex'
import { Icon } from '@chakra-ui/react/icon'
import { FiUserCheck, FiUserX, FiRefreshCcw, FiAlertTriangle, FiInfo } from 'react-icons/fi'
import { adminFetchUsers, adminUpdateUserStatus } from '../api/admin'
import { toaster } from '../../components/ui/toaster'

const STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  DELETED: 'DELETED',
}

const statusColor = (s) => {
  switch (s) {
    case STATUS.ACTIVE: return 'green'
    case STATUS.INACTIVE: return 'gray'
    case STATUS.SUSPENDED: return 'orange'
    case STATUS.DELETED: return 'red'
    default: return 'gray'
  }
}

const fmt = (v) => v ? new Date(v).toLocaleString() : '—'

export default function AdminUsers() {
  const [list, setList] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState({}) // { [userId]: boolean }
  const [detailUser, setDetailUser] = useState(null)
  const [isOpen, setIsOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const d = await adminFetchUsers()
      const arr = Array.isArray(d) ? d : (d?.content || [])
      setList(arr)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const changeStatus = async (u, nextStatus) => {
    try {
      setBusy((p) => ({ ...p, [u.id]: true }))
      await adminUpdateUserStatus(u.id, nextStatus)
      toaster.create({ type: 'success', description: `${u.email} → ${nextStatus}` })
      await load()
    } catch (e) {
      toaster.create({ type: 'error', description: e?.message || 'Không thể cập nhật' })
    } finally {
      setBusy((p) => ({ ...p, [u.id]: false }))
    }
  }

  const toggleActiveInactive = async (u) => {
    if (u.status === STATUS.SUSPENDED || u.status === STATUS.DELETED) return
    const nextStatus = u.status === STATUS.ACTIVE ? STATUS.INACTIVE : STATUS.ACTIVE
    await changeStatus(u, nextStatus)
  }

  const suspendUser = async (u) => {
    if (u.status === STATUS.DELETED || u.status === STATUS.SUSPENDED) return
    await changeStatus(u, STATUS.SUSPENDED)
  }

  const filtered = useMemo(() =>
    !q ? list : list.filter(u =>
      (u.email || '').toLowerCase().includes(q.toLowerCase()) ||
      (u.name || '').toLowerCase().includes(q.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(q.toLowerCase())
    )
  , [q, list])

  const openDetail = (u) => { setDetailUser(u); setIsOpen(true) }
  const closeDetail = () => { setIsOpen(false); setDetailUser(null) }

  return (
    <Box>
      <Flex gap="10px" mb="12px" align="center" wrap="wrap">
        <Input placeholder="Tìm user (email, tên, username)" value={q} onChange={e=>setQ(e.target.value)} w="320px" />
        <Button onClick={load} leftIcon={<Icon as={FiRefreshCcw} />} isLoading={loading}>Reload</Button>
      </Flex>

      <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="md" p={2}>
        <Box display="grid" gridTemplateColumns="60px 1fr 200px 260px" py={2} fontWeight="bold" borderBottom="1px solid #eee">
          <Box>ID</Box><Box>Email</Box><Box>Username</Box><Box>Actions</Box>
        </Box>

        {filtered.map(u => {
          const isBlockedToggle = u.status === STATUS.SUSPENDED || u.status === STATUS.DELETED
          const nextToggleLabel = u.status === STATUS.ACTIVE ? 'Deactivate' : 'Activate'
          const isSuspended = u.status === STATUS.SUSPENDED

          return (
            <Box key={u.id} display="grid" gridTemplateColumns="60px 1fr 200px 260px"
                 py={3} borderBottom="1px solid #f5f5f5" alignItems="center">
              <Box>#{u.id}</Box>
              <Box>
                <Text fontWeight="medium">{u.email}</Text>
                <HStack>
                  <Badge colorPalette={statusColor(u.status)} variant="subtle">
                    {u.status || 'INACTIVE'}
                  </Badge>
                  {u.role && <Badge variant="surface">{u.role}</Badge>}
                </HStack>
              </Box>
              <Box><Text noOfLines={1}>{u.username || '—'}</Text></Box>

              <HStack>
                {/* <Tooltip content={isBlockedToggle ? 'Không thể toggle khi SUSPENDED/DELETED' : nextToggleLabel}> */}
                  <IconButton
                    aria-label="toggle-status"
                    size="sm"
                    variant="outline"
                    isDisabled={isBlockedToggle}
                    isLoading={!!busy[u.id]}
                    onClick={() => toggleActiveInactive(u)}
                  >
                    <Icon as={u.status === STATUS.ACTIVE ? FiUserX : FiUserCheck} />
                  </IconButton>
                {/* </Tooltip> */}

                {/* <Tooltip content={isSuspended ? 'Đã SUSPENDED' : 'Chuyển sang SUSPENDED'}> */}
                  <IconButton
                    aria-label="suspend-user"
                    size="sm"
                    variant={isSuspended ? 'solid' : 'outline'}
                    isDisabled={u.status === STATUS.DELETED || isSuspended}
                    isLoading={!!busy[u.id] && !isBlockedToggle}
                    onClick={() => suspendUser(u)}
                  >
                    <Icon as={FiAlertTriangle} />
                  </IconButton>
                {/* </Tooltip> */}

                {/* <Tooltip content="Xem thông tin"> */}
                  <IconButton
                    aria-label="info-user"
                    size="sm"
                    variant="ghost"
                    onClick={() => openDetail(u)}
                  >
                    <Icon as={FiInfo} />
                  </IconButton>
                {/* </Tooltip> */}
              </HStack>
            </Box>
          )
        })}
        {filtered.length === 0 && <Box p={6} textAlign="center" color="gray.500">Không có user</Box>}
      </Box>

      {/* Dialog chi tiết user (thay cho Modal) */}
      <DialogRoot open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>

            <DialogContent>
              <DialogCloseTrigger />
              <DialogHeader>
                <DialogTitle>Thông tin người dùng</DialogTitle>
              </DialogHeader>
              <DialogBody>
                {detailUser && (
                  <Box>
                    <HStack mb={4} align="center">
                      <Avatar.Root>
                        <Avatar.Fallback name={detailUser.fullName || detailUser.username} />
                        <Avatar.Image src= {detailUser.avatarUrl || "undefined"} />
                      </Avatar.Root>
                      <Box>
                        <Text fontWeight="bold">{detailUser.fullName || '—'}</Text>
                        <HStack>
                          <Badge colorPalette={statusColor(detailUser.status)} variant="subtle">
                            {detailUser.status || 'INACTIVE'}
                          </Badge>
                          {detailUser.role && <Badge variant="surface">{detailUser.role}</Badge>}
                        </HStack>
                      </Box>
                    </HStack>

                    <Box display="grid" gridTemplateColumns="180px 1fr" rowGap="10px" columnGap="12px">
                      <Text color="gray.600">Username</Text><Text>{detailUser.username || '—'}</Text>
                      <Text color="gray.600">Email</Text><Text>{detailUser.email || '—'}</Text>
                      <Text color="gray.600">Full name</Text><Text>{detailUser.fullName || '—'}</Text>
                      <Text color="gray.600">Phone</Text><Text>{detailUser.phone || '—'}</Text>
                      <Text color="gray.600">Date of birth</Text><Text>{fmt(detailUser.dateOfBirth)}</Text>
                      <Text color="gray.600">Created at</Text><Text>{fmt(detailUser.createdAt)}</Text>
                      <Text color="gray.600">Updated at</Text><Text>{fmt(detailUser.updatedAt)}</Text>
                      <Text color="gray.600">Last login</Text><Text>{fmt(detailUser.lastLoginAt)}</Text>
                      {/* <Text color="gray.600">Avatar URL</Text><Text>{detailUser.avatarUrl || '—'}</Text> */}
                    </Box>
                  </Box>
                )}
              </DialogBody>
              <DialogFooter>
                <Button onClick={closeDetail}>Đóng</Button>
              </DialogFooter>
            </DialogContent>

          </Dialog.Positioner>
        </Portal>
      </DialogRoot>
    </Box>
  )
}
