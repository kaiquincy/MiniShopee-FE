import { useState } from 'react'
import { Box, Button, Heading, Input, VStack } from '@chakra-ui/react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { toaster } from '../components/ui/toaster'


export default function Register() {
  const [username, setU] = useState(''), [email, setE] = useState(''), [password, setP] = useState('')
  const { register } = useAuth()
  const nav = useNavigate()

  return (
    <Box maxW="400px" mx="auto" mt={16} p={6} bg="white" borderRadius="md" className="glass">
      <Heading size="md" mb={4}>Đăng ký</Heading>
      <VStack spacing={3}>
        <Input placeholder="Username" value={username} onChange={e=>setU(e.target.value)} />
        <Input placeholder="Email" value={email} onChange={e=>setE(e.target.value)} />
        <Input placeholder="Password" type="password" value={password} onChange={e=>setP(e.target.value)} />
        <Button w="full" onClick={async()=>{
          try{ await register({ username, email, password }); nav('/login')}
          catch(e){ toaster.create({ title:'Đăng ký thất bại', status:'error'}) }
        }}>Đăng ký</Button>
      </VStack>
    </Box>
  )
}
