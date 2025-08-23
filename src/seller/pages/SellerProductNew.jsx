import { useEffect, useMemo, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box, Button, Flex, Heading, SimpleGrid, GridItem, Stack, Separator,
  Field, Input, Textarea, Select, Switch, NumberInput,
  Image, Icon, Text, HStack, Badge, Portal, createListCollection, IconButton
} from '@chakra-ui/react'
import { FiEdit } from 'react-icons/fi'
import { createProduct, updateProduct } from '../api/seller'
import { toaster } from '../../components/ui/toaster'

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
    imageUrl: '', imageFile: undefined
  })
  const fileInputRef = useRef(null); // Ref để kích hoạt input file
  const states = createListCollection({
    items: [
      { label: "ACTIVE", value: "ACTIVE" },
      { label: "INACTIVE", value: "INACTIVE" },
      { label: "DRAFT", value: "DRAFT" },
      { label: "OUT_OF_STOCK", value: "OUT_OF_STOCK" },
    ],
  })


  // Preview ảnh nếu đổi file mới
  const previewUrl = useMemo(() => {
    if (p?.imageFile instanceof File) return URL.createObjectURL(p.imageFile)
    return p?.imageUrl || ''
  }, [p?.imageFile, p?.imageUrl])

  // categoryIds nhập dạng "1,2,3"
  const categoryIdsText = useMemo(() => {
    const ids = p?.categoryIds;                  // ✅ an toàn khi p = null
    const arr = Array.isArray(ids) ? ids : (ids ? [ids] : []);
    return arr.join(',');
  }, [p?.categoryIds]);

  // if (!p) return null



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
      // Required
      fd.append('name', p.name ?? '')
      fd.append('description', p.description ?? '')
      fd.append('price', String(p.price ?? 0))
      fd.append('quantity', String(p.quantity ?? 0))

      // Optional
      if (p.sku)   fd.append('sku', p.sku)
      if (p.brand) fd.append('brand', p.brand)
      if (p.type)  fd.append('type', p.type)
      if (p.status) fd.append('status', p.status)
      if (p.discountPrice != null) fd.append('discountPrice', String(p.discountPrice))
      if (p.weight != null)        fd.append('weight', String(p.weight))
      if (p.dimensions)            fd.append('dimensions', p.dimensions)
      if (p.isFeatured != null)    fd.append('isFeatured', String(!!p.isFeatured))

      // Ảnh: ưu tiên file; nếu không có file, gửi imageUrl (nếu BE chấp nhận)
      if (p.imageFile instanceof File) {
        fd.append('img', p.imageFile) // đổi thành 'image' nếu BE yêu cầu
      }

      // categoryIds: append nhiều lần cùng key
      if (p.categoryIds && p.categoryIds.length) {
        p.categoryIds.forEach(cid => fd.append('categoryIds', cid))
      }

      await createProduct(fd)
      toaster.create({ type:'success', description:'Add product successful!' })
      nav('/seller/products')
    } catch (e) {
      toaster.create({ type:'error', description: e?.response?.data?.message || 'Error while adding product!' })
    }
  }

  return (
    <Box bg="white" borderRadius="lg" p={6} border="1px solid #eee" maxW="980px" mx="auto">
      <Heading size="md" mb={5}>Add new product</Heading>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
        {/* Cột trái: Ảnh */}
        <GridItem>
          <Stack spacing={4}>
            <Field.Root>
              <Field.Label>Product Image</Field.Label>
              <Box position="relative" maxW="360px" >
                {/* <AspectRatio ratio={1} maxW="360px" borderRadius="md" overflow="hidden" bg="gray.50"> */}
                  <Image
                    src={import.meta.env.VITE_API_URL + "/uploads/" + previewUrl || 'https://via.placeholder.com/600x600?text=Product'}
                    alt={'Product Image'}
                    objectFit="cover"
                    borderRadius={"lg"}
                  />
                {/* </AspectRatio> */}
                  <Box
                    position="absolute"
                    top="0"
                    left="0"
                    right="0"
                    bottom="0"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    bg="blackAlpha.500"
                    borderRadius={"lg"}
                    opacity={0}
                    _hover={{ opacity: 1 }}
                    transition="opacity 0.2s"
                  >
                    <IconButton
                      size="lg"
                      variant="solid"
                      colorScheme="blue"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Chỉnh sửa ảnh"
                    >
                      <Icon as={FiEdit} />
                    </IconButton>
                  </Box>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    display="none"
                    ref={fileInputRef}
                  />

              </Box>
              <HStack mt={3} spacing={3} align="center">
                <Badge variant="subtle" colorScheme="gray">PNG/JPG, &lt; 5MB</Badge>
              </HStack>
            </Field.Root>

              <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
                <Field.Root>
                  <Field.Label>Brand</Field.Label>
                  <Input
                    placeholder="Nike, Apple..."
                    value={p?.brand || ''}
                    onChange={e => setP({ ...p, brand: e.target.value })}
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label>SKU</Field.Label>
                  <Input
                    placeholder="Mã sản phẩm nội bộ"
                    value={p?.sku || ''}
                    onChange={e => setP({ ...p, sku: e.target.value })}
                  />
                </Field.Root>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
                <Field.Root>
                  <Field.Label>Loại (type)</Field.Label>
                  <NumberInput.Root
                    value={p?.type || ''}
                    onValueChange={(details) => setP({ ...p, type: details.valueAsNumber })}
                  >
                    <NumberInput.Input placeholder="VD: physical / digital"/>
                  </NumberInput.Root>
                </Field.Root>

                <Field.Root>
                  <Field.Label>Trạng thái (status)</Field.Label>
                  <Select.Root
                    collection={states}
                    value={ p?.status || '' }
                    // onValueChange = {e => setP({ ...p, status: e.target.value })}
                    onValueChange = {(details) => setP({ ...p, status: details.value })}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder="Select state" />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>

                    <Portal>
                      <Select.Positioner>
                        <Select.Content>
                          {states.items.map((state) => (
                            <Select.Item item={state} key={state.value}>
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



          </Stack>
        </GridItem>

        {/* Cột phải: Thông tin chi tiết */}
        <GridItem>
          <Stack spacing={4} Separator={<Separator />}>
            <Stack spacing={4}>
              <Field.Root>
                <Field.Label>Tên sản phẩm</Field.Label>
                <Input
                  placeholder="Tên"
                  value={ p?.name || '' }
                  onChange={e => setP({ ...p, name: e.target.value })}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>Mô tả</Field.Label>
                <Textarea
                  placeholder="Mô tả chi tiết"
                  value={ p?.description || '' }
                  onChange={e => setP({ ...p, description: e.target.value })}
                  rows={5}
                />
              </Field.Root>

              <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
                <Field.Root>
                  <Field.Label>Price</Field.Label>
                  <NumberInput.Root
                    min={0}
                    value={p?.price || 0}
                    onValueChange={(details) => setP({ ...p, price: details.valueAsNumber })}
                  >
                    <NumberInput.Input placeholder="Giá (USD)"/>
                    <NumberInput.Control/>
                  </NumberInput.Root>
                </Field.Root>

                <Field.Root>
                  <Field.Label>Giá sau giảm (Optional)</Field.Label>
                  <NumberInput.Root
                    min={0}
                    value={p?.discountPrice || ''}
                    onValueChange={(details) => setP({ ...p, discountPrice: details.valueAsNumber })}
                  >
                    <NumberInput.Input placeholder="Giá giảm (USD)"/>
                    <NumberInput.Control></NumberInput.Control>
                  </NumberInput.Root>
                </Field.Root>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
                <Field.Root>
                  <Field.Label>Tồn kho</Field.Label>
                  <NumberInput.Root
                    min={0}
                    value={p?.quantity || 0}
                    onValueChange={(details) => setP({ ...p, quantity: details.valueAsNumber })}
                  >
                    <NumberInput.Input placeholder="Số lượng"/>
                    <NumberInput.Control></NumberInput.Control>
                  </NumberInput.Root>
                </Field.Root>

                <Field.Root>
                  <Field.Label>Weight (kg)</Field.Label>
                  <NumberInput.Root
                    min={0}
                    value={p?.weight || ''}
                    precision={2}
                    onValueChange={(details) => setP({ ...p, weight: details.valueAsNumber })}
                  >
                    <NumberInput.Input placeholder="VD: 0.5"/>
                    <NumberInput.Control></NumberInput.Control>
                  </NumberInput.Root>
                </Field.Root>
              </SimpleGrid>

              <Field.Root>
                <Field.Label>Dimensions (Dài x Rộng x Cao)</Field.Label>
                <Input
                  placeholder="Kích thước (cm)"
                  onChange={e => setP({ ...p, dimensions: e.target.value })}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>Danh mục (categoryIds)</Field.Label>
                <Input
                  placeholder="Nhập ID, phân tách bằng dấu phẩy. VD: 1,2,3"
                  value={categoryIdsText}
                  onChange={e => setCategoryIdsText(e.target.value)}
                />
                <Text mt={1} fontSize="sm" color="gray.500">
                  Mẹo: Bạn cũng có thể dùng component chọn nhiều danh mục và lưu thành mảng ID.
                </Text>
              </Field.Root>

              <Field.Root display="flex" alignItems="center">
                <Field.Label mb="0">Gắn nhãn nổi bật (isFeatured)</Field.Label>
                  <Switch.Root id="is-featured" onCheckedChange={(details) => setP({ ...p, isFeatured: details.checked })}>
                      <Switch.HiddenInput />
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                  </Switch.Root>
              </Field.Root>
            </Stack>
          </Stack>
        </GridItem>
      </SimpleGrid>

      <Flex mt={6} gap={3} justify="flex-end">
        <Button variant="outline" onClick={() => history.back()}>Hủy</Button>
        <Button onClick={save}>Lưu</Button>
      </Flex>
    </Box>
  )
}
