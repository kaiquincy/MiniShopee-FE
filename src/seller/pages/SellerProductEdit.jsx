import {
  Badge, Box, Button, createListCollection, Field, Flex, Heading, HStack, Icon, Image,
  Input, NumberInput, Portal, Select, Separator, SimpleGrid, Stack, Switch, Text, Textarea, VStack
} from '@chakra-ui/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FiArrowLeft, FiImage, FiSave } from 'react-icons/fi'
import { useNavigate, useParams } from 'react-router-dom'
import { toaster } from '../../components/ui/toaster'
import VariantsBuilder from '../../seller/components/VariantsBuilder'
import { buildPayloadObject } from '../utils/buildPayload'
import { getProduct, updateProduct } from '../api/seller' // <-- đổi theo project của bạn

// Utils nhỏ cho preview URL ảnh chính
const toPreviewSrc = (imageFile, imageUrl) => {
  if (imageFile instanceof File) return URL.createObjectURL(imageFile)
  if (!imageUrl) return ''
  const isAbs = /^https?:\/\//i.test(imageUrl) || imageUrl.startsWith('blob:')
  return isAbs ? imageUrl : `${import.meta.env.VITE_API_URL}/uploads/${imageUrl}`
}

export default function SellerProductEdit() {
  const nav = useNavigate()
  const { id } = useParams()
  const fileInputRef = useRef(null)

  const [p, setP] = useState({
    id: undefined,
    name: '', description: '',
    price: 0, discountPrice: undefined,
    quantity: 0,
    brand: '', sku: '',
    type: '', status: '',
    weight: undefined, dimensions: '',
    isFeatured: false,
    categoryIds: [],
    imageUrl: '', imageFile: undefined, // main
    // Variants
    variantGroups: [],
    variants: [] // { optionValues, price, stock, skuCode, imageKey, imageUrl?, imageFile? }
  })

  // --- Select data
  const statusList = createListCollection({
    items: [
      { label: 'ACTIVE', value: 'ACTIVE' },
      { label: 'INACTIVE', value: 'INACTIVE' },
      { label: 'DRAFT', value: 'DRAFT' },
      { label: 'OUT_OF_STOCK', value: 'OUT_OF_STOCK' },
    ],
  })
  const typeList = createListCollection({
    items: [
      { label: 'PHYSICAL', value: 'PHYSICAL' },
      { label: 'DIGITAL', value: 'DIGITAL' },
    ]
  })

  // --- Load product on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await getProduct(id) // <-- trả về DTO của bạn
        // map DTO -> state p
        setP({
          id: data.id,
          name: data.name ?? '',
          description: data.description ?? '',
          price: data.price ?? 0,
          discountPrice: data.discountPrice ?? undefined,
          quantity: data.quantity ?? 0,
          brand: data.brand ?? '',
          sku: data.sku ?? '',
          type: data.type ?? 'PHYSICAL',
          status: data.status ?? 'ACTIVE',
          weight: data.weight ?? undefined,
          dimensions: data.dimensions ?? '',
          isFeatured: !!data.isFeatured,
          categoryIds: Array.isArray(data.categoryIds) ? data.categoryIds : [],
          imageUrl: data.imageUrl ?? '',  // path/URL ảnh hiện tại
          imageFile: undefined,

          // variantGroups và variants giữ nguyên cấu trúc payload bạn đã chuẩn
          variantGroups: (data.variantGroups || []).map((g, idx) => ({
            name: g.name,
            sortOrder: g.sortOrder ?? (idx + 1),
            options: (g.options || []).map(o => typeof o === 'string' ? o : (o?.value ?? ''))
          })),
          variants: (data.variants || []).map(v => ({
            optionValues: v.optionValues || {},
            price: v.price ?? 0,
            stock: v.stock ?? 0,
            skuCode: v.skuCode ?? '',
            imageKey: v.imageKey,         // ví dụ "color=Black|size=S"
            imageUrl: v.imageUrl ?? '',   // URL ảnh variant hiện tại (nếu server trả về)
            imageFile: undefined          // khi user chọn file mới sẽ set vào đây
          }))
        })
      } catch (err) {
        toaster.create({ type: 'error', description: 'Failed to load product' })
        nav('/seller/products')
      }
    })()
  }, [id, nav])

  // --- Main preview
  const previewUrl = useMemo(() => toPreviewSrc(p.imageFile, p.imageUrl), [p.imageFile, p.imageUrl])
  // revoke object URL khi unmount/đổi file
  useEffect(() => {
    return () => {
      if (p?.imageFile instanceof File) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl]) // eslint-disable-line

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
    const ids = val.split(',').map(s => s.trim()).filter(Boolean).map(Number).filter(n => !Number.isNaN(n))
    setP(prev => ({ ...prev, categoryIds: ids }))
  }

  const save = async () => {
    try {
      const fd = new FormData()

      // 1) payload JSON (Blob để có Content-Type: application/json)
      const payload = buildPayloadObject(p) // tái dùng helper hiện tại
      // Nếu backend cần id trong payload:
      if (p.id != null) payload.id = p.id
      fd.append('payload', new Blob([JSON.stringify(payload)], { type: 'application/json' }))

      // 2) ảnh chính: chỉ append khi user đã chọn file mới
      if (p.imageFile instanceof File) fd.append('img', p.imageFile)

      // 3) ảnh biến thể: chỉ append những variant có imageFile mới
      ;(p.variants || []).forEach(v => {
        if (v?.imageFile instanceof File && v?.imageKey) {
          fd.append(`variantImages[${v.imageKey}]`, v.imageFile)
        }
      })

      await updateProduct(p.id, fd) // <-- đổi call theo API của bạn (PUT/PATCH)
      toaster.create({ type: 'success', description: 'Product updated successfully!' })
      nav('/seller/products')
    } catch (e) {
      toaster.create({ type: 'error', description: e?.response?.data?.message || 'Failed to update product' })
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
          <Heading size="2xl" fontWeight="black" mb={2}>Edit Product</Heading>
          <Text color="whiteAlpha.600">Update existing product</Text>
        </Box>
        <HStack spacing={3}>
          <Icon as={FiSave} boxSize={6} color="brand.500" />
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
                        <Text color="whiteAlpha.500" fontSize="sm">No image</Text>
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
                    value={[p.type] || ''}
                    onValueChange={(d) => setP({ ...p, type: d.value[0] })}
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
                    collection={statusList}
                    value={[p.status] || ''}
                    onValueChange={(d) => setP({ ...p, status: d.value[0] })}
                    // defaultValue={["ACTIVE"]} // sửa đây để chọn đúng status lúc load
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger
                        bg="gray.800" border="1px solid" borderColor="whiteAlpha.200" color="white"
                        _focus={{ borderColor: 'brand.500' }}
                      >
                        <Select.ValueText placeholder="Select status" />
                        
                      </Select.Trigger>
                      <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                    </Select.Control>
                    
                    {/* <Portal>
                      <Select.Positioner>
                        <Select.Content bg="gray.800" borderColor="whiteAlpha.200" color="white">
                          {statusList.items.map(st => (
                            <Select.Item key={st.value} item={st} _hover={{ bg: 'whiteAlpha.100' }}>
                              {st.label}<Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal> */}

                    <Portal>
                      <Select.Positioner>
                        <Select.Content bg="gray.800" borderColor="whiteAlpha.200" color="white">
                          {statusList.items.map((state) => (
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

              {/* Featured */}
              <Field.Root pt={4}>
                <HStack justify="space-between" p={4} bg="gray.800" borderRadius="md" border="1px solid" borderColor="whiteAlpha.200">
                  <Box>
                    <Text fontWeight="semibold" mb={1}>Featured Product</Text>
                    <Text fontSize="sm" color="whiteAlpha.600">Display this product prominently</Text>
                  </Box>
                  <Switch.Root
                    checked={p.isFeatured}
                    onCheckedChange={(d) => setP({ ...p, isFeatured: d.checked })}
                    colorPalette="brand"
                  >
                    <Switch.HiddenInput />
                    <Switch.Control><Switch.Thumb /></Switch.Control>
                  </Switch.Root>
                </HStack>
              </Field.Root>
            </Stack>
          </Box>

          {/* Right Column */}
          <Box p={8}>
            <Stack spacing={6}>
              {/* Price & Discount Price */}
              <SimpleGrid columns={2} gap={4}>
                <Field.Root>
                  <Field.Label color="whiteAlpha.700" fontSize="sm" fontWeight="semibold">Price *</Field.Label>
                  <NumberInput.Root
                    min={0}
                    value={p.price || 0}
                    onValueChange={(d) => setP({ ...p, price: d.valueAsNumber })}
                  >
                    <NumberInput.Input bg="gray.800" border="1px solid" borderColor="whiteAlpha.200" color="white" _focus={{ borderColor: 'brand.500' }} />
                    <NumberInput.Control />
                  </NumberInput.Root>
                </Field.Root>

                <Field.Root>
                  <Field.Label color="whiteAlpha.700" fontSize="sm" fontWeight="semibold">Discount Price</Field.Label>
                  <NumberInput.Root
                    min={0}
                    value={p.discountPrice ?? ''}
                    onValueChange={(d) => setP({ ...p, discountPrice: d.valueAsNumber })}
                  >
                    <NumberInput.Input bg="gray.800" border="1px solid" borderColor="whiteAlpha.200" color="white" _focus={{ borderColor: 'brand.500' }} />
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
                    onValueChange={(d) => setP({ ...p, quantity: d.valueAsNumber })}
                  >
                    <NumberInput.Input bg="gray.800" border="1px solid" borderColor="whiteAlpha.200" color="white" _focus={{ borderColor: 'brand.500' }} />
                    <NumberInput.Control />
                  </NumberInput.Root>
                </Field.Root>

                <Field.Root>
                  <Field.Label color="whiteAlpha.700" fontSize="sm" fontWeight="semibold">Weight (kg)</Field.Label>
                  <NumberInput.Root
                    min={0}
                    precision={2}
                    value={p.weight ?? ''}
                    onValueChange={(d) => setP({ ...p, weight: d.valueAsNumber })}
                  >
                    <NumberInput.Input bg="gray.800" border="1px solid" borderColor="whiteAlpha.200" color="white" _focus={{ borderColor: 'brand.500' }} />
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
                  bg="gray.800" border="1px solid" borderColor="whiteAlpha.200" color="white"
                  _placeholder={{ color: 'whiteAlpha.500' }}
                  _focus={{ borderColor: 'brand.500' }}
                />
              </Field.Root>

              {/* Category IDs */}
              <Field.Root>
                <Field.Label color="whiteAlpha.700" fontSize="sm" fontWeight="semibold">Category IDs</Field.Label>
                <Input
                  placeholder="1,2,3"
                  value={categoryIdsText}
                  onChange={e => setCategoryIdsText(e.target.value)}
                  bg="gray.800" border="1px solid" borderColor="whiteAlpha.200" color="white"
                  _placeholder={{ color: 'whiteAlpha.500' }}
                  _focus={{ borderColor: 'brand.500' }}
                />
                <Text mt={1} fontSize="xs" color="whiteAlpha.500">Enter category IDs separated by commas</Text>
              </Field.Root>

              {/* Variants Builder */}
              <Field.Root>
                <Box mt={2}>
                  <VariantsBuilder
                    value={{ variantGroups: p.variantGroups, variants: p.variants }}
                    onChange={({ variantGroups, variants }) =>
                      setP(prev => ({ ...prev, variantGroups, variants }))
                    }
                  />
                  {/* TIP: nếu server trả `imageUrl` cho từng variant, VariantsBuilder có thể show preview ảnh cũ:
                      - Bạn có thể sửa VariantsBuilder: nếu v.imageFile => preview file,
                        else if v.imageUrl => preview URL (tương tự hàm toPreviewSrc).
                  */}
                </Box>
              </Field.Root>
            </Stack>
          </Box>
        </SimpleGrid>

        {/* Footer Actions */}
        <Box p={6} borderTop="1px solid" borderColor="whiteAlpha.200" bg="gray.950">
          <Flex justify="flex-end" gap={3}>
            <Button
              variant="ghost"
              leftIcon={<FiArrowLeft />}
              onClick={() => nav('/seller/products')}
              color="whiteAlpha.700"
              _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
            >
              Cancel
            </Button>
            <Button
              bg="brand.500"
              color="white"
              leftIcon={<FiSave />}
              onClick={save}
              _hover={{ bg: 'brand.600' }}
            >
              Save Changes
            </Button>
          </Flex>
        </Box>
      </Box>
    </Box>
  )
}
