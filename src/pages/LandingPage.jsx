import {
    Box,
    Button,
    Container,
    Flex,
    Image,
    Input,
    SimpleGrid,
    Text
} from "@chakra-ui/react";
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
            <Container maxW="7xl" px={0} py={16}>
                <Text fontSize="3xl" mb={8} fontWeight="light" textAlign="center">
                    SHOP BY CATEGORY
                </Text>
                <SimpleGrid
                    columns={{ base: 2, md: 4 }}
                    gap="10px"
                    w="full"
                >
                    {[
                        { label: "Fashion", img: fashionIcon },
                        { label: "Tech", img: techIcon },
                        { label: "Furniture", img: furnitureIcon },
                        { label: "Books", img: booksIcon },
                        { label: "Pet", img: petIcon },
                        { label: "Beauty", img: beautyIcon },
                        { label: "Sports", img: sportsIcon },
                        { label: "Others" }
                    ].map((item, idx) => (
                        <Box
                            key={idx}
                            position="relative"
                            h="200px"
                            borderRadius="xl"
                            overflow="hidden"
                            bg="gray.700"
                            _hover={{ transform: "scale(1.05)", cursor: "pointer" }}
                            transition="0.3s"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            role="group"
                        >
                            {item.img && (
                                <Image
                                src={item.img}
                                alt={item.label}
                                objectFit="cover"
                                opacity={0.4}
                                position="absolute"
                                inset="0"
                                w="100%"
                                h="100%"
                                />
                            )}
                            <Box
                                position="absolute"
                                inset="0"
                                bg="blackAlpha.200"
                            />
                            <Text
                                fontSize="xl"
                                fontWeight="bold"
                                color="white"
                                zIndex="1"
                                textAlign="center"
                            >
                                {item.label}
                            </Text>
                        </Box>
                    ))}
                </SimpleGrid>

            </Container>

            {/* ================= FLASH SALE ================= */}
            <Box bg="red.50" py={16}>
                <Container maxW="7xl">
                    <Text fontSize="2xl" mb={8} fontWeight="bold" color="red.500">
                        Flash Sale 🔥
                    </Text>
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
                        {[1, 2, 3, 4].map((item) => (
                            <Box
                                key={item}
                                p={4}
                                bg="white"
                                boxShadow="md"
                                borderRadius="lg"
                                textAlign="center"
                            >
                                <Box h="150px" bg="gray.100" mb={4} />
                                <Text>Product {item}</Text>
                                <Text fontWeight="bold" color="red.500">
                                    $19.99
                                </Text>
                                <Button mt={2} size="sm" colorScheme="red">
                                    Add to Cart
                                </Button>
                            </Box>
                        ))}
                    </SimpleGrid>
                </Container>
            </Box>

            {/* ================= PROMO BANNER ================= */}
            <Container maxW="7xl" py={16}>
                <Box
                    bg="blue.500"
                    color="white"
                    p={12}
                    borderRadius="xl"
                    textAlign="center"
                >
                    <Text fontSize="3xl" fontWeight="bold">
                        Free Shipping on Orders Over $50
                    </Text>
                    <Text mt={2}>Shop now and save big on delivery costs</Text>
                </Box>
            </Container>

            {/* ================= NEWSLETTER ================= */}
            <Box bg="gray.100" py={16}>
                <Container maxW="7xl" textAlign="center">
                    <Text fontSize="2xl" mb={4} fontWeight="bold">
                        Subscribe to our Newsletter
                    </Text>
                    <Text mb={6}>
                        Get the latest deals and exclusive offers straight to your inbox.
                    </Text>
                    <Flex maxW="md" mx="auto">
                        <Input placeholder="Enter your email" bg="white" />
                        <Button colorScheme="blue" ml={2}>
                            Subscribe
                        </Button>
                    </Flex>
                </Container>
            </Box>
        </Box>
    );
}
