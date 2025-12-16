// MessagesList.jsx - With date separators and fixed scrolling

import { Box, Flex, Text, VStack } from '@chakra-ui/react'
import MessageBubble from './MessageBubble'

export default function MessagesList({ messages, meUsername, theme, endRef }) {
  
  // Helper to get date string for comparison
  const getDateString = (dateString) => {
    return new Date(dateString).toDateString()
  }

  // Helper to format date label
  const getDateLabel = (dateString) => {
    const msgDate = new Date(dateString)
    const now = new Date()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    if (msgDate.toDateString() === now.toDateString()) {
      return 'Today'
    } else if (msgDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      // Format as dd/mm/yyyy
      const day = String(msgDate.getDate()).padStart(2, '0')
      const month = String(msgDate.getMonth() + 1).padStart(2, '0')
      const year = msgDate.getFullYear()
      return `${day}/${month}/${year}`
    }
  }

  return (
    <VStack align="stretch" p={4} spacing={3}>
      {messages.map((m, index) => {
        const isMe = m.senderUsername === meUsername
        const key = m.id ?? `${m.createdAt}-${m.senderId ?? 'u'}`
        
        // Check if we need to show a date separator
        const currentDate = getDateString(m.createdAt)
        const prevMessage = messages[index - 1]
        const prevDate = prevMessage ? getDateString(prevMessage.createdAt) : null
        const showDateSeparator = index === 0 || currentDate !== prevDate

        return (
          <Box key={key}>
            {/* Date Separator */}
            {showDateSeparator && (
              <Flex align="center" justify="center" my={4}>
                <Box h="1px" flex={1} bg={theme.border} />
                <Text 
                  px={4} 
                  fontSize="xs" 
                  color={theme.mutedText}
                  fontWeight="medium"
                  whiteSpace="nowrap"
                >
                  {getDateLabel(m.createdAt)}
                </Text>
                <Box h="1px" flex={1} bg={theme.border} />
              </Flex>
            )}
            
            {/* Message */}
            <Flex justify={isMe ? "flex-end" : "flex-start"}>
              <MessageBubble m={m} isMe={isMe} theme={theme} />
            </Flex>
          </Box>
        )
      })}
      <div ref={endRef} />
    </VStack>
  )
}