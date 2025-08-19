import { useEffect, useRef, useState } from 'react'
import { myRooms, openRoom, history } from '../api/chat'
import { Box, Button, HStack, Heading, Input, Text, VStack } from '@chakra-ui/react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuth } from '../context/AuthContext'
import { toaster } from '../components/ui/toaster'

export default function Chat() {
  const [rooms, setRooms] = useState([])
  const [active, setActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const stompRef = useRef(null)
  const { token } = useAuth()

  useEffect(()=>{ myRooms().then(setRooms) },[])

  const connect = (roomId) => {
    if (stompRef.current) stompRef.current.deactivate()
    const socket = new SockJS(import.meta.env.VITE_API_URL + '/ws')
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: async () => {
        client.subscribe(`/topic/rooms/${roomId}`, msg => {
          try { setMessages(prev => [JSON.parse(msg.body), ...prev]) } catch(e){}
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
    if (!stompRef.current || !active) return
    stompRef.current.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ roomId: active.roomId, type: 'TEXT', content: input })
    })
    setInput('')
  }

  return (
    <HStack align="start" spacing={6}>
      <VStack align="stretch" minW="260px" spacing={2}>
        <Heading size="sm">Phòng chat</Heading>
        {rooms.map(r=>(
          <Button key={r.roomId} variant={active?.roomId===r.roomId?'solid':'outline'}
                  onClick={()=>open(r)}>
            Room #{r.roomId} ({r.userAId}–{r.userBId})
          </Button>
        ))}
        {/* mở phòng mới với user id */}
        <HStack>
          <Input placeholder="Peer user id" id="peer-id"/>
          <Button onClick={async()=>{
            const id = document.getElementById('peer-id').value
            if (!id) return
            const r = await openRoom(Number(id))
            setRooms(prev=>[r, ...prev]); open(r)
          }}>Mở</Button>
        </HStack>
      </VStack>

      <VStack align="stretch" flex={1}>
        <Heading size="sm">Tin nhắn {active && `#${active.roomId}`}</Heading>
        <VStack align="stretch" spacing={2} bg="white" p={3} borderRadius="md" className="glass" maxH="60vh" overflowY="auto">
          {messages.map(m=>(
            <Box key={m.id} alignSelf="stretch" bg="gray.50" p={2} borderRadius="md">
              <HStack justify="space-between">
                <Text fontWeight="bold">#{m.senderId}</Text>
                <Text color="gray.500" fontSize="sm">{new Date(m.createdAt).toLocaleString()}</Text>
              </HStack>
              <Text mt={1}>{m.content}</Text>
            </Box>
          ))}
          {messages.length===0 && <Text color="gray.500">Chưa có tin nhắn</Text>}
        </VStack>
        <HStack>
          <Input value={input} onChange={e=>setInput(e.target.value)} placeholder="Nhập tin nhắn…"
                 onKeyDown={e => e.key==='Enter' && send()}/>
          <Button onClick={send}>Gửi</Button>
        </HStack>
      </VStack>
    </HStack>
  )
}
