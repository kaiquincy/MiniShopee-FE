import { Box, Flex, Icon, Text, useBreakpointValue, VStack } from '@chakra-ui/react'
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

  // Chat-specific theme colors based on current theme
  const chatTheme = useMemo(() => ({
    ...theme,
    messageBg: theme.isLight ? '#D8D8D8' : '#0E192B',
    myMessageBg: '#3B82F6',
    myMessageText: '#FFFFFF',
    activeBg: theme.isLight ? '#F0F0F0' : '#334155',
  }), [theme])

  useEffect(() => { myRooms().then(setRooms) }, [])

  // Sort rooms by most recent message/activity
  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => {
      const dateA = new Date(a.lastMsg?.createdAt || 0)
      const dateB = new Date(b.lastMsg?.createdAt || 0)
      return dateB - dateA // Most recent first
    })
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
      // Update room's lastMessageAt when receiving a message
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
    
    // Move the active room to top by updating its timestamp
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
        
        {/* Mobile Layout */}
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
          /* Desktop Layout */
          <Flex 
            h="calc(100vh - 100px)" 
            gap={0} 
            border="1px solid" 
            borderColor={theme.border} 
            borderRadius="xl" 
            overflow="hidden" 
            bg={theme.cardBg}
          >
            
            {/* Sidebar */}
            <Box 
              w="360px" 
              borderRight="1px solid" 
              borderColor={theme.border} 
              display="flex" 
              flexDirection="column"
              bg={theme.cardBg}
            >
              
              {/* Sidebar Header */}
              <Box px={5} py={4} borderBottom="1px solid" borderColor={theme.border}>
                <Flex justify="space-between" align="center" mb={4}>
                  <Text fontSize="xl" fontWeight="bold" color={theme.text}>
                    Messages
                  </Text>
                </Flex>
                <NewRoomInput onCreate={createNewRoom} theme={chatTheme} />
              </Box>
              
              {/* Room List */}
              <Box flex={1} overflowY="auto">
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
                      w="48px" 
                      h="48px" 
                      borderRadius="full" 
                      bg={theme.secondaryBg}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      mb={3}
                    >
                      <Icon as={FiMessageCircle} boxSize={5} color={theme.textMuted} />
                    </Box>
                    <Text fontSize="sm" color={theme.textSecondary} textAlign="center">
                      No conversations yet
                    </Text>
                  </Flex>
                )}
              </Box>
            </Box>

            {/* Chat Area */}
            <Box flex={1} display="flex" flexDirection="column" bg={theme.secondaryBg}>
              {active ? (
                <>
                  <ChatHeader active={active} theme={chatTheme} apiUrl={apiUrl} />
                  <Box flex={1} overflowY="auto">
                    <MessagesList 
                      messages={messages} 
                      meUsername={user?.username} 
                      theme={chatTheme} 
                      endRef={endRef} 
                    />
                  </Box>
                  <Composer 
                    theme={chatTheme} 
                    input={input} 
                    setInput={setInput} 
                    onSendText={sendText} 
                    onSendImage={sendImage} 
                  />
                </>
              ) : (
                <Flex align="center" justify="center" h="full">
                  <VStack spacing={4}>
                    <Box
                      w="80px"
                      h="80px"
                      borderRadius="full"
                      bg={theme.cardBg}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      border="1px solid"
                      borderColor={theme.border}
                    >
                      <Icon as={FiMessageSquare} boxSize={8} color={theme.textMuted} />
                    </Box>
                    <VStack spacing={1}>
                      <Text fontSize="md" fontWeight="semibold" color={theme.text}>
                        Select a conversation
                      </Text>
                      <Text color={theme.textSecondary} fontSize="sm" textAlign="center" maxW="260px">
                        Pick a chat from the sidebar to start messaging
                      </Text>
                    </VStack>
                  </VStack>
                </Flex>
              )}
            </Box>
          </Flex>
        )}
      </Box>
    </Box>
  )
}