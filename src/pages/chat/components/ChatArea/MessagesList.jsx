import { Flex, VStack } from '@chakra-ui/react'
import MessageBubble from './MessageBubble'

export default function MessagesList({ messages, meUsername, theme, endRef }) {
  return (
    <VStack align="stretch" flex={2} overflowY="auto" p={4} spacing={3} ref={endRef}>
      {messages.map(m => {
        const isMe = m.senderUsername === meUsername
        const key = m.id ?? `${m.createdAt}-${m.senderId ?? 'u'}`
        return (
          <Flex key={key} justify={isMe ? "flex-end" : "flex-start"}>
            <MessageBubble m={m} isMe={isMe} theme={theme} />
          </Flex>
        )
      })}
    </VStack>
  )
}
