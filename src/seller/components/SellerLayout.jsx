import { Box, Button, Flex, HStack, Icon, Text, VStack } from '@chakra-ui/react'
import { FiBarChart2, FiBox, FiMessageSquare, FiPackage, FiShoppingBag } from 'react-icons/fi'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'

const menuItems = [
  { to: '/seller/orders', label: 'Orders', icon: FiShoppingBag },
  { to: '/seller/products', label: 'Products', icon: FiBox },
  { to: '/seller/inventory', label: 'Inventory', icon: FiPackage },
  { to: '/seller/analytics', label: 'Analytics', icon: FiBarChart2 },
  { to: '/seller/chat', label: 'Chat', icon: FiMessageSquare },
]

const NavItem = ({ to, children, icon }) => {
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
      color={active ? "black" : "whiteAlpha.700"}
      borderLeft="3px solid"
      borderColor={active ? "brand.500" : "transparent"}
      fontWeight={active ? "bold" : "normal"}
      _hover={{ 
        bg: active ? "white" : "whiteAlpha.100",
        color: active ? "black" : "white"
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

export default function SellerLayout() {
  const { theme } = useTheme()
  return (
    <Flex minH="100vh" bg={theme.pageBg} position="relative" overflow="hidden">
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        pointerEvents="none"
        zIndex={0}
        style={{
          background: theme.isLight
            ? 'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)'
            : 'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Floating glow - top right */}
      <Box
        position="fixed"
        top="10%"
        right="8%"
        w="280px"
        h="280px"
        borderRadius="full"
        bg={theme.isLight ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.4)'}
        filter="blur(80px)"
        pointerEvents="none"
        zIndex={0}
        animation="float 14s ease-in-out infinite"
      />
      
      {/* Sidebar */}
      <Box 
        w="280px" 
        bg={theme.sellerSidebarBg} 
        borderRight="1px solid"
        borderColor="whiteAlpha.200"
        position="fixed"
        h="100vh"
        overflowY="auto"
      >
        {/* Logo/Header */}
        <Box p={6} borderBottom="1px solid" borderColor="whiteAlpha.200">
          <Text fontWeight="black" fontSize="2xl" color="white">
            Seller <Text as="span" color="brand.500">Center</Text>
          </Text>
          <Text fontSize="sm" color="whiteAlpha.600" mt={1}>
            Manage your store
          </Text>
        </Box>

        {/* Navigation */}
        <VStack align="stretch" gap={1} p={4}>
          {menuItems.map((item) => (
            <NavItem key={item.to} to={item.to} icon={item.icon}>
              {item.label}
            </NavItem>
          ))}
        </VStack>
      </Box>

      {/* Main Content */}
      <Box flex={1} ml="280px" bg={theme.pageBg} minH="100vh">
        <Box maxW="1600px" mx="auto">
          <Outlet />
        </Box>
      </Box>
    </Flex>
  )
}