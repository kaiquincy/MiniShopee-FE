import {
    Box,
    Button,
    Container,
    Flex,
    Grid,
    HStack,
    Image,
    Input,
    Text,
    VStack
} from "@chakra-ui/react";
import { FiArrowRight, FiPackage, FiShield, FiTrendingUp } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import applianceIcon from "../assets/landingpage/appliance.jpg";
import beautyIcon from "../assets/landingpage/beauty.jpg";
import booksIcon from "../assets/landingpage/books.jpg";
import fashionIcon from "../assets/landingpage/fashion.jpg";
import furnitureIcon from "../assets/landingpage/furniture.png";
import petIcon from "../assets/landingpage/pet.jpg";
import sportsIcon from "../assets/landingpage/sports.jpg";
import techIcon from "../assets/landingpage/tech.jpg";
import LandingCarousel from "../components/LandingCarousel";

export default function LandingPage() {
    const nav = useNavigate();

    const categories = [
        { label: "Fashion", img: fashionIcon, color: "#EA580C" },
        { label: "Tech", img: techIcon, color: "#2563EB" },
        { label: "Furniture", img: furnitureIcon, color: "#16A34A" },
        { label: "Books", img: booksIcon, color: "#9333EA" },
        { label: "Pet", img: petIcon, color: "#DB2777" },
        { label: "Beauty", img: beautyIcon, color: "#0891B2" },
        { label: "Sports", img: sportsIcon, color: "#CA8A04" },
        { label: "Appliances", img: applianceIcon, color: "#DC2626" }
    ];

    return (
        <Box bg="black" color="white">
            {/* ================= HERO CAROUSEL ================= */}
            <LandingCarousel />

            {/* ================= FEATURED CATEGORIES ================= */}
            <Box py={20} bg="gray.950" position="relative">
                {/* Decorative gradient */}
                <Box
                    position="absolute"
                    top="0"
                    left="50%"
                    transform="translateX(-50%)"
                    w="600px"
                    h="600px"
                    bg="#2563EB"
                    opacity={0.05}
                    filter="blur(100px)"
                    pointerEvents="none"
                />

                <Container maxW="container.2xl" position="relative">
                    {/* Section Header */}
                    <Flex 
                        justify="space-between" 
                        align="center" 
                        mb={12}
                        flexWrap="wrap"
                        gap={4}
                    >
                        <Box>
                            <HStack mb={2}>
                                <Box w="40px" h="2px" bg="brand.500" />
                                <Text 
                                    fontSize="sm" 
                                    fontWeight="bold" 
                                    color="brand.500"
                                    textTransform="uppercase"
                                    letterSpacing="wider"
                                >
                                    Explore
                                </Text>
                            </HStack>
                            <Text
                                fontSize={{ base: "3xl", md: "4xl" }}
                                fontWeight="black"
                            >
                                Shop by Category
                            </Text>
                        </Box>
                        <Button
                            variant="outline"
                            borderColor="white"
                            color="white"
                            size="lg"
                            borderRadius="none"
                            rightIcon={<FiArrowRight />}
                            _hover={{ bg: "whiteAlpha.100" }}
                            onClick={() => nav('/products')}
                        >
                            View All
                        </Button>
                    </Flex>

                    {/* Categories Grid */}
                    <Grid
                        templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }}
                        gap={6}
                    >
                        {categories.map((item, idx) => (
                            <Box
                                key={idx}
                                position="relative"
                                h="240px"
                                overflow="hidden"
                                cursor="pointer"
                                onClick={() => nav('/products')}
                                transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                                _hover={{
                                    transform: "translateY(-8px)"
                                }}
                            >
                                {/* Background Image */}
                                <Image
                                    src={item.img}
                                    alt={item.label}
                                    objectFit="cover"
                                    position="absolute"
                                    inset="0"
                                    w="100%"
                                    h="100%"
                                    transition="all 0.4s"
                                    _groupHover={{ transform: "scale(1.1)" }}
                                />
                                
                                {/* Overlay */}
                                <Box
                                    position="absolute"
                                    inset="0"
                                    bg="blackAlpha.700"
                                    transition="all 0.4s"
                                    _groupHover={{ bg: "blackAlpha.600" }}
                                />

                                {/* Colored accent line */}
                                <Box
                                    position="absolute"
                                    bottom="0"
                                    left="0"
                                    right="0"
                                    h="4px"
                                    bg={item.color}
                                    transition="all 0.3s"
                                />

                                {/* Content */}
                                <Flex
                                    direction="column"
                                    align="center"
                                    justify="center"
                                    h="100%"
                                    position="relative"
                                    zIndex={1}
                                >
                                    <Text
                                        fontSize="2xl"
                                        fontWeight="black"
                                        color="white"
                                        mb={2}
                                        textTransform="uppercase"
                                        letterSpacing="wider"
                                    >
                                        {item.label}
                                    </Text>
                                    <Text 
                                        fontSize="sm" 
                                        color="whiteAlpha.700"
                                        opacity={0}
                                        transform="translateY(10px)"
                                        transition="all 0.3s"
                                        _groupHover={{
                                            opacity: 1,
                                            transform: "translateY(0)"
                                        }}
                                    >
                                        Explore Collection →
                                    </Text>
                                </Flex>
                            </Box>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* ================= DAILY DEALS ================= */}
            <Box bg="black" py={20} position="relative">
                {/* Decorative gradient */}
                <Box
                    position="absolute"
                    bottom="0"
                    right="10%"
                    w="500px"
                    h="500px"
                    bg="#EA580C"
                    opacity={0.08}
                    filter="blur(100px)"
                    pointerEvents="none"
                />

                <Container maxW="container.2xl" position="relative">
                    {/* Section Header */}
                    <Flex justify="space-between" align="center" mb={12} flexWrap="wrap" gap={4}>
                        <Box>
                            <HStack mb={2}>
                                <FiTrendingUp size={20} color="#EA580C" />
                                <Text 
                                    fontSize="sm" 
                                    fontWeight="bold" 
                                    color="#EA580C"
                                    textTransform="uppercase"
                                    letterSpacing="wider"
                                >
                                    Hot Deals
                                </Text>
                            </HStack>
                            <Text
                                fontSize={{ base: "3xl", md: "4xl" }}
                                fontWeight="black"
                            >
                                Today's Best Picks
                            </Text>
                            <Text color="whiteAlpha.600" mt={2}>
                                Limited time offers • Up to 60% off
                            </Text>
                        </Box>
                        <Text
                            fontSize="6xl"
                            fontWeight="black"
                            color="whiteAlpha.100"
                            display={{ base: "none", lg: "block" }}
                        >
                            SALE
                        </Text>
                    </Flex>

                    {/* Products Grid */}
                    <Grid
                        templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }}
                        gap={6}
                    >
                        {[1, 2, 3, 4].map((item) => (
                            <Box
                                key={item}
                                bg="gray.900"
                                border="1px solid"
                                borderColor="whiteAlpha.200"
                                overflow="hidden"
                                transition="all 0.3s"
                                cursor="pointer"
                                _hover={{
                                    borderColor: "#EA580C",
                                    transform: "translateY(-4px)"
                                }}
                                onClick={() => nav('/products')}
                            >
                                {/* Product Image */}
                                <Box
                                    h="200px"
                                    bg="gray.800"
                                    position="relative"
                                    overflow="hidden"
                                >
                                    <Box
                                        position="absolute"
                                        top={3}
                                        right={3}
                                        bg="#EA580C"
                                        color="white"
                                        px={3}
                                        py={1}
                                        fontSize="xs"
                                        fontWeight="bold"
                                    >
                                        -50%
                                    </Box>
                                </Box>

                                {/* Product Info */}
                                <Box p={4}>
                                    <Text 
                                        fontWeight="bold" 
                                        mb={2}
                                        fontSize="lg"
                                    >
                                        Premium Product {item}
                                    </Text>
                                    <HStack spacing={2} mb={3}>
                                        <Text
                                            fontWeight="black"
                                            color="#EA580C"
                                            fontSize="2xl"
                                        >
                                            $99
                                        </Text>
                                        <Text
                                            fontSize="sm"
                                            color="whiteAlpha.500"
                                            textDecoration="line-through"
                                        >
                                            $199
                                        </Text>
                                    </HStack>
                                    <Button
                                        w="full"
                                        bg="white"
                                        color="black"
                                        size="sm"
                                        borderRadius="none"
                                        fontWeight="bold"
                                        _hover={{ bg: "#EA580C", color: "white" }}
                                    >
                                        Add to Cart
                                    </Button>
                                </Box>
                            </Box>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* ================= FEATURES BANNER ================= */}
            <Box bg="gray.950" py={16}>
                <Container maxW="container.2xl">
                    <Grid
                        templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
                        gap={8}
                    >
                        <HStack spacing={4} p={6} bg="whiteAlpha.50" borderLeft="3px solid" borderColor="#2563EB">
                            <Box
                                w="50px"
                                h="50px"
                                bg="#2563EB33"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                            >
                                <FiPackage size={24} color="#2563EB" />
                            </Box>
                            <Box>
                                <Text fontWeight="bold" mb={1}>Free Shipping</Text>
                                <Text fontSize="sm" color="whiteAlpha.600">Orders over $50</Text>
                            </Box>
                        </HStack>

                        <HStack spacing={4} p={6} bg="whiteAlpha.50" borderLeft="3px solid" borderColor="#16A34A">
                            <Box
                                w="50px"
                                h="50px"
                                bg="#16A34A33"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                            >
                                <FiShield size={24} color="#16A34A" />
                            </Box>
                            <Box>
                                <Text fontWeight="bold" mb={1}>Secure Payment</Text>
                                <Text fontSize="sm" color="whiteAlpha.600">100% protected</Text>
                            </Box>
                        </HStack>

                        <HStack spacing={4} p={6} bg="whiteAlpha.50" borderLeft="3px solid" borderColor="#9333EA">
                            <Box
                                w="50px"
                                h="50px"
                                bg="#9333EA33"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                            >
                                <FiTrendingUp size={24} color="#9333EA" />
                            </Box>
                            <Box>
                                <Text fontWeight="bold" mb={1}>Best Prices</Text>
                                <Text fontSize="sm" color="whiteAlpha.600">Guaranteed lowest</Text>
                            </Box>
                        </HStack>
                    </Grid>
                </Container>
            </Box>

            {/* ================= NEWSLETTER ================= */}
            <Box bg="black" py={20} position="relative" overflow="hidden">
                {/* Large background text */}
                <Box
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    fontSize={{ base: "8xl", md: "12xl" }}
                    fontWeight="black"
                    whiteSpace="nowrap"
                    pointerEvents="none"
                >
                </Box>

                <Container maxW="container.lg" position="relative" textAlign="center">
                    <VStack spacing={6}>
                        <Box>
                            <HStack justify="center" mb={3}>
                                <Box w="40px" h="2px" bg="brand.500" />
                                <Text 
                                    fontSize="sm" 
                                    fontWeight="bold" 
                                    color="brand.500"
                                    textTransform="uppercase"
                                    letterSpacing="wider"
                                >
                                    Newsletter
                                </Text>
                                <Box w="40px" h="2px" bg="brand.500" />
                            </HStack>
                            <Text fontSize={{ base: "3xl", md: "5xl" }} fontWeight="black" mb={4}>
                                Stay in the Loop
                            </Text>
                            <Text color="whiteAlpha.600" fontSize="lg" maxW="2xl" mx="auto">
                                Get exclusive deals, new arrivals, and insider updates delivered straight to your inbox.
                            </Text>
                        </Box>

                        <Flex
                            maxW="lg"
                            w="full"
                            bg="gray.900"
                            border="1px solid"
                            borderColor="whiteAlpha.200"
                            p={2}
                            align="center"
                            gap={2}
                        >
                            <Input
                                placeholder="Enter your email address"
                                border="none"
                                color="white"
                                _placeholder={{ color: "whiteAlpha.500" }}
                                _focus={{ outline: "none" }}
                                flex={1}
                            />
                            <Button
                                bg="brand.500"
                                color="white"
                                px={8}
                                borderRadius="none"
                                fontWeight="bold"
                                _hover={{ bg: "brand.600" }}
                            >
                                Subscribe
                            </Button>
                        </Flex>

                        <Text fontSize="xs" color="whiteAlpha.500">
                            We respect your privacy. Unsubscribe at any time.
                        </Text>
                    </VStack>
                </Container>
            </Box>
        </Box>
    );
}