import { Badge, Box, Button, Text as ChakraText, Flex, Heading, HStack, Icon, IconButton, Input, InputGroup, Menu, Portal, Separator, VStack } from '@chakra-ui/react'
import { useEffect, useRef, useState } from 'react'
import { FiBell, FiLogOut, FiMessageSquare, FiPackage, FiSearch, FiSettings, FiShield, FiShoppingBag, FiShoppingCart, FiStar, FiTag, FiUser } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import { markRead, myNotifications, unreadCount } from '../api/notifications'
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

  // Notification states
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [notifMenuOpen, setNotifMenuOpen] = useState(false)
  const notifTimerRef = useRef(null)
  const notifEnter = () => { clearTimeout(notifTimerRef.current); notifTimerRef.current = setTimeout(() => setNotifMenuOpen(true), 60) }
  const notifLeave = () => { clearTimeout(notifTimerRef.current); notifTimerRef.current = setTimeout(() => setNotifMenuOpen(false), 120) }

  const isSellerOrAdmin = location.pathname.startsWith("/seller") || location.pathname.startsWith("/admin")
  const isLandingPage = location.pathname === "/"

  const loadNotifications = async () => {
      try {
        const notifs = await myNotifications()
        setNotifications(notifs.slice(0, 5)) // Preview top 5
        const unreadCnt = await unreadCount()
        setUnread(unreadCnt)
      } catch (e) {
        console.error('Failed to load notifications:', e)
      }
    }

  useEffect(() => {
      loadNotifications()
    }, [])

  const handleNotifClick = async (n) => {
      if (!n.read) {
        await markRead(n.id)
        setUnread(prev => Math.max(0, prev - 1))
      }
      nav('/notifications')
    }

  // Phân loại thông báo cho icon và badge
  const getTypeIcon = (type) => {
    const icons = {
      ORDER_UPDATED: FiPackage,
      promotion: FiTag,
      SYSTEM: FiSettings,
      review: FiStar,
      default: FiBell
    }
    const IconComponent = icons[type] || icons.default
    const colors = {
      ORDER_UPDATED: 'blue.500',
      promotion: 'green.500',
      SYSTEM: 'yellow.500',
      review: 'purple.500',
      default: 'gray.500'
    }
    const color = colors[type] || colors.default
    return <Icon as={IconComponent} boxSize={4} color={color} />
  }

  const getTypeBadge = (type) => {
    const types = {
      ORDER_UPDATED: { colorPalette: 'blue', label: 'Order' },
      promotion: { colorPalette: 'green', label: 'Promotion' },
      SYSTEM: { colorPalette: 'yellow', label: 'System' },
      review: { colorPalette: 'purple', label: 'Review' },
      default: { colorPalette: 'gray', label: 'Other' }
    }
    const config = types[type] || types.default
    return (
      <Badge 
        colorPalette={config.colorPalette} 
        variant="subtle" 
        fontSize="xs" 
        mr={1}
      >
        {config.label}
      </Badge>
    )
  }

  // Hide header on landing page - carousel will have its own
  if (isLandingPage) return null
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

            {/* Notifications + badge + hover menu */}
            <Menu.Root
              open={notifMenuOpen}
              onOpenChange={(e) => setNotifMenuOpen(e.open)}
              lazyMount={false}
              unmountOnExit={false}
              positioning={{ placement: 'bottom-end' }}
            >
              <Menu.Trigger asChild onPointerEnter={notifEnter} onPointerLeave={notifLeave}>
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
                  {unread > 0 && (
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
                      {unread}
                    </Badge>
                  )}
                </Box>
              </Menu.Trigger>

              <Portal>
                <Menu.Positioner onPointerEnter={notifEnter} onPointerLeave={notifLeave}>
                  <Menu.Content
                    bg="white"
                    border="1px solid"
                    borderColor="gray.200"
                    rounded="xl"
                    shadow="2xl"
                    minW="360px"
                    maxW="400px"
                    maxH="550px"
                    py={0}
                    overflow="hidden"
                  >
                    <Box
                      px={4}
                      py={3}
                      borderBottom="1px solid"
                      borderColor="gray.100"
                    >
                      <HStack justify="space-between">
                        <Heading size="sm" color="gray.800">Notifications</Heading>
                        <Badge colorPalette="black" variant="solid" px={2} py={0.5}>
                          {unread} unread
                        </Badge>
                      </HStack>
                    </Box>

                    {notifications.length === 0 ? (
                      <VStack spacing={4} py={8} px={4} textAlign="center">
                        <Icon as={FiBell} boxSize={12} color="gray.300" />
                        <VStack spacing={1}>
                          <ChakraText fontSize="sm" fontWeight="medium" color="gray.700">No notifications yet</ChakraText>
                          <ChakraText fontSize="xs" color="gray.500">Stay tuned for updates!</ChakraText>
                        </VStack>
                      </VStack>
                    ) : (
                      <VStack spacing={0} maxH="250px" overflowY="auto">
                        {notifications.map(n => (
                          <Box
                            key={n.id}
                            px={4}
                            py={3}
                            borderBottom="1px solid"
                            borderColor="gray.50"
                            _hover={{ bg: 'gray.25' }}
                            transition="background-color 0.15s ease"
                            cursor="pointer"
                            onClick={() => handleNotifClick(n)}
                            width="full"
                          >
                            <HStack spacing={3} align="start">
                              <Box
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                w={10}
                                h={10}
                                bg="gray.100"
                                borderRadius="full"
                                flexShrink={0}
                              >
                                {getTypeIcon(n.type)}
                              </Box>
                              <VStack align="start" flex={1} spacing={1}>
                                <HStack spacing={1}>
                                  <ChakraText fontSize="sm" fontWeight="medium" noOfLines={1}>{n.title || 'New Notification'}</ChakraText>
                                  {getTypeBadge(n.type)}
                                </HStack>
                                <ChakraText fontSize="sm" noOfLines={2} color="gray.700">{n.message}</ChakraText>
                                <ChakraText fontSize="xs" color="gray.500">
                                  {new Date(n.createdAt).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    hour: 'numeric', 
                                    minute: '2-digit' 
                                  })}
                                </ChakraText>
                              </VStack>
                              {!n.read && (
                                <Box
                                  w={2}
                                  h={2}
                                  bg="red.500"
                                  borderRadius="full"
                                  mt={1}
                                  flexShrink={0}
                                />
                              )}
                            </HStack>
                          </Box>
                        ))}
                      </VStack>
                    )}
                    
                    <Box px={4} py={3} borderTop="1px solid" borderColor="gray.100">
                      <Button
                        variant="ghost"
                        size="sm"
                        w="full"
                        colorPalette="blue"
                        onClick={() => nav('/notifications')}
                      >
                        View all notifications
                      </Button>
                    </Box>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>

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
                        onClick={() => nav('/profile')}
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
                        gap={2.5}
                        _hover={{ bg: 'gray.50', cursor: 'pointer' }}
                      >
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          w={5}  // 20px, match icon default size
                          h={5}  // Giữ square, không to ra
                          bg="#3B82F6"
                          borderRadius="lg"
                          flexShrink={0}  // Ngăn Box bị shrink nếu cần
                          mr={0}
                        >
                          <Icon as={FiShield} boxSize={3} color="white" />  {/* boxSize=4 (~16px) để fit snug, không overflow */}
                        </Box>
                        Admin Center
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