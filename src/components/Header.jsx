import { Badge, Box, Text as ChakraText, Flex, Heading, Icon, IconButton, Input, InputGroup, Menu, Portal, Separator } from '@chakra-ui/react'
import { useRef, useState } from 'react'
import { FiBell, FiLogOut, FiMessageSquare, FiPackage, FiSearch, FiShoppingBag, FiShoppingCart, FiUser } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Header() {
  const nav = useNavigate()
  const { token, logout, user } = useAuth()
  const { cartCount } = useCart()

  // ---- hover menu (có delay) ----
  const [menuOpen, setMenuOpen] = useState(false)
  const timerRef = useRef(null)
  const enter = () => { clearTimeout(timerRef.current); timerRef.current = setTimeout(() => setMenuOpen(true), 60) }
  const leave = () => { clearTimeout(timerRef.current); timerRef.current = setTimeout(() => setMenuOpen(false), 120) }

  const isSellerOrAdmin = location.pathname.startsWith("/seller") || location.pathname.startsWith("/admin")
  const isLandingPage = location.pathname === "/"

  // Hide header on landing page - carousel will have its own
  if (isLandingPage) return null
  console.log(isSellerOrAdmin)
  return (
    <Box 
      as="header" 
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={1000}
      className="glass" 
      bg={isSellerOrAdmin ? "gray.900" : "white"} 
      color={isSellerOrAdmin ? "white" : "gray.900"}
      borderBottom="1px solid"
      borderColor={isSellerOrAdmin ? "gray.800" : "gray.200"}
      backdropFilter="blur(10px)"
      bgColor={isSellerOrAdmin ? "gray.900" : "rgba(255, 255, 255, 0.95)"}
    >
      <Box maxW="7xl" mx="auto" py={3} px={4}>
        <Flex align="center" gap={4} justify="space-between">
          <Heading size="2xl" fontWeight="black">
            <Link to="/">mini<ChakraText as="span" color='brand.500'>Shopee</ChakraText></Link>
          </Heading>

          <InputGroup
            maxW="600px"
            flex={1}
            startElement={<Icon as={FiSearch} aria-hidden="true" color="gray.500" boxSize="5" />}
          >
            <Input
              placeholder="Search for product, category…"
              bg="white"
              onKeyDown={(e) => {
                if (e.key === 'Enter') nav(`/?q=${encodeURIComponent(e.target.value || '')}`)
              }}
            />
          </InputGroup>

          <Flex align="center" gap={4}>
            {/* Chat */}
            <IconButton
              aria-label="Chat"
              color={isSellerOrAdmin ? "white" : "gray.900"}
              bg={isSellerOrAdmin ? "gray.900" : "white"}
              _hover={{ color: isSellerOrAdmin ? "gray.900" : "white", bg: isSellerOrAdmin ? "white" : "gray.900" }}
              fontSize="20px"
              icon={<Icon as={FiMessageSquare} />}
              onClick={() => nav('/chat')}
            >
              <Icon as={FiMessageSquare} />
            </IconButton>

            {/* Notifications + badge */}
            <Box position="relative">
              <IconButton
                aria-label="Notifications"
                color={isSellerOrAdmin ? "white" : "gray.900"}
                bg={isSellerOrAdmin ? "gray.900" : "white"}
                _hover={{ color: isSellerOrAdmin ? "gray.900" : "white", bg: isSellerOrAdmin ? "white" : "gray.900" }}
                fontSize="20px"
                icon={<Icon as={FiBell} />}
                onClick={() => nav('/notifications')}
              >
                <Icon as={FiBell} />
              </IconButton>
              <Badge
                position="absolute"
                top="0.08em"
                right="0.4em"
                borderRadius="full"
                px="0.5em"
                fontSize="0.6em"
                fontWeight={900}
                colorPalette="red"
              >
                9
              </Badge>
            </Box>

            {/* Cart + badge */}
            <Box position="relative">
              <IconButton
                aria-label="Cart"
                color={isSellerOrAdmin ? "white" : "gray.900"}
                bg={isSellerOrAdmin ? "gray.900" : "white"}
                _hover={{ color: isSellerOrAdmin ? "gray.900" : "white", bg: isSellerOrAdmin ? "white" : "gray.900" }}
                fontSize="20px"
                onClick={() => nav('/cart')}
              >
                <Icon as={FiShoppingCart} />
              </IconButton>
              {cartCount > 0 && (
                <Badge
                  position="absolute"
                  top="0.08em"
                  right="0.2em"
                  borderRadius="full"
                  px="0.5em"
                  fontSize="0.6em"
                  fontWeight={900}
                  colorPalette="red"
                >
                  {cartCount}
                </Badge>
              )}
            </Box>

            {/* User menu (hover + click) */}
            {token ? (
              <Menu.Root
                open={menuOpen}
                onOpenChange={(e) => setMenuOpen(e.open)}
                lazyMount={false}
                unmountOnExit={false}
                positioning={{ placement: 'bottom-end' }}
              >
                <Menu.Trigger asChild onPointerEnter={enter} onPointerLeave={leave}>
                  <IconButton
                    aria-label="User"
                    color={isSellerOrAdmin ? "white" : "gray.900"}
                    bg={isSellerOrAdmin ? "gray.900" : "white"}
                    outline="none"
                    _hover={{ color: isSellerOrAdmin ? "gray.900" : "white", bg: isSellerOrAdmin ? "white" : "gray.900" }}
                    fontSize="20px"
                  >
                    <Icon as={FiUser} />
                  </IconButton>
                </Menu.Trigger>

                <Portal>
                  <Menu.Positioner onPointerEnter={enter} onPointerLeave={leave}>
                    <Menu.Content
                      bg="white"
                      border="1px solid"
                      borderColor="gray.200"
                      rounded="l3"
                      shadow="lg"
                      minW="220px"
                      py="2"
                    >
                      <Box px="3" pb="2">
                        <ChakraText fontSize="sm" color="gray.500">Tài khoản</ChakraText>
                      </Box>

                      <Menu.Item
                        value="info"
                        onClick={() => nav('/account')}
                        display="flex" alignItems="center" gap="3" px="3" py="2"
                        _hover={{ bg: 'gray.50', cursor: 'pointer' }}
                      >
                        <Icon as={FiUser} />
                        <ChakraText>My Info</ChakraText>
                      </Menu.Item>

                    <Menu.Item
                      value="orders"
                      onClick={() => nav('/orders')}
                      display="flex" alignItems="center" gap="3" px="3" py="2"
                      _hover={{ bg: 'gray.50', cursor: 'pointer' }}
                    >
                      <Icon as={FiShoppingBag} />
                      <ChakraText>My Orders</ChakraText>
                    </Menu.Item>

                    {user?.role?.includes('ROLE_ADMIN') && (
                      <Menu.Item
                        value="seller"
                        onClick={() => nav('/seller')}
                        display="flex" alignItems="center" gap="3" px="3" py="2"
                        _hover={{ bg: 'gray.50', cursor: 'pointer' }}
                      >
                        <Icon as={FiPackage} />
                        <ChakraText>Seller Center</ChakraText>
                      </Menu.Item>
                    )}

                      {user?.role?.includes('ROLE_ADMIN') && (
                        <Menu.Item
                          value="admin"
                          onClick={() => nav('/admin')}
                          display="flex" alignItems="center" gap="3" px="3" py="2"
                          _hover={{ bg: 'gray.50', cursor: 'pointer' }}
                        >
                          <Icon as={FiPackage} />
                          <ChakraText>Admin Center</ChakraText>
                        </Menu.Item>
                      )}

                      <Separator my="2" />

                      <Menu.Item
                        value="logout"
                        onClick={logout}
                        display="flex" alignItems="center" gap="3" px="3" py="2"
                        color="red.600"
                        _hover={{ bg: 'red.50', cursor: 'pointer' }}
                      >
                        <Icon as={FiLogOut} />
                        <ChakraText>Logout</ChakraText>
                      </Menu.Item>
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu.Root>
            ) : (
              <IconButton
                aria-label="Login"
                variant="ghost"
                colorPalette="gray"
                fontSize="20px"
                onClick={() => nav('/login')}
              >
                <Icon as={FiUser} />
              </IconButton>
            )}
          </Flex>
        </Flex>
      </Box>
    </Box>
  )
}