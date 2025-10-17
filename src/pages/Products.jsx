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

const sortOptions = createListCollection({
  items: [
    { label: "Default", value: "" },
    { label: "Price: Low → High", value: "priceAsc" },
    { label: "Price: High → Low", value: "priceDesc" },
    { label: "Rating: Low → High", value: "rateAsc" },
    { label: "Rating: High → Low", value: "rateDesc" },
    
  ],
})

export default function Products() {
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
  }), [q, category, sort, page])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.totalElements || 0) / size)),
    [data?.totalElements, size]
  )

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

  useEffect(() => {
    setSearchInput(q)
  }, [q])

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
    <Box bg="#F8F9FA" minH="100vh" py={8}>
      <Container maxW="container.2xl">
        {/* Page Header */}
        <Box mb={8}>
          <HStack spacing={3} mb={3}>
            <Icon as={FiGrid} boxSize={7} color="#495057" />
            <Text fontSize="4xl" fontWeight="black" color="#212529">
              Products
            </Text>
          </HStack>
          <Text color="#6C757D" fontSize="lg">
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
            <Box bg="white" borderRadius="lg" p={5} border="1px solid" borderColor="#DEE2E6">
              <Text fontSize="sm" fontWeight="bold" color="#495057" mb={4} textTransform="uppercase" letterSpacing="wide">
                Categories
              </Text>
              <CategorySidebar onChange={setCategory} activeId={category?.id} />
            </Box>
          </Box>

          {/* Main Content */}
          <Box flex={1}>
            {/* Active Filters */}
            {hasActiveFilters && (
              <HStack spacing={3} mb={4} flexWrap="wrap">
                <Text fontWeight="semibold" color="#495057" fontSize="sm">
                  {data.totalElements} {data.totalElements === 1 ? 'product' : 'products'} found
                </Text>

                {category && (
                  <Badge
                    bg="#E7F5FF"
                    color="#1971C2"
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
                      _hover={{ color: "#1864AB" }}
                    />
                  </Badge>
                )}

                {q && (
                  <Badge
                    bg="#FFF3BF"
                    color="#E67700"
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
                      _hover={{ color: "#D96C00" }}
                    />
                  </Badge>
                )}
              </HStack>
            )}

            {/* Toolbar */}
            <Flex
              bg="white"
              borderRadius="lg"
              p={4}
              mb={6}
              border="1px solid"
              borderColor="#DEE2E6"
              gap={3}
              align="center"
              flexWrap={{ base: "wrap", md: "nowrap" }}
            >
              {/* Search Input with Icon */}
              <Flex flex={1} minW={{ base: "full", md: "300px" }}>
                <InputGroup 
                  startElement={<Icon as={FiSearch} color="#ADB5BD" />}
                  endElement={
                    q && (
                      <IconButton
                        size="xs"
                        variant="ghost"
                        aria-label="Clear search"
                        onClick={clearSearch}
                      >
                        <Icon as={FiX} color="#6C757D" />
                      </IconButton>
                    )}
                  >
                  <Input
                    placeholder="Search products by name..."
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    bg="white"
                    border="1px solid"
                    borderColor="#DEE2E6"
                    color="#212529"
                    h="48px"
                    fontSize="md"
                    borderRadius="lg"
                    _placeholder={{ color: "#ADB5BD" }}
                    _focus={{ borderColor: "#495057", boxShadow: "0 0 0 3px rgba(73, 80, 87, 0.1)" }}
                  />
                </InputGroup>
              </Flex>

              {/* Search Button */}
              <Button
                onClick={handleSearch}
                bg="#212529"
                color="white"
                px={8}
                h="48px"
                borderRadius="lg"
                flexShrink={0}
                _hover={{ bg: "#343A40" }}
              >
                Search
              </Button>

              {/* Sort Dropdown */}
              <Select.Root
                collection={sortOptions}
                value={sort}
                onValueChange={(e) => {setSort(e.value); console.log(sort, e.value)}}
                width={{ base: "full", md: "200px" }}
                flexShrink={0}
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger
                    bg="white"
                    border="1px solid"
                    borderColor="#DEE2E6"
                    color="#495057"
                    h="48px"
                    borderRadius="lg"
                    _hover={{ bg: "#F8F9FA" }}
                  >
                    <Select.ValueText placeholder="Sort by" />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content
                      bg="white"
                      borderColor="#DEE2E6"
                      shadow="lg"
                      borderRadius="lg"
                      border="1px solid"
                    >
                      {sortOptions.items.map((option) => (
                        <Select.Item 
                          item={option} 
                          key={option.value}
                          _hover={{ bg: "#F8F9FA" }}
                        >
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
                  <Spinner size="xl" color="#495057" thickness="4px" />
                  <Text color="#6C757D" fontWeight="medium">Loading products...</Text>
                </VStack>
              </Flex>
            )}

            {/* Content */}
            {!isFetching && (
              <>
                {data.totalElements === 0 ? (
                  <Box
                    bg="white"
                    borderRadius="lg"
                    p={16}
                    textAlign="center"
                    border="1px solid"
                    borderColor="#DEE2E6"
                  >
                    <Box
                      w="100px"
                      h="100px"
                      bg="#F1F3F5"
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      mx="auto"
                      mb={5}
                    >
                      <Icon as={FiPackage} boxSize={12} color="#ADB5BD" />
                    </Box>
                    <Text fontSize="2xl" fontWeight="bold" color="#212529" mb={2}>
                      No products found
                    </Text>
                    <Text color="#6C757D" mb={6} maxW="md" mx="auto">
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
                        bg="#212529"
                        color="white"
                        px={8}
                        py={6}
                        borderRadius="lg"
                        _hover={{ bg: "#343A40" }}
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
                        <ProductCard key={p.id} p={p} onAdd={handleAdd} />
                      ))}
                    </SimpleGrid>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <Flex
                        justify="center"
                        align="center"
                        gap={3}
                        bg="white"
                        p={5}
                        borderRadius="lg"
                        border="1px solid"
                        borderColor="#DEE2E6"
                        flexWrap="wrap"
                      >
                        <Button
                          onClick={goPrev}
                          isDisabled={page === 0}
                          size="sm"
                          leftIcon={<FiChevronLeft />}
                          bg="white"
                          border="1px solid"
                          borderColor="#DEE2E6"
                          color="#495057"
                          _hover={{ bg: "#F8F9FA" }}
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
                                bg={page === pageNum ? "#212529" : "white"}
                                color={page === pageNum ? "white" : "#495057"}
                                border="1px solid"
                                borderColor={page === pageNum ? "#212529" : "#DEE2E6"}
                                fontWeight="semibold"
                                _hover={{
                                  bg: page === pageNum ? "#343A40" : "#F8F9FA"
                                }}
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
                          bg="white"
                          border="1px solid"
                          borderColor="#DEE2E6"
                          color="#495057"
                          _hover={{ bg: "#F8F9FA" }}
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