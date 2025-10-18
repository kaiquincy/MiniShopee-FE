import { useEffect, useState } from 'react'
import { myNotifications, markRead, unreadCount } from '../api/notifications'
import { Box, Heading, VStack, HStack, Text, Badge, Icon, Button } from '@chakra-ui/react'
import { LuPackage, LuTag, LuSettings, LuStar, LuBell } from 'react-icons/lu'
import { useNavigate } from 'react-router-dom'

export default function Notifications() {
  const [list, setList] = useState([]); 
  const [unread, setUnread] = useState(0)
  const [showAll, setShowAll] = useState(false)
  const nav = useNavigate()
  const load = async()=>{
    setList(await myNotifications()); 
    setUnread(await unreadCount()) 
  }
  useEffect(()=>{ load() },[])

  const handleNotificationClick = async (id, isRead) => {
    if (!isRead) {
      await markRead(id)
    }
    load()
  }

  // Phân loại thông báo dựa trên trường 'type' (giả định API trả về n.type như 'order', 'promotion', 'system', 'review')
  const getTypeBadge = (type) => {
    const types = {
      ORDER_UPDATED: { colorScheme: 'blue', label: 'Order' },
      promotion: { colorScheme: 'green', label: 'Promotion' },
      SYSTEM: { colorScheme: 'yellow', label: 'System' },
      review: { colorScheme: 'purple', label: 'Review' },
      default: { colorScheme: 'gray', label: 'Other' }
    }
    const config = types[type] || types.default
    return (
      <Badge 
        colorScheme={config.colorScheme} 
        variant="subtle" 
        fontSize="xs" 
        mr={2}
      >
        {config.label}
      </Badge>
    )
  }

  // Icon dựa trên type
  const getTypeIcon = (type) => {
    const icons = {
      ORDER_UPDATED: LuPackage,
      promotion: LuTag,
      SYSTEM: LuSettings,
      review: LuStar,
      default: LuBell
    }
    const IconComponent = icons[type] || icons.default
    const colors = {
      ORDER_UPDATED: 'blue.500',
      promotion: 'green.500',
      SYSTEM: 'yellow.500',
      review: 'purple.500',
      default: 'gray.500'
    }
    const color = colors[type] || colors.default
    return <Icon as={IconComponent} boxSize={10} color={color} />
  }

  const maxToShow = 4
  const displayedList = showAll ? list : list.slice(0, maxToShow)

  return (
    <Box px={{ md:0}} py={6} maxW="600px" mx="auto">
      <HStack justify="space-between" mb={3}>
        <Heading size="md">Notifications</Heading>
        <Badge colorScheme="red">{unread} unreads</Badge>
      </HStack>
      <VStack align="stretch" spacing={3}>
        {displayedList.map(n=>(
          <Box
            key={n.id}
            as="button"
            onClick={() => handleNotificationClick(n.id, n.read)}
            justify="space-between"
            bg="white"
            p={3}
            borderRadius="md"
            className="glass"
            cursor="pointer"
            _hover={{ bg: 'gray.50' }}
            transition="background-color 0.2s ease"
            display="flex"
            alignItems="start"
            gap={3}
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              w={12}
              h={12}
              bg="gray.100"
              borderRadius="full"
              mr={2}
              flexShrink={0}
            >
              {getTypeIcon(n.type)}
            </Box>
            <VStack align="start" flex={1} spacing={1}>
              <HStack align="start" spacing={2} mb={1}>
                <Text fontSize="sm" fontWeight="medium" noOfLines={1}>{n.title || 'New Notification'}</Text>
                {getTypeBadge(n.type)}  {/* Badge phân loại */}
              </HStack>
              <Text fontSize="sm" noOfLines={2} color="gray.700">{n.message}</Text>
              <Text fontSize="xs" color="gray.500">
                {new Date(n.createdAt).toLocaleString('vi-VN', { 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </VStack>
            {!n.read && (
              <Box
                w={2}
                h={2}
                bg="red.500"
                borderRadius="full"
                mr={2}
                mt={1}
                flexShrink={0}
              />
            )}
          </Box>
        ))}
        {list.length === 0 && (
          <VStack spacing={8} py={12} textAlign="center">
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              w={20}
              h={20}
              bg="gray.100"
              borderRadius="full"
              mb={4}
              shadow="md"
            >
              <Icon as={LuBell} boxSize={12} color="gray.400" />
            </Box>
            <VStack spacing={3}>
              <Heading size="lg" color="gray.700">
                No notifications yet
              </Heading>
              <Text color="gray.500" fontSize="md" maxW="400px">
                Stay tuned! You'll get updates here for new orders, promotions, reviews, and more exciting news.
              </Text>
            </VStack>
            <HStack spacing={4}>
              <Button 
                variant="outline" 
                onClick={() => nav('/')} 
                leftIcon={<LuBell />}
                colorScheme="gray"
                size="md"
              >
                Browse Products
              </Button>
              <Button 
                variant="ghost" 
                onClick={load}
                leftIcon={<Icon as={LuBell} />}
                colorScheme="gray"
                size="md"
              >
                Refresh
              </Button>
            </HStack>
          </VStack>
        )}
        {!showAll && list.length > maxToShow && (
          <Button
            variant="ghost"
            onClick={() => setShowAll(true)}
            size="sm"
            alignSelf="center"
            mt={2}
          >
            View more ({list.length - maxToShow} more)
          </Button>
        )}
      </VStack>
    </Box>
  )
}