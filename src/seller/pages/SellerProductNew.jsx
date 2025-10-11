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
import { useMemo, useRef, useState } from 'react'
import { FiArrowLeft, FiImage, FiPlus, FiX } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { toaster } from '../../components/ui/toaster'
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
    <Box color="white">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <HStack mb={2}>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<FiArrowLeft />}
              onClick={() => nav('/seller/products')}
              color="whiteAlpha.600"
              _hover={{ color: "white", bg: "whiteAlpha.100" }}
            >
              Back to Products
            </Button>
          </HStack>
          <Heading size="2xl" fontWeight="black" mb={2}>Add New Product</Heading>
          <Text color="whiteAlpha.600">Create a new product listing</Text>
        </Box>
        <HStack spacing={3}>
          <Icon as={FiPlus} boxSize={6} color="brand.500" />
        </HStack>
      </Flex>

      {/* Main Form */}
      <Box bg="gray.900" border="1px solid" borderColor="whiteAlpha.200" borderRadius="lg" overflow="hidden">
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={0}>
          {/* Left Column - Image & Basic Info */}
          <Box p={8} borderRight={{ lg: "1px solid" }} borderColor="whiteAlpha.200">
            <Stack spacing={6}>
              {/* Image Upload */}
              <Box>
                <Text fontSize="sm" fontWeight="bold" mb={3} color="whiteAlpha.700" textTransform="uppercase" letterSpacing="wider">
                  Product Image
                </Text>
                <Box position="relative" borderRadius="lg" overflow="hidden" bg="gray.800">
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
                      bg="gray.800"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      border="2px dashed"
                      borderColor="whiteAlpha.300"
                    >
                      <VStack spacing={3}>
                        <Icon as={FiImage} boxSize={12} color="whiteAlpha.400" />
                        <Text color="whiteAlpha.500" fontSize="sm">No image selected</Text>
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
                      <Text fontWeight="semibold">{previewUrl ? 'Change Image' : 'Upload Image'}</Text>
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
                  <Badge bg="whiteAlpha.100" color="whiteAlpha.700" px={2} py={1}>PNG/JPG</Badge>
                  <Badge bg="whiteAlpha.100" color="whiteAlpha.700" px={2} py={1}>Max 5MB</Badge>
                </HStack>
              </Box>

              <Separator borderColor="whiteAlpha.200" />

              {/* Name */}
              <Field.Root>
                <Field.Label color="whiteAlpha.700" fontSize="sm" fontWeight="semibold">Product Name *</Field.Label>
                <Input
                  placeholder="Enter product name"
                  value={p.name || ''}
                  onChange={e => setP({ ...p, name: e.target.value })}
                  bg="gray.800"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  color="white"
                  size="lg"
                  _placeholder={{ color: "whiteAlpha.500" }}
                  _focus={{ borderColor: "brand.500" }}
                />
              </Field.Root>

              {/* Description */}
              <Field.Root>
                <Field.Label color="whiteAlpha.700" fontSize="sm" fontWeight="semibold">Description *</Field.Label>
                <Textarea
                  placeholder="Detailed product description"
                  value={p.description || ''}
                  onChange={e => setP({ ...p, description: e.target.value })}
                  rows={5}
                  bg="gray.800"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  color="white"
                  _placeholder={{ color: "whiteAlpha.500" }}
                  _focus={{ borderColor: "brand.500" }}
                />
              </Field.Root>

              <Separator borderColor="whiteAlpha.200" />

              {/* Brand & SKU */}
              <SimpleGrid columns={2} gap={4}>
                <Field.Root>
                  <Field.Label color="whiteAlpha.700" fontSize="sm" fontWeight="semibold">Brand</Field.Label>
                  <Input
                    placeholder="Nike, Apple..."
                    value={p.brand || ''}
                    onChange={e => setP({ ...p, brand: e.target.value })}
                    bg="gray.800"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    color="white"
                    _placeholder={{ color: "whiteAlpha.500" }}
                    _focus={{ borderColor: "brand.500" }}
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label color="whiteAlpha.700" fontSize="sm" fontWeight="semibold">SKU</Field.Label>
                  <Input
                    placeholder="Product code"
                    value={p.sku || ''}
                    onChange={e => setP({ ...p, sku: e.target.value })}
                    bg="gray.800"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    color="white"
                    _placeholder={{ color: "whiteAlpha.500" }}
                    _focus={{ borderColor: "brand.500" }}
                  />
                </Field.Root>
              </SimpleGrid>

              {/* Type & Status */}
              <SimpleGrid columns={2} gap={4}>
                <Field.Root>
                  <Field.Label color="whiteAlpha.700" fontSize="sm" fontWeight="semibold">Type</Field.Label>
                  <Select.Root
                    collection={typeList}
                    value={p.type || ''}
                    onValueChange={(d) => setP({ ...p, type: d.value })}
                    // defaultValue={["PHYSICAL"]} // sửa đây để chọn đúng type lúc load
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger
                        bg="gray.800" border="1px solid" borderColor="whiteAlpha.200" color="white"
                        _focus={{ borderColor: 'brand.500' }}
                      >
                        <Select.ValueText placeholder="Select type" />
                      </Select.Trigger>
                      <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content bg="gray.800" borderColor="whiteAlpha.200" color="white">
                          {typeList.items.map(it => (
                            <Select.Item key={it.value} item={it} _hover={{ bg: 'whiteAlpha.100' }}>
                              {it.label}<Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>
                </Field.Root>

                <Field.Root>
                  <Field.Label color="whiteAlpha.700" fontSize="sm" fontWeight="semibold">Status</Field.Label>
                  <Select.Root
                    collection={states}
                    value={p.status || ['ACTIVE']}
                    onValueChange={(details) => setP({ ...p, status: details.value })}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger
                        bg="gray.800"
                        border="1px solid"
                        borderColor="whiteAlpha.200"
                        color="white"
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
                        <Select.Content bg="gray.800" borderColor="whiteAlpha.200" color="white">
                          {states.items.map((state) => (
                            <Select.Item 
                              item={state} 
                              key={state.value}
                              _hover={{ bg: "whiteAlpha.100" }}
                            >
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

              <Separator borderColor="whiteAlpha.200" />


              {/* Featured Toggle */}
              <Field.Root pt={4}>
                <HStack justify="space-between" p={4} bg="gray.800" borderRadius="md" border="1px solid" borderColor="whiteAlpha.200">
                  <Box>
                    <Text fontWeight="semibold" mb={1}>Featured Product</Text>
                    <Text fontSize="sm" color="whiteAlpha.600">Display this product prominently</Text>
                  </Box>
                  <Switch.Root 
                    checked={p.isFeatured} 
                    onCheckedChange={(details) => setP({ ...p, isFeatured: details.checked })}
                    colorPalette="brand"
                  >
                    <Switch.HiddenInput />
                    <Switch.Control>
                      <Switch.Thumb />
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
                  <Field.Label color="whiteAlpha.700" fontSize="sm" fontWeight="semibold">Price *</Field.Label>
                  <NumberInput.Root
                    min={0}
                    value={p.price || 0}
                    onValueChange={(details) => setP({ ...p, price: details.valueAsNumber })}
                  >
                    <NumberInput.Input 
                      placeholder="0.00"
                      bg="gray.800"
                      border="1px solid"
                      borderColor="whiteAlpha.200"
                      color="white"
                      _focus={{ borderColor: "brand.500" }}
                    />
                    <NumberInput.Control />
                  </NumberInput.Root>
                </Field.Root>

                <Field.Root>
                  <Field.Label color="whiteAlpha.700" fontSize="sm" fontWeight="semibold">Discount Price</Field.Label>
                  <NumberInput.Root
                    min={0}
                    value={p.discountPrice ?? ''}
                    onValueChange={(details) => setP({ ...p, discountPrice: details.valueAsNumber })}
                  >
                    <NumberInput.Input 
                      placeholder="0.00"
                      bg="gray.800"
                      border="1px solid"
                      borderColor="whiteAlpha.200"
                      color="white"
                      _focus={{ borderColor: "brand.500" }}
                    />
                    <NumberInput.Control />
                  </NumberInput.Root>
                </Field.Root>
              </SimpleGrid>

              {/* Quantity & Weight */}
              <SimpleGrid columns={2} gap={4}>
                <Field.Root>
                  <Field.Label color="whiteAlpha.700" fontSize="sm" fontWeight="semibold">Stock Quantity *</Field.Label>
                  <NumberInput.Root
                    min={0}
                    value={p.quantity || 0}
                    onValueChange={(details) => setP({ ...p, quantity: details.valueAsNumber })}
                  >
                    <NumberInput.Input 
                      placeholder="0"
                      bg="gray.800"
                      border="1px solid"
                      borderColor="whiteAlpha.200"
                      color="white"
                      _focus={{ borderColor: "brand.500" }}
                    />
                    <NumberInput.Control />
                  </NumberInput.Root>
                </Field.Root>

                <Field.Root>
                  <Field.Label color="whiteAlpha.700" fontSize="sm" fontWeight="semibold">Weight (kg)</Field.Label>
                  <NumberInput.Root
                    min={0}
                    precision={2}
                    value={p.weight ?? ''}
                    onValueChange={(details) => setP({ ...p, weight: details.valueAsNumber })}
                  >
                    <NumberInput.Input 
                      placeholder="0.00"
                      bg="gray.800"
                      border="1px solid"
                      borderColor="whiteAlpha.200"
                      color="white"
                      _focus={{ borderColor: "brand.500" }}
                    />
                    <NumberInput.Control />
                  </NumberInput.Root>
                </Field.Root>
              </SimpleGrid>

              {/* Dimensions */}
              <Field.Root>
                <Field.Label color="whiteAlpha.700" fontSize="sm" fontWeight="semibold">Dimensions</Field.Label>
                <Input
                  placeholder="L x W x H (cm)"
                  value={p.dimensions || ''}
                  onChange={e => setP({ ...p, dimensions: e.target.value })}
                  bg="gray.800"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  color="white"
                  _placeholder={{ color: "whiteAlpha.500" }}
                  _focus={{ borderColor: "brand.500" }}
                />
              </Field.Root>

              {/* Category IDs */}
              <Field.Root>
                <Field.Label color="whiteAlpha.700" fontSize="sm" fontWeight="semibold">Category IDs</Field.Label>
                <Input
                  placeholder="1,2,3"
                  value={categoryIdsText}
                  onChange={e => setCategoryIdsText(e.target.value)}
                  bg="gray.800"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  color="white"
                  _placeholder={{ color: "whiteAlpha.500" }}
                  _focus={{ borderColor: "brand.500" }}
                />
                <Text mt={1} fontSize="xs" color="whiteAlpha.500">
                  Enter category IDs separated by commas
                </Text>
              </Field.Root>



              {/* Variants Builder */}
              <Field.Root>
                <Box mt={8}>
                  <VariantsBuilder
                    value={{ variantGroups: p.variantGroups, variants: p.variants }}
                    onChange={({ variantGroups, variants }) => setP(prev => ({ ...prev, variantGroups, variants }))}
                  />
                </Box> 
              </Field.Root>


            </Stack>
       

          </Box>

        </SimpleGrid>


        {/* Footer Actions */}
        <Box 
          p={6} 
          borderTop="1px solid" 
          borderColor="whiteAlpha.200"
          bg="gray.950"
        >
          <Flex justify="flex-end" gap={3}>
            <Button
              variant="ghost"
              leftIcon={<FiX />}
              onClick={() => nav('/seller/products')}
              color="whiteAlpha.700"
              _hover={{ bg: "whiteAlpha.100", color: "white" }}
            >
              Cancel
            </Button>
            <Button
              bg="brand.500"
              color="white"
              leftIcon={<FiPlus />}
              onClick={save}
              _hover={{ bg: "brand.600" }}
            >
              Create Product
            </Button>
          </Flex>
        </Box>
      </Box>
    </Box>
  )
}