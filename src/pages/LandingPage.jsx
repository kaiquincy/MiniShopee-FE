import {
    Box,
    Button,
    Container,
    Flex,
    Image,
    Input,
    SimpleGrid,
    Text,
    VStack
} from "@chakra-ui/react";
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
    return (
        <Box>
            {/* ================= HERO CAROUSEL ================= */}
            <LandingCarousel />

            {/* ================= FEATURED CATEGORIES ================= */}
            <Box py={20} bg="gray.50">
                <Container maxW="7xl">
                    <Text
                        fontSize="3xl"
                        fontWeight="bold"
                        textAlign="center"
                        mb={12}
                    >
                        FEATURED CATEGORIES
                    </Text>
                    <SimpleGrid columns={{ base: 2, md: 4 }} gap="12px">
                        {[
                            { label: "Fashion", img: fashionIcon },
                            { label: "Tech", img: techIcon },
                            { label: "Furniture", img: furnitureIcon },
                            { label: "Books", img: booksIcon },
                            { label: "Pet", img: petIcon },
                            { label: "Beauty", img: beautyIcon },
                            { label: "Sports", img: sportsIcon },
                            { label: "Appliances", img: applianceIcon }
                        ].map((item, idx) => (
                            <Box
                                key={idx}
                                position="relative"
                                h="200px"
                                borderRadius="xl"
                                overflow="hidden"
                                _hover={{
                                    transform: "translateY(-6px)",
                                    boxShadow: "lg"
                                }}
                                transition="all 0.3s ease"
                                cursor="pointer"
                            >
                                <Image
                                    src={item.img}
                                    alt={item.label}
                                    objectFit="cover"
                                    position="absolute"
                                    inset="0"
                                    w="100%"
                                    h="100%"
                                    opacity={0.5}
                                />
                                <Box
                                    position="absolute"
                                    inset="0"
                                    bg="blackAlpha.600"
                                />
                                <Flex
                                    align="center"
                                    justify="center"
                                    h="100%"
                                    zIndex={1}
                                    position="relative"
                                >
                                    <Text
                                        fontSize="xl"
                                        fontWeight="bold"
                                        color="white"
                                    >
                                        {item.label}
                                    </Text>
                                </Flex>
                            </Box>
                        ))}
                    </SimpleGrid>
                </Container>
            </Box>

            {/* ================= DAILY DEALS ================= */}
            <Box bg="orange.100" py={20}>
                <Container maxW="7xl">
                    <Flex justify="space-between" align="center" mb={10}>
                        <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                            Today’s Hot Picks ⚡
                        </Text>
                        <Button variant="link" colorScheme="orange">
                            View All →
                        </Button>
                    </Flex>
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={8}>
                        {[1, 2, 3, 4].map((item) => (
                            <Box
                                key={item}
                                p={5}
                                bg="white"
                                borderRadius="xl"
                                boxShadow="sm"
                                textAlign="center"
                                transition="all 0.2s"
                                _hover={{
                                    transform: "translateY(-6px)",
                                    boxShadow: "md"
                                }}
                            >
                                <Box
                                    h="150px"
                                    bg="gray.100"
                                    borderRadius="md"
                                    mb={4}
                                />
                                <Text fontWeight="medium">Product {item}</Text>
                                <Text
                                    fontWeight="bold"
                                    color="orange.500"
                                    fontSize="lg"
                                >
                                    $19.99
                                </Text>
                                <Button
                                    mt={3}
                                    size="sm"
                                    colorScheme="orange"
                                    w="full"
                                >
                                    Shop Now
                                </Button>
                            </Box>
                        ))}
                    </SimpleGrid>
                </Container>
            </Box>

            {/* ================= PROMO BANNER ================= */}
            <Box bg="teal.500" py={20} color="white">
                <Container maxW="7xl" textAlign="center">
                    <VStack spacing={4}>
                        <Text fontSize="3xl" fontWeight="bold">
                            Free Shipping Over $50 🚚
                        </Text>
                        <Text opacity={0.9} maxW="2xl">
                            No codes, no hassle — just checkout and save.
                        </Text>
                        <Button colorScheme="whiteAlpha" size="lg">
                            Start Shopping
                        </Button>
                    </VStack>
                </Container>
            </Box>

            {/* ================= COMMUNITY / STORIES ================= */}
            <Box bg="gray.900" color="white" py={20}>
                <Container maxW="7xl" textAlign="center">
                    <Text fontSize="2xl" mb={4} fontWeight="bold">
                        Join Our Community 💌
                    </Text>
                    <Text mb={8} maxW="2xl" mx="auto" opacity={0.8}>
                        Be the first to know about new arrivals, exclusive drops,
                        and behind-the-scenes stories. Sign up and stay inspired.
                    </Text>
                    <Flex
                        maxW="md"
                        mx="auto"
                        bg="white"
                        p={2}
                        borderRadius="md"
                        align="center"
                    >
                        <Input
                            placeholder="Enter your email"
                            border="none"
                            focusBorderColor="transparent"
                        />
                        <Button colorScheme="teal" px={8}>
                            Join
                        </Button>
                    </Flex>
                </Container>
            </Box>
        </Box>
    );
}
