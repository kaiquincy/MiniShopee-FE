import { Badge, Box, Button, CloseButton, Dialog, Flex, Grid, Heading, HStack, Icon, Image, Input, Portal, Text, VStack } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { FiEdit2, FiPackage, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { toaster } from '../../components/ui/toaster'
import { useTheme } from '../../context/ThemeContext'
import { deleteProduct, fetchProducts } from '../api/seller'

export default function SellerProducts() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [rejProduct, setRejProduct] = useState(null) // sản phẩm đang xem lý do reject
  const nav = useNavigate()
  const { theme } = useTheme()

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

const ValidationDialog = ({ product, onClose, theme }) => {
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
              bg={theme.cardBg}
              border="1px solid"
              borderColor={hasRejection ? "red.700" : "whiteAlpha.200"}
              shadow="xl"
              rounded="2xl"
              p={2}>
            <Dialog.Header borderBottom="1px solid" borderColor={theme.border} pb={3}>
              <HStack spacing={3}>
                <Icon
                  as={hasRejection ? FiTrash2 : FiPackage}
                  color={hasRejection ? "red.400" : "brand.400"}
                  boxSize={5}
                />
                <Dialog.Title color={theme.text} fontWeight="bold">
                  {hasRejection ? "Validation Failed" : "Validation Summary"} — #{product?.id}
                </Dialog.Title>
              </HStack>
            </Dialog.Header>

            <Dialog.Body py={5} px={3}>
              {!data ? (
                <Text color={theme.textMuted}>No validation details available.</Text>
              ) : (
                <VStack align="stretch" gap={6}>
                  {/* SAFETY */}
                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="bold" color={theme.text} fontSize="lg">Safety</Text>
                      <Badge
                        bg={data.safety?.nsfw_label === "safe" ? "#10B98130" : "#EF444430"}
                        color={data.safety?.nsfw_label === "safe" ? "#10B981" : "#EF4444"}
                        border="1px solid"
                        borderColor={data.safety?.nsfw_label === "safe" ? "#10B981" : "#EF4444"}
                        px={2}
                        py={1}
                        fontSize="md"
                      >
                        {data.safety?.nsfw_label?.toUpperCase() || "UNKNOWN"}
                      </Badge>
                    </HStack>
                    <Text fontSize="sm" color={theme.textSecondary}>
                      Confidence: {data?.safety?.nsfw_confidence ?? '—'}
                    </Text>
                    {Array.isArray(data?.safety?.reasons) && data.safety.reasons.length > 0 && (
                      <VStack align="stretch" spacing={1} mt={2}>
                        {data.safety.reasons.map((r, i) => (
                          <HStack key={i} color="red.500" align="start">
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
                      <Text fontWeight="bold" color={theme.text} fontSize="lg">Title ↔ Image Consistency</Text>
                      <Badge
                        bg={data.consistency?.is_title_image_consistent === 'yes' ? "#2563EB30" : "#EF444430"}
                        color={data.consistency?.is_title_image_consistent === 'yes' ? "#60A5FA" : "#EF4444"}
                        border="1px solid"
                        borderColor={data.consistency?.is_title_image_consistent === 'yes' ? "#60A5FA" : "#EF4444"}
                        px={2}
                        py={1}
                        fontSize="md"
                      >
                        {data.consistency?.is_title_image_consistent?.toUpperCase()}
                      </Badge>
                    </HStack>
                    <Text fontSize="sm" color={theme.textSecondary}>
                      Confidence: {data?.consistency?.confidence ?? '—'}
                    </Text>
                    {Array.isArray(data?.consistency?.mismatch_reasons) && data.consistency.mismatch_reasons.length > 0 && (
                      <VStack align="stretch" spacing={2} mt={2}>
                        {data.consistency.mismatch_reasons.map((r, i) => (
                          <HStack key={i} align="start" color="red.500">
                            <Icon as={FiTrash2} boxSize={3.5} mt="2px" />
                            <Text fontSize="sm">{r}</Text>
                          </HStack>
                        ))}
                      </VStack>
                    )}
                  </Box>

                  {/* SUGGESTIONS */}
                  <Box>
                    <Text fontWeight="bold" color={theme.text} mb={3} fontSize="lg">
                      Suggested Fixes
                    </Text>
                    <VStack align="stretch" gap={4} fontSize="sm" color={theme.text}>
                      {/* Suggested Title + Replace */}
                      {suggestedTitle && (
                        <Box>
                          <HStack  mb={1}>
                            <Text color={theme.textSecondary} fontSize="sm" textTransform="uppercase" letterSpacing="wide">
                              Suggested Title
                            </Text>
                            <Button
                              size="md"
                              variant="ghost"
                              px={3}
                              py={1}
                              h="22px"
                              fontSize="sm"
                              // variant={useSuggestedTitle ? "solid" : "outline"}
                              bg={useSuggestedTitle ? theme.buttonBg : "transparent"}
                              color={useSuggestedTitle ? "white" : theme.text }
                              _hover={{ bg: theme.buttonHoverBg, color: "white" }}
                              borderColor={theme.buttonBg}
                              onClick={() => setUseSuggestedTitle(v => !v)}
                            >
                              {useSuggestedTitle ? "Revert" : "Replace"}
                            </Button>
                          </HStack>
                          <Text fontWeight="semibold" color={theme.textHighlight}>
                            {suggestedTitle}
                          </Text>
                          {useSuggestedTitle && (
                            <Text mt={1} fontSize="sm" color={theme.textSecondary}>
                              Will prefill as <b>{suggestedTitle}</b> on edit page.
                            </Text>
                          )}
                        </Box>
                      )}

                      {/* Suggested Description + Replace */}
                      {suggestedDesc && (
                        <Box>
                          <HStack mb={1}>
                            <Text color={theme.textSecondary} fontSize="sm" textTransform="uppercase" letterSpacing="wide">
                              Suggested Description
                            </Text>
                            <Button
                              size="md"
                              variant="ghost"
                              px={3}
                              py={1}
                              h="22px"
                              fontSize="sm"
                              bg={useSuggestedTitle ? theme.buttonBg : "transparent"}
                              color={useSuggestedTitle ? "white" : theme.text }
                              _hover={{ bg: theme.buttonHoverBg, color: "white" }}
                              borderColor={theme.buttonBg}
                              onClick={() => setUseSuggestedDesc(v => !v)}
                            >
                              {useSuggestedDesc ? "Revert" : "Replace"}
                            </Button>
                          </HStack>
                          <Text whiteSpace="pre-wrap" color={theme.textHighlight}>
                            {suggestedDesc}
                          </Text>
                          {useSuggestedDesc && (
                            <Text mt={1} fontSize="sm" color={theme.textSecondary}>
                              Will prefill suggested description on edit page.
                            </Text>
                          )}
                        </Box>
                      )}

                      {/* Keywords & Category giữ nguyên như trước */}
                      {Array.isArray(data?.suggestions?.keywords) && data.suggestions.keywords.length > 0 && (
                        <Box>
                          <Text color={theme.textSecondary} fontSize="sm" textTransform="uppercase" letterSpacing="wide">Keywords</Text>
                          <HStack wrap="wrap" spacing={2} mt={1}>
                            {data.suggestions.keywords.map((k, i) => (
                              <Badge key={i} bg="#94A3B865" border="1px solid" borderColor="#94A3B830" color={theme.textBadge}>
                                {k}
                              </Badge>
                            ))}
                          </HStack>
                        </Box>
                      )}
                      {data?.suggestions?.category_guess && (
                        <Box>
                          <Text color={theme.textSecondary} fontSize="sm" textTransform="uppercase" letterSpacing="wide">Category Guess</Text>
                          <Badge px={2} py={1} fontSize="sm" bg={theme.text} color={theme.inputBg} border="1px solid" borderColor={theme.border} mt={1}>
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
              <Button variant="outline" bg={theme.textSecondary} color="white" onClick={onClose}>Close</Button>
              {hasRejection && (
                <Button bg="red.600" color="white" _hover={{ bg: "red.700" }} onClick={handleReviewFix}>
                  Review & Fix
                </Button>
              )}
            </Dialog.Footer>

            <Dialog.CloseTrigger asChild>
              <CloseButton size="lg" color="red.500" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}


  return (
    <Box p={8}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading size="2xl" fontWeight="black" mb={2} color={theme.text}>Products</Heading>
          <Text color={theme.textSecondary}>Manage your product inventory</Text>
        </Box>
        <Button
          bg={theme.buttonBg}
          color="white"
          size="lg"
          borderRadius="md"
          _hover={{ bg: theme.buttonHoverBg }}
          onClick={() => nav('/seller/products/new')}
          gap={1}
        >
          <Icon as={FiPlus} />
          Add Product
        </Button>
      </Flex>

      {/* Stats Summary */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4} mb={6}>
        <Box bg={theme.cardBg} border="1px solid" borderColor={theme.border} p={4} borderRadius="lg" >
          <HStack gap={4}>
            <Box p={3} bg="#2563EB20" borderRadius="lg">
              <Icon as={FiPackage} boxSize={5} color="#2563EB" />
            </Box>
            <Box>
              <Text color={theme.text} fontSize="md">Total Products</Text>
              <Text color="#2563EB" fontWeight="bold" fontSize="2xl">{items.length}</Text>
            </Box>
          </HStack>
        </Box>
        <Box bg={theme.cardBg} border="1px solid" borderColor={theme.border} p={4} borderRadius="lg" >
          <HStack gap={4}>
            <Box p={3} bg="#10B98120" borderRadius="lg">
              <Icon as={FiPackage} boxSize={5} color="#10B981" />
            </Box>
            <Box>
              <Text color={theme.text} fontSize="md">In Stock</Text>
              <Text color="#10B981" fontWeight="bold" fontSize="2xl">{items.filter(p => p.quantity > 0).length}</Text>
            </Box>
          </HStack>
        </Box>
        <Box bg={theme.cardBg} border="1px solid" borderColor={theme.border} p={4} borderRadius="lg" >
          <HStack gap={4}>
            <Box p={3} bg="#EF444420" borderRadius="lg">
              <Icon as={FiPackage} boxSize={5} color="#EF4444" />
            </Box>
            <Box>
              <Text color={theme.text} fontSize="md">Out of Stock</Text>
              <Text color="#EF4444" fontWeight="bold" fontSize="2xl">{items.filter(p => !p.quantity || p.quantity === 0).length}</Text>
            </Box>
          </HStack>
        </Box>
      </Grid>

      {/* Search Bar */}
      <Flex gap={3} mb={6} bg={theme.cardBg} border="1px solid" borderColor={theme.border} p={5} borderRadius="lg" >
        <Box position="relative" flex={1} maxW="500px">
          <Icon
            as={FiSearch}
            position="absolute"
            left={4}
            top="50%"
            transform="translateY(-50%)"
            color={theme.text}
            boxSize={5}
            zIndex={1}
          />
          <Input
            placeholder="Search products by name..."
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            bg={theme.inputBg}
            border="1px solid"
            borderColor={theme.border}
            color={theme.text}
            pl={12}
            h="48px"
            _placeholder={{ color: theme.textSecondary }}
            _focus={{ borderColor: "brand.500" }}
            borderRadius="lg"
          />
        </Box>
        <Button
          onClick={load}
          bg={theme.buttonBg}
          color="white"
          h="48px"
          px={8}
          border="1px solid"
          borderColor={theme.border}
          _hover={{ bg: theme.buttonHoverBg }}
          borderRadius="lg"
        >
          Search
        </Button>
      </Flex>

      {/* Products Table */}
      <Box bg={theme.cardBg} border="1px solid" borderColor={theme.border}>
        {/* Table Header */}
        <Grid
          templateColumns="100px 100px 1fr 150px 160px 180px"
          py={4}
          px={6}
          borderBottom="1px solid"
          borderColor={theme.border}
          fontWeight="bold"
          fontSize="sm"
          color={theme.text}
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
            <Text color={theme.text}>Loading...</Text>
          </Box>
        ) : items.length === 0 ? (
          <Box p={12} textAlign="center">
            <Icon as={FiPackage} boxSize={12} color={theme.text} mb={4} />
            <Text color={theme.text} fontSize="lg" mb={2}>No products found</Text>
            <Text color={theme.textSecondary} fontSize="sm">Add your first product to get started</Text>
          </Box>
        ) : (
          items.map((p, idx) => (
            <Grid
              key={p.id}
              templateColumns="100px 100px 1fr 150px 160px 180px"
              py={4}
              px={6}
              borderBottom={idx !== items.length - 1 ? "1px solid" : "none"}
              borderColor={theme.borderLight}
              transition="all 0.2s"
              _hover={{ bg: theme.hoverBg }}
              alignItems="center"
            >
              {console.log(p)}
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
                  borderColor={theme.border}
                />
              </Box>

              {/* Product Info */}
              <VStack align="start" spacing={1}>
                <Text fontWeight="bold" fontSize="lg" lineClamp={1} color={theme.text}>
                  {p.name}
                </Text>
                <Text fontSize="md" lineClamp={2} color={theme.textSecondary}>
                  {p.description || 'No description'}
                </Text>
                {p.quantity !== undefined && (
                  <Text
                    fontSize="sm"
                    color={p.quantity > 0 ? "#10B981" : "#EF4444"}
                    fontWeight="semibold"
                  >
                    Stock: {p.quantity}
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
                    color={theme.textMuted}
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
                  bg={theme.buttonBg}
                  color="white"
                  border="1px solid"
                  borderColor={theme.border}
                  _hover={{ bg: theme.buttonHoverBg }}
                  onClick={() => nav(`/seller/products/${p.id}/edit`)}
                >
                  <Icon as={FiEdit2} />
                  Edit
                </Button>
                <Button
                  size="sm"
                  bg="red.500"
                  color="white"
                  border="1px solid"
                  borderColor="red.500"
                  _hover={{ bg: "red.600", color: "white", borderColor: "red.600" }}
                  onClick={() => del(p.id)}
                >
                  <Icon as={FiTrash2} />
                  Delete
                </Button>
              </HStack>
            </Grid>
          ))
        )}
      </Box>

      {/* Dialog hiển thị chi tiết REJECTED */}
      <ValidationDialog product={rejProduct} onClose={() => setRejProduct(null)} theme={theme} />
    </Box>
  )
}
