import { Outlet, Link, useNavigate } from 'react-router-dom'
import { Box, Container, Flex } from '@chakra-ui/react'
import Header from './Header'

export default function Layout() {
  return (
    <Box minH="100vh">
      <Header />
      <Container maxW="7xl" py={6}>
        <Outlet />
      </Container>
      <Box as="footer" py={10} textAlign="center" color="gray.500">
        Mini‑Shopee • Built with ♥
      </Box>
    </Box>
  )
}
