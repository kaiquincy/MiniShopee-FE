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
import { useEffect, useState } from "react";
import { FiArrowRight, FiPackage, FiShield, FiTrendingUp } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { fetchProducts } from '../api/products';
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
    const [deals, setDeals] = useState([])

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

    const getLocalDateKey = () => {
        const d = new Date()
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, "0")
        const dd = String(d.getDate()).padStart(2, "0")
        return `${yyyy}-${mm}-${dd}` // local day key
    }

    const getEndOfDayTs = () => {
        const d = new Date()
        d.setHours(23, 59, 59, 999)
        return d.getTime()
    }

    const pickRandom = (arr, n) => {
        const copy = [...arr]
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]]
        }
        return copy.slice(0, n)
    }

    async function getTodaysHotDeals(fetchProducts) {
        const key = `hotDeals:${getLocalDateKey()}`
        const cachedRaw = localStorage.getItem(key)

        if (cachedRaw) {
            const cached = JSON.parse(cachedRaw)
            if (cached?.expiresAt && Date.now() < cached.expiresAt && Array.isArray(cached.items)) {
                return cached.items
            }
        }

        const res = await fetchProducts({ page: 0, size: 20 })
        const products = res?.content ?? res ?? []

        const deals = pickRandom(products, 4)

        localStorage.setItem(
            key,
            JSON.stringify({ expiresAt: getEndOfDayTs(), items: deals })
        )

        return deals
    }

    const pad2 = (n) => String(n).padStart(2, "0")
    const digits2 = (n) => pad2(n).split("")

    const msUntilMidnight = () => {
        const now = new Date()
        const midnight = new Date(now)
        midnight.setHours(24, 0, 0, 0)
        return midnight.getTime() - now.getTime()
    }

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                const items = await getTodaysHotDeals(fetchProducts)
                if (alive) setDeals(items)
            } catch (err) {
                console.error("Failed to load today's hot deals:", err)
                if (alive) setDeals([])
            }
        })()

        return () => {
            alive = false
        }
    }, [fetchProducts, setDeals])

    const DigitBox = ({ digit }) => (
        <Box
            position="relative"
            w={{ base: "28px", md: "32px" }}
            h={{ base: "36px", md: "40px" }}
            borderRadius="md"
            overflow="hidden"
            bg="#EA580C"                 // bottom half
            border="1px solid"
            borderColor="blackAlpha.200"
            _before={{
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            h: "50%",
            bg: "rgba(255,255,255,0.14)" // top half tint
            }}
            display="flex"
            alignItems="center"
            justifyContent="center"
        >
            <Text position="relative" fontWeight="black" color="white" fontSize={{ base: "xl", md: "2xl" }}>
                {digit}
            </Text>
        </Box>
    )

    function DealsCountdown() {
        const [leftMs, setLeftMs] = useState(msUntilMidnight())

        useEffect(() => {
            const tick = () => setLeftMs(msUntilMidnight())
            tick()

            const id = setInterval(tick, 1000)
            return () => clearInterval(id)
        }, [])

        const totalSec = Math.max(0, Math.floor(leftMs / 1000))
        const hours = Math.floor(totalSec / 3600)
        const minutes = Math.floor((totalSec % 3600) / 60)
        const seconds = totalSec % 60

        return (
            <HStack gap={6} align="center">
                <Text fontSize="md" color="whiteAlpha.700">
                    Deals end in
                </Text>

                <HStack gap={1}>
                    {/* HH */}
                    <HStack gap={1}>
                        {digits2(hours).map((d, idx) => (
                            <DigitBox key={`h-${idx}`} digit={d} />
                        ))}
                    </HStack>

                    <Text fontWeight="black" fontSize={{ base: "xl", md: "2xl" }} color="#EA580C">:</Text>

                    {/* MM */}
                    <HStack gap={1}>
                        {digits2(minutes).map((d, idx) => (
                            <DigitBox key={`m-${idx}`} digit={d} />
                        ))}
                    </HStack>

                    <Text fontWeight="black" fontSize={{ base: "xl", md: "2xl" }} color="#EA580C">:</Text>

                    {/* SS */}
                    <HStack gap={1}>
                        {digits2(seconds).map((d, idx) => (
                            <DigitBox key={`s-${idx}`} digit={d} />
                        ))}
                    </HStack>
                </HStack>
            </HStack>
        )
    }

    console.log(deals)

    return (
        <Box bg="black" color="white" className="landing-scroll-container">
            {/* ================= HERO CAROUSEL ================= */}
            <Box mb={{ base: 0, md: 0 }}>
                <LandingCarousel />
            </Box>

            {/* ================= FEATURED CATEGORIES ================= */}
            <Box py={{ base: 12, md: 16, lg: 20 }} px={16} bg="gray.950" position="relative">
                {/* Decorative gradient */}
                <Box
                    position="absolute"
                    top="20%"
                    left="50%"
                    transform="translateX(-50%)"
                    w={{ base: "300px", md: "600px" }}
                    h={{ base: "300px", md: "600px" }}
                    bg="#2563EB"
                    opacity={0.5}
                    filter="blur(100px)"
                    pointerEvents="none"
                    display={{ base: "none", md: "block" }}
                />

                <Container maxW="container.2xl" position="relative" px={{ base: 4, md: 6 }}>
                    {/* Section Header */}
                    <Flex 
                        justify="space-between" 
                        align="center"
                        mb={{ base: 8, md: 12 }}
                        flexWrap="wrap"
                        gap={4}
                    >
                        <Box>
                            <HStack mb={2}>
                                <Box w={{ base: "30px", md: "40px" }} h="2px" bg="brand.500" />
                                <Text 
                                    fontSize={{ base: "xs", md: "sm" }}
                                    fontWeight="bold" 
                                    color="brand.500"
                                    textTransform="uppercase"
                                    letterSpacing="wider"
                                >
                                    Explore
                                </Text>
                            </HStack>
                            <Text
                                fontSize={{ base: "2xl", md: "3xl", lg: "4xl" }}
                                fontWeight="black"
                            >
                                Shop by Category
                            </Text>
                        </Box>
                        <Button
                            variant="outline"
                            borderColor="white"
                            color="white"
                            size={{ base: "md", md: "lg" }}
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
                        templateColumns={{ 
                            base: "repeat(2, 1fr)", 
                            md: "repeat(3, 1fr)", 
                            lg: "repeat(4, 1fr)" 
                        }}
                        gap={{ base: 3, md: 4, lg: 6 }}
                    >
                        {categories.map((item, idx) => (
                            <Box
                                key={idx}
                                position="relative"
                                h={{ base: "160px", md: "200px", lg: "240px" }}
                                overflow="hidden"
                                cursor="pointer"
                                onClick={() => nav('/products&category=/products?category=Men%27s%20fashion')}
                                transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                                role="group"
                                _hover={{
                                    transform: { base: "scale(0.98)", md: "translateY(-8px)" }
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
                                    h={{ base: "3px", md: "4px" }}
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
                                    px={2}
                                >
                                    <Text
                                        fontSize={{ base: "lg", md: "xl", lg: "2xl" }}
                                        fontWeight="black"
                                        color="white"
                                        mb={{ base: 1, md: 2 }}
                                        textTransform="uppercase"
                                        letterSpacing="wider"
                                        textAlign="center"
                                    >
                                        {item.label}
                                    </Text>
                                    <Text 
                                        fontSize={{ base: "xs", md: "sm" }}
                                        color="whiteAlpha.700"
                                        opacity={0}
                                        transform="translateY(10px)"
                                        transition="all 0.3s"
                                        _groupHover={{
                                            opacity: 1,
                                            transform: "translateY(0)"
                                        }}
                                        display={{ base: "none", md: "block" }}
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
            <Box bg="black" py={{ base: 12, md: 16, lg: 20 }} px={16} position="relative">
                <Container maxW="container.2xl" position="relative" px={{ base: 4, md: 6 }}>
                    {/* Section Header */}
                    <Flex 
                        justify="space-between" 
                        align={{ base: "start", md: "center" }} 
                        mb={{ base: 8, md: 12 }} 
                        flexWrap="wrap" 
                        gap={4}
                        direction={{ base: "column", md: "row" }}
                    >
                        <Box w="full">
                            <HStack w="full" justifyContent="space-between" mb={2}>
                                <HStack>
                                    <FiTrendingUp size={20} color="#EA580C" />
                                    <Text 
                                        fontSize={{ base: "xs", md: "sm" }}
                                        fontWeight="bold" 
                                        color="#EA580C"
                                        textTransform="uppercase"
                                        letterSpacing="wider"
                                    >
                                        Hot Deals
                                    </Text>
                                </HStack>
                            </HStack>
                            <HStack w="full" justifyContent="space-between">
                                <Text
                                    fontSize={{ base: "2xl", md: "3xl", lg: "4xl" }}
                                    fontWeight="black"
                                >
                                    Today's Best Picks
                                </Text>
                                <DealsCountdown />
                            </HStack>
                            <Text color="whiteAlpha.600" mt={2} fontSize={{ base: "sm", md: "md" }}>
                                Limited time offers
                            </Text>
                        </Box>
                    </Flex>

                    {/* Products Grid */}
                    <Grid
                        templateColumns={{ 
                            base: "repeat(2, 1fr)", 
                            md: "repeat(3, 1fr)", 
                            lg: "repeat(4, 1fr)" 
                        }}
                        gap={{ base: 3, md: 4, lg: 6 }}
                    >
                        {deals.map((p, key) => (
                            <Box
                                key={key}
                                bg="gray.900"
                                border="1px solid"
                                borderColor="whiteAlpha.200"
                                overflow="hidden"
                                transition="all 0.3s"
                                cursor="pointer"
                                _hover={{
                                    borderColor: "#EA580C",
                                    transform: { base: "scale(0.98)", md: "translateY(-4px)" }
                                }}
                                onClick={() => nav(`/product/${p.id}`)}
                            >
                                {/* Product Image */}
                                <Box
                                    h={{ base: "140px", md: "180px", lg: "200px" }}
                                    bg="gray.800"
                                    position="relative"
                                    overflow="hidden"
                                >
                                    <Image
                                        src={`${import.meta.env.VITE_API_URL}/uploads/${p.imageUrl}`}
                                        alt={p.name}
                                        w="full"
                                        h="200px"
                                        objectFit="cover"
                                        transition="transform 0.3s"
                                        _hover={{ transform: 'scale(1.05)' }}
                                        onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = `https://dummyimage.com/400x300/228be6/ffffff.jpg&text=${encodeURIComponent(p.name)}`;
                                        }}
                                    />
                                    <Box
                                        position="absolute"
                                        top={2}
                                        right={2}
                                        bg="#EA580C"
                                        color="white"
                                        px={{ base: 2, md: 3 }}
                                        py={1}
                                        fontSize="xs"
                                        fontWeight="bold"
                                    >
                                        {p.discountPrice ? Math.round(100 - (p.price / p.discountPrice) * 100) : 0}%
                                    </Box>
                                </Box>

                                {/* Product Info */}
                                <Box p={{ base: 3, md: 4 }} display="flex" flexDirection="column" justifyContent="space-between" minH="205px" >
                                    <Text
                                        fontWeight="bold"
                                        mb={2}
                                        fontSize={{ base: "sm", md: "md", lg: "lg" }}
                                        lineClamp={3}
                                        >
                                        {p.name}
                                    </Text>

                                    <Box>
                                        <HStack justifyContent="flex-end" gap={2} mb={3}>
                                            <Text
                                                fontWeight="black"
                                                color="#EA580C"
                                                fontSize={{ base: "lg", md: "xl", lg: "2xl" }}
                                            >
                                                {p.price}$
                                            </Text>
                                            <Text
                                                fontSize={{ base: "xs", md: "sm" }}
                                                color="whiteAlpha.500"
                                                textDecoration="line-through"
                                            >
                                                {p.discountPrice}
                                            </Text>
                                        </HStack>
                                        <Button
                                            mt="auto"
                                            w="full"
                                            bg="white"
                                            color="black"
                                            size={{ base: "xs", md: "sm" }}
                                            borderRadius="none"
                                            fontWeight="bold"
                                            _hover={{ bg: "#EA580C", color: "white" }}
                                        >
                                            View product
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* ================= FEATURES BANNER ================= */}
            <Box bg="gray.950" py={{ base: 10, md: 12, lg: 16 }} px={16}>
                <Container maxW="container.2xl" px={{ base: 4, md: 6 }}>
                    <Grid
                        templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
                        gap={{ base: 4, md: 6, lg: 8 }}
                    >
                        <HStack 
                            spacing={{ base: 3, md: 4 }} 
                            p={{ base: 4, md: 6 }} 
                            bg="whiteAlpha.50" 
                            borderLeft="3px solid" 
                            borderColor="#2563EB"
                        >
                            <Box
                                w={{ base: "40px", md: "50px" }}
                                h={{ base: "40px", md: "50px" }}
                                bg="#2563EB33"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                flexShrink={0}
                            >
                                <FiPackage size={24} color="#2563EB" />
                            </Box>
                            <Box>
                                <Text fontWeight="bold" mb={1} fontSize={{ base: "sm", md: "md" }}>Free Shipping</Text>
                                <Text fontSize={{ base: "xs", md: "sm" }} color="whiteAlpha.600">Orders over $50</Text>
                            </Box>
                        </HStack>

                        <HStack 
                            spacing={{ base: 3, md: 4 }} 
                            p={{ base: 4, md: 6 }} 
                            bg="whiteAlpha.50" 
                            borderLeft="3px solid" 
                            borderColor="#16A34A"
                        >
                            <Box
                                w={{ base: "40px", md: "50px" }}
                                h={{ base: "40px", md: "50px" }}
                                bg="#16A34A33"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                flexShrink={0}
                            >
                                <FiShield size={24} color="#16A34A" />
                            </Box>
                            <Box>
                                <Text fontWeight="bold" mb={1} fontSize={{ base: "sm", md: "md" }}>Secure Payment</Text>
                                <Text fontSize={{ base: "xs", md: "sm" }} color="whiteAlpha.600">100% protected</Text>
                            </Box>
                        </HStack>

                        <HStack 
                            spacing={{ base: 3, md: 4 }} 
                            p={{ base: 4, md: 6 }} 
                            bg="whiteAlpha.50" 
                            borderLeft="3px solid" 
                            borderColor="#9333EA"
                        >
                            <Box
                                w={{ base: "40px", md: "50px" }}
                                h={{ base: "40px", md: "50px" }}
                                bg="#9333EA33"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                flexShrink={0}
                            >
                                <FiTrendingUp size={24} color="#9333EA" />
                            </Box>
                            <Box>
                                <Text fontWeight="bold" mb={1} fontSize={{ base: "sm", md: "md" }}>Best Prices</Text>
                                <Text fontSize={{ base: "xs", md: "sm" }} color="whiteAlpha.600">Guaranteed lowest</Text>
                            </Box>
                        </HStack>
                    </Grid>
                </Container>
            </Box>

            {/* ================= NEWSLETTER ================= */}
            <Box bg="black" py={{ base: 12, md: 16, lg: 20 }} px={16} position="relative" overflow="hidden">
                <Container maxW="container.lg" position="relative" textAlign="center" px={{ base: 4, md: 6 }}>
                    <VStack spacing={{ base: 4, md: 6 }}>
                        <Box>
                            <HStack justify="center" mb={3}>
                                <Box w={{ base: "30px", md: "40px" }} h="2px" bg="brand.500" />
                                <Text 
                                    fontSize={{ base: "xs", md: "sm" }}
                                    fontWeight="bold" 
                                    color="brand.500"
                                    textTransform="uppercase"
                                    letterSpacing="wider"
                                >
                                    Newsletter
                                </Text>
                                <Box w={{ base: "30px", md: "40px" }} h="2px" bg="brand.500" />
                            </HStack>
                            <Text 
                                fontSize={{ base: "2xl", md: "3xl", lg: "5xl" }} 
                                fontWeight="black" 
                                mb={4}
                            >
                                Stay in the Loop
                            </Text>
                            <Text 
                                color="whiteAlpha.600" 
                                fontSize={{ base: "sm", md: "md", lg: "lg" }}
                                maxW="2xl" 
                                mx="auto"
                                px={{ base: 4, md: 0 }}
                            >
                                Get exclusive deals, new arrivals, and insider updates delivered straight to your inbox.
                            </Text>
                        </Box>

                        <Flex
                            maxW="lg"
                            w="full"
                            bg="gray.900"
                            border="1px solid"
                            borderColor="whiteAlpha.200"
                            p={{ base: 1.5, md: 2 }}
                            align="center"
                            gap={2}
                            direction={{ base: "column", sm: "row" }}
                        >
                            <Input
                                placeholder="Enter your email address"
                                border="none"
                                color="white"
                                _placeholder={{ color: "whiteAlpha.500" }}
                                _focus={{ outline: "none" }}
                                flex={1}
                                size={{ base: "md", md: "lg" }}
                            />
                            <Button
                                bg="brand.500"
                                color="white"
                                px={{ base: 6, md: 8 }}
                                borderRadius="none"
                                fontWeight="bold"
                                _hover={{ bg: "brand.600" }}
                                w={{ base: "full", sm: "auto" }}
                                size={{ base: "md", md: "lg" }}
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