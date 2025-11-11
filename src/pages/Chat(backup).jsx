import { Badge, Box, Button, Flex, HStack, Icon, IconButton,InputGroup , Image, Input, Text, VStack } from '@chakra-ui/react'
import { Client } from '@stomp/stompjs'
import { useEffect, useRef, useState } from 'react'
import { FiMessageCircle, FiMessageSquare, FiPlus, FiSend, FiUser, FiImage, FiSearch } from 'react-icons/fi'
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
  const messagesContainerRef = useRef(null)
  const fileInputRef = useRef(null)
  const { token, user } = useAuth()
  const location = useLocation()

  const isLightTheme = location.pathname === '/chat'

  useEffect(() => { myRooms().then(setRooms) }, [])

  useEffect(() => {
    messagesContainerRef.current?.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: 'smooth'
    })
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

  const sendImage = (file) => {
    if (!stompRef.current || !active || !file) return
    // Optional: limit size (e.g., 5MB)
    // if (file.size > 5 * 1024 * 1024) return
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result // data URL
      stompRef.current.publish({
        destination: '/app/chat.send',
        body: JSON.stringify({
          roomId: active.roomId,
          type: 'IMAGE',
          content: base64,
          fileName: file.name,
          mimeType: file.type
        })
      })
    }
    reader.readAsDataURL(file)
  }

  function timeAgo(timestamp) {
    const diff = Date.now() - new Date(timestamp).getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const months = Math.floor(days / 30)
    const years = Math.floor(days / 365)

    if (seconds < 60) return `${seconds}s`
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    if (days < 30) return `${days}d`
    if (months < 12) return `${months}M`
    return `${years}Y`
  }

  const onPickImage = () => fileInputRef.current?.click()

  const onImageSelected = (e) => {
    const file = e.target.files?.[0]
    if (file) sendImage(file)
    e.target.value = ''
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

      <HStack align="stretch" spacing={6} h="calc(100vh - 210px)">
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
            {/* <Text 
              fontSize="sm" 
              fontWeight="bold" 
              color={theme.mutedText} 
              textTransform="uppercase" 
              letterSpacing="wider" 
              mb={3}
            >
              Conversations
            </Text> */}
            {/* New Room Input */}
            <HStack spacing={2}>
              <InputGroup startElement={<FiSearch/>}>
                <Input
                  placeholder="Search someone by @username"
                  value={newRoomId}
                  onChange={e => setNewRoomId(e.target.value)}
                  bg={theme.inputBg}
                  // border="1px solid"
                  // borderColor={theme.border}
                  color={theme.text}
                  size="sm"
                  // _placeholder={{ color: theme.mutedText }}
                  _focus={{ borderColor: "#3B82F6", boxShadow: `0 0 0 0 #3B82F6` }}
                  _hover={{ borderColor: "#3B82F6" }}
                  onKeyDown={e => e.key === 'Enter' && createNewRoom()}
                />
              </InputGroup>
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
                      w="50px"
                      h="50px"
                      bg="#3B82F6"
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {/* <Icon as={FiUser} color="white" /> */}

                      {r.userBAvatarUrl ? (
                        <Image 
                          src={import.meta.env.VITE_API_URL + "/uploads/" + r.userBAvatarUrl}
                          alt={r.userBFullName || 'avatar'}
                          borderRadius="full"
                          // objectFit="cover"
                        />
                      ) : <Text color="white" fontWeight="bold" fontSize="lg">
                            {r.userBFullName ? r.userBFullName.charAt(0).toUpperCase() : '?'}
                          </Text>
                      }

                    </Box>
                    <Box flex={1} minW={0}>
                      <Text fontWeight="bold" fontSize="sm" noOfLines={1} color={theme.text}>
                        {r.userBFullName ? r.userBFullName : "(No Name)"}
                      </Text>
                      <Box gap={1} display="flex" alignItems="center" flexDirection="row">
                        <Text fontSize="xs" color={theme.secondaryText} noOfLines={1}>
                          {r?.lastMsg
                            ? `${r.lastMsg.senderUsername === user?.username ? "You" : r.lastMsg.senderUsername}: ${r.lastMsg.content}`
                            : 'No messages yet'} 
                        </Text>
                        <Box w="4px" h="4px" bg={theme.secondaryText} borderRadius="full" />
                        <Text fontSize="xs" color={theme.secondaryText}>
                          {r.lastMsg?.createdAt ? timeAgo(r.lastMsg.createdAt) : ''}
                        </Text>
                      </Box> 
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
          gap={0}
        >
          {active ? (
            <>
              {/* Chat Header */}
              <Box p={4} m={0} borderBottom="1px solid" borderColor={theme.border}>
                <HStack spacing={3}>
                  <Box
                    w="45px"
                    h="45px"
                    // bg="#3B82F6"
                    borderRadius="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                      {active.userBAvatarUrl ? (
                        <Image 
                          src={import.meta.env.VITE_API_URL + "/uploads/" + active.userBAvatarUrl}
                          borderRadius="full"
                          // objectFit="cover"
                        />
                      ) : <Text color="white" fontWeight="bold" fontSize="lg">
                            {active.userBFullName ? active.userBFullName.charAt(0).toUpperCase() : '?'}
                          </Text>
                      }
                  </Box>
                  <Box>
                    <Text fontWeight="bold" color={theme.text}>{active.userBFullName ? active.userBFullName : "(No Name)"}</Text>
                    <Text fontSize="sm" color={theme.secondaryText}>
                      @{active.userBId}
                    </Text>
                  </Box>
                </HStack>
              </Box>

              {/* Messages Area */}
              <VStack
                align="stretch"
                flex={2}
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
                ref={messagesContainerRef}
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
                    const isMe = m.senderUsername === user?.username
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
                            {/* <Text 
                              fontSize="xs" 
                              fontWeight="bold" 
                              color={isMe ? "whiteAlpha.900" : "#3B82F6"}
                            >
                              {isMe ? 'You' : `User #${m.senderId}`}
                            </Text> */}
                            {/* <Text 
                              fontSize="xs" 
                              color={isMe ? "whiteAlpha.700" : theme.mutedText}
                            >
                              {new Date(m.createdAt).toLocaleTimeString()}
                            </Text> */}
                          </HStack>

                          {m.type === 'IMAGE' ? (
                            <Box>
                              <a href={m.content} target="_blank" rel="noreferrer">
                                <Image
                                  src={m.content}
                                  alt={m.fileName || 'image'}
                                  borderRadius="md"
                                  maxH="320px"
                                  objectFit="cover"
                                  bg="blackAlpha.200"
                                />
                              </a>
                              {m.fileName && (
                                <Text fontSize="xs" mt={1} opacity={0.8}>
                                  {m.fileName}
                                </Text>
                              )}
                            </Box>
                          ) : (
                            <Text fontSize="sm">{m.content}</Text>
                          )}
                        </Box>
                      </Flex>
                    )
                  })
                )}
              </VStack>

              {/* Input Area */}
              <Box p={4} borderTop="1px solid" borderColor={theme.border}>
                <HStack spacing={3}>
                  {/* Nút chọn ảnh */}
                  <IconButton
                    aria-label="Send image"
                    onClick={onPickImage}
                    bg={theme.inputBg}
                    border="1px solid"
                    borderColor={theme.border}
                    _hover={{ bg: theme.hoverBg }}>
                    <Icon as={FiImage} color={theme.mutedText} />
                    </IconButton>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={onImageSelected}
                  />

                  {/* Ô nhập text */}
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
                    _focus={{ borderColor: "#3B82F6", boxShadow: `0 0 0 0px #3B82F6` }}
                    _hover={{ borderColor: "#3B82F6" }}
                    onKeyDown={e => e.key === 'Enter' && send()}
                  />

                  {/* Nút gửi chỉ icon */}
                  <IconButton
                    aria-label="Send message"
                    bg="#3B82F6"
                    color="white"
                    size="lg"
                    _hover={{ bg: "#2563EB" }}
                    onClick={send}
                    isDisabled={!input.trim()}
                  >
                    <Icon as={FiSend} />
                  </IconButton>
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
