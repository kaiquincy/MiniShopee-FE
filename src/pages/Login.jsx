import { Box, Button, Heading, Input, VStack } from '@chakra-ui/react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toaster } from '../components/ui/toaster'
import { useAuth } from '../context/AuthContext'


export default function Login() {
  const [username, setU] = useState('')
  const [password, setP] = useState('')
  const { login } = useAuth()
  const nav = useNavigate()

  return (
    <Box maxW="400px" mx="auto" mt={16} p={6} bg="white" borderRadius="md" className="glass">
      <Heading size="md" mb={4}>Login</Heading>
      <VStack spacing={3}>
        <Input placeholder="Username" value={username} onChange={e=>setU(e.target.value)} />
        <Input placeholder="Password" type="password" value={password} onChange={e=>setP(e.target.value)} />
        <Button w="full" onClick={async ()=>{
          try { await login(username, password); nav('/') }
          catch(e){ toaster.create({ title: 'Login failed', status:'error' }) }
        }}>Login</Button>
        <Box fontSize="sm" color="gray.500">
          New customer? <Link to="/register" style={{color:'#228be6'}}>Register here</Link>
        </Box>
      </VStack>
    </Box>
  )
}
