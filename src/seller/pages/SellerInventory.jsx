import { Box, Button, Text } from '@chakra-ui/react'
import { NumberInput } from "@chakra-ui/react/number-input"
import { useEffect, useState } from 'react'

import { toaster } from '../../components/ui/toaster'
import { fetchProducts, updateProduct } from '../api/seller'

export default function SellerInventory() {
  const [items, setItems] = useState([])
  const load = async()=> {
    const res = await fetchProducts({ page:0, size:100 })
    setItems(res?.content || [])
  }
  useEffect(()=>{ load() }, [])

  const saveQty = async (p) => {
    await updateProduct(p.id, { quantity: Number(p.quantity) })
    toaster.create({ type:'success', description:'Đã cập nhật tồn kho' })
    load()
  }

  return (
    <Box>
      <Box bg="white" border="1px solid #eee" borderRadius="md">
        <Box display="grid" gridTemplateColumns="80px 1fr 180px 150px" py={2} px={4} borderBottom="1px solid #eee" fontWeight="bold">
          <Box>ID</Box><Box>Tên</Box><Box>Hiện có</Box><Box>Actions</Box>
        </Box>
        {items.map(p=>(
          <Box key={p.id} display="grid" gridTemplateColumns="80px 1fr 180px 150px" py={3} px={4} borderBottom="1px solid #f6f6f6" alignItems="center">
            <Box>#{p.id}</Box>
            <Box><Text noOfLines={1}>{p.name}</Text></Box>
            <Box>
              <NumberInput.Root defaultValue={p.quantity||0} min={0} width="70%"
                onValueChange={({ valueAsNumber }) => {
                setItems(prev =>
                  prev.map(x => x.id === p.id ? { ...x, quantity: valueAsNumber } : x)
                )
              }}
              >
                <NumberInput.Input/>
                <NumberInput.Control />
              </NumberInput.Root>
            </Box>
            <Box>
              <Button size="sm" onClick={()=>saveQty(p)}>Lưu</Button>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
