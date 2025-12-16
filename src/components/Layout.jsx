// Layout.jsx - With ThemeProvider wrapping everything

import { Box, Container, Flex, Text } from '@chakra-ui/react'
import { Outlet, useLocation } from 'react-router-dom'
import { ThemeProvider, useTheme } from '../context/ThemeContext'
import Header from './Header'

export default function Layout() {
  const location = useLocation()
  const isLandingPage = location.pathname === '/'
  
  return (
    <ThemeProvider>
      <LayoutContent isLandingPage={isLandingPage} />
    </ThemeProvider>
  )
}

function LayoutContent({ isLandingPage }) {
  const { theme } = useTheme()

  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      justifyContent="space-between" 
      position="relative" 
      minH="100vh" 
      pt={isLandingPage ? 0 : 16}
    >
      <Box>
        <Header />
        <Container py={0} px={0} mx={0} maxW="100vw" bg={theme.pageBg} position="relative">
          <Box
            position="absolute"
            top="0"
            left="0"
            right="0"
            bottom="0"
            pointerEvents="none"
            style={{
              background: theme.isLight
                ? 'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.12) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)'
                : 'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
            }}
          />

          {/* Floating glows */}
          <Box
            position="absolute"
            top="15%"
            right="10%"
            w="200px"
            h="200px"
            borderRadius="full"
            bg={theme.isLight ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.5)'}
            filter="blur(60px)"
            pointerEvents="none"
            animation="float 10s ease-in-out infinite"
          />
          <Outlet />
        </Container>
      </Box>
      
      {/* Footer */}
      <Box zIndex={1000} as="footer" bg="black" color="gray.300" py={10}>
        <Container maxW="7xl">
          <Flex
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align="center"
            gap={8}
          >
            {/* Logo + tagline */}
            <Box textAlign={{ base: "center", md: "left" }}>
              <Text fontSize="2xl" fontWeight="bold" color="white">
                mini<Text as="span" color="brand.500">Shopee</Text>
              </Text>
              <Text fontSize="md" color="gray.400">
                Shop smart. Live better.
              </Text>
            </Box>

            {/* Links */}
            <Flex
              wrap="wrap"
              justify={{ base: "center", md: "flex-end" }}
              gap={6}
            >
              <Text as="a" href="/about" _hover={{ color: "white" }}>
                About Us
              </Text>
              <Text as="a" href="/help" _hover={{ color: "white" }}>
                Help Center
              </Text>
              <Text as="a" href="/contact" _hover={{ color: "white" }}>
                Contact
              </Text>
              <Text as="a" href="/terms" _hover={{ color: "white" }}>
                Terms
              </Text>
            </Flex>
          </Flex>

          {/* Divider */}
          <Box borderTop="1px solid" borderColor="gray.700" mt={8} pt={6} textAlign="center">
            <Text fontSize="sm" color="gray.500">
              © {new Date().getFullYear()} <Text as="span" fontWeight="bold">miniShopee</Text> • Built with ♥
            </Text>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}