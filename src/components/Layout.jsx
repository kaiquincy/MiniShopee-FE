import { Box, Container, Flex, Text } from '@chakra-ui/react'
import { Outlet } from 'react-router-dom'
import Header from './Header'

export default function Layout() {
  return (
    <Box display="flex" flexDirection="column" justifyContent="space-between" position="relative" minH="100vh" >
      <Header />
      <Container maxW="7xl" py={6}>
        <Outlet />
      </Container>

      
      <Box as="footer" bg="gray.900" color="gray.300" py={10} mt={12}>
        <Container maxW="7xl">
          <Flex
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align={{ base: "center", md: "flex-start" }}
            gap={8}
          >
            {/* Logo + tagline */}
            <Box textAlign={{ base: "center", md: "left" }}>
              <Text fontSize="lg" fontWeight="bold" color="white">
                mini-Shopee
              </Text>
              <Text fontSize="sm" color="gray.400">
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
              © {new Date().getFullYear()} mini-Shopee • Built with ♥
            </Text>
          </Box>
        </Container>
      </Box>

    </Box>
  )
}
