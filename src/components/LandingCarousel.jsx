import { Box, Button, Container, HStack, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import clothes from "../assets/landingpage/carousel/clothes.png";
import laptop from "../assets/landingpage/carousel/laptop.png";
import shoes from "../assets/landingpage/carousel/shoes.png";
import watch from "../assets/landingpage/carousel/watch.png";

export default function LandingCarousel() {
    const [current, setCurrent] = useState(0);
    const navigate = useNavigate()

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const prevSlide = () =>
        setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    const nextSlide = () =>
        setCurrent((prev) => (prev + 1) % slides.length);
    const goToSlide = (index) => setCurrent(index);

    const slides = [
        { text: "laptops", img: laptop },
        { text: "watches", img: watch },
        { text: "shoes", img: shoes },
        { text: "clothes", img: clothes }
    ];

    return (
        <Box
            position="relative"
            left="50%"
            w="100vw"
            ml="-50vw"
            h={{ base: "50vh", md: "60vh" }}
            overflow="hidden"
            bg="gray.900" // dark overlay background
        >
            {slides.map((slide, index) => (
                <Box
                    key={index}
                    position="absolute"
                    inset="0"
                    opacity={index === current ? 1 : 0}
                    transition="opacity 1s ease-in-out"
                    zIndex={index === current ? 1 : 0}
                >
                    <Container
                        maxW="7xl"
                        h="100%"
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        px={{ base: 6, md: 12 }}
                    >
                        {/* Left: Text */}
                        <Box width="600px" textAlign="left">
                            <Text
                                fontSize={{ base: "2xl", md: "5xl" }}
                                fontWeight="bold"
                                textTransform="uppercase"
                                color="white"
                                textShadow="0px 2px 6px rgba(0,0,0,0.6)"
                            >
                                Buy the best {slide.text}
                            </Text>
                            <Text
                                fontSize={{ base: "2xl", md: "5xl" }}
                                fontWeight="bold"
                                color="white"
                                textShadow="0px 2px 8px rgba(0,0,0,0.5)"
                            >
                                on mini-Shopee
                            </Text>
                            <Button
                                fontSize={{ base: "md", md: "xl" }}
                                mt={3}
                                background="white"
                                color="black"
                                onClick={() => navigate(`/category/${slide.text}`)}
                            >
                                Shop now
                            </Button>

                            {/* Navigation (dots + arrows under text) */}
                            <HStack mt={6} spacing={3} alignItems="center">
                                <HStack spacing={2}>
                                    {slides.map((_, dotIndex) => (
                                    <Box
                                        key={dotIndex}
                                        as="button"
                                        w="24px" // make it longer like a line
                                        h="6px"  // smaller height
                                        borderRadius="md" // rounded edges
                                        bg={current === dotIndex ? "white" : "gray.500"}
                                        onClick={() => goToSlide(dotIndex)}
                                        _hover={{ bg: "gray.400", cursor: "pointer" }}
                                        transition="all 0.3s ease"
                                    />
                                    ))}
                                </HStack>
                            </HStack>
                        </Box>

                        {/* Right: Image with circle bg */}
                        <Box
                            flex="1"
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                        >
                            <Box
                                w={{ base: "220px", md: "320px" }}
                                h={{ base: "220px", md: "320px" }}
                                borderRadius="full"
                                display="flex"
                                justifyContent="center"
                                alignItems="center"
                                position="relative"
                                overflow="visible"
                            >
                                {/* Blurry glowing circle */}
                                <Box
                                    position="absolute"
                                    w="100%"
                                    h="100%"
                                    borderRadius="full"
                                    bg="radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.3) 60%, rgba(255,255,255,0) 100%)"
                                    filter="blur(40px)"
                                    zIndex={0}
                                />
                                <Box
                                    as="img"
                                    src={slide.img}
                                    alt={slide.text}
                                    position="absolute"
                                    maxW="none"                       // <-- critical: remove the 100% cap
                                    w={{ base: "300px", md: "420px" }}// bigger than the 220/320 circle
                                    h="auto"
                                    objectFit="contain"
                                    top="50%"
                                    left="50%"
                                    transform="translate(-50%, -50%)" // keep it centered while larger
                                    zIndex={1}
                                    pointerEvents="none"
                                    filter="drop-shadow(0 8px 24px rgba(0,0,0,0.35))"
                                />
                            </Box>
                        </Box>
                    </Container>
                </Box>
            ))}
        </Box>
    );
}
