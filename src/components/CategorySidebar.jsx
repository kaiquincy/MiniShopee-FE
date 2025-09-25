import { useEffect, useState } from 'react'
import api from '../api/client'
import { VStack, Button, Box, IconButton } from '@chakra-ui/react'
import { FiChevronDown, FiChevronRight } from 'react-icons/fi'

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
            aria-label={open ? 'Thu gọn' : 'Mở rộng'}
            onClick={() => setOpen(o => !o)}
            icon={open ? <FiChevronDown /> : <FiChevronRight />}
          />
        ) : (
          <Box w="24px" /> // chừa chỗ cho icon để canh hàng
        )}
        <Button
          variant={isActive ? 'solid' : 'ghost'}
          size="sm"
          onClick={() => onChoose(node)}
          aria-current={isActive ? 'page' : undefined}
        >
          {node.name}
        </Button>
      </Box>

      {hasChildren && open && (
        <Box pl={4} borderLeft="1px solid #eee" ml="12px">
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
    <VStack
      align="stretch"
      spacing={2}
      bg="white"
      p={3}
      borderRadius="md"
      className="glass"
      minW="240px"
    >
      <Button size="sm" onClick={() => onChange(null)} variant={!activeId ? 'solid' : 'outline'}>
        Tất cả
      </Button>

      {loading ? (
        <Box p={2} color="gray.500">Đang tải danh mục…</Box>
      ) : (
        tree.map(n => (
          <Node key={n.id} node={n} onChoose={onChange} activeId={activeId} />
        ))
      )}
    </VStack>
  )
}
