import { useEffect, useMemo, useState } from 'react'

// Chakra v3 — chú ý import theo sub-packages
import { Box, Text, Heading } from '@chakra-ui/react'
import { Flex } from '@chakra-ui/react/flex'
import { Grid } from '@chakra-ui/react/grid'
import { Button } from '@chakra-ui/react/button'
import { Input } from '@chakra-ui/react/input'
import AddressPicker from '../components/AddressPicker'


// Radio (snippets v3): npx @chakra-ui/cli snippet add radio
import { Radio, RadioGroup } from '../components/ui/radio'
// Toaster (snippets v3): npx @chakra-ui/cli snippet add toaster
import { toaster } from '../components/ui/toaster'

// API
import { placeOrder } from '../api/orders'
import { getCart } from '../api/cart'
import { getAddresses } from '../api/addresses'

// Icons
import { FiPlus } from 'react-icons/fi'

// ============= Helpers =============
const currency = (n = 0) => (n || 0).toLocaleString('vi-VN') + ' $'
const glass = {
  bg: 'white',
  border: '1px solid',
  borderColor: 'gray.200',
  borderRadius: '16px',
  p: '16px',
  boxShadow: '0 10px 30px rgba(2,32,71,0.06)'
}

// ============= Main =============
export default function Checkout() {
  // Phương thức thanh toán
  const [method, setMethod] = useState('PAYOS')

  // Giỏ hàng
  const [cart, setCart] = useState(null)

  // Địa chỉ
  const [address, setAddress] = useState(null) // { fullName, phone, line1, ward, district, city }
  const [addingAddr, setAddingAddr] = useState(false)
  const [addrForm, setAddrForm] = useState({
    fullName: '', phone: '', line1: '', ward: '', district: '', city: '',
  })
  const [addrOpen, setAddrOpen] = useState(false)


  // Voucher
  const [voucher, setVoucher] = useState('')
  const [voucherApplied, setVoucherApplied] = useState(null) // { code, discount }

  // Load cart
 useEffect(() => {
    (async () => {
      try {
        const c = await getCart(); setCart(c)
      } catch { toaster.create({ type:'error', description:'Không tải được giỏ hàng' }) }
      try {
        const list = await getAddresses()
        const def = list.find(a => a.isDefault) || list[0]
        if (def) setAddress(def)
      } catch { /* có thể user chưa tạo địa chỉ */ }
    })()
  }, [])

  // Tính tiền
  const { subtotal, shippingFee, discount, grandTotal } = useMemo(() => {
    const items = cart?.items || []
    const sub = cart?.subTotal || 123
    const ship = cart?.shippingFee
    const total = cart?.grandTotal || 123

    const disc = voucherApplied?.discount || 0
    return { subtotal: sub, shippingFee: ship, discount: disc, grandTotal: total }
  }, [cart, voucherApplied])

  // Áp dụng voucher demo
  const applyVoucher = () => {
    const code = (voucher || '').trim().toUpperCase()
    if (!code) {
      setVoucherApplied(null)
      toaster.create({ type: 'info', description: 'Đã xoá mã giảm giá' })
      return
    }
    // Demo rule: SALE10 giảm 10%, max 50k
    if (code === 'SALE10') {
      const disc = Math.min(Math.round((cart?.items || []).reduce((s, it) => s + it.price * it.quantity, 0) * 0.1), 50_000)
      setVoucherApplied({ code, discount: disc })
      toaster.create({ type: 'success', description: `Áp dụng SALE10: -${currency(disc)}` })
    } else {
      setVoucherApplied(null)
      toaster.create({ type: 'warning', description: 'Mã không hợp lệ' })
    }
  }

  // Đặt hàng
  const doPay = async () => {
    // Validate địa chỉ
    if (!address) {
      toaster.create({ type: 'warning', description: 'Vui lòng thêm địa chỉ nhận hàng' })
      return
    }
    if (!cart?.items?.length) {
      toaster.create({ type: 'warning', description: 'Giỏ hàng trống' })
      return
    }
    try {
      const res = await placeOrder(method)
      // Tùy backend: bạn có thể trả { orderId, paymentLink } trong result
      const result = res?.result || res
      const link = result?.paymentLink || result?.checkoutUrl
      const orderId = result?.orderId || result?.id

      // Nếu có link thanh toán (PAYOS) thì chuyển hướng
      if (link) {
        window.location.assign(link)
        return
      }
      // Không có link → coi như đặt hàng thành công (COD)
      toaster.create({ type: 'success', description: `Đặt hàng thành công #${orderId || ''}` })
    } catch (e) {
      toaster.create({ type: 'error', description: 'Thanh toán thất bại' })
      console.error(e)
    }
  }

  // Lưu địa chỉ (demo — client side)
  const saveAddress = () => {
    const { fullName, phone, line1, city } = addrForm
    if (!fullName || !phone || !line1 || !city) {
      toaster.create({ type: 'warning', description: 'Vui lòng điền đủ Họ tên, SĐT, Địa chỉ, Tỉnh/TP' })
      return
    }
    setAddress({ ...addrForm })
    setAddingAddr(false)
    toaster.create({ type: 'success', description: 'Đã lưu địa chỉ' })
  }

  return (
    <Box>
      <Heading size="lg" mb="20px">Check Out</Heading>

      <Grid templateColumns={{ base: '1fr', lg: '1.4fr 1fr' }} gap="20px">
        {/* LEFT: Address + Items + Voucher */}
        <Box>
          {/* Address */}
          <Box {...glass} mb="16px">
            <Heading size="sm" mb="12px" color="gray.700">Địa chỉ nhận hàng</Heading>

            {!address ? (
              <Flex align="center" justify="center" direction="column" py="28px" gap="10px">
                <Flex as="button" align="center" justify="center"
                      w="64px" h="64px" borderRadius="50%" border="2px dashed" borderColor="gray.300"
                      _hover={{ bg:'gray.50' }} onClick={()=>setAddrOpen(true)}>
                  <FiPlus size={28}/>
                </Flex>
                <Text color="gray.600" fontWeight="medium">Thêm địa chỉ của bạn</Text>
              </Flex>
            ) : (
              <Flex mt="6px" align="flex-start" justify="space-between" gap="10px" wrap="wrap">
                <Box>
                  <Text fontWeight="semibold">{address.fullName} • {address.phone}</Text>
                  <Text color="gray.600">
                    {address.line1}{address.ward?`, ${address.ward}`:''}{address.district?`, ${address.district}`:''}{address.city?`, ${address.city}`:''}
                  </Text>
                </Box>
                <Button variant="outline" onClick={()=>setAddrOpen(true)}>Chọn địa chỉ khác</Button>
              </Flex>
            )}
          </Box>

          {/* Order details */}
          <Box {...glass} mb="16px">
            <SectionTitle>Chi tiết đơn hàng</SectionTitle>
            {!cart?.items?.length && (
              <Box py="20px" textAlign="center" color="gray.500">Giỏ hàng trống</Box>
            )}
            {cart?.items?.length > 0 && (
              <Box>
                {cart.items.map(it => (
                  <Flex key={it.id} py="10px" borderBottom="1px solid" borderColor="gray.100" align="center" gap="12px">
                    <Box flex="1 1 auto">
                      <Text fontWeight="medium" noOfLines={1}>{it.productName}</Text>
                      <Text color="gray.500" fontSize="sm">x{it.quantity}</Text>
                    </Box>
                    <Text fontWeight="semibold">{it.totalPrice} $</Text>
                  </Flex>
                ))}
              </Box>
            )}
          </Box>

          {/* Voucher */}
          <Box {...glass}>
            <SectionTitle>Mã giảm giá</SectionTitle>
            <Flex gap="10px">
              <Input placeholder="Nhập mã (ví dụ: SALE10)" value={voucher} onChange={e => setVoucher(e.target.value)} />
              <Button onClick={applyVoucher}>Áp dụng</Button>
            </Flex>
            {voucherApplied && (
              <Text mt="8px" color="green.600">
                Đã áp dụng <b>{voucherApplied.code}</b>: -{currency(voucherApplied.discount)}
              </Text>
            )}
          </Box>
        </Box>

        {/* RIGHT: Payment summary + Method + Place order */}
        <Box>
          <Box {...glass} mb="16px">
            <SectionTitle>Chi tiết thanh toán</SectionTitle>

            <Row label="Tổng tiền hàng" value={currency(subtotal)} />
            <Row label="Phí vận chuyển" value={shippingFee === 0 ? 'Free' : currency(shippingFee)} />
            <Row label="Giảm giá" value={discount > 0 ? ('- ' + currency(discount)) : currency(0)} />

            <DividerSoft />

            <RowBig label="Tổng thanh toán" value={currency(grandTotal)} />
          </Box>

          <Box {...glass} mb="16px">
            <SectionTitle>Phương thức thanh toán</SectionTitle>
            <RadioGroup value={method} onValueChange={(e) => setMethod(e.value)}>
              <Flex direction="column" gap="8px">
                <Radio value="PAYOS">PayOS (Vietnamese only)</Radio>
                <Radio value="VISA">Visa (Debit/Credit)</Radio>
                <Radio value="COD">Thanh toán khi nhận hàng (COD)</Radio>
              </Flex>
            </RadioGroup>
          </Box>

          <Button w="100%" size="lg" onClick={doPay}>
            Đặt hàng
          </Button>
        </Box>

        {/* Address picker modal */}   
        <AddressPicker
          open={addrOpen}
          onClose={()=>setAddrOpen(false)}
          onSelect={(addr)=> setAddress(addr)}
        />

      </Grid>
    </Box>
  )
}

// ============= Sub components =============
function SectionTitle({ children }) {
  return <Heading size="sm" mb="12px" color="gray.700">{children}</Heading>
}
function Row({ label, value }) {
  return (
    <Flex justify="space-between" align="center" py="6px">
      <Text color="gray.600">{label}</Text>
      <Text fontWeight="medium">{value}</Text>
    </Flex>
  )
}
function RowBig({ label, value }) {
  return (
    <Flex justify="space-between" align="center" py="8px">
      <Text fontWeight="semibold">{label}</Text>
      <Heading size="md" color="brand.700">{value}</Heading>
    </Flex>
  )
}
function DividerSoft() {
  return <Box h="1px" bg="gray.100" my="8px" />
}
