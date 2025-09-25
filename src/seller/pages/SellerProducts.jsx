import { Box, Button, Flex, Image, Input, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toaster } from '../../components/ui/toaster'
import { deleteProduct, fetchProducts } from '../api/seller'

export default function SellerProducts() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState([])
  const nav = useNavigate()

  const load = async() => {
    const res = await fetchProducts({ name: q || undefined, page:0, size:50 })
    setItems(res?.content || [])
  }
  useEffect(()=>{ load() }, [])

  const del = async (id) => {
    await deleteProduct(id)
    toaster.create({ type:'success', description:'Đã xoá sản phẩm' })
    load()
  }

  return (
    <Box>
      <Flex justify="space-between" mb={3} gap={3}>
        <Flex gap={2}>
          <Input placeholder="Tìm tên sản phẩm…" value={q} onChange={e=>setQ(e.target.value)} w="300px" />
          <Button onClick={load}>Tìm</Button>
        </Flex>
        <Button onClick={()=>nav('/seller/products/new')}>+ Thêm sản phẩm</Button>
      </Flex>

      <Box bg="white" border="1px solid #eee" borderRadius="md">
        <Box display="grid" gridTemplateColumns="80px 1fr 200px 140px 180px" py={2} px={4} borderBottom="1px solid #eee" fontWeight="bold">
          <Box>ID</Box><Box>Tên</Box><Box></Box><Box>Giá</Box><Box textAlign="center">Actions</Box>
        </Box>
        {items.map(p=>(
          <Box key={p.id} display="grid" gridTemplateColumns="80px 1fr 200px 140px 180px" py={4} px={4} borderBottom="1px solid #f6f6f6">
            <Box>#{p.id}</Box>
            <Box>
              <Text noOfLines={1} fontWeight="semibold">{p.name}</Text>
              <Text fontSize="sm" color="gray.500" noOfLines={1}>{p.description}</Text>
            </Box>
            <Box>
              <Image width="80px" height="80px" src={import.meta.env.VITE_API_URL + "/uploads/" + p.imageUrl || 'https://via.placeholder.com/200x200?text=Product'} alt={p.name} borderRadius="md" />
            </Box>
            <Box fontWeight="bold" color="brand.700">{(p.price||0).toLocaleString()} ₫</Box>
            <Flex gap={2} justify="center">
              <Button size="sm" onClick={()=>nav(`/seller/products/${p.id}/edit`)}>Sửa</Button>
              <Button size="sm" variant="outline" onClick={()=>del(p.id)}>Xoá</Button>
            </Flex>
          </Box>
        ))}
        {items.length===0 && <Box p={6} textAlign="center" color="gray.500">Chưa có sản phẩm</Box>}
      </Box>
    </Box>
  )
}
