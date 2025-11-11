import { Box, HStack, IconButton, Input, Icon } from '@chakra-ui/react'
import { FiImage, FiSend } from 'react-icons/fi'
import { useRef } from 'react'

export default function Composer({ theme, input, setInput, onSendText, onSendImage }) {
  const fileInputRef = useRef(null)

  const onPickImage = () => fileInputRef.current?.click()
  const onImageSelected = (e) => {
    const file = e.target.files?.[0]
    if (file) onSendImage(file)
    e.target.value = ''
  }

  return (
    <Box p={4} borderTop="1px solid" borderColor={theme.border}>
      <HStack spacing={3}>
        <IconButton
          aria-label="Send image"
          onClick={onPickImage}
          bg={theme.inputBg}
          border="1px solid"
          borderColor={theme.border}
          _hover={{ bg: theme.hoverBg }}
        >
          <Icon as={FiImage} boxSize={5} color={theme.mutedText} />
        </IconButton>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onImageSelected} />

        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          bg={theme.inputBg}
          border="1px solid"
          borderColor={theme.border}
          color={theme.text}
          size="lg"
          _focus={{ borderColor: "#3B82F6" }}
          onKeyDown={e => e.key === 'Enter' && onSendText()}
        />

        <IconButton
          aria-label="Send message"
          bg="#3B82F6"
          color="white"
          size="lg"
          _hover={{ bg: "#2563EB" }}
          onClick={onSendText}
          isDisabled={!input.trim()}
        >
          <FiSend />
        </IconButton>
      </HStack>
    </Box>
  )
}
