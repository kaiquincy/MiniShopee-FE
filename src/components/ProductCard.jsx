import { Badge, Box, Button, HStack, Icon, Image, Text, VStack } from '@chakra-ui/react'
import { FiShoppingCart, FiStar } from 'react-icons/fi'
import { Link } from 'react-router-dom'

export default function ProductCard({ p, onAdd }) {
  const discountPercent = p.discountPrice ? Math.round(100 - (p.discountPrice / p.price) * 100) : 0
  const rating = (p.averageStars ?? p.ratingAvg ?? 0).toFixed(1)
  const ratingCount = p.totalRatings ?? p.ratingCount ?? 0
  const finalPrice = p.discountPrice || p.price

  return (
    <Box
      bg="white"
      borderRadius="lg"
      overflow="hidden"
      border="1px solid"
      borderColor="#DEE2E6"
      transition="all 0.3s"
      _hover={{
        transform: 'translateY(-4px)',
        shadow: 'lg',
        borderColor: '#ADB5BD'
      }}
      display="flex"
      flexDirection="column"
      h="full"
    >
      {/* Image Section */}
      <Box position="relative" overflow="hidden">
        <Link to={`/product/${p.id}`}>
          <Image
            src={import.meta.env.VITE_API_URL + "/uploads/" + p.imageUrl || 'https://via.placeholder.com/400x300?text=Product'}
            alt={p.name}
            w="full"
            h="200px"
            objectFit="cover"
            transition="transform 0.3s"
            _hover={{ transform: 'scale(1.05)' }}
          />
        </Link>

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <Badge
            position="absolute"
            top={3}
            right={3}
            bg="#DC2626"
            color="white"
            px={2}
            py={1}
            borderRadius="md"
            fontSize="xs"
            fontWeight="bold"
          >
            -{discountPercent}%
          </Badge>
        )}

        {/* Rating Badge */}
        {rating > 0 && (
          <HStack
            position="absolute"
            bottom={3}
            left={3}
            bg="rgba(255, 255, 255, 0.95)"
            backdropFilter="blur(8px)"
            px={2}
            py={1}
            borderRadius="md"
            spacing={1}
          >
            <Icon as={FiStar} color="#F59E0B" boxSize={3} fill="#F59E0B" />
            <Text fontSize="xs" fontWeight="bold" color="#212529">
              {rating}
            </Text>
            <Text fontSize="xs" color="#6C757D">
              ({ratingCount})
            </Text>
          </HStack>
        )}
      </Box>

      {/* Content Section */}
      <VStack align="stretch" p={4} spacing={3} flex={1}>
        {/* Product Name */}
        <Link to={`/product/${p.id}`}>
          <Text
            fontWeight="semibold"
            fontSize="md"
            color="#212529"
            noOfLines={2}
            minH="48px"
            lineHeight="1.5"
            _hover={{ color: "#495057" }}
          >
            {p.name}
          </Text>
        </Link>

        {/* Price Section */}
        <Box>
          <HStack spacing={2} align="baseline">
            <Text
              fontSize="xl"
              fontWeight="black"
              color="#212529"
            >
              ${finalPrice?.toLocaleString()}
            </Text>
            {p.discountPrice && (
              <Text
                fontSize="sm"
                color="#ADB5BD"
                textDecoration="line-through"
              >
                ${p.price?.toLocaleString()}
              </Text>
            )}
          </HStack>
        </Box>

        {/* Add to Cart Button */}
        <Button
          onClick={() => onAdd(p.id)}
          bg="#212529"
          color="white"
          size="sm"
          w="full"
          leftIcon={<Icon as={FiShoppingCart} />}
          _hover={{ bg: "#343A40" }}
          mt="auto"
        >
          Add to Cart
        </Button>
      </VStack>
    </Box>
  )
}