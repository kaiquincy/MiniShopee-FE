import { useEffect, useState } from 'react'
import { getCart, removeCartItem, clearCart } from '../api/cart'
import { Box, Button, Heading, HStack, Text, VStack, Image, Badge  } from '@chakra-ui/react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function Cart() {
  const { cart, reloadCart, removeCartItem, clearCart } = useCart()
  const nav = useNavigate()

  useEffect(() => { reloadCart() }, [reloadCart])
  if (!cart) return null

  return (
    <Box>
      <Heading size="md" mb={4}>Your Cart</Heading>
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
            <Button size="sm" variant="outline" onClick={async()=>{ await removeCartItem(it.productId); load() }}>Delete</Button>
            
            
          </HStack>
        ))}
      </VStack>


      
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
