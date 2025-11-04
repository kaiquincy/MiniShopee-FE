import React, { useEffect, useState } from 'react'
import { myNotifications, markRead, unreadCount } from '../api/notifications'
import { Box, Heading, VStack, HStack, Text, Badge, Icon, Button } from '@chakra-ui/react'
import { LuPackage, LuTag, LuSettings, LuStar, LuBell } from 'react-icons/lu'
import { Badge, Box, Button, Flex, Heading, HStack, Icon, Text, VStack } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { FiBell } from 'react-icons/fi'
import { LuBell, LuPackage, LuSettings, LuStar, LuTag } from 'react-icons/lu'
import { useNavigate } from 'react-router-dom'
import { customOrderUpdateTypes } from '../constants/notificationTypes'



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

  // Phân loại thông báo dựa trên trường 'type' (giả định API trả về n.type như 'order', 'promotion', 'system', 'review')
  const getTypeBadge = (type) => {
    const normalized = type?.startsWith('ORDER_UPDATED') ? 'ORDER_UPDATED' : type
    const types = {
      ORDER_UPDATED: { colorScheme: 'blue', label: 'Order' },
      promotion: { colorScheme: 'green', label: 'Promotion' },
      SYSTEM: { colorScheme: 'yellow', label: 'System' },
      review: { colorScheme: 'purple', label: 'Review' },
      default: { colorScheme: 'gray', label: 'Other' }
    }
    const config = types[normalized] || types.default
    return (
      <Badge 
        colorPalette={config.colorScheme} 
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
    const normalized = type?.startsWith('ORDER_UPDATED') ? 'ORDER_UPDATED' : type
    const icons = {
      ORDER_UPDATED: LuPackage,
      promotion: LuTag,
      SYSTEM: LuSettings,
      review: LuStar,
      default: LuBell
    }
    const IconComponent = icons[normalized] || icons.default
    const colors = {
      ORDER_UPDATED: 'blue.500',
      promotion: 'green.500',
      SYSTEM: 'yellow.500',
      review: 'purple.500',
      default: 'gray.500'
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
    const color = colors[normalized] || colors.default
    return <Icon as={IconComponent} boxSize={10} color={color} />
  }
    return configs[type] || configs.default
  }

  const maxToShow = 5
  const displayedList = showAll ? list : list.slice(0, maxToShow)

  return (
    <Box px={{ md:0}} py={6} maxW="600px" mx="auto">
      <HStack justify="space-between" mb={3}>
        <Heading size="md">Notifications</Heading>
        <Badge colorScheme="red">{unread} unreads</Badge>
      </HStack>
      <VStack align="stretch" spacing={3}>
        {displayedList.map(n=> {

        const renderTextWithId = (text, id) => {
          if (!text) return null
          const parts = text.split('#${id}')
          return (
            <>
              {parts.map((part, index) => (
                <React.Fragment key={index}>
                  {part}
                  {index < parts.length - 1 && (
                    <Text as="span" color="blue.500" >
                      #MSP202Z{id}
                    </Text>
                  )}
                </React.Fragment>
              ))}
            </>
          )
        }

        // Nếu là type mới -> dùng toàn bộ cấu hình custom
        const custom = customOrderUpdateTypes[n.type]
        const title = custom?.title ?? (n.title || 'New Notification')
        const message = custom
          ? renderTextWithId(custom.message, n.referenceId)
          : n.message
        const IconComp = custom?.icon
        const iconColor = custom?.color
        const badge = custom?.badge


        // Nếu không phải type mới -> fallback về logic cũ
        const iconEl = IconComp ? (
          <Icon as={IconComp} boxSize={10} color={iconColor} />
        ) : (
          getTypeIcon(n.type)
        )

        const badgeEl = badge ? (
          <Badge colorPalette={badge.colorScheme}>{badge.label}</Badge>
        ) : (
          getTypeBadge(n.type)
        )

        return(
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
            alignItems="center"
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
              {iconEl}
            </Box>
            <VStack align="start" flex={1} spacing={1}>
              <HStack align="start" spacing={2} mb={1}>
                <Text fontSize="sm" fontWeight="medium" noOfLines={1}>{title}</Text>
                {badgeEl} {/* Badge phân loại */}
              </HStack>
              <Text textAlign="left" fontSize="sm" color="gray.700">{message}</Text>
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
        )})}

        {/* If 0 noti */}
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
                variant="outline" 
                onClick={() => nav('/')} 
                leftIcon={<LuBell />}
                colorPalette="gray"
                size="md"
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
                colorPalette="gray"
                size="md"
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

        {/* View More */}

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