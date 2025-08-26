import { Box, Container } from '@chakra-ui/react'
import { Outlet } from 'react-router-dom'
import Header from './Header'

export default function Layout() {
  return (
    <Box minH="100vh" >
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
