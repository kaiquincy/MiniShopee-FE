import { Badge, Box, Button, Text as ChakraText, Container, Drawer, Flex, Grid, Heading, HStack, Icon, IconButton, Image, Input, InputGroup, Menu, Portal, Separator, Text, VStack } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { FiBell, FiLogOut, FiMenu, FiMessageCircle, FiPackage, FiSearch, FiSettings, FiShield, FiShoppingBag, FiShoppingCart, FiStar, FiTag, FiUser, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { markRead, myNotifications, unreadCount } from '../api/notifications';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';


import camera from "../assets/landingpage/carousel/camera.png";
import headphone from "../assets/landingpage/carousel/headphone.png";
import laptop from "../assets/landingpage/carousel/laptop.png";
import perfume from "../assets/landingpage/carousel/perfume.png";
import sneakers from "../assets/landingpage/carousel/sneakers.png";
import watch from "../assets/landingpage/carousel/watch.png";

import cameraBg from "../assets/landingpage/carousel/camera-bg.jpg";
import headphoneBg from "../assets/landingpage/carousel/headphone-bg.jpg";
import laptopBg from "../assets/landingpage/carousel/laptop-bg.jpg";
import perfumeBg from "../assets/landingpage/carousel/perfume-bg.jpg";
import sneakersBg from "../assets/landingpage/carousel/sneakers-bg.jpg";
import watchBg from "../assets/landingpage/carousel/watch-bg.jpg";

export default function LandingCarousel() {
    const [current, setCurrent] = useState(0);
    const nav = useNavigate();
    const { token, logout, user } = useAuth();
    const { cartCount } = useCart();

    // Mobile states
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

    // Header menu states
    const [menuOpen, setMenuOpen] = useState(false);
    const timerRef = useRef(null);
    const enter = () => { clearTimeout(timerRef.current); timerRef.current = setTimeout(() => setMenuOpen(true), 60) };
    const leave = () => { clearTimeout(timerRef.current); timerRef.current = setTimeout(() => setMenuOpen(false), 120) };

    // Notification states
    const [notifications, setNotifications] = useState([])
    const [unread, setUnread] = useState(0)
    const [notifMenuOpen, setNotifMenuOpen] = useState(false)
    const notifTimerRef = useRef(null)
    const notifEnter = () => { clearTimeout(notifTimerRef.current); notifTimerRef.current = setTimeout(() => setNotifMenuOpen(true), 60) }
    const notifLeave = () => { clearTimeout(notifTimerRef.current); notifTimerRef.current = setTimeout(() => setNotifMenuOpen(false), 120) }

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

    const slides = [
        { 
            text: "Laptops", 
            img: laptop, 
            bg: laptopBg, 
            color: "#2563EB",
            tag: "Tech"
        },
        { 
            text: "Sneakers", 
            img: sneakers, 
            bg: sneakersBg, 
            color: "#EA580C",
            tag: "Fashion"
        },
        { 
            text: "Watches", 
            img: watch, 
            bg: watchBg, 
            color: "#16A34A",
            tag: "Luxury"
        },
        { 
            text: "Headphones", 
            img: headphone, 
            bg: headphoneBg, 
            color: "#DB2777",
            tag: "Audio"
        },
        { 
            text: "Perfume", 
            img: perfume, 
            bg: perfumeBg, 
            color: "#9333EA",
            tag: "Beauty"
        },
        { 
            text: "Camera", 
            img: camera, 
            bg: cameraBg, 
            color: "#0891B2",
            tag: "Photo"
        },
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [slides.length]);

    const activeSlide = slides[current];

    return (
        <Box 
            position="relative" 
            w="100vw" 
            left="50%" 
            ml="-50vw"
            bg="black"
            color="white"
            overflow="hidden"
            minH={{ base: "450px", md: "550px", lg: "100vh" }}
        >
            {/* Animated background gradient */}
            <Box
                position="absolute"
                inset="0"
                bg={`${activeSlide.color}26`}
                transition="background-color 1s ease"
            />

            <Container maxW="container.2xl" position="relative">
                {/* Integrated Header/Navigation Bar */}
                <HStack 
                    justify="space-between" 
                    py={4}
                    borderBottom="1px solid"
                    borderColor="whiteAlpha.200"
                    px={4}
                >
                    {/* Logo */}
                    <Text 
                        fontSize={{ base: "xl", md: "2xl" }}
                        fontWeight="black"
                        cursor="pointer"
                        onClick={() => nav('/')}
                        flexShrink={0}
                    >
                        mini<Text as="span" color={activeSlide.color}>Shopee</Text>
                    </Text>

                    {/* Category Navigation - Desktop only */}
                    <HStack gap={3} display={{ base: "none", lg: "flex" }}>
                        {slides.map((slide, idx) => (
                            <Text
                                key={idx}
                                fontSize="sm"
                                fontWeight={current === idx ? "bold" : "normal"}
                                color={current === idx ? activeSlide.color : "whiteAlpha.600"}
                                cursor="pointer"
                                transition="all 0.3s"
                                _hover={{ color: "white" }}
                                onClick={() => setCurrent(idx)}
                            >
                                {slide.text}
                            </Text>
                        ))}
                    </HStack>

                    {/* Search Bar - Desktop */}
                    <InputGroup
                        maxW="400px"
                        flex={1}
                        mx={4}
                        display={{ base: "none", md: "flex" }}
                        startElement={
                            <Icon
                                as={FiSearch}
                                boxSize="5"
                                color="whiteAlpha.600"
                            />
                        }
                    >
                        <Input
                            placeholder="Search products..."
                            bg="whiteAlpha.100"
                            color="white"
                            border="1px solid"
                            borderColor="whiteAlpha.200"
                            _placeholder={{ color: "whiteAlpha.500" }}
                            _hover={{ bg: "whiteAlpha.150" }}
                            _focus={{ bg: "whiteAlpha.200", borderColor: activeSlide.color }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter')
                                    nav(`/products?q=${encodeURIComponent(e.target.value || '')}`)
                            }}
                        />
                    </InputGroup>

                    {/* Action Icons */}
                    <Flex align="center" gap={{ base: 1, sm: 2 }}>
                        {/* Mobile Search Toggle */}
                        <IconButton
                            aria-label="Search"
                            variant="ghost"
                            fontSize="18px"
                            color="white"
                            _hover={{ bg: "whiteAlpha.200" }}
                            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                            display={{ base: "flex", md: "none" }}
                        >
                            <Icon as={mobileSearchOpen ? FiX : FiSearch} />
                        </IconButton>

                        {/* Chat - Hidden on small mobile */}
                        <IconButton
                            aria-label="Chat"
                            variant="ghost"
                            fontSize="18px"
                            color="white"
                            _hover={{ bg: "whiteAlpha.200" }}
                            onClick={() => nav('/chat')}
                            display={{ base: "none", sm: "flex" }}
                        >
                            <Icon as={FiMessageCircle} />
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
                                        color="white"
                                        variant="ghost"
                                        _hover={{ bg: "whiteAlpha.200" }}
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
                                        bg="white"
                                        border="1px solid"
                                        borderColor="gray.200"
                                        rounded="xl"
                                        shadow="2xl"
                                        minW="360px"
                                        maxW="400px"
                                        maxH="500px"
                                        py={0}
                                        overflow="hidden"
                                    >
                                        <Box
                                            px={4}
                                            py={3}
                                            bg="gray.50"
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
                                            <VStack spacing={0} maxH="400px" overflowY="auto">
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
                                        
                                        <Box px={4} py={3} bg="gray.50" borderTop="1px solid" borderColor="gray.100">
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

                        {/* Cart */}
                        <Box position="relative">
                            <IconButton
                                aria-label="Cart"
                                variant="ghost"
                                fontSize="18px"
                                color="white"
                                _hover={{ bg: "whiteAlpha.200" }}
                                onClick={() => nav('/cart')}
                            >
                                <Icon as={FiShoppingCart} />
                            </IconButton>
                            {cartCount > 0 && (
                                <Badge
                                    position="absolute"
                                    top="0"
                                    right="0"
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
                                        variant="ghost"
                                        color="white"
                                        _hover={{ bg: "whiteAlpha.200" }}
                                        fontSize="18px"
                                        display={{ base: "none", md: "flex" }}
                                    >
                                        <Icon as={FiUser} />
                                    </IconButton>
                                </Menu.Trigger>

                                <Portal>
                                    <Menu.Positioner onPointerEnter={enter} onPointerLeave={leave}>
                                        <Menu.Content
                                            bg="gray.900"
                                            color="white"
                                            border="1px solid"
                                            borderColor="whiteAlpha.300"
                                            rounded="lg"
                                            shadow="xl"
                                            minW="220px"
                                            py="2"
                                        >
                                            <Box px="3" pb="2">
                                                <Text fontSize="sm" color="whiteAlpha.600">Account</Text>
                                            </Box>

                                            <Menu.Item
                                                value="info"
                                                onClick={() => nav('/profile')}
                                                display="flex" alignItems="center" gap="3" px="3" py="2"
                                                _hover={{ bg: 'whiteAlpha.200', cursor: 'pointer' }}
                                                color="whiteAlpha.600"
                                            >
                                                <Icon as={FiUser} />
                                                <Text>My Info</Text>
                                            </Menu.Item>

                                            <Menu.Item
                                                value="orders"
                                                onClick={() => nav('/orders')}
                                                display="flex" alignItems="center" gap="3" px="3" py="2"
                                                _hover={{ bg: 'whiteAlpha.200', cursor: 'pointer' }}
                                                color="whiteAlpha.600"
                                            >
                                                <Icon as={FiShoppingBag} />
                                                <Text>My Orders</Text>
                                            </Menu.Item>

                                            {user?.role?.includes('ROLE_ADMIN') && (
                                                <>
                                                    <Menu.Item
                                                        value="seller"
                                                        onClick={() => nav('/seller')}
                                                        display="flex" alignItems="center" gap="3" px="3" py="2"
                                                        _hover={{ bg: 'whiteAlpha.200', cursor: 'pointer' }}
                                                        color="whiteAlpha.600"
                                                    >
                                                        <Icon as={FiPackage} />
                                                        <Text>Seller Center</Text>
                                                    </Menu.Item>

                                                    <Menu.Item
                                                        value="admin"
                                                        onClick={() => nav('/admin')}
                                                        display="flex" alignItems="center" gap="3" px="3" py="2"
                                                        _hover={{ bg: 'whiteAlpha.200', cursor: 'pointer' }}
                                                        color="whiteAlpha.600"
                                                    >
                                                        <Box display="flex" alignItems="center" justifyContent="center" w={5} h={5} bg="#3B82F6" borderRadius="lg" flexShrink={0} mr={0}>
                                                            <Icon as={FiShield} boxSize={3} color="white" />
                                                        </Box>
                                                        <Text>Admin Center</Text>
                                                    </Menu.Item>
                                                </>
                                            )}

                                            <Separator my="2" borderColor="whiteAlpha.300" />

                                            <Menu.Item
                                                value="logout"
                                                onClick={logout}
                                                display="flex" alignItems="center" gap="3" px="3" py="2"
                                                color="red.400"
                                                _hover={{ bg: 'red.900', cursor: 'pointer' }}
                                            >
                                                <Icon as={FiLogOut} />
                                                <Text>Logout</Text>
                                            </Menu.Item>
                                        </Menu.Content>
                                    </Menu.Positioner>
                                </Portal>
                            </Menu.Root>
                        ) : (
                            <IconButton
                                aria-label="Login"
                                variant="ghost"
                                color="white"
                                _hover={{ bg: "whiteAlpha.200" }}
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
                            variant="ghost"
                            color="white"
                            _hover={{ bg: "whiteAlpha.200" }}
                            fontSize="20px"
                            onClick={() => setMobileMenuOpen(true)}
                            display={{ base: "flex", md: "none" }}
                        >
                            <Icon as={FiMenu} />
                        </IconButton>
                    </Flex>
                </HStack>

                {/* Mobile Search Bar */}
                {mobileSearchOpen && (
                    <Box mt={3} display={{ base: "block", md: "none" }}>
                        <InputGroup
                            startElement={
                                <Icon
                                    as={FiSearch}
                                    boxSize="5"
                                    color="whiteAlpha.600"
                                />
                            }
                        >
                            <Input
                                placeholder="Search products..."
                                bg="whiteAlpha.100"
                                color="white"
                                border="1px solid"
                                borderColor="whiteAlpha.200"
                                _placeholder={{ color: "whiteAlpha.500" }}
                                _hover={{ bg: "whiteAlpha.150" }}
                                _focus={{ bg: "whiteAlpha.200", borderColor: activeSlide.color }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        nav(`/products?q=${encodeURIComponent(e.target.value || '')}`)
                                        setMobileSearchOpen(false)
                                    }
                                }}
                                autoFocus
                            />
                        </InputGroup>
                    </Box>
                )}

                {/* Main Content Grid */}
                <Grid
                    templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                    gap={{ base: 4, md: 8 }}
                    minH={{ base: "auto", lg: "600px" }}
                    alignItems="center"
                    pt={{ base: 6, md: 8 }}
                    px={16}
                >
                    {/* Left - Hero Text */}
                    <VStack align="start" zIndex="1" spacing={{ base: 4, md: 8 }}>
                        <Box>
                            {/* Category Tag */}
                            <HStack mb={4}>
                                <Box w={{ base: "30px", md: "40px" }} h="2px" bg={activeSlide.color} />
                                <Text 
                                    fontSize={{ base: "xs", md: "sm" }}
                                    fontWeight="bold" 
                                    color={activeSlide.color}
                                    textTransform="uppercase"
                                    letterSpacing="wider"
                                >
                                    {activeSlide.tag} Collection
                                </Text>
                            </HStack>

                            {/* Large Text */}
                            <Text
                                fontSize={{ base: "4xl", sm: "5xl", md: "6xl", lg: "8xl" }}
                                fontWeight="black"
                                lineHeight="0.9"
                                mb={{ base: 3, md: 6 }}
                            >
                                {activeSlide.text}
                            </Text>

                            {/* Year indicator */}
                            <Text 
                                fontSize={{ base: "5xl", sm: "6xl", md: "7xl", lg: "9xl" }}
                                fontWeight="black"
                                color="whiteAlpha.500"
                                lineHeight="1"
                                position="relative"
                                top={{ base: "-10px", md: "-20px" }}
                            >
                                2025
                            </Text>
                        </Box>

                        {/* Description & CTA */}
                        <Box>
                            <Text 
                                fontSize={{ base: "sm", md: "md", lg: "lg" }}
                                color="whiteAlpha.700"
                                mb={{ base: 4, md: 8 }}
                                maxW="450px"
                            >
                                Discover the latest collection of premium {activeSlide.text.toLowerCase()} with exclusive deals up to 60% off.
                            </Text>

                            <HStack spacing={4}>
                                <Button
                                    size={{ base: "md", md: "lg" }}
                                    bg={activeSlide.color}
                                    color="white"
                                    px={{ base: 6, md: 8 }}
                                    borderRadius="none"
                                    rightIcon={<FiShoppingBag />}
                                    _hover={{ 
                                        transform: "translateX(4px)",
                                        shadow: "xl"
                                    }}
                                    transition="all 0.3s"
                                    onClick={() => nav('/products')}
                                >
                                    Shop Now
                                </Button>
                            </HStack>
                        </Box>

                        {/* Counter */}
                        <HStack spacing={{ base: 6, md: 12 }} pt={{ base: 2, md: 4 }}>
                            <Box>
                                <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="black">{current + 1}</Text>
                                <Text fontSize="sm" color="whiteAlpha.500">
                                    / {slides.length}
                                </Text>
                            </Box>
                            <VStack align="start" spacing={2}>
                                {slides.map((_, idx) => (
                                    <Box
                                        key={idx}
                                        w={current === idx ? "60px" : "30px"}
                                        h="2px"
                                        bg={current === idx ? activeSlide.color : "whiteAlpha.300"}
                                        transition="all 0.5s ease"
                                        cursor="pointer"
                                        onClick={() => setCurrent(idx)}
                                    />
                                ))}
                            </VStack>
                        </HStack>
                    </VStack>

                    {/* Right - Product Image */}
                    <Box position={{ base: "absolute", md: "relative" }} top={0} right={{ base: "-30%", md: "0" }} w="full" zIndex="0" opacity={{ base: 0.6, lg: 1 }} h={{ base: "400px", md: "full" }} mt={{ base: 8, lg: 0 }}>
                        {slides.map((slide, idx) => (
                            <Box
                                key={idx}
                                position="absolute"
                                inset="0"
                                opacity={current === idx ? 1 : 0}
                                transform={current === idx ? "scale(1) rotate(0deg)" : "scale(0.8) rotate(10deg)"}
                                transition="all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)"
                                pointerEvents={current === idx ? "auto" : "none"}
                            >
                                {/* Background circle */}
                                <Box
                                    position="absolute"
                                    top="50%"
                                    left="50%"
                                    transform="translate(-50%, -50%)"
                                    w={{ base: "350px", md: "450px", lg: "550px" }}
                                    h={{ base: "350px", md: "450px", lg: "550px" }}
                                    borderRadius="full"
                                    border="1px solid"
                                    borderColor="whiteAlpha.200"
                                />
                                <Box
                                    position="absolute"
                                    top="50%"
                                    left="50%"
                                    transform="translate(-50%, -50%)"
                                    w={{ base: "280px", md: "350px", lg: "450px" }}
                                    h={{ base: "280px", md: "350px", lg: "450px" }}
                                    borderRadius="full"
                                    bg={slide.color}
                                    opacity={0.2}
                                    filter="blur(80px)"
                                />
                                
                                {/* Product Image */}
                                <Box
                                    position="absolute"
                                    top="50%"
                                    left="50%"
                                    transform="translate(-50%, -50%)"
                                    w={{ base: "250px", md: "320px", lg: "400px" }}
                                    h={{ base: "250px", md: "320px", lg: "400px" }}
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <Image
                                        src={slide.img}
                                        alt={slide.text}
                                        maxW="90%"
                                        maxH="90%"
                                        objectFit="contain"
                                        filter="drop-shadow(0 20px 60px rgba(0,0,0,0.5))"
                                        style={{
                                            animation: current === idx ? "floatRotate 10s linear infinite" : "none"
                                        }}
                                    />
                                </Box>

                                {/* Floating elements */}
                                <Box
                                    position="absolute"
                                    top="20%"
                                    right="10%"
                                    w={{ base: "50px", md: "80px" }}
                                    h={{ base: "50px", md: "80px" }}
                                    bg={slide.color}
                                    opacity={0.3}
                                    style={{
                                        animation: current === idx ? "floatUpDown 3s ease-in-out infinite" : "none"
                                    }}
                                />
                                <Box
                                    position="absolute"
                                    bottom="15%"
                                    left="5%"
                                    w={{ base: "40px", md: "60px" }}
                                    h={{ base: "40px", md: "60px" }}
                                    border="2px solid"
                                    borderColor={slide.color}
                                    borderRadius="full"
                                    opacity={0.4}
                                    style={{
                                        animation: current === idx ? "floatUpDown 4s ease-in-out infinite 1s" : "none"
                                    }}
                                />
                            </Box>
                        ))}
                    </Box>
                </Grid>
            </Container>

            {/* Mobile Drawer Menu */}
            <Drawer.Root 
                open={mobileMenuOpen} 
                onOpenChange={(e) => setMobileMenuOpen(e.open)}
                placement="right"
            >
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content bg="gray.900" color="white">
                        <Drawer.Header borderBottom="1px solid" borderColor="whiteAlpha.300">
                            <Flex justify="space-between" align="center">
                                <Heading size="md">Menu</Heading>
                                <IconButton
                                    aria-label="Close"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setMobileMenuOpen(false)}
                                    color="white"
                                    _hover={{ bg: "whiteAlpha.200" }}
                                >
                                    <Icon as={FiX} />
                                </IconButton>
                            </Flex>
                        </Drawer.Header>

                        <Drawer.Body py={4}>
                            <VStack spacing={2} align="stretch">
                                {/* Categories */}
                                <Box>
                                    <Text fontSize="xs" color="whiteAlpha.600" px={3} mb={2} textTransform="uppercase" fontWeight="bold">
                                        Categories
                                    </Text>
                                    {slides.map((slide, idx) => (
                                        <Button
                                            key={idx}
                                            variant="ghost"
                                            justifyContent="start"
                                            color={current === idx ? activeSlide.color : "whiteAlpha.600"}
                                            _hover={{ bg: "whiteAlpha.200" }}
                                            onClick={() => {
                                                setCurrent(idx)
                                                setMobileMenuOpen(false)
                                            }}
                                        >
                                            {slide.text}
                                        </Button>
                                    ))}
                                </Box>

                                <Separator my={2} borderColor="whiteAlpha.300" />

                                {/* Chat */}
                                <Button
                                    variant="ghost"
                                    justifyContent="start"
                                    leftIcon={<Icon as={FiMessageCircle} />}
                                    onClick={() => {
                                        nav('/chat')
                                        setMobileMenuOpen(false)
                                    }}
                                    color="whiteAlpha.600"
                                    _hover={{ bg: "whiteAlpha.200" }}
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
                                    color="whiteAlpha.600"
                                    _hover={{ bg: "whiteAlpha.200" }}
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

                                <Separator my={2} borderColor="whiteAlpha.300" />

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
                                            color="whiteAlpha.600"
                                            _hover={{ bg: "whiteAlpha.200" }}
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
                                            color="whiteAlpha.600"
                                            _hover={{ bg: "whiteAlpha.200" }}
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
                                                    color="whiteAlpha.600"
                                                    _hover={{ bg: "whiteAlpha.200" }}
                                                >
                                                    Seller Center
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    justifyContent="start"
                                                    leftIcon={<Icon as={FiPackage} />}
                                                    onClick={() => {
                                                        nav('/admin')
                                                        setMobileMenuOpen(false)
                                                    }}
                                                    color="whiteAlpha.600"
                                                    _hover={{ bg: "whiteAlpha.200" }}
                                                >
                                                    Admin Center
                                                </Button>
                                            </>
                                        )}

                                        <Separator my={2} borderColor="whiteAlpha.300" />

                                        <Button
                                            variant="ghost"
                                            justifyContent="start"
                                            leftIcon={<Icon as={FiLogOut} />}
                                            onClick={() => {
                                                logout()
                                                setMobileMenuOpen(false)
                                            }}
                                            color="red.400"
                                            _hover={{ bg: 'red.900' }}
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
                                        color="whiteAlpha.600"
                                        _hover={{ bg: "whiteAlpha.200" }}
                                    >
                                        Login
                                    </Button>
                                )}
                            </VStack>
                        </Drawer.Body>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Drawer.Root>

            <style>
                {`
                    @keyframes floatRotate {
                        0% { transform: translateY(0px) rotate(-30deg); }
                        50% { transform: translateY(-20px) rotate(0deg); }
                        100% { transform: translateY(0px) rotate(30deg); }
                    }
                    @keyframes floatUpDown {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-20px); }
                    }
                `}
            </style>
        </Box>
    );
}