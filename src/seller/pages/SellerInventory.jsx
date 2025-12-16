import { Badge, Box, Button, Flex, Grid, Heading, HStack, Icon, Input, Text } from '@chakra-ui/react'
import { NumberInput } from "@chakra-ui/react/number-input"
import { useEffect, useMemo, useState } from 'react'
import { FiAlertCircle, FiCheckCircle, FiPackage, FiSave, FiSearch } from 'react-icons/fi'

import { toaster } from '../../components/ui/toaster'
import { fetchProducts, updateProduct } from '../api/seller'

export default function SellerInventory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [savingIds, setSavingIds] = useState(new Set())

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetchProducts({ page: 0, size: 100 })
      setItems(res?.content || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const saveQty = async (p) => {
    setSavingIds(prev => new Set(prev).add(p.id))
    try {
      await updateProduct(p.id, { quantity: Number(p.quantity) })
      toaster.create({ type: 'success', description: 'Stock quantity updated' })
      load()
    } catch (e) {
      toaster.create({ type: 'error', description: 'Failed to update stock' })
    } finally {
      setSavingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(p.id)
        return newSet
      })
    }
  }

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items
    const query = searchQuery.toLowerCase()
    return items.filter(p => 
      p.name?.toLowerCase().includes(query) || 
      String(p.id).includes(query)
    )
  }, [items, searchQuery])

  // Calculate stats
  const stats = useMemo(() => {
    const totalProducts = items.length
    const inStock = items.filter(p => (p.quantity || 0) > 0).length
    const lowStock = items.filter(p => (p.quantity || 0) > 0 && (p.quantity || 0) <= 10).length
    const outOfStock = items.filter(p => (p.quantity || 0) === 0).length

    return { totalProducts, inStock, lowStock, outOfStock }
  }, [items])

  return (
    <Box color="white" p={8}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading size="2xl" fontWeight="black" mb={2}>Inventory</Heading>
          <Text color="whiteAlpha.600">Manage stock quantities and availability</Text>
        </Box>
      </Flex>

      {/* Stats Cards */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={4} mb={6}>
        <Box bg="gray.900" border="1px solid" borderColor="whiteAlpha.200" p={4} borderRadius="lg">
          <HStack spacing={3}>
            <Box p={3} bg="#2563EB20" borderRadius="lg">
              <Icon as={FiPackage} boxSize={5} color="#2563EB" />
            </Box>
            <Box>
              <Text color="whiteAlpha.600" fontSize="sm">Total Products</Text>
              <Text fontWeight="bold" fontSize="2xl">{stats.totalProducts}</Text>
            </Box>
          </HStack>
        </Box>

        <Box bg="gray.900" border="1px solid" borderColor="whiteAlpha.200" p={4} borderRadius="lg">
          <HStack spacing={3}>
            <Box p={3} bg="#10B98120" borderRadius="lg">
              <Icon as={FiCheckCircle} boxSize={5} color="#10B981" />
            </Box>
            <Box>
              <Text color="whiteAlpha.600" fontSize="sm">In Stock</Text>
              <Text fontWeight="bold" fontSize="2xl">{stats.inStock}</Text>
            </Box>
          </HStack>
        </Box>

        <Box bg="gray.900" border="1px solid" borderColor="whiteAlpha.200" p={4} borderRadius="lg">
          <HStack spacing={3}>
            <Box p={3} bg="#F59E0B20" borderRadius="lg">
              <Icon as={FiAlertCircle} boxSize={5} color="#F59E0B" />
            </Box>
            <Box>
              <Text color="whiteAlpha.600" fontSize="sm">Low Stock</Text>
              <Text fontWeight="bold" fontSize="2xl">{stats.lowStock}</Text>
            </Box>
          </HStack>
        </Box>

        <Box bg="gray.900" border="1px solid" borderColor="whiteAlpha.200" p={4} borderRadius="lg">
          <HStack spacing={3}>
            <Box p={3} bg="#EF444420" borderRadius="lg">
              <Icon as={FiAlertCircle} boxSize={5} color="#EF4444" />
            </Box>
            <Box>
              <Text color="whiteAlpha.600" fontSize="sm">Out of Stock</Text>
              <Text fontWeight="bold" fontSize="2xl">{stats.outOfStock}</Text>
            </Box>
          </HStack>
        </Box>
      </Grid>

      {/* Search Bar */}
      <Box mb={6}>
        <Box position="relative" maxW="500px">
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
            placeholder="Search by product name or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
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
      </Box>

      {/* Inventory Table */}
      <Box bg="gray.900" border="1px solid" borderColor="whiteAlpha.200" borderRadius="lg" overflow="hidden">
        {/* Table Header */}
        <Grid
          templateColumns="100px 1fr 200px 150px 150px"
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
          <Box>Product Name</Box>
          <Box>Current Stock</Box>
          <Box>Status</Box>
          <Box>Action</Box>
        </Grid>

        {/* Table Body */}
        {loading ? (
          <Box p={12} textAlign="center">
            <Text color="whiteAlpha.500">Loading inventory...</Text>
          </Box>
        ) : filteredItems.length === 0 ? (
          <Box p={12} textAlign="center">
            <Icon as={FiPackage} boxSize={12} color="whiteAlpha.300" mb={4} />
            <Text color="whiteAlpha.500" fontSize="lg" mb={2}>
              {searchQuery ? 'No products found' : 'No inventory items'}
            </Text>
            <Text color="whiteAlpha.400" fontSize="sm">
              {searchQuery ? 'Try adjusting your search' : 'Add products to manage inventory'}
            </Text>
          </Box>
        ) : (
          filteredItems.map((p, idx) => {
            const qty = p.quantity || 0
            const isLowStock = qty > 0 && qty <= 10
            const isOutOfStock = qty === 0

            return (
              <Grid
                key={p.id}
                templateColumns="100px 1fr 200px 150px 150px"
                py={4}
                px={6}
                borderBottom={idx !== filteredItems.length - 1 ? "1px solid" : "none"}
                borderColor="whiteAlpha.100"
                alignItems="center"
                transition="all 0.2s"
                _hover={{ bg: "whiteAlpha.50" }}
              >
                {/* ID */}
                <Box>
                  <Text color="brand.400" fontWeight="semibold">#{p.id}</Text>
                </Box>

                {/* Product Name */}
                <Box>
                  <Text fontWeight="medium" noOfLines={1}>{p.name}</Text>
                </Box>

                {/* Quantity Input */}
                <Box>
                  <NumberInput.Root
                    value={qty}
                    min={0}
                    width="80%"
                    onValueChange={({ valueAsNumber }) => {
                      setItems(prev =>
                        prev.map(x => x.id === p.id ? { ...x, quantity: valueAsNumber } : x)
                      )
                    }}
                  >
                    <NumberInput.Input
                      bg="gray.800"
                      border="1px solid"
                      borderColor="whiteAlpha.200"
                      color="white"
                      _focus={{ borderColor: "brand.500" }}
                    />
                    <NumberInput.Control />
                  </NumberInput.Root>
                </Box>

                {/* Status Badge */}
                <Box>
                  {isOutOfStock ? (
                    <Badge
                      bg="#EF444420"
                      color="#EF4444"
                      border="1px solid"
                      borderColor="#EF444440"
                      px={3}
                      py={1}
                      borderRadius="full"
                      fontSize="xs"
                      fontWeight="bold"
                    >
                      Out of Stock
                    </Badge>
                  ) : isLowStock ? (
                    <Badge
                      bg="#F59E0B20"
                      color="#F59E0B"
                      border="1px solid"
                      borderColor="#F59E0B40"
                      px={3}
                      py={1}
                      borderRadius="full"
                      fontSize="xs"
                      fontWeight="bold"
                    >
                      Low Stock
                    </Badge>
                  ) : (
                    <Badge
                      bg="#10B98120"
                      color="#10B981"
                      border="1px solid"
                      borderColor="#10B98140"
                      px={3}
                      py={1}
                      borderRadius="full"
                      fontSize="xs"
                      fontWeight="bold"
                    >
                      In Stock
                    </Badge>
                  )}
                </Box>

                {/* Save Button */}
                <Box>
                  <Button
                    size="sm"
                    bg="brand.500"
                    color="white"
                    leftIcon={<FiSave />}
                    onClick={() => saveQty(p)}
                    isLoading={savingIds.has(p.id)}
                    _hover={{ bg: "brand.600" }}
                  >
                    Save
                  </Button>
                </Box>
              </Grid>
            )
          })
        )}
      </Box>
    </Box>
  )
}