import { useEffect } from 'react'
import { Box, Button, Icon, HStack, Text, VStack, Image, Badge, IconButton  } from '@chakra-ui/react'
import { LuShoppingCart, LuTrash2 } from 'react-icons/lu'
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
      <Box mx={10} my={8} textAlign="center">
        {/* Empty State Header */}
        <Box mb={8}>
          {/* <HStack spacing={3} mb={3} justify="center"> */}
            <Box
              w="100px"
              h="100px"
              bg="#F1F3F5"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              mx="auto"
              mb={5}
            > 
              <Icon as={LuShoppingCart} boxSize={12} color="#6C757D" />
            </Box>
            
          {/* </HStack> */}
            <Text fontSize="4xl" fontWeight="black" color="#212529">
              Your Cart is currently empty
            </Text>
          <Text color="#6C757D" fontSize="lg" mt={2}>
            Browse our products and add items to your cart.
            </Text>
        </Box>
        
        {/* Empty Action */}
        <VStack spacing={4}>
          <Button 
            size="lg" 
            colorScheme="brand" 
            onClick={() => nav('/products')}  // Hoặc nav('/shop') nếu có route shop
            leftIcon={<LuShoppingCart />}
          >
            Start Shopping
          </Button>
        </VStack>
      </Box>
    )
  }

  return (
    <Box mx={10} mt={8}>
      {/* Page Header */}
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

      {/* content */}
      <VStack align="stretch" spacing={3}>
        {cart.items?.map(it => (
          <HStack key={it.id} justify="space-between" bg="white" p={3} borderRadius="md" className="glass">
            {/* Ảnh sản phẩm */}
            <Image 
              src={import.meta.env.VITE_API_URL + "/uploads/" + it.productImageUrl || '/placeholder.png'} 
              alt={it.productName} 
              boxSize="70px"
              objectFit="cover" 
              borderRadius="md"
            />
            {/* Thông tin sản phẩm */}
            <VStack align="start" flex={1} spacing={1} ml={3}>
              <Text fontWeight="medium">{it.productName}</Text>
              {it.optionValues && (
                <HStack spacing={2} flexWrap="wrap">
                  {Object.entries(it.optionValues).map(([k, v]) => (
                    <Badge key={k} colorScheme="purple" variant="subtle">{`${k}: ${v}`}</Badge>
                  ))}
                </HStack>
              )}
            </VStack>

            <Text>x{it.quantity}</Text>
            <Text fontWeight="bold">{(it.productPrice * it.quantity).toLocaleString()} USD</Text>
            <IconButton size="sm" variant="ghost" colorPalette="red" onClick={async()=>{ await removeCartItem(it.productId); load() }}>
              <LuTrash2 />
            </IconButton>
            
            
          </HStack>
        ))}
      </VStack>


      {/* Toal */}
      <HStack mt={4} justify="space-between">
        <Button variant="outline" onClick={async()=>{ await clearCart(); load() }}>Delete All</Button>
        <HStack>
          <Text>Total: </Text>
          <Text fontWeight="bold" color="brand.700">{cart.grandTotal?.toLocaleString()} USD</Text>
          <Button onClick={()=>nav('/checkout')}>Cash Out</Button>
        </HStack>
      </HStack>
    </Box>
  )
}
