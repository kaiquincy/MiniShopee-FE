import { Badge, Box, Flex, HStack, Icon, Text, VStack, Button, Stack, useDisclosure, useBreakpointValue, Drawer} from '@chakra-ui/react'
import { FiMessageCircle, FiMessageSquare, FiMenu } from 'react-icons/fi'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { myRooms, openRoom, history } from '../../api/chat'
import { useAuth } from '../../context/AuthContext'
import { useChatSocket } from './hooks/useChatSocket'
import { useAutoScroll } from './hooks/useAutoScroll'
import NewRoomInput from './components/Sidebar/NewRoomInput'
import RoomList from './components/Sidebar/RoomList'
import ChatHeader from './components/ChatArea/ChatHeader'
import MessagesList from './components/ChatArea/MessagesList'
import Composer from './components/ChatArea/Composer'
import MobileChatNavigator from './components/Mobile/MobileChatNavigator' // <-- thêm


export default function Chat() {
  const isMobile = useBreakpointValue({ base: true, md: false })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [rooms, setRooms] = useState([])
  const [active, setActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const { token, user } = useAuth()
  const location = useLocation()
  const apiUrl = import.meta.env.VITE_API_URL
  const isLightTheme = location.pathname === '/chat'
  const endRef = useAutoScroll([messages])

  const theme = useMemo(() => ({
    bg: isLightTheme ? 'white' : 'gray.900',
    secondaryBg: isLightTheme ? '#F8FAFC' : 'gray.900',
    border: isLightTheme ? '#E2E8F0' : 'whiteAlpha.200',
    text: isLightTheme ? '#212529' : 'white',
    secondaryText: isLightTheme ? '#6c757d' : 'whiteAlpha.600',
    mutedText: isLightTheme ? '#94A3B8' : 'whiteAlpha.500',
    inputBg: isLightTheme ? 'white' : 'gray.800',
    hoverBg: isLightTheme ? '#F1F5F9' : 'gray.800',
    activeBg: isLightTheme ? '#EFF6FF' : 'gray.800',
    messageBg: isLightTheme ? '#F1F5F9' : 'gray.800',
    myMessageBg: '#3B82F6',
  }), [isLightTheme])

  useEffect(() => { myRooms().then(setRooms) }, [])

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
    onMessage: (incoming) => setMessages(prev => [...prev, incoming]),
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
  }

  // Bạn có thể thay bằng upload REST -> gửi URL qua STOMP
  const sendImage = async (file) => {
    if (!active || !file) return
    const reader = new FileReader()
    reader.onload = () => {
      send({ type: 'IMAGE', content: reader.result, fileName: file.name, mimeType: file.type })
    }
    reader.readAsDataURL(file)
  }

  const createNewRoom = async (value) => {
    // nếu value là số userId
    const r = await openRoom(Number(value))
    setRooms(prev => [r, ...prev])
    open(r)
  }

  return (
    <Box color={theme.text} px={isLightTheme && !isMobile ? 16 : 0} my={8}>
      {!isMobile && (
        <Flex justify="space-between" align="center" mb={8}>
            <Box>
                <HStack>
                    {isMobile && (
                        <Button
                            aria-label="Open conversations"
                            onClick={() => setDrawerOpen(true)}
                            variant="ghost"
                            >
                            <FiMenu size="24" />
                        </Button>
                    )}
                    <Icon as={FiMessageCircle} boxSize={7} color={isLightTheme ? "#495057" : "white"} />
                    <Text fontSize={{ base: "2xl", md: "4xl" }} fontWeight="black" my={2} color={isLightTheme ? '#212529' : 'white'}>
                        Messages
                    </Text>
                </HStack>
            <Text color={theme.secondaryText} fontSize="lg">Chat with customers and sellers</Text>
            </Box>
            <Badge
            bg={isLightTheme ? '#3B82F615' : 'brand.500'}
            color={isLightTheme ? '#212529' : 'white'}
            border={isLightTheme ? '1px solid' : 'none'}
            borderColor={isLightTheme ? '#3B82F630' : 'transparent'}
            px={3} py={2} borderRadius="full" fontSize="sm" fontWeight="semibold"
            >
            {rooms.length} Conversations
            </Badge>
        </Flex>
      )}

      {/* MOBILE: Navigator kiểu Messenger */}
      {isMobile ? (
        <MobileChatNavigator
          rooms={rooms}
          active={active}
          onOpenRoom={open}
          onBackToList={backToList}
          theme={theme}
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
        // DESKTOP:
        <HStack align="stretch" spacing={6} h="calc(100vh - 210px)">
            {/* Sidebar */}
            <VStack align="stretch" w="320px" bg={theme.secondaryBg} border="1px solid" borderColor={theme.border} borderRadius="lg" overflow="hidden">
                <Box p={4} borderBottom="1px solid" borderColor={theme.border}>
                    <NewRoomInput onCreate={createNewRoom} theme={theme} />
                </Box>
                <RoomList rooms={rooms} active={active} onOpen={open} theme={theme} meUsername={user?.username} apiUrl={apiUrl} />
            </VStack>

            {/* Chat Area */}
            <VStack align="stretch" flex={1} bg={theme.bg} border="1px solid" borderColor={theme.border} borderRadius="lg" overflow="hidden" gap={0}>
            {active ? (
                <>
                <ChatHeader active={active} theme={theme} apiUrl={apiUrl} />
                <MessagesList messages={messages} meUsername={user?.username} theme={theme} endRef={endRef} />
                <Composer theme={theme} input={input} setInput={setInput} onSendText={sendText} onSendImage={sendImage} />
                </>
            ) : (
                <Flex align="center" justify="center" h="full">
                <Box textAlign="center">
                    <Icon as={FiMessageSquare} boxSize={16} color={theme.mutedText} mb={4} />
                    <Text fontSize="lg" fontWeight="bold" mb={2} color={theme.text}>Select a conversation</Text>
                    <Text color={theme.secondaryText} fontSize="sm">Choose a room from the list or start a new conversation</Text>
                </Box>
                </Flex>
            )}
            </VStack>
        </HStack>
        )}
    </Box>
  )
}
