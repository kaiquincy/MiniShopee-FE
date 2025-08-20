import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Button, Flex } from '@chakra-ui/react'
import { Input } from '@chakra-ui/react/input'
import { Textarea } from '@chakra-ui/react/textarea'
import { NumberInput } from "@chakra-ui/react/number-input"

import { getProduct, updateProduct } from '../api/seller'
import { toaster } from '../../components/ui/toaster'

export default function SellerProductEdit() {
  const { id } = useParams()
  const nav = useNavigate()
  const [p, setP] = useState(null)

  useEffect(()=>{ getProduct(id).then(setP) }, [id])
  if (!p) return null

  const save = async () => {
    try {
      await updateProduct(id, {
        name: p.name, description: p.description,
        imageUrl: p.imageUrl, price: Number(p.price),
        quantity: Number(p.quantity), sku: p.sku, brand: p.brand
      })
      toaster.create({ type:'success', description:'Đã cập nhật' })
      nav('/seller/products')
    } catch (e) {
      toaster.create({ type:'error', description: e?.response?.data?.message || 'Lỗi cập nhật' })
    }
  }

  return (
    <Box bg="white" borderRadius="md" p={4} border="1px solid #eee" maxW="720px">
      <Flex gap={3} direction="column">
        <Input placeholder="Tên" value={p.name||''} onChange={e=>setP({...p, name:e.target.value})}/>
        <Textarea placeholder="Mô tả" value={p.description||''} onChange={e=>setP({...p, description:e.target.value})}/>
        <NumberInput.Root defaultValue={p.price||0} min={0} onValueChange={(_,v)=>setP({...p, price:v})}><NumberInput.Input placeholder="Giá"/></NumberInput.Root>
        <NumberInput.Root defaultValue={p.quantity||0} min={0} onValueChange={(_,v)=>setP({...p, quantity:v})}><NumberInput.Input placeholder="Tồn kho"/></NumberInput.Root>
        <Input placeholder="Ảnh" value={p.imageUrl||''} onChange={e=>setP({...p, imageUrl:e.target.value})}/>
        <Flex gap={3}>
          <Input placeholder="Brand" value={p.brand||''} onChange={e=>setP({...p, brand:e.target.value})}/>
          <Input placeholder="SKU" value={p.sku||''} onChange={e=>setP({...p, sku:e.target.value})}/>
        </Flex>
        <Flex gap={3} justify="flex-end">
          <Button variant="outline" onClick={()=>history.back()}>Hủy</Button>
          <Button onClick={save}>Lưu</Button>
        </Flex>
      </Flex>
    </Box>
  )
}
