// ✅ Gộp import Chakra v3 vào một chỗ
import {
  Box, HStack, VStack, Heading, Text, Button, Tooltip, Separator, Flex, Icon,
} from '@chakra-ui/react';
import { Outlet, NavLink } from 'react-router-dom';
import { FiLayout, FiUsers, FiPackage, FiClipboard, FiSettings } from 'react-icons/fi';

const NavItem = ({ to, icon, children }) => (
  <NavLink to={to} style={{ textDecoration: 'none' }}>
    {({ isActive }) => (
      <Tooltip content={children} openDelay={150}>
        <Button
          variant={isActive ? 'solid' : 'ghost'}  // ← string, không phải function
          size="md"
          leftIcon={<Icon as={icon} />}
          justifyContent="flex-start"
          w="full"
        >
          {children}
        </Button>
      </Tooltip>
    )}
  </NavLink>
);

export default function AdminLayout() {
  return (
    <Flex gap="16px" align="stretch">
      {/* Sidebar */}
      <Box w={{ base: '220px' }} bg="white" border="1px solid" borderColor="gray.100" borderRadius="md" p="12px">
        <VStack align="stretch" spacing="6px">
          <Heading size="sm" px="8px" py="6px">Admin Center</Heading>
          <Separator my="6px" />
          <NavItem to="/admin" icon={FiLayout}>Dashboard</NavItem>
          <NavItem to="/admin/orders" icon={FiClipboard}>Orders</NavItem>
          <NavItem to="/admin/users" icon={FiUsers}>Users</NavItem>
          <NavItem to="/admin/products" icon={FiPackage}>Products</NavItem>
          <NavItem to="/admin/settings" icon={FiSettings}>Settings</NavItem>
        </VStack>
      </Box>

      {/* Content */}
      <Box flex="1" minW={0}>
        <Outlet />
      </Box>
    </Flex>
  );
}
