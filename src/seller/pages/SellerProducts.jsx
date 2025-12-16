import { Badge, Box, Button, CloseButton, Dialog, Flex, Grid, Heading, HStack, Icon, Image, Input, Portal, Text, VStack } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { FiEdit2, FiPackage, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { toaster } from '../../components/ui/toaster'
import { deleteProduct, fetchProducts } from '../api/seller'

export default function SellerProducts() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [rejProduct, setRejProduct] = useState(null) // sản phẩm đang xem lý do reject
  const nav = useNavigate()

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetchProducts({ name: q || undefined, page: 0, size: 50 })
      setItems(res?.content || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const del = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    await deleteProduct(id)
    toaster.create({ type: 'success', description: 'Product deleted successfully' })
    load()
  }

  // Parse validation_result (có thể là JSON string hoặc object)
  const parseValidation = (val) => {
    if (!val) return null
    try {
      return typeof val === 'string' ? JSON.parse(val) : val
    } catch (e) {
      return null
    }
  }

  const statusBadge = (status) => {
    const map = {
      ACTIVE: { bg: '#10B98120', color: '#10B981', label: 'ACTIVE' },
      INACTIVE: { bg: '#F59E0B20', color: '#F59E0B', label: 'INACTIVE' },
      DELETED: { bg: '#6B728020', color: '#9CA3AF', label: 'DELETED' },
      PROCESSING: { bg: '#3B82F620', color: '#3B82F6', label: 'PROCESSING' },
      REJECTED: { bg: '#EF444420', color: '#EF4444', label: 'REJECTED' },
      FAILED: { bg: '#DC262620', color: '#DC2626', label: 'FAILED' },
    }
    const cfg = map[status] || { bg: 'whiteAlpha.200', color: 'white', label: status || 'UNKNOWN' }
    return (
      <Badge
        bg={cfg.bg}
        color={cfg.color}
        border="1px solid"
        borderColor={cfg.color}
        px={2}
        py={1}
        borderRadius="md"
        fontWeight="semibold"
      >
        {cfg.label}
      </Badge>
    )
  }

const ValidationDialog = ({ product, onClose }) => {
  const nav = useNavigate()
  const data = parseValidation(product?.validationResult)

  const hasRejection = data?.consistency?.is_title_image_consistent === 'no' || (data?.safety?.nsfw_label && data.safety.nsfw_label !== 'safe')

  // NEW: toggle dùng gợi ý
  const [useSuggestedTitle, setUseSuggestedTitle] = useState(false)
  const [useSuggestedDesc, setUseSuggestedDesc] = useState(false)

  // helper
  const suggestedTitle = data?.suggestions?.suggested_title
  const suggestedDesc  = data?.suggestions?.suggested_description

  const selectedTitle = useSuggestedTitle && suggestedTitle ? suggestedTitle : product?.name
  const selectedDesc  = useSuggestedDesc  && suggestedDesc  ? suggestedDesc  : product?.description

  const handleReviewFix = () => {
    // Điều hướng tới trang edit và truyền sẵn prefill
    nav(`/seller/products/${product.id}/edit`, {
      state: {
        prefill: {
          name: selectedTitle,
          description: selectedDesc,
          status: "PROCESSING"
        },
        // bạn có thể truyền thêm flag để UI edit biết rằng đây là flow từ review
        fromReview: true,
      },
    })
  }

  return (
    <Dialog.Root open={!!product} onOpenChange={(e) => { if (!e.open) onClose() }}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
              maxW="720px"
              bg="black"
              border="1px solid"
              borderColor={hasRejection ? "red.700" : "whiteAlpha.200"}
              shadow="xl"
              rounded="2xl"
              p={2}>
            <Dialog.Header borderBottom="1px solid" borderColor="whiteAlpha.200" pb={3}>
              <HStack spacing={3}>
                <Icon
                  as={hasRejection ? FiTrash2 : FiPackage}
                  color={hasRejection ? "red.400" : "brand.400"}
                  boxSize={5}
                />
                <Dialog.Title color="white" fontWeight="bold">
                  {hasRejection ? "Validation Failed" : "Validation Summary"} — #{product?.id}
                </Dialog.Title>
              </HStack>
            </Dialog.Header>

            <Dialog.Body py={5} px={3}>
              {!data ? (
                <Text color="whiteAlpha.700">No validation details available.</Text>
              ) : (
                <VStack align="stretch" spacing={6}>
                  {/* SAFETY */}
                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="bold" color="whiteAlpha.900" fontSize="lg">Safety</Text>
                      <Badge
                        bg={data.safety?.nsfw_label === "safe" ? "#10B98130" : "#EF444430"}
                        color={data.safety?.nsfw_label === "safe" ? "#10B981" : "#EF4444"}
                        border="1px solid"
                        borderColor={data.safety?.nsfw_label === "safe" ? "#10B981" : "#EF4444"}
                        px={2}
                      >
                        {data.safety?.nsfw_label?.toUpperCase() || "UNKNOWN"}
                      </Badge>
                    </HStack>
                    <Text fontSize="sm" color="whiteAlpha.800">
                      Confidence: {data?.safety?.nsfw_confidence ?? '—'}
                    </Text>
                    {Array.isArray(data?.safety?.reasons) && data.safety.reasons.length > 0 && (
                      <VStack align="stretch" spacing={1} mt={2}>
                        {data.safety.reasons.map((r, i) => (
                          <HStack key={i} color="red.400" align="start">
                            <Icon as={FiTrash2} boxSize={3.5} mt="2px" />
                            <Text fontSize="sm">{r}</Text>
                          </HStack>
                        ))}
                      </VStack>
                    )}
                  </Box>

                  {/* CONSISTENCY */}
                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="bold" color="whiteAlpha.900" fontSize="lg">Title ↔ Image Consistency</Text>
                      <Badge
                        bg={data.consistency?.is_title_image_consistent === 'yes' ? "#2563EB30" : "#EF444430"}
                        color={data.consistency?.is_title_image_consistent === 'yes' ? "#60A5FA" : "#EF4444"}
                        border="1px solid"
                        borderColor={data.consistency?.is_title_image_consistent === 'yes' ? "#60A5FA" : "#EF4444"}
                        px={2}
                      >
                        {data.consistency?.is_title_image_consistent?.toUpperCase()}
                      </Badge>
                    </HStack>
                    <Text fontSize="sm" color="whiteAlpha.800">
                      Confidence: {data?.consistency?.confidence ?? '—'}
                    </Text>
                    {Array.isArray(data?.consistency?.mismatch_reasons) && data.consistency.mismatch_reasons.length > 0 && (
                      <VStack align="stretch" spacing={2} mt={2}>
                        {data.consistency.mismatch_reasons.map((r, i) => (
                          <HStack key={i} align="start" color="red.300">
                            <Icon as={FiTrash2} boxSize={3.5} mt="2px" />
                            <Text fontSize="sm">{r}</Text>
                          </HStack>
                        ))}
                      </VStack>
                    )}
                  </Box>

                  {/* SUGGESTIONS */}
                  <Box>
                    <Text fontWeight="bold" color="whiteAlpha.900" mb={3} fontSize="lg">
                      Suggested Fixes
                    </Text>
                    <VStack align="stretch" spacing={4} fontSize="sm" color="whiteAlpha.900">
                      {/* Suggested Title + Replace */}
                      {suggestedTitle && (
                        <Box>
                          <HStack  mb={1}>
                            <Text color="whiteAlpha.600" fontSize="xs" textTransform="uppercase" letterSpacing="wide">
                              Suggested Title
                            </Text>
                            <Button
                              size="xs"
                              variant="ghost"
                              px={2}
                              py={0}
                              h="22px"
                              fontSize="xs"
                              // variant={useSuggestedTitle ? "solid" : "outline"}
                              bg={useSuggestedTitle ? "blue.600" : "transparent"}
                              color={useSuggestedTitle ? "white" : "whiteAlpha.900"}
                              borderColor="blue.500"
                              _hover={{ bg: useSuggestedTitle ? "blue.700" : "blue.900" }}
                              onClick={() => setUseSuggestedTitle(v => !v)}
                            >
                              {useSuggestedTitle ? "Revert" : "Replace"}
                            </Button>
                          </HStack>
                          <Text fontWeight="semibold" color="#93C5FD">
                            {suggestedTitle}
                          </Text>
                          {useSuggestedTitle && (
                            <Text mt={1} fontSize="xs" color="whiteAlpha.600">
                              Will prefill as <b>{suggestedTitle}</b> on edit page.
                            </Text>
                          )}
                        </Box>
                      )}

                      {/* Suggested Description + Replace */}
                      {suggestedDesc && (
                        <Box>
                          <HStack mb={1}>
                            <Text color="whiteAlpha.600" fontSize="xs" textTransform="uppercase" letterSpacing="wide">
                              Suggested Description
                            </Text>
                            <Button
                              size="xs"
                             variant="ghost"
                              px={2}
                              py={0}
                              h="22px"
                              fontSize="xs"
                              // variant={useSuggestedDesc ? "solid" : "outline"}
                              bg={useSuggestedDesc ? "blue.600" : "transparent"}
                              color={useSuggestedDesc ? "white" : "whiteAlpha.900"}
                              borderColor="blue.500"
                              _hover={{ bg: useSuggestedDesc ? "blue.700" : "blue.900" }}
                              onClick={() => setUseSuggestedDesc(v => !v)}
                            >
                              {useSuggestedDesc ? "Revert" : "Replace"}
                            </Button>
                          </HStack>
                          <Text whiteSpace="pre-wrap" color="whiteAlpha.800">
                            {suggestedDesc}
                          </Text>
                          {useSuggestedDesc && (
                            <Text mt={1} fontSize="xs" color="whiteAlpha.600">
                              Will prefill suggested description on edit page.
                            </Text>
                          )}
                        </Box>
                      )}

                      {/* Keywords & Category giữ nguyên như trước */}
                      {Array.isArray(data?.suggestions?.keywords) && data.suggestions.keywords.length > 0 && (
                        <Box>
                          <Text color="whiteAlpha.600" fontSize="xs" textTransform="uppercase" letterSpacing="wide">Keywords</Text>
                          <HStack wrap="wrap" spacing={2} mt={1}>
                            {data.suggestions.keywords.map((k, i) => (
                              <Badge key={i} bg="whiteAlpha.200" border="1px solid" borderColor="whiteAlpha.300" color="whiteAlpha.900">
                                {k}
                              </Badge>
                            ))}
                          </HStack>
                        </Box>
                      )}
                      {data?.suggestions?.category_guess && (
                        <Box>
                          <Text color="whiteAlpha.600" fontSize="xs" textTransform="uppercase" letterSpacing="wide">Category Guess</Text>
                          <Badge bg="#2563EB30" color="#60A5FA" border="1px solid" borderColor="#60A5FA">
                            {data.suggestions.category_guess}
                          </Badge>
                        </Box>
                      )}
                    </VStack>
                  </Box>
                </VStack>
              )}
            </Dialog.Body>

            <Dialog.Footer borderTop="1px solid" borderColor="whiteAlpha.200" pt={3}>
              <Button variant="outline" onClick={onClose}>Close</Button>
              {hasRejection && (
                <Button bg="red.600" color="white" _hover={{ bg: "red.700" }} onClick={handleReviewFix}>
                  Review & Fix
                </Button>
              )}
            </Dialog.Footer>

            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" color="whiteAlpha.700" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}


  return (
    <Box color="white" p={8}>
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
          onClick={() => nav('/seller/products/new')}
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
            onChange={e => setQ(e.target.value)}
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
          templateColumns="100px 100px 1fr 150px 160px 180px"
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
          <Box pl={5}>Price</Box>
          <Box>Status</Box>
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
              templateColumns="100px 100px 1fr 150px 160px 180px"
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
                  src={import.meta.env.VITE_API_URL + "/uploads/" + (p.imageUrl || '') || 'https://via.placeholder.com/200x200?text=Product'}
                  alt={p.name}
                  borderRadius="md"
                  objectFit="cover"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                />
              </Box>

              {/* Product Info */}
              <VStack align="start" spacing={1}>
                <Text fontWeight="bold" fontSize="md" lineClamp={1}>
                  {p.name}
                </Text>
                <Text fontSize="sm" color="whiteAlpha.600" lineClamp={2}>
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
              <Box pl={5}>
                <Text fontWeight="black" fontSize="xl" color="brand.400">
                  {(p.price || 0).toLocaleString()} $
                </Text>
                {p.discountPrice && (
                  <Text
                    fontSize="sm"
                    color="whiteAlpha.500"
                    textDecoration="line-through"
                  >
                    {(p.discountPrice || 0).toLocaleString()} $
                  </Text>
                )}
              </Box>

              {/* Status */}
              <HStack spacing={2} align="center">
                {statusBadge(p.status)}
                {p.status === 'REJECTED' && (
                  <Button
                    size="xs"
                    variant="outline"
                    borderRadius="15px"
                    color="Red"
                    w="24px"
                    h="24px"
                    px={0}
                    onClick={() => setRejProduct(p)}
                    title="View reasons & suggestions"
                  >
                    ?
                  </Button>
                )}
              </HStack>

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
                  onClick={() => nav(`/seller/products/${p.id}/edit`)}
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
                  onClick={() => del(p.id)}
                >
                  Delete
                </Button>
              </HStack>
            </Grid>
          ))
        )}
      </Box>

      {/* Dialog hiển thị chi tiết REJECTED */}
      <ValidationDialog product={rejProduct} onClose={() => setRejProduct(null)} />
    </Box>
  )
}
