// components/VariantsBuilder.jsx
import {
  Badge,
  Box, Button, Field, HStack,
  Icon,
  Image,
  Input, NumberInput,
  SimpleGrid, Stack, Text,
  VStack
} from '@chakra-ui/react'
import { useCallback } from 'react'
import { FiImage, FiPlus, FiX } from 'react-icons/fi'

// ===== utilities =====
const normalizeKey = (s) => (s || '').trim().toLowerCase()

export const buildImageKey = (optionValues = {}, groups = []) => {
  const sorted = [...groups].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
  return sorted
    .map(g => `${normalizeKey(g.name)}=${optionValues[g.name] ?? ''}`)
    .join('|')
}

// Cartesian product
const cartesian = (arrays) => arrays.reduce((acc, arr) => {
  if (!acc.length) return arr.map(v => [v])
  const out = []
  for (const a of acc) for (const b of arr) out.push([...a, b])
  return out
}, [])

// ===== main builder (controlled) =====
export default function VariantsBuilder({ value, onChange, theme }) {
  const variantGroups = value?.variantGroups || []
  const variants = value?.variants || []

  const safeSet = useCallback((next) => {
    const vg = next.variantGroups ?? variantGroups
    const vs = next.variants ?? variants
    onChange?.({ variantGroups: vg, variants: vs })
  }, [onChange, variantGroups, variants])

  // ----- Variant Groups ops -----
  const addGroup = () => {
    safeSet({
      variantGroups: [
        ...variantGroups,
        { name: '', sortOrder: (variantGroups.length || 0) + 1, options: [] }
      ]
    })
  }

  const removeGroup = (gi) => {
    const newGroups = variantGroups.filter((_, i) => i !== gi)
    // rebuild variants after removing a whole group
    const rebuilt = rebuildVariantsFromGroups(newGroups, variants)
    safeSet({ variantGroups: newGroups, variants: rebuilt })
  }

  const setGroupField = (gi, field, v) => {
    const vgs = [...variantGroups]
    vgs[gi] = { ...vgs[gi], [field]: v }
    // when name/sortOrder changed → rebuild
    const rebuilt = rebuildVariantsFromGroups(vgs, variants)
    safeSet({ variantGroups: vgs, variants: rebuilt })
  }

  const addGroupOption = (gi) => {
    const vgs = [...variantGroups]
    const vg = vgs[gi]
    vgs[gi] = { ...vg, options: [...(vg.options || []), '' ] }
    const rebuilt = rebuildVariantsFromGroups(vgs, variants)
    safeSet({ variantGroups: vgs, variants: rebuilt })
  }

  const setGroupOption = (gi, oi, val) => {
    const vgs = [...variantGroups]
    const vg = vgs[gi]
    const opts = [...(vg.options || [])]
    opts[oi] = val
    vgs[gi] = { ...vg, options: opts }
    const rebuilt = rebuildVariantsFromGroups(vgs, variants)
    safeSet({ variantGroups: vgs, variants: rebuilt })
  }

  const removeGroupOption = (gi, oi) => {
    const vgs = [...variantGroups]
    const vg = vgs[gi]
    const opts = (vg.options || []).filter((_, i) => i !== oi)
    vgs[gi] = { ...vg, options: opts }
    const rebuilt = rebuildVariantsFromGroups(vgs, variants)
    safeSet({ variantGroups: vgs, variants: rebuilt })
  }

  // ----- Variants ops -----
  const setVariantField = (idx, field, val) => {
    const arr = [...variants]
    arr[idx] = { ...arr[idx], [field]: val }
    safeSet({ variants: arr })
  }

  const onVariantImage = (idx, file) => {
    if (!file) return
    setVariantField(idx, 'imageFile', file)
  }

  const getVariantImgSrc = (v) => {
    if (v?.imageFile) return URL.createObjectURL(v.imageFile)
    if (v?.imageUrl) return `${import.meta.env.VITE_API_URL}/uploads/${v.imageUrl}`
    return v?.ImageUrl || v?.imageUrl || ''
  }

  return (
    <Stack spacing={6}>
      {/* === Variant Groups === */}
      <Box>
        <Text fontSize="sm" fontWeight="bold" mb={3} color={theme.text} textTransform="uppercase" letterSpacing="wider">
          Variant Groups
        </Text>

        <Stack spacing={4}>
          {variantGroups.map((g, gi) => (
            <Box key={gi} p={4} border="1px solid" borderColor={theme.border} borderRadius="md">
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={3} alignItems="end">
                <Field.Root>
                  <Field.Label color={theme.text} fontSize="sm" fontWeight="semibold">Group Name</Field.Label>
                  <Input
                    value={g.name || ''}
                    onChange={e => setGroupField(gi, 'name', e.target.value)}
                    placeholder="Color / Size / Material..."
                    bg={theme.inputBg} border="1px solid" borderColor={theme.border} color={theme.text}
                    _focus={{ borderColor: "brand.500" }}
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label color={theme.text} fontSize="sm" fontWeight="semibold">Sort Order</Field.Label>
                  <NumberInput.Root
                    min={1}
                    value={g.sortOrder ?? (gi + 1)}
                    onValueChange={(d) => setGroupField(gi, 'sortOrder', d.valueAsNumber)}
                  >
                    <NumberInput.Input bg={theme.inputBg} border="1px solid" borderColor={theme.border} color={theme.text} _focus={{ borderColor: "brand.500" }} />
                    <NumberInput.Control />
                  </NumberInput.Root>
                </Field.Root>

                <Button color="red.500" variant="ghost" leftIcon={<FiX />} onClick={() => removeGroup(gi)}>
                  Remove Group
                </Button>
              </SimpleGrid>

              <Box mt={3}>
                <Field.Label color={theme.text} fontSize="sm" fontWeight="semibold">Options</Field.Label>
                <Stack spacing={2} mt={2}>
                  {(g.options || []).map((opt, oi) => (
                    <HStack key={oi} mb={1}>
                      <Input
                        value={opt}
                        onChange={e => setGroupOption(gi, oi, e.target.value)}
                        placeholder="e.g. Black / Gray / S / M..."
                        bg={theme.inputBg} border="1px solid" borderColor={theme.border} color={theme.text}
                        _focus={{ borderColor: "brand.500" }}
                      />
                      <Button size="sm" variant="ghost" color="red.500" onClick={() => removeGroupOption(gi, oi)}>
                        <FiX />
                      </Button>
                    </HStack>
                  ))}
                  <Box>
                    <Button onClick={() => addGroupOption(gi)}>
                      <Icon as={FiPlus} />Add Option
                    </Button>
                  </Box>
                </Stack>
              </Box>
            </Box>
          ))}

          <Box textAlign="center">
            <Button bg={theme.buttonBg} color="white" leftIcon={<FiPlus />} onClick={addGroup} _hover={{ bg: theme.buttonHoverBg }} alignSelf="flex-start">
              <Icon as={FiPlus} />Add Group
            </Button>
          </Box>
        </Stack>
      </Box>

      {/* === Product Variants (generated) === */}
      <Box>
        <Text fontSize="sm" fontWeight="bold" mb={3} color={theme.text} textTransform="uppercase" letterSpacing="wider">
          Product Variants
        </Text>

        {(!variants || variants.length === 0) ? (
          <Text color={theme.text} fontSize="sm">Add at least one Variant Group with options to generate combinations.</Text>
        ) : (
          <Stack spacing={3}>
            {variants.map((v, i) => (
              <Box
                key={v.imageKey || i}
                p={4}
                border="1px dashed"
                borderColor={theme.border}
                borderRadius="lg"
              >
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} alignItems="start">
                  <VStack gap={3}>
                    {/* Options (wider) */}
                    <Field.Root>
                      <Field.Label color={theme.text} fontSize="sm" fontWeight="semibold" mb={1}>
                        Options
                      </Field.Label>

                      <HStack wrap="wrap" gap={2}>
                        {Object.entries(v.optionValues || {}).length > 0 ? (
                          Object.entries(v.optionValues || {}).map(([k, val]) => (
                            <Badge
                              key={k}
                              bg={theme.inputBg}
                              color={theme.text}
                              border="1px solid"
                              borderColor={theme.border}
                              px={2}
                              py={1}
                              borderRadius="md"
                              fontSize="xs"
                            >
                              {k}: {String(val)}
                            </Badge>
                          ))
                        ) : (
                          <Text fontSize="sm" color={theme.textSecondary}>
                            No options
                          </Text>
                        )}
                      </HStack>

                      {v.imageKey && (
                        <Text mt={2} fontSize="xs" color={theme.textSecondary}>
                          imageKey: {v.imageKey}
                        </Text>
                      )}
                    </Field.Root>

                    {/* SKU Code */}
                    <Field.Root>
                      <Field.Label color={theme.text} fontSize="sm" fontWeight="semibold" mb={1}>
                        SKU Code
                      </Field.Label>
                      <Input
                        value={v.skuCode || ""}
                        onChange={(e) => setVariantField(i, "skuCode", e.target.value)}
                        placeholder="TSHIRT-RS"
                        bg={theme.inputBg}
                        border="1px solid"
                        borderColor={theme.border}
                        color={theme.text}
                        _placeholder={{ color: theme.textSecondary }}
                        _focus={{ borderColor: "brand.500" }}
                      />
                    </Field.Root>

                    {/* Price */}
                    <Field.Root>
                      <Field.Label color={theme.text} fontSize="sm" fontWeight="semibold" mb={1}>
                        Price
                      </Field.Label>
                      <NumberInput.Root
                        min={0}
                        value={v.price ?? 0}
                        onValueChange={(d) => setVariantField(i, "price", d.valueAsNumber)}
                      >
                        <NumberInput.Input
                          bg={theme.inputBg}
                          border="1px solid"
                          borderColor={theme.border}
                          color={theme.text}
                          _placeholder={{ color: theme.textSecondary }}
                          _focus={{ borderColor: "brand.500" }}
                        />
                        <NumberInput.Control />
                      </NumberInput.Root>
                    </Field.Root>

                    {/* Stock */}
                    <Field.Root>
                      <Field.Label color={theme.text} fontSize="sm" fontWeight="semibold" mb={1}>
                        Stock
                      </Field.Label>
                      <NumberInput.Root
                        min={0}
                        value={v.stock ?? 0}
                        onValueChange={(d) => setVariantField(i, "stock", d.valueAsNumber)}
                      >
                        <NumberInput.Input
                          bg={theme.inputBg}
                          border="1px solid"
                          borderColor={theme.border}
                          color={theme.text}
                          _placeholder={{ color: theme.textSecondary }}
                          _focus={{ borderColor: "brand.500" }}
                        />
                        <NumberInput.Control />
                      </NumberInput.Root>
                    </Field.Root>
                  </VStack>

                  {/* Image (wider) */}
                  <Field.Root>
                    <Field.Label color={theme.text} fontSize="sm" fontWeight="semibold" mb={2}>
                      Variant Image
                    </Field.Label>

                    <HStack gap={3} align="center" flexWrap="wrap">
                      <Button
                        onClick={() => document.getElementById(`var-file-${i}`)?.click()}
                      >
                        <Icon as={FiImage} />
                        {v?.imageFile ? "Change" : getVariantImgSrc(v) ? "Change" : "Upload"}
                      </Button>

                      {(v?.imageFile || v?.ImageUrl || v?.imageUrl) && (
                        <Text
                          fontSize="xs"
                          color={theme.textSecondary ?? theme.text}
                          maxW="220px"
                          noOfLines={1}
                        >
                          {v?.imageFile?.name || v?.ImageUrl || v?.imageUrl}
                        </Text>
                      )}

                      <Input
                        id={`var-file-${i}`}
                        type="file"
                        accept="image/*"
                        display="none"
                        onChange={(e) => onVariantImage(i, e.target.files?.[0])}
                      />
                    </HStack>

                    {(v?.imageFile || v?.ImageUrl || v?.imageUrl) && (
                      <Image
                        mt={3}
                        src={getVariantImgSrc(v)}
                        alt="Variant preview"
                        objectFit="cover"
                        w="100%"
                        maxW="140px"
                        aspectRatio="1"
                        borderRadius="md"
                        border="1px solid"
                        borderColor={theme.border}
                        color={theme.textMuted}
                      />
                    )}
                  </Field.Root>
                </SimpleGrid>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  )
}

/**
 * Rebuild variants from groups but keep old values (price/stock/sku/image) by imageKey
 */
function rebuildVariantsFromGroups(groups, oldVariants) {
  console.log('Rebuild variants from groups:', groups, oldVariants)
  const cleanGroups = (groups || []).filter(g => g.name?.trim() && (g.options?.length > 0))
  if (!cleanGroups.length) return []

  const arrays = cleanGroups.map(g => g.options)
  const combos = cartesian(arrays) // [[opt1, opt2, ...], ...]

  return combos.map(vals => {
    const optionValues = {}
    cleanGroups.forEach((g, idx) => { optionValues[g.name] = vals[idx] })
    const key = buildImageKey(optionValues, cleanGroups)
    const old = (oldVariants || []).find(v => v.imageKey === key)
    return {
      optionValues,
      price: old?.price ?? 0,
      stock: old?.stock ?? 0,
      skuCode: old?.skuCode ?? '',
      imageKey: key,
      imageFile: old?.imageFile
    }
  })
}
