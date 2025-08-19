import { Box, Flex, Heading, InputGroup, Input, IconButton, HStack, Icon, Badge } from '@chakra-ui/react'
import { Link, useNavigate } from 'react-router-dom'
import { FiSearch, FiBell, FiShoppingCart, FiMessageSquare, FiLogOut, FiUser } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Header() {
  const nav = useNavigate()
  const { token, logout } = useAuth()
  const { cartCount } = useCart() // 👈 số sản phẩm trong giỏ


  return (
    <Box position="sticky" top={0} zIndex={10} className="glass">
      <Box maxW="7xl" mx="auto" py={3} px={4}>
        <Flex align="center" gap={4}>
          <Heading size="md" color="brand.700">
            <Link to="/">mini-Shopee</Link>
          </Heading>

          <InputGroup
            maxW="600px"
            flex={1}
            // đặt màu & size cho icon tìm kiếm
            startElement={<Icon as={FiSearch} aria-hidden="true" color="gray.500" boxSize="5" />}
          >
            <Input
              placeholder="Tìm sản phẩm, danh mục…"
              bg="white"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  nav(`/?q=${encodeURIComponent(e.target.value || '')}`)
                }
              }}
            />
          </InputGroup>

          {/* <HStack> */}
            <IconButton
              aria-label="Chat"
              variant="ghost"
              colorPalette="gray"
              fontSize="20px"
              icon={<Icon as={FiMessageSquare} />}
              onClick={() => nav('/chat')}
            >
              <FiMessageSquare />
            </IconButton>
            <IconButton
              aria-label="Notifications"
              variant="ghost"
              colorPalette="gray"
              fontSize="20px"
              icon={<Icon as={FiBell} />}
              onClick={() => nav('/notifications')}
            >
              <FiBell />
            </IconButton>


            {/* <IconButton
              aria-label="Cart"
              variant="ghost"
              colorPalette="gray"
              fontSize="20px"
              icon={<Icon as={FiShoppingCart} />}
              onClick={() => nav('/cart')}
            >
              <FiShoppingCart />
            </IconButton> */}

            {/* Cart + badge */}
            <Box position="relative">
              <IconButton
                aria-label="Cart"
                variant="ghost"
                colorPalette="gray"
                fontSize="20px"
                icon={<Icon as={FiShoppingCart} />}
                onClick={() => nav('/cart')}
              >
                  <FiShoppingCart />
              </IconButton>
              
                <Badge
                  position="absolute"
                  top="1"
                  right="1"
                  borderRadius="full"
                  px="0.6"
                  fontSize="0.5em"
                  colorPalette="red"   // Chakra v3 dùng colorPalette
                >
                  {cartCount}
                </Badge>
            </Box>


            {token ? (
              <IconButton
                aria-label="Logout"
                variant="ghost"
                colorPalette="gray"
                fontSize="20px"
                icon={<Icon as={FiLogOut} />}
                onClick={logout}
              >
                <Icon as={FiLogOut} />
              </IconButton>
            ) : (
              <IconButton
                aria-label="Login"
                variant="ghost"
                colorPalette="gray"
                fontSize="20px"
                icon={<Icon as={FiUser} />}
                onClick={() => nav('/login')}
              >
                <Icon as={FiUser} />
              </IconButton>
            )}
          {/* </HStack> */}
        </Flex>
      </Box>
    </Box>
  )
}
