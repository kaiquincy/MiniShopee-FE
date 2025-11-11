// components/Sidebar/MobileSidebar.jsx
"use client"

import {
  Box, VStack, Text, Icon, Drawer, Portal, CloseButton,
  DrawerHeader, DrawerBody, DrawerFooter, Button
} from "@chakra-ui/react"
import { FiMessageSquare } from "react-icons/fi"
import NewRoomInput from "./NewRoomInput"
import RoomList from "./RoomList"

/**
 * Chakra v3 Drawer (Root/Backdrop/Positioner/Content/CloseTrigger)
 * Props:
 * - open, onOpenChange({ open })
 * - rooms, active, onOpenRoom(room)
 * - theme, apiUrl, meUsername
 * - createNewRoom(value)
 */
export default function MobileSidebar({
  open,
  onOpenChange,
  rooms,
  active,
  onOpenRoom,
  theme,
  apiUrl,
  meUsername,
  createNewRoom,
}) {
  const handleSelectRoom = (r) => {
    onOpenRoom(r)
    onOpenChange({ open: false })
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content bg={theme.secondaryBg}>
            <DrawerHeader borderBottom="1px solid" borderColor={theme.border}>
              <Drawer.Title>Conversations</Drawer.Title>
            </DrawerHeader>

            <DrawerBody p={0}>
              <Box p={4} borderBottom="1px solid" borderColor={theme.border}>
                <NewRoomInput onCreate={createNewRoom} theme={theme} />
              </Box>

              <VStack align="stretch" spacing={0} overflowY="auto" maxH="70vh">
                {rooms.length === 0 ? (
                  <Box p={8} textAlign="center">
                    <Icon as={FiMessageSquare} boxSize={12} color={theme.mutedText} mb={3} />
                    <Text color={theme.mutedText} fontSize="sm">No conversations yet</Text>
                  </Box>
                ) : (
                  <RoomList
                    rooms={rooms}
                    active={active}
                    onOpen={handleSelectRoom}
                    theme={theme}
                    meUsername={meUsername}
                    apiUrl={apiUrl}
                  />
                )}
              </VStack>
            </DrawerBody>

            <DrawerFooter>
              <Button variant="outline" onClick={() => onOpenChange({ open: false })}>Close</Button>
            </DrawerFooter>

            <Drawer.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Drawer.CloseTrigger>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  )
}
