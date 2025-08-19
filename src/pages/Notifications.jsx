import { useEffect, useState } from 'react'
import { myNotifications, markRead, unreadCount } from '../api/notifications'
import { Box, Heading, VStack, HStack, Text, Button, Badge } from '@chakra-ui/react'

export default function Notifications() {
  const [list, setList] = useState([]); const [unread, setUnread] = useState(0)
  const load = async()=>{ setList(await myNotifications()); setUnread(await unreadCount()) }
  useEffect(()=>{ load() },[])
  return (
    <Box>
      <HStack justify="space-between" mb={3}>
        <Heading size="md">Thông báo</Heading>
        <Badge colorScheme="red">{unread} chưa đọc</Badge>
      </HStack>
      <VStack align="stretch" spacing={3}>
        {list.map(n=>(
          <HStack key={n.id} justify="space-between" bg="white" p={3} borderRadius="md" className="glass">
            <Text>{n.message}</Text>
            {!n.read && <Button size="sm" onClick={async()=>{ await markRead(n.id); load() }}>Đánh dấu đã đọc</Button>}
          </HStack>
        ))}
      </VStack>
    </Box>
  )
}
