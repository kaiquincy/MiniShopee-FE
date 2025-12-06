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
import { useCart } from '../context/CartContext'
import { useTheme } from '../context/ThemeContext'

// ============= Helpers =============
const currency = (n = 0) => '$' + (n || 0).toLocaleString('en-US')

// ============= Main =============
export default function Checkout() {
  const nav = useNavigate()
  const { reloadCart } = useCart()
  const { theme } = useTheme()
  
  // Phương thức thanh toán
  const [method, setMethod] = useState('PAYOS')
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)

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

    setIsPlacingOrder(true)
    
    try {
      // Send the request with the correct format matching OrderRequest DTO
      const res = await placeOrder(method)
      const result = res?.result || res
      const link = result?.paymentLink || result?.checkoutUrl
      const orderId = result?.orderId || result?.id

      // If there's a payment link (external payment gateway), redirect to it
      if (link) {
        window.location.assign(link)
        return
      }

      // Order placed successfully (COD or immediate payment)
      toaster.create({ 
        type: 'success', 
        title: 'Order Placed Successfully!',
        description: `Order #${orderId || ''} has been created` 
      })

      // Reload cart to update the header badge
      await reloadCart()

      // Wait a moment for the user to see the success message
      setTimeout(() => {
        // Redirect to orders page
        nav('/orders')
      }, 1500)

    } catch (e) {
      setIsPlacingOrder(false)
      toaster.create({ 
        type: 'error', 
        title: 'Payment Failed',
        description: e?.message || 'Unable to process your order. Please try again.' 
      })
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
    <Box maxW="1400px" mx="auto" px={6} py={8} bg={theme.pageBg} minH="100vh">
      {/* Header */}
      <Box mb={8}>
        <Flex justify="space-between" align="center" mb={3}>
          <Flex align="center" gap={3}>
            <Icon as={FiShoppingBag} boxSize={7} color={theme.textSecondary} />
            <Box>
              <Heading size="4xl" fontWeight="black" color={theme.text}>
                Checkout
              </Heading>
            </Box>
          </Flex>
          
          <Button
            variant="outline"
            leftIcon={<FiArrowLeft />}
            onClick={() => nav('/cart')}
            borderColor={theme.border}
            color={theme.textSecondary}
            _hover={{ bg: theme.hoverBg }}
            fontWeight="semibold"
            disabled={isPlacingOrder}
          >
            Back to Cart
          </Button>
        </Flex>
        <Text color={theme.textMuted} fontSize="lg">
          Review your order details and complete your purchase
        </Text>
      </Box>

      <Grid templateColumns={{ base: '1fr', lg: '1.5fr 1fr' }} gap={6}>
        {/* LEFT: Address + Items + Voucher */}
        <Box>
          {/* Address */}
          <Box 
            bg={theme.cardBg}
            border="1px solid" 
            borderColor={theme.border}
            borderRadius="xl" 
            p={6} 
            mb={4}
            shadow="sm"
          >
            <Flex align="center" gap={2} mb={4}>
              <Icon as={FiMapPin} boxSize={5} color={theme.textSecondary} />
              <Heading size="md" color={theme.text} fontWeight="bold">
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
                bg={theme.secondaryBg}
              >
                <Flex 
                  as="button" 
                  align="center" 
                  justify="center"
                  w="64px" 
                  h="64px" 
                  borderRadius="full" 
                  border="2px dashed" 
                  borderColor={theme.borderLight}
                  bg={theme.cardBg}
                  _hover={{ bg: theme.hoverBg, borderColor: theme.textSecondary }} 
                  onClick={() => setAddrOpen(true)}
                  transition="all 0.2s"
                  disabled={isPlacingOrder}
                >
                  <FiPlus size={28} color={theme.textSecondary} />
                </Flex>
                <Text color={theme.textSecondary} fontWeight="semibold">Add your shipping address</Text>
              </Flex>
            ) : (
              <Box 
                p={4} 
                bg={theme.secondaryBg}
                borderRadius="lg"
                border="1px solid"
                borderColor={theme.border}
              >
                <Flex justify="space-between" align="start" gap={3}>
                  <Box flex={1}>
                    <Text fontWeight="bold" color={theme.text} mb={1}>
                      {address.fullName}
                    </Text>
                    <Text color={theme.textMuted} fontSize="sm" mb={1}>
                      {address.phone}
                    </Text>
                    <Text color={theme.textSecondary} fontSize="sm">
                      {address.line1}
                      {address.ward ? `, ${address.ward}` : ''}
                      {address.district ? `, ${address.district}` : ''}
                      {address.city ? `, ${address.city}` : ''}
                    </Text>
                  </Box>
                  <Button 
                    size="sm" 
                    variant="outline"
                    borderColor={theme.border}
                    color={theme.textSecondary}
                    _hover={{ bg: theme.hoverBg }}
                    onClick={() => setAddrOpen(true)}
                    disabled={isPlacingOrder}
                  >
                    Change
                  </Button>
                </Flex>
              </Box>
            )}
          </Box>

          {/* Order details */}
          <Box 
            bg={theme.cardBg}
            border="1px solid" 
            borderColor={theme.border}
            borderRadius="xl" 
            p={6} 
            mb={4}
            shadow="sm"
          >
            <Flex align="center" gap={2} mb={4}>
              <Icon as={FiPackage} boxSize={5} color={theme.textSecondary} />
              <Heading size="md" color={theme.text} fontWeight="bold">
                Order Items
              </Heading>
              {cart?.items?.length > 0 && (
                <Badge 
                  bg={theme.secondaryBg}
                  color={theme.textSecondary}
                  border="1px solid"
                  borderColor={theme.border}
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
                <Text color={theme.textPlaceholder} fontSize="sm">Your cart is empty</Text>
              </Box>
            ) : (
              <Box>
                {cart.items.map((it, idx) => (
                  <Box key={it.id}>
                    <Flex py={4} align="center" gap={3}>
                      <Box flex={1}>
                        <Text fontWeight="semibold" color={theme.text} noOfLines={1}>
                          {it.productName}
                        </Text>
                        <Text color={theme.textMuted} fontSize="sm">
                          Qty: {it.quantity}
                        </Text>
                      </Box>
                      <Text fontWeight="bold" color={theme.text}>
                        {currency(it.totalPrice)}
                      </Text>
                    </Flex>
                    {idx < cart.items.length - 1 && (
                      <Box h="1px" bg={theme.border} />
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* Voucher */}
          <Box 
            bg={theme.cardBg}
            border="1px solid" 
            borderColor={theme.border}
            borderRadius="xl" 
            p={6}
            shadow="sm"
          >
            <Flex align="center" gap={2} mb={4}>
              <Icon as={FiTag} boxSize={5} color={theme.textSecondary} />
              <Heading size="md" color={theme.text} fontWeight="bold">
                Discount Code
              </Heading>
            </Flex>

            <Flex gap={3}>
              <Input 
                placeholder="Enter code (e.g., SALE10)" 
                value={voucher} 
                onChange={e => setVoucher(e.target.value)}
                bg={theme.inputBg}
                color={theme.text}
                borderColor={theme.border}
                _placeholder={{ color: theme.textPlaceholder }}
                _hover={{ borderColor: theme.borderLight }}
                _focus={{ borderColor: theme.accent, boxShadow: `0 0 0 1px ${theme.accent}` }}
                disabled={isPlacingOrder}
              />
              <Button 
                onClick={applyVoucher}
                bg={theme.primary}
                color="white"
                _hover={{ bg: theme.primaryHover }}
                fontWeight="semibold"
                px={6}
                disabled={isPlacingOrder}
              >
                Apply
              </Button>
            </Flex>

            {voucherApplied && (
              <Flex 
                mt={3} 
                p={3} 
                bg={theme.isLight ? "#D1E7DD" : "#0F5132"}
                borderRadius="lg"
                align="center"
                gap={2}
              >
                <Icon as={FiTag} color={theme.isLight ? "#0F5132" : "#D1E7DD"} />
                <Text color={theme.isLight ? "#0F5132" : "#D1E7DD"} fontSize="sm" fontWeight="medium">
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
            bg={theme.cardBg}
            border="1px solid" 
            borderColor={theme.border}
            borderRadius="xl" 
            p={6} 
            mb={4}
            shadow="sm"
          >
            <Flex align="center" gap={2} mb={4}>
              <Icon as={FiCreditCard} boxSize={5} color={theme.textSecondary} />
              <Heading size="md" color={theme.text} fontWeight="bold">
                Payment Summary
              </Heading>
            </Flex>

            <Box>
              <Flex justify="space-between" py={2}>
                <Text color={theme.textMuted}>Subtotal</Text>
                <Text fontWeight="semibold" color={theme.text}>
                  {currency(subtotal)}
                </Text>
              </Flex>

              <Flex justify="space-between" py={2}>
                <Text color={theme.textMuted}>Shipping</Text>
                <Text fontWeight="semibold" color={shippingFee === 0 ? theme.success : theme.text}>
                  {shippingFee === 0 ? 'Free' : currency(shippingFee)}
                </Text>
              </Flex>

              {discount > 0 && (
                <Flex justify="space-between" py={2}>
                  <Text color={theme.textMuted}>Discount</Text>
                  <Text fontWeight="semibold" color={theme.success}>
                    -{currency(discount)}
                  </Text>
                </Flex>
              )}

              <Separator borderColor={theme.border} my={3} />

              <Flex justify="space-between" align="center" py={2}>
                <Text fontSize="lg" fontWeight="bold" color={theme.text}>
                  Total
                </Text>
                <Text fontSize="2xl" fontWeight="black" color={theme.text}>
                  {currency(grandTotal)}
                </Text>
              </Flex>
            </Box>
          </Box>

          {/* Payment Method */}
          <Box 
            bg={theme.cardBg}
            border="1px solid" 
            borderColor={theme.border}
            borderRadius="xl" 
            p={6} 
            mb={4}
            shadow="sm"
          >
            <Heading size="md" color={theme.text} fontWeight="bold" mb={4}>
              Payment Method
            </Heading>

            <RadioGroup 
              value={method} 
              onValueChange={(e) => setMethod(e.value)}
              disabled={isPlacingOrder}
            >
              <Flex direction="column" gap={3}>
                <Radio
                  value="PAYOS" 
                  p={3} 
                  border="1px solid"
                  borderColor={method === 'PAYOS' ? theme.accent : theme.border}
                  borderRadius="lg"
                  bg={method === 'PAYOS' ? theme.secondaryBg : theme.cardBg}
                  transition="all 0.2s"
                  opacity={isPlacingOrder ? 0.6 : 1}
                >
                  <Text fontWeight="semibold" color={theme.text}>PayOS</Text>
                  <Text fontSize="xs" color={theme.textMuted}>Vietnamese payment gateway</Text>
                </Radio>

                <Radio 
                  value="VISA"
                  p={3} 
                  border="1px solid"
                  borderColor={method === 'VISA' ? theme.accent : theme.border}
                  borderRadius="lg"
                  bg={method === 'VISA' ? theme.secondaryBg : theme.cardBg}
                  transition="all 0.2s"
                  opacity={isPlacingOrder ? 0.6 : 1}
                >
                  <Text fontWeight="semibold" color={theme.text}>Visa/Mastercard</Text>
                  <Text fontSize="xs" color={theme.textMuted}>Debit or Credit card</Text>
                </Radio>

                <Radio 
                  value="COD"
                  p={3} 
                  border="1px solid"
                  borderColor={method === 'COD' ? theme.accent : theme.border}
                  borderRadius="lg"
                  bg={method === 'COD' ? theme.secondaryBg : theme.cardBg}
                  transition="all 0.2s"
                  opacity={isPlacingOrder ? 0.6 : 1}
                >
                  <Text fontWeight="semibold" color={theme.text}>Cash on Delivery</Text>
                  <Text fontSize="xs" color={theme.textMuted}>Pay when you receive</Text>
                </Radio>
              </Flex>
            </RadioGroup>
          </Box>

          {/* Place Order Button */}
          <Button 
            w="full" 
            size="lg"
            bg={theme.primary}
            color="white"
            _hover={{ bg: theme.primaryHover }}
            fontWeight="bold"
            onClick={doPay}
            py={6}
            loading={isPlacingOrder}
            loadingText="Processing..."
            disabled={isPlacingOrder}
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