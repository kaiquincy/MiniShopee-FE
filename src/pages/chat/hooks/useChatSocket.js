import { useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

export function useChatSocket({ apiUrl, token, roomId, onMessage }) {
  const clientRef = useRef(null)
  const subRef = useRef(null)

  useEffect(() => {
    if (!roomId) return

    // cleanup subs & client cũ
    try { subRef.current?.unsubscribe() } catch {}
    clientRef.current?.deactivate()

    const socket = new SockJS(`${apiUrl}/ws`)
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {}
    })

    client.onConnect = () => {
      subRef.current = client.subscribe(`/topic/rooms/${roomId}`, (msg) => {
        try { onMessage?.(JSON.parse(msg.body)) } catch {}
      })
    }

    client.activate()
    clientRef.current = client

    return () => {
      try { subRef.current?.unsubscribe() } catch {}
      client.deactivate()
    }
  }, [apiUrl, token, roomId, onMessage])

  const send = (payload) => {
    console.log("useChatSocket sending", payload)

    if (!clientRef.current || !roomId) return
    clientRef.current.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ roomId, ...payload })
    })
  }

  return { send }
}
