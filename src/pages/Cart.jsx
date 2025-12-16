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
      <Box minH="100vh" bg={theme.pageBg} position="relative" overflow="hidden">
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
              ? 'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.12) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)'
              : 'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
          }}
        />

        {/* Floating glows */}
        <Box
          position="absolute"
          top="15%"
          right="10%"
          w="200px"
          h="200px"
          borderRadius="full"
          bg={theme.isLight ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.5)'}
          filter="blur(60px)"
          pointerEvents="none"
          animation="float 10s ease-in-out infinite"
        />

        <Box maxW="1200px" mx="auto" px={6} py={8} position="relative" zIndex={1}>
          <Box 
            border="1px solid" 
            borderColor={theme.border}
            borderRadius="2xl" 
            p={16}
            textAlign="center"
            shadow="lg"
            mt={8}
            bg={theme.cardBg}
          >
            <Box
              w="140px"
              h="140px"
              bg={theme.secondaryBg}
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              mx="auto"
              mb={6}
              border="3px dashed"
              borderColor={theme.border}
              position="relative"
            >
              <Box
                position="absolute"
                inset="-10px"
                borderRadius="full"
                background={theme.isLight ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.15)'}
                animation="pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
              />
              <Icon as={LuShoppingCart} boxSize={16} color={theme.textMuted} />
            </Box>
            
            <Heading size="2xl" fontWeight="black" color={theme.text} mb={3}>
              Your Cart is Empty
            </Heading>
            <Text color={theme.textSecondary} fontSize="lg" mb={8} maxW="500px" mx="auto">
              Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
            </Text>
            
            <Button 
              size="lg" 
              background={theme.isLight 
                ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                : 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)'
              }
              color="white"
              onClick={() => nav('/products')}
              leftIcon={<LuPackage />}
              fontWeight="semibold"
              px={8}
              boxShadow="0 4px 12px rgba(59, 130, 246, 0.3)"
              _hover={{ 
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(59, 130, 246, 0.4)'
              }}
              transition="all 0.2s ease"
            >
              Browse Products
            </Button>
          </Box>
        </Box>

        <style>
          {`
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
            
            @keyframes float {
              0%, 100% {
                transform: translate(0, 0);
              }
              50% {
                transform: translate(20px, -20px);
              }
            }
          `}
        </style>
      </Box>
    )
  }

  return (
    <Box minH="100vh" bg={theme.pageBg} position="relative" overflow="hidden" py={8}>
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
            ? 'radial-gradient(circle at 18% 22%, rgba(59, 130, 246, 0.15) 0%, transparent 52%), radial-gradient(circle at 82% 78%, rgba(139, 92, 246, 0.12) 0%, transparent 52%)'
            : 'radial-gradient(circle at 18% 22%, rgba(59, 130, 246, 0.25) 0%, transparent 52%), radial-gradient(circle at 82% 78%, rgba(139, 92, 246, 0.18) 0%, transparent 52%)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Top-right floating glow */}
      <Box
        position="absolute"
        top="12%"
        right="8%"
        w="240px"
        h="240px"
        borderRadius="full"
        bg={theme.isLight ? 'rgba(59,130,246,0.35)' : 'rgba(59,130,246,0.55)'}
        filter="blur(70px)"
        pointerEvents="none"
        zIndex={0}
        animation="float 11s ease-in-out infinite"
      />

      {/* Bottom-left floating glow */}
      <Box
        position="absolute"
        bottom="12%"
        left="6%"
        w="220px"
        h="220px"
        borderRadius="full"
        bg={theme.isLight ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.5)'}
        filter="blur(65px)"
        pointerEvents="none"
        zIndex={0}
        animation="float 14s ease-in-out infinite reverse"
      />

      <Box maxW="1200px" mx="auto" px={6} position="relative" zIndex={1}>
        {/* Enhanced Page Header */}
        <Box mb={8}>
          <Flex justify="space-between" align="end" mb={4} flexWrap="wrap" gap={4}>
            <Box>
              <HStack spacing={3} mb={3}>
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
                  <Icon as={LuShoppingCart} boxSize={6} color="white" />
                </Box>
                <Text fontSize="4xl" fontWeight="black" color={theme.text}>
                  Your Cart
                </Text>
              </HStack>
              <Text color={theme.textMuted} fontSize="lg" maxW="500px" mb={3}>
                Review the items in your cart before proceeding to checkout.
              </Text>
              <HStack spacing={3}>
                <Badge
                  background={theme.isLight 
                    ? 'linear-gradient(135deg, #E7F5FF 0%, #D0EBFF 100%)' 
                    : 'linear-gradient(135deg, #1E3A5F 0%, #1E40AF 100%)'
                  }
                  color={theme.isLight ? "#1971C2" : "#60A5FA"}
                  px={3}
                  py={1.5}
                  borderRadius="md"
                  fontSize="sm"
                  fontWeight="semibold"
                  border="1px solid"
                  borderColor={theme.isLight ? "#A5D8FF" : "#1E40AF"}
                >
                  {cart.items?.length} {cart.items?.length === 1 ? 'item' : 'items'} in cart
                </Badge>
              </HStack>
            </Box>

            {cart.items?.length > 0 && (
              <Button 
                variant="solid"
                bg="#4e1111"
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
        </Box>

        <Flex gap={6} direction={{ base: "column", lg: "row" }}>
          {/* Cart Items */}
          <VStack align="stretch" spacing={4} flex={1}>
            {cart.items?.map(it => (
              <Box 
                key={it.id} 
                bg={theme.cardBg}
                border="1px solid" 
                borderColor={theme.border}
                p={5}
                borderRadius="xl"
                shadow="sm"
                transition="all 0.2s"
                _hover={{ 
                  shadow: "lg", 
                  borderColor: theme.borderLight,
                  transform: 'translateY(-2px)'
                }}
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
                            background={theme.isLight 
                              ? 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)' 
                              : 'linear-gradient(135deg, #581C87 0%, #6B21A8 100%)'
                            }
                            color={theme.isLight ? "#7C3AED" : "#C4B5FD"}
                            border="1px solid"
                            borderColor={theme.isLight ? "#E9D5FF" : "#6B21A8"}
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

          {/* Enhanced Order Summary */}
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
              borderRadius="xl"
              p={6}
              shadow="lg"
              position="relative"
              overflow="hidden"
            >
              {/* Subtle gradient overlay */}
              <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                h="150px"
                background={theme.isLight
                  ? 'linear-gradient(180deg, rgba(59, 130, 246, 0.03) 0%, transparent 100%)'
                  : 'linear-gradient(180deg, rgba(59, 130, 246, 0.06) 0%, transparent 100%)'
                }
                pointerEvents="none"
              />

              <Heading size="md" mb={5} color={theme.text} position="relative">
                Order Summary
              </Heading>
              
              <VStack spacing={4} align="stretch" position="relative">
                <Flex justify="space-between">
                  <Text color={theme.textSecondary}>Subtotal</Text>
                  <Text fontWeight="semibold" color={theme.text}>
                    ${cart.grandTotal?.toLocaleString()}
                  </Text>
                </Flex>
                
                <Flex justify="space-between">
                  <Text color={theme.textSecondary}>Shipping</Text>
                  <Badge
                    background="linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)"
                    color="#065F46"
                    fontWeight="semibold"
                    px={2}
                    py={1}
                    borderRadius="md"
                  >
                    Free
                  </Badge>
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
                  background={theme.isLight 
                    ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                    : 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)'
                  }
                  color="white"
                  onClick={() => nav('/checkout')}
                  rightIcon={<LuArrowRight />}
                  fontWeight="semibold"
                  mt={2}
                  w="full"
                  boxShadow="0 4px 12px rgba(59, 130, 246, 0.3)"
                  _hover={{ 
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(59, 130, 246, 0.4)'
                  }}
                  transition="all 0.2s ease"
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