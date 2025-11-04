import { Badge, Box, Button, Flex, Heading, HStack, Icon, IconButton, Image, Separator, Text, VStack } from '@chakra-ui/react'
import { useEffect } from 'react'
import { LuArrowRight, LuPackage, LuShoppingCart, LuTrash2 } from 'react-icons/lu'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function Cart() {
  const { cart, reloadCart, removeCartItem, clearCart } = useCart()
  const nav = useNavigate()

  useEffect(() => { reloadCart() }, [reloadCart])
  if (!cart) return null

  const isEmpty = cart.items?.length === 0

  if (isEmpty) {
    return (
      <Box maxW="1200px" mx="auto" px={6}>
        {/* Empty State */}
        <Box 
          bg="white" 
          border="1px solid" 
          borderColor="#E2E8F0" 
          borderRadius="xl" 
          p={16}
          textAlign="center"
          shadow="sm"
          mt={8}
        >
          <Box
            w="120px"
            h="120px"
            bg="#F1F5F9"
            borderRadius="full"
            display="flex"
            alignItems="center"
            justifyContent="center"
            mx="auto"
            mb={6}
          > 
            <Icon as={LuShoppingCart} boxSize={14} color="#94A3B8" />
          </Box>
          
          <Heading size="2xl" fontWeight="black" color="#212529" mb={3}>
            Your Cart is Empty
          </Heading>
          <Text color="#64748B" fontSize="lg" mb={8} maxW="500px" mx="auto">
            Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
          </Text>
          
          <Button 
            size="lg" 
            bg="#3B82F6"
            color="white"
            onClick={() => nav('/products')}
            leftIcon={<LuPackage />}
            _hover={{ bg: "#2563EB" }}
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
              <Icon as={LuShoppingCart} boxSize={7} color="#495057" />
              <Text fontSize="4xl" fontWeight="black" color="#212529">
                Your Cart
              </Text>
            </HStack>
            <Text color="#6C757D" fontSize="lg">
              Review the items in your cart before proceeding to checkout.
            </Text>
          </Box>
          <Text color="#64748B" fontSize="md">
            {cart.items?.length} {cart.items?.length === 1 ? 'item' : 'items'} in your cart
          </Text>
        </Box>
        
        {cart.items?.length > 0 && (
          <Button 
            variant="outline"
            size="sm"
            borderColor="#E2E8F0"
            color="#EF4444"
            leftIcon={<LuTrash2 />}
            onClick={async () => { 
              await clearCart()
              reloadCart()
            }}
            _hover={{ bg: "#FEF2F2", borderColor: "#EF4444" }}
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
              bg="white" 
              border="1px solid" 
              borderColor="#E2E8F0"
              p={5}
              borderRadius="lg"
              shadow="sm"
              transition="all 0.2s"
              _hover={{ shadow: "md" }}
            >
              <Flex gap={4} align="start">
                {/* Product Image */}
                <Box
                  w="100px"
                  h="100px"
                  flexShrink={0}
                  borderRadius="lg"
                  overflow="hidden"
                  bg="#F8FAFC"
                  border="1px solid"
                  borderColor="#E2E8F0"
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
                  <Text fontWeight="bold" fontSize="lg" color="#212529">
                    {it.productName}
                  </Text>
                  
                  {it.optionValues && Object.keys(it.optionValues).length > 0 && (
                    <HStack spacing={2} flexWrap="wrap">
                      {Object.entries(it.optionValues).map(([k, v]) => (
                        <Badge 
                          key={k} 
                          bg="#8B5CF615"
                          color="#8B5CF6"
                          border="1px solid"
                          borderColor="#8B5CF630"
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
                    <Text fontSize="sm" color="#64748B">
                      Quantity: <Text as="span" fontWeight="semibold" color="#212529">{it.quantity}</Text>
                    </Text>
                    <Text fontSize="sm" color="#64748B">
                      Price: <Text as="span" fontWeight="semibold" color="#212529">${it.productPrice.toLocaleString()}</Text>
                    </Text>
                  </HStack>
                </VStack>

                {/* Price & Actions */}
                <VStack spacing={3} align="end">
                  <Text fontWeight="black" fontSize="xl" color="#212529">
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
                    _hover={{ bg: "#FEF2F2" }}
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
            bg="white"
            border="1px solid"
            borderColor="#E2E8F0"
            borderRadius="lg"
            p={6}
            shadow="sm"
          >
            <Heading size="md" mb={5} color="#212529">
              Order Summary
            </Heading>
            
            <VStack spacing={4} align="stretch">
              <Flex justify="space-between">
                <Text color="#64748B">Subtotal</Text>
                <Text fontWeight="semibold" color="#212529">
                  ${cart.grandTotal?.toLocaleString()}
                </Text>
              </Flex>
              
              <Flex justify="space-between">
                <Text color="#64748B">Shipping</Text>
                <Text fontWeight="semibold" color="#10B981">
                  Free
                </Text>
              </Flex>
              
              <Separator borderColor="#E2E8F0" />
              
              <Flex justify="space-between" align="center">
                <Text fontSize="lg" fontWeight="bold" color="#212529">
                  Total
                </Text>
                <Text fontSize="2xl" fontWeight="black" color="#212529">
                  ${cart.grandTotal?.toLocaleString()}
                </Text>
              </Flex>
              
              <Button 
                size="lg"
                colorPalette="gray"
                onClick={() => nav('/checkout')}
                rightIcon={<LuArrowRight />}
                fontWeight="semibold"
                mt={2}
                w="full"
              >
                Proceed to Checkout
              </Button>
              
              <Button 
                size="md"
                variant="outline"
                borderColor="#E2E8F0"
                colorPalette="gray"
                onClick={() => nav('/products')}
                w="full"
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