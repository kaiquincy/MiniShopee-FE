import { Box, Button, Heading, HStack, Icon, Input, Separator, Text, VStack } from '@chakra-ui/react'
import { useState } from 'react'
import { LuLock, LuMail, LuShoppingBag, LuUser } from 'react-icons/lu'
import { Link, useNavigate } from 'react-router-dom'
import { toaster } from '../components/ui/toaster'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Register() {
  const { theme } = useTheme()
  const [username, setU] = useState('')
  const [email, setE] = useState('')
  const [password, setP] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const nav = useNavigate()

  const handleRegister = async () => {
    if (!username || !email || !password) {
      toaster.create({ 
        title: 'Missing fields', 
        description: 'Please fill in all fields',
        status: 'warning' 
      })
      return
    }

    if (password.length < 6) {
      toaster.create({ 
        title: 'Weak password', 
        description: 'Password must be at least 6 characters',
        status: 'warning' 
      })
      return
    }

    setLoading(true)
    try {
      await register({ username, email, password })
      toaster.create({ 
        title: 'Account created!', 
        description: 'Please sign in with your new account',
        status: 'success' 
      })
      nav('/login')
    } catch (e) {
      toaster.create({ 
        title: 'Registration failed', 
        description: e.message || 'Username or email already exists',
        status: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box 
      minH="100vh" 
      bg={theme.pageBg}
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={4}
      py={8}
    >
      <Box 
        maxW="440px" 
        w="full"
        bg={theme.cardBg}
        border="1px solid"
        borderColor={theme.border}
        borderRadius="2xl"
        boxShadow="xl"
        overflow="hidden"
      >
        {/* Header */}
        <Box 
          bg={theme.isLight ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : 'linear-gradient(135deg, #9f7aea 0%, #d53f8c 100%)'}
          py={8}
          px={6}
          textAlign="center"
        >
          <HStack justify="center" mb={3}>
            <Icon as={LuShoppingBag} boxSize={8} color="white" />
          </HStack>
          <Heading size="xl" color="white" fontWeight="black" mb={2}>
            Create Account
          </Heading>
          <Text color="whiteAlpha.900" fontSize="sm">
            Join us and start shopping today
          </Text>
        </Box>

        {/* Form */}
        <Box p={8}>
          <VStack spacing={5}>
            {/* Username Field */}
            <Box w="full">
              <Text fontSize="sm" fontWeight="medium" color={theme.textSecondary} mb={2}>
                Username
              </Text>
              <HStack
                bg={theme.inputBg}
                border="1px solid"
                borderColor={theme.border}
                borderRadius="lg"
                px={4}
                py={1}
                _focusWithin={{
                  borderColor: theme.accent,
                  boxShadow: `0 0 0 3px ${theme.isLight ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.2)'}`
                }}
                transition="all 0.2s"
              >
                <Icon as={LuUser} color={theme.textMuted} boxSize={5} />
                <Input
                  placeholder="Choose a username"
                  value={username}
                  onChange={e => setU(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRegister()}
                  variant="unstyled"
                  color={theme.text}
                  _placeholder={{ color: theme.textPlaceholder }}
                />
              </HStack>
            </Box>

            {/* Email Field */}
            <Box w="full">
              <Text fontSize="sm" fontWeight="medium" color={theme.textSecondary} mb={2}>
                Email
              </Text>
              <HStack
                bg={theme.inputBg}
                border="1px solid"
                borderColor={theme.border}
                borderRadius="lg"
                px={4}
                py={1}
                _focusWithin={{
                  borderColor: theme.accent,
                  boxShadow: `0 0 0 3px ${theme.isLight ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.2)'}`
                }}
                transition="all 0.2s"
              >
                <Icon as={LuMail} color={theme.textMuted} boxSize={5} />
                <Input
                  placeholder="Enter your email"
                  type="email"
                  value={email}
                  onChange={e => setE(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRegister()}
                  variant="unstyled"
                  color={theme.text}
                  _placeholder={{ color: theme.textPlaceholder }}
                />
              </HStack>
            </Box>

            {/* Password Field */}
            <Box w="full">
              <Text fontSize="sm" fontWeight="medium" color={theme.textSecondary} mb={2}>
                Password
              </Text>
              <HStack
                bg={theme.inputBg}
                border="1px solid"
                borderColor={theme.border}
                borderRadius="lg"
                px={4}
                py={1}
                _focusWithin={{
                  borderColor: theme.accent,
                  boxShadow: `0 0 0 3px ${theme.isLight ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.2)'}`
                }}
                transition="all 0.2s"
              >
                <Icon as={LuLock} color={theme.textMuted} boxSize={5} />
                <Input
                  placeholder="Create a password (6+ characters)"
                  type="password"
                  value={password}
                  onChange={e => setP(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRegister()}
                  variant="unstyled"
                  color={theme.text}
                  _placeholder={{ color: theme.textPlaceholder }}
                />
              </HStack>
            </Box>

            {/* Register Button */}
            <Button
              w="full"
              size="lg"
              bg={theme.buttonBg}
              color={theme.buttonColor}
              _hover={{ bg: theme.primaryHover, transform: 'scale(1.02)' }}
              _active={{ transform: 'scale(1)' }}
              onClick={handleRegister}
              loading={loading}
              loadingText="Creating account..."
              mt={2}
              borderRadius="lg"
              fontWeight="semibold"
              boxShadow="md"
              transition="all 0.2s"
            >
              Create Account
            </Button>

            {/* Divider */}
            <HStack w="full" my={2}>
              <Separator flex={1} borderColor={theme.border} />
              <Text fontSize="xs" color={theme.textMuted} px={2}>OR</Text>
              <Separator flex={1} borderColor={theme.border} />
            </HStack>

            {/* Login Link */}
            <Box 
              w="full" 
              textAlign="center" 
              p={4} 
              bg={theme.secondaryBg} 
              borderRadius="lg"
              border="1px solid"
              borderColor={theme.border}
            >
              <Text fontSize="sm" color={theme.textSecondary}>
                Already have an account?{' '}
                <Text
                  as={Link}
                  to="/login"
                  color={theme.accent}
                  fontWeight="semibold"
                  _hover={{ textDecoration: 'underline' }}
                >
                  Sign in here
                </Text>
              </Text>
            </Box>
          </VStack>
        </Box>
      </Box>
    </Box>
  )
}