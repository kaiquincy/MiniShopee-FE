import { Box, Icon, Text, VStack } from '@chakra-ui/react'
import { FiMessageSquare } from 'react-icons/fi'
import RoomItem from './RoomItem'

export default function RoomList({ rooms, active, onOpen, theme, meUsername, apiUrl }) {
  return (
    <VStack align="stretch" gap={0} spacing={0} overflowY="auto" flex={1}pt={1.5}>
      {rooms.length === 0 ? (
        <Box p={8} textAlign="center">
          <Icon as={FiMessageSquare} boxSize={12} color={theme.mutedText} mb={3} />
          <Text color={theme.mutedText} fontSize="sm">No conversations yet</Text>
        </Box>
      ) : (
        rooms.map(r => (
          <RoomItem
            key={r.roomId}
            r={r}
            active={active}
            onOpen={onOpen}
            theme={theme}
            meUsername={meUsername}
            apiUrl={apiUrl}
          />
        ))
      )}
    </VStack>
  )
}
