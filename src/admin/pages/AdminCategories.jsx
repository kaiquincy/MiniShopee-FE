import {
  Box, Button, Dialog, DialogBody, DialogCloseTrigger, DialogContent, DialogFooter,
  DialogHeader, DialogRoot, DialogTitle, Flex, Heading, HStack, Icon, IconButton,
  Input, Portal, Text, VStack
} from "@chakra-ui/react"
import { useEffect, useMemo, useState } from "react"
import { FiEdit2, FiPlus, FiRefreshCcw, FiSearch, FiTrash2 } from "react-icons/fi"
import { toaster } from "../../components/ui/toaster"
import {
  adminFetchCategoryTree,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
} from "../api/admin"

const slugify = (s = "") =>
  s.trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")

export default function AdminCategories() {
  const [tree, setTree] = useState([])
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState({})
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState("create") // create | edit
  const [form, setForm] = useState({ id: null, parentId: null, name: "", slug: "" })

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminFetchCategoryTree()
      setTree(res?.content || [])
    } catch {
      setTree([])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  // search theo tree: match parent/child -> giữ parent nếu child match
  const filteredTree = useMemo(() => {
    if (!q) return tree
    const qq = q.toLowerCase()

    return (tree || []).flatMap(parent => {
      const parentMatch =
        (parent.name || "").toLowerCase().includes(qq) ||
        (parent.slug || "").toLowerCase().includes(qq)

      const children = (parent.children || []).filter(ch =>
        (ch.name || "").toLowerCase().includes(qq) ||
        (ch.slug || "").toLowerCase().includes(qq)
      )

      if (parentMatch) return [{ ...parent }] // giữ nguyên cả nhánh
      if (children.length) return [{ ...parent, children }]
      return []
    })
  }, [q, tree])

const openCreateParent = () => {
  setMode("create")
  setForm({
    id: null,
    parentId: null,   // root
    name: "",
    slug: "",
  })
  setOpen(true)
}

const openCreateChild = (parent) => {
  setMode("create")
  setForm({
    id: null,
    parentId: parent.id, // child của parent này
    name: "",
    slug: "",
  })
  setOpen(true)
}


const openEdit = (node, parentId = null) => {
  setMode("edit")
  setForm({
    id: node.id,
    parentId, // null nếu là parent
    name: node.name || "",
    slug: node.slug || "",
  })
  setOpen(true)
}


  const submit = async () => {
    try {
      if (!form.name.trim()) {
        toaster.create({ type: "error", description: "Name is required" })
        return
      }

      const payload = {
        parentId: form.parentId ? Number(form.parentId) : null, // null => create/update root
        name: form.name.trim(),
        slug: (form.slug || slugify(form.name)).trim(),
      }

      setBusy(p => ({ ...p, dialog: true }))
      if (mode === "create") {
        await adminCreateCategory(payload)
        toaster.create({
          type: "success",
          description: payload.parentId ? "Created child category" : "Created parent category",
        })
      } else {
        await adminUpdateCategory(form.id, payload)
        toaster.create({ type: "success", description: "Updated category" })
      }

      setOpen(false)
      await load()
    } catch (e) {
      toaster.create({ type: "error", description: e?.response?.data?.message || "Operation failed" })
    } finally {
      setBusy(p => ({ ...p, dialog: false }))
    }
  }

  const remove = async (node) => {
    try {
      setBusy(p => ({ ...p, [node.id]: true }))
      await adminDeleteCategory(node.id)
      toaster.create({ type: "success", description: `Deleted: ${node.name}` })
      await load()
    } catch (e) {
      toaster.create({ type: "error", description: e?.response?.data?.message || "Delete failed" })
    } finally {
      setBusy(p => ({ ...p, [node.id]: false }))
    }
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="2xl" fontWeight="black" mb={2} color="#1E3A8A">Categories</Heading>
          <Text color="#64748B">Tree view + CRUD (parent/child)</Text>
        </Box>
        <HStack>
          <Button
            onClick={load}
            isLoading={loading}
            bg="white"
            border="1px solid"
            color="#334155"
            borderColor="#E2E8F0"
            _hover={{ bg: "#F8FAFC" }}
          >
            <Icon as={FiRefreshCcw} />
            Reload
          </Button>
          <Button
            onClick={openCreateParent}
            bg="#1E3A8A"
            color="white"
            _hover={{ bg: "#1E40AF" }}
          >
                <Icon as={FiPlus} />
            New parent
          </Button>
        </HStack>
      </Flex>

      {/* Search */}
      <Flex gap={3} mb={4}>
        <Box position="relative" flex={1} maxW="520px">
          <Icon as={FiSearch} position="absolute" left={4} top="50%" transform="translateY(-50%)" color="#64748B" />
          <Input
            placeholder="Search by name/slug (parent or child)..."
            value={q}
            onChange={e => setQ(e.target.value)}
            bg="white"
            border="1px solid"
            borderColor="#E2E8F0"
            pl={12}
            h="48px"
            borderRadius="lg"
          />
        </Box>
      </Flex>

      {/* Tree */}
      <Box bg="white" border="1px solid" borderColor="#E2E8F0" borderRadius="lg" overflow="hidden">
        <Box px={6} py={4} borderBottom="1px solid" borderColor="#E2E8F0">
          <Text fontWeight="bold" fontSize="sm" color="#64748B" textTransform="uppercase" letterSpacing="wider">
            Tree
          </Text>
        </Box>

        {loading ? (
          <Box p={10}><Text color="#64748B" textAlign="center">Loading...</Text></Box>
        ) : filteredTree.length === 0 ? (
          <Box p={10}><Text color="#64748B" textAlign="center">No categories found</Text></Box>
        ) : (
          <VStack align="stretch" spacing={0}>
            {filteredTree.map((parent, pIdx) => (
              <Box key={parent.id} borderBottom={pIdx !== filteredTree.length - 1 ? "1px solid" : "none"} borderColor="#F1F5F9">
                {/* Parent row */}
                <Flex
                  px={6}
                  py={4}
                  align="center"
                  justify="space-between"
                  _hover={{ bg: "#F8FAFC" }}
                >
                  <Box>
                    <Text fontWeight="bold" color="#1E293B">
                      {parent.name}
                    </Text>
                    <Text fontSize="sm" color="#64748B">{parent.slug || "—"}</Text>
                  </Box>

                  <HStack>
                    <Button
                      size="sm"
                      bg="#EEF2FF"
                      color="#1E3A8A"
                      _hover={{ bg: "#E0E7FF" }}
                      onClick={() => openCreateChild(parent)}
                    >
                        <Icon as={FiPlus} />
                      Add child
                    </Button>

                    <IconButton
                      aria-label="edit-parent"
                      size="sm"
                      bg="white"
                      border="1px solid"
                      borderColor="#E2E8F0"
                      color="#334155"
                      onClick={() => openEdit(parent, null)}
                      _hover={{ bg: "#F8FAFC" }}
                    >
                      <Icon as={FiEdit2} />
                    </IconButton>

                    <IconButton
                      aria-label="delete-parent"
                      size="sm"
                      bg="white"
                      border="1px solid"
                      borderColor="#E2E8F0"
                      color="#EF4444"
                      isLoading={!!busy[parent.id]}
                      onClick={() => remove(parent)}
                      _hover={{ bg: "#FEE2E2" }}
                      title="Delete parent (may fail if has children depending on backend rules)"
                    >
                      <Icon as={FiTrash2} />
                    </IconButton>
                  </HStack>
                </Flex>

                {/* Children */}
                {(parent.children || []).length > 0 && (
                  <Box pb={3}>
                    {(parent.children || []).map((ch) => (
                      <Flex
                        key={ch.id}
                        ml={10}
                        mr={6}
                        mb={2}
                        px={4}
                        py={3}
                        align="center"
                        justify="space-between"
                        border="1px solid"
                        borderColor="#E2E8F0"
                        borderRadius="lg"
                        _hover={{ bg: "#F8FAFC" }}
                      >
                        <Box>
                          <Text fontWeight="semibold" color="#1E293B">
                            {ch.name}
                          </Text>
                          <Text fontSize="sm" color="#64748B">{ch.slug || "—"}</Text>
                        </Box>

                        <HStack>
                          <IconButton
                            aria-label="edit-child"
                            size="sm"
                            bg="white"
                            border="1px solid"
                            borderColor="#E2E8F0"
                            color="#334155"
                            onClick={() => openEdit(ch, parent.id)}
                            _hover={{ bg: "#F8FAFC" }}
                          >
                            <Icon as={FiEdit2} />
                          </IconButton>

                          <IconButton
                            aria-label="delete-child"
                            size="sm"
                            bg="white"
                            border="1px solid"
                            borderColor="#E2E8F0"
                            color="#EF4444"
                            isLoading={!!busy[ch.id]}
                            onClick={() => remove(ch)}
                            _hover={{ bg: "#FEE2E2" }}
                          >
                            <Icon as={FiTrash2} />
                          </IconButton>
                        </HStack>
                      </Flex>
                    ))}
                  </Box>
                )}
              </Box>
            ))}
          </VStack>
        )}
      </Box>

      {/* Dialog Create/Edit */}
      <DialogRoot open={open} onOpenChange={(e) => setOpen(e.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <DialogContent maxW="560px" bg="white" borderRadius="lg">
              <DialogCloseTrigger />
              <DialogHeader borderBottom="1px solid" borderColor="#E2E8F0" pb={4}>
                <DialogTitle color="#1E3A8A" fontSize="xl" fontWeight="bold">
                {mode === "create"
                    ? (form.parentId ? "Create child category" : "Create parent category")
                    : (form.parentId ? "Edit child category" : "Edit parent category")}
                </DialogTitle>
              </DialogHeader>

              <DialogBody py={6}>
                {/* Parent selector is OPTIONAL: empty => parent/root */}


                <Box mb={4}>
                  <Text mb={2} fontWeight="semibold" color="#334155">Name</Text>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Men Fashion / Jacket..."
                    bg="white"
                    border="1px solid"
                    borderColor="#E2E8F0"
                    borderRadius="lg"
                    h="44px"
                  />
                </Box>

                <Box>
                  <Text mb={2} fontWeight="semibold" color="#334155">Slug</Text>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))}
                    placeholder="leave blank to auto-generate"
                    bg="white"
                    border="1px solid"
                    borderColor="#E2E8F0"
                    borderRadius="lg"
                    h="44px"
                  />
                </Box>
              </DialogBody>

              <DialogFooter borderTop="1px solid" borderColor="#E2E8F0" pt={4}>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button
                  onClick={submit}
                  isLoading={!!busy.dialog}
                  bg="#1E3A8A"
                  color="white"
                  _hover={{ bg: "#1E40AF" }}
                >
                  {mode === "create" ? "Create" : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog.Positioner>
        </Portal>
      </DialogRoot>
    </Box>
  )
}
