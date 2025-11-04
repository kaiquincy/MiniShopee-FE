import { Badge, Box, Button, Flex, HStack, Icon, Input, Text, VStack } from '@chakra-ui/react'
import { Client } from '@stomp/stompjs'
import { useEffect, useRef, useState } from 'react'
import { FiMessageCircle, FiMessageSquare, FiPlus, FiSend, FiUser } from 'react-icons/fi'
import { useLocation } from 'react-router-dom'
import SockJS from 'sockjs-client'
import { history, myRooms, openRoom } from '../api/chat'
import { useAuth } from '../context/AuthContext'

export default function Chat() {
  const [rooms, setRooms] = useState([])
  const [active, setActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [newRoomId, setNewRoomId] = useState('')
  const stompRef = useRef(null)
  const messagesEndRef = useRef(null)
  const { token, user } = useAuth()
  const location = useLocation()
  
  const isLightTheme = location.pathname === '/chat'

  useEffect(() => { myRooms().then(setRooms) }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const connect = (roomId) => {
    if (stompRef.current) stompRef.current.deactivate()
    const socket = new SockJS(import.meta.env.VITE_API_URL + '/ws')
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: async () => {
        client.subscribe(`/topic/rooms/${roomId}`, msg => {
          try { setMessages(prev => [JSON.parse(msg.body), ...prev]) } catch (e) { }
        })
      }
    })
    client.activate()
    stompRef.current = client
  }

  const open = async (r) => {
    setActive(r)
    const page = await history(r.roomId, 0, 30)
    setMessages(page?.content || [])
    connect(r.roomId)
  }

  const send = () => {
    if (!stompRef.current || !active || !input.trim()) return
    stompRef.current.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ roomId: active.roomId, type: 'TEXT', content: input })
    })
    setInput('')
  }

  const createNewRoom = async () => {
    if (!newRoomId) return
    const r = await openRoom(Number(newRoomId))
    setRooms(prev => [r, ...prev])
    open(r)
    setNewRoomId('')
  }

  const theme = {
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
  }

  return (
    <Box color={theme.text} px={isLightTheme ? 16 : 0} my={8}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <HStack>
            <Icon as={FiMessageCircle} boxSize={7} color={isLightTheme ? "#495057" : "white"} />
            <Text fontSize="4xl" fontWeight="black" my={2} color={isLightTheme ? '#212529' : 'white'}>
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
          px={3} 
          py={2} 
          borderRadius="full" 
          fontSize="sm"
          fontWeight="semibold"
        >
          {rooms.length} Conversations
        </Badge>
      </Flex>

      <HStack align="stretch" spacing={6} h="calc(100vh - 250px)">
        {/* Left Sidebar - Room List */}
        <VStack
          align="stretch"
          w="320px"
          bg={theme.secondaryBg}
          border="1px solid"
          borderColor={theme.border}
          borderRadius="lg"
          overflow="hidden"
          shadow={isLightTheme ? 'sm' : 'none'}
        >
          {/* Sidebar Header */}
          <Box p={4} borderBottom="1px solid" borderColor={theme.border}>
            <Text 
              fontSize="sm" 
              fontWeight="bold" 
              color={theme.mutedText} 
              textTransform="uppercase" 
              letterSpacing="wider" 
              mb={3}
            >
              Conversations
            </Text>
            {/* New Room Input */}
            <HStack spacing={2}>
              <Input
                placeholder="User ID"
                value={newRoomId}
                onChange={e => setNewRoomId(e.target.value)}
                bg={theme.inputBg}
                border="1px solid"
                borderColor={theme.border}
                color={theme.text}
                size="sm"
                _placeholder={{ color: theme.mutedText }}
                _focus={{ borderColor: "#3B82F6", boxShadow: `0 0 0 1px #3B82F6` }}
                _hover={{ borderColor: "#3B82F6" }}
                onKeyDown={e => e.key === 'Enter' && createNewRoom()}
              />
              <Button
                size="sm"
                bg="#3B82F6"
                color="white"
                _hover={{ bg: "#2563EB" }}
                onClick={createNewRoom}
                px={3}
              >
                <Icon as={FiPlus} />
              </Button>
            </HStack>
          </Box>

          {/* Room List */}
          <VStack align="stretch" spacing={0} overflowY="auto" flex={1}>
            {rooms.length === 0 ? (
              <Box p={8} textAlign="center">
                <Icon as={FiMessageSquare} boxSize={12} color={theme.mutedText} mb={3} />
                <Text color={theme.mutedText} fontSize="sm">No conversations yet</Text>
              </Box>
            ) : (
              rooms.map(r => (
                <Box
                  key={r.roomId}
                  p={4}
                  cursor="pointer"
                  bg={active?.roomId === r.roomId ? theme.activeBg : "transparent"}
                  borderLeft="3px solid"
                  borderColor={active?.roomId === r.roomId ? "#3B82F6" : "transparent"}
                  transition="all 0.2s"
                  _hover={{ bg: theme.hoverBg }}
                  onClick={() => open(r)}
                >
                  <HStack spacing={3}>
                    <Box
                      w="40px"
                      h="40px"
                      bg="#3B82F6"
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                    >
                      <Icon as={FiUser} color="white" />
                    </Box>
                    <Box flex={1} minW={0}>
                      <Text fontWeight="bold" fontSize="sm" noOfLines={1} color={theme.text}>
                        Room #{r.roomId}
                      </Text>
                      <Text fontSize="xs" color={theme.secondaryText} noOfLines={1}>
                        Users: {r.userAId} • {r.userBId}
                      </Text>
                    </Box>
                    {active?.roomId === r.roomId && (
                      <Box w="8px" h="8px" bg="#3B82F6" borderRadius="full" />
                    )}
                  </HStack>
                </Box>
              ))
            )}
          </VStack>
        </VStack>

        {/* Right - Chat Area */}
        <VStack
          align="stretch"
          flex={1}
          bg={theme.bg}
          border="1px solid"
          borderColor={theme.border}
          borderRadius="lg"
          overflow="hidden"
          shadow={isLightTheme ? 'sm' : 'none'}
        >
          {active ? (
            <>
              {/* Chat Header */}
              <Box p={4} borderBottom="1px solid" borderColor={theme.border}>
                <HStack spacing={3}>
                  <Box
                    w="40px"
                    h="40px"
                    bg="#3B82F6"
                    borderRadius="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon as={FiUser} color="white" />
                  </Box>
                  <Box>
                    <Text fontWeight="bold" color={theme.text}>Room #{active.roomId}</Text>
                    <Text fontSize="sm" color={theme.secondaryText}>
                      Users: {active.userAId} • {active.userBId}
                    </Text>
                  </Box>
                </HStack>
              </Box>

              {/* Messages Area */}
              <VStack
                align="stretch"
                flex={1}
                overflowY="auto"
                p={4}
                spacing={3}
                bg={isLightTheme ? '#F8FAFC' : 'transparent'}
                css={{
                  '&::-webkit-scrollbar': { width: '8px' },
                  '&::-webkit-scrollbar-track': { background: 'transparent' },
                  '&::-webkit-scrollbar-thumb': { 
                    background: isLightTheme ? '#CBD5E1' : '#374151', 
                    borderRadius: '4px' 
                  }
                }}
              >
                {messages.length === 0 ? (
                  <Flex align="center" justify="center" h="full">
                    <Box textAlign="center">
                      <Icon as={FiMessageSquare} boxSize={12} color={theme.mutedText} mb={3} />
                      <Text color={theme.mutedText}>No messages yet</Text>
                      <Text color={theme.mutedText} fontSize="sm" mt={1}>Start the conversation</Text>
                    </Box>
                  </Flex>
                ) : (
                  [...messages].reverse().map(m => {
                    const isMe = m.senderId === user?.id
                    return (
                      <Flex key={m.id} justify={isMe ? "flex-end" : "flex-start"}>
                        <Box
                          maxW="70%"
                          bg={isMe ? theme.myMessageBg : theme.messageBg}
                          color={isMe ? 'white' : theme.text}
                          p={3}
                          borderRadius="lg"
                          borderTopRightRadius={isMe ? "none" : "lg"}
                          borderTopLeftRadius={isMe ? "lg" : "none"}
                          shadow="sm"
                        >
                          <HStack justify="space-between" mb={1} spacing={3}>
                            <Text 
                              fontSize="xs" 
                              fontWeight="bold" 
                              color={isMe ? "whiteAlpha.900" : "#3B82F6"}
                            >
                              {isMe ? 'You' : `User #${m.senderId}`}
                            </Text>
                            <Text 
                              fontSize="xs" 
                              color={isMe ? "whiteAlpha.700" : theme.mutedText}
                            >
                              {new Date(m.createdAt).toLocaleTimeString()}
                            </Text>
                          </HStack>
                          <Text fontSize="sm">{m.content}</Text>
                        </Box>
                      </Flex>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </VStack>

              {/* Input Area */}
              <Box p={4} borderTop="1px solid" borderColor={theme.border}>
                <HStack spacing={3}>
                  <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Type a message..."
                    bg={theme.inputBg}
                    border="1px solid"
                    borderColor={theme.border}
                    color={theme.text}
                    size="lg"
                    _placeholder={{ color: theme.mutedText }}
                    _focus={{ borderColor: "#3B82F6", boxShadow: `0 0 0 1px #3B82F6` }}
                    _hover={{ borderColor: "#3B82F6" }}
                    onKeyDown={e => e.key === 'Enter' && send()}
                  />
                  <Button
                    bg="#3B82F6"
                    color="white"
                    size="lg"
                    px={6}
                    leftIcon={<FiSend />}
                    _hover={{ bg: "#2563EB" }}
                    onClick={send}
                    isDisabled={!input.trim()}
                  >
                    Send
                  </Button>
                </HStack>
              </Box>
            </>
          ) : (
            <Flex align="center" justify="center" h="full">
              <Box textAlign="center">
                <Icon as={FiMessageSquare} boxSize={16} color={theme.mutedText} mb={4} />
                <Text fontSize="lg" fontWeight="bold" mb={2} color={theme.text}>
                  Select a conversation
                </Text>
                <Text color={theme.secondaryText} fontSize="sm">
                  Choose a room from the list or start a new conversation
                </Text>
              </Box>
            </Flex>
          )}
        </VStack>
      </HStack>
    </Box>
  )
}