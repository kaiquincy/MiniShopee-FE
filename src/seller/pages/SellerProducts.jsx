import { Box, Button, Flex, Grid, Heading, HStack, Icon, Image, Input, Text, VStack } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { FiEdit2, FiPackage, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { toaster } from '../../components/ui/toaster'
import { deleteProduct, fetchProducts } from '../api/seller'

export default function SellerProducts() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  const load = async() => {
    setLoading(true)
    try {
      const res = await fetchProducts({ name: q || undefined, page:0, size:50 })
      setItems(res?.content || [])
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(()=>{ load() }, [])

  const del = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    await deleteProduct(id)
    toaster.create({ type:'success', description:'Product deleted successfully' })
    load()
  }


  return (
    <Box color="white">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading size="2xl" fontWeight="black" mb={2}>Products</Heading>
          <Text color="whiteAlpha.600">Manage your product inventory</Text>
        </Box>
        <Button
          bg="brand.500"
          color="white"
          size="lg"
          leftIcon={<FiPlus />}
          borderRadius="none"
          _hover={{ bg: "brand.600" }}
          onClick={()=>nav('/seller/products/new')}
        >
          Add Product
        </Button>
      </Flex>

      {/* Search Bar */}
      <Flex gap={3} mb={6}>
        <Box position="relative" flex={1} maxW="500px">
          <Icon 
            as={FiSearch} 
            position="absolute" 
            left={4} 
            top="50%" 
            transform="translateY(-50%)"
            color="whiteAlpha.500"
            boxSize={5}
          />
          <Input 
            placeholder="Search products by name..." 
            value={q} 
            onChange={e=>setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            bg="gray.900"
            border="1px solid"
            borderColor="whiteAlpha.200"
            color="white"
            pl={12}
            h="48px"
            _placeholder={{ color: "whiteAlpha.500" }}
            _focus={{ borderColor: "brand.500" }}
          />
        </Box>
        <Button 
          onClick={load}
          bg="gray.900"
          color="white"
          h="48px"
          px={8}
          borderRadius="none"
          border="1px solid"
          borderColor="whiteAlpha.200"
          _hover={{ borderColor: "brand.500", bg: "gray.800" }}
        >
          Search
        </Button>
      </Flex>

      {/* Stats Summary */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4} mb={6}>
        <Box bg="gray.900" border="1px solid" borderColor="whiteAlpha.200" p={4}>
          <HStack spacing={3}>
            <Box p={3} bg="#2563EB20" borderRadius="lg">
              <Icon as={FiPackage} boxSize={5} color="#2563EB" />
            </Box>
            <Box>
              <Text color="whiteAlpha.600" fontSize="sm">Total Products</Text>
              <Text fontWeight="bold" fontSize="2xl">{items.length}</Text>
            </Box>
          </HStack>
        </Box>
        <Box bg="gray.900" border="1px solid" borderColor="whiteAlpha.200" p={4}>
          <HStack spacing={3}>
            <Box p={3} bg="#10B98120" borderRadius="lg">
              <Icon as={FiPackage} boxSize={5} color="#10B981" />
            </Box>
            <Box>
              <Text color="whiteAlpha.600" fontSize="sm">In Stock</Text>
              <Text fontWeight="bold" fontSize="2xl">{items.filter(p => p.stockQuantity > 0).length}</Text>
            </Box>
          </HStack>
        </Box>
        <Box bg="gray.900" border="1px solid" borderColor="whiteAlpha.200" p={4}>
          <HStack spacing={3}>
            <Box p={3} bg="#EF444420" borderRadius="lg">
              <Icon as={FiPackage} boxSize={5} color="#EF4444" />
            </Box>
            <Box>
              <Text color="whiteAlpha.600" fontSize="sm">Out of Stock</Text>
              <Text fontWeight="bold" fontSize="2xl">{items.filter(p => !p.stockQuantity || p.stockQuantity === 0).length}</Text>
            </Box>
          </HStack>
        </Box>
      </Grid>

      {/* Products Table */}
      <Box bg="gray.900" border="1px solid" borderColor="whiteAlpha.200">
        {/* Table Header */}
        <Grid 
          templateColumns="100px 100px 1fr 150px 180px" 
          py={4} 
          px={6} 
          borderBottom="1px solid" 
          borderColor="whiteAlpha.200"
          fontWeight="bold"
          fontSize="sm"
          color="whiteAlpha.700"
          textTransform="uppercase"
          letterSpacing="wider"
        >
          <Box>ID</Box>
          <Box>Image</Box>
          <Box>Product Info</Box>
          <Box>Price</Box>
          <Box textAlign="center">Actions</Box>
        </Grid>

        {/* Table Body */}
        {loading ? (
          <Box p={12} textAlign="center">
            <Text color="whiteAlpha.500">Loading...</Text>
          </Box>
        ) : items.length === 0 ? (
          <Box p={12} textAlign="center">
            <Icon as={FiPackage} boxSize={12} color="whiteAlpha.300" mb={4} />
            <Text color="whiteAlpha.500" fontSize="lg" mb={2}>No products found</Text>
            <Text color="whiteAlpha.400" fontSize="sm">Add your first product to get started</Text>
          </Box>
        ) : (
          items.map((p, idx) => (
            <Grid 
              key={p.id}
              templateColumns="100px 100px 1fr 150px 180px" 
              py={4} 
              px={6} 
              borderBottom={idx !== items.length - 1 ? "1px solid" : "none"}
              borderColor="whiteAlpha.100"
              transition="all 0.2s"
              _hover={{ bg: "whiteAlpha.50" }}
              alignItems="center"
            >
              {/* ID */}
              <Box>
                <Text color="brand.400" fontWeight="semibold">#{p.id}</Text>
              </Box>

              {/* Image */}
              <Box>
                <Image 
                  w="70px" 
                  h="70px" 
                  src={import.meta.env.VITE_API_URL + "/uploads/" + p.imageUrl || 'https://via.placeholder.com/200x200?text=Product'} 
                  alt={p.name} 
                  borderRadius="md"
                  objectFit="cover"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                />
              </Box>

              {/* Product Info */}
              <VStack align="start" spacing={1}>
                <Text fontWeight="bold" fontSize="md" noOfLines={1}>
                  {p.name}
                </Text>
                <Text fontSize="sm" color="whiteAlpha.600" noOfLines={2}>
                  {p.description || 'No description'}
                </Text>
                {p.stockQuantity !== undefined && (
                  <Text 
                    fontSize="xs" 
                    color={p.stockQuantity > 0 ? "#10B981" : "#EF4444"}
                    fontWeight="semibold"
                  >
                    Stock: {p.stockQuantity}
                  </Text>
                )}
              </VStack>

              {/* Price */}
              <Box>
                <Text fontWeight="black" fontSize="xl" color="brand.400">
                  {(p.price||0).toLocaleString()} ₫
                </Text>
                {p.discountPrice && (
                  <Text 
                    fontSize="sm" 
                    color="whiteAlpha.500" 
                    textDecoration="line-through"
                  >
                    {(p.discountPrice||0).toLocaleString()} ₫
                  </Text>
                )}
              </Box>

              {/* Actions */}
              <HStack justify="center" spacing={2}>
                <Button
                  size="sm"
                  bg="gray.800"
                  color="white"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  leftIcon={<FiEdit2 />}
                  _hover={{ borderColor: "brand.500", bg: "gray.700" }}
                  onClick={()=>nav(`/seller/products/${p.id}/edit`)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  bg="transparent"
                  color="red.400"
                  border="1px solid"
                  borderColor="red.400"
                  leftIcon={<FiTrash2 />}
                  _hover={{ bg: "red.500", color: "white", borderColor: "red.500" }}
                  onClick={()=>del(p.id)}
                >
                  Delete
                </Button>
              </HStack>
            </Grid>
          ))
        )}
      </Box>
    </Box>
  )
}