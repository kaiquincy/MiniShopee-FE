import { Box, Button, Container, HStack, Image, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import camera from "../assets/landingpage/carousel/camera.png";
import headphone from "../assets/landingpage/carousel/headphone.png";
import laptop from "../assets/landingpage/carousel/laptop.png";
import perfume from "../assets/landingpage/carousel/perfume.png";
import sneakers from "../assets/landingpage/carousel/sneakers.png";
import watch from "../assets/landingpage/carousel/watch.png";

// Example lifestyle images (replace with your own)
import cameraBg from "../assets/landingpage/carousel/camera-bg.jpg";
import headphoneBg from "../assets/landingpage/carousel/headphone-bg.jpg";
import laptopBg from "../assets/landingpage/carousel/laptop-bg.jpg";
import perfumeBg from "../assets/landingpage/carousel/perfume-bg.jpg";
import sneakersBg from "../assets/landingpage/carousel/sneakers-bg.jpg";
import watchBg from "../assets/landingpage/carousel/watch-bg.jpg";

export default function LandingCarousel() {
    const [current, setCurrent] = useState(0);
    const navigate = useNavigate();

    const slides = [
        { text: "laptops", img: laptop, bg: laptopBg, color: "#E3F2FD" },
        { text: "sneakers", img: sneakers, bg: sneakersBg, color: "#FFF3E0" },
        { text: "watches", img: watch, bg: watchBg, color: "#F1F8E9" },
        { text: "headphones", img: headphone, bg: headphoneBg, color: "#FCE4EC" },
        { text: "perfume", img: perfume, bg: perfumeBg, color: "#FFF3E0" },
        { text: "camera", img: camera, bg: cameraBg, color: "#FCE4EC" },
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const goToSlide = (index) => setCurrent(index);

    return (
        <Box position="relative" w="100vw" left="50%" ml="-50vw" py={{ base: 8, md: 12 }} background="gray.800">
            <Container maxW="7xl" h={{ base: "50vh", md: "70vh" }} position="relative">
                {slides.map((slide, index) => (
                    <Box
                        key={index}
                        position="absolute"
                        inset="0"
                        opacity={index === current ? 1 : 0}
                        transition="opacity 1s ease-in-out"
                        zIndex={index === current ? 1 : 0}
                        display="flex"
                        alignItems="stretch"
                        justifyContent="space-between"
                    >
                        {/* Left: White text panel */}
                        <Box
                            bg="white"
                            p={{ base: 6, md: 10 }}
                            borderRadius="xl"
                            borderTopRightRadius="none"
                            borderBottomRightRadius="none"
                            flex="1"
                            maxW="480px"
                            display="flex"
                            flexDirection="column"
                            justifyContent="flex-end"
                        >
                            <Text
                                fontSize={{ base: "2xl", md: "4xl" }}
                                fontWeight="bold"
                                color="gray.800"
                                mb={2}
                            >
                                Buy the best <br /> {slide.text}
                            </Text>
                            <Text fontSize={{ base: "md", md: "lg" }} color="gray.600" mb={6}>
                                Exclusive deals only on <Text as="span" fontWeight="700" color="brand.700">mini-Shopee</Text>
                            </Text>
                            <Button
                                fontSize={{ base: "sm", md: "md" }}
                                bg="black"
                                color="white"
                                _hover={{ bg: "gray.700" }}
                                onClick={() => navigate(`/products`)}
                            >
                                Shop Now
                            </Button>

                            {/* Navigation dots */}
                            <HStack mt={6} spacing={2}>
                                {slides.map((_, dotIndex) => (
                                    <Box
                                        key={dotIndex}
                                        as="button"
                                        w="30px"
                                        h="6px"
                                        borderRadius="md"
                                        bg={current === dotIndex ? "black" : "gray.400"}
                                        onClick={() => goToSlide(dotIndex)}
                                        transition="all 0.3s ease"
                                    />
                                ))}
                            </HStack>
                        </Box>

                        {/* Right: Lifestyle background */}
                        <Box
                            flex="1"
                            borderRadius="xl"
                            borderTopLeftRadius="none"
                            borderBottomLeftRadius="none"
                            overflow="hidden"
                            shadow="md"
                            position="relative"
                        >
                            <Image
                                src={slide.bg}
                                alt={`${slide.text} lifestyle`}
                                w="100%"
                                h="100%"
                                objectFit="cover"
                            />
                            <Box
                                position="absolute"
                                inset="0"
                                bg="blackAlpha.400" // dark overlay
                            />
                        </Box>

                        {/* Middle: Floating PNG inside colored square */}
                        <Box
                            position="absolute"
                            top="35%"
                            left="40%"
                            transform="translate(-50%, -55%)"
                            w={{ base: "200px", md: "280px" }}
                            h={{ base: "200px", md: "280px" }}
                            bg={slide.color}
                            borderRadius="xl"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            shadow="xl"
                            zIndex={2}
                        >
                            <Image
                                src={slide.img}
                                alt={slide.text}
                                maxW="90%"
                                maxH="90%"
                                objectFit="contain"
                                filter="drop-shadow(0 8px 20px rgba(0,0,0,0.2))"
                            />
                        </Box>
                    </Box>
                ))}
            </Container>
        </Box>
    );
}
