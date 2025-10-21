import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Box, Container, VStack, HStack, Grid, GridItem, Heading, Text as ChakraText,
  Input, Button, Badge, Separator, Skeleton, VisuallyHidden, IconButton,
  InputGroup,
  Icon
} from '@chakra-ui/react'
import { Avatar } from '@chakra-ui/react'
import { LuCamera, LuUpload, LuX, LuCheck, LuCalendar, LuPhone, LuMail, LuDot } from 'react-icons/lu'
import { toaster } from '../components/ui/toaster'
import { getMyInfo } from '../api/user'

export default function Profile() {
  const [user, setUser] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef(null)

  const imgBase = import.meta.env.VITE_API_URL + '/uploads/'

  const formatDateForInput = (value) => {
    try {
      if (!value) return ''
      const d = new Date(value)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    } catch {
      return ''
    }
  }

  const hasChanges = useMemo(() => {
    if (!user) return false
    const basicChanged =
      (formData.fullName ?? '') !== (user.fullName ?? '') ||
      (formData.email ?? '') !== (user.email ?? '') ||
      (formData.phone ?? '') !== (user.phone ?? '') ||
      (formData.dateOfBirth ?? '') !== formatDateForInput(user.dateOfBirth)
    return basicChanged || !!selectedFile
  }, [formData, user, selectedFile])

  const loadUser = async () => {
    try {
      setIsLoading(true)
      const userData = await getMyInfo()
      setUser(userData)
      setFormData({
        fullName: userData?.fullName || '',
        email: userData?.email || '',
        phone: userData?.phone || '',
        dateOfBirth: formatDateForInput(userData?.dateOfBirth),
      })
      setPreviewUrl(userData?.avatarUrl ? imgBase + userData.avatarUrl : null)
    } catch (error) {
      toaster.create({
        title: 'Lỗi tải thông tin',
        description: error?.message || 'Không thể tải hồ sơ',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUser()
    return () => {
      if (selectedFile && previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAvatarChange = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toaster.create({ title: 'Chỉ chấp nhận file ảnh', status: 'warning' })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toaster.create({ title: 'Ảnh quá lớn', description: 'Tối đa 2MB', status: 'warning' })
      return
    }
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    const url = URL.createObjectURL(file)
    setSelectedFile(file)
    setPreviewUrl(url)
  }

  const onFileInputChange = (e) => {
    const file = e.target.files?.[0]
    handleAvatarChange(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    handleAvatarChange(file)
  }

  const handleSave = async () => {
    if (!hasChanges) {
      toaster.create({ title: 'Không có thay đổi', status: 'info' })
      return
    }
    setIsSaving(true)
    try {
      let updatedData = { ...formData }
      if (selectedFile) {
        const formDataUpload = new FormData()
        formDataUpload.append('avatar', selectedFile)
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/upload-avatar`, {
          method: 'POST',
          body: formDataUpload,
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        })
        if (!res.ok) throw new Error('Upload avatar thất bại')
        const { avatarUrl } = await res.json()
        updatedData.avatarUrl = avatarUrl
        if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
      }
      const updateRes = await fetch(`${import.meta.env.VITE_API_URL}/api/users/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updatedData),
      })
      if (!updateRes.ok) throw new Error('Cập nhật profile thất bại')

      await loadUser()
      toaster.create({ title: 'Cập nhật thành công', status: 'success' })
      setIsEditing(false)
      setSelectedFile(null)
    } catch (error) {
      toaster.create({
        title: 'Lỗi cập nhật',
        description: error?.message || 'Thử lại sau',
        status: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      dateOfBirth: formatDateForInput(user?.dateOfBirth),
    })
    if (selectedFile) {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(user?.avatarUrl ? imgBase + user.avatarUrl : null)
      setSelectedFile(null)
    }
    setIsEditing(false)
  }

  return (
    <Box>
      {/* Cover */}
      <Box
        h="180px"
        bgGradient="linear(to-r, purple.500, blue.500)"
        position="relative"
        overflow="hidden"
      >
        <Box position="absolute" inset="0" opacity={0.28}
             bgGradient="radial(circle at 18% 30%, white, transparent 40%)" />
        <Box position="absolute" inset="0" opacity={0.18}
             bgGradient="radial(circle at 80% 70%, white, transparent 35%)" />
      </Box>

      <Container maxW="6xl" px={{ base: 4, md: 8 }} pb={24} mt={-16}>
        {/* Header glass card */}
        <Box
          position="relative" px={{ base: 4, md: 6 }} py={4}
          bg="cardBg"
          backdropFilter="blur(10px)"
          border="1px solid" borderColor="cardBorder"
          borderRadius="2xl" boxShadow="lg"
        >
          <HStack align="end" justify="space-between">
            <HStack spacing={5}>
              <Skeleton loading={isLoading} rounded="full">
                <Box position="relative">
                  <Avatar.Root
                    size="2xl" variant="solid" shadow="xl"
                    style={{
                      border: '5px solid transparent',
                      background:
                        'linear-gradient(var(--chakra-colors-gray-800), var(--chakra-colors-gray-800)) padding-box,' +
                        'linear-gradient(135deg, #a78bfa, #60a5fa) border-box'
                    }}
                  >
                    <Avatar.Fallback name={user?.username || user?.fullName || 'U'} />
                    {previewUrl && <Avatar.Image src={previewUrl} alt="avatar" />}
                  </Avatar.Root>

                  <IconButton
                    aria-label="Đổi ảnh đại diện"
                    icon={<LuCamera />}
                    size="sm"
                    position="absolute"
                    bottom="6px"
                    right="6px"
                    borderRadius="full"
                    onClick={() => isEditing && fileInputRef.current?.click()}
                    variant={isEditing ? 'solid' : 'ghost'}
                    colorPalette={isEditing ? 'purple' : 'gray'}
                  />
                </Box>
              </Skeleton>

              <VStack align="start" spacing={1} mb={2}>
                <Skeleton loading={isLoading}>
                  <Heading size="lg" color="headingClr">
                    {user?.fullName || user?.username || '—'}
                  </Heading>
                </Skeleton>
                <Skeleton loading={isLoading}>
                  <HStack>
                    <RoleBadge role={user?.role} />
                    <StatusBadge status={user?.status} />
                  </HStack>
                </Skeleton>
              </VStack>
            </HStack>

            <HStack>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} leftIcon={<LuCamera />}>
                  Chỉnh sửa
                </Button>
              ) : (
                <>
                  <Button colorPalette="green" leftIcon={<LuCheck />} onClick={handleSave}
                          isDisabled={!hasChanges} isLoading={isSaving}>
                    Lưu
                  </Button>
                  <Button variant="outline" leftIcon={<LuX />} onClick={handleCancel} isDisabled={isSaving}>
                    Hủy
                  </Button>
                </>
              )}
            </HStack>
          </HStack>

          {isEditing && (
            <Dropzone
              mt={4}
              onDrop={handleDrop}
              fileName={selectedFile?.name}
              onBrowse={() => fileInputRef.current?.click()}
            />
          )}

          <VisuallyHidden>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onFileInputChange}
              aria-label="Chọn ảnh đại diện"
            />
          </VisuallyHidden>
        </Box>

        {/* Content */}
        <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={8} mt={8}>
          <GlassCard title="Thông tin cơ bản">
            <VStack align="stretch" spacing={4}>
              <Field
                label="Họ & Tên"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                isEditing={isEditing}
                placeholder="Nhập họ tên"
              />
              <Field
              icon={<LuMail></LuMail>}
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                isEditing={isEditing}
                isReadOnlyWhenEdit
                placeholder="email@domain.com"                
              >
                </Field>
              <Field
                icon={<LuPhone />}
                label="Số điện thoại"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                isEditing={isEditing}
                placeholder="Nhập số điện thoại"
              />
              <Field
                icon={<LuCalendar />}
                label="Ngày sinh"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                isEditing={isEditing}
              />
            </VStack>
          </GlassCard>

          <GlassCard title="Thông tin hệ thống">
            <VStack align="stretch" spacing={4}>
              <ReadRow label="Tên đăng nhập" value={user?.username || '—'} isLoading={isLoading} />
              <ReadRow label="Vai trò" isLoading={isLoading}>
                <RoleBadge role={user?.role} />
              </ReadRow>
              <ReadRow label="Trạng thái" isLoading={isLoading}>
                <StatusBadge status={user?.status} />
              </ReadRow>
              <ReadRow
                label="Ngày tạo tài khoản"
                value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                isLoading={isLoading}
              />
              <ReadRow
                label="Lần đăng nhập cuối"
                value={user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                isLoading={isLoading}
              />
            </VStack>
          </GlassCard>
        </Grid>

        {/* sticky actions for mobile when editing */}
        {isEditing && (
          <Box position="sticky" bottom="0" pt={8}>
            <Box
              bg="stickyBg"
              backdropFilter="blur(6px)"
              borderTop="1px solid"
              borderColor="cardBorder"
              px={{ base: 4, md: 8 }}
              py={3}
              borderBottomRadius="xl"
            >
              <HStack justify="flex-end" gap={3}>
                <Button variant="outline" leftIcon={<LuX />} onClick={handleCancel} isDisabled={isSaving}>
                  Hủy
                </Button>
                <Button colorPalette="green" leftIcon={<LuCheck />} onClick={handleSave}
                        isDisabled={!hasChanges} isLoading={isSaving}>
                  Lưu
                </Button>
              </HStack>
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  )
}

/* ---------- UI atoms ---------- */

function Field({
  label,
  name,
  value,
  onChange,
  isEditing,
  placeholder,
  type = 'text',
  icon = null,
  isReadOnlyWhenEdit = false,
}) {
  return (
    <VStack align="stretch" spacing={1}>
      <ChakraText fontWeight="medium" color="labelClr">{label}</ChakraText>
      {isEditing ? (
        <InputGroup startElement={icon}>
          <Input
            name={name}
            type={type}
            value={value ?? ''}
            onChange={onChange}
            placeholder={placeholder}
            isReadOnly={isReadOnlyWhenEdit}
            variant="filled"
          />
        </InputGroup>
      ) : (
        <ChakraText fontSize="lg">
          {value ? (type === 'date' ? new Date(value).toLocaleDateString('vi-VN') : value) : '—'}
        </ChakraText>
      )}
    </VStack>
  )
}

function ReadRow({ label, value, children, isLoading = false }) {
  return (
    <VStack align="stretch" spacing={1}>
      <ChakraText fontWeight="medium" color="labelClr">{label}</ChakraText>
      <Skeleton loading={isLoading}>
        {children ?? <ChakraText fontSize="lg">{value ?? '—'}</ChakraText>}
      </Skeleton>
    </VStack>
  )
}

function GlassCard({ title, children }) {
  return (
    <Box
      bg="cardBg"
      backdropFilter="blur(10px)"
      border="1px solid"
      borderColor="cardBorder"
      borderRadius="2xl"
      p={{ base: 4, md: 6 }}
      boxShadow="md"
      position="relative"
      overflow="hidden"
    >
      <Box position="absolute" top={0} left={0} right={0} h="2px"
           bgGradient="linear(to-r, purple.400, blue.400)" opacity={0.6} />
      <Heading size="md" mb={3} color="headingClr">{title}</Heading>
      <Separator my={3} />
      {children}
    </Box>
  )
}

function Dropzone({ onDrop, onBrowse, fileName, mt = 0 }) {
  return (
    <Box
      mt={mt}
      p={4}
      border="1px dashed"
      borderColor="cardBorder"
      rounded="lg"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      _hover={{ bg: 'whiteAlpha.50', _dark: { bg: 'whiteAlpha.100' } }}
      transition="background .2s ease"
    >
      <HStack justify="space-between" wrap="wrap" gap={3}>
        <ChakraText color="labelClr">
          Kéo & thả ảnh vào đây hoặc{' '}
          <Button size="sm" variant="link" onClick={onBrowse} leftIcon={<LuUpload />}>
            chọn file
          </Button>{' '}
          PNG/JPG • ≤ 2MB
        </ChakraText>
        {fileName && <Badge colorPalette="teal">{fileName}</Badge>}
      </HStack>
    </Box>
  )
}

function RoleBadge({ role }) {
  const isAdmin = role === 'ADMIN'
  return (
    <Badge colorPalette={isAdmin ? 'purple' : 'blue'} display="inline-flex" alignItems="center" gap={1}>
      {role || 'USER'}
    </Badge>
  )
}

function StatusBadge({ status }) {
  const isActive = status === 'ACTIVE'
  return (
    <Badge colorPalette={isActive ? 'green' : 'gray'} display="inline-flex" alignItems="center" gap={1}>
      {status || 'UNKNOWN'}
    </Badge>
  )
}
