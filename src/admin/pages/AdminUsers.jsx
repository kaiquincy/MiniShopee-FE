import {
  Avatar,
  Badge,
  Box,
  Button,
  Dialog,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  Portal,
  Text,
  VStack
} from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'
import { FiAlertTriangle, FiInfo, FiRefreshCcw, FiSearch, FiUserCheck, FiUsers, FiUserX } from 'react-icons/fi'
import { toaster } from '../../components/ui/toaster'
import { useTheme } from '../../context/ThemeContext'
import { adminFetchUsers, adminUpdateUserStatus } from '../api/admin'

const STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  DELETED: 'DELETED',
}

const statusColor = (s) => {
  switch (s) {
    case STATUS.ACTIVE: return '#10B981'
    case STATUS.INACTIVE: return '#6B7280'
    case STATUS.SUSPENDED: return '#F59E0B'
    case STATUS.DELETED: return '#EF4444'
    default: return '#6B7280'
  }
}

const fmt = (v) => v ? new Date(v).toLocaleString() : '—'

export default function AdminUsers() {
  const [list, setList] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState({})
  const [detailUser, setDetailUser] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const { theme } = useTheme()

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
      toaster.create({ type: 'error', description: e?.message || 'Cannot update status' })
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

  const stats = useMemo(() => {
    const total = list.length
    const active = list.filter(u => u.status === STATUS.ACTIVE).length
    const inactive = list.filter(u => u.status === STATUS.INACTIVE).length
    const suspended = list.filter(u => u.status === STATUS.SUSPENDED).length
    return { total, active, inactive, suspended }
  }, [list])

  const openDetail = (u) => { setDetailUser(u); setIsOpen(true) }
  const closeDetail = () => { setIsOpen(false); setDetailUser(null) }

  return (
    <Box>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading size="2xl" fontWeight="black" mb={2} color={theme.text}>Users</Heading>
          <Text color={theme.textSecondary}>Manage user accounts and permissions</Text>
        </Box>
      </Flex>

      {/* Stats Cards */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={6} mb={6}>
        <Box bg={theme.cardBg} border="1px solid" borderColor={theme.border} p={5} borderRadius="lg" shadow="sm">
          <HStack gap={5}>
            <Box p={3} bg="#3B82F615" borderRadius="lg">
              <Icon as={FiUsers} boxSize={5} color="#3B82F6" />
            </Box>
            <Box>
              <Text color={theme.text} fontSize="md" fontWeight="medium">Total Users</Text>
              <Text fontWeight="bold" fontSize="2xl" color="#3B82F6">{stats.total}</Text>
            </Box>
          </HStack>
        </Box>

        <Box bg={theme.cardBg} border="1px solid" borderColor={theme.border} p={5} borderRadius="lg" shadow="sm">
          <HStack gap={5}>
            <Box p={3} bg="#10B98115" borderRadius="lg">
              <Icon as={FiUserCheck} boxSize={5} color="#10B981" />
            </Box>
            <Box>
              <Text color={theme.text} fontSize="md" fontWeight="medium">Active</Text>
              <Text fontWeight="bold" fontSize="2xl" color="#10B981">{stats.active}</Text>
            </Box>
          </HStack>
        </Box>

        <Box bg={theme.cardBg} border="1px solid" borderColor={theme.border} p={5} borderRadius="lg" shadow="sm">
          <HStack gap={5}>
            <Box p={3} bg="#6B728015" borderRadius="lg">
              <Icon as={FiUserX} boxSize={5} color="#6B7280" />
            </Box>
            <Box>
              <Text color={theme.text} fontSize="md" fontWeight="medium">Inactive</Text>
              <Text fontWeight="bold" fontSize="2xl" color="#6B7280">{stats.inactive}</Text>
            </Box>
          </HStack>
        </Box>

        <Box bg={theme.cardBg} border="1px solid" borderColor={theme.border} p={5} borderRadius="lg" shadow="sm">
          <HStack gap={5}>
            <Box p={3} bg="#F59E0B15" borderRadius="lg">
              <Icon as={FiAlertTriangle} boxSize={5} color="#F59E0B" />
            </Box>
            <Box>
              <Text color={theme.text} fontSize="md" fontWeight="medium">Suspended</Text>
              <Text fontWeight="bold" fontSize="2xl" color="#F59E0B">{stats.suspended}</Text>
            </Box>
          </HStack>
        </Box>
      </Grid>

      {/* Search Bar */}
      <Flex gap={3} mb={6} bg={theme.cardBg} border="1px solid" borderColor={theme.border} borderRadius="lg" p={5}>
        <Box position="relative" flex={1} maxW="600px">
          <Icon
            as={FiSearch}
            position="absolute"
            left={4}
            top="50%"
            transform="translateY(-50%)"
            color={theme.text}
            boxSize={5}
            zIndex={1}
          />
          <Input
            placeholder="Search by email, name, or username..."
            value={q}
            onChange={e => setQ(e.target.value)}
            bg={theme.inputBg}
            border="1px solid"
            borderColor={theme.border}
            color={theme.textSecondary}
            pl={12}
            h="48px"
            borderRadius="lg"
            _placeholder={{ color: "#94A3B8" }}
            _focus={{ borderColor: theme.borderLight, boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)" }}
          />
        </Box>
        <Button
          onClick={load}
          leftIcon={<Icon as={FiRefreshCcw} />}
          isLoading={loading}
          bg={theme.buttonBg}
          color="white"
          border="1px solid"
          borderColor={theme.border}
          h="48px"
          px={6}
          borderRadius="lg"
          _hover={{ bg: theme.buttonHoverBg }}
        >
          Reload
        </Button>
      </Flex>

      {/* Users Table */}
      <Box bg={theme.cardBg} border="1px solid" borderColor={theme.border} borderRadius="lg" shadow="sm" overflow="hidden">
        {/* Table Header */}
        <Grid
          templateColumns="80px 1fr 200px 280px"
          py={4}
          px={6}
          borderBottom="1px solid"
          borderColor={theme.borderLight}
          fontWeight="bold"
          fontSize="sm"
          color={theme.text}
          textTransform="uppercase"
          letterSpacing="wider"
        >
          <Box>ID</Box>
          <Box>User Info</Box>
          <Box>Username</Box>
          <Box>Actions</Box>
        </Grid>

        {/* Table Body */}
        {loading ? (
          <Box p={12} textAlign="center">
            <Text color={theme.text}>Loading users...</Text>
          </Box>
        ) : filtered.length === 0 ? (
          <Box p={12} textAlign="center">
            <Icon as={FiUsers} boxSize={12} color={theme.text} mb={4} />
            <Text color={theme.text} fontSize="lg" mb={2}>No users found</Text>
            <Text color={theme.textSecondary} fontSize="sm">
              {q ? 'Try adjusting your search' : 'No users in the system'}
            </Text>
          </Box>
        ) : (
          filtered.map((u, idx) => {
            const isBlockedToggle = u.status === STATUS.SUSPENDED || u.status === STATUS.DELETED
            const isSuspended = u.status === STATUS.SUSPENDED
            const color = statusColor(u.status)

            return (
              <Grid
                key={u.id}
                templateColumns="80px 1fr 200px 280px"
                py={4}
                px={6}
                borderBottom={idx !== filtered.length - 1 ? "1px solid" : "none"}
                borderColor={theme.borderLight}
                alignItems="center"
                transition="all 0.2s"
                _hover={{ bg: theme.hoverBg }}
              >
                {/* ID */}
                <Box>
                  <Text color="#3B82F6" fontWeight="semibold">#{u.id}</Text>
                </Box>

                {/* User Info */}
                <Box>
                  <Text fontWeight="semibold" color={theme.text} mb={2}>{u.email}</Text>
                  <HStack gap={2}>
                    <Badge
                      bg={`${color}15`}
                      color={color}
                      border="1px solid"
                      borderColor={`${color}30`}
                      px={2}
                      py={0.5}
                      borderRadius="md"
                      fontSize="xs"
                      fontWeight="semibold"
                    >
                      {u.status || 'INACTIVE'}
                    </Badge>
                    {u.role && (
                      <Badge
                        bg={u.role == 'ADMIN' ? "#3B82F6" : "#F1F5F9"}
                        color={u.role == 'ADMIN' ? "#F1F5F9" : "#475569"}
                        px={2}
                        py={0.5}
                        borderRadius="md"
                        fontSize="xs"
                        fontWeight="semibold"
                      >
                        {u.role}
                      </Badge>
                    )}
                  </HStack>
                </Box>

                {/* Username */}
                <Box>
                  <Text noOfLines={1} color={theme.textMuted}>{u.username || '—'}</Text>
                </Box>

                {/* Actions */}
                <HStack spacing={2}>
                  <IconButton
                    aria-label="toggle-status"
                    size="sm"
                    bg={theme.inputBg}
                    border="1px solid"
                    borderColor={theme.border}
                    color={u.status === STATUS.ACTIVE ? "#EF4444" : "#10B981"}
                    isDisabled={isBlockedToggle}
                    isLoading={!!busy[u.id]}
                    onClick={() => toggleActiveInactive(u)}
                    _hover={{ bg: theme.hoverBg }}
                    title={isBlockedToggle ? 'Cannot toggle when SUSPENDED/DELETED' : (u.status === STATUS.ACTIVE ? 'Deactivate' : 'Activate')}
                  >
                    <Icon as={u.status === STATUS.ACTIVE ? FiUserX : FiUserCheck} />
                  </IconButton>

                  <IconButton
                    aria-label="suspend-user"
                    size="sm"
                    bg={isSuspended ? "#F59E0B15" : theme.inputBg}
                    border="1px solid"
                    borderColor={theme.border}
                    color="#F59E0B"
                    isDisabled={u.status === STATUS.DELETED || isSuspended}
                    isLoading={!!busy[u.id] && !isBlockedToggle}
                    onClick={() => suspendUser(u)}
                    _hover={{ bg: isSuspended ? "#F59E0B15" : theme.hoverBg }}
                    title={isSuspended ? 'Already suspended' : 'Suspend user'}
                  >
                    <Icon as={FiAlertTriangle} />
                  </IconButton>

                  <IconButton
                    aria-label="info-user"
                    size="sm"
                    bg={theme.inputBg}
                    border="1px solid"
                    borderColor={theme.border}
                    color="#3B82F6"
                    onClick={() => openDetail(u)}
                    _hover={{ bg: theme.hoverBg }}
                    title="View details"
                  >
                    <Icon as={FiInfo} />
                  </IconButton>
                </HStack>
              </Grid>
            )
          })
        )}
      </Box>

      {/* User Detail Dialog */}
      <DialogRoot open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <DialogContent maxW="600px" bg="white" borderRadius="lg">
              <DialogCloseTrigger />
              <DialogHeader borderBottom="1px solid" borderColor="#E2E8F0" pb={4}>
                <DialogTitle color="#1E3A8A" fontSize="xl" fontWeight="bold">User Information</DialogTitle>
              </DialogHeader>
              <DialogBody py={6}>
                {detailUser && (
                  <VStack align="stretch" spacing={6}>
                    {/* User Header */}
                    <HStack spacing={4}>
                      <Avatar.Root size="xl">
                        <Avatar.Fallback>{detailUser.fullName?.[0] || detailUser.username?.[0] || 'U'}</Avatar.Fallback>
                        <Avatar.Image src={detailUser.avatarUrl} />
                      </Avatar.Root>
                      <Box flex={1}>
                        <Text fontWeight="bold" fontSize="lg" color="#1E293B" mb={2}>
                          {detailUser.fullName || detailUser.username || 'Unknown User'}
                        </Text>
                        <HStack spacing={2}>
                          <Badge
                            bg={`${statusColor(detailUser.status)}15`}
                            color={statusColor(detailUser.status)}
                            border="1px solid"
                            borderColor={`${statusColor(detailUser.status)}30`}
                            px={3}
                            py={1}
                            borderRadius="md"
                            fontSize="sm"
                            fontWeight="semibold"
                          >
                            {detailUser.status || 'INACTIVE'}
                          </Badge>
                          {detailUser.role && (
                            <Badge
                              bg="#F1F5F9"
                              color="#475569"
                              px={3}
                              py={1}
                              borderRadius="md"
                              fontSize="sm"
                              fontWeight="semibold"
                            >
                              {detailUser.role}
                            </Badge>
                          )}
                        </HStack>
                      </Box>
                    </HStack>

                    {/* User Details Grid */}
                    <Box
                      bg="#F8FAFC"
                      p={4}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="#E2E8F0"
                    >
                      <Grid templateColumns="140px 1fr" rowGap={3} columnGap={4}>
                        <Text color="#64748B" fontSize="sm" fontWeight="semibold">Username</Text>
                        <Text color="#1E293B">{detailUser.username || '—'}</Text>

                        <Text color="#64748B" fontSize="sm" fontWeight="semibold">Email</Text>
                        <Text color="#1E293B">{detailUser.email || '—'}</Text>

                        <Text color="#64748B" fontSize="sm" fontWeight="semibold">Full Name</Text>
                        <Text color="#1E293B">{detailUser.fullName || '—'}</Text>

                        <Text color="#64748B" fontSize="sm" fontWeight="semibold">Phone</Text>
                        <Text color="#1E293B">{detailUser.phone || '—'}</Text>

                        <Text color="#64748B" fontSize="sm" fontWeight="semibold">Date of Birth</Text>
                        <Text color="#1E293B">{fmt(detailUser.dateOfBirth)}</Text>

                        <Text color="#64748B" fontSize="sm" fontWeight="semibold">Created At</Text>
                        <Text color="#1E293B">{fmt(detailUser.createdAt)}</Text>

                        <Text color="#64748B" fontSize="sm" fontWeight="semibold">Updated At</Text>
                        <Text color="#1E293B">{fmt(detailUser.updatedAt)}</Text>

                        <Text color="#64748B" fontSize="sm" fontWeight="semibold">Last Login</Text>
                        <Text color="#1E293B">{fmt(detailUser.lastLoginAt)}</Text>
                      </Grid>
                    </Box>
                  </VStack>
                )}
              </DialogBody>
              <DialogFooter borderTop="1px solid" borderColor="#E2E8F0" pt={4}>
                <Button
                  onClick={closeDetail}
                  bg="#1E3A8A"
                  color="white"
                  _hover={{ bg: "#1E40AF" }}
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog.Positioner>
        </Portal>
      </DialogRoot>
    </Box>
  )
}