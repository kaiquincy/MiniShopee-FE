import { useState } from 'react'
import { Box, Heading, Text, Input, Button, VStack, Tooltip } from '@chakra-ui/react'
import { toaster } from '../../components/ui/toaster'

export default function AdminSettings() {
  const [storeName, setStoreName] = useState('')
  const [supportEmail, setSupportEmail] = useState('')

  const save = () => {
    // TODO: call /admin/settings
    toaster.create({ type:'success', description:'Đã lưu cài đặt (demo)' })
  }

  return (
    <Box>
      <Heading size="md" mb="12px">Settings</Heading>
      <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="md" p={4} maxW="520px">
        <VStack align="stretch" spacing="10px">
          <Box>
            <Text mb="6px" color="gray.600">Tên cửa hàng</Text>
            <Input value={storeName} onChange={e=>setStoreName(e.target.value)} placeholder="Ví dụ: MyShop Admin"/>
          </Box>
          <Box>
            <Text mb="6px" color="gray.600">Email hỗ trợ</Text>
            <Input value={supportEmail} onChange={e=>setSupportEmail(e.target.value)} placeholder="support@domain.com"/>
          </Box>
          <Tooltip content="Lưu thay đổi">
            <Button onClick={save} colorPalette="blue">Lưu</Button>
          </Tooltip>
        </VStack>
      </Box>
    </Box>
  )
}
