import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Text,
  VStack
} from '@chakra-ui/react';
import { FiClipboard, FiLayout, FiPackage, FiSettings, FiShield, FiUsers, FiTag } from 'react-icons/fi';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const menuItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: FiLayout },
  { to: '/admin/orders', label: 'Orders', icon: FiClipboard },
  { to: '/admin/users', label: 'Users', icon: FiUsers },
  { to: '/admin/products', label: 'Products', icon: FiPackage },
  { to: '/admin/categories', label: 'Categories', icon: FiTag },
  { to: '/admin/settings', label: 'Settings', icon: FiSettings },
]

const NavItem = ({ to, children, icon, theme }) => {
  const loc = useLocation()
  const active = loc.pathname.startsWith(to)
  return (
    <Button
      as={NavLink}
      to={to}
      justifyContent="flex-start"
      w="full"
      h="auto"
      py={3}
      px={4}
      borderRadius="none"
      bg={active ? "white" : "transparent"}
      color={active ? "#1E3A8A" : "whiteAlpha.700"}
      borderLeft="3px solid"
      borderColor={active ? "#3B82F6" : "transparent"}
      fontWeight={active ? "bold" : "normal"}
      _hover={{ 
        bg: active ? "white" : "whiteAlpha.100",
        color: active ? "#1E3A8A" : "white"
      }}
      transition="all 0.2s"
    >
      <HStack spacing={3} w="full">
        <Icon as={icon} boxSize={5} />
        <Text>{children}</Text>
      </HStack>
    </Button>
  )
}

export default function AdminLayout() {
  const { theme } = useTheme()

  return (
    <Flex minH="100vh" bg="#1E3A8A">
      {/* Sidebar */}
      <Box 
        w="280px" 
        bg="#1E40AF"
        borderRight="1px solid"
        borderColor="whiteAlpha.200"
        position="fixed"
        h="100vh"
      >
        {/* Logo/Header */}
        <Box p={6} borderBottom="1px solid" borderColor="whiteAlpha.200">
          <HStack gap={3} mb={1}>
            <Box
              p={2}
              bg="#3B82F6"
              borderRadius="lg"
            >
              <Icon as={FiShield} boxSize={6} color="white" />
            </Box>
            <Text fontWeight="black" fontSize="2xl" color="white">
              Admin
            </Text>
          </HStack>
          <Text fontSize="sm" color="whiteAlpha.700" mt={1}>
            System Management
          </Text>
        </Box>

        {/* Navigation */}
        <VStack align="stretch" gap={1} p={4}>
          {menuItems.map((item) => (
            <NavItem key={item.to} to={item.to} icon={item.icon} theme={theme}>
              {item.label}
            </NavItem>
          ))}
        </VStack>
      </Box>

      {/* Main Content */}
      <Box flex={1} ml="280px" bg={theme.pageBg} minH="100vh">
        <Box maxW="1600px" mx="auto" p={8}>
          <Outlet />
        </Box>
      </Box>
    </Flex>
  )
}