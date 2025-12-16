import { Box, Button, Heading, Icon, Input, Text, VStack } from '@chakra-ui/react'
import { useState } from 'react'
import { FiSave } from 'react-icons/fi'
import { toaster } from '../../components/ui/toaster'
import { useTheme } from '../../context/ThemeContext'

export default function AdminSettings() {
  const [storeName, setStoreName] = useState('')
  const [supportEmail, setSupportEmail] = useState('')
  const { theme } = useTheme()

  const save = () => {
    // TODO: call /admin/settings
    toaster.create({ type:'success', description:'Đã lưu cài đặt (demo)' })
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={8}>
        <Heading size="2xl" fontWeight="black" color={theme.text}>Settings</Heading>
        <Text color={theme.textSecondary}>Manage your store configuration</Text>
      </Box>

      {/* Settings Card */}
      <Box 
        bg={theme.cardBg} 
        border="1px solid" 
        borderColor={theme.border}
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
              color={theme.text} 
              fontWeight="semibold"
              fontSize="md"
            >
              Store Name
            </Text>
            <Input 
              value={storeName} 
              onChange={e => setStoreName(e.target.value)} 
              placeholder="e.g., MyShop Admin"
              size="lg"
              borderColor={theme.borderInput}
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
              color={theme.text}
              fontWeight="semibold"
              fontSize="md"
            >
              Support Email
            </Text>
            <Input 
              value={supportEmail} 
              onChange={e => setSupportEmail(e.target.value)} 
              placeholder="support@domain.com"
              type="email"
              size="lg"
              borderColor={theme.borderInput}
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
              bg={theme.buttonBg}
              color="white"
              size="lg"
              w="full"
              _hover={{ bg: theme.buttonHoverBg }}
              leftIcon={<Icon as={FiSave} />}
              fontWeight="semibold"
            >
              Save settings
            </Button>
          </Box>
        </VStack>
      </Box>
    </Box>
  )
}