import { useEffect, useMemo, useState } from 'react'

// Chakra v3 — import theo sub-packages
import { Box, Text, Heading } from '@chakra-ui/react'
import { Flex } from '@chakra-ui/react/flex'
import { Grid } from '@chakra-ui/react/grid'
import { Button } from '@chakra-ui/react/button'
import { Input } from '@chakra-ui/react/input'

// Toaster (Chakra v3 snippet)
import { toaster } from '../components/ui/Toaster'

// API
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  makeDefaultAddress,
} from '../api/addresses'

// Icons
import { FiEdit2, FiTrash2, FiCheckCircle, FiPlus } from 'react-icons/fi'

const card = {
  bg: 'white',
  border: '1px solid',
  borderColor: 'gray.200',
  borderRadius: '16px',
  p: '16px',
  boxShadow: '0 10px 30px rgba(2,32,71,0.06)',
}

export default function AccountAddresses() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)

  // Form thêm mới
  const [adding, setAdding] = useState(false)
  const [newAddr, setNewAddr] = useState({
    fullName: '',
    phone: '',
    line1: '',
    ward: '',
    district: '',
    city: '',
    isDefault: false,
  })

  // Đang sửa địa chỉ nào
  const [editingId, setEditingId] = useState(null)
  const [editing, setEditing] = useState({})

  const load = async () => {
    setLoading(true)
    try {
      const data = await getAddresses()
      setList(data)
    } catch {
      toaster.create({ type: 'error', description: 'Không tải được sổ địa chỉ' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const defaultId = useMemo(() => list.find(a => a.isDefault)?.id, [list])

  const onCreate = async () => {
    const { fullName, phone, line1, city } = newAddr
    if (!fullName || !phone || !line1 || !city) {
      toaster.create({ type: 'warning', description: 'Hãy nhập đủ Họ tên, SĐT, Địa chỉ, Tỉnh/TP' })
      return
    }
    try {
      await createAddress(newAddr)
      toaster.create({ type: 'success', description: 'Đã thêm địa chỉ' })
      setNewAddr({ fullName: '', phone: '', line1: '', ward: '', district: '', city: '', isDefault: false })
      setAdding(false)
      load()
    } catch (e) {
      toaster.create({ type: 'error', description: e?.response?.data?.message || 'Không thể thêm địa chỉ' })
    }
  }

  const startEdit = (a) => {
    setEditingId(a.id)
    setEditing({
      fullName: a.fullName || '',
      phone: a.phone || '',
      line1: a.line1 || '',
      ward: a.ward || '',
      district: a.district || '',
      city: a.city || '',
    })
  }

  const onSaveEdit = async (id) => {
    try {
      await updateAddress(id, editing)
      toaster.create({ type: 'success', description: 'Đã cập nhật địa chỉ' })
      setEditingId(null)
      setEditing({})
      load()
    } catch (e) {
      toaster.create({ type: 'error', description: e?.response?.data?.message || 'Không thể cập nhật' })
    }
  }

  const onDelete = async (id) => {
    if (!confirm('Xoá địa chỉ này?')) return
    try {
      await deleteAddress(id)
      toaster.create({ type: 'success', description: 'Đã xoá địa chỉ' })
      load()
    } catch (e) {
      toaster.create({ type: 'error', description: e?.response?.data?.message || 'Không thể xoá' })
    }
  }

  const setDefault = async (id) => {
    try {
      await makeDefaultAddress(id)
      toaster.create({ type: 'success', description: 'Đã đặt làm mặc định' })
      load()
    } catch (e) {
      toaster.create({ type: 'error', description: e?.response?.data?.message || 'Không thể đặt mặc định' })
    }
  }

  return (
    <Box>
      <Heading size="lg" mb="20px">Sổ địa chỉ</Heading>

      {/* Thêm mới */}
      <Box {...card} mb="16px">
        <Flex align="center" justify="space-between" mb="10px">
          <Heading size="sm" color="gray.700">Thêm địa chỉ</Heading>
          <Button variant={adding ? 'outline' : 'solid'} onClick={() => setAdding(!adding)}>
            {adding ? 'Đóng' : (<><FiPlus style={{marginRight:8}}/>Thêm</>)}
          </Button>
        </Flex>

        {adding && (
          <Box>
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap="10px">
              <Input placeholder="Họ tên*" value={newAddr.fullName} onChange={e => setNewAddr({ ...newAddr, fullName: e.target.value })} />
              <Input placeholder="Số điện thoại*" value={newAddr.phone} onChange={e => setNewAddr({ ...newAddr, phone: e.target.value })} />
            </Grid>
            <Input mt="10px" placeholder="Địa chỉ (Số nhà, đường)*" value={newAddr.line1} onChange={e => setNewAddr({ ...newAddr, line1: e.target.value })} />
            <Grid mt="10px" templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap="10px">
              <Input placeholder="Phường/Xã" value={newAddr.ward} onChange={e => setNewAddr({ ...newAddr, ward: e.target.value })} />
              <Input placeholder="Quận/Huyện" value={newAddr.district} onChange={e => setNewAddr({ ...newAddr, district: e.target.value })} />
              <Input placeholder="Tỉnh/Thành phố*" value={newAddr.city} onChange={e => setNewAddr({ ...newAddr, city: e.target.value })} />
            </Grid>
            <Flex mt="14px" gap="10px" justify="flex-end">
              <Button variant="outline" onClick={() => { setAdding(false); setNewAddr({ fullName: '', phone: '', line1: '', ward: '', district: '', city: '', isDefault: false }) }}>Huỷ</Button>
              <Button onClick={onCreate}>Lưu</Button>
            </Flex>
          </Box>
        )}
      </Box>

      {/* Danh sách */}
      <Box {...card}>
        <Heading size="sm" color="gray.700" mb="10px">Địa chỉ của tôi</Heading>

        {(!list || list.length === 0) && (
          <Box py="24px" textAlign="center" color="gray.500">
            Chưa có địa chỉ nào. Hãy thêm mới ở phía trên.
          </Box>
        )}

        <Box>
          {list.map(a => (
            <Box key={a.id} borderTop="1px solid" borderColor="gray.100" pt="14px" mt="14px">
              {/* view mode */}
              {editingId !== a.id && (
                <Flex align="flex-start" justify="space-between" gap="12px" wrap="wrap">
                  <Box>
                    <Text fontWeight="semibold">
                      {a.fullName} • {a.phone} {a.isDefault && <DefaultBadge/>}
                    </Text>
                    <Text color="gray.600">
                      {a.line1}{a.ward ? `, ${a.ward}` : ''}{a.district ? `, ${a.district}` : ''}{a.city ? `, ${a.city}` : ''}
                    </Text>
                  </Box>
                  <Flex gap="8px">
                    {!a.isDefault && <Button size="sm" variant="outline" onClick={() => setDefault(a.id)}><FiCheckCircle style={{marginRight:6}}/>Mặc định</Button>}
                    <Button size="sm" onClick={() => startEdit(a)}><FiEdit2 style={{marginRight:6}}/>Sửa</Button>
                    <Button size="sm" variant="outline" onClick={() => onDelete(a.id)}><FiTrash2 style={{marginRight:6}}/>Xoá</Button>
                  </Flex>
                </Flex>
              )}

              {/* edit mode */}
              {editingId === a.id && (
                <Box>
                  <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap="10px">
                    <Input placeholder="Họ tên*" value={editing.fullName} onChange={e => setEditing({ ...editing, fullName: e.target.value })} />
                    <Input placeholder="Số điện thoại*" value={editing.phone} onChange={e => setEditing({ ...editing, phone: e.target.value })} />
                  </Grid>
                  <Input mt="10px" placeholder="Địa chỉ (Số nhà, đường)*" value={editing.line1} onChange={e => setEditing({ ...editing, line1: e.target.value })} />
                  <Grid mt="10px" templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap="10px">
                    <Input placeholder="Phường/Xã" value={editing.ward} onChange={e => setEditing({ ...editing, ward: e.target.value })} />
                    <Input placeholder="Quận/Huyện" value={editing.district} onChange={e => setEditing({ ...editing, district: e.target.value })} />
                    <Input placeholder="Tỉnh/Thành phố*" value={editing.city} onChange={e => setEditing({ ...editing, city: e.target.value })} />
                  </Grid>
                  <Flex mt="14px" gap="10px" justify="flex-end">
                    <Button variant="outline" onClick={() => { setEditingId(null); setEditing({}) }}>Huỷ</Button>
                    <Button onClick={() => onSaveEdit(a.id)}>Lưu</Button>
                  </Flex>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

function DefaultBadge() {
  return (
    <span style={{
      marginLeft: 8, padding: '2px 8px', borderRadius: 999,
      background: '#EEF6FF', border: '1px solid #CCE0FF', fontSize: 12, color: '#1E5EFF'
    }}>
      Mặc định
    </span>
  )
}
