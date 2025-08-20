import { useState } from 'react'
import { Box, Button, Flex } from '@chakra-ui/react'
import { Input } from '@chakra-ui/react/input'
import { Textarea } from '@chakra-ui/react/textarea'
import { NumberInput } from "@chakra-ui/react/number-input"


import { createProduct } from '../api/seller'
import { toaster } from '../../components/ui/toaster'
import { useNavigate } from 'react-router-dom'

console.log("flex is {}", Flex)

export default function SellerProductNew() {
  const [name, setName] = useState('')
  const [description, setDesc] = useState('')
  const [price, setPrice] = useState(0)
  const [quantity, setQty] = useState(0)
  const [imageUrl, setImage] = useState('')
  const [brand, setBrand] = useState('')
  const [sku, setSku] = useState('')
  const [sellerId, setSellerId] = useState('') // nếu backend cần sellerId tường minh
  const [categoryIds, setCategoryIds] = useState('') // "1,2,3"
  const nav = useNavigate()

  const save = async () => {
    const payload = {
      name, description, imageUrl,
      price: Number(price), quantity: Number(quantity),
      sku, brand,
      sellerId: sellerId ? Number(sellerId) : undefined,
      categoryIds: categoryIds ? categoryIds.split(',').map(x=>Number(x.trim())).filter(Boolean) : []
    }
    try {
      await createProduct(payload)
      toaster.create({ type:'success', description:'Đã tạo sản phẩm' })
      nav('/seller/products')
    } catch (e) {
      toaster.create({ type:'error', description: e?.response?.data?.message || 'Lỗi tạo sản phẩm' })
    }
  }

  return (
    <Box bg="white" borderRadius="md" p={4} border="1px solid #eee" maxW="720px">
      <Flex gap={3} direction="column">
        <Input placeholder="Tên sản phẩm" value={name} onChange={e=>setName(e.target.value)}/>
        <Textarea placeholder="Mô tả" value={description} onChange={e=>setDesc(e.target.value)}/>
        <NumberInput.Root value={price} min={0} onChange={(_,v)=>setPrice(v)}><NumberInput.Input placeholder="Giá (VND)"/></NumberInput.Root>
        <NumberInput.Root value={quantity} min={0} onChange={(_,v)=>setQty(v)}><NumberInput.Input placeholder="Tồn kho"/></NumberInput.Root>
        <Input placeholder="Ảnh (URL)" value={imageUrl} onChange={e=>setImage(e.target.value)}/>
        <Flex gap={3}>
          <Input placeholder="Brand" value={brand} onChange={e=>setBrand(e.target.value)}/>
          <Input placeholder="SKU" value={sku} onChange={e=>setSku(e.target.value)}/>
        </Flex>
        {/* <Input placeholder="Seller ID (tùy backend)" value={sellerId} onChange={e=>setSellerId(e.target.value)}/> */}
        <Input placeholder="Category IDs (vd: 1,2)" value={categoryIds} onChange={e=>setCategoryIds(e.target.value)} />
        <Flex gap={3} justify="flex-end">
          <Button variant="outline" onClick={()=>history.back()}>Hủy</Button>
          <Button onClick={save}>Lưu</Button>
        </Flex>
      </Flex>
    </Box>
  )
}
