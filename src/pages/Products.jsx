// Products.jsx - With Theme Support

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
import { FiChevronLeft, FiChevronRight, FiGrid, FiPackage, FiSearch, FiX } from 'react-icons/fi'
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
    <Box bg={theme.pageBg} minH="100vh" py={8} transition="all 0.2s ease">
      <Container maxW="container.2xl">
        {/* Page Header */}
        <Box mb={8}>
          <HStack spacing={3} mb={3}>
            <Icon as={FiGrid} boxSize={7} color={theme.textSecondary} />
            <Text fontSize="4xl" fontWeight="black" color={theme.text}>
              Products
            </Text>
          </HStack>
          <Text color={theme.textMuted} fontSize="lg">
            Browse and discover quality products
          </Text>
        </Box>

        <Flex gap={6} align="start">
          {/* Sidebar */}
          <Box
            w="260px"
            display={{ base: 'none', lg: 'block' }}
            position="sticky"
            top={4}
          >
            <Box 
              bg={theme.cardBg} 
              borderRadius="lg" 
              p={5} 
              border="1px solid" 
              borderColor={theme.border}
              transition="all 0.2s ease"
            >
              <Text fontSize="sm" fontWeight="bold" color={theme.textSecondary} mb={4} textTransform="uppercase" letterSpacing="wide">
                Categories
              </Text>
              <CategorySidebar onChange={setCategory} activeId={category?.id} theme={theme} />
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
                    bg={theme.isLight ? "#E7F5FF" : "#1E3A5F"}
                    color={theme.isLight ? "#1971C2" : "#60A5FA"}
                    px={3}
                    py={1.5}
                    borderRadius="md"
                    fontSize="sm"
                    display="flex"
                    alignItems="center"
                    gap={2}
                    fontWeight="semibold"
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
                    bg={theme.isLight ? "#FFF3BF" : "#78350F"}
                    color={theme.isLight ? "#E67700" : "#FCD34D"}
                    px={3}
                    py={1.5}
                    borderRadius="md"
                    fontSize="sm"
                    display="flex"
                    alignItems="center"
                    gap={2}
                    fontWeight="semibold"
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

            {/* Toolbar */}
            <Flex
              bg={theme.cardBg}
              borderRadius="lg"
              p={4}
              mb={6}
              border="1px solid"
              borderColor={theme.border}
              gap={3}
              align="center"
              flexWrap={{ base: "wrap", md: "nowrap" }}
              transition="all 0.2s ease"
            >
              {/* Search Input */}
              <Flex flex={1} minW={{ base: "full", md: "300px" }}>
                <InputGroup 
                  startElement={<Icon as={FiSearch} color={theme.textPlaceholder} />}
                  endElement={q && (
                    <InputAddon placement="end">
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
                bg={theme.primary}
                color="white"
                px={8}
                h="48px"
                borderRadius="lg"
                flexShrink={0}
                _hover={{ bg: theme.primaryHover }}
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
                  <Spinner size="xl" color={theme.textSecondary} thickness="4px" />
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
                    borderRadius="lg"
                    p={16}
                    textAlign="center"
                    border="1px solid"
                    borderColor={theme.border}
                    transition="all 0.2s ease"
                  >
                    <Box
                      w="100px"
                      h="100px"
                      bg={theme.secondaryBg}
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      mx="auto"
                      mb={5}
                    >
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
                        bg={theme.primary}
                        color="white"
                        px={8}
                        py={6}
                        borderRadius="lg"
                        _hover={{ bg: theme.primaryHover }}
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
                        borderRadius="lg"
                        border="1px solid"
                        borderColor={theme.border}
                        flexWrap="wrap"
                        transition="all 0.2s ease"
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
                                bg={page === pageNum ? theme.primary : theme.cardBg}
                                color={page === pageNum ? "white" : theme.textSecondary}
                                border="1px solid"
                                borderColor={page === pageNum ? theme.primary : theme.border}
                                fontWeight="semibold"
                                _hover={{ bg: page === pageNum ? theme.primaryHover : theme.hoverBg }}
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
    </Box>
  )
}