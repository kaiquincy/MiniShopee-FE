import { Box, HStack, Image, Text } from '@chakra-ui/react'

export default function MessageBubble({ m, isMe, theme }) {
  return (
    <Box
      maxW="70%"
      bg={isMe ? '#3B82F6' : theme.messageBg}
      color={isMe ? 'white' : theme.text}
      p={3}
      borderRadius="lg"
      borderTopRightRadius={isMe ? "none" : "lg"}
      borderTopLeftRadius={isMe ? "lg" : "none"}
      shadow="sm"
    >
      <HStack justify="space-between" mb={1} spacing={3}>
        <Text fontSize="xs" fontWeight="bold" color={isMe ? "whiteAlpha.900" : "#3B82F6"}>
          {isMe ? 'You' : `User #${m.senderId}`}
        </Text>
        <Text fontSize="xs" color={isMe ? "whiteAlpha.700" : theme.mutedText}>
          {new Date(m.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' })}
        </Text>
      </HStack>

      {m.type === 'IMAGE' ? (
        <Box>
          <a href={m.content} target="_blank" rel="noreferrer">
            <Image src={m.content} alt={m.fileName || 'image'} borderRadius="md" maxH="320px" objectFit="cover" bg="blackAlpha.200" />
          </a>
          {m.fileName && <Text fontSize="xs" mt={1} opacity={0.8}>{m.fileName}</Text>}
        </Box>
      ) : (
        <Text fontSize="sm">{m.content}</Text>
      )}
    </Box>
  )
}
