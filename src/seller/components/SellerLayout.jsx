import { Box, Button, Flex, Text, VStack } from '@chakra-ui/react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

const NavItem = ({ to, children }) => {
  const loc = useLocation()
  const active = loc.pathname.startsWith(to)
  return (
    <Button
      as={NavLink}
      to={to}
      justifyContent="flex-start"
      w="full"
      px={12}
      py={6}
      borderRadius={0}
      outline={0}
      bg={active ? "gray.50" : "black"}
      color={active ? "black" : "white"}
      _hover={{ bg: "gray.50", color: "black" }}
    >
      {children}
    </Button>
  )
}

export default function SellerLayout() {
  return (
    <Flex minH="100vh" bg="gray.900">
      <Box w="260px" py={4} bg="gray.900" color="white">
        <Text fontWeight="bold" fontSize="lg" px={8} mb={2}>Seller Center</Text>
        <VStack align="stretch" gap={0}>
          <NavItem to="/seller/orders">Đơn hàng</NavItem>
          <NavItem to="/seller/products">Sản phẩm</NavItem>
          <NavItem to="/seller/inventory">Tồn kho</NavItem>
          <NavItem to="/seller/analytics">Thống kê</NavItem>
          <NavItem to="/seller/chat">Chat</NavItem>
        </VStack>
      </Box>
      <Box flex={1} py={6} px={10} bg="gray.50" rounded="xl">
        <Outlet />
      </Box>
    </Flex>
  )
}
