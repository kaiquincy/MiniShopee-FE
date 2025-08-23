import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchProductById } from '../api/products'
import { getRatings } from '../api/ratings'
import { Box, Image, Heading, Text, Button, VStack, HStack, Badge } from '@chakra-ui/react'
import { toaster } from '../components/ui/toaster'
import { useCart } from '../context/CartContext'


export default function ProductDetail() {
  const { id } = useParams()
  const [p, setP] = useState(null)
  const [ratings, setRatings] = useState([])
  const { addToCart} = useCart()


  useEffect(()=>{
    fetchProductById(id).then(setP)
    getRatings(id).then(setRatings)
  }, [id])

  if (!p) return null

  const avg = (p.averageStars ?? p.ratingAvg ?? 0).toFixed(1)
  const count = p.totalRatings ?? p.ratingCount ?? 0

  return (
    <HStack align="start" spacing={8}>
      <Image src={import.meta.env.VITE_API_URL + "/uploads/" + p.imageUrl || 'https://via.placeholder.com/600x400'} maxW="480px" borderRadius="md"/>
      <VStack align="start" spacing={3} flex={1}>
        <Heading size="lg">{p.name}</Heading>
        <HStack>
          <Text fontSize="2xl" fontWeight="bold" color="brand.700">{p.price?.toLocaleString()} USD</Text>
          {p.discountPrice && <Badge colorScheme="red">-{Math.round(100-(p.discountPrice/p.price)*100)}%</Badge>}
        </HStack>
        <HStack color="gray.500">
          <Badge>{avg}★</Badge><Text>({count} đánh giá)</Text>
        </HStack>
        <Text color="gray.700">{p.description}</Text>
        <HStack>
          <Button onClick={async()=>{
            await addToCart(p.id, 1); 
            toaster.create({ title:'Đã thêm vào giỏ', status:'success' })
          }}>Add To Cart</Button>
          <Button variant="outline" onClick={()=>window.history.back()}>Back</Button>
        </HStack>

        <Box mt={6} w="full">
          <Heading size="md" mb={3}>Đánh giá</Heading>
          <VStack align="stretch" spacing={3}>
            {ratings.map(r=>(
              <Box key={r.id} bg="white" p={3} borderRadius="md" className="glass">
                <HStack justify="space-between">
                  <HStack><Badge>{r.stars}★</Badge><Text>#{r.userId}</Text></HStack>
                  <Text color="gray.500" fontSize="sm">{new Date(r.createdAt).toLocaleString()}</Text>
                </HStack>
                <Text mt={2}>{r.comment || '—'}</Text>
              </Box>
            ))}
            {ratings.length===0 && <Text color="gray.500">Chưa có đánh giá</Text>}
          </VStack>
        </Box>
      </VStack>
    </HStack>
  )
}
