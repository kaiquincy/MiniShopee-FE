// Header.jsx - Responsive with Theme Toggle

import { Badge, Box, Button, Text as ChakraText, Drawer, Flex, Heading, HStack, Icon, IconButton, Input, InputGroup, Menu, Portal, Separator, VStack } from '@chakra-ui/react'
import React, { useEffect, useRef, useState } from 'react'
import { FiBell, FiLogOut, FiMenu, FiMessageSquare, FiMoon, FiPackage, FiSearch, FiSettings, FiShield, FiShoppingBag, FiShoppingCart, FiStar, FiSun, FiTag, FiUser, FiX } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import { markRead, myNotifications, unreadCount } from '../api/notifications'
import { customOrderUpdateTypes } from '../constants/notificationTypes'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useTheme } from '../context/ThemeContext'

export default function Header() {
  const nav = useNavigate()
  const { token, logout, user } = useAuth()
  const { cartCount } = useCart()
  const { theme, isLight, toggleTheme } = useTheme()

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

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

  // Use admin/seller theme override or global theme
  // const headerBg = isSellerOrAdmin ? "gray.900" : theme.headerBg
  // const headerColor = isSellerOrAdmin ? "white" : theme.text
  // const headerBorder = isSellerOrAdmin ? "gray.800" : theme.headerBorder

  const headerBg = theme.headerBg
  const headerColor = theme.text
  const headerBorder = theme.headerBorder

  const loadNotifications = async () => {
    try {
      const notifs = await myNotifications()
      setNotifications(notifs.slice(0, 5))
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
    return <Icon as={IconComponent} boxSize={8} color={color} />
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
      <Badge colorPalette={config.colorPalette} variant="subtle" fontSize="xs" mr={1} mb={0}>
        {config.label}
      </Badge>
    )
  }

  if (isLandingPage) return null

  return (
    <Box 
      as="header" 
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={1000}
      bg={headerBg}
      color={headerColor}
      borderBottom="1px solid"
      borderColor={headerBorder}
      backdropFilter="blur(10px)"
      transition="all 0.2s ease"
    >
      <Box maxW="7xl" mx="auto" py={3} px={4}>
        <Flex align="center" gap={{ base: 2, md: 4 }} justify="space-between">
          {/* Logo */}
          <Heading size={{ base: "xl", md: "2xl" }} fontWeight="black" flexShrink={0}>
            <Link to="/">mini<ChakraText as="span" color='brand.500'>Shopee</ChakraText></Link>
          </Heading>

          {/* Desktop Search */}
          <InputGroup
            maxW="600px"
            flex={1}
            display={{ base: "none", md: "flex" }}
            startElement={<Icon as={FiSearch} aria-hidden="true" color={theme.textPlaceholder} boxSize="5" />}
          >
            <Input
              placeholder="Search for product, category…"
              bg={theme.inputBg}
              color={theme.text}
              borderColor={theme.border}
              _placeholder={{ color: theme.textPlaceholder }}
              _hover={{ borderColor: theme.borderLight }}
              _focus={{ borderColor: theme.accent, boxShadow: `0 0 0 1px ${theme.accent}` }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') nav(`/products?q=${encodeURIComponent(e.target.value || '')}`)
              }}
            />
          </InputGroup>

          {/* Actions */}
          <Flex align="center" gap={{ base: 1, sm: 2, md: 3 }}>
            {/* Mobile Search Toggle */}
            <IconButton
              aria-label="Search"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              variant="ghost"
              size="sm"
              borderRadius="full"
              color={headerColor}
              _hover={{ bg: theme.hoverBg }}
              display={{ base: "flex", md: "none" }}
            >
              <Icon as={mobileSearchOpen ? FiX : FiSearch} size={18} />
            </IconButton>

            {/* Theme Toggle */}
            <IconButton
              aria-label="Toggle theme"
              onClick={toggleTheme}
              variant="ghost"
              size="sm"
              borderRadius="full"
              color={headerColor}
              _hover={{ bg: theme.hoverBg }}
              display={{ base: "none", sm: "flex" }}
            >
              <Icon as={isLight ? FiMoon : FiSun} size={18} />
            </IconButton>

            {/* Chat - Hidden on small mobile */}
            <IconButton
              aria-label="Chat"
              color={headerColor}
              variant="ghost"
              size="sm"
              _hover={{ bg: theme.hoverBg }}
              fontSize="18px"
              onClick={() => nav('/chat')}
              display={{ base: "none", sm: "flex" }}
            >
              <Icon as={FiMessageSquare} />
            </IconButton>

            {/* Notifications - Desktop */}
            <Menu.Root
              open={notifMenuOpen}
              onOpenChange={(e) => setNotifMenuOpen(e.open)}
              lazyMount={false}
              unmountOnExit={false}
              positioning={{ placement: 'bottom-end' }}
            >
              <Menu.Trigger asChild onPointerEnter={notifEnter} onPointerLeave={notifLeave}>
                <Box position="relative" display={{ base: "none", lg: "block" }}>
                  <IconButton
                    aria-label="Notifications"
                    color={headerColor}
                    variant="ghost"
                    size="sm"
                    _hover={{ bg: theme.hoverBg }}
                    fontSize="18px"
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
                    bg={theme.cardBg}
                    border="1px solid"
                    borderColor={theme.border}
                    rounded="xl"
                    shadow="2xl"
                    minW="360px"
                    maxW="400px"
                    maxH="550px"
                    py={0}
                    overflow="hidden"
                  >
                    <Box px={4} py={3} borderBottom="1px solid" borderColor={theme.border}>
                      <HStack justify="space-between">
                        <Heading size="sm" color={theme.text}>Notifications</Heading>
                        <Badge colorPalette="gray" variant="subtle" px={2} py={0.5}>
                          {unread} unread
                        </Badge>
                      </HStack>
                    </Box>

                    {notifications.length === 0 ? (
                      <VStack spacing={4} py={8} px={4} textAlign="center">
                        <Icon as={FiBell} boxSize={12} color={theme.textMuted} />
                        <VStack spacing={1}>
                          <ChakraText fontSize="sm" fontWeight="medium" color={theme.text}>No notifications yet</ChakraText>
                          <ChakraText fontSize="xs" color={theme.textMuted}>Stay tuned for updates!</ChakraText>
                        </VStack>
                      </VStack>
                    ) : (
                      <VStack spacing={0} maxH="400px" overflowY="auto">
                        {notifications.map(n => {
                          const renderTextWithId = (text, id) => {
                            if (!text) return null
                            const parts = text.split('#${id}')
                            return (
                              <>
                                {parts.map((part, index) => (
                                  <React.Fragment key={index}>
                                    {part}
                                    {index < parts.length - 1 && (
                                      <ChakraText as="span" color="blue.500">#MSP202Z{id}</ChakraText>
                                    )}
                                  </React.Fragment>
                                ))}
                              </>
                            )
                          }

                          const custom = customOrderUpdateTypes[n.type]
                          const title = custom?.title ?? (n.title || 'New Notification')
                          const message = custom ? renderTextWithId(custom.message, n.referenceId) : n.message
                          const IconComp = custom?.icon
                          const iconColor = custom?.color
                          const badge = custom?.badge
                          const iconEl = IconComp ? <Icon as={IconComp} boxSize={10} color={iconColor} /> : getTypeIcon(n.type)
                          const badgeEl = badge ? <Badge colorPalette={badge.colorScheme}>{badge.label}</Badge> : getTypeBadge(n.type)

                          return (
                            <Box
                              key={n.id}
                              px={2}
                              py={3}
                              borderBottom="1px solid"
                              borderColor={theme.border}
                              _hover={{ bg: theme.hoverBg }}
                              transition="background-color 0.15s ease"
                              cursor="pointer"
                              onClick={() => handleNotifClick(n)}
                              width="full"
                            >
                              <HStack spacing={3} align="center">
                                <Box
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  w={14}
                                  h={14}
                                  bg={theme.secondaryBg}
                                  borderRadius="full"
                                  flexShrink={0}
                                >
                                  {iconEl}
                                </Box>
                                <VStack align="start" flex={1} spacing={1}>
                                  <HStack spacing={1}>
                                    <ChakraText mb={0} pb={0} fontSize="xs" fontWeight="medium" color={theme.text} noOfLines={1}>{title}</ChakraText>
                                    {badgeEl}
                                  </HStack>
                                  <ChakraText fontSize="xs" noOfLines={2} color={theme.textSecondary}>{message}</ChakraText>
                                  <ChakraText fontSize="xs" color={theme.textMuted}>
                                    {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                  </ChakraText>
                                </VStack>
                                {!n.read && <Box w={2} h={2} bg="red.500" borderRadius="full" mt={1} flexShrink={0} />}
                              </HStack>
                            </Box>
                          )
                        })}
                      </VStack>
                    )}
                    
                    <Box px={4} py={3} borderTop="1px solid" borderColor={theme.border}>
                      <Button size="sm" w="full" colorPalette="blue" onClick={() => nav('/notifications')}>
                        View all notifications
                      </Button>
                    </Box>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>

            {/* Cart */}
            <Box position="relative">
              <IconButton
                aria-label="Cart"
                color={headerColor}
                variant="ghost"
                size="sm"
                _hover={{ bg: theme.hoverBg }}
                fontSize="18px"
                onClick={() => nav('/cart')}
              >
                <Icon as={FiShoppingCart} />
              </IconButton>
              {cartCount > 0 && (
                <Badge position="absolute" top="0.08em" right="0.2em" borderRadius="full" px="0.5em" fontSize="0.6em" fontWeight={900} colorPalette="red">
                  {cartCount}
                </Badge>
              )}
            </Box>

            {/* User Menu - Desktop */}
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
                    color={headerColor}
                    variant="ghost"
                    size="sm"
                    _hover={{ bg: theme.hoverBg }}
                    fontSize="18px"
                    display={{ base: "none", md: "flex" }}
                  >
                    <Icon as={FiUser} />
                  </IconButton>
                </Menu.Trigger>

                <Portal>
                  <Menu.Positioner onPointerEnter={enter} onPointerLeave={leave}>
                    <Menu.Content bg={theme.cardBg} border="1px solid" borderColor={theme.border} rounded="l3" shadow="lg" minW="220px" py="2">
                      <Box px="3" pb="2">
                        <ChakraText fontSize="sm" color={theme.textMuted}>Account</ChakraText>
                      </Box>

                      <Menu.Item value="info" onClick={() => nav('/profile')} display="flex" alignItems="center" gap="3" px="3" py="2" color={theme.text} _hover={{ bg: theme.hoverBg, cursor: 'pointer' }}>
                        <Icon as={FiUser} />
                        <ChakraText>My Info</ChakraText>
                      </Menu.Item>

                      <Menu.Item value="orders" onClick={() => nav('/orders')} display="flex" alignItems="center" gap="3" px="3" py="2" color={theme.text} _hover={{ bg: theme.hoverBg, cursor: 'pointer' }}>
                        <Icon as={FiShoppingBag} />
                        <ChakraText>My Orders</ChakraText>
                      </Menu.Item>

                      {user?.role?.includes('ROLE_ADMIN') && (
                        <>
                          <Menu.Item value="seller" onClick={() => nav('/seller')} display="flex" alignItems="center" gap="3" px="3" py="2" color={theme.text} _hover={{ bg: theme.hoverBg, cursor: 'pointer' }}>
                            <Icon as={FiPackage} />
                            <ChakraText>Seller Center</ChakraText>
                          </Menu.Item>
                          <Menu.Item value="admin" onClick={() => nav('/admin')} gap={2.5} color={theme.text} _hover={{ bg: theme.hoverBg, cursor: 'pointer' }}>
                            <Box display="flex" alignItems="center" justifyContent="center" w={5} h={5} bg="#3B82F6" borderRadius="lg" flexShrink={0} mr={0}>
                              <Icon as={FiShield} boxSize={3} color="white" />
                            </Box>
                            Admin Center
                          </Menu.Item>
                        </>
                      )}

                      <Separator my="2" borderColor={theme.border} />

                      <Menu.Item value="logout" onClick={logout} display="flex" alignItems="center" gap="3" px="3" py="2" color="red.600" _hover={{ bg: 'red.50', cursor: 'pointer' }}>
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
                color={headerColor} 
                size="sm"
                _hover={{ bg: theme.hoverBg }} 
                fontSize="18px" 
                onClick={() => nav('/login')}
                display={{ base: "none", md: "flex" }}
              >
                <Icon as={FiUser} />
              </IconButton>
            )}

            {/* Mobile Menu Toggle */}
            <IconButton
              aria-label="Menu"
              onClick={() => setMobileMenuOpen(true)}
              variant="ghost"
              size="sm"
              color={headerColor}
              _hover={{ bg: theme.hoverBg }}
              display={{ base: "flex", md: "none" }}
            >
              <Icon as={FiMenu} size={20} />
            </IconButton>
          </Flex>
        </Flex>

        {/* Mobile Search Bar */}
        {mobileSearchOpen && (
          <Box mt={3} display={{ base: "block", md: "none" }}>
            <InputGroup
              startElement={<Icon as={FiSearch} aria-hidden="true" color={theme.textPlaceholder} boxSize="5" />}
            >
              <Input
                placeholder="Search for product, category…"
                bg={theme.inputBg}
                color={theme.text}
                borderColor={theme.border}
                _placeholder={{ color: theme.textPlaceholder }}
                _hover={{ borderColor: theme.borderLight }}
                _focus={{ borderColor: theme.accent, boxShadow: `0 0 0 1px ${theme.accent}` }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    nav(`/?q=${encodeURIComponent(e.target.value || '')}`)
                    setMobileSearchOpen(false)
                  }
                }}
                autoFocus
              />
            </InputGroup>
          </Box>
        )}
      </Box>

      {/* Mobile Drawer Menu */}
      <Drawer.Root 
        open={mobileMenuOpen} 
        onOpenChange={(e) => setMobileMenuOpen(e.open)}
        placement="right"
      >
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content bg={theme.cardBg}>
            <Drawer.Header borderBottom="1px solid" borderColor={theme.border}>
              <Flex justify="space-between" align="center">
                <Heading size="md" color={theme.text}>Menu</Heading>
                <IconButton
                  aria-label="Close"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(false)}
                  color={theme.text}
                >
                  <Icon as={FiX} />
                </IconButton>
              </Flex>
            </Drawer.Header>

            <Drawer.Body py={4}>
              <VStack spacing={2} align="stretch">
                {/* Theme Toggle */}
                <Button
                  variant="ghost"
                  justifyContent="start"
                  leftIcon={<Icon as={isLight ? FiMoon : FiSun} />}
                  onClick={() => {
                    toggleTheme()
                    setMobileMenuOpen(false)
                  }}
                  color={theme.text}
                  _hover={{ bg: theme.hoverBg }}
                >
                  {isLight ? 'Dark Mode' : 'Light Mode'}
                </Button>

                {/* Chat */}
                <Button
                  variant="ghost"
                  justifyContent="start"
                  leftIcon={<Icon as={FiMessageSquare} />}
                  onClick={() => {
                    nav('/chat')
                    setMobileMenuOpen(false)
                  }}
                  color={theme.text}
                  _hover={{ bg: theme.hoverBg }}
                  display={{ base: "flex", sm: "none" }}
                >
                  Chat
                </Button>

                {/* Notifications */}
                <Button
                  variant="ghost"
                  justifyContent="start"
                  leftIcon={<Icon as={FiBell} />}
                  onClick={() => {
                    nav('/notifications')
                    setMobileMenuOpen(false)
                  }}
                  color={theme.text}
                  _hover={{ bg: theme.hoverBg }}
                  position="relative"
                >
                  Notifications
                  {unread > 0 && (
                    <Badge
                      position="absolute"
                      top="2"
                      left="8"
                      borderRadius="full"
                      px="0.5em"
                      fontSize="0.6em"
                      fontWeight={900}
                      colorPalette="red"
                    >
                      {unread}
                    </Badge>
                  )}
                </Button>

                <Separator my={2} borderColor={theme.border} />

                {token ? (
                  <>
                    <Button
                      variant="ghost"
                      justifyContent="start"
                      leftIcon={<Icon as={FiUser} />}
                      onClick={() => {
                        nav('/profile')
                        setMobileMenuOpen(false)
                      }}
                      color={theme.text}
                      _hover={{ bg: theme.hoverBg }}
                    >
                      My Info
                    </Button>

                    <Button
                      variant="ghost"
                      justifyContent="start"
                      leftIcon={<Icon as={FiShoppingBag} />}
                      onClick={() => {
                        nav('/orders')
                        setMobileMenuOpen(false)
                      }}
                      color={theme.text}
                      _hover={{ bg: theme.hoverBg }}
                    >
                      My Orders
                    </Button>

                    {user?.role?.includes('ROLE_ADMIN') && (
                      <>
                        <Button
                          variant="ghost"
                          justifyContent="start"
                          leftIcon={<Icon as={FiPackage} />}
                          onClick={() => {
                            nav('/seller')
                            setMobileMenuOpen(false)
                          }}
                          color={theme.text}
                          _hover={{ bg: theme.hoverBg }}
                        >
                          Seller Center
                        </Button>

                        <Button
                          variant="ghost"
                          justifyContent="start"
                          leftIcon={
                            <Box display="flex" alignItems="center" justifyContent="center" w={5} h={5} bg="#3B82F6" borderRadius="lg">
                              <Icon as={FiShield} boxSize={3} color="white" />
                            </Box>
                          }
                          onClick={() => {
                            nav('/admin')
                            setMobileMenuOpen(false)
                          }}
                          color={theme.text}
                          _hover={{ bg: theme.hoverBg }}
                        >
                          Admin Center
                        </Button>
                      </>
                    )}

                    <Separator my={2} borderColor={theme.border} />

                    <Button
                      variant="ghost"
                      justifyContent="start"
                      leftIcon={<Icon as={FiLogOut} />}
                      onClick={() => {
                        logout()
                        setMobileMenuOpen(false)
                      }}
                      color="red.600"
                      _hover={{ bg: 'red.50' }}
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    justifyContent="start"
                    leftIcon={<Icon as={FiUser} />}
                    onClick={() => {
                      nav('/login')
                      setMobileMenuOpen(false)
                    }}
                    color={theme.text}
                    _hover={{ bg: theme.hoverBg }}
                  >
                    Login
                  </Button>
                )}
              </VStack>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    </Box>
  )
}