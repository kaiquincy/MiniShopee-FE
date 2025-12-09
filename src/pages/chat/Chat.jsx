import { Badge, Box, Flex, HStack, Icon, Text, useBreakpointValue, VStack } from '@chakra-ui/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiMessageCircle, FiMessageSquare } from 'react-icons/fi'
import { history, myRooms, openRoom } from '../../api/chat'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import ChatHeader from './components/ChatArea/ChatHeader'
import Composer from './components/ChatArea/Composer'
import MessagesList from './components/ChatArea/MessagesList'
import MobileChatNavigator from './components/Mobile/MobileChatNavigator'
import NewRoomInput from './components/Sidebar/NewRoomInput'
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

  // Enhanced chat theme with proper gradient strings
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

  const open = useCallback(async (r) => {
    setActive(r)
    const page = await history(r.roomId, 0, 30)
    const initial = (page?.content || []).slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    setMessages(initial)
  }, [])

  const backToList = () => setActive(null)

  const { send } = useChatSocket({
    apiUrl,
    token,
    roomId: active?.roomId,
    onMessage: (incoming) => {
      setMessages(prev => [...prev, incoming])
      setRooms(prev => prev.map(r => 
        r.roomId === active?.roomId 
          ? { ...r, lastMessageAt: incoming.createdAt || new Date().toISOString() }
          : r
      ))
    },
  })

  const sendText = () => {
    if (!active || !input.trim()) return
    const tempId = `local-${Date.now()}-${Math.random()}`
    setMessages(prev => [...prev, {
      id: tempId,
      type: 'TEXT',
      content: input,
      senderUsername: user?.username,
      senderId: user?.id ?? 0,
      createdAt: new Date().toISOString(),
    }])
    send({ type: 'TEXT', content: input })
    setInput('')
    
    setRooms(prev => prev.map(r => 
      r.roomId === active.roomId 
        ? { ...r, lastMessageAt: new Date().toISOString() }
        : r
    ))
  }

  const sendImage = async (file) => {
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
    <Box bg={theme.pageBg} minH="100vh">
      <Box maxW="1400px" mx="auto" px={{ base: 0, md: 6 }} py={{ base: 0, md: 6 }}>
        
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
            boxShadow="0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          >
            
            {/* Enhanced Sidebar */}
            <Box 
              w="360px" 
              borderRight="1px solid" 
              borderColor={theme.border} 
              display="flex" 
              flexDirection="column"
              bgGradient={theme.isLight 
                ? "linear(to-b, gray.50, white)" 
                : "linear(to-b, slate.900, slate.800)"
              }
              position="relative"
            >
              {/* Decorative top gradient overlay */}
              <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                h="200px"
                bgGradient="linear(to-b, blue.500/10, transparent)"
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
                      bgGradient="linear(to-br, blue.500, blue.600)"
                      borderRadius="xl"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      boxShadow="0 4px 6px -1px rgba(59, 130, 246, 0.3)"
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
                      bgGradient="linear(to-br, red.500, red.600)"
                      color="white"
                      borderRadius="full"
                      px={2.5}
                      py={1}
                      fontSize="xs"
                      fontWeight="bold"
                      boxShadow="0 2px 4px rgba(239, 68, 68, 0.3)"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Flex>
                <NewRoomInput onCreate={createNewRoom} theme={chatTheme} />
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
                      w="80px" 
                      h="80px" 
                      borderRadius="full"
                      bg={theme.secondaryBg}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      mb={4}
                      border="3px dashed"
                      borderColor={theme.border}
                    >
                      <Icon as={FiMessageCircle} boxSize={8} color={theme.textMuted} />
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

            {/* Enhanced Chat Area */}
            <Box 
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
                opacity={0.4}
                pointerEvents="none"
                style={{
                  bg: theme.isLight
                    ? 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)'
                    : 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.12) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.12) 0%, transparent 50%)',
                  backgroundSize: '100% 100%',
                  animation: 'backgroundFloat 20s ease-in-out infinite',
                }}
              />
              
              {active ? (
                <>
                  <Box position="relative" zIndex={1}>
                    <ChatHeader active={active} theme={chatTheme} apiUrl={apiUrl} />
                  </Box>
                  
                  <Box 
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
                    boxShadow="0 -4px 6px -1px rgba(0, 0, 0, 0.05)"
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
                    <Box
                      w="120px"
                      h="120px"
                      borderRadius="full"
                      bg={theme.cardBg}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      border="3px solid"
                      borderColor={theme.border}
                      boxShadow="0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                      position="relative"
                      _before={{
                        content: '""',
                        position: 'absolute',
                        inset: '-10px',
                        borderRadius: 'full',
                        background: 'blue.500',
                        opacity: 0.1,
                        animation: 'pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                      }}
                    >
                      <Icon as={FiMessageSquare} boxSize={12} color={theme.accent} />
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
                      >
                        <Box 
                          w="6px" 
                          h="6px" 
                          bg="green.500" 
                          borderRadius="full"
                          style={{
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                          }}
                        />
                        <Text fontSize="xs" color={theme.textMuted}>
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
              opacity: 0.1;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.15;
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
          
          @keyframes backgroundFloat {
            0%, 100% {
              background-position: 0% 0%;
            }
            50% {
              background-position: 100% 100%;
            }
          }
        `}
      </style>
    </Box>
  )
}