import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Box, Flex, VStack, HStack, Button, Text } from '@chakra-ui/react'

const NavItem = ({ to, children }) => {
  const loc = useLocation()
  const active = loc.pathname.startsWith(to)
  return (
    <Button as={NavLink} to={to} justifyContent="flex-start"
            variant={active ? 'solid' : 'ghost'} w="full">
      {children}
    </Button>
  )
}

export default function SellerLayout() {
  return (
    <Flex minH="100vh">
      <Box w="260px" p={4} borderRight="1px solid #eee" bg="white">
        <Text fontWeight="bold" mb={2}>Seller Center</Text>
        <VStack align="stretch" spacing={1}>
          <NavItem to="/seller/orders">Đơn hàng</NavItem>
          <NavItem to="/seller/products">Sản phẩm</NavItem>
          <NavItem to="/seller/inventory">Tồn kho</NavItem>
          <NavItem to="/seller/analytics">Thống kê</NavItem>
          <NavItem to="/seller/chat">Chat</NavItem>
        </VStack>
      </Box>
      <Box flex={1} p={6} bg="gray.50">
        <Outlet />
      </Box>
    </Flex>
  )
}
