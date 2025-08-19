import { useEffect, useState } from 'react'
import api from '../api/client'
import { VStack, Button, Box } from '@chakra-ui/react'

function Node({ node, onChoose }) {
  return (
    <Box>
      <Button variant="ghost" size="sm" onClick={()=>onChoose(node)}>{node.name}</Button>
      {node.children?.length>0 && (
        <Box pl={4} borderLeft="1px solid #eee">
          {node.children.map(ch => <Node key={ch.id} node={ch} onChoose={onChoose}/>)}
        </Box>
      )}
    </Box>
  )
}

export default function CategorySidebar({ onChange }) {
  const [tree, setTree] = useState([])
  useEffect(()=>{
    api.get('/api/categories/tree').then(({data})=>{
      setTree(data?.result || [])
    })
  },[])
  return (
    <VStack align="stretch" spacing={2} bg="white" p={3} borderRadius="md" className="glass">
      <Button size="sm" onClick={()=>onChange(null)}>Tất cả</Button>
      {tree.map(n => <Node key={n.id} node={n} onChoose={onChange}/>)}
    </VStack>
  )
}
