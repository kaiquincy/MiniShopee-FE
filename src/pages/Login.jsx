import { useState } from 'react'
import { Box, Button, Heading, Input, VStack } from '@chakra-ui/react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { toaster } from '../components/ui/toaster'


export default function Login() {
  const [username, setU] = useState('')
  const [password, setP] = useState('')
  const { login } = useAuth()
  const nav = useNavigate()

  return (
    <Box maxW="400px" mx="auto" mt={16} p={6} bg="white" borderRadius="md" className="glass">
      <Heading size="md" mb={4}>Đăng nhập</Heading>
      <VStack spacing={3}>
        <Input placeholder="Username" value={username} onChange={e=>setU(e.target.value)} />
        <Input placeholder="Password" type="password" value={password} onChange={e=>setP(e.target.value)} />
        <Button w="full" onClick={async ()=>{
          try { await login(username, password); nav('/') }
          catch(e){ toaster.create({ title: 'Đăng nhập thất bại', status:'error' }) }
        }}>Đăng nhập</Button>
        <Box fontSize="sm" color="gray.500">
          Chưa có tài khoản? <Link to="/register" style={{color:'#228be6'}}>Đăng ký</Link>
        </Box>
      </VStack>
    </Box>
  )
}
