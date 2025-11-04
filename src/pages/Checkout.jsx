import { useEffect, useMemo, useState } from 'react'

// Chakra v3 — chú ý import theo sub-packages
import { Badge, Box, Heading, Icon, Separator, Text } from '@chakra-ui/react'
import { Button } from '@chakra-ui/react/button'
import { Flex } from '@chakra-ui/react/flex'
import { Grid } from '@chakra-ui/react/grid'
import { Input } from '@chakra-ui/react/input'
import AddressPicker from '../components/AddressPicker'

// Radio (snippets v3): npx @chakra-ui/cli snippet add radio
import { Radio, RadioGroup } from '../components/ui/radio'
// Toaster (snippets v3): npx @chakra-ui/cli snippet add toaster
import { toaster } from '../components/ui/toaster'

// API
import { getAddresses } from '../api/addresses'
import { getCart } from '../api/cart'
import { placeOrder } from '../api/orders'

// Icons
import { FiArrowLeft, FiCreditCard, FiMapPin, FiPackage, FiPlus, FiShoppingBag, FiTag } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

// ============= Helpers =============
const currency = (n = 0) => '$' + (n || 0).toLocaleString('en-US')

// ============= Main =============
export default function Checkout() {
  const nav = useNavigate()
  
  // Phương thức thanh toán
  const [method, setMethod] = useState('PAYOS')

  // Giỏ hàng
  const [cart, setCart] = useState(null)

  // Địa chỉ
  const [address, setAddress] = useState(null)
  const [addingAddr, setAddingAddr] = useState(false)
  const [addrForm, setAddrForm] = useState({
    fullName: '', phone: '', line1: '', ward: '', district: '', city: '',
  })
  const [addrOpen, setAddrOpen] = useState(false)

  // Voucher
  const [voucher, setVoucher] = useState('')
  const [voucherApplied, setVoucherApplied] = useState(null)

  // Load cart
  useEffect(() => {
    (async () => {
      try {
        const c = await getCart()
        setCart(c)
      } catch { 
        toaster.create({ type:'error', description:'Cannot load cart' }) 
      }
      try {
        const list = await getAddresses()
        const def = list.find(a => a.isDefault) || list[0]
        if (def) setAddress(def)
      } catch { /* user might not have addresses */ }
    })()
  }, [])

  // Tính tiền
  const { subtotal, shippingFee, discount, grandTotal } = useMemo(() => {
    const items = cart?.items || []
    const sub = cart?.subTotal || 0
    const ship = cart?.shippingFee || 0
    const total = cart?.grandTotal || 0

    const disc = voucherApplied?.discount || 0
    return { subtotal: sub, shippingFee: ship, discount: disc, grandTotal: total - disc }
  }, [cart, voucherApplied])

  // Áp dụng voucher demo
  const applyVoucher = () => {
    const code = (voucher || '').trim().toUpperCase()
    if (!code) {
      setVoucherApplied(null)
      toaster.create({ type: 'info', description: 'Voucher removed' })
      return
    }
    // Demo rule: SALE10 = 10% off, max $50
    if (code === 'SALE10') {
      const disc = Math.min(Math.round(subtotal * 0.1), 50)
      setVoucherApplied({ code, discount: disc })
      toaster.create({ type: 'success', description: `Applied SALE10: -${currency(disc)}` })
    } else {
      setVoucherApplied(null)
      toaster.create({ type: 'warning', description: 'Invalid voucher code' })
    }
  }

  // Đặt hàng
  const doPay = async () => {
    if (!address) {
      toaster.create({ type: 'warning', description: 'Please add a shipping address' })
      return
    }
    if (!cart?.items?.length) {
      toaster.create({ type: 'warning', description: 'Your cart is empty' })
      return
    }
    try {
      const res = await placeOrder(method)
      const result = res?.result || res
      const link = result?.paymentLink || result?.checkoutUrl
      const orderId = result?.orderId || result?.id

      if (link) {
        window.location.assign(link)
        return
      }
      toaster.create({ type: 'success', description: `Order placed successfully #${orderId || ''}` })
    } catch (e) {
      toaster.create({ type: 'error', description: 'Payment failed' })
      console.error(e)
    }
  }

  const saveAddress = () => {
    const { fullName, phone, line1, city } = addrForm
    if (!fullName || !phone || !line1 || !city) {
      toaster.create({ type: 'warning', description: 'Please fill all required fields' })
      return
    }
    setAddress({ ...addrForm })
    setAddingAddr(false)
    toaster.create({ type: 'success', description: 'Address saved' })
  }

  return (
    <Box maxW="1400px" mx="auto" px={6} py={8}>
      {/* Header */}
      <Box mb={8}>
        <Flex justify="space-between" align="center" mb={3}>
          <Flex align="center" gap={3}>
            <Icon as={FiShoppingBag} boxSize={7} color="#495057" />
            <Box>
              <Heading size="4xl" fontWeight="black" color="#212529">
                Checkout
              </Heading>
            </Box>
          </Flex>
          
          <Button
            variant="outline"
            leftIcon={<FiArrowLeft />}
            onClick={() => nav('/cart')}
            borderColor="#DEE2E6"
            color="#495057"
            _hover={{ bg: "#F8F9FA" }}
            fontWeight="semibold"
          >
            Back to Cart
          </Button>
        </Flex>
        <Text color="#6C757D" fontSize="lg">
          Review your order details and complete your purchase
        </Text>
      </Box>

      <Grid templateColumns={{ base: '1fr', lg: '1.5fr 1fr' }} gap={6}>
        {/* LEFT: Address + Items + Voucher */}
        <Box>
          {/* Address */}
          <Box 
            bg="white" 
            border="1px solid" 
            borderColor="#DEE2E6"
            borderRadius="xl" 
            p={6} 
            mb={4}
            shadow="sm"
          >
            <Flex align="center" gap={2} mb={4}>
              <Icon as={FiMapPin} boxSize={5} color="#495057" />
              <Heading size="md" color="#212529" fontWeight="bold">
                Shipping Address
              </Heading>
            </Flex>

            {!address ? (
              <Flex 
                align="center" 
                justify="center" 
                direction="column" 
                py={8} 
                gap={3}
                borderRadius="lg"
                bg="#F8F9FA"
              >
                <Flex 
                  as="button" 
                  align="center" 
                  justify="center"
                  w="64px" 
                  h="64px" 
                  borderRadius="full" 
                  border="2px dashed" 
                  borderColor="#ADB5BD"
                  bg="white"
                  _hover={{ bg:'#F8F9FA', borderColor: '#495057' }} 
                  onClick={() => setAddrOpen(true)}
                  transition="all 0.2s"
                >
                  <FiPlus size={28} color="#495057" />
                </Flex>
                <Text color="#495057" fontWeight="semibold">Add your shipping address</Text>
              </Flex>
            ) : (
              <Box 
                p={4} 
                bg="#F8F9FA" 
                borderRadius="lg"
                border="1px solid"
                borderColor="#E9ECEF"
              >
                <Flex justify="space-between" align="start" gap={3}>
                  <Box flex={1}>
                    <Text fontWeight="bold" color="#212529" mb={1}>
                      {address.fullName}
                    </Text>
                    <Text color="#6C757D" fontSize="sm" mb={1}>
                      {address.phone}
                    </Text>
                    <Text color="#495057" fontSize="sm">
                      {address.line1}
                      {address.ward ? `, ${address.ward}` : ''}
                      {address.district ? `, ${address.district}` : ''}
                      {address.city ? `, ${address.city}` : ''}
                    </Text>
                  </Box>
                  <Button 
                    size="sm" 
                    variant="outline"
                    borderColor="#DEE2E6"
                    color="#495057"
                    _hover={{ bg: "white" }}
                    onClick={() => setAddrOpen(true)}
                  >
                    Change
                  </Button>
                </Flex>
              </Box>
            )}
          </Box>

          {/* Order details */}
          <Box 
            bg="white" 
            border="1px solid" 
            borderColor="#DEE2E6"
            borderRadius="xl" 
            p={6} 
            mb={4}
            shadow="sm"
          >
            <Flex align="center" gap={2} mb={4}>
              <Icon as={FiPackage} boxSize={5} color="#495057" />
              <Heading size="md" color="#212529" fontWeight="bold">
                Order Items
              </Heading>
              {cart?.items?.length > 0 && (
                <Badge 
                  bg="#F8F9FA"
                  color="#495057"
                  border="1px solid"
                  borderColor="#DEE2E6"
                  px={2}
                  py={0.5}
                  borderRadius="md"
                  fontSize="xs"
                  fontWeight="semibold"
                  ml={2}
                >
                  {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}
                </Badge>
              )}
            </Flex>

            {!cart?.items?.length ? (
              <Box py={6} textAlign="center">
                <Text color="#ADB5BD" fontSize="sm">Your cart is empty</Text>
              </Box>
            ) : (
              <Box>
                {cart.items.map((it, idx) => (
                  <Box key={it.id}>
                    <Flex py={4} align="center" gap={3}>
                      <Box flex={1}>
                        <Text fontWeight="semibold" color="#212529" noOfLines={1}>
                          {it.productName}
                        </Text>
                        <Text color="#6C757D" fontSize="sm">
                          Qty: {it.quantity}
                        </Text>
                      </Box>
                      <Text fontWeight="bold" color="#212529">
                        {currency(it.totalPrice)}
                      </Text>
                    </Flex>
                    {idx < cart.items.length - 1 && (
                      <Box h="1px" bg="#E9ECEF" />
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* Voucher */}
          <Box 
            bg="white" 
            border="1px solid" 
            borderColor="#DEE2E6"
            borderRadius="xl" 
            p={6}
            shadow="sm"
          >
            <Flex align="center" gap={2} mb={4}>
              <Icon as={FiTag} boxSize={5} color="#495057" />
              <Heading size="md" color="#212529" fontWeight="bold">
                Discount Code
              </Heading>
            </Flex>

            <Flex gap={3}>
              <Input 
                placeholder="Enter code (e.g., SALE10)" 
                value={voucher} 
                onChange={e => setVoucher(e.target.value)}
                borderColor="#DEE2E6"
                _hover={{ borderColor: "#ADB5BD" }}
                _focus={{ borderColor: "#495057", boxShadow: "0 0 0 1px #495057" }}
              />
              <Button 
                onClick={applyVoucher}
                bg="#212529"
                color="white"
                _hover={{ bg: "#343A40" }}
                fontWeight="semibold"
                px={6}
              >
                Apply
              </Button>
            </Flex>

            {voucherApplied && (
              <Flex 
                mt={3} 
                p={3} 
                bg="#D1E7DD" 
                borderRadius="lg"
                align="center"
                gap={2}
              >
                <Icon as={FiTag} color="#0F5132" />
                <Text color="#0F5132" fontSize="sm" fontWeight="medium">
                  Applied <strong>{voucherApplied.code}</strong>: -{currency(voucherApplied.discount)}
                </Text>
              </Flex>
            )}
          </Box>
        </Box>

        {/* RIGHT: Payment summary + Method + Place order */}
        <Box>
          {/* Payment Summary */}
          <Box 
            bg="white" 
            border="1px solid" 
            borderColor="#DEE2E6"
            borderRadius="xl" 
            p={6} 
            mb={4}
            shadow="sm"
          >
            <Flex align="center" gap={2} mb={4}>
              <Icon as={FiCreditCard} boxSize={5} color="#495057" />
              <Heading size="md" color="#212529" fontWeight="bold">
                Payment Summary
              </Heading>
            </Flex>

            <Box>
              <Flex justify="space-between" py={2}>
                <Text color="#6C757D">Subtotal</Text>
                <Text fontWeight="semibold" color="#212529">
                  {currency(subtotal)}
                </Text>
              </Flex>

              <Flex justify="space-between" py={2}>
                <Text color="#6C757D">Shipping</Text>
                <Text fontWeight="semibold" color={shippingFee === 0 ? "#198754" : "#212529"}>
                  {shippingFee === 0 ? 'Free' : currency(shippingFee)}
                </Text>
              </Flex>

              {discount > 0 && (
                <Flex justify="space-between" py={2}>
                  <Text color="#6C757D">Discount</Text>
                  <Text fontWeight="semibold" color="#198754">
                    -{currency(discount)}
                  </Text>
                </Flex>
              )}

              <Separator borderColor="#E9ECEF" my={3} />

              <Flex justify="space-between" align="center" py={2}>
                <Text fontSize="lg" fontWeight="bold" color="#212529">
                  Total
                </Text>
                <Text fontSize="2xl" fontWeight="black" color="#212529">
                  {currency(grandTotal)}
                </Text>
              </Flex>
            </Box>
          </Box>

          {/* Payment Method */}
          <Box 
            bg="white" 
            border="1px solid" 
            borderColor="#DEE2E6"
            borderRadius="xl" 
            p={6} 
            mb={4}
            shadow="sm"
          >
            <Heading size="md" color="#212529" fontWeight="bold" mb={4}>
              Payment Method
            </Heading>

            <RadioGroup value={method} onValueChange={(e) => setMethod(e.value)}>
              <Flex direction="column" gap={3}>
                <Box 
                  p={3} 
                  border="1px solid"
                  borderColor={method === 'PAYOS' ? '#212529' : '#DEE2E6'}
                  borderRadius="lg"
                  bg={method === 'PAYOS' ? '#F8F9FA' : 'white'}
                  transition="all 0.2s"
                >
                  <Radio value="PAYOS">
                    <Text fontWeight="semibold" color="#212529">PayOS</Text>
                    <Text fontSize="xs" color="#6C757D">Vietnamese payment gateway</Text>
                  </Radio>
                </Box>

                <Box 
                  p={3} 
                  border="1px solid"
                  borderColor={method === 'VISA' ? '#212529' : '#DEE2E6'}
                  borderRadius="lg"
                  bg={method === 'VISA' ? '#F8F9FA' : 'white'}
                  transition="all 0.2s"
                >
                  <Radio value="VISA">
                    <Text fontWeight="semibold" color="#212529">Visa/Mastercard</Text>
                    <Text fontSize="xs" color="#6C757D">Debit or Credit card</Text>
                  </Radio>
                </Box>

                <Box 
                  p={3} 
                  border="1px solid"
                  borderColor={method === 'COD' ? '#212529' : '#DEE2E6'}
                  borderRadius="lg"
                  bg={method === 'COD' ? '#F8F9FA' : 'white'}
                  transition="all 0.2s"
                >
                  <Radio value="COD">
                    <Text fontWeight="semibold" color="#212529">Cash on Delivery</Text>
                    <Text fontSize="xs" color="#6C757D">Pay when you receive</Text>
                  </Radio>
                </Box>
              </Flex>
            </RadioGroup>
          </Box>

          {/* Place Order Button */}
          <Button 
            w="full" 
            size="lg"
            bg="#212529"
            color="white"
            _hover={{ bg: "#343A40" }}
            fontWeight="bold"
            onClick={doPay}
            py={6}
          >
            Place Order
          </Button>
        </Box>

        {/* Address picker modal */}
        <AddressPicker
          open={addrOpen}
          onClose={() => setAddrOpen(false)}
          onSelect={(addr) => setAddress(addr)}
        />
      </Grid>
    </Box>
  )
}