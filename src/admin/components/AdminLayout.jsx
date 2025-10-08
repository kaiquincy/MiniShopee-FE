// ✅ Gộp import Chakra v3 vào một chỗ
import {
  Box,
  Button,
  Flex,
  Heading,
  VStack
} from '@chakra-ui/react';
import { FiClipboard, FiLayout, FiPackage, FiSettings, FiUsers } from 'react-icons/fi';
import { NavLink, Outlet, useLocation } from 'react-router-dom';


const NavItem = ({ to, icon, children }) => {
  const loc = useLocation()
  const active = loc.pathname.startsWith(to)
  return (
    <Button as={NavLink}
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

export default function AdminLayout() {
  return (
    <Flex minH="100vh" bg="gray.900">
      {/* Sidebar */}
      <Box w="260px" bg="gray.900" py={4} color="white">
        <VStack align="stretch" gap={0}>
          <Heading fontWeight="bold" size="lg" px={8} mb={2}>Admin Center</Heading>
          <NavItem to="/admin/dashboard" icon={FiLayout}>Dashboard</NavItem>
          <NavItem to="/admin/orders" icon={FiClipboard}>Orders</NavItem>
          <NavItem to="/admin/users" icon={FiUsers}>Users</NavItem>
          <NavItem to="/admin/products" icon={FiPackage}>Products</NavItem>
          <NavItem to="/admin/settings" icon={FiSettings}>Settings</NavItem>
        </VStack>
      </Box>

      {/* Content */}
      <Box flex={1} py={6} px={10} bg="gray.50" rounded="xl">
        <Outlet />
      </Box>
    </Flex>
  );
}
