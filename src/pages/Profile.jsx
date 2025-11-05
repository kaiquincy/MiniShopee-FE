import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CheckboxCard,
  createListCollection,
  Dialog,
  Field,
  Flex, Grid, GridItem, Heading,
  HStack,
  IconButton,
  Input,
  RadioGroup,
  Select,
  Separator, Stack,
  Tabs,
  Text,
  Textarea,
  useSelectContext
} from '@chakra-ui/react'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { SiJcb, SiMastercard, SiVisa } from 'react-icons/si'

import {
  LuBuilding2,
  LuCamera,
  LuCreditCard,
  LuHash,
  LuHouse,
  LuLock,
  LuMail,
  LuMapPin,
  LuPencil,
  LuPhone,
  LuPlus,
  LuSave,
  LuSchool,
  LuStar,
  LuStore, LuTag,
  LuTrash2,
  LuUser,
  LuUsers,
  LuX
} from 'react-icons/lu'
import { deleteAddress as apiDeleteAddress, createAddress, getAddresses, makeDefaultAddress, updateAddress } from '../api/addresses'
import { getMyInfo, updateUserInfo } from '../api/user'
import { toaster } from '../components/ui/toaster'

const SAMPLE_USER = {
  id: 'U-2025-0001',
  username: 'mintydenim',
  fullName: 'John Doe',
  email: 'johndoe@example.com',
  phone: '0901234567',
  bio: 'Fashion enthusiast, denim & retro sneakers lover.',
  avatarUrl: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=800&auto=format&fit=crop',
  tier: 'gold',
  gender: 'male',
  dob: '1996-08-20',
}

const SAMPLE_ADDRESSES = [
  {
    id: 'addr-1',
    label: 'home',
    fullName: 'John Doe',
    phone: '0901234567',
    line1: '123 Main Street',
    ward: 'Ward 1',
    district: 'District 5',
    city: 'Hanoi',
    country: 'Vietnam',
    isDefault: true,
  },
]

export default function UserProfilePage() {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addresses, setAddresses] = useState(SAMPLE_ADDRESSES)
  const [newAddress, setNewAddress] = useState({
    label: 'home',
    fullName: '',
    phone: '',
    line1: '',
    ward: '',
    district: '',
    city: '',
    country: 'Vietnam',
    isDefault: addresses.length === 0,
  })
  const [isAddCardOpen, setIsAddCardOpen] = useState(false)
  const [tab, setTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(SAMPLE_USER.avatarUrl)
  const fileInputRef = useRef(null)

  const [cards, setCards] = useState([
    { id: 'c1', brand: 'visa', holder: 'John Doe', number: '4111111111111111', expMonth: '08', expYear: '27', ccv: '123', isDefault: true },
    { id: 'c2', brand: 'mastercard', holder: 'John Doe', number: '5454545454545454', expMonth: '11', expYear: '26', ccv: '123', isDefault: false },
  ])

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    bio: SAMPLE_USER.bio,
    gender: '',
    dob: '',
  })

  const [newCard, setNewCard] = useState({
    brand: 'unknown',
    holder: '',
    number: '',
    expMonth: '',
    expYear: '',
    ccv: '',
    isDefault: cards.length === 0,
  })
  const [editingCardIds, setEditingCardIds] = useState(() => new Set())
  const [cardDrafts, setCardDrafts] = useState(() => {
    const o = {}
    for (const c of cards) o[c.id] = { ...c }
    return o
  })

  const LABEL_OPTIONS_COLLECTION = createListCollection({
    items: [
      { label: 'Home', value: 'home', icon: LuHouse },
      { label: 'Office', value: 'office', icon: LuBuilding2 },
      { label: 'Parents', value: 'parents', icon: LuUsers },
      { label: 'Dormitory', value: 'dorm', icon: LuSchool },
      { label: 'Store Pickup', value: 'store', icon: LuStore },
      { label: 'Other', value: 'other', icon: LuTag },
    ],
  })

  const loadUser = async () => {
    try {
      const userData = await getMyInfo()
      setFormData({
        username: userData?.username || '',
        email: userData?.email || '',
        phone: userData?.phone || '',
        dob: userData?.dateOfBirth,
        gender: (userData?.gender).toLowerCase() || 'other',
        fullName: userData?.fullName || '',
      })
    } catch (error) {
      toaster.create({
        title: 'Error loading data',
        description: error?.message || 'Cannot load profile',
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    }
  }

  const loadAddresses = async () => {
    try {
      const data = await getAddresses()
      setAddresses(data)
    } catch {
      toaster.create({ type:'error', description:'Cannot load addresses' })
    }
  }

  useEffect(() => {
    loadUser()
    loadAddresses()
  }, [])

  function resetNewCard() {
    setNewCard({
      brand: 'unknown',
      holder: '',
      number: '',
      expMonth: '',
      expYear: '',
      ccv: '',
      isDefault: cards.length === 0,
    })
  }

  function handleCreateCard() {
    const d = newCard
    if (!d.holder || !d.number || !d.expMonth || !d.expYear || !d.ccv) {
      toaster.create({ type: 'warning', description: 'Fill in all card information.' })
      return
    }
    if (!luhnCheck(d.number)) {
      toaster.create({ type: 'error', title: 'Invalid card number', description: 'Please check again.' })
      return
    }
    const mm = parseInt(d.expMonth, 10)
    const yy = parseInt(d.expYear, 10)
    const now = new Date(), curYY = now.getFullYear() % 100, curMM = now.getMonth() + 1
    if (!(mm >= 1 && mm <= 12) || yy < curYY || (yy === curYY && mm < curMM)) {
      toaster.create({ type: 'error', description: 'Card expired or invalid month/year.' })
      return
    }
    const detected = detectBrandFromBIN(d.number)
    const need3 = ['visa','mastercard','jcb'].includes(detected)
    const ccvDigits = String(d.ccv || '').replace(/\\D/g, '')
    if (need3 && ccvDigits.length !== 3) {
      toaster.create({ type: 'error', description: 'CCV/CVV must be 3 digits.' })
      return
    }

    const id = `c-${Date.now()}`
    let next = [...cards, { ...d, id, brand: detected }]
    if (d.isDefault) next = next.map(c => ({ ...c, isDefault: c.id === id }))

    setCards(next)
    setCardDrafts(s => ({ ...s, [id]: { ...d, id, brand: detected } }))
    setIsAddCardOpen(false)
    resetNewCard()
    toaster.create({ type: 'success', title: 'Card linked' })
  }

  function getLabelMeta(raw) {
    const items = LABEL_OPTIONS_COLLECTION.items
    if (!raw) return items[0]
    const foundByValue = items.find((o) => o.value === raw)
    if (foundByValue) return foundByValue
    const t = String(raw).trim().toLowerCase()
    if (['home'].includes(t)) return items[0]
    if (['office'].includes(t)) return items[1]
    if (['parents'].includes(t)) return items[2]
    if (['dorm', 'dormitory'].includes(t)) return items[3]
    if (['store', 'pickup'].includes(t)) return items[4]
    return { ...items[5], label: raw || items[5].label }
  }

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [editingAddrIds, setEditingAddrIds] = useState(() => new Set())
  const [addrDrafts, setAddrDrafts] = useState(() => {
    const map = {}
    for (const a of SAMPLE_ADDRESSES) map[a.id] = { ...a }
    return map
  })

  const membershipColor = useMemo(() => {
    if (SAMPLE_USER.tier === 'platinum') return 'purple'
    if (SAMPLE_USER.tier === 'gold') return 'yellow'
    return 'gray'
  }, [])

  function openAvatarPicker() {
    fileInputRef.current?.click()
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    toaster.create({ type: 'info', description: 'Avatar selected. Click Save to update.' })
  }

  async function onSaveProfile() {
    if (!formData.fullName || !formData.username || !formData.email) {
      toaster.create({ type: 'warning', description: 'Fill in Full Name, Username and Email.' })
      return
    }
    setSaving(true)
    try {
      await new Promise((r) => setTimeout(r, 900))
      setIsEditing(false)
      toaster.create({ type: 'success', title: 'Changes saved' })
    } catch {
      toaster.create({ type: 'error', title: 'Error', description: 'Cannot save, try again.' })
    } finally {
      setSaving(false)
    }
  }

  function onCancelEdit() {
    setIsEditing(false)
    setFormData({
      fullName: formData.fullName,
      username: formData.username,
      email: formData.email,
      phone: formData.phone,
      bio: formData.bio,
      gender: formData.gender,
      dob: formData.dob,
    })
    setPreviewUrl(SAMPLE_USER.avatarUrl)
  }

  async function onChangePassword() {
    if (!pw.current || !pw.next || !pw.confirm) {
      toaster.create({ type: 'warning', description: 'Fill all password fields.' })
      return
    }
    if (pw.next !== pw.confirm) {
      toaster.create({ type: 'error', description: 'Password confirmation does not match.' })
      return
    }
    if (pw.next.length < 8) {
      toaster.create({ type: 'warning', description: 'New password minimum 8 characters.' })
      return
    }
    await new Promise((r) => setTimeout(r, 900))
    setPw({ current: '', next: '', confirm: '' })
    toaster.create({ type: 'success', title: 'Password changed successfully' })
  }

  function startEditAddress(id) {
    setEditingAddrIds((s) => new Set(s).add(id))
    setAddrDrafts((s) => ({ ...s, [id]: { ...addresses.find((a) => a.id === id) } }))
  }

  function formatAddress(a) {
    const parts = [a.line1, a.ward, a.district, a.city].filter(Boolean)
    return parts.join(', ')
  }

  function cancelEditAddress(id) {
    setEditingAddrIds((s) => {
      const n = new Set(s)
      n.delete(id)
      return n
    })
    setAddrDrafts((s) => ({ ...s, [id]: { ...addresses.find((a) => a.id === id) } }))
  }

  const deleteAddress = async(id) => {
    await apiDeleteAddress(id)
    setAddresses((arr) => arr.filter((a) => a.id !== id))
    setEditingAddrIds((s) => {
      const n = new Set(s)
      n.delete(id)
      return n
    })
    const drafts = { ...addrDrafts }
    delete drafts[id]
    setAddrDrafts(drafts)
    toaster.create({ type: 'success', title: 'Address deleted' })
  }

  const handleCreateAddressSubmit = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    const created = {
      id: `addr-${Date.now()}`,
      label: (fd.get('label') || 'home').toString(),
      fullName: (fd.get('fullName') || '').toString().trim(),
      phone: (fd.get('phone') || '').toString().trim(),
      line1: (fd.get('line1') || '').toString().trim(),
      ward: (fd.get('ward') || '').toString().trim(),
      district: (fd.get('district') || '').toString().trim(),
      city: (fd.get('city') || '').toString().trim(),
      country: (fd.get('country') || 'Vietnam').toString().trim(),
      isDefault: fd.get('isDefault') === 'on' || addresses.length === 0,
    }

    if (!created.fullName || !created.phone || !created.line1 || !created.city) {
      toaster.create({ type: 'warning', description: 'Fill in Recipient, Phone, Address, City.' })
      return
    }

    await createAddress({ ...created })

    setAddresses(prev => {
      let next = [...prev, created]
      if (created.isDefault) next = next.map(a => ({ ...a, isDefault: a.id === created.id }))
      return next
    })
    setAddrDrafts(prev => ({ ...prev, [created.id]: created }))
    setIsAddOpen(false)
    toaster.create({ type: 'success', title: 'Address added' })
  }

  function handleEditAddressSubmit(e, addrId) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    const next = {
      id: addrId,
      label: (fd.get('label') || 'home').toString(),
      fullName: (fd.get('fullName') || '').toString().trim(),
      phone: (fd.get('phone') || '').toString().trim(),
      line1: (fd.get('line1') || '').toString().trim(),
      ward: (fd.get('ward') || '').toString().trim(),
      district: (fd.get('district') || '').toString().trim(),
      city: (fd.get('city') || '').toString().trim(),
      country: (fd.get('country') || 'Vietnam').toString().trim(),
      isDefault: addresses.find(a => a.id === addrId)?.isDefault ?? false,
    }

    if (!next.fullName || !next.phone || !next.line1 || !next.city) {
      toaster.create({ type: 'warning', description: 'Fill in address information.' })
      return
    }

    updateAddress(addrId, next)

    setAddresses(list => list.map(a => a.id === addrId ? next : a))
    setEditingAddrIds(s => { const n = new Set(s); n.delete(addrId); return n })
    toaster.create({ type: 'success', title: 'Address saved' })
  }

  const setDefaultAddress = async (id) => {
    setAddresses((arr) => arr.map((a) => ({ ...a, isDefault: a.id === id })))
    await makeDefaultAddress(id)
    toaster.create({ type: 'success', title: 'Set as default address' })
  }

  function DefBadge() {
    return (
      <Badge bg="#10B98115" color="#10B981" border="1px solid" borderColor="#10B98130" px={2} py={0.5} borderRadius="md" fontSize="xs" fontWeight="semibold">
        Default
      </Badge>
    )
  }

  const handleProfileSubmit = async(e) => {
    if (!isEditing) {
      e.preventDefault()
      return
    }
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    const next = {
      fullName: (fd.get('fullName') || '').toString().trim(),
      username: (fd.get('username') || '').toString().trim() || SAMPLE_USER.username,
      email: (fd.get('email') || '').toString().trim(),
      phone: (fd.get('phone') || '').toString().trim(),
      bio: (fd.get('bio') || '').toString(),
      gender: (fd.get('gender') || formData.gender).toString(),
      dob: (fd.get('dob') || formData.dob).toString(),
    }

    if (!next.fullName || !next.username || !next.email) {
      toaster.create({ type: 'warning', description: 'Fill in Full Name, Username and Email.' })
      return
    }

    const tempFormData = {
      ...next,
      gender: formData.gender ? formData.gender.toUpperCase() : "OTHER"
    }
    await updateUserInfo(tempFormData)
    
    setSaving(true)
    Promise.resolve()
      .then(() => new Promise(r => setTimeout(r, 700)))
      .then(() => {
        setFormData(next)
        setIsEditing(false)
        toaster.create({ type: 'success', title: 'Changes saved' })
      })
      .catch(() => {
        toaster.create({ type: 'error', title: 'Error', description: 'Cannot save, try again.' })
      })
      .finally(() => setSaving(false))
  }

  function handlePasswordSubmit(e) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)

    const current = String(fd.get('current') || '')
    const next = String(fd.get('next') || '')
    const confirm = String(fd.get('confirm') || '')

    if (!current || !next || !confirm) {
      toaster.create({ type: 'warning', description: 'Fill all password fields.' })
      return
    }
    if (next !== confirm) {
      toaster.create({ type: 'error', description: 'Password confirmation does not match.' })
      return
    }
    if (next.length < 8) {
      toaster.create({ type: 'warning', description: 'New password minimum 8 characters.' })
      return
    }

    Promise.resolve()
      .then(() => new Promise(r => setTimeout(r, 700)))
      .then(() => {
        form.reset()
        toaster.create({ type: 'success', title: 'Password changed successfully' })
      })
  }

  function getBrandMeta(raw) {
    const items = CARD_BRANDS_COLLECTION.items
    if (!raw) return items[0]
    const found = items.find(b => b.value === raw)
    if (found) return found
  }

  function maskCard(number) {
    if (!number) return '•••• •••• •••• ••••'
    const digits = number.replace(/\\D/g, '')
    const last4 = digits.slice(-4)
    return `•••• •••• •••• ${last4 || '••••'}`
  }

  function formatExpiry(m, y) {
    const mm = String(m || '').padStart(2, '0').slice(-2)
    const yy = String(y || '').slice(-2)
    return `${mm || 'MM'}/${yy || 'YY'}`
  }

  function detectBrandFromBIN(digits) {
    if (!digits) return 'unknown'
    if (/^4\\d{0,18}$/.test(digits)) return 'visa'
    if (/^(5[1-5]\\d{0,14}|222[1-9]\\d{0,12}|22[3-9]\\d{0,13}|2[3-6]\\d{0,14}|27[01]\\d{0,13}|2720\\d{0,12})$/.test(digits))
      return 'mastercard'
    if (/^35(2[8-9]|[3-8]\\d)\\d{0,12}$/.test(digits)) return 'jcb'
    return 'unknown'
  }

  function luhnCheck(digits) {
    if (!digits) return false
    const s = digits.replace(/\\D/g, '')
    let sum = 0
    let dbl = false
    for (let i = s.length - 1; i >= 0; i--) {
      let d = parseInt(s[i], 10)
      if (dbl) {
        d *= 2
        if (d > 9) d -= 9
      }
      sum += d
      dbl = !dbl
    }
    return (sum % 10) === 0 && s.length >= 12
  }

  function groupCardNumber(digits) {
    const s = (digits || '').replace(/\\D/g, '').slice(0, 19)
    return s.replace(/(\\d{4})(?=\\d)/g, '$1 ').trim()
  }

  const CARD_BRANDS_COLLECTION = createListCollection({
    items: [
      { label: 'Card', icon: LuCreditCard, color: 'currentColor', value: 'unknown' },
      { label: 'Visa', value: 'visa', icon: SiVisa, color: '#1A1F71' },
      { label: 'Mastercard', value: 'mastercard', icon: SiMastercard, color: '#EB001B' },
      { label: 'JCB', value: 'jcb', icon: SiJcb, color: '#1F4E79' },
    ],
  })

  function startEditCard(id) {
    setEditingCardIds(s => new Set(s).add(id))
    setCardDrafts(s => ({ ...s, [id]: { ...cards.find(c => c.id === id) } }))
  }

  function cancelEditCard(id) {
    setEditingCardIds(s => { const n = new Set(s); n.delete(id); return n })
    setCardDrafts(s => ({ ...s, [id]: { ...cards.find(c => c.id === id) } }))
  }

  function changeCardDraft(id, key, value) {
    setCardDrafts(prev => ({ ...prev, [id]: { ...prev[id], [key]: value } }))
  }

  function saveCard(id) {
    const d = cardDrafts[id]
    if (!d?.brand || !d?.holder || !d?.number || !d?.expMonth || !d?.expYear) {
      toaster.create({ type: 'warning', description: 'Fill in all card information.' })
      return
    }
    if (!luhnCheck(d.number)) {
      toaster.create({ type: 'error', title: 'Invalid card number', description: 'Please check the card number.' })
      return
    }
    const mm = parseInt(d.expMonth, 10)
    const yy = parseInt(d.expYear, 10)
    if (!(mm >= 1 && mm <= 12)) {
      toaster.create({ type: 'error', description: 'Invalid expiration month.' })
      return
    }
    const now = new Date()
    const curYY = now.getFullYear() % 100
    const curMM = now.getMonth() + 1
    if (yy < curYY || (yy === curYY && mm < curMM)) {
      toaster.create({ type: 'error', description: 'Card expired.' })
      return
    }

    const brand = detectBrandFromBIN(d.number)
    const ccvDigits = String(d.ccv || '').replace(/\\D/g, '')
    const need3 = ['visa','mastercard','jcb'].includes(brand)
    if (need3 && ccvDigits.length !== 3) {
      toaster.create({ type:'error', description:'CCV/CVV must be 3 digits.' })
      return
    }

    setCards(arr => arr.map(c => (c.id === id ? { ...d } : c)))
    setEditingCardIds(s => { const n = new Set(s); n.delete(id); return n })
    toaster.create({ type: 'success', title: 'Card saved' })
  }

  function deleteCard(id) {
    setCards(arr => arr.filter(c => c.id !== id))
    setEditingCardIds(s => { const n = new Set(s); n.delete(id); return n })
    const next = { ...cardDrafts }
    delete next[id]
    setCardDrafts(next)
    toaster.create({ type: 'success', title: 'Card deleted' })
  }

  function setDefaultCard(id) {
    setCards(arr => arr.map(c => ({ ...c, isDefault: c.id === id })))
    toaster.create({ type: 'success', title: 'Set default card' })
  }

  const SelectTrigger = () => {
    const select = useSelectContext()
    const items = select.selectedItems
    const item = items[0]
    return (
      <Select.ValueText placeholder="Select label">
        <HStack>
          <IconButton px="2" variant="" size="sm" {...select.getTriggerProps()}>
            {select.hasSelectedItems ? <item.icon/> : <LuTag />}
            {select.hasSelectedItems ? items[0].label : 'Select'}
          </IconButton>
        </HStack>
      </Select.ValueText>
    )
  }

  return (
    <Box maxW="1200px" mx="auto" px={6} py={10}>
      {/* Header */}
      <Flex align="center" justify="space-between" mb={8} gap={4}>
        <Box>
          <Heading size="2xl" fontWeight="black" color="#212529" mb={2}>
            My Profile
          </Heading>
          <Text color="#6C757D" fontSize="lg">
            Manage your personal information, addresses & security
          </Text>
        </Box>
        <Badge 
          bg={membershipColor === 'yellow' ? '#F59E0B15' : '#8B5CF615'}
          color={membershipColor === 'yellow' ? '#F59E0B' : '#8B5CF6'}
          border="1px solid"
          borderColor={membershipColor === 'yellow' ? '#F59E0B30' : '#8B5CF630'}
          px={4} 
          py={2}
          borderRadius="full"
          fontSize="sm"
          fontWeight="bold"
        >
          {String(SAMPLE_USER.tier || '').toUpperCase()} MEMBER
        </Badge>
      </Flex>

      <Separator borderColor="#E9ECEF" mb={8} />

      {/* Tabs */}
      <Tabs.Root value={tab} onValueChange={(e) => setTab(e.value)}>
        <Tabs.List
          mb={6}
          justifyContent="start"
          border="1px solid"
          borderColor="#DEE2E6"
          rounded="xl"
          p="4px"
          bg="#F8F9FA"
          wrap="wrap"
          gap="4px"
        >
          <Tabs.Trigger 
            value="profile" 
            px={5} 
            py={3} 
            rounded="lg" 
            color="#495057"
            _selected={{ bg: 'white', boxShadow: 'sm', color: '#212529', fontWeight: 'semibold' }}
          >
            <Flex align="center" gap={2}>
              <LuUser /> 
              <Text display={{ base: 'none', md: 'block' }}>User Info</Text>
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="password" 
            px={5} 
            py={3} 
            rounded="lg"
            color="#495057"
            _selected={{ bg: 'white', boxShadow: 'sm', color: '#212529', fontWeight: 'semibold' }}
          >
            <Flex align="center" gap={2}>
              <LuLock /> 
              <Text display={{ base: 'none', md: 'block' }}>Change Password</Text>
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="addresses" 
            px={5} 
            py={3} 
            rounded="lg"
            color="#495057"
            _selected={{ bg: 'white', boxShadow: 'sm', color: '#212529', fontWeight: 'semibold' }}
          >
            <Flex align="center" gap={2}>
              <LuMapPin /> 
              <Text display={{ base: 'none', md: 'block' }}>Addresses</Text>
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="payments" 
            px={5} 
            py={3} 
            rounded="lg"
            color="#495057"
            _selected={{ bg: 'white', boxShadow: 'sm', color: '#212529', fontWeight: 'semibold' }}
          >
            <Flex align="center" gap={2}>
              <LuCreditCard /> 
              <Text display={{ base: 'none', md: 'block' }}>Payment</Text>
            </Flex>
          </Tabs.Trigger>
        </Tabs.List>

        {/* Tab: Profile */}
        <Tabs.Content value="profile">
          <form onSubmit={handleProfileSubmit}>
            <Grid templateColumns={{ base: '1fr', md: '320px 1fr' }} gap={8} alignItems="start">
              <GridItem>
                <Box position="relative" className="group" w="full" display="flex" alignItems="center" justifyContent="center">
                  <Box transform="translateZ(0)">
                    <Avatar.Root
                      size="3xl"
                      variant="solid"
                      shadow="xl"
                      style={{
                        border: '8px solid transparent',
                        background:
                          'linear-gradient(white, white) padding-box,' +
                          'linear-gradient(135deg, #a78bfa, #60a5fa, #34d399) border-box',
                      }}
                    >
                      <Avatar.Fallback name={formData.fullName || 'U'} />
                      {previewUrl && <Avatar.Image src={previewUrl} alt="avatar" />}
                    </Avatar.Root>
                  </Box>

                  <Flex
                    position="absolute"
                    inset="0"
                    align="center"
                    justify="center"
                    opacity={{ base: 1, md: 0 }}
                    _groupHover={{ opacity: 1 }}
                    transition="all 200ms"
                    bg="blackAlpha.500"
                    rounded="full"
                  >
                    <IconButton 
                      aria-label="Edit avatar" 
                      onClick={openAvatarPicker} 
                      size="lg" 
                      rounded="full" 
                      bg="#212529"
                      color="white"
                      _hover={{ bg: "#343A40" }}
                    >
                      <LuCamera />
                    </IconButton>
                  </Flex>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                </Box>

                <Flex mt={4} gap={3} wrap="wrap">
                  {!isEditing ? (
                    <Button  
                      bg="#212529"
                      color="white"
                      _hover={{ bg: "#343A40" }}
                      onClick={(e) => {
                        e.preventDefault()
                        setTimeout(() => setIsEditing(true), 0)
                      }}
                    >
                      <LuPencil /> Edit profile
                    </Button>
                  ) : (
                    <>
                      <Button 
                        type="submit" 
                        loading={saving} 
                        loadingText="Saving..."
                        bg="#212529"
                        color="white"
                        _hover={{ bg: "#343A40" }}
                      >
                        <LuSave /> Save
                      </Button>
                      <Button 
                        variant="outline"
                        borderColor="#DEE2E6"
                        color="#495057"
                        _hover={{ bg: "#F8F9FA" }}
                        onClick={onCancelEdit}
                      >
                        <LuX /> Cancel
                      </Button>
                    </>
                  )}
                </Flex>
              </GridItem>

              <GridItem>
                <Box 
                  p={6} 
                  rounded="xl" 
                  border="1px solid" 
                  borderColor="#DEE2E6" 
                  bg="white" 
                  shadow="sm"
                >
                  <Stack gap={5}>
                    <Flex align="center" justify="space-between">
                      <Heading size="lg" color="#212529">Personal Information</Heading>
                      <Text color="#6C757D" fontSize="sm">ID: <b>{SAMPLE_USER.id}</b></Text>
                    </Flex>

                    <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={5}>
                      <Field.Root name="fullName" required>
                        <Field.Label color="#495057">
                          <Flex align="center" gap={2}><LuUser /> Full Name</Flex>
                        </Field.Label>
                        <Input 
                          name="fullName" 
                          placeholder="John Doe" 
                          defaultValue={formData.fullName} 
                          readOnly={!isEditing}
                          borderColor="#DEE2E6"
                          _hover={{ borderColor: "#ADB5BD" }}
                          _focus={{ borderColor: "#495057", boxShadow: "0 0 0 1px #495057" }}
                        />
                      </Field.Root>

                      <Field.Root name="username" required>
                        <Field.Label color="#495057">
                          <Flex align="center" gap={2}><LuHash /> Username</Flex>
                        </Field.Label>
                        <Input 
                          name="username" 
                          placeholder="username" 
                          defaultValue={formData.username} 
                          disabled
                          bg="#F8F9FA"
                          borderColor="#DEE2E6"
                        />
                        <input type="hidden" name="username" value={formData.username} />
                      </Field.Root>

                      <Field.Root name="email">
                        <Field.Label color="#495057">
                          <Flex align="center" gap={2}><LuMail /> Email</Flex>
                        </Field.Label>
                        <Input 
                          type="email" 
                          name="email" 
                          placeholder="email@domain.com" 
                          defaultValue={formData.email} 
                          readOnly={!isEditing}
                          borderColor="#DEE2E6"
                          _hover={{ borderColor: "#ADB5BD" }}
                          _focus={{ borderColor: "#495057", boxShadow: "0 0 0 1px #495057" }}
                        />
                      </Field.Root>

                      <Field.Root name="phone">
                        <Field.Label color="#495057">
                          <Flex align="center" gap={2}><LuPhone /> Phone Number</Flex>
                        </Field.Label>
                        <Input 
                          name="phone" 
                          placeholder="090xxxxxxx" 
                          defaultValue={formData.phone} 
                          readOnly={!isEditing}
                          borderColor="#DEE2E6"
                          _hover={{ borderColor: "#ADB5BD" }}
                          _focus={{ borderColor: "#495057", boxShadow: "0 0 0 1px #495057" }}
                        />
                      </Field.Root>
                    </Grid>

                    <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={5}>
                      <Field.Root name="gender">
                        <Field.Label color="#495057">Gender</Field.Label>
                        <RadioGroup.Root value={formData.gender} readOnly={!isEditing}>
                          <HStack gap="6" wrap="wrap">
                            <RadioGroup.Item value="male">
                              <RadioGroup.ItemHiddenInput name="gender" />
                              <RadioGroup.ItemIndicator />
                              <RadioGroup.ItemText>Male</RadioGroup.ItemText>
                            </RadioGroup.Item>
                            <RadioGroup.Item value="female">
                              <RadioGroup.ItemHiddenInput name="gender" />
                              <RadioGroup.ItemIndicator />
                              <RadioGroup.ItemText>Female</RadioGroup.ItemText>
                            </RadioGroup.Item>
                            <RadioGroup.Item value="other">
                              <RadioGroup.ItemHiddenInput name="gender" />
                              <RadioGroup.ItemIndicator />
                              <RadioGroup.ItemText>Other</RadioGroup.ItemText>
                            </RadioGroup.Item>
                          </HStack>
                        </RadioGroup.Root>
                      </Field.Root>

                      <Field.Root name="dob">
                        <Field.Label color="#495057">Date of Birth</Field.Label>
                        <Input 
                          type="date" 
                          name="dob" 
                          defaultValue={formData.dob || ''} 
                          readOnly={!isEditing}
                          borderColor="#DEE2E6"
                          _hover={{ borderColor: "#ADB5BD" }}
                          _focus={{ borderColor: "#495057", boxShadow: "0 0 0 1px #495057" }}
                        />
                      </Field.Root>
                    </Grid>

                    <Separator borderColor="#E9ECEF" />

                    <Field.Root name="bio">
                      <Field.Label color="#495057">Bio</Field.Label>
                      <Textarea 
                        name="bio" 
                        placeholder="A bit about yourself…" 
                        rows={4} 
                        defaultValue={formData.bio} 
                        readOnly={!isEditing}
                        borderColor="#DEE2E6"
                        _hover={{ borderColor: "#ADB5BD" }}
                        _focus={{ borderColor: "#495057", boxShadow: "0 0 0 1px #495057" }}
                      />
                    </Field.Root>
                  </Stack>
                </Box>
              </GridItem>
            </Grid>
          </form>
        </Tabs.Content>

        {/* Tab: Change password */}
        <Tabs.Content value="password">
          <Box 
            p={6} 
            rounded="xl" 
            border="1px solid" 
            borderColor="#DEE2E6" 
            bg="white" 
            shadow="sm"
          >
            <Heading size="lg" mb={4} color="#212529">Change Password</Heading>
            <Text color="#6C757D" mb={6}>
              New password minimum 8 characters, with uppercase/lowercase, numbers or special characters.
            </Text>

            <form onSubmit={handlePasswordSubmit}>
              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr 1fr' }} gap={5}>
                <Field.Root name="current" required>
                  <Field.Label color="#495057">Current Password</Field.Label>
                  <Input 
                    type="password" 
                    name="current" 
                    placeholder="••••••••"
                    borderColor="#DEE2E6"
                    _hover={{ borderColor: "#ADB5BD" }}
                    _focus={{ borderColor: "#495057", boxShadow: "0 0 0 1px #495057" }}
                  />
                </Field.Root>
                <Field.Root name="next" required>
                  <Field.Label color="#495057">New Password</Field.Label>
                  <Input 
                    type="password" 
                    name="next" 
                    placeholder="••••••••"
                    borderColor="#DEE2E6"
                    _hover={{ borderColor: "#ADB5BD" }}
                    _focus={{ borderColor: "#495057", boxShadow: "0 0 0 1px #495057" }}
                  />
                </Field.Root>
                <Field.Root name="confirm" required>
                  <Field.Label color="#495057">Confirm Password</Field.Label>
                  <Input 
                    type="password" 
                    name="confirm" 
                    placeholder="••••••••"
                    borderColor="#DEE2E6"
                    _hover={{ borderColor: "#ADB5BD" }}
                    _focus={{ borderColor: "#495057", boxShadow: "0 0 0 1px #495057" }}
                  />
                </Field.Root>
              </Grid>

              <Flex mt={6} gap={3}>
                <Button 
                  type="submit"
                  bg="#212529"
                  color="white"
                  _hover={{ bg: "#343A40" }}
                >
                  Update Password
                </Button>
                <Button 
                  type="reset" 
                  variant="outline"
                  borderColor="#DEE2E6"
                  color="#495057"
                  _hover={{ bg: "#F8F9FA" }}
                >
                  Clear
                </Button>
              </Flex>
            </form>
          </Box>
        </Tabs.Content>

        {/* Tab: Addresses */}
        <Tabs.Content value="addresses">
          <Flex align="center" justify="space-between" mb={4}>
            <Heading size="lg" color="#212529">Address Book</Heading>

            <Dialog.Root open={isAddOpen} onOpenChange={(e) => setIsAddOpen(e.open)}>
              <Dialog.Trigger asChild>
                <Button 
                  onClick={() => setIsAddOpen(true)}
                  bg="#212529"
                  color="white"
                  _hover={{ bg: "#343A40" }}
                >
                  <LuPlus /> Add Address
                </Button>
              </Dialog.Trigger>

              <Dialog.Backdrop />
              <Dialog.Positioner>
                <Dialog.Content maxW="720px" rounded="xl">
                  <Dialog.CloseTrigger />
                  <Dialog.Header>
                    <Dialog.Title>Add New Address</Dialog.Title>
                  </Dialog.Header>

                  <form onSubmit={handleCreateAddressSubmit}>
                    <Dialog.Body>
                      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                        <Field.Root name="label">
                          <Field.Label color="#495057">Label</Field.Label>
                          <Select.Root defaultValue={['home']} collection={LABEL_OPTIONS_COLLECTION} size="sm">
                            <Select.HiddenSelect name="label" />
                            <Select.Control>
                              <Select.Trigger>
                                <SelectTrigger />
                              </Select.Trigger>
                              <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                            </Select.Control>
                            <Select.Positioner>
                              <Select.Content>
                                {LABEL_OPTIONS_COLLECTION.items.map((item) => (
                                  <Select.Item key={item.value} item={item}>
                                    <Flex align="center" gap="2">
                                      {item.icon ? <item.icon /> : null}
                                      {item.label}
                                    </Flex>
                                    <Select.ItemIndicator />
                                  </Select.Item>
                                ))}
                              </Select.Content>
                            </Select.Positioner>
                          </Select.Root>
                        </Field.Root>

                        <Field.Root name="fullName">
                          <Field.Label color="#495057">Recipient</Field.Label>
                          <Input name="fullName" placeholder="Full name" borderColor="#DEE2E6" />
                        </Field.Root>

                        <Field.Root name="phone">
                          <Field.Label color="#495057">Phone Number</Field.Label>
                          <Input name="phone" inputMode="tel" placeholder="090xxxxxxx" borderColor="#DEE2E6" />
                        </Field.Root>

                        <Field.Root name="country">
                          <Field.Label color="#495057">Country</Field.Label>
                          <Input name="country" defaultValue="Vietnam" borderColor="#DEE2E6" />
                        </Field.Root>

                        <Field.Root name="line1" gridColumn={{ md: 'span 2' }}>
                          <Field.Label color="#495057">Address</Field.Label>
                          <Input name="line1" placeholder="Street address" borderColor="#DEE2E6" />
                        </Field.Root>

                        <Field.Root name="ward">
                          <Field.Label color="#495057">Ward</Field.Label>
                          <Input name="ward" placeholder="Ward name" borderColor="#DEE2E6" />
                        </Field.Root>

                        <Field.Root name="district">
                          <Field.Label color="#495057">District</Field.Label>
                          <Input name="district" placeholder="District name" borderColor="#DEE2E6" />
                        </Field.Root>

                        <Field.Root name="city">
                          <Field.Label color="#495057">City</Field.Label>
                          <Input name="city" placeholder="City" borderColor="#DEE2E6" />
                        </Field.Root>

                        <Box>
                          <CheckboxCard.Root defaultChecked={addresses.length === 0} mt={5}>
                            <CheckboxCard.HiddenInput name="isDefault" />
                            <CheckboxCard.Control>
                              <CheckboxCard.Label>Set as default address</CheckboxCard.Label>
                              <CheckboxCard.Indicator />
                            </CheckboxCard.Control>
                          </CheckboxCard.Root>
                        </Box>
                      </Grid>
                    </Dialog.Body>

                    <Dialog.Footer>
                      <Flex gap={3} justify="flex-end" w="full">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsAddOpen(false)}
                          borderColor="#DEE2E6"
                          color="#495057"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          bg="#212529"
                          color="white"
                          _hover={{ bg: "#343A40" }}
                        >
                          Save Address
                        </Button>
                      </Flex>
                    </Dialog.Footer>
                  </form>
                </Dialog.Content>
              </Dialog.Positioner>
            </Dialog.Root>
          </Flex>

          <Stack gap={5}>
            {addresses.map((addr) => {
              const isEditingCard = editingAddrIds.has(addr.id)
              const meta = getLabelMeta(addr.label)
              const LabelIcon = meta.icon

              return (
                <Card.Root
                  key={addr.id}
                  border="1px solid"
                  borderColor="#DEE2E6"
                  rounded="xl"
                  shadow="sm"
                  bg="white"
                >
                  <Card.Body p={6}>
                    <Flex align="center" justify="space-between" mb={3} gap={3} wrap="wrap">
                      {!isEditingCard ? (
                        <Flex align="center" gap={3} wrap="wrap">
                          <Flex
                            align="center"
                            gap={1.5}
                            px="2.5"
                            py="0.5"
                            rounded="full"
                            border="1px solid"
                            borderColor="#DEE2E6"
                            fontSize="sm"
                            color="#495057"
                          >
                            <LabelIcon />
                            <Text>{meta.label}</Text>
                          </Flex>
                          {addr.isDefault && <DefBadge />}
                        </Flex>
                      ) : (
                        <Heading size="md" color="#212529">Edit Address</Heading>
                      )}

                      <Flex gap={1}>
                        {!isEditingCard ? (
                          <>
                            <IconButton
                              aria-label="Set default"
                              size="sm"
                              variant="ghost"
                              color="#495057"
                              onClick={() => setDefaultAddress(addr.id)}
                              title="Set as default"
                            >
                              <LuStar
                                style={{
                                  opacity: addr.isDefault ? 1 : 0.45,
                                  ...(addr.isDefault ? { fill: 'currentColor' } : {}),
                                }}
                              />
                            </IconButton>
                            <IconButton
                              aria-label="Edit"
                              size="sm"
                              variant="ghost"
                              color="#495057"
                              onClick={() => startEditAddress(addr.id)}
                              title="Edit"
                            >
                              <LuPencil />
                            </IconButton>
                            <IconButton
                              aria-label="Delete"
                              size="sm"
                              variant="ghost"
                              color="#DC3545"
                              onClick={() => deleteAddress(addr.id)}
                              title="Delete address"
                            >
                              <LuTrash2 />
                            </IconButton>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<LuX />}
                            onClick={() => cancelEditAddress(addr.id)}
                            borderColor="#DEE2E6"
                            color="#495057"
                          >
                            Cancel
                          </Button>
                        )}
                      </Flex>
                    </Flex>

                    {!isEditingCard ? (
                      <Box>
                        <Flex align="center" gap={2} wrap="wrap" mb={1}>
                          <Text fontWeight="semibold" color="#212529">
                            {(addr.fullName || '—')}{addr.phone ? ` • ${addr.phone}` : ''}
                          </Text>
                        </Flex>
                        <Text color="#6C757D">{formatAddress(addr) || '—'}</Text>
                      </Box>
                    ) : (
                      <form onSubmit={(e) => handleEditAddressSubmit(e, addr.id)}>
                        {/* Similar input fields as create form */}
                        <Flex mt={4} gap={2}>
                          <Button 
                            type="submit" 
                            size="sm" 
                            leftIcon={<LuSave />}
                            bg="#212529"
                            color="white"
                            _hover={{ bg: "#343A40" }}
                          >
                            Save
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            leftIcon={<LuX />}
                            onClick={() => cancelEditAddress(addr.id)}
                            borderColor="#DEE2E6"
                            color="#495057"
                          >
                            Cancel
                          </Button>
                        </Flex>
                      </form>
                    )}
                  </Card.Body>
                </Card.Root>
              )
            })}
          </Stack>
        </Tabs.Content>

        {/* Tab: Payments - Similar styling updates */}
        <Tabs.Content value="payments">
          <Flex align="center" justify="space-between" mb={4}>
            <Heading size="lg" color="#212529">Payment Methods</Heading>
            <Button 
              onClick={() => setIsAddCardOpen(true)}
              bg="#212529"
              color="white"
              _hover={{ bg: "#343A40" }}
            >
              <LuPlus /> Link Card
            </Button>
          </Flex>

          <Stack gap={5}>
            {cards.map((card) => {
              const isEditing = editingCardIds.has(card.id)
              const viewMeta = getBrandMeta(card.brand)

              return (
                <Card.Root 
                  key={card.id} 
                  border="1px solid" 
                  borderColor="#DEE2E6" 
                  rounded="xl" 
                  shadow="sm"
                  bg="white"
                >
                  <Card.Body p={6}>
                    <Flex align="center" justify="space-between" mb={3} gap={3} wrap="wrap">
                      {!isEditing ? (
                        <Flex align="center" gap={3} wrap="wrap">
                          <Flex 
                            align="center" 
                            gap={1.5} 
                            px="2.5" 
                            py="0.5" 
                            rounded="full" 
                            border="1px solid" 
                            borderColor="#DEE2E6" 
                            fontSize="sm"
                          >
                            {React.createElement(viewMeta.icon, { style:{ color: viewMeta.color } })}
                            <Text>{viewMeta.label}</Text>
                          </Flex>
                          <Text fontWeight="semibold" color="#212529">{maskCard(card.number)}</Text>
                          {card.isDefault && <DefBadge />}
                        </Flex>
                      ) : (
                        <Heading size="md" color="#212529">Edit Card</Heading>
                      )}

                      <Flex gap={1}>
                        {!isEditing ? (
                          <>
                            <IconButton 
                              aria-label="Set default" 
                              size="sm" 
                              variant="ghost" 
                              color="#495057"
                              onClick={() => setDefaultCard(card.id)}
                            >
                              <LuStar style={{ opacity: card.isDefault ? 1 : 0.45, ...(card.isDefault?{ fill:'currentColor' }:{}) }} />
                            </IconButton>
                            <IconButton 
                              aria-label="Edit" 
                              size="sm" 
                              variant="ghost" 
                              color="#495057"
                              onClick={() => startEditCard(card.id)}
                            >
                              <LuPencil />
                            </IconButton>
                            <IconButton 
                              aria-label="Delete" 
                              size="sm" 
                              variant="ghost" 
                              color="#DC3545"
                              onClick={() => deleteCard(card.id)}
                            >
                              <LuTrash2 />
                            </IconButton>
                          </>
                        ) : (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => saveCard(card.id)}
                              bg="#212529"
                              color="white"
                              _hover={{ bg: "#343A40" }}
                            >
                              Save
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => cancelEditCard(card.id)}
                              borderColor="#DEE2E6"
                              color="#495057"
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                      </Flex>
                    </Flex>

                    {!isEditing ? (
                      <Text color="#6C757D">{card.holder || '—'} • {formatExpiry(card.expMonth, card.expYear)}</Text>
                    ) : (
                      <Box>
                        {/* Card edit form fields */}
                      </Box>
                    )}
                  </Card.Body>
                </Card.Root>
              )
            })}
          </Stack>
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  )
}