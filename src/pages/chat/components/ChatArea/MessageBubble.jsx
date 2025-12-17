// MessageBubble.jsx - Updated with date and 24h time format

import { Box, Text } from '@chakra-ui/react'

export default function MessageBubble({ m, isMe, theme, onMediaLoad }) {
  // Format time and date
  const formatDateTime = (dateString) => {
    const msgDate = new Date(dateString)
    const now = new Date()
    
    // Check if message is from today
    const isToday = msgDate.toDateString() === now.toDateString()
    
    // Format time in 24h format (HH:mm)
    const time = msgDate.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    
    // If today, show only time. Otherwise show dd/mm and time
    if (isToday) {
      return time
    } else {
      const day = String(msgDate.getDate()).padStart(2, '0')
      const month = String(msgDate.getMonth() + 1).padStart(2, '0')
      return `${day}/${month} ${time}`
    }
  }

  return (
    <Box
      maxW="70%"
      bg={isMe ? theme.myMessageBg : theme.messageBg}
      color={isMe ? theme.myMessageText : theme.text}
      px={4}
      py={2.5}
      borderRadius="2xl"
      borderBottomRightRadius={isMe ? 'sm' : '2xl'}
      borderBottomLeftRadius={isMe ? '2xl' : 'sm'}
    >
      {/* Sender name for received messages */}
      {!isMe && (
        <Text 
          fontSize="xs" 
          fontWeight="semibold" 
          color={theme.secondaryText}
          mb={1}
        >
          {m.senderUsername}
        </Text>
      )}
      
      {/* Message content */}
      {m.type === 'IMAGE' ? (
        <Box 
          as="img" 
          src={m.content} 
          alt="Image" 
          maxW="200px" 
          onLoad={onMediaLoad}
          borderRadius="lg" 
        />
      ) : (
        <Text fontSize="sm" lineHeight="1.5">
          {m.content}
        </Text>
      )}
      
      {/* Date and Time */}
      <Text 
        fontSize="xs" 
        color={isMe ? 'whiteAlpha.700' : theme.mutedText}
        mt={1}
        textAlign="right"
      >
        {formatDateTime(m.createdAt)}
      </Text>
    </Box>
  )
}