import { HStack, Input, InputGroup, Button } from '@chakra-ui/react'
import { FiPlus, FiSearch } from 'react-icons/fi'
import { useState } from 'react'

export default function NewRoomInput({ onCreate, theme }) {
  const [value, setValue] = useState('')
  const submit = () => { if (!value) return; onCreate(value); setValue('') }

  return (
    <HStack spacing={2}>
      <InputGroup startElement={<FiSearch/>}>
        <Input
          placeholder="Start a chat by user ID"
          value={value}
          onChange={e => setValue(e.target.value)}
          bg={theme.inputBg}
          color={theme.text}
          size="sm"
          _focus={{ borderColor: "#3B82F6" }}
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
      </InputGroup>
      <Button size="sm" bg="#3B82F6" color="white" _hover={{ bg: "#2563EB" }} onClick={submit}>
        <FiPlus />
      </Button>
    </HStack>
  )
}
