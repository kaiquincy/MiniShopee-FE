import { Badge, Box, Button, HStack, Icon, Image, Text, VStack } from '@chakra-ui/react'
import { FiShoppingCart, FiStar } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'

export default function ProductCard({ p, theme }) {
  const navigate = useNavigate()
  const discountPercent = p.discountPrice ? Math.round(100 - (p.discountPrice / p.price) * 100) : 0
  const rating = (p.averageStars ?? p.ratingAvg ?? 0).toFixed(1)
  const ratingCount = p.totalRatings ?? p.ratingCount ?? 0
  const finalPrice = p.discountPrice || p.price
  const imageUrl = `${import.meta.env.VITE_API_URL}/uploads/${p.imageUrl}`
  const dummyUrl = `https://dummyimage.com/400x300/228be6/ffffff.jpg&text=${encodeURIComponent(p.name)}`

  return (
    <Box
      bg={theme.cardBg}
      borderRadius="lg"
      overflow="hidden"
      border="1px solid"
      borderColor={theme.border}
      transition="all 0.3s"
      _hover={{
        transform: 'translateY(-4px)',
        shadow: 'lg',
        borderColor: theme.borderLight,
      }}
      display="flex"
      flexDirection="column"
      h="full"
    >
      {/* Image Section */}
      <Box position="relative" overflow="hidden">
        <Link to={`/product/${p.id}`}>
          <Image
            src={imageUrl}
            alt={p.name}
            w="full"
            h="200px"
            objectFit="cover"
            transition="transform 0.3s"
            _hover={{ transform: 'scale(1.05)' }}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = dummyUrl;
            }}
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
            bg={theme.isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(30, 41, 59, 0.95)"}
            backdropFilter="blur(8px)"
            px={2}
            py={1}
            borderRadius="md"
            spacing={1}
          >
            <Icon as={FiStar} color="#F59E0B" boxSize={3} fill="#F59E0B" />
            <Text fontSize="xs" fontWeight="bold" color={theme.text}>
              {rating}
            </Text>
            <Text fontSize="xs" color={theme.textMuted}>
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
            color={theme.text}
            noOfLines={3}
            lineHeight="1.4"
            minH="4.2em"
            _hover={{ color: theme.textSecondary }}
            title={p.name}
          >
            {p.name}
          </Text>
        </Link>

        {/* Price + Add to Cart grouped at bottom */}
        <VStack align="stretch" spacing={3} mt="auto">
          {/* Price Section */}
          <HStack spacing={2} align="baseline">
            <Text fontSize="xl" fontWeight="black" color={theme.text} whiteSpace="nowrap">
              ${finalPrice?.toLocaleString()}
            </Text>
            {p.discountPrice && (
              <Text fontSize="sm" color={theme.textMuted} textDecoration="line-through" whiteSpace="nowrap">
                ${p.price?.toLocaleString()}
              </Text>
            )}
          </HStack>

          <Button
            onClick={() => navigate(`/product/${p.id}`)}
            bg={theme.primary}
            color="white"
            size="sm"
            w="full"
            leftIcon={<Icon as={FiShoppingCart} />}
            _hover={{ 
              bg: theme.isLight ? "white" : theme.cardBg, 
              border: "2px solid", 
              borderColor: theme.primary, 
              color: theme.text 
            }}
          >
            View product
          </Button>
        </VStack>
      </VStack>
    </Box>
  )
}