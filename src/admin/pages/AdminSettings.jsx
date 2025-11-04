import { Box, Button, Heading, HStack, Icon, Input, Text, VStack } from '@chakra-ui/react'
import { useState } from 'react'
import { FiSave, FiSettings } from 'react-icons/fi'
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
      {/* Header */}
      <Box mb={8}>
        <HStack spacing={3} mb={2}>
          <Box p={2} bg="#3B82F615" borderRadius="lg">
            <Icon as={FiSettings} boxSize={6} color="#3B82F6" />
          </Box>
          <Heading size="2xl" fontWeight="black" color="#1E3A8A">Settings</Heading>
        </HStack>
        <Text color="#64748B">Manage your store configuration</Text>
      </Box>

      {/* Settings Card */}
      <Box 
        bg="white" 
        border="1px solid" 
        borderColor="#E2E8F0" 
        borderRadius="lg" 
        p={8} 
        maxW="600px"
        shadow="sm"
      >
        <VStack align="stretch" spacing={6}>
          {/* Store Name */}
          <Box>
            <Text 
              mb={2} 
              color="#1E293B" 
              fontWeight="semibold"
              fontSize="sm"
            >
              Tên cửa hàng
            </Text>
            <Input 
              value={storeName} 
              onChange={e => setStoreName(e.target.value)} 
              placeholder="Ví dụ: MyShop Admin"
              size="lg"
              borderColor="#E2E8F0"
              _hover={{ borderColor: "#3B82F6" }}
              _focus={{ 
                borderColor: "#3B82F6", 
                boxShadow: "0 0 0 1px #3B82F6" 
              }}
            />
          </Box>

          {/* Support Email */}
          <Box>
            <Text 
              mb={2} 
              color="#1E293B" 
              fontWeight="semibold"
              fontSize="sm"
            >
              Email hỗ trợ
            </Text>
            <Input 
              value={supportEmail} 
              onChange={e => setSupportEmail(e.target.value)} 
              placeholder="support@domain.com"
              type="email"
              size="lg"
              borderColor="#E2E8F0"
              _hover={{ borderColor: "#3B82F6" }}
              _focus={{ 
                borderColor: "#3B82F6", 
                boxShadow: "0 0 0 1px #3B82F6" 
              }}
            />
          </Box>

          {/* Save Button */}
          <Box pt={2}>
            <Button 
              onClick={save} 
              bg="#3B82F6"
              color="white"
              size="lg"
              w="full"
              _hover={{ bg: "#2563EB" }}
              leftIcon={<Icon as={FiSave} />}
              fontWeight="semibold"
            >
              Lưu cài đặt
            </Button>
          </Box>
        </VStack>
      </Box>
    </Box>
  )
}