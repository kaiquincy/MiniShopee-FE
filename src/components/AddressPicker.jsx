import { useEffect, useState } from 'react'
import { Box, Text, Heading } from '@chakra-ui/react'
import { Flex } from '@chakra-ui/react/flex'
import { Grid } from '@chakra-ui/react/grid'
import { Button } from '@chakra-ui/react/button'
import { Input } from '@chakra-ui/react/input'
import { toaster } from '../components/ui/toaster'
import { getAddresses, createAddress, makeDefaultAddress } from '../api/addresses'
import { FiX, FiCheckCircle, FiPlus } from 'react-icons/fi'

const panel = {
  bg: 'white',
  border: '1px solid',
  borderColor: 'gray.200',
  borderRadius: '16px',
  p: '16px',
  maxW: '760px',
  w: '100%',
  boxShadow: '0 20px 60px rgba(2,32,71,0.18)'
}

export default function AddressPicker({ open, onClose, onSelect }) {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  // quick add
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ fullName:'', phone:'', line1:'', ward:'', district:'', city:'' })

  const load = async () => {
    setLoading(true)
    try {
      const data = await getAddresses()
      setList(data)
      const def = data.find(a => a.isDefault) || data[0]
      if (def) setSelectedId(def.id)
    } catch {
      toaster.create({ type:'error', description:'Không tải được địa chỉ' })
    } finally { setLoading(false) }
  }

  useEffect(()=>{ if (open) load() }, [open])

  const useSelected = () => {
    const a = list.find(x => x.id === selectedId)
    if (!a) return toaster.create({ type:'warning', description:'Chọn một địa chỉ' })
    onSelect?.(a)
    onClose?.()
  }

  const saveQuick = async () => {
    const { fullName, phone, line1, city } = form
    if (!fullName || !phone || !line1 || !city) {
      return toaster.create({ type:'warning', description:'Điền đủ Họ tên, SĐT, Địa chỉ, Tỉnh/TP' })
    }
    try {
      const created = await createAddress({ ...form })
      toaster.create({ type:'success', description:'Đã thêm địa chỉ' })
      setAdding(false); setForm({ fullName:'', phone:'', line1:'', ward:'', district:'', city:'' })
      await load()
      setSelectedId(created.id)
    } catch (e) {
      toaster.create({ type:'error', description: e?.response?.data?.message || 'Không thể thêm' })
    }
  }

  const setDefault = async (id) => {
    try {
      await makeDefaultAddress(id)
      toaster.create({ type:'success', description:'Đã đặt mặc định' })
      await load()
      setSelectedId(id)
    } catch (e) {
      toaster.create({ type:'error', description:'Không thể đặt mặc định' })
    }
  }

  if (!open) return null

  return (
    <Box position="fixed" inset="0" zIndex="1000" bg="blackAlpha.500"
         display="flex" alignItems="center" justifyContent="center" px="16px">
      <Box {...panel}>
        <Flex align="center" justify="space-between" mb="10px">
          <Heading size="sm">Chọn địa chỉ</Heading>
          <Button variant="ghost" onClick={onClose}><FiX/></Button>
        </Flex>

        {/* Danh sách */}
        <Box border="1px solid" borderColor="gray.100" borderRadius="12px" overflow="hidden">
          {(!list || list.length === 0) && (
            <Box p="18px" textAlign="center" color="gray.500">Chưa có địa chỉ nào</Box>
          )}
          {list.map(a => (
            <Box key={a.id} p="12px" borderTop="1px solid" borderColor="gray.100">
              <Flex align="flex-start" justify="space-between" gap="12px" wrap="wrap">
                <Box onClick={()=>setSelectedId(a.id)} style={{cursor:'pointer'}}>
                  <Text fontWeight="semibold">
                    <input type="radio" checked={selectedId===a.id} onChange={()=>setSelectedId(a.id)} style={{marginRight:8}} />
                    {a.fullName} • {a.phone} {a.isDefault && <DefBadge/>}
                  </Text>
                  <Text color="gray.600">
                    {a.line1}{a.ward?`, ${a.ward}`:''}{a.district?`, ${a.district}`:''}{a.city?`, ${a.city}`:''}
                  </Text>
                </Box>
                <Flex gap="8px">
                  {!a.isDefault && (
                    <Button size="sm" variant="outline" onClick={()=>setDefault(a.id)}>
                      <FiCheckCircle style={{marginRight:6}}/>Mặc định
                    </Button>
                  )}
                </Flex>
              </Flex>
            </Box>
          ))}
        </Box>

        {/* Thêm nhanh */}
        <Box mt="14px">
          <Button variant={adding?'outline':'ghost'} onClick={()=>setAdding(!adding)}>
            <FiPlus style={{marginRight:8}}/>{adding?'Đóng':'Thêm địa chỉ mới'}
          </Button>
          {adding && (
            <Box mt="10px">
              <Grid templateColumns={{ base:'1fr', md:'1fr 1fr' }} gap="10px">
                <Input placeholder="Họ tên*" value={form.fullName} onChange={e=>setForm({...form, fullName:e.target.value})}/>
                <Input placeholder="Số điện thoại*" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})}/>
              </Grid>
              <Input mt="10px" placeholder="Địa chỉ (Số nhà, đường)*" value={form.line1} onChange={e=>setForm({...form, line1:e.target.value})}/>
              <Grid mt="10px" templateColumns={{ base:'1fr', md:'repeat(3,1fr)' }} gap="10px">
                <Input placeholder="Phường/Xã" value={form.ward} onChange={e=>setForm({...form, ward:e.target.value})}/>
                <Input placeholder="Quận/Huyện" value={form.district} onChange={e=>setForm({...form, district:e.target.value})}/>
                <Input placeholder="Tỉnh/Thành phố*" value={form.city} onChange={e=>setForm({...form, city:e.target.value})}/>
              </Grid>
              <Flex mt="12px" justify="flex-end" gap="10px">
                <Button variant="outline" onClick={()=>{ setAdding(false); setForm({ fullName:'', phone:'', line1:'', ward:'', district:'', city:'' }) }}>Huỷ</Button>
                <Button onClick={saveQuick}>Lưu</Button>
              </Flex>
            </Box>
          )}
        </Box>

        <Flex mt="16px" justify="flex-end" gap="10px">
          <Button variant="outline" onClick={onClose}>Đóng</Button>
          <Button onClick={useSelected} isDisabled={!selectedId}>Dùng địa chỉ đã chọn</Button>
        </Flex>
      </Box>
    </Box>
  )
}

function DefBadge() {
  return (
    <span style={{
      marginLeft: 8, padding:'2px 8px', borderRadius:999,
      background:'#EEF6FF', border:'1px solid #CCE0FF', fontSize:12, color:'#1E5EFF'
    }}>
      Mặc định
    </span>
  )
}
