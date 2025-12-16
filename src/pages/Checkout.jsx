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
import { FiArrowLeft, FiCheckCircle, FiCreditCard, FiDollarSign, FiMapPin, FiPackage, FiPhone, FiPlus, FiShoppingBag, FiTag } from 'react-icons/fi'
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
  
  const [method, setMethod] = useState('PAYOS')
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [cart, setCart] = useState(null)
  const [address, setAddress] = useState(null)
  const [addingAddr, setAddingAddr] = useState(false)
  const [addrForm, setAddrForm] = useState({
    fullName: '', phone: '', line1: '', ward: '', district: '', city: '',
  })
  const [addrOpen, setAddrOpen] = useState(false)
  const [voucher, setVoucher] = useState('')
  const [voucherApplied, setVoucherApplied] = useState(null)

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

  const { subtotal, shippingFee, discount, grandTotal } = useMemo(() => {
    const items = cart?.items || []
    const sub = cart?.subTotal || 0
    const ship = cart?.shippingFee || 0
    const total = cart?.grandTotal || 0
    const disc = voucherApplied?.discount || 0
    return { subtotal: sub, shippingFee: ship, discount: disc, grandTotal: total - disc }
  }, [cart, voucherApplied])

  const applyVoucher = () => {
    const code = (voucher || '').trim().toUpperCase()
    if (!code) {
      setVoucherApplied(null)
      toaster.create({ type: 'info', description: 'Voucher removed' })
      return
    }
    if (code === 'SALE10') {
      const disc = Math.min(Math.round(subtotal * 0.1), 50)
      setVoucherApplied({ code, discount: disc })
      toaster.create({ type: 'success', description: `Applied SALE10: -${currency(disc)}` })
    } else {
      setVoucherApplied(null)
      toaster.create({ type: 'warning', description: 'Invalid voucher code' })
    }
  }

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
      const res = await placeOrder(method)
      const result = res?.result || res
      const link = result?.paymentLink || result?.checkoutUrl
      const orderId = result?.orderId || result?.id
      if (link) {
        window.location.assign(link)
        return
      }
      toaster.create({ 
        type: 'success', 
        title: 'Order Placed Successfully!',
        description: `Order #${orderId || ''} has been created` 
      })
      await reloadCart()
      setTimeout(() => { nav('/orders') }, 1500)
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
    <Box bg={theme.pageBg} minH="100vh" py={8} px={6} position="relative" overflow="hidden">
      {/* Decorative Background Patterns */}
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        pointerEvents="none"
        style={{
          background: theme.isLight
            ? 'radial-gradient(circle at 18% 25%, rgba(59, 130, 246, 0.16) 0%, transparent 52%), radial-gradient(circle at 82% 75%, rgba(139, 92, 246, 0.14) 0%, transparent 52%)'
            : 'radial-gradient(circle at 18% 25%, rgba(59, 130, 246, 0.26) 0%, transparent 52%), radial-gradient(circle at 82% 75%, rgba(139, 92, 246, 0.22) 0%, transparent 52%)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Top-right floating glow */}
      <Box
        position="absolute"
        top="10%"
        right="8%"
        w="260px"
        h="260px"
        borderRadius="full"
        bg={theme.isLight ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.6)'}
        filter="blur(75px)"
        pointerEvents="none"
        zIndex={0}
        animation="float 13s ease-in-out infinite"
      />

      {/* Bottom-left floating glow */}
      <Box
        position="absolute"
        bottom="12%"
        left="6%"
        w="230px"
        h="230px"
        borderRadius="full"
        bg={theme.isLight ? 'rgba(139,92,246,0.35)' : 'rgba(139,92,246,0.55)'}
        filter="blur(65px)"
        pointerEvents="none"
        zIndex={0}
        animation="float 16s ease-in-out infinite reverse"
      />

      <Box maxW="1200px" mx="auto" position="relative" zIndex={1}>
        {/* Enhanced Header */}
        <Box mb={8}>
          <Flex justify="space-between" align="end" mb={4} flexWrap="wrap" gap={4}>
            <Box>
              <Flex align="center" gap={3} mb={3}>
                <Box
                  w="48px"
                  h="48px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  borderRadius="xl"
                  background={theme.isLight 
                    ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                    : 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)'
                  }
                  boxShadow="0 4px 12px rgba(59, 130, 246, 0.3)"
                >
                  <Icon as={FiShoppingBag} boxSize={6} color="white" />
                </Box>
                <Heading size="4xl" fontWeight="black" color={theme.text}>
                  Checkout
                </Heading>
              </Flex>
              <Text color={theme.textMuted} fontSize="lg" maxW="500px">
                Review your order details and complete your purchase securely
              </Text>
            </Box>

            <Button
              variant="outline"
              leftIcon={<FiArrowLeft />}
              onClick={() => nav('/cart')}
              borderColor={theme.border}
              color={theme.textSecondary}
              _hover={{ bg: theme.hoverBg }}
              fontWeight="semibold"
              disabled={isPlacingOrder}
              h="48px"
              px={6}
            >
              Back to Cart
            </Button>
          </Flex>
        </Box>

        <Grid templateColumns={{ base: '1fr', lg: '1.5fr 1fr' }} gap={6}>
          {/* LEFT: Address + Items + Voucher */}
          <Box>
            {/* Enhanced Address Section */}
            <Box 
              bg={theme.cardBg}
              border="1px solid" 
              borderColor={theme.border}
              borderRadius="xl" 
              p={6} 
              mb={4}
              boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.05)"
              transition="all 0.2s ease"
              position="relative"
              overflow="hidden"
            >
              <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                h="100px"
                background={theme.isLight
                  ? 'linear-gradient(180deg, rgba(59, 130, 246, 0.04) 0%, transparent 100%)'
                  : 'linear-gradient(180deg, rgba(59, 130, 246, 0.08) 0%, transparent 100%)'
                }
                pointerEvents="none"
              />

              <Flex align="center" gap={3} mb={5} position="relative">
                <Box
                  w="36px"
                  h="36px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  borderRadius="lg"
                  background={theme.isLight 
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(30, 64, 175, 0.2) 100%)'
                  }
                >
                  <Icon as={FiMapPin} boxSize={5} color={theme.accent} />
                </Box>
                <Heading size="md" color={theme.text} fontWeight="bold">
                  Shipping Address
                </Heading>
              </Flex>

              <Box position="relative">
                {!address ? (
                  <Flex 
                    align="center" 
                    justify="center" 
                    direction="column" 
                    py={10} 
                    gap={4}
                    borderRadius="xl"
                    bg={theme.secondaryBg}
                    border="2px dashed"
                    borderColor={theme.border}
                    transition="all 0.2s"
                    _hover={{ borderColor: theme.borderLight, bg: theme.hoverBg }}
                  >
                    <Box
                      w="80px"
                      h="80px"
                      borderRadius="full"
                      bg={theme.cardBg}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      border="3px dashed"
                      borderColor={theme.border}
                      position="relative"
                    >
                      <Box
                        position="absolute"
                        inset="-8px"
                        borderRadius="full"
                        background={theme.isLight ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.15)'}
                        animation="pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                      />
                      <Icon as={FiMapPin} boxSize={8} color={theme.textMuted} />
                    </Box>
                    
                    <Box textAlign="center">
                      <Text color={theme.text} fontWeight="semibold" mb={1}>
                        No address added yet
                      </Text>
                      <Text color={theme.textMuted} fontSize="sm" mb={4}>
                        Add a shipping address to continue
                      </Text>
                      <Button
                        onClick={() => setAddrOpen(true)}
                        disabled={isPlacingOrder}
                        leftIcon={<FiPlus />}
                        background={theme.isLight 
                          ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                          : 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)'
                        }
                        color="white"
                        px={6}
                        boxShadow="0 4px 12px rgba(59, 130, 246, 0.3)"
                        _hover={{ 
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 16px rgba(59, 130, 246, 0.4)'
                        }}
                        transition="all 0.2s ease"
                      >
                        Add Address
                      </Button>
                    </Box>
                  </Flex>
                ) : (
                  <Box 
                    p={5} 
                    bg={theme.secondaryBg}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor={theme.border}
                    transition="all 0.2s"
                    _hover={{ borderColor: theme.borderLight }}
                  >
                    <Flex justify="space-between" align="start" gap={4}>
                      <Box flex={1}>
                        <Flex align="center" gap={2} mb={2}>
                          <Icon as={FiCheckCircle} color={theme.isLight ? '#10B981' : '#34D399'} boxSize={4} />
                          <Text fontWeight="bold" color={theme.text} fontSize="lg">
                            {address.fullName}
                          </Text>
                        </Flex>
                        <Flex align="center" gap={2} color={theme.textMuted} fontSize="sm" pl={1} mb={2}>
                          <FiPhone /> {address.phone}
                        </Flex>
                        <Text color={theme.textSecondary} fontSize="sm" lineHeight="1.6">
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
                        _hover={{ bg: theme.hoverBg, borderColor: theme.borderLight }}
                        onClick={() => setAddrOpen(true)}
                        disabled={isPlacingOrder}
                        fontWeight="semibold"
                      >
                        Change
                      </Button>
                    </Flex>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Enhanced Order Items */}
            <Box 
              bg={theme.cardBg}
              border="1px solid" 
              borderColor={theme.border}
              borderRadius="xl" 
              p={6} 
              mb={4}
              boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.05)"
              transition="all 0.2s ease"
              position="relative"
              overflow="hidden"
            >
              <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                h="100px"
                background={theme.isLight
                  ? 'linear-gradient(180deg, rgba(59, 130, 246, 0.04) 0%, transparent 100%)'
                  : 'linear-gradient(180deg, rgba(59, 130, 246, 0.08) 0%, transparent 100%)'
                }
                pointerEvents="none"
              />

              <Flex align="center" gap={3} mb={5} position="relative">
                <Box
                  w="36px"
                  h="36px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  borderRadius="lg"
                  background={theme.isLight 
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(30, 64, 175, 0.2) 100%)'
                  }
                >
                  <Icon as={FiPackage} boxSize={5} color={theme.accent} />
                </Box>
                <Heading size="md" color={theme.text} fontWeight="bold">
                  Order Items
                </Heading>
                {cart?.items?.length > 0 && (
                  <Badge 
                    background={theme.isLight 
                      ? 'linear-gradient(135deg, #E7F5FF 0%, #D0EBFF 100%)' 
                      : 'linear-gradient(135deg, #1E3A5F 0%, #1E40AF 100%)'
                    }
                    color={theme.isLight ? "#1971C2" : "#60A5FA"}
                    px={3}
                    py={1}
                    borderRadius="md"
                    fontSize="xs"
                    fontWeight="semibold"
                    border="1px solid"
                    borderColor={theme.isLight ? "#A5D8FF" : "#1E40AF"}
                  >
                    {cart.items.length}
                  </Badge>
                )}
              </Flex>

              <Box position="relative">
                {!cart?.items?.length ? (
                  <Box py={8} textAlign="center">
                    <Box
                      w="100px"
                      h="100px"
                      bg={theme.secondaryBg}
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      mx="auto"
                      mb={4}
                      border="3px dashed"
                      borderColor={theme.border}
                    >
                      <Icon as={FiPackage} boxSize={10} color={theme.textMuted} />
                    </Box>
                    <Text color={theme.textSecondary} fontSize="sm" fontWeight="medium">
                      Your cart is empty
                    </Text>
                  </Box>
                ) : (
                  <Box>
                    {cart.items.map((it, idx) => (
                      <Box key={it.id}>
                        <Flex 
                          py={4} 
                          align="center" 
                          gap={4}
                          transition="all 0.2s"
                          _hover={{ bg: theme.secondaryBg }}
                          px={3}
                          mx={-3}
                          borderRadius="lg"
                        >
                          <Box flex={1}>
                            <Text fontWeight="semibold" color={theme.text} mb={1} noOfLines={1}>
                              {it.productName}
                            </Text>
                            <Flex gap={2} align="center">
                              <Badge
                                bg={theme.secondaryBg}
                                color={theme.textMuted}
                                fontSize="xs"
                                px={2}
                                py={0.5}
                                borderRadius="md"
                              >
                                Qty: {it.quantity}
                              </Badge>
                              <Text color={theme.textMuted} fontSize="sm">
                                × {currency(it.productPrice)}
                              </Text>
                            </Flex>
                          </Box>
                          <Text fontWeight="bold" color={theme.text} fontSize="lg">
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
            </Box>

            {/* Enhanced Voucher Section */}
            <Box 
              bg={theme.cardBg}
              border="1px solid" 
              borderColor={theme.border}
              borderRadius="xl" 
              p={6}
              boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.05)"
              transition="all 0.2s ease"
              position="relative"
              overflow="hidden"
            >
              <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                h="100px"
                background={theme.isLight
                  ? 'linear-gradient(180deg, rgba(59, 130, 246, 0.04) 0%, transparent 100%)'
                  : 'linear-gradient(180deg, rgba(59, 130, 246, 0.08) 0%, transparent 100%)'
                }
                pointerEvents="none"
              />

              <Flex align="center" gap={3} mb={5} position="relative">
                <Box
                  w="36px"
                  h="36px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  borderRadius="lg"
                  background={theme.isLight 
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(30, 64, 175, 0.2) 100%)'
                  }
                >
                  <Icon as={FiTag} boxSize={5} color={theme.accent} />
                </Box>
                <Heading size="md" color={theme.text} fontWeight="bold">
                  Discount Code
                </Heading>
              </Flex>

              <Flex gap={3} position="relative">
                <Input 
                  placeholder="Enter code (e.g., SALE10)" 
                  value={voucher} 
                  onChange={e => setVoucher(e.target.value)}
                  bg={theme.inputBg}
                  color={theme.text}
                  borderColor={theme.border}
                  _placeholder={{ color: theme.textPlaceholder }}
                  _hover={{ borderColor: theme.borderLight }}
                  _focus={{ borderColor: theme.accent, boxShadow: `0 0 0 3px ${theme.isLight ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.2)'}` }}
                  disabled={isPlacingOrder}
                  h="48px"
                  borderRadius="lg"
                />
                <Button 
                  onClick={applyVoucher}
                  background={theme.isLight 
                    ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                    : 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)'
                  }
                  color="white"
                  _hover={{ 
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(59, 130, 246, 0.4)'
                  }}
                  fontWeight="semibold"
                  px={8}
                  disabled={isPlacingOrder}
                  h="48px"
                  borderRadius="lg"
                  boxShadow="0 4px 12px rgba(59, 130, 246, 0.3)"
                  transition="all 0.2s ease"
                >
                  Apply
                </Button>
              </Flex>

              {voucherApplied && (
                <Flex 
                  mt={4} 
                  p={4} 
                  background="linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)"
                  borderRadius="lg"
                  align="center"
                  gap={3}
                  border="1px solid"
                  borderColor={theme.isLight ? "#6EE7B7" : "#059669"}
                >
                  <Box
                    w="32px"
                    h="32px"
                    borderRadius="full"
                    bg="white"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon as={FiCheckCircle} color="#059669" boxSize={5} />
                  </Box>
                  <Box flex={1}>
                    <Text color="#065F46" fontSize="sm" fontWeight="bold">
                      Code Applied: {voucherApplied.code}
                    </Text>
                    <Text color="#047857" fontSize="xs">
                      You saved {currency(voucherApplied.discount)}
                    </Text>
                  </Box>
                </Flex>
              )}
            </Box>
          </Box>

          {/* RIGHT: Payment summary + Method + Place order */}
          <Box>
            {/* Enhanced Payment Summary */}
            <Box 
              bg={theme.cardBg}
              border="1px solid" 
              borderColor={theme.border}
              borderRadius="xl" 
              p={6} 
              mb={4}
              boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.05)"
              transition="all 0.2s ease"
              position="relative"
              overflow="hidden"
            >
              <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                h="120px"
                background={theme.isLight
                  ? 'linear-gradient(180deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%)'
                  : 'linear-gradient(180deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)'
                }
                pointerEvents="none"
              />

              <Flex align="center" gap={3} mb={5} position="relative">
                <Box
                  w="36px"
                  h="36px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  borderRadius="lg"
                  background={theme.isLight 
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(30, 64, 175, 0.2) 100%)'
                  }
                >
                  <Icon as={FiDollarSign} boxSize={5} color={theme.accent} />
                </Box>
                <Heading size="md" color={theme.text} fontWeight="bold">
                  Payment Summary
                </Heading>
              </Flex>

              <Box position="relative">
                <Flex justify="space-between" py={3}>
                  <Text color={theme.textMuted} fontWeight="medium">Subtotal</Text>
                  <Text fontWeight="semibold" color={theme.text}>
                    {currency(subtotal)}
                  </Text>
                </Flex>

                <Flex justify="space-between" py={3}>
                  <Text color={theme.textMuted} fontWeight="medium">Shipping</Text>
                  {shippingFee === 0 ? (
                    <Badge
                      background="linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)"
                      color="#065F46"
                      fontWeight="semibold"
                      px={3}
                      py={1}
                      borderRadius="md"
                    >
                      Free
                    </Badge>
                  ) : (
                    <Text fontWeight="semibold" color={theme.text}>
                      {currency(shippingFee)}
                    </Text>
                  )}
                </Flex>

                {discount > 0 && (
                  <Flex justify="space-between" py={3}>
                    <Text color={theme.textMuted} fontWeight="medium">Discount</Text>
                    <Text fontWeight="semibold" color={theme.isLight ? '#10B981' : '#34D399'}>
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

            {/* Enhanced Payment Method */}
            <Box 
              bg={theme.cardBg}
              border="1px solid" 
              borderColor={theme.border}
              borderRadius="xl" 
              p={6} 
              mb={4}
              boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.05)"
              transition="all 0.2s ease"
              position="relative"
              overflow="hidden"
            >
              <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                h="100px"
                background={theme.isLight
                  ? 'linear-gradient(180deg, rgba(59, 130, 246, 0.04) 0%, transparent 100%)'
                  : 'linear-gradient(180deg, rgba(59, 130, 246, 0.08) 0%, transparent 100%)'
                }
                pointerEvents="none"
              />

              <Flex align="center" gap={3} mb={5} position="relative">
                <Box
                  w="36px"
                  h="36px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  borderRadius="lg"
                  background={theme.isLight 
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(30, 64, 175, 0.2) 100%)'
                  }
                >
                  <Icon as={FiCreditCard} boxSize={5} color={theme.accent} />
                </Box>
                <Heading size="md" color={theme.text} fontWeight="bold">
                  Payment Method
                </Heading>
              </Flex>

              <RadioGroup 
                value={method} 
                onValueChange={(e) => setMethod(e.value)}
                disabled={isPlacingOrder}
              >
                <Flex direction="column" gap={3} position="relative">
                  <Radio
                    value="PAYOS" 
                    p={4} 
                    border="2px solid"
                    borderColor={method === 'PAYOS' ? theme.accent : theme.border}
                    borderRadius="xl"
                    bg={method === 'PAYOS' ? (theme.isLight ? 'rgba(59, 130, 246, 0.05)' : 'rgba(37, 99, 235, 0.1)') : theme.cardBg}
                    transition="all 0.2s"
                    opacity={isPlacingOrder ? 0.6 : 1}
                    _hover={{ borderColor: theme.accent, transform: 'translateY(-2px)' }}
                    boxShadow={method === 'PAYOS' ? '0 4px 12px rgba(59, 130, 246, 0.2)' : 'none'}
                  >
                    <Text fontWeight="semibold" color={theme.text}>PayOS</Text>
                    <Text fontSize="xs" color={theme.textMuted}>Vietnamese payment gateway</Text>
                  </Radio>

                  <Radio 
                    value="VISA"
                    p={4} 
                    border="2px solid"
                    borderColor={method === 'VISA' ? theme.accent : theme.border}
                    borderRadius="xl"
                    bg={method === 'VISA' ? (theme.isLight ? 'rgba(59, 130, 246, 0.05)' : 'rgba(37, 99, 235, 0.1)') : theme.cardBg}
                    transition="all 0.2s"
                    opacity={isPlacingOrder ? 0.6 : 1}
                    _hover={{ borderColor: theme.accent, transform: 'translateY(-2px)' }}
                    boxShadow={method === 'VISA' ? '0 4px 12px rgba(59, 130, 246, 0.2)' : 'none'}
                  >
                    <Text fontWeight="semibold" color={theme.text}>Visa/Mastercard</Text>
                    <Text fontSize="xs" color={theme.textMuted}>Debit or Credit card</Text>
                  </Radio>

                  <Radio 
                    value="COD"
                    p={4} 
                    border="2px solid"
                    borderColor={method === 'COD' ? theme.accent : theme.border}
                    borderRadius="xl"
                    bg={method === 'COD' ? (theme.isLight ? 'rgba(59, 130, 246, 0.05)' : 'rgba(37, 99, 235, 0.1)') : theme.cardBg}
                    transition="all 0.2s"
                    opacity={isPlacingOrder ? 0.6 : 1}
                    _hover={{ borderColor: theme.accent, transform: 'translateY(-2px)' }}
                    boxShadow={method === 'COD' ? '0 4px 12px rgba(59, 130, 246, 0.2)' : 'none'}
                  >
                    <Text fontWeight="semibold" color={theme.text}>Cash on Delivery</Text>
                    <Text fontSize="xs" color={theme.textMuted}>Pay when you receive</Text>
                  </Radio>
                </Flex>
              </RadioGroup>
            </Box>

            {/* Enhanced Place Order Button */}
            <Button 
              w="full" 
              size="lg"
              background={theme.isLight 
                ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                : 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)'
              }
              color="white"
              _hover={{ 
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 20px rgba(59, 130, 246, 0.5)'
              }}
              fontWeight="bold"
              onClick={doPay}
              py={7}
              borderRadius="xl"
              boxShadow="0 4px 12px rgba(59, 130, 246, 0.3)"
              loading={isPlacingOrder}
              loadingText="Processing..."
              disabled={isPlacingOrder}
              transition="all 0.2s ease"
            >
              Place Order
            </Button>
          </Box>
        </Grid>

        {/* Address picker modal */}
        <AddressPicker
          open={addrOpen}
          onClose={() => setAddrOpen(false)}
          onSelect={(addr) => setAddress(addr)}
        />
      </Box>

      {/* Animations */}
      <style>
        {`
          @keyframes float {
            0%, 100% {
              transform: translate(0, 0);
            }
            50% {
              transform: translate(25px, -25px);
            }
          }
          
          @keyframes pulseRing {
            0%, 100% {
              transform: scale(1);
              opacity: 0.3;
            }
            50% {
              transform: scale(1.15);
              opacity: 0;
            }
          }
        `}
      </style>
    </Box>
  )
}