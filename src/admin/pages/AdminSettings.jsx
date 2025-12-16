import {
  Box,
  Button,
  Heading,
  HStack,
  Icon,
  Spinner,
  Switch,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useEffect, useMemo, useState } from "react"
import {
  FiSave,
  FiRefreshCw,
  FiSettings,
  FiCpu,
  FiShield,
  FiZap,
  FiToggleRight,
} from "react-icons/fi"
import { toaster } from "../../components/ui/toaster"
import { adminFetchOptions, adminSetOptions } from "../api/admin"

export default function AdminSettings() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminFetchOptions()
      const data = res?.content
      console.log("Fetched options:", data)
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      toaster.create({
        type: "error",
        description: e?.message || "Failed to load settings",
      })
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // icon picker based on optionName (customize freely)
  const optionIcon = useMemo(() => {
    return (name) => {
      const key = String(name || "").toLowerCase()
      if (key.includes("ai")) return FiCpu
      if (key.includes("review")) return FiZap
      if (key.includes("secure") || key.includes("security")) return FiShield
      return FiToggleRight
    }
  }, [])

  // make label prettier: AI_review_product -> AI Review Product
  const prettyLabel = useMemo(() => {
    return (name) =>
      String(name || "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (m) => m.toUpperCase())
  }, [])

  const toggle = async (optionName, nextValue) => {
    // optimistic update
    setItems((prev) =>
      prev.map((x) =>
        x.optionName === optionName ? { ...x, isActive: nextValue } : x
      )
    )

    setSavingKey(optionName)
    try {
      await adminSetOptions({ optionName, isActive: nextValue })
      toaster.create({
        type: "success",
        description: `Updated: ${optionName} → ${nextValue ? "ON" : "OFF"}`,
      })
    } catch (e) {
      // rollback if fail
      setItems((prev) =>
        prev.map((x) =>
          x.optionName === optionName ? { ...x, isActive: !nextValue } : x
        )
      )
      console.error("Failed to update option:", e)
      toaster.create({
        type: "error",
        description: e?.message || `Update failed: ${optionName}`,
      })
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={8}>
        <HStack mb={1}>
          <Icon as={FiSettings} color="#1E3A8A" boxSize={6} />
          <Heading size="2xl" fontWeight="black" color="#1E3A8A">
            Settings
          </Heading>
        </HStack>
        <Text color="#64748B">Manage your store configuration & feature flags</Text>
      </Box>

      {/* Settings Card */}
      <Box
        bg="white"
        border="1px solid"
        borderColor="#E2E8F0"
        borderRadius="lg"
        p={8}
        maxW="760px"
        shadow="sm"
      >
        <HStack justify="space-between" mb={6}>
          <HStack>
            <Icon as={FiSettings} color="#0F172A" />
            <Text fontWeight="semibold" color="#0F172A">
              Feature Flags
            </Text>
          </HStack>

          <Button
            onClick={load}
            variant="outline"
            size="sm"
            borderColor="#E2E8F0"
            _hover={{ borderColor: "#3B82F6" }}
            isLoading={loading}
            leftIcon={<Icon as={FiRefreshCw} />}
          >
            Reload
          </Button>
        </HStack>

        {loading ? (
          <HStack py={10} justify="center">
            <Spinner />
            <Text color="#64748B">Loading settings…</Text>
          </HStack>
        ) : items.length === 0 ? (
          <Text color="#64748B">No settings found.</Text>
        ) : (
          <VStack align="stretch" spacing={3}>
            {items.map((opt) => {
              const OptIcon = optionIcon(opt.optionName)
              return (
                <HStack
                  key={opt.id}
                  p={4}
                  border="1px solid"
                  borderColor="#E2E8F0"
                  borderRadius="md"
                  justify="space-between"
                >
                  <HStack spacing={3}>
                    <Box
                      w="36px"
                      h="36px"
                      borderRadius="md"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      bg="#EFF6FF"
                      border="1px solid"
                      borderColor="#DBEAFE"
                    >
                      <Icon as={OptIcon} color="#1D4ED8" />
                    </Box>

                    <Box>
                      <Text fontWeight="semibold" color="#0F172A">
                        {prettyLabel(opt.optionName)}
                      </Text>
                      <Text fontSize="sm" color="#64748B">
                        Status: {opt.isActive ? "Enabled" : "Disabled"}
                      </Text>
                    </Box>
                  </HStack>

                  <HStack>
                    {savingKey === opt.optionName && <Spinner size="sm" />}

                    {/* Chakra v3 Switch */}
                    <Switch.Root
                      checked={!!opt.isActive}
                      onCheckedChange={(e) => toggle(opt.optionName, e.checked)}
                      disabled={savingKey === opt.optionName}
                    >
                      <Switch.HiddenInput />
                      <Switch.Control />
                    </Switch.Root>
                  </HStack>
                </HStack>
              )
            })}
          </VStack>
        )}

        {/* Footer note */}
        <Box pt={6}>
          <Text mt={2} fontSize="sm" color="#94A3B8" textAlign="center">
            Changes are applied immediately when you enable/disable an option.
          </Text>
        </Box>
      </Box>
    </Box>
  )
}
