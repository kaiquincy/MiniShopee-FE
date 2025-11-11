// components/Mobile/MobileChatNavigator.jsx
"use client"

import { Box, HStack, IconButton, Text, VStack, Icon } from "@chakra-ui/react"
import { motion, AnimatePresence } from "framer-motion"
import { FiArrowLeft, FiMessageSquare } from "react-icons/fi"
import NewRoomInput from "../Sidebar/NewRoomInput"
import RoomList from "../Sidebar/RoomList"
import ChatHeader from "../ChatArea/ChatHeader"
import MessagesList from "../ChatArea/MessagesList"
import Composer from "../ChatArea/Composer"
import { useMemo, useRef } from "react"

// slide variants
const variants = {
  enter: (direction) => ({ x: direction > 0 ? "100%" : "-100%", opacity: 0, position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }),
  center: { x: 0, opacity: 1, position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  exit: (direction) => ({ x: direction < 0 ? "100%" : "-100%", opacity: 0, position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }),
}

export default function MobileChatNavigator({
  rooms, active, onOpenRoom, onBackToList,
  theme, apiUrl, meUsername,
  createNewRoom, messages, endRef,
  input, setInput, sendText, sendImage,
}) {
  // view = list (0) → chat (1)
  const viewIndex = active ? 1 : 0
  const viewportH = typeof window !== "undefined" ? "100dvh" : "100vh"
  const containerSx = useMemo(() => ({
    position: "relative",
    height: `calc(${viewportH} - 140px)`,
    overflow: "hidden",
    border: "1px solid",
    borderColor: theme.border,
    borderRadius: "lg",
    bg: theme.bg
  }), [viewportH, theme])

  const dragThreshold = 80
  const dragOriginRef = useRef(0)

  return (
    <Box sx={containerSx}>
      <AnimatePresence initial={false} custom={1}>
        {/* LIST VIEW */}
        {!active && (
          <Box
            as={motion.div}
            key="list"
            custom={1}
            initial="enter"
            animate="center"
            exit="exit"
            variants={variants}
            transition={{ type: "tween", duration: 0.25 }}
            bg={theme.secondaryBg}
            display="flex"
            flexDir="column"
            h="full"
          >
            <Box p={4} borderBottom="1px solid" borderColor={theme.border}>
              <NewRoomInput onCreate={createNewRoom} theme={theme} />
            </Box>
            <VStack align="stretch" spacing={0} overflowY="auto" flex={1}>
              {rooms.length === 0 ? (
                <Box p={8} textAlign="center">
                  <Icon as={FiMessageSquare} boxSize={12} color={theme.mutedText} mb={3} />
                  <Text color={theme.mutedText} fontSize="sm">No conversations yet</Text>
                </Box>
              ) : (
                <RoomList
                  rooms={rooms}
                  active={null}
                  onOpen={onOpenRoom}   // chọn room -> sang chat
                  theme={theme}
                  meUsername={meUsername}
                  apiUrl={apiUrl}
                />
              )}
            </VStack>
          </Box>
        )}

        {/* CHAT VIEW */}
        {active && (
          <Box
            as={motion.div}
            key="chat"
            custom={1}
            initial="enter"
            animate="center"
            exit="exit"
            variants={variants}
            transition={{ type: "tween", duration: 0.25 }}
            display="flex"
            flexDir="column"
            h="full"
            // swipe to go back
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragStart={(_, info) => { dragOriginRef.current = info.point.x }}
            onDragEnd={(_, info) => {
              const moved = info.point.x - dragOriginRef.current
              if (moved > dragThreshold) onBackToList()
            }}
          >
            {/* Header with back button */}
            <Box p={3} borderBottom="1px solid" borderColor={theme.border}>
              <HStack spacing={3}>
                <IconButton
                  aria-label="Back"
                  size="sm"
                  variant="ghost"
                  onClick={onBackToList}
                >
                    <Icon as={FiArrowLeft} boxSize={5} />
                </IconButton>                
                <ChatHeader active={active} theme={theme} apiUrl={apiUrl} />
              </HStack>
            </Box>

            {/* Messages */}
            <Box flex={1} minH={0} bg="transparent" display="flex" flexDir="column">
              <MessagesList messages={messages} meUsername={meUsername} theme={theme} endRef={endRef} />
            </Box>

            {/* Composer */}
            <Composer
              theme={theme}
              input={input}
              setInput={setInput}
              onSendText={sendText}
              onSendImage={sendImage}
            />
          </Box>
        )}
      </AnimatePresence>
    </Box>
  )
}
