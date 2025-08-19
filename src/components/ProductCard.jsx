import { Box, Image, Text, HStack, Badge, Button } from '@chakra-ui/react'
import { Link } from 'react-router-dom'

export default function ProductCard({ p, onAdd }) {
  return (
    <Box bg="white" p={3} borderRadius="md" className="glass" _hover={{ transform:'translateY(-2px)' }} transition=".2s">
      <Link to={`/product/${p.id}`}>
        <Image src={p.imageUrl || 'https://via.placeholder.com/400x300?text=Product'} alt={p.name} borderRadius="md" />
        <Text mt={2} fontWeight="semibold" noOfLines={2}>{p.name}</Text>
      </Link>
      
      <HStack mt={1} spacing={2}>
        <Text color="brand.700" fontWeight="bold">{p.price?.toLocaleString()} USD</Text>
        {p.discountPrice && <Badge colorScheme="red">-{Math.round(100-(p.discountPrice/p.price)*100)}%</Badge>}
      </HStack>
      <HStack mt={1} spacing={2} fontSize="sm" color="gray.500">
        <Badge>{(p.averageStars ?? p.ratingAvg ?? 0).toFixed(1)}★</Badge>
        <Text>({p.totalRatings ?? p.ratingCount ?? 0})</Text>
      </HStack>
      <Button mt={3} w="full" onClick={()=>onAdd(p.id)}>Add To Cart</Button>
    </Box>
  )
}
