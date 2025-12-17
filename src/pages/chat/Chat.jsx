import { Badge, Box, Flex, HStack, Icon, Text, useBreakpointValue, VStack } from '@chakra-ui/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FiMessageCircle, FiMessageSquare, FiUsers, FiZap } from 'react-icons/fi'
import { history, myRooms, openRoom } from '../../api/chat'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import ChatHeader from './components/ChatArea/ChatHeader'
import Composer from './components/ChatArea/Composer'
import MessagesList from './components/ChatArea/MessagesList'
import MobileChatNavigator from './components/Mobile/MobileChatNavigator'
import RoomList from './components/Sidebar/RoomList'
import { useAutoScroll } from './hooks/useAutoScroll'
import { useChatSocket } from './hooks/useChatSocket'

export default function Chat() {
  const { theme } = useTheme()
  const isMobile = useBreakpointValue({ base: true, md: false })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [rooms, setRooms] = useState([])
  const [active, setActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const { token, user } = useAuth()
  const apiUrl = import.meta.env.VITE_API_URL
  const endRef = useAutoScroll([messages])
  const messagesContainerRef = useRef(null)

  const chatTheme = useMemo(() => ({
    ...theme,
    messageBg: theme.isLight ? '#E5E7EB' : '#1E293B',
    myMessageBg: '#3B82F6',
    myMessageText: '#FFFFFF',
    activeBg: theme.isLight ? '#EFF6FF' : '#1E3A5F',
    activeAccent: '#3B82F6',
  }), [theme])

  useEffect(() => { myRooms().then(setRooms) }, [])

  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => {
      const dateA = new Date(a.lastMsg?.createdAt || 0)
      const dateB = new Date(b.lastMsg?.createdAt || 0)
      return dateB - dateA
    })
  }, [rooms])

  const unreadCount = useMemo(() => {
    return rooms.filter(r => r.unread).length
  }, [rooms])

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [])

  const open = useCallback(async (r) => {
    setActive(r)
    const page = await history(r.roomId, 0, 30)
    const initial = (page?.content || []).slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    setMessages(initial)
    
    // Scroll to bottom after messages are loaded
    setTimeout(() => {
      scrollToBottom()
    }, 100)
  }, [scrollToBottom])

  const backToList = () => setActive(null)

  const { send } = useChatSocket({
    apiUrl,
    token,
    roomId: active?.roomId,
    onMessage: (incoming) => {
      setMessages(prev => [...prev, incoming])
      
      // Update the room's lastMessageAt and lastMsg to re-sort
      setRooms(prev => prev.map(r => {
        if (r.roomId === active?.roomId) {
          return {
            ...r,
            lastMessageAt: incoming.createdAt || new Date().toISOString(),
            lastMsg: {
              content: incoming.content,
              senderUsername: incoming.senderUsername,
              createdAt: incoming.createdAt,
              type: incoming.type
            }
          }
        }
        return r
      }))
    },
  })

  // Periodically refresh room list to catch messages from other users
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const updatedRooms = await myRooms()
        setRooms(updatedRooms)
      } catch (error) {
        console.error('Failed to refresh rooms:', error)
      }
    }, 10000) // Refresh every 10 seconds

    return () => clearInterval(interval)
  }, [])

  const sendText = () => {
    if (!active || !input.trim()) return
    const tempId = `local-${Date.now()}-${Math.random()}`
    const newMessage = {
      id: tempId,
      type: 'TEXT',
      content: input,
      senderUsername: user?.username,
      senderId: user?.id ?? 0,
      createdAt: new Date().toISOString(),
    }
    
    setMessages(prev => [...prev, newMessage])
    send({ type: 'TEXT', content: input })
    
    // Update room list immediately when sending
    setRooms(prev => prev.map(r => {
      if (r.roomId === active.roomId) {
        return {
          ...r,
          lastMessageAt: newMessage.createdAt,
          lastMsg: {
            content: input,
            senderUsername: user?.username,
            createdAt: newMessage.createdAt,
            type: 'TEXT'
          }
        }
      }
      return r
    }))
    
    setInput('')
  }

  const sendImage = async (file) => {
    console.log(file)
    if (!active || !file) return
    const reader = new FileReader()
    reader.onload = () => {
      send({ type: 'IMAGE', content: reader.result, fileName: file.name, mimeType: file.type })
    }
    reader.readAsDataURL(file)
  }

  const createNewRoom = async (value) => {
    const r = await openRoom(Number(value))
    setRooms(prev => [r, ...prev])
    open(r)
  }

  return (
    <Box bg={theme.pageBg} minH="100vh" position="relative" overflow="hidden">
      <Box maxW="1200px" mx="auto" px={{ base: 0, md: 6 }} py={{ base: 0, md: 6 }} position="relative" zIndex={1}>
        
        {isMobile ? (
          <MobileChatNavigator
            rooms={rooms}
            active={active}
            onOpenRoom={open}
            onBackToList={backToList}
            theme={chatTheme}
            apiUrl={apiUrl}
            meUsername={user?.username}
            createNewRoom={createNewRoom}
            messages={messages}
            endRef={endRef}
            input={input}
            setInput={setInput}
            sendText={sendText}
            sendImage={sendImage}
          />
        ) : (
          <Flex 
            h="calc(100vh - 100px)" 
            gap={0} 
            border="1px solid" 
            borderColor={theme.border} 
            borderRadius="2xl" 
            overflow="hidden" 
            bg={theme.cardBg}
            boxShadow="0 20px 30px -5px rgba(0, 0, 0, 0.15), 0 10px 15px -5px rgba(0, 0, 0, 0.1)"
          >
            
            {/* Enhanced Sidebar with Gradient */}
            <Box 
              w="360px" 
              borderRight="1px solid" 
              borderColor={theme.border} 
              display="flex" 
              flexDirection="column"
              background={theme.isLight 
                ? 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)' 
                : 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)'
              }
              position="relative"
            >
              {/* Decorative top gradient overlay */}
              <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                h="220px"
                background={theme.isLight
                  ? 'linear-gradient(180deg, rgba(59, 130, 246, 0.08) 0%, transparent 100%)'
                  : 'linear-gradient(180deg, rgba(59, 130, 246, 0.15) 0%, transparent 100%)'
                }
                pointerEvents="none"
                zIndex={0}
              />
              
              {/* Sidebar Header */}
              <Box px={5} py={4} borderBottom="1px solid" borderColor={theme.border} position="relative" zIndex={1}>
                <Flex justify="space-between" align="center" mb={4}>
                  <HStack spacing={3}>
                    <Box
                      w="44px"
                      h="44px"
                      background={theme.isLight 
                        ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                        : 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)'
                      }
                      borderRadius="xl"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      boxShadow="0 4px 12px rgba(59, 130, 246, 0.35)"
                    >
                      <Icon as={FiMessageSquare} boxSize={5} color="white" />
                    </Box>
                    <Box>
                      <Text fontSize="lg" fontWeight="bold" color={theme.text}>
                        Messages
                      </Text>
                      <Text fontSize="xs" color={theme.textMuted}>
                        {sortedRooms.length} conversation{sortedRooms.length !== 1 ? 's' : ''}
                      </Text>
                    </Box>
                  </HStack>
                  
                  {unreadCount > 0 && (
                    <Badge
                      background="linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"
                      color="white"
                      borderRadius="full"
                      px={2.5}
                      py={1}
                      fontSize="xs"
                      fontWeight="bold"
                      boxShadow="0 2px 8px rgba(239, 68, 68, 0.4)"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Flex>
              </Box>
              
              {/* Room List */}
              <Box flex={1} overflowY="auto" position="relative" zIndex={1}>
                {sortedRooms.length > 0 ? (
                  <RoomList 
                    rooms={sortedRooms} 
                    active={active} 
                    onOpen={open} 
                    theme={chatTheme} 
                    meUsername={user?.username} 
                    apiUrl={apiUrl} 
                  />
                ) : (
                  <Flex direction="column" align="center" justify="center" h="full" p={8}>
                    <Box 
                      w="100px" 
                      h="100px" 
                      borderRadius="full"
                      bg={theme.secondaryBg}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      mb={4}
                      border="3px dashed"
                      borderColor={theme.border}
                      position="relative"
                    >
                      <Box
                        position="absolute"
                        inset="-8px"
                        borderRadius="full"
                        background={theme.isLight ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.15)'}
                        animation="pulseRing 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                      />
                      <Icon as={FiMessageCircle} boxSize={10} color={theme.textMuted} />
                    </Box>
                    <Text fontSize="sm" fontWeight="medium" color={theme.text} mb={1}>
                      No conversations yet
                    </Text>
                    <Text fontSize="xs" color={theme.textMuted} textAlign="center" maxW="200px">
                      Start a new chat by entering a user ID above
                    </Text>
                  </Flex>
                )}
              </Box>
            </Box>

            {/* Enhanced Chat Area with Pattern Background */}
            <Box 
              ref={messagesContainerRef}
              flex={1} 
              display="flex" 
              flexDirection="column" 
              bg={theme.secondaryBg}
              position="relative"
              overflow="hidden"
            >
              {/* Animated background pattern */}
              <Box
                position="absolute"
                inset="0"
                pointerEvents="none"
                style={{
                  background: theme.isLight
                    ? 'radial-gradient(circle at 25% 45%, rgba(59, 130, 246, 0.06) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)'
                    : 'radial-gradient(circle at 25% 45%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)',
                  backgroundSize: '120% 120%',
                  animation: 'backgroundFloat 18s ease-in-out infinite alternate',
                }}
              />

              {/* Floating message bubbles decoration (top-right) */}
              <Box
                position="absolute"
                top="12%"
                right="8%"
                w="60px"
                h="60px"
                borderRadius="xl"
                background={theme.isLight
                  ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)'
                  : 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(139, 92, 246, 0.2) 100%)'
                }
                animation="floatUpDown 4s ease-in-out infinite"
                pointerEvents="none"
                opacity={0.6}
              />

              {/* Floating message bubbles decoration (bottom-left) */}
              <Box
                position="absolute"
                bottom="20%"
                left="6%"
                w="50px"
                h="50px"
                borderRadius="full"
                border="2px solid"
                borderColor={theme.isLight ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.3)'}
                animation="floatUpDown 5s ease-in-out infinite 1.5s"
                pointerEvents="none"
                opacity={0.5}
              />
              
              {active ? (
                <>
                  <Box position="relative" zIndex={1}>
                    <ChatHeader active={active} theme={chatTheme} apiUrl={apiUrl} />
                  </Box>
                  
                  <Box 
                    ref={messagesContainerRef}
                    flex={1} 
                    overflowY="auto"
                    position="relative"
                    zIndex={1}
                    css={{
                      '&::-webkit-scrollbar': {
                        width: '8px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: 'transparent',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: theme.isLight ? '#CBD5E1' : '#475569',
                        borderRadius: '4px',
                        transition: 'background 0.2s',
                      },
                      '&::-webkit-scrollbar-thumb:hover': {
                        background: theme.isLight ? '#94A3B8' : '#64748B',
                      },
                    }}
                  >
                    <MessagesList 
                      messages={messages} 
                      meUsername={user?.username} 
                      theme={chatTheme} 
                      endRef={endRef} 
                    />
                  </Box>
                  
                  <Box 
                    position="relative" 
                    zIndex={1}
                    borderTop="1px solid"
                    borderColor={theme.border}
                    bg={theme.cardBg}
                    boxShadow="0 -4px 6px -1px rgba(0, 0, 0, 0.06)"
                  >
                    <Composer 
                      theme={chatTheme} 
                      input={input} 
                      setInput={setInput} 
                      onSendText={sendText} 
                      onSendImage={sendImage} 
                    />
                  </Box>
                </>
              ) : (
                <Flex align="center" justify="center" h="full" position="relative" zIndex={1}>
                  <VStack spacing={6}>
                    {/* Animated decorative element */}
                    <Box position="relative" w="140px" h="140px">
                      {/* Outer rotating ring */}
                      <Box
                        position="absolute"
                        inset="0"
                        borderRadius="full"
                        border="3px dashed"
                        borderColor={theme.isLight ? 'blue.200' : 'blue.700'}
                        animation="rotate 25s linear infinite"
                      />
                      
                      {/* Middle pulsing circle */}
                      <Box
                        position="absolute"
                        w="100px"
                        h="100px"
                        top="50%"
                        left="50%"
                        transform="translate(-50%, -50%)"
                        borderRadius="full"
                        background={theme.isLight
                          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(139, 92, 246, 0.1) 100%)'
                          : 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(139, 92, 246, 0.2) 100%)'
                        }
                        border="2px solid"
                        borderColor={theme.border}
                        animation="pulse 3s ease-in-out infinite"
                      />

                      {/* Center icon */}
                      <Box
                        position="absolute"
                        top="50%"
                        left="50%"
                        transform="translate(-50%, -50%)"
                        w="60px"
                        h="60px"
                        borderRadius="full"
                        background={theme.isLight 
                          ? 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)'
                          : 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)'
                        }
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        boxShadow="0 8px 16px rgba(59, 130, 246, 0.4)"
                        animation="float 4s ease-in-out infinite"
                      >
                        <Icon as={FiMessageSquare} boxSize={7} color="white" />
                      </Box>

                      {/* Floating mini icons */}
                      <Box
                        position="absolute"
                        top="8%"
                        right="8%"
                        w="26px"
                        h="26px"
                        borderRadius="full"
                        bg={theme.isLight ? 'blue.100' : 'blue.800'}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        boxShadow="0 2px 6px rgba(59, 130, 246, 0.3)"
                        animation="floatUpDown 3s ease-in-out infinite"
                      >
                        <Icon as={FiZap} boxSize={3} color={theme.accent} />
                      </Box>

                      <Box
                        position="absolute"
                        bottom="12%"
                        left="3%"
                        w="22px"
                        h="22px"
                        borderRadius="full"
                        bg={theme.isLight ? 'purple.100' : 'purple.800'}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        boxShadow="0 2px 6px rgba(139, 92, 246, 0.3)"
                        animation="floatUpDown 3s ease-in-out infinite 1.2s"
                      >
                        <Icon as={FiUsers} boxSize={3} color="purple.500" />
                      </Box>
                    </Box>

                    <VStack spacing={2}>
                      <Text fontSize="xl" fontWeight="bold" color={theme.text}>
                        Select a conversation
                      </Text>
                      <Text color={theme.textSecondary} fontSize="sm" textAlign="center" maxW="320px">
                        Choose a chat from your conversations or start a new one to begin messaging
                      </Text>
                    </VStack>
                    
                    <HStack spacing={4} pt={4}>
                      <HStack 
                        spacing={2} 
                        px={4} 
                        py={2} 
                        bg={theme.secondaryBg}
                        borderRadius="lg"
                        border="1px solid"
                        borderColor={theme.border}
                        boxShadow="0 2px 4px rgba(0, 0, 0, 0.05)"
                      >
                        <Box 
                          w="8px" 
                          h="8px" 
                          borderRadius="full"
                          background="linear-gradient(135deg, #10B981 0%, #059669 100%)"
                          boxShadow="0 0 8px rgba(16, 185, 129, 0.6)"
                          animation="pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                        />
                        <Text fontSize="xs" color={theme.textMuted} fontWeight="medium">
                          {sortedRooms.length} Active
                        </Text>
                      </HStack>
                    </HStack>
                  </VStack>
                </Flex>
              )}
            </Box>
          </Flex>
        )}
      </Box>

      {/* Global animations */}
      <style>
        {`
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
          
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.7;
              transform: scale(0.98);
            }
          }
          
          @keyframes float {
            0%, 100% {
              transform: translate(-50%, -50%) translateY(0px);
            }
            50% {
              transform: translate(-50%, -50%) translateY(-12px);
            }
          }
          
          @keyframes floatUpDown {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-18px);
            }
          }
          
          @keyframes rotate {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
          
          @keyframes backgroundFloat {
            0% {
              background-position: 0% 0%;
            }
            100% {
              background-position: 100% 100%;
            }
          }
        `}
      </style>
    </Box>
  )
}