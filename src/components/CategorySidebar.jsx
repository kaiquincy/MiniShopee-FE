import { Box, Button, IconButton, VStack } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { FiChevronDown, FiChevronRight } from 'react-icons/fi'
import api from '../api/client'

function Node({ node, onChoose, activeId, level = 0, theme }) {
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
            color={theme.textMuted}
            _hover={{ bg: theme.hoverBg, color: theme.text }}
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
          bg={isActive 
            ? (theme.isLight ? "#E7F5FF" : "#1E3A5F") 
            : "transparent"
          }
          color={isActive 
            ? (theme.isLight ? "#1971C2" : "#60A5FA") 
            : theme.textSecondary
          }
          fontWeight={isActive ? "semibold" : "normal"}
          _hover={{ 
            bg: isActive 
              ? (theme.isLight ? "#D0EBFF" : "#1E4976") 
              : theme.hoverBg,
            color: theme.text
          }}
          borderRadius="md"
        >
          {node.name}
        </Button>
      </Box>

      {hasChildren && open && (
        <Box pl={4} borderLeft="1px solid" borderColor={theme.border} ml="12px" mt={1}>
          {node.children.map(ch => (
            <Node
              key={ch.id}
              node={ch}
              onChoose={onChoose}
              activeId={activeId}
              level={level + 1}
              theme={theme}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}

export default function CategorySidebar({ onChange, activeId, theme }) {
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
        bg={!activeId ? theme.primary : "transparent"}
        color={!activeId ? "white" : theme.textSecondary}
        fontWeight={!activeId ? "semibold" : "normal"}
        _hover={{ 
          bg: !activeId ? theme.primaryHover : theme.hoverBg,
          color: !activeId ? "white" : theme.text
        }}
        borderRadius="md"
      >
        All Categories
      </Button>

      {loading ? (
        <Box p={3} color={theme.textMuted} fontSize="sm" textAlign="center">
          Loading categories...
        </Box>
      ) : tree.length === 0 ? (
        <Box p={3} color={theme.textMuted} fontSize="sm" textAlign="center">
          No categories available
        </Box>
      ) : (
        tree.map(n => (
          <Node 
            key={n.id} 
            node={n} 
            onChoose={onChange} 
            activeId={activeId} 
            theme={theme}
          />
        ))
      )}
    </VStack>
  )
}