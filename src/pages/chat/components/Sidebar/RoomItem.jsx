import { Box, HStack, Image, Text } from '@chakra-ui/react'
import { memo } from 'react'
import { timeAgo } from '../../utils/timeAgo'

function RoomItemBase({ r, active, onOpen, theme, meUsername, apiUrl }) {
  const isActive = active?.roomId === r.roomId
  const last = r?.lastMsg
  const prefix = last ? (last.senderUsername === meUsername ? 'You' : last.senderUsername) : ''
  const preview = last ? `${prefix}: ${last.content}` : 'No messages yet'

  return (
    <Box
      px={3}
      py={1.5}
      // pt={2}
      // pb={0}
      cursor="pointer"
      bg={isActive ? theme.activeBg : "transparent"}
      borderLeft="3px solid"
      borderColor={isActive ? "#3B82F6" : "transparent"}
      _hover={{ bg: theme.hoverBg }}
      onClick={() => onOpen(r)}
    >
      <HStack spacing={3}>
        <Box w="50px" h="50px" bg="#3B82F6" borderRadius="full" overflow="hidden" display="flex" alignItems="center" justifyContent="center">
          {r.userBAvatarUrl
            ? <Image src={`${apiUrl}/uploads/${r.userBAvatarUrl}`} alt={r.userBFullName || 'avatar'} />
            : <Text color="white" fontWeight="bold" fontSize="lg">{r.userBFullName?.[0]?.toUpperCase() || '?'}</Text>}
        </Box>
        <Box flex={1} minW={0}>
          <Text fontWeight="bold" fontSize="sm" noOfLines={1} color={theme.text}>
            {r.userBFullName || "(No Name)"}
          </Text>

          <HStack gap={1} spacing={1} align="center">
            <Text fontSize="xs" color={theme.secondaryText} noOfLines={1}>{preview}</Text>
            {last && (
              <>
                <Box w="4px" h="4px" bg={theme.secondaryText} borderRadius="full" />
                <Text fontSize="xs" color={theme.secondaryText}>{timeAgo(last.createdAt)}</Text>
              </>
            )}
          </HStack>
        </Box>
        {isActive && <Box w="8px" h="8px" bg="#3B82F6" borderRadius="full" />}
      </HStack>
    </Box>
  )
}

export default memo(RoomItemBase)
