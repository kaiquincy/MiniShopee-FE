// src/components/RatingDialog.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Dialog, Portal, Button, CloseButton, HStack, VStack, Box, Text, Badge,
  Image, Separator, Field, Textarea, VisuallyHidden, Icon
} from '@chakra-ui/react'
import { FiStar, FiUpload, FiX } from 'react-icons/fi'

const normalizeUrl = (it) => {
  if (it?.imageUrl) return `${import.meta.env.VITE_API_URL}/uploads/${it.imageUrl}`
  return it?.productImageUrl || '/placeholder.png'
}

function StarRating({ value = 0, onChange }) {
  const [hover, setHover] = useState(0)
  const cur = hover || value
  return (
    <HStack>
      {[1,2,3,4,5].map((n) => (
        <Button
          key={n}
          variant="ghost"
          p={1}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange?.(n)}
          aria-label={`Rate ${n}`}
        >
          <Icon as={FiStar} boxSize={6} color={n <= cur ? 'yellow.400' : 'gray.400'} />
        </Button>
      ))}
      <Text ml={2} color="gray.600">{cur}/5</Text>
    </HStack>
  )
}

function Thumb({ file, onRemove }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    if (!file) return
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])
  if (!file) return null
  return (
    <Box pos="relative" border="1px solid" borderColor="gray.300" rounded="md" overflow="hidden">
      <Image src={url} alt={file.name} boxSize="64px" objectFit="cover" />
      <Button
        size="xs" variant="solid" colorPalette="red"
        pos="absolute" top="1" right="1" onClick={onRemove}
      >
        <FiX />
      </Button>
    </Box>
  )
}

/**
 * RatingDialog
 * Usage:
 *  <RatingDialog order={o} items={o.items} onSubmit={fn}>
 *    <Button size="sm" variant="outline">Rating</Button>
 *  </RatingDialog>
 */
export default function RatingDialog({ order, items, onSubmit, children }) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [stars, setStars] = useState(5)
  const [comment, setComment] = useState('')
  const [files, setFiles] = useState([]) // File[]
  const [submitting, setSubmitting] = useState(false)
  const closeRef = useRef(null)

  const safeItems = Array.isArray(items) ? items : []
  const it = safeItems[selectedIdx]
  const thumb = useMemo(() => normalizeUrl(it), [it])
  const productName = it?.productName || 'Product'

  // reset mỗi lần mở dialog
  const handleOpenChange = ({ open }) => {
    if (open) {
      setSelectedIdx(0); setStars(5); setComment(''); setFiles([]); setSubmitting(false)
    }
  }

  const pickFiles = (e) => {
    const list = Array.from(e.target.files || [])
    if (!list.length) return
    setFiles(prev => [...prev, ...list].slice(0, 6))
    e.target.value = ''
  }
  const removeFileAt = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i))

  const handleSend = async () => {
    if (!it || submitting) return
    try {
      setSubmitting(true)
      await onSubmit?.({
        orderId: order?.id ?? order?.orderId,
        productId: it.productId,
        variantId: it.variantId,
        stars,
        comment,
        files,
      })
      // đóng dialog sau khi gửi thành công
      closeRef.current?.click()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog.Root onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        {children /* nút mở dialog (Rating) */}
      </Dialog.Trigger>

      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="640px" bg="white">
            <Dialog.Header>
              <Dialog.Title>Đánh giá sản phẩm</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              {/* Sản phẩm mini */}
              {it && (
                <HStack align="start" spacing={3}>
                  <Box border="1px solid" borderColor="gray.200" rounded="md" overflow="hidden">
                    <Image src={thumb} alt={productName} boxSize="72px" objectFit="cover" />
                  </Box>
                  <VStack align="start" spacing={1} flex={1}>
                    <Text fontWeight="semibold" noOfLines={2}>{productName}</Text>
                    {it.optionValues && (
                      <HStack spacing={2} wrap="wrap">
                        {Object.entries(it.optionValues).map(([k, v]) => (
                          <Badge key={k} colorPalette="purple" variant="subtle">{k}: {v}</Badge>
                        ))}
                      </HStack>
                    )}
                    {safeItems.length > 1 && (
                      <HStack mt={1} spacing={2} wrap="wrap">
                        <Text fontSize="sm" color="gray.600">Chọn sản phẩm:</Text>
                        {safeItems.map((x, idx) => (
                          <Button
                            key={x.id || x.productId || idx}
                            size="xs"
                            variant={idx === selectedIdx ? 'solid' : 'outline'}
                            onClick={() => setSelectedIdx(idx)}
                          >
                            #{idx + 1}
                          </Button>
                        ))}
                      </HStack>
                    )}
                  </VStack>
                </HStack>
              )}

              <Separator my={4} />

              {/* Sao */}
              <VStack align="start" spacing={2}>
                <Text fontWeight="semibold">Product quality</Text>
                <StarRating value={stars} onChange={setStars} />
              </VStack>

              <Separator my={4} />

              {/* Nội dung + ảnh */}
              <VStack align="stretch" spacing={3}>
                <Field.Root>
                  <Field.Label>Nội dung đánh giá</Field.Label>
                  <Textarea
                    placeholder="Chia sẻ trải nghiệm của bạn..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label>Ảnh đính kèm (tối đa 6)</Field.Label>
                  <HStack align="center" spacing={3} wrap="wrap">
                    <Button as="label" leftIcon={<FiUpload />} variant="outline">
                      Chọn ảnh
                      <VisuallyHidden as="input" type="file" accept="image/*" multiple onChange={pickFiles} />
                    </Button>
                    {files.map((f, i) => (
                      <Thumb key={i} file={f} onRemove={() => removeFileAt(i)} />
                    ))}
                  </HStack>
                </Field.Root>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline" disabled={submitting}>Cancel</Button>
              </Dialog.ActionTrigger>
              <Button onClick={handleSend} loading={submitting ? '' : undefined} disabled={submitting}>
                {submitting ? 'Sending...' : 'Send'}
              </Button>
            </Dialog.Footer>

            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" ref={closeRef} />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
