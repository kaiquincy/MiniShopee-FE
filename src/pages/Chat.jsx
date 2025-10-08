import { Badge, Box, Button, Flex, HStack, Heading, Icon, Input, Text, VStack } from '@chakra-ui/react'
import { Client } from '@stomp/stompjs'
import { useEffect, useRef, useState } from 'react'
import { FiMessageSquare, FiPlus, FiSend, FiUser } from 'react-icons/fi'
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

  return (
    <Box color="white">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading size="2xl" fontWeight="black" mb={2}>Messages</Heading>
          <Text color="whiteAlpha.600">Chat with customers and sellers</Text>
        </Box>
        <Badge bg="brand.500" color="white" px={3} py={2} borderRadius="full" fontSize="sm">
          {rooms.length} Conversations
        </Badge>
      </Flex>

      <HStack align="stretch" spacing={6} h="calc(100vh - 250px)">
        {/* Left Sidebar - Room List */}
        <VStack
          align="stretch"
          w="320px"
          bg="gray.900"
          border="1px solid"
          borderColor="whiteAlpha.200"
          borderRadius="lg"
          overflow="hidden"
        >
          {/* Sidebar Header */}
          <Box p={4} borderBottom="1px solid" borderColor="whiteAlpha.200">
            <Text fontSize="sm" fontWeight="bold" color="whiteAlpha.700" textTransform="uppercase" letterSpacing="wider" mb={3}>
              Conversations
            </Text>
            {/* New Room Input */}
            <HStack spacing={2}>
              <Input
                placeholder="User ID"
                value={newRoomId}
                onChange={e => setNewRoomId(e.target.value)}
                bg="gray.800"
                border="1px solid"
                borderColor="whiteAlpha.200"
                color="white"
                size="sm"
                _placeholder={{ color: "whiteAlpha.500" }}
                _focus={{ borderColor: "brand.500" }}
                onKeyDown={e => e.key === 'Enter' && createNewRoom()}
              />
              <Button
                size="sm"
                bg="brand.500"
                color="white"
                _hover={{ bg: "brand.600" }}
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
                <Icon as={FiMessageSquare} boxSize={12} color="whiteAlpha.300" mb={3} />
                <Text color="whiteAlpha.500" fontSize="sm">No conversations yet</Text>
              </Box>
            ) : (
              rooms.map(r => (
                <Box
                  key={r.roomId}
                  p={4}
                  cursor="pointer"
                  bg={active?.roomId === r.roomId ? "gray.800" : "transparent"}
                  borderLeft="3px solid"
                  borderColor={active?.roomId === r.roomId ? "brand.500" : "transparent"}
                  transition="all 0.2s"
                  _hover={{ bg: "gray.800" }}
                  onClick={() => open(r)}
                >
                  <HStack spacing={3}>
                    <Box
                      w="40px"
                      h="40px"
                      bg="brand.500"
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                    >
                      <Icon as={FiUser} color="white" />
                    </Box>
                    <Box flex={1} minW={0}>
                      <Text fontWeight="bold" fontSize="sm" noOfLines={1}>
                        Room #{r.roomId}
                      </Text>
                      <Text fontSize="xs" color="whiteAlpha.600" noOfLines={1}>
                        Users: {r.userAId} • {r.userBId}
                      </Text>
                    </Box>
                    {active?.roomId === r.roomId && (
                      <Box w="8px" h="8px" bg="brand.500" borderRadius="full" />
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
          bg="gray.900"
          border="1px solid"
          borderColor="whiteAlpha.200"
          borderRadius="lg"
          overflow="hidden"
        >
          {active ? (
            <>
              {/* Chat Header */}
              <Box p={4} borderBottom="1px solid" borderColor="whiteAlpha.200">
                <HStack spacing={3}>
                  <Box
                    w="40px"
                    h="40px"
                    bg="brand.500"
                    borderRadius="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon as={FiUser} color="white" />
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Room #{active.roomId}</Text>
                    <Text fontSize="sm" color="whiteAlpha.600">
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
                css={{
                  '&::-webkit-scrollbar': { width: '8px' },
                  '&::-webkit-scrollbar-track': { background: 'transparent' },
                  '&::-webkit-scrollbar-thumb': { background: '#374151', borderRadius: '4px' }
                }}
              >
                {messages.length === 0 ? (
                  <Flex align="center" justify="center" h="full">
                    <Box textAlign="center">
                      <Icon as={FiMessageSquare} boxSize={12} color="whiteAlpha.300" mb={3} />
                      <Text color="whiteAlpha.500">No messages yet</Text>
                      <Text color="whiteAlpha.400" fontSize="sm" mt={1}>Start the conversation</Text>
                    </Box>
                  </Flex>
                ) : (
                  [...messages].reverse().map(m => {
                    const isMe = m.senderId === user?.id
                    return (
                      <Flex key={m.id} justify={isMe ? "flex-end" : "flex-start"}>
                        <Box
                          maxW="70%"
                          bg={isMe ? "brand.500" : "gray.800"}
                          color="white"
                          p={3}
                          borderRadius="lg"
                          borderTopRightRadius={isMe ? "none" : "lg"}
                          borderTopLeftRadius={isMe ? "lg" : "none"}
                        >
                          <HStack justify="space-between" mb={1} spacing={3}>
                            <Text fontSize="xs" fontWeight="bold" color={isMe ? "whiteAlpha.900" : "brand.400"}>
                              {isMe ? 'You' : `User #${m.senderId}`}
                            </Text>
                            <Text fontSize="xs" color={isMe ? "whiteAlpha.700" : "whiteAlpha.500"}>
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
              <Box p={4} borderTop="1px solid" borderColor="whiteAlpha.200">
                <HStack spacing={3}>
                  <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Type a message..."
                    bg="gray.800"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    color="white"
                    size="lg"
                    _placeholder={{ color: "whiteAlpha.500" }}
                    _focus={{ borderColor: "brand.500" }}
                    onKeyDown={e => e.key === 'Enter' && send()}
                  />
                  <Button
                    bg="brand.500"
                    color="white"
                    size="lg"
                    px={6}
                    leftIcon={<FiSend />}
                    _hover={{ bg: "brand.600" }}
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
                <Icon as={FiMessageSquare} boxSize={16} color="whiteAlpha.300" mb={4} />
                <Text fontSize="lg" fontWeight="bold" mb={2}>Select a conversation</Text>
                <Text color="whiteAlpha.600" fontSize="sm">
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