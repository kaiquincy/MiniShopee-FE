import { Box, HStack, Image, Text } from '@chakra-ui/react'

export default function ChatHeader({ active, theme, apiUrl }) {
  return (
    <Box p={4} borderBottom="1px solid" borderColor={theme.border}>
      <HStack spacing={3}>
        <Box w="45px" h="45px" bg="#3B82F6" borderRadius="full" overflow="hidden" display="flex" alignItems="center" justifyContent="center">
          {active.userBAvatarUrl
            ? <Image src={`${apiUrl}/uploads/${active.userBAvatarUrl}`} alt={active.userBFullName || 'avatar'} />
            : <Text color="white" fontWeight="bold" fontSize="lg">{active.userBFullName?.[0]?.toUpperCase() || '?'}</Text>}
        </Box>
        <Box>
          <Text fontWeight="bold" color={theme.text}>{active.userBFullName || "(No Name)"}</Text>
          <Text fontSize="sm" color={theme.secondaryText}>@{active.userBId}</Text>
        </Box>
      </HStack>
    </Box>
  )
}
