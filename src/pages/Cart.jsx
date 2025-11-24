import { Badge, Box, Button, Flex, Heading, HStack, Icon, IconButton, Image, Separator, Text, VStack } from '@chakra-ui/react'
import { useEffect } from 'react'
import { LuArrowRight, LuPackage, LuShoppingCart, LuTrash2 } from 'react-icons/lu'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useTheme } from '../context/ThemeContext'

export default function Cart() {
  const { theme } = useTheme()
  const { cart, reloadCart, removeCartItem, clearCart } = useCart()
  const nav = useNavigate()

  useEffect(() => { reloadCart() }, [reloadCart])
  if (!cart) return null

  const isEmpty = cart.items?.length === 0

  if (isEmpty) {
    return (
      <Box maxW="1200px" mx="auto" px={6} minH="100vh" bg={theme.pageBg}>
        {/* Empty State */}
        <Box 
          border="1px solid" 
          borderColor={theme.border}
          borderRadius="xl" 
          p={16}
          textAlign="center"
          shadow="sm"
          mt={8}
        >
          <Box
            w="120px"
            h="120px"
            bg={theme.secondaryBg}
            borderRadius="full"
            display="flex"
            alignItems="center"
            justifyContent="center"
            mx="auto"
            mb={6}
          > 
            <Icon as={LuShoppingCart} boxSize={14} color={theme.textMuted} />
          </Box>
          
          <Heading size="2xl" fontWeight="black" color={theme.text} mb={3}>
            Your Cart is Empty
          </Heading>
          <Text color={theme.textSecondary} fontSize="lg" mb={8} maxW="500px" mx="auto">
            Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
          </Text>
          
          <Button 
            size="lg" 
            bg={theme.accent}
            color="white"
            onClick={() => nav('/products')}
            leftIcon={<LuPackage />}
            _hover={{ bg: theme.accentHover }}
            fontWeight="semibold"
            px={8}
          >
            Browse Products
          </Button>
        </Box>
      </Box>
    )
  }

  return (
    <Box maxW="1200px" minH="100vh" mx="auto" px={6} py={8}>
      {/* Page Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Box mb={8}>
            <HStack spacing={3} mb={3}>
              <Icon as={LuShoppingCart} boxSize={7} color={theme.textSecondary} />
              <Text fontSize="4xl" fontWeight="black" color={theme.text}>
                Your Cart
              </Text>
            </HStack>
            <Text color={theme.textMuted} fontSize="lg">
              Review the items in your cart before proceeding to checkout.
            </Text>
          </Box>
          <Text color={theme.textSecondary} fontSize="md">
            {cart.items?.length} {cart.items?.length === 1 ? 'item' : 'items'} in your cart
          </Text>
        </Box>
        
        {cart.items?.length > 0 && (
          <Button 
            variant="outline"
            size="sm"
            borderColor={theme.border}
            color="#EF4444"
            leftIcon={<LuTrash2 />}
            onClick={async () => { 
              await clearCart()
              reloadCart()
            }}
            _hover={{ bg: theme.isLight ? "#FEF2F2" : "#7F1D1D", borderColor: "#EF4444" }}
          >
            Clear Cart
          </Button>
        )}
      </Flex>

      <Flex gap={6} direction={{ base: "column", lg: "row" }}>
        {/* Cart Items */}
        <VStack align="stretch" spacing={3} flex={1}>
          {cart.items?.map(it => (
            <Box 
              key={it.id} 
              bg={theme.cardBg}
              border="1px solid" 
              borderColor={theme.border}
              p={5}
              borderRadius="lg"
              shadow="sm"
              transition="all 0.2s"
              _hover={{ shadow: "md", borderColor: theme.borderLight }}
            >
              <Flex gap={4} align="start">
                {/* Product Image */}
                <Box
                  w="100px"
                  h="100px"
                  flexShrink={0}
                  borderRadius="lg"
                  overflow="hidden"
                  bg={theme.secondaryBg}
                  border="1px solid"
                  borderColor={theme.border}
                >
                  <Image 
                    src={import.meta.env.VITE_API_URL + "/uploads/" + it.productImageUrl || '/placeholder.png'} 
                    alt={it.productName} 
                    w="full"
                    h="full"
                    objectFit="cover"
                  />
                </Box>
                
                {/* Product Info */}
                <VStack align="start" flex={1} spacing={2}>
                  <Text fontWeight="bold" fontSize="lg" color={theme.text}>
                    {it.productName}
                  </Text>
                  
                  {it.optionValues && Object.keys(it.optionValues).length > 0 && (
                    <HStack spacing={2} flexWrap="wrap">
                      {Object.entries(it.optionValues).map(([k, v]) => (
                        <Badge 
                          key={k} 
                          bg={theme.isLight ? "#8B5CF615" : "#8B5CF625"}
                          color={theme.isLight ? "#8B5CF6" : "#C4B5FD"}
                          border="1px solid"
                          borderColor={theme.isLight ? "#8B5CF630" : "#8B5CF640"}
                          px={2}
                          py={1}
                          borderRadius="md"
                          fontSize="xs"
                          fontWeight="semibold"
                        >
                          {k}: {v}
                        </Badge>
                      ))}
                    </HStack>
                  )}
                  
                  <HStack spacing={4} mt={2}>
                    <Text fontSize="sm" color={theme.textSecondary}>
                      Quantity: <Text as="span" fontWeight="semibold" color={theme.text}>{it.quantity}</Text>
                    </Text>
                    <Text fontSize="sm" color={theme.textSecondary}>
                      Price: <Text as="span" fontWeight="semibold" color={theme.text}>${it.productPrice.toLocaleString()}</Text>
                    </Text>
                  </HStack>
                </VStack>

                {/* Price & Actions */}
                <VStack spacing={3} align="end">
                  <Text fontWeight="black" fontSize="xl" color={theme.text}>
                    ${(it.productPrice * it.quantity).toLocaleString()}
                  </Text>
                  <IconButton 
                    size="sm" 
                    variant="ghost"
                    color="#EF4444"
                    onClick={async () => { 
                      await removeCartItem(it.productId)
                      reloadCart()
                    }}
                    _hover={{ bg: theme.isLight ? "#FEF2F2" : "#7F1D1D" }}
                  >
                    <LuTrash2 />
                  </IconButton>
                </VStack>
              </Flex>
            </Box>
          ))}
        </VStack>

        {/* Order Summary */}
        <Box 
          w={{ base: "full", lg: "400px" }}
          h="fit-content"
          position={{ lg: "sticky" }}
          top="100px"
        >
          <Box
            bg={theme.cardBg}
            border="1px solid"
            borderColor={theme.border}
            borderRadius="lg"
            p={6}
            shadow="sm"
          >
            <Heading size="md" mb={5} color={theme.text}>
              Order Summary
            </Heading>
            
            <VStack spacing={4} align="stretch">
              <Flex justify="space-between">
                <Text color={theme.textSecondary}>Subtotal</Text>
                <Text fontWeight="semibold" color={theme.text}>
                  ${cart.grandTotal?.toLocaleString()}
                </Text>
              </Flex>
              
              <Flex justify="space-between">
                <Text color={theme.textSecondary}>Shipping</Text>
                <Text fontWeight="semibold" color="#10B981">
                  Free
                </Text>
              </Flex>
              
              <Separator borderColor={theme.border} />
              
              <Flex justify="space-between" align="center">
                <Text fontSize="lg" fontWeight="bold" color={theme.text}>
                  Total
                </Text>
                <Text fontSize="2xl" fontWeight="black" color={theme.text}>
                  ${cart.grandTotal?.toLocaleString()}
                </Text>
              </Flex>
              
              <Button 
                size="lg"
                bg={theme.primary}
                color="white"
                onClick={() => nav('/checkout')}
                rightIcon={<LuArrowRight />}
                fontWeight="semibold"
                mt={2}
                w="full"
                _hover={{ bg: theme.primaryHover }}
              >
                Proceed to Checkout
              </Button>
              
              <Button 
                size="md"
                variant="outline"
                borderColor={theme.border}
                color={theme.text}
                onClick={() => nav('/products')}
                w="full"
                _hover={{ bg: theme.hoverBg }}
              >
                Continue Shopping
              </Button>
            </VStack>
          </Box>
        </Box>
      </Flex>
    </Box>
  )
}