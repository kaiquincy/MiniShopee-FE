import { Badge, Box, Button, Container, Flex, Grid, HStack, Icon, IconButton, Image, Input, InputGroup, Menu, Portal, Separator, Text, VStack } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { FiArrowUpRight, FiBell, FiLogOut, FiMessageCircle, FiPackage, FiSearch, FiShoppingBag, FiShoppingCart, FiUser } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
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

    // Header menu states
    const [menuOpen, setMenuOpen] = useState(false);
    const timerRef = useRef(null);
    const enter = () => { clearTimeout(timerRef.current); timerRef.current = setTimeout(() => setMenuOpen(true), 60) };
    const leave = () => { clearTimeout(timerRef.current); timerRef.current = setTimeout(() => setMenuOpen(false), 120) };

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
                >
                    {/* Logo */}
                    <Text 
                        fontSize="2xl" 
                        fontWeight="black"
                        cursor="pointer"
                        onClick={() => nav('/')}
                    >
                        mini<Text as="span" color={activeSlide.color}>Shopee</Text>
                    </Text>

                    {/* Category Navigation */}
                    <HStack spacing={8} display={{ base: "none", lg: "flex" }}>
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

                    {/* Search Bar */}
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
                    <Flex align="center" gap={2}>
                        {/* Chat */}
                        <IconButton
                            aria-label="Chat"
                            variant="ghost"
                            fontSize="20px"
                            color="white"
                            _hover={{ bg: "whiteAlpha.200" }}
                            onClick={() => nav('/chat')}
                        >
                            <Icon as={FiMessageCircle} />
                        </IconButton>

                        {/* Notifications */}
                        <Box position="relative">
                            <IconButton
                                aria-label="Notifications"
                                variant="ghost"
                                fontSize="20px"
                                color="white"
                                _hover={{ bg: "whiteAlpha.200" }}
                                onClick={() => nav('/notifications')}
                            >
                                <Icon as={FiBell} />
                            </IconButton>
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
                                9
                            </Badge>
                        </Box>

                        {/* Cart */}
                        <Box position="relative">
                            <IconButton
                                aria-label="Cart"
                                variant="ghost"
                                fontSize="20px"
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

                        {/* User Menu */}
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
                                        fontSize="20px"
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
                                                onClick={() => nav('/account')}
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
                                                        <Icon as={FiPackage} />
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
                                fontSize="20px"
                                onClick={() => nav('/login')}
                            >
                                <Icon as={FiUser} />
                            </IconButton>
                        )}
                    </Flex>
                </HStack>

                {/* Main Content Grid */}
                <Grid
                    templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
                    gap={8}
                    minH={{ base: "600px", lg: "700px" }}
                    alignItems="center"
                    py={8}
                >
                    {/* Left - Hero Text */}
                    <VStack align="start" spacing={8}>
                        <Box>
                            {/* Category Tag */}
                            <HStack mb={4}>
                                <Box w="40px" h="2px" bg={activeSlide.color} />
                                <Text 
                                    fontSize="sm" 
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
                                fontSize={{ base: "6xl", md: "7xl", lg: "8xl" }}
                                fontWeight="black"
                                lineHeight="0.9"
                                mb={6}
                            >
                                {activeSlide.text}
                            </Text>

                            {/* Year indicator */}
                            <Text 
                                fontSize={{ base: "8xl", md: "9xl" }}
                                fontWeight="black"
                                color="whiteAlpha.500"
                                lineHeight="1"
                                position="relative"
                                top="-20px"
                            >
                                2025
                            </Text>
                        </Box>

                        {/* Description & CTA */}
                        <Box>
                            <Text 
                                fontSize="lg" 
                                color="whiteAlpha.700"
                                mb={8}
                                maxW="450px"
                            >
                                Discover the latest collection of premium {activeSlide.text.toLowerCase()} with exclusive deals up to 60% off.
                            </Text>

                            <HStack spacing={4}>
                                <Button
                                    size="lg"
                                    bg={activeSlide.color}
                                    color="white"
                                    px={8}
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
                        <HStack spacing={12} pt={4}>
                            <Box>
                                <Text fontSize="3xl" fontWeight="black">{current + 1}</Text>
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
                    <Box position="relative" h="full">
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
                                    w={{ base: "400px", lg: "550px" }}
                                    h={{ base: "400px", lg: "550px" }}
                                    borderRadius="full"
                                    border="1px solid"
                                    borderColor="whiteAlpha.200"
                                />
                                <Box
                                    position="absolute"
                                    top="50%"
                                    left="50%"
                                    transform="translate(-50%, -50%)"
                                    w={{ base: "320px", lg: "450px" }}
                                    h={{ base: "320px", lg: "450px" }}
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
                                    w={{ base: "300px", lg: "400px" }}
                                    h={{ base: "300px", lg: "400px" }}
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
                                    w="80px"
                                    h="80px"
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
                                    w="60px"
                                    h="60px"
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

                {/* Bottom Info Bar */}
                <HStack
                    justify="space-between"
                    py={6}
                    borderTop="1px solid"
                    borderColor="whiteAlpha.200"
                    flexWrap="wrap"
                    gap={4}
                >
                    <HStack spacing={2} fontSize="sm" color="whiteAlpha.600">
                        <FiArrowUpRight />
                        <Text>Scroll to explore</Text>
                    </HStack>
                    <HStack spacing={8} fontSize="sm">
                        <Text color="whiteAlpha.600">Free Shipping</Text>
                        <Text color="whiteAlpha.600">•</Text>
                        <Text color="whiteAlpha.600">Money Back Guarantee</Text>
                        <Text color="whiteAlpha.600">•</Text>
                        <Text color="whiteAlpha.600">24/7 Support</Text>
                    </HStack>
                </HStack>
            </Container>

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