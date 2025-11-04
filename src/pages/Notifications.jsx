import { Badge, Box, Button, Flex, Heading, HStack, Icon, Text, VStack } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { FiBell } from 'react-icons/fi'
import { LuBell, LuPackage, LuSettings, LuStar, LuTag } from 'react-icons/lu'
import { useNavigate } from 'react-router-dom'
import { markRead, myNotifications, unreadCount } from '../api/notifications'

export default function Notifications() {
  const [list, setList] = useState([])
  const [unread, setUnread] = useState(0)
  const [showAll, setShowAll] = useState(false)
  const nav = useNavigate()
  
  const load = async () => {
    setList(await myNotifications())
    setUnread(await unreadCount())
  }
  
  useEffect(() => { load() }, [])

  const handleNotificationClick = async (id, isRead) => {
    if (!isRead) {
      await markRead(id)
    }
    load()
  }

  const getTypeConfig = (type) => {
    const configs = {
      ORDER_UPDATED: { 
        color: '#3B82F6', 
        bgColor: '#3B82F615',
        label: 'Order',
        icon: LuPackage 
      },
      promotion: { 
        color: '#10B981', 
        bgColor: '#10B98115',
        label: 'Promotion',
        icon: LuTag 
      },
      SYSTEM: { 
        color: '#F59E0B', 
        bgColor: '#F59E0B15',
        label: 'System',
        icon: LuSettings 
      },
      review: { 
        color: '#8B5CF6', 
        bgColor: '#8B5CF615',
        label: 'Review',
        icon: LuStar 
      },
      default: { 
        color: '#64748B', 
        bgColor: '#64748B15',
        label: 'Other',
        icon: LuBell 
      }
    }
    return configs[type] || configs.default
  }

  const maxToShow = 5
  const displayedList = showAll ? list : list.slice(0, maxToShow)

  return (
    <Box maxW="800px" mx="auto" my={10}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <HStack>
            <Icon as={FiBell} boxSize={7} color="#495057" />
            <Text fontSize="3xl" fontWeight="black" mb={2} color="#212529">
              Notifications
            </Text>
          </HStack>
          <Text color="#6c757d">Stay updated with your latest activities</Text>
        </Box>
        {unread > 0 && (
          <Badge 
            bg="#EF444415"
            color="#EF4444"
            border="1px solid"
            borderColor="#EF444430"
            px={4}
            py={2}
            borderRadius="full"
            fontSize="sm"
            fontWeight="semibold"
          >
            {unread} Unread
          </Badge>
        )}
      </Flex>

      {/* Notifications List */}
      <VStack align="stretch" gap={3}>
        {displayedList.map(n => {
          const config = getTypeConfig(n.type)
          return (
            <Box
              key={n.id}
              as="button"
              onClick={() => handleNotificationClick(n.id, n.read)}
              bg="white"
              border="1px solid"
              borderColor={n.read ? "#E2E8F0" : config.color + "30"}
              borderLeft="4px solid"
              borderLeftColor={n.read ? "#E2E8F0" : config.color}
              p={5}
              borderRadius="lg"
              cursor="pointer"
              transition="all 0.2s"
              shadow={n.read ? "sm" : "md"}
              _hover={{ 
                shadow: "lg",
                borderColor: config.color + "50",
                transform: "translateY(-2px)"
              }}
              display="flex"
              alignItems="start"
              gap={4}
              textAlign="left"
              w="full"
              position="relative"
            >
              {/* Icon */}
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                w="48px"
                h="48px"
                bg={config.bgColor}
                borderRadius="lg"
                flexShrink={0}
              >
                <Icon as={config.icon} boxSize={6} color={config.color} />
              </Box>

              {/* Content */}
              <VStack align="start" flex={1} spacing={2}>
                <HStack spacing={2} wrap="wrap">
                  <Text 
                    fontSize="md" 
                    fontWeight="bold" 
                    color="#1E293B"
                    flex={1}
                  >
                    {n.title || 'New Notification'}
                  </Text>
                  <Badge 
                    bg={config.bgColor}
                    color={config.color}
                    border="1px solid"
                    borderColor={config.color + "30"}
                    px={2}
                    py={0.5}
                    borderRadius="md"
                    fontSize="xs"
                    fontWeight="semibold"
                  >
                    {config.label}
                  </Badge>
                </HStack>
                
                <Text 
                  fontSize="sm" 
                  color="#64748B"
                  lineHeight="1.6"
                >
                  {n.message}
                </Text>
                
                <Text fontSize="xs" color="#94A3B8">
                  {new Date(n.createdAt).toLocaleString('en-US', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </VStack>

              {/* Unread Indicator */}
              {!n.read && (
                <Box
                  position="absolute"
                  top={5}
                  right={5}
                  w="10px"
                  h="10px"
                  bg={config.color}
                  borderRadius="full"
                  boxShadow={`0 0 0 3px ${config.bgColor}`}
                />
              )}
            </Box>
          )
        })}

        {/* Empty State */}
        {list.length === 0 && (
          <Box 
            bg="white" 
            border="1px solid" 
            borderColor="#E2E8F0" 
            borderRadius="lg" 
            p={12}
            textAlign="center"
            shadow="sm"
          >
            <Box
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              w="80px"
              h="80px"
              bg="#F1F5F9"
              borderRadius="full"
              mb={6}
            >
              <Icon as={LuBell} boxSize={10} color="#94A3B8" />
            </Box>
            
            <Heading size="lg" color="#1E293B" mb={3}>
              No notifications yet
            </Heading>
            
            <Text color="#64748B" fontSize="md" mb={6} maxW="400px" mx="auto">
              Stay tuned! You'll get updates here for new orders, promotions, reviews, and more exciting news.
            </Text>
            
            <HStack spacing={3} justify="center">
              <Button 
                bg="#3B82F6"
                color="white"
                onClick={() => nav('/')}
                leftIcon={<LuPackage />}
                size="lg"
                _hover={{ bg: "#2563EB" }}
                fontWeight="semibold"
              >
                Browse Products
              </Button>
              <Button 
                variant="outline"
                onClick={load}
                leftIcon={<Icon as={LuBell} />}
                borderColor="#E2E8F0"
                color="#64748B"
                size="lg"
                _hover={{ bg: "#F8FAFC", borderColor: "#3B82F6" }}
              >
                Refresh
              </Button>
            </HStack>
          </Box>
        )}

        {/* Show More Button */}
        {!showAll && list.length > maxToShow && (
          <Button
            variant="outline"
            onClick={() => setShowAll(true)}
            size="md"
            alignSelf="center"
            mt={4}
            borderColor="#E2E8F0"
            color="#64748B"
            _hover={{ bg: "#F8FAFC", borderColor: "#3B82F6", color: "#3B82F6" }}
            fontWeight="semibold"
          >
            View {list.length - maxToShow} more notifications
          </Button>
        )}
      </VStack>
    </Box>
  )
}