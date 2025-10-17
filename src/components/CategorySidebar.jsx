import { Box, Button, IconButton, VStack } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { FiChevronDown, FiChevronRight } from 'react-icons/fi'
import api from '../api/client'

function Node({ node, onChoose, activeId, level = 0 }) {
  const [open, setOpen] = useState(true)
  const hasChildren = node.children?.length > 0
  const isActive = activeId === node.id

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1}>
        {hasChildren ? (
          <IconButton
            size="xs"
            variant="ghost"
            aria-label={open ? 'Collapse' : 'Expand'}
            onClick={() => setOpen(o => !o)}
            color="#6C757D"
            _hover={{ bg: "#F8F9FA", color: "#212529" }}
          >
            {open ? <FiChevronDown /> : <FiChevronRight />}
          </IconButton>
        ) : (
          <Box w="24px" />
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChoose(node)}
          justifyContent="flex-start"
          flex={1}
          bg={isActive ? "#E7F5FF" : "transparent"}
          color={isActive ? "#1971C2" : "#495057"}
          fontWeight={isActive ? "semibold" : "normal"}
          _hover={{ 
            bg: isActive ? "#D0EBFF" : "#F8F9FA",
            color: "#212529"
          }}
          borderRadius="md"
        >
          {node.name}
        </Button>
      </Box>

      {hasChildren && open && (
        <Box pl={4} borderLeft="1px solid" borderColor="#DEE2E6" ml="12px" mt={1}>
          {node.children.map(ch => (
            <Node
              key={ch.id}
              node={ch}
              onChoose={onChoose}
              activeId={activeId}
              level={level + 1}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}

export default function CategorySidebar({ onChange, activeId }) {
  const [tree, setTree] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let ignore = false
    setLoading(true)
    api.get('/api/categories/tree')
      .then(({ data }) => {
        if (!ignore) setTree(data?.result || [])
      })
      .catch(() => {
        if (!ignore) setTree([])
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => { ignore = true }
  }, [])

  return (
    <VStack align="stretch" spacing={1}>
      <Button 
        size="sm" 
        onClick={() => onChange(null)} 
        justifyContent="flex-start"
        bg={!activeId ? "#212529" : "transparent"}
        color={!activeId ? "white" : "#495057"}
        fontWeight={!activeId ? "semibold" : "normal"}
        _hover={{ 
          bg: !activeId ? "#343A40" : "#F8F9FA",
          color: !activeId ? "white" : "#212529"
        }}
        borderRadius="md"
      >
        All Categories
      </Button>

      {loading ? (
        <Box p={3} color="#6C757D" fontSize="sm" textAlign="center">
          Loading categories...
        </Box>
      ) : tree.length === 0 ? (
        <Box p={3} color="#6C757D" fontSize="sm" textAlign="center">
          No categories available
        </Box>
      ) : (
        tree.map(n => (
          <Node key={n.id} node={n} onChoose={onChange} activeId={activeId} />
        ))
      )}
    </VStack>
  )
}