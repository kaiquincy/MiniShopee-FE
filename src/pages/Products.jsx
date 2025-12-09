// Products.jsx - Enhanced with Decorative Patterns

import {
  Badge,
  Box,
  Button,
  Container,
  createListCollection,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  InputAddon,
  InputGroup,
  Portal,
  Select,
  SimpleGrid,
  Spinner,
  Text,
  VStack
} from '@chakra-ui/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FiChevronLeft, FiChevronRight, FiGrid, FiPackage, FiSearch, FiStar, FiX } from 'react-icons/fi'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { fetchProducts } from '../api/products'
import CategorySidebar from '../components/CategorySidebar'
import ProductCard from '../components/ProductCard'
import { toaster } from '../components/ui/toaster'
import { useCart } from '../context/CartContext'
import { useTheme } from '../context/ThemeContext'

const sortOptions = createListCollection({
  items: [
    { label: "Price: Low → High", value: "priceAsc" },
    { label: "Price: High → Low", value: "priceDesc" },
  ],
})

export default function Products() {
  const { theme } = useTheme()
  
  const [loading, setLoading] = useState(true)
  const [loadingPage, setLoadingPage] = useState(false)
  const [data, setData] = useState({ content: [], totalElements: 0 })
  const [category, setCategory] = useState(null)
  const [sort, setSort] = useState([])
  const [searchInput, setSearchInput] = useState('')

  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()

  const q = params.get('q') || ''

  const [page, setPage] = useState(0)
  const size = 20

  const query = useMemo(() => ({
    name: q || undefined,
    categoryId: category?.id || undefined,
    sort: sort[0] || undefined,
    page,
    size
  }), [q, category, sort, page, size])

  const totalPages = useMemo(() => data?.totalPages || 1, [data?.totalPages])

  const abortRef = useRef(null)
  useEffect(() => {
    const controller = new AbortController()
    abortRef.current?.abort()
    abortRef.current = controller

    const isFirstLoad = page === 0 && data.totalElements === 0 && !loadingPage
    isFirstLoad ? setLoading(true) : setLoadingPage(true)

    ;(async () => {
      try {
        const res = await fetchProducts(query, { signal: controller.signal })
        setData(res || { content: [], totalElements: 0 })
      } catch (err) {
        if (err?.name !== 'AbortError') {
          setData({ content: [], totalElements: 0 })
          toaster.create({ title: 'Could not load products', status: 'error' })
        }
      } finally {
        setLoading(false)
        setLoadingPage(false)
      }
    })()

    return () => controller.abort()
  }, [query])

  useEffect(() => { setPage(0) }, [q, category, sort])
  useEffect(() => { setSearchInput(q) }, [q])

  const handleAdd = async (pid) => {
    try {
      await addToCart(pid, 1)
      toaster.create({ title: 'Added to cart', status: 'success' })
    } catch {
      toaster.create({ title: 'Could not add to cart', status: 'error' })
    }
  }

  const handleSearch = () => {
    if (searchInput.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchInput.trim())}`)
    } else {
      navigate('/products')
    }
  }

  const clearSearch = () => {
    setSearchInput('')
    navigate('/products')
  }

  const goPrev = () => {
    setPage(p => {
      const next = Math.max(0, p - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return next
    })
  }

  const goNext = () => {
    setPage(p => {
      const next = Math.min(totalPages - 1, p + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return next
    })
  }

  const isFetching = loading || loadingPage
  const hasActiveFilters = !!q || !!category

  return (
    <Box bg={theme.pageBg} minH="100vh" py={8} transition="all 0.2s ease" position="relative" overflow="hidden">
      {/* Decorative Background Patterns */}
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        pointerEvents="none"
        style={{
          background: theme.isLight
            ? 'radial-gradient(circle at 15% 20%, rgba(59, 130, 246, 0.18) 0%, transparent 55%), radial-gradient(circle at 85% 70%, rgba(139, 92, 246, 0.16) 0%, transparent 55%)'
            : 'radial-gradient(circle at 15% 20%, rgba(59, 130, 246, 0.28) 0%, transparent 55%), radial-gradient(circle at 85% 70%, rgba(139, 92, 246, 0.24) 0%, transparent 55%)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Top-right glow */}
      <Box
        position="absolute"
        top="10%"
        right="8%"
        w="250px"
        h="250px"
        borderRadius="full"
        bg={theme.isLight ? 'rgba(59,130,246,0.45)' : 'rgba(59,130,246,0.65)'}
        filter="blur(70px)"
        pointerEvents="none"
        zIndex={0}
        animation="float 10s ease-in-out infinite"
      />

      {/* Bottom-left glow */}
      <Box
        position="absolute"
        bottom="15%"
        left="5%"
        w="220px"
        h="220px"
        borderRadius="full"
        bg={theme.isLight ? 'rgba(139,92,246,0.4)' : 'rgba(139,92,246,0.6)'}
        filter="blur(60px)"
        pointerEvents="none"
        zIndex={0}
        animation="float 12s ease-in-out infinite reverse"
      />

      <Container maxW="container.2xl" position="relative" zIndex={1}>
        <Box mb={8}>
          <Flex justify="space-between" align="start" mb={4} flexWrap="wrap" gap={4}>
            <Box>
              <HStack spacing={3} mb={3}>
                <Box
                  w="48px"
                  h="48px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  borderRadius="xl"
                  background={theme.isLight 
                    ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                    : 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)'
                  }
                  boxShadow="0 4px 12px rgba(59, 130, 246, 0.3)"
                >
                  <Icon as={FiGrid} boxSize={6} color="white" />
                </Box>
                <Text fontSize="4xl" fontWeight="black" color={theme.text}>
                  Products
                </Text>
              </HStack>
              <Text color={theme.textMuted} fontSize="lg">
                Browse and discover quality products
              </Text>
            </Box>
          </Flex>
        </Box>

        <Flex gap={6} align="start">
          {/* Enhanced Sidebar */}
          <Box
            w="280px"
            display={{ base: 'none', lg: 'block' }}
            position="sticky"
            top={4}
          >
            <Box 
              bg={theme.cardBg} 
              borderRadius="xl" 
              p={5} 
              border="1px solid" 
              borderColor={theme.border}
              transition="all 0.2s ease"
              boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.05)"
              position="relative"
              overflow="hidden"
            >
              {/* Subtle gradient overlay */}
              <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                h="100px"
                background={theme.isLight
                  ? 'linear-gradient(180deg, rgba(59, 130, 246, 0.04) 0%, transparent 100%)'
                  : 'linear-gradient(180deg, rgba(59, 130, 246, 0.08) 0%, transparent 100%)'
                }
                pointerEvents="none"
              />
              
              <HStack spacing={2} mb={4} position="relative">
                <Icon as={FiStar} color={theme.accent} boxSize={4} />
                <Text fontSize="sm" fontWeight="bold" color={theme.text} textTransform="uppercase" letterSpacing="wide">
                  Categories
                </Text>
              </HStack>
              <Box position="relative">
                <CategorySidebar onChange={setCategory} activeId={category?.id} theme={theme} />
              </Box>
            </Box>
          </Box>

          {/* Main Content */}
          <Box flex={1}>
            {/* Active Filters */}
            {hasActiveFilters && (
              <HStack spacing={3} mb={4} flexWrap="wrap">
                <Text fontWeight="semibold" color={theme.textSecondary} fontSize="sm">
                  {data.totalElements} {data.totalElements === 1 ? 'product' : 'products'} found
                </Text>

                {category && (
                  <Badge
                    background={theme.isLight 
                      ? 'linear-gradient(135deg, #E7F5FF 0%, #D0EBFF 100%)' 
                      : 'linear-gradient(135deg, #1E3A5F 0%, #1E40AF 100%)'
                    }
                    color={theme.isLight ? "#1971C2" : "#60A5FA"}
                    px={3}
                    py={1.5}
                    borderRadius="md"
                    fontSize="sm"
                    display="flex"
                    alignItems="center"
                    gap={2}
                    fontWeight="semibold"
                    border="1px solid"
                    borderColor={theme.isLight ? "#A5D8FF" : "#1E40AF"}
                  >
                    {category.name}
                    <Icon
                      as={FiX}
                      boxSize={3}
                      cursor="pointer"
                      onClick={() => setCategory(null)}
                      _hover={{ opacity: 0.7 }}
                    />
                  </Badge>
                )}

                {q && (
                  <Badge
                    background={theme.isLight 
                      ? 'linear-gradient(135deg, #FFF3BF 0%, #FFE066 100%)' 
                      : 'linear-gradient(135deg, #78350F 0%, #92400E 100%)'
                    }
                    color={theme.isLight ? "#E67700" : "#FCD34D"}
                    px={3}
                    py={1.5}
                    borderRadius="md"
                    fontSize="sm"
                    display="flex"
                    alignItems="center"
                    gap={2}
                    fontWeight="semibold"
                    border="1px solid"
                    borderColor={theme.isLight ? "#FFD43B" : "#92400E"}
                  >
                    Search: {q}
                    <Icon
                      as={FiX}
                      boxSize={3}
                      cursor="pointer"
                      onClick={clearSearch}
                      _hover={{ opacity: 0.7 }}
                    />
                  </Badge>
                )}
              </HStack>
            )}

            {/* Enhanced Toolbar */}
            <Flex
              bg={theme.cardBg}
              borderRadius="xl"
              p={4}
              mb={6}
              border="1px solid"
              borderColor={theme.border}
              gap={3}
              align="center"
              flexWrap={{ base: "wrap", md: "nowrap" }}
              transition="all 0.2s ease"
              boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.05)"
            >
              {/* Search Input */}
              <Flex flex={1} minW={{ base: "full", md: "300px" }}>
                <InputGroup 
                  startElement={<Icon as={FiSearch} color={theme.textPlaceholder} />}
                  endElement={q && (
                    <InputAddon placement="end" bg="transparent" border="none">
                      <IconButton
                        size="xs"
                        variant="ghost"
                        aria-label="Clear search"
                        onClick={clearSearch}
                      >
                        <Icon as={FiX} color={theme.textMuted} />
                      </IconButton>
                    </InputAddon>
                  )}
                >
                  <Input
                    placeholder="Search products by name..."
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    bg={theme.inputBg}
                    border="1px solid"
                    borderColor={theme.border}
                    color={theme.text}
                    h="48px"
                    fontSize="md"
                    borderRadius="lg"
                    _placeholder={{ color: theme.textPlaceholder }}
                    _hover={{ borderColor: theme.borderLight }}
                    _focus={{ borderColor: theme.accent, boxShadow: `0 0 0 3px ${theme.isLight ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.2)'}` }}
                  />
                </InputGroup>
              </Flex>

              {/* Search Button */}
              <Button
                onClick={handleSearch}
                background={theme.isLight 
                  ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                  : 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)'
                }
                color="white"
                px={8}
                h="48px"
                borderRadius="lg"
                flexShrink={0}
                boxShadow="0 4px 12px rgba(59, 130, 246, 0.3)"
                _hover={{ 
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(59, 130, 246, 0.4)'
                }}
                transition="all 0.2s ease"
              >
                Search
              </Button>

              {/* Sort Dropdown */}
              <Select.Root
                collection={sortOptions}
                value={sort}
                onValueChange={(e) => setSort(e.value)}
                width={{ base: "full", md: "200px" }}
                flexShrink={0}
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger
                    bg={theme.cardBg}
                    color={theme.textSecondary}
                    h="48px"
                    borderRadius="lg"
                    borderColor={theme.border}
                    _hover={{ bg: theme.hoverBg }}
                  >
                    <Select.ValueText placeholder="Sort by" />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content bg={theme.cardBg} shadow="lg" borderRadius="lg" borderColor={theme.border}>
                      {sortOptions.items.map((option) => (
                        <Select.Item item={option} key={option.value} color={theme.text} _hover={{ bg: theme.hoverBg }}>
                          {option.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Flex>

            {/* Loading State */}
            {isFetching && (
              <Flex py={20} justify="center" align="center">
                <VStack spacing={4}>
                  <Box position="relative">
                    <Spinner size="xl" color={theme.accent} thickness="4px" />
                    <Box
                      position="absolute"
                      inset="-10px"
                      borderRadius="full"
                      background={theme.isLight ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.2)'}
                      animation="pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                    />
                  </Box>
                  <Text color={theme.textMuted} fontWeight="medium">Loading products...</Text>
                </VStack>
              </Flex>
            )}

            {/* Content */}
            {!isFetching && (
              <>
                {data.totalElements === 0 ? (
                  <Box
                    bg={theme.cardBg}
                    borderRadius="xl"
                    p={16}
                    textAlign="center"
                    border="1px solid"
                    borderColor={theme.border}
                    transition="all 0.2s ease"
                    boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.05)"
                  >
                    <Box
                      w="120px"
                      h="120px"
                      bg={theme.secondaryBg}
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      mx="auto"
                      mb={5}
                      border="3px dashed"
                      borderColor={theme.border}
                      position="relative"
                    >
                      <Box
                        position="absolute"
                        inset="-10px"
                        borderRadius="full"
                        background={theme.isLight ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.15)'}
                        animation="pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                      />
                      <Icon as={FiPackage} boxSize={12} color={theme.textMuted} />
                    </Box>
                    <Text fontSize="2xl" fontWeight="bold" color={theme.text} mb={2}>
                      No products found
                    </Text>
                    <Text color={theme.textMuted} mb={6} maxW="md" mx="auto">
                      {hasActiveFilters 
                        ? "We couldn't find any products matching your search or filters."
                        : "No products available at the moment."}
                    </Text>
                    {hasActiveFilters && (
                      <Button
                        onClick={() => {
                          setCategory(null)
                          setSort([])
                          clearSearch()
                        }}
                        background={theme.isLight 
                          ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                          : 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)'
                        }
                        color="white"
                        px={8}
                        py={6}
                        borderRadius="lg"
                        boxShadow="0 4px 12px rgba(59, 130, 246, 0.3)"
                        _hover={{ 
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 16px rgba(59, 130, 246, 0.4)'
                        }}
                        transition="all 0.2s ease"
                      >
                        Clear All Filters
                      </Button>
                    )}
                  </Box>
                ) : (
                  <>
                    {/* Products Grid */}
                    <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} gap={4} mb={6}>
                      {data?.content?.map((p) => (
                        <ProductCard key={p.id} p={p} onAdd={handleAdd} theme={theme} />
                      ))}
                    </SimpleGrid>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <Flex
                        justify="center"
                        align="center"
                        gap={3}
                        bg={theme.cardBg}
                        p={5}
                        borderRadius="xl"
                        border="1px solid"
                        borderColor={theme.border}
                        flexWrap="wrap"
                        transition="all 0.2s ease"
                        boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.05)"
                      >
                        <Button
                          onClick={goPrev}
                          isDisabled={page === 0}
                          size="sm"
                          leftIcon={<FiChevronLeft />}
                          bg={theme.cardBg}
                          border="1px solid"
                          borderColor={theme.border}
                          color={theme.textSecondary}
                          _hover={{ bg: theme.hoverBg }}
                          _disabled={{ opacity: 0.4 }}
                        >
                          Previous
                        </Button>

                        <HStack spacing={2}>
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum
                            if (totalPages <= 5) {
                              pageNum = i
                            } else if (page < 3) {
                              pageNum = i
                            } else if (page > totalPages - 4) {
                              pageNum = totalPages - 5 + i
                            } else {
                              pageNum = page - 2 + i
                            }

                            return (
                              <Button
                                key={pageNum}
                                onClick={() => setPage(pageNum)}
                                size="sm"
                                minW="40px"
                                background={page === pageNum 
                                  ? theme.isLight 
                                    ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                                    : 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)'
                                  : theme.cardBg
                                }
                                color={page === pageNum ? "white" : theme.textSecondary}
                                border="1px solid"
                                borderColor={page === pageNum ? 'transparent' : theme.border}
                                fontWeight="semibold"
                                boxShadow={page === pageNum ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none'}
                                _hover={{ 
                                  bg: page === pageNum ? undefined : theme.hoverBg,
                                  transform: 'translateY(-2px)'
                                }}
                                transition="all 0.2s ease"
                              >
                                {pageNum + 1}
                              </Button>
                            )
                          })}
                        </HStack>

                        <Button
                          onClick={goNext}
                          isDisabled={page + 1 >= totalPages}
                          size="sm"
                          rightIcon={<FiChevronRight />}
                          bg={theme.cardBg}
                          border="1px solid"
                          borderColor={theme.border}
                          color={theme.textSecondary}
                          _hover={{ bg: theme.hoverBg }}
                          _disabled={{ opacity: 0.4 }}
                        >
                          Next
                        </Button>
                      </Flex>
                    )}
                  </>
                )}
              </>
            )}
          </Box>
        </Flex>
      </Container>

      {/* Animations */}
      <style>
        {`
          @keyframes float {
            0%, 100% {
              transform: translate(0, 0);
            }
            50% {
              transform: translate(30px, -30px);
            }
          }
          
          @keyframes pulseRing {
            0%, 100% {
              transform: scale(1);
              opacity: 0.3;
            }
            50% {
              transform: scale(1.15);
              opacity: 0;
            }
          }
        `}
      </style>
    </Box>
  )
}