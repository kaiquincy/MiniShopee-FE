import {
  Badge,
  Box, Button,
  createListCollection,
  Field,
  Flex, Heading,
  HStack,
  Icon,
  Image,
  Input,
  NumberInput,
  Portal,
  Select,
  Separator,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Textarea,
  VStack
} from '@chakra-ui/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FiArrowLeft, FiImage, FiPlus, FiX } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import api from "../../api/client"
import { toaster } from '../../components/ui/toaster'
import { useTheme } from '../../context/ThemeContext'
import { createProduct } from '../api/seller'
import VariantsBuilder from '../components/VariantsBuilder'
import { buildPayloadObject } from '../utils/buildPayload'


export default function SellerProductNew() {
  const nav = useNavigate()
  const [p, setP] = useState({
    name: '', description: '',
    price: 0, discountPrice: undefined,
    quantity: 0,
    brand: '', sku: '',
    type: '', status: '',
    weight: undefined, dimensions: '',
    isFeatured: false,
    categoryIds: [],
    imageUrl: '', imageFile: undefined,
    variantGroups: [],
    variants: []
  })
  const fileInputRef = useRef(null)
  
  const states = createListCollection({
    items: [
      { label: "ACTIVE", value: "ACTIVE" },
      { label: "INACTIVE", value: "INACTIVE" },
      { label: "DRAFT", value: "DRAFT" },
      { label: "OUT_OF_STOCK", value: "OUT_OF_STOCK" },
    ],
  })

    const typeList = createListCollection({
    items: [
      { label: 'PHYSICAL', value: 'PHYSICAL' },
      { label: 'DIGITAL', value: 'DIGITAL' },
    ]
  })


  const [tree, setTree] = useState([])
  const [loading, setLoading] = useState(false)

  const { theme } = useTheme()

  useEffect(() => {
    let ignore = false
    setLoading(true)

    api.get("/api/categories/tree")
      .then(({ data }) => {
        if (!ignore) setTree(data?.result || [])
      })
      .catch(() => {
        if (!ignore) setTree([])
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => { ignore = true }
  }, [])

  const childCategoryItems = useMemo(() => {
    // chỉ lấy children (level 2) từ từng root
    const items = (tree || []).flatMap(parent =>
      (parent?.children || []).map(child => ({
        label: `${parent.name} / ${child.name}`,
        value: String(child.id),        // Select thường dùng string
        id: child.id,
        parentId: parent.id,
      }))
    )
    return items
  }, [tree])

  const categoryCollection = useMemo(() => createListCollection({
    items: childCategoryItems
  }), [childCategoryItems])

  const previewUrl = useMemo(() => {
    if (p?.imageFile instanceof File) return URL.createObjectURL(p.imageFile)
    return p?.imageUrl || ''
  }, [p?.imageFile, p?.imageUrl])

  const categoryIdsText = useMemo(() => {
    const ids = p?.categoryIds
    const arr = Array.isArray(ids) ? ids : (ids ? [ids] : [])
    return arr.join(',')
  }, [p?.categoryIds])

  const onFileChange = (e) => {
    const f = e.target.files?.[0]
    if (f) setP(prev => ({ ...prev, imageFile: f }))
  }

  const setCategoryIdsText = (val) => {
    const ids = val
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter(n => !Number.isNaN(n))
    setP(prev => ({ ...prev, categoryIds: ids }))
  }

  const save = async () => {
    try {
      const fd = new FormData()

      //1. Thêm payload (dưới dạng JSON string)
      const payload = buildPayloadObject(p)
      fd.append('payload', new Blob(
        [JSON.stringify(payload)],
        { type: 'application/json' }
      ))


      //2. Thêm ảnh đại diện (nếu có)
      if (p.imageFile instanceof File) {
        fd.append('img', p.imageFile)
      }

      //3. Thêm ảnh từng variant (nếu có)
      ;(p.variants || []).forEach(v => {
        if (v?.imageFile instanceof File && v?.imageKey) {
          fd.append('variantImages[' + v.imageKey + ']', v.imageFile)
        }
      })

      await createProduct(fd)
      toaster.create({ type: 'success', description: 'Product created successfully!' })
      nav('/seller/products')
    } catch (e) {
      toaster.create({ type: 'error', description: e?.response?.data?.message || 'Failed to create product' })
    }
  }

  return (
    <Box color={theme.text} py={8} px={12}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <HStack mb={2}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => nav("/seller/products")}
              color={theme.textSecondary}
              _hover={{ color: theme.textMuted, bg: theme.hoverBg }}
            >
              <FiArrowLeft />
              Back to Products
            </Button>
          </HStack>

          <Heading size="2xl" fontWeight="black" mb={2} color={theme.text}>
            Add New Product
          </Heading>
          <Text color={theme.textSecondary}>Create a new product listing</Text>
        </Box>

        <HStack spacing={3}>
          <Icon as={FiPlus} boxSize={6} color="brand.500" />
        </HStack>
      </Flex>

      {/* Main Form */}
      <Box
        bg={theme.cardBg}
        border="1px solid"
        borderColor={theme.border}
        borderRadius="lg"
        overflow="hidden"
      >
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={0}>
          {/* Left Column - Image & Basic Info */}
          <Box p={8} borderRight={{ lg: "1px solid" }} borderColor={theme.border}>
            <Stack spacing={6}>
              {/* Image Upload */}
              <Box>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  mb={3}
                  color={theme.text}
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  Product Image
                </Text>

                <Box position="relative" borderRadius="lg" overflow="hidden" bg={theme.inputBg}>
                  {previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt="Product preview"
                      objectFit="cover"
                      w="100%"
                      aspectRatio="1"
                    />
                  ) : (
                    <Box
                      w="100%"
                      aspectRatio="1"
                      bg={theme.inputBg}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      border="2px dashed"
                      borderColor={theme.border}
                    >
                      <VStack spacing={3}>
                        <Icon as={FiImage} boxSize={12} color={theme.textSecondary} />
                        <Text color={theme.textSecondary} fontSize="sm">
                          No image selected
                        </Text>
                      </VStack>
                    </Box>
                  )}

                  <Box
                    position="absolute"
                    inset="0"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    bg="blackAlpha.700"
                    opacity={0}
                    _hover={{ opacity: 1 }}
                    transition="opacity 0.3s"
                    cursor="pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <VStack spacing={2}>
                      <Icon as={FiImage} boxSize={8} color="white" />
                      <Text fontWeight="semibold">
                        {previewUrl ? "Change Image" : "Upload Image"}
                      </Text>
                    </VStack>
                  </Box>

                  <Input
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    display="none"
                    ref={fileInputRef}
                  />
                </Box>

                <HStack mt={3} spacing={2}>
                  <Badge bg={theme.pageBg} color={theme.text} px={2} py={1}>
                    PNG/JPG
                  </Badge>
                  <Badge bg={theme.pageBg} color={theme.text} px={2} py={1}>
                    Max 5MB
                  </Badge>
                </HStack>
              </Box>

              <Separator mt={4} mb={3} borderColor={theme.border} />

              {/* Name */}
              <Field.Root>
                <Field.Label color={theme.text} fontSize="sm" fontWeight="semibold">
                  Product Name *
                </Field.Label>
                <Input
                  placeholder="Enter product name"
                  value={p.name || ""}
                  onChange={(e) => setP({ ...p, name: e.target.value })}
                  bg={theme.inputBg}
                  border="1px solid"
                  borderColor={theme.border}
                  color={theme.text}
                  size="lg"
                  _placeholder={{ color: theme.textSecondary }}
                  _focus={{ borderColor: "brand.500" }}
                />
              </Field.Root>

              {/* Description */}
              <Field.Root>
                <Field.Label color={theme.text} fontSize="sm" fontWeight="semibold">
                  Description *
                </Field.Label>
                <Textarea
                  placeholder="Detailed product description"
                  value={p.description || ""}
                  onChange={(e) => setP({ ...p, description: e.target.value })}
                  rows={5}
                  bg={theme.inputBg}
                  border="1px solid"
                  borderColor={theme.border}
                  color={theme.text}
                  _placeholder={{ color: theme.textSecondary }}
                  _focus={{ borderColor: "brand.500" }}
                />
              </Field.Root>

              <Separator mt={4} mb={3} borderColor={theme.border} />

              {/* Brand & SKU */}
              <SimpleGrid columns={2} gap={4}>
                <Field.Root>
                  <Field.Label color={theme.text} fontSize="sm" fontWeight="semibold">
                    Brand
                  </Field.Label>
                  <Input
                    placeholder="Nike, Apple..."
                    value={p.brand || ""}
                    onChange={(e) => setP({ ...p, brand: e.target.value })}
                    bg={theme.inputBg}
                    border="1px solid"
                    borderColor={theme.border}
                    color={theme.text}
                    _placeholder={{ color: theme.textSecondary }}
                    _focus={{ borderColor: "brand.500" }}
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label color={theme.text} fontSize="sm" fontWeight="semibold">
                    SKU
                  </Field.Label>
                  <Input
                    placeholder="Product code"
                    value={p.sku || ""}
                    onChange={(e) => setP({ ...p, sku: e.target.value })}
                    bg={theme.inputBg}
                    border="1px solid"
                    borderColor={theme.border}
                    color={theme.text}
                    _placeholder={{ color: theme.textSecondary }}
                    _focus={{ borderColor: "brand.500" }}
                  />
                </Field.Root>
              </SimpleGrid>

              {/* Type & Status */}
              <SimpleGrid columns={2} gap={4}>
                <Field.Root>
                  <Field.Label color={theme.text} fontSize="sm" fontWeight="semibold">
                    Type
                  </Field.Label>
                  <Select.Root
                    collection={typeList}
                    value={[p.type] || []}
                    onValueChange={(d) => setP({ ...p, type: d.value[0] })}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger
                        bg={theme.inputBg}
                        border="1px solid"
                        borderColor={theme.border}
                        color={theme.text}
                        _focus={{ borderColor: "brand.500" }}
                      >
                        <Select.ValueText placeholder="Select type" />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>

                    <Portal>
                      <Select.Positioner>
                        <Select.Content bg={theme.inputBg} borderColor={theme.border} color={theme.text}>
                          {typeList.items.map((it) => (
                            <Select.Item key={it.value} item={it} _hover={{ bg: theme.hoverBg }}>
                              {it.label}
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>
                </Field.Root>

                <Field.Root>
                  <Field.Label color={theme.text} fontSize="sm" fontWeight="semibold">
                    Status
                  </Field.Label>
                  <Select.Root
                    collection={states}
                    value={p.status || ["PROCESSING"]}
                    onValueChange={(d) => setP({ ...p, status: d.value })}
                    disabled
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger
                        bg={theme.inputBg}
                        border="1px solid"
                        borderColor={theme.border}
                        color={theme.text}
                        _focus={{ borderColor: "brand.500" }}
                      >
                        <Select.ValueText placeholder="Select status" />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>

                    <Portal>
                      <Select.Positioner>
                        <Select.Content bg={theme.inputBg} borderColor={theme.border} color={theme.text}>
                          {states.items.map((state) => (
                            <Select.Item key={state.value} item={state} _hover={{ bg: theme.hoverBg }}>
                              {state.label}
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>
                </Field.Root>
              </SimpleGrid>

              <Separator mt={4} mb={3} borderColor={theme.border} />

              {/* Featured Toggle */}
              <Field.Root pt={4}>
                <HStack
                  justify="space-between"
                  p={4}
                  gap={5}
                  bg={theme.inputBg}
                  borderRadius="md"
                  border="1px solid"
                  borderColor={theme.border}
                >
                  <Box>
                    <Text fontWeight="semibold" mb={1} color={theme.text}>
                      Featured Product
                    </Text>
                    <Text fontSize="sm" color={theme.textSecondary}>
                      Display this product prominently
                    </Text>
                  </Box>

                  <Switch.Root
                    checked={p.isFeatured}
                    onCheckedChange={(d) => setP({ ...p, isFeatured: d.checked })}
                  >
                    <Switch.HiddenInput />
                    <Switch.Control bg={theme.border} _checked={{ bg: theme.buttonBg }}>
                      <Switch.Thumb bg={theme.textMuted} _checked={{ bg: "white" }} />
                    </Switch.Control>
                  </Switch.Root>
                </HStack>
              </Field.Root>
            </Stack>
          </Box>

          {/* Right Column - Product Details */}
          <Box p={8}>
            <Stack spacing={6}>
              {/* Price & Discount Price */}
              <SimpleGrid columns={2} gap={4}>
                <Field.Root>
                  <Field.Label color={theme.text} fontSize="sm" fontWeight="semibold">
                    Price *
                  </Field.Label>
                  <NumberInput.Root
                    min={0}
                    value={p.price || 0}
                    onValueChange={(d) => setP({ ...p, price: d.valueAsNumber })}
                  >
                    <NumberInput.Input
                      placeholder="0.00"
                      bg={theme.inputBg}
                      border="1px solid"
                      borderColor={theme.border}
                      color={theme.text}
                      _placeholder={{ color: theme.textSecondary }}
                      _focus={{ borderColor: "brand.500" }}
                    />
                    <NumberInput.Control />
                  </NumberInput.Root>
                </Field.Root>

                <Field.Root>
                  <Field.Label color={theme.text} fontSize="sm" fontWeight="semibold">
                    Discount Price
                  </Field.Label>
                  <NumberInput.Root
                    min={0}
                    value={p.discountPrice ?? ""}
                    onValueChange={(d) => setP({ ...p, discountPrice: d.valueAsNumber })}
                  >
                    <NumberInput.Input
                      placeholder="0.00"
                      bg={theme.inputBg}
                      border="1px solid"
                      borderColor={theme.border}
                      color={theme.text}
                      _placeholder={{ color: theme.textSecondary }}
                      _focus={{ borderColor: "brand.500" }}
                    />
                    <NumberInput.Control />
                  </NumberInput.Root>
                </Field.Root>
              </SimpleGrid>

              {/* Quantity & Weight */}
              <SimpleGrid columns={2} gap={4}>
                <Field.Root>
                  <Field.Label color={theme.text} fontSize="sm" fontWeight="semibold">
                    Stock Quantity *
                  </Field.Label>
                  <NumberInput.Root
                    min={0}
                    value={p.quantity || 0}
                    onValueChange={(d) => setP({ ...p, quantity: d.valueAsNumber })}
                  >
                    <NumberInput.Input
                      placeholder="0"
                      bg={theme.inputBg}
                      border="1px solid"
                      borderColor={theme.border}
                      color={theme.text}
                      _placeholder={{ color: theme.textSecondary }}
                      _focus={{ borderColor: "brand.500" }}
                    />
                    <NumberInput.Control />
                  </NumberInput.Root>
                </Field.Root>

                <Field.Root>
                  <Field.Label color={theme.text} fontSize="sm" fontWeight="semibold">
                    Weight (kg)
                  </Field.Label>
                  <NumberInput.Root
                    min={0}
                    precision={2}
                    value={p.weight ?? ""}
                    onValueChange={(d) => setP({ ...p, weight: d.valueAsNumber })}
                  >
                    <NumberInput.Input
                      placeholder="0.00"
                      bg={theme.inputBg}
                      border="1px solid"
                      borderColor={theme.border}
                      color={theme.text}
                      _placeholder={{ color: theme.textSecondary }}
                      _focus={{ borderColor: "brand.500" }}
                    />
                    <NumberInput.Control />
                  </NumberInput.Root>
                </Field.Root>
              </SimpleGrid>

              {/* Dimensions */}
              <Field.Root>
                <Field.Label color={theme.text} fontSize="sm" fontWeight="semibold">
                  Dimensions
                </Field.Label>
                <Input
                  placeholder="L x W x H (cm)"
                  value={p.dimensions || ""}
                  onChange={(e) => setP({ ...p, dimensions: e.target.value })}
                  bg={theme.inputBg}
                  border="1px solid"
                  borderColor={theme.border}
                  color={theme.text}
                  _placeholder={{ color: theme.textSecondary }}
                  _focus={{ borderColor: "brand.500" }}
                />
              </Field.Root>

              {/* Category */}
              <Field.Root>
                <Field.Label color={theme.text} fontSize="sm" fontWeight="semibold">
                  Category
                </Field.Label>

                <Select.Root
                  collection={categoryCollection}
                  value={p.categoryIds?.[0] ? [String(p.categoryIds[0])] : []}
                  onValueChange={(details) => {
                    const first = details.value?.[0]
                    const id = Number(first)
                    setP((prev) => ({ ...prev, categoryIds: Number.isNaN(id) ? [] : [id] }))
                  }}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger
                      bg={theme.inputBg}
                      border="1px solid"
                      borderColor={theme.border}
                      color={theme.text}
                      _focus={{ borderColor: "brand.500" }}
                    >
                      <Select.ValueText
                        placeholder={loading ? "Loading categories..." : "Select category"}
                      />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                    </Select.IndicatorGroup>
                  </Select.Control>

                  <Portal>
                    <Select.Positioner>
                      <Select.Content bg={theme.inputBg} borderColor={theme.border} color={theme.text}>
                        {categoryCollection.items.map((it) => (
                          <Select.Item key={it.value} item={it} _hover={{ bg: theme.hoverBg }}>
                            {it.label}
                            <Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>

                <Text mt={1} fontSize="sm" color={theme.textSecondary}>
                  Only sub-categories (children) are selectable
                </Text>
              </Field.Root>

              {/* Variants Builder */}
              <Field.Root>
                <Box mt={2}>
                  <VariantsBuilder
                    value={{ variantGroups: p.variantGroups, variants: p.variants }}
                    onChange={({ variantGroups, variants }) =>
                      setP((prev) => ({ ...prev, variantGroups, variants }))
                    }
                    theme={theme}
                  />
                </Box>
              </Field.Root>
            </Stack>
          </Box>
        </SimpleGrid>

        {/* Footer Actions */}
        <Box p={6} borderTop="1px solid" borderColor={theme.border} bg={theme.hoverBg}>
          <Flex justify="flex-end" gap={3}>
            <Button
              variant="ghost"
              leftIcon={<FiX />}
              onClick={() => nav("/seller/products")}
              color={theme.text}
              _hover={{ bg: theme.hoverBg, color: theme.textMuted }}
            >
              Cancel
            </Button>

            <Button
              bg={theme.buttonBg}
              color="white"
              leftIcon={<FiPlus />}
              onClick={save}
              _hover={{ bg: theme.buttonHoverBg }}
            >
              Create Product
            </Button>
          </Flex>
        </Box>
      </Box>
    </Box>
  )
}