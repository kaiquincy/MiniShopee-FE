'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Box, Flex, Grid, GridItem, Heading, Text, Button, IconButton,
  Input, Textarea, Separator, Stack, Badge, Tabs, Field, Avatar,
  RadioGroup, Card, HStack, createListCollection, Select, Portal,
  Icon, Dialog, CheckboxCard, useSelectContext
} from '@chakra-ui/react'
import { SiVisa, SiMastercard, SiJcb } from 'react-icons/si'

import { toaster } from '../components/ui/toaster'
import {
  LuCamera, LuPencil, LuSave, LuX, LuMail, LuUser,
  LuPhone, LuHash, LuLock, LuMapPin, LuPlus, LuTrash2, LuStar,
  LuHouse, LuBuilding2, LuUsers, LuSchool, LuStore, LuTag, LuCreditCard
} from 'react-icons/lu'
import { getMyInfo, updateUserInfo } from '../api/user'
import { getAddresses, makeDefaultAddress, createAddress, deleteAddress as apiDeleteAddress, updateAddress } from '../api/addresses'



const SAMPLE_USER = {
  id: 'U-2025-0001',
  username: 'mintydenim',
  fullName: 'Nguyễn Văn A',
  email: 'nguyenvana@example.com',
  phone: '0901234567',
  bio: 'Tín đồ local brand, thích denim & retro sneakers.',
  avatarUrl:
    'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=800&auto=format&fit=crop',
  tier: 'gold',
  gender: 'male',
  dob: '1996-08-20',
}

const SAMPLE_ADDRESSES = [
  {
    id: 'addr-1',
    label: 'home',
    fullName: 'Nguyễn Văn A',
    phone: '0901234567',
    line1: '123 Nguyễn Trãi',
    ward: 'Phường 1',
    district: 'Quận 5',
    city: 'Hà Nội',
    country: 'Việt Nam',
    isDefault: true,
  },
  {
    id: 'addr-2',
    label: 'office',
    fullName: 'Nguyễn Văn A',
    phone: '0901234567',
    line1: 'Tầng 8, Tòa XYZ',
    ward: 'Phường 2',
    district: 'Quận 10',
    city: 'Hà Nội',
    country: 'Việt Nam',
    isDefault: false,
  },
]



export default function UserProfilePage()
 {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addresses, setAddresses] = useState(SAMPLE_ADDRESSES)
  const [newAddress, setNewAddress] = useState({
    label: 'home',           // dùng value chuẩn
    fullName: '',
    phone: '',
    line1: '',
    ward: '',
    district: '',
    city: '',
    country: 'Việt Nam',
    isDefault: addresses.length === 0,
  })
  const [isAddCardOpen, setIsAddCardOpen] = useState(false)
  const [tab, setTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(SAMPLE_USER.avatarUrl)
  const fileInputRef = useRef(null)

  // ============== SAMPLE DATA (Nếu real thì để rỗng và useeffect để fetch data) ==============
  const [cards, setCards] = useState([
    { id: 'c1', brand: 'visa',       holder: 'Nguyễn Văn A', number: '4111111111111111', expMonth: '08', expYear: '27', ccv: '123', isDefault: true },
    { id: 'c2', brand: 'mastercard', holder: 'Nguyễn Văn A', number: '5454545454545454', expMonth: '11', expYear: '26', ccv: '123', isDefault: false },
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
  // ============== SAMPLE DATA ==============

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
      { label: 'Nhà',               value: 'home',    icon: LuHouse },
      { label: 'Văn phòng',         value: 'office',  icon: LuBuilding2 },
      { label: 'Nhà ba mẹ',         value: 'parents', icon: LuUsers },
      { label: 'Ký túc xá',         value: 'dorm',    icon: LuSchool },
      { label: 'Nhận tại cửa hàng', value: 'store',   icon: LuStore },
      { label: 'Khác',              value: 'other',   icon: LuTag },
    ],
  })



  const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };
  

  const loadUser = async () => {
    try {
      const userData = await getMyInfo()
      // setUser(userData)
      setFormData({
        username: userData?.username || '',
        email: userData?.email || '',
        phone: userData?.phone || '',
        dob: userData?.dateOfBirth,
        gender: (userData?.gender).toLowerCase() || 'other',
        fullName: userData?.fullName || '',
      })
      // setPreviewUrl(userData?.avatarUrl ? imgBase + userData.avatarUrl : null)
      

    } catch (error) {
      toaster.create({
        title: 'Lỗi tải thông tin',
        description: error?.message || 'Không thể tải hồ sơ',
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    } finally {
      // setIsLoading(false)
    }
  }


  const loadAddresses = async () => {
    try {
      const data = await getAddresses()
      setAddresses(data)
    } catch {
      toaster.create({ type:'error', description:'Không tải được địa chỉ' })
    } finally {  }
  }

  useEffect(() => {
    loadUser()
    loadAddresses()
    // return () => {
    //   if (selectedFile && previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    // }
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
      toaster.create({ type: 'warning', description: 'Nhập đủ thông tin thẻ.' })
      return
    }
    if (!luhnCheck(d.number)) {
      toaster.create({ type: 'error', title: 'Số thẻ không hợp lệ', description: 'Vui lòng kiểm tra lại.' })
      return
    }
    const mm = parseInt(d.expMonth, 10)
    const yy = parseInt(d.expYear, 10)
    const now = new Date(), curYY = now.getFullYear() % 100, curMM = now.getMonth() + 1
    if (!(mm >= 1 && mm <= 12) || yy < curYY || (yy === curYY && mm < curMM)) {
      toaster.create({ type: 'error', description: 'Thẻ đã hết hạn hoặc tháng/năm không hợp lệ.' })
      return
    }
    const detected = detectBrandFromBIN(d.number)
    const need3 = ['visa','mastercard','jcb'].includes(detected)
    const ccvDigits = String(d.ccv || '').replace(/\D/g, '')
    if (need3 && ccvDigits.length !== 3) {
      toaster.create({ type: 'error', description: 'CCV/CVV phải gồm 3 số.' })
      return
    }

    const id = `c-${Date.now()}`
    let next = [...cards, { ...d, id, brand: detected }]
    if (d.isDefault) next = next.map(c => ({ ...c, isDefault: c.id === id }))

    setCards(next)
    setCardDrafts(s => ({ ...s, [id]: { ...d, id, brand: detected } }))
    setIsAddCardOpen(false)
    resetNewCard()
    toaster.create({ type: 'success', title: 'Đã liên kết thẻ' })
  }
  

  function getLabelMeta(raw) {
    const items = LABEL_OPTIONS_COLLECTION.items
    if (!raw) return items[0]
    // nếu raw đã là value
    const foundByValue = items.find((o) => o.value === raw)
    if (foundByValue) return foundByValue
    // fallback: normalize text cũ
    const t = String(raw).trim().toLowerCase()
    if (['nhà', 'home'].includes(t)) return items[0]
    if (['văn phòng', 'office'].includes(t)) return items[1]
    if (['nhà ba mẹ', 'cha mẹ', 'parents'].includes(t)) return items[2]
    if (['ký túc xá', 'kí túc xá', 'dorm'].includes(t)) return items[3]
    if (['cửa hàng', 'store', 'nhận tại cửa hàng', 'pickup'].includes(t)) return items[4]
    return { ...items[5], label: raw || items[5].label } // giữ icon 'other', label raw
  }


  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })

  // Địa chỉ
  const [editingAddrIds, setEditingAddrIds] = useState(() => new Set()) // id đang edit
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
    toaster.create({ type: 'info', description: 'Ảnh đại diện đã được chọn. Nhấn Save để cập nhật.' })
  }

  async function onSaveProfile() {
    if (!formData.fullName || !formData.username || !formData.email) {
      toaster.create({ type: 'warning', description: 'Hãy nhập đủ Họ tên, Username và Email.' })
      return
    }
    setSaving(true)
    try {
      await new Promise((r) => setTimeout(r, 900))
      setIsEditing(false)
      toaster.create({ type: 'success', title: 'Đã lưu thay đổi' })
    } catch {
      toaster.create({ type: 'error', title: 'Lỗi', description: 'Không thể lưu, thử lại sau.' })
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
      toaster.create({ type: 'warning', description: 'Hãy điền đầy đủ các trường mật khẩu.' })
      return
    }
    if (pw.next !== pw.confirm) {
      toaster.create({ type: 'error', description: 'Mật khẩu xác nhận không khớp.' })
      return
    }
    if (pw.next.length < 8) {
      toaster.create({ type: 'warning', description: 'Mật khẩu mới tối thiểu 8 ký tự.' })
      return
    }
    await new Promise((r) => setTimeout(r, 900))
    setPw({ current: '', next: '', confirm: '' })
    toaster.create({ type: 'success', title: 'Đổi mật khẩu thành công' })
  }

  // --- Address helpers ---
  function startEditAddress(id) {
    setEditingAddrIds((s) => new Set(s).add(id))
    setAddrDrafts((s) => ({ ...s, [id]: { ...addresses.find((a) => a.id === id) } }))
  }

  function formatAddress(a) {
    // Ưu tiên ward/district nếu có; nếu chưa có, chỉ cần line1 + city vẫn OK
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
    toaster.create({ type: 'success', title: 'Đã xoá địa chỉ' })
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
      country: (fd.get('country') || 'Việt Nam').toString().trim(),
      isDefault: fd.get('isDefault') === 'on' || addresses.length === 0,
    }

    if (!created.fullName || !created.phone || !created.line1 || !created.city) {
      toaster.create({ type: 'warning', description: 'Vui lòng nhập đủ Người nhận, SĐT, Địa chỉ, Thành phố.' })
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
    toaster.create({ type: 'success', title: 'Đã thêm địa chỉ' })
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
      country: (fd.get('country') || 'Việt Nam').toString().trim(),
      isDefault: addresses.find(a => a.id === addrId)?.isDefault ?? false, // default set ở action riêng
    }

    if (!next.fullName || !next.phone || !next.line1 || !next.city) {
      toaster.create({ type: 'warning', description: 'Điền đủ thông tin địa chỉ.' })
      return
    }

    updateAddress(addrId, next)

    setAddresses(list => list.map(a => a.id === addrId ? next : a))
    setEditingAddrIds(s => { const n = new Set(s); n.delete(addrId); return n })
    toaster.create({ type: 'success', title: 'Đã lưu địa chỉ' })
  }


  const setDefaultAddress = async (id) => {
    setAddresses((arr) => arr.map((a) => ({ ...a, isDefault: a.id === id })))
    await makeDefaultAddress(id)
    toaster.create({ type: 'success', title: 'Đã đặt làm địa chỉ mặc định' })
  }

  function DefBadge() {
    return (
      <span style={{
        marginLeft: 8, padding:'2px 8px', borderRadius:999,
        background:'#EEF6FF', border:'1px solid #CCE0FF', fontSize:12, color:'#1E5EFF'
      }}>
        Mặc định
      </span>
    )
  }

  // PROFILE: submit 1 lần, không onChange khi gõ
  const handleProfileSubmit = async(e) => {
    if (!isEditing) {
      e.preventDefault();
      return;
    }
    console.log(12312313123)
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    const next = {
      fullName: (fd.get('fullName') || '').toString().trim(),
      username: (fd.get('username') || '').toString().trim() || SAMPLE_USER.username, // vẫn khóa, nhưng để name cho đồng nhất
      email:    (fd.get('email') || '').toString().trim(),
      phone:    (fd.get('phone') || '').toString().trim(),
      bio:      (fd.get('bio') || '').toString(),
      gender:   (fd.get('gender') || formData.gender).toString(),
      dob:      (fd.get('dob') || formData.dob).toString(),
    }

    if (!next.fullName || !next.username || !next.email) {
      toaster.create({ type: 'warning', description: 'Hãy nhập đủ Họ tên, Username và Email.' })
      return
    }

    const tempFormData = {
          ...next,
          gender: formData.gender ? formData.gender.toUpperCase() : "OTHER"
    };
    await updateUserInfo(tempFormData)
    
    setSaving(true)
    Promise.resolve()
      .then(() => new Promise(r => setTimeout(r, 700))) // giả lập API
      .then(() => {
        setFormData(next)        // cập nhật view mode
        setIsEditing(false)
        toaster.create({ type: 'success', title: 'Đã lưu thay đổi' })
      })
      .catch(() => {
        toaster.create({ type: 'error', title: 'Lỗi', description: 'Không thể lưu, thử lại sau.' })
      })
      .finally(() => setSaving(false))
  }

  // PASSWORD: submit 1 lần, không onChange khi gõ
  function handlePasswordSubmit(e) {
    e.preventDefault()
    const form = e.currentTarget // <-- đây là form DOM
    const fd = new FormData(form)

    const current = String(fd.get('current') || '')
    const next    = String(fd.get('next') || '')
    const confirm = String(fd.get('confirm') || '')

    if (!current || !next || !confirm) {
      toaster.create({ type: 'warning', description: 'Hãy điền đầy đủ các trường mật khẩu.' })
      return
    }
    if (next !== confirm) {
      toaster.create({ type: 'error', description: 'Mật khẩu xác nhận không khớp.' })
      return
    }
    if (next.length < 8) {
      toaster.create({ type: 'warning', description: 'Mật khẩu mới tối thiểu 8 ký tự.' })
      return
    }

    Promise.resolve()
      .then(() => new Promise(r => setTimeout(r, 700)))
      .then(() => {
        form.reset() // ✅ JS thuần, không cần (as HTMLFormElement)
        toaster.create({ type: 'success', title: 'Đổi mật khẩu thành công' })
      })
  }



  function getBrandMeta(raw) {
    const items = CARD_BRANDS_COLLECTION.items
    if (!raw) return items[0]
    const found = items.find(b => b.value === raw)
    if (found) return found
    const t = String(raw).trim().toLowerCase()
    // if (['visa'].includes(t)) return items[0]
    // if (['mastercard', 'mc', 'master card'].includes(t)) return items[1]
    // if (['jcb'].includes(t)) return items[2]
    // return items[0]
  }

  function maskCard(number) {
    if (!number) return '•••• •••• •••• ••••'
    const digits = number.replace(/\D/g, '')
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
    // Visa: bắt đầu bằng 4
    if (/^4\d{0,18}$/.test(digits)) return 'visa'
    // Mastercard: 51-55 hoặc 2221–2720
    if (/^(5[1-5]\d{0,14}|222[1-9]\d{0,12}|22[3-9]\d{0,13}|2[3-6]\d{0,14}|27[01]\d{0,13}|2720\d{0,12})$/.test(digits))
      return 'mastercard'
    // JCB: 3528–3589
    if (/^35(2[8-9]|[3-8]\d)\d{0,12}$/.test(digits)) return 'jcb'
    return 'unknown'
  }

  function luhnCheck(digits) {
    if (!digits) return false
    const s = digits.replace(/\D/g, '')
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
    return (sum % 10) === 0 && s.length >= 12 // tối thiểu 12 số để tránh false positive
  }

  function groupCardNumber(digits) {
    const s = (digits || '').replace(/\D/g, '').slice(0, 19) // hard cap
    return s.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
  }

  const CARD_BRANDS_COLLECTION = createListCollection({
    items: [
      { label: 'Thẻ',        icon: LuCreditCard,  color: 'currentColor', value: 'unknown' },
      { label: 'Visa',       value: 'visa',       icon: SiVisa, color: '#1A1F71' },
      { label: 'Mastercard', value: 'mastercard', icon: SiMastercard, color: '#EB001B' },
      { label: 'JCB',        value: 'jcb',        icon: SiJcb, color: '#1F4E79' },
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
      toaster.create({ type: 'warning', description: 'Nhập đủ thông tin thẻ.' })
      return
    }
    // Luhn check
    if (!luhnCheck(d.number)) {
      toaster.create({ type: 'error', title: 'Số thẻ không hợp lệ', description: 'Vui lòng kiểm tra lại số thẻ.' })
      return
    }
    // Expiry check sơ bộ (MM 01..12, YY 00..99 + không quá khứ)
    const mm = parseInt(d.expMonth, 10)
    const yy = parseInt(d.expYear, 10)
    if (!(mm >= 1 && mm <= 12)) {
      toaster.create({ type: 'error', description: 'Tháng hết hạn không hợp lệ.' })
      return
    }
    // kiểm tra quá khứ: so sánh với tháng/năm hiện tại (UTC)
    const now = new Date()
    const curYY = now.getFullYear() % 100
    const curMM = now.getMonth() + 1
    if (yy < curYY || (yy === curYY && mm < curMM)) {
      toaster.create({ type: 'error', description: 'Thẻ đã hết hạn.' })
      return
    }

    // kiểm tra CCV (Visa/Mastercard/JCB: 3 số)
    const brand = detectBrandFromBIN(d.number)
    const ccvDigits = String(d.ccv || '').replace(/\D/g, '')
    const need3 = ['visa','mastercard','jcb'].includes(brand) // 3 số
    if (need3 && ccvDigits.length !== 3) {
      toaster.create({ type:'error', description:'CCV/CVV phải gồm 3 số.' }); return
    }

    setCards(arr => arr.map(c => (c.id === id ? { ...d } : c)))
    setEditingCardIds(s => { const n = new Set(s); n.delete(id); return n })
    toaster.create({ type: 'success', title: 'Đã lưu thẻ' })
  }

  function deleteCard(id) {
    setCards(arr => arr.filter(c => c.id !== id))
    setEditingCardIds(s => { const n = new Set(s); n.delete(id); return n })
    const next = { ...cardDrafts }; delete next[id]; setCardDrafts(next)
    toaster.create({ type: 'success', title: 'Đã xoá thẻ' })
  }

  function setDefaultCard(id) {
    setCards(arr => arr.map(c => ({ ...c, isDefault: c.id === id })))
    toaster.create({ type: 'success', title: 'Đặt thẻ mặc định' })
  }



  const SelectTrigger = () => {
    const select = useSelectContext();
    const items = select.selectedItems;
    const item = items[0];
    return (
      <Select.ValueText placeholder="Select member">
        <HStack>
          <IconButton
            px="2"
            variant=""
            size="sm"
            {...select.getTriggerProps()}
          >
            {select.hasSelectedItems ? <item.icon/> : <LuTag />}
            {select.hasSelectedItems ? items[0].label : 'Chọn'}
          </IconButton>

        </HStack>

      </Select.ValueText>
    );
  };

  return (
    <Box maxW="1100px" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 6, md: 10 }}>
      {/* Header */}
      <Flex align="center" justify="space-between" mb={6} gap={4}>
        <Box>
          <Heading size="2xl" letterSpacing="-0.02em">Hồ sơ của tôi</Heading>
          <Text color="fg.muted">Quản lý thông tin cá nhân, địa chỉ & bảo mật.</Text>
        </Box>
        <Badge size="lg" variant="solid" colorPalette={membershipColor} rounded="full" px={4} py={2}>
          {String(SAMPLE_USER.tier || '').toUpperCase()} MEMBER
        </Badge>
      </Flex>

      <Separator mb={8} />

      {/* Tabs */}
      <Tabs.Root value={tab} onValueChange={(e) => setTab(e.value)}>
        <Tabs.List
          mb={6}
          justifyContent="start"
          border="1px solid"
          borderColor="border"
          rounded="xl"
          p="4px"
          bg="bg.muted"
          wrap="wrap"
          gap="4px"
        >
          <Tabs.Trigger value="profile" px={5} py={3} rounded="lg" _selected={{ bg: 'bg', boxShadow: 'md' }}>
            <Flex align="center" gap={2}><LuUser /> <Text display={{ base: 'none', md: 'block' }}>Thông tin người dùng</Text></Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="password" px={5} py={3} rounded="lg" _selected={{ bg: 'bg', boxShadow: 'md' }}>
            <Flex align="center" gap={2}><LuLock /> <Text display={{ base: 'none', md: 'block' }}>Đổi mật khẩu</Text></Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="addresses" px={5} py={3} rounded="lg" _selected={{ bg: 'bg', boxShadow: 'md' }}>
            <Flex align="center" gap={2}><LuMapPin /> <Text display={{ base: 'none', md: 'block' }}>Địa chỉ</Text></Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="payments" px={5} py={3} rounded="lg" _selected={{ bg: 'bg', boxShadow: 'md' }}>
            <Flex align="center" gap={2}><LuCreditCard /> <Text display={{ base: 'none', md: 'block' }}>Thanh toán</Text></Flex>
          </Tabs.Trigger>
        </Tabs.List>

        {/* Tab: Profile */}
        <Tabs.Content value="profile">
          <form onSubmit={handleProfileSubmit}>
          <Grid templateColumns={{ base: '1fr', md: '320px 1fr' }} gap={8} alignItems="start">
            {/* Avatar */}

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
                          'linear-gradient(var(--chakra-colors-bg), var(--chakra-colors-bg)) padding-box,' +
                          'linear-gradient(135deg, #a78bfa, #60a5fa, #34d399) border-box',
                      }}
                    >
                      <Avatar.Fallback name={formData.fullName || 'U'} />
                      {previewUrl && <Avatar.Image src={previewUrl} alt="avatar" />}
                    </Avatar.Root>
                  </Box>

                  {/* Hover overlay */}
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
                    <IconButton aria-label="Edit avatar" onClick={openAvatarPicker} size="lg" rounded="full" variant="solid"><LuCamera /></IconButton>
                  </Flex>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                </Box>

                <Flex mt={4} gap={3} wrap="wrap">
                  {!isEditing ? (
                    <Button  
                      // onClick={() => setIsEditing(true)}
                      onClick={(e) => {
                        e.preventDefault(); // an toàn
                        setTimeout(() => setIsEditing(true), 0); // hoặc requestAnimationFrame
                      }}
                    ><LuPencil /> Edit profile</Button>
                  ) : (
                    <>
                      <Button type="submit" loading={saving} loadingText="Đang lưu..."><LuSave /> Save</Button>
                      <Button variant="outline"  onClick={onCancelEdit}><LuX /> Cancel</Button>
                    </>
                  )}
                </Flex>
              </GridItem>

              {/* Form fields (no address here) */}
              <GridItem>
                <Box p={{ base: 4, md: 6 }} rounded="2xl" border="1px solid" borderColor="border" bg="bg" shadow="sm">
                    <Stack gap={5}>
                      <Flex align="center" justify="space-between">
                        <Heading size="lg">Thông tin cá nhân</Heading>
                        <Text color="fg.muted">ID: <b>{SAMPLE_USER.id}</b></Text>
                      </Flex>

                      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={5}>
                        <Field.Root name="fullName" required isReadOnlyWhenEdit value={formData.fullName} isEditing={isEditing}>
                          <Field.Label><Flex align="center" gap={2}><LuUser /> Họ và tên</Flex></Field.Label>
                          <Input name="fullName" placeholder="Nguyễn Văn A" defaultValue={formData.fullName} readOnly={!isEditing} />
                        </Field.Root>

                        <Field.Root name="username" required isReadOnlyWhenEdit value={formData.username} isEditing={isEditing}>
                          <Field.Label><Flex align="center" gap={2}><LuHash /> Username</Flex></Field.Label>
                          <Input name="username" placeholder="username" defaultValue={formData.username} disabled />
                          <input type="hidden" name="username" value={formData.username} />
                        </Field.Root>

                        <Field.Root name="email" isReadOnlyWhenEdit value={formData.email} isEditing={isEditing}>
                          <Field.Label><Flex align="center" gap={2}><LuMail /> Email</Flex></Field.Label>
                          <Input type="email" name="email" placeholder="email@domain.com" defaultValue={formData.email} readOnly={!isEditing}/>
                        </Field.Root>

                        <Field.Root name="phone" isReadOnlyWhenEdit value={formData.phone} isEditing={isEditing}>
                          <Field.Label><Flex align="center" gap={2}><LuPhone /> Số điện thoại</Flex></Field.Label>
                          <Input name="phone" placeholder="090xxxxxxx" defaultValue={formData.phone} readOnly={!isEditing}/>
                        </Field.Root>
                      </Grid>

                      {/* Gender + DOB */}
                      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={5}>
                        <Field.Root name="gender" isReadOnlyWhenEdit isEditing={isEditing}>
                          <Field.Label>Giới tính</Field.Label>

                          <RadioGroup.Root value={formData.gender} readOnly={!isEditing}>
                            <HStack gap="6" wrap="wrap">
                              <RadioGroup.Item value="male">
                                {/* đưa radio vào form: thêm name cho hidden input */}
                                <RadioGroup.ItemHiddenInput name="gender" />
                                <RadioGroup.ItemIndicator />
                                <RadioGroup.ItemText>Nam</RadioGroup.ItemText>
                              </RadioGroup.Item>

                              <RadioGroup.Item value="female">
                                <RadioGroup.ItemHiddenInput name="gender" />
                                <RadioGroup.ItemIndicator />
                                <RadioGroup.ItemText>Nữ</RadioGroup.ItemText>
                              </RadioGroup.Item>

                              <RadioGroup.Item value="other">
                                <RadioGroup.ItemHiddenInput name="gender" />
                                <RadioGroup.ItemIndicator />
                                <RadioGroup.ItemText>Khác</RadioGroup.ItemText>
                              </RadioGroup.Item>
                            </HStack>
                          </RadioGroup.Root>
                        </Field.Root>

                        <Field.Root name="dob" isReadOnlyWhenEdit value={formData.dob} isEditing={isEditing}>
                          <Field.Label>Ngày sinh</Field.Label>
                          <Input type="date" name="dob" defaultValue={formData.dob || ''} readOnly={!isEditing}/>
                        </Field.Root>
                      </Grid>

                      <Separator />

                      <Field.Root name="bio" isReadOnlyWhenEdit value={formData.bio} isEditing={isEditing}>
                        <Field.Label>Giới thiệu</Field.Label>
                        <Textarea name="bio" placeholder="Một chút về bạn…" rows={4} defaultValue={formData.bio} readOnly={!isEditing}/>
                      </Field.Root>
                    </Stack>
                </Box>
              </GridItem>
            
          </Grid>

          </form>
        </Tabs.Content>

        {/* Tab: Change password */}
        <Tabs.Content value="password">
          <Box p={{ base: 4, md: 6 }} rounded="2xl" border="1px solid" borderColor="border" bg="bg" shadow="sm">
            <Heading size="lg" mb={4}>Đổi mật khẩu</Heading>
            <Text color="fg.muted" mb={6}>
              Mật khẩu mới tối thiểu 8 ký tự, gồm chữ hoa/thường, số hoặc ký tự đặc biệt.
            </Text>

            <form onSubmit={handlePasswordSubmit}>
              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr 1fr' }} gap={5}>
                <Field.Root name="current" required>
                  <Field.Label>Mật khẩu hiện tại</Field.Label>
                  <Input type="password" name="current" placeholder="••••••••" />
                </Field.Root>
                <Field.Root name="next" required>
                  <Field.Label>Mật khẩu mới</Field.Label>
                  <Input type="password" name="next" placeholder="••••••••" />
                </Field.Root>
                <Field.Root name="confirm" required>
                  <Field.Label>Xác nhận mật khẩu</Field.Label>
                  <Input type="password" name="confirm" placeholder="••••••••" />
                </Field.Root>
              </Grid>

              <Flex mt={6} gap={3}>
                <Button type="submit">Cập nhật mật khẩu</Button>
                <Button type="reset" variant="outline">Xóa nhập liệu</Button>
              </Flex>
            </form>
          </Box>
        </Tabs.Content>

        {/* Tab: Addresses (REPLACE THIS WHOLE BLOCK) */}
        <Tabs.Content value="addresses">
          <Flex align="center" justify="space-between" mb={4}>
            <Heading size="lg">Sổ địa chỉ</Heading>

            {/* Add Address Dialog (form + onSubmit) */}
            <Dialog.Root open={isAddOpen} onOpenChange={(e) => setIsAddOpen(e.open)}>
              <Dialog.Trigger asChild>
                <Button  onClick={() => setIsAddOpen(true)}>
                  <LuPlus /> Thêm địa chỉ
                </Button>
              </Dialog.Trigger>

              <Dialog.Backdrop />
              <Dialog.Positioner>
                <Dialog.Content maxW="720px" rounded="2xl">
                  <Dialog.CloseTrigger />
                  <Dialog.Header>
                    <Dialog.Title>Thêm địa chỉ mới</Dialog.Title>
                  </Dialog.Header>

                  {/* ⬇️ Uncontrolled form — submit 1 lần */}
                  <form onSubmit={handleCreateAddressSubmit}>
                    <Dialog.Body>
                      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                        {/* Nhãn */}
                        <Field.Root name="label">
                          <Field.Label>Nhãn</Field.Label>
                          <Select.Root defaultValue={['home']} collection={LABEL_OPTIONS_COLLECTION} size="sm">
                            <Select.HiddenSelect name="label" />
                            <Select.Control>
                              
                              <Select.Trigger>
                                <SelectTrigger />
                              </Select.Trigger>
                              <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                              
                            </Select.Control>
                            {/* <Portal> */}
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
                            {/* </Portal> */}
                          </Select.Root>
                        </Field.Root>

                        <Field.Root name="fullName">
                          <Field.Label>Người nhận</Field.Label>
                          <Input name="fullName" placeholder="Họ tên người nhận" />
                        </Field.Root>

                        <Field.Root name="phone">
                          <Field.Label>Số điện thoại</Field.Label>
                          <Input name="phone" inputMode="tel" placeholder="090xxxxxxx" />
                        </Field.Root>

                        <Field.Root name="country">
                          <Field.Label>Quốc gia</Field.Label>
                          <Input name="country" defaultValue="Việt Nam" />
                        </Field.Root>

                        <Field.Root name="line1" gridColumn={{ md: 'span 2' }}>
                          <Field.Label>Địa chỉ</Field.Label>
                          <Input name="line1" placeholder="Số nhà, đường" />
                        </Field.Root>

                        <Field.Root name="ward">
                          <Field.Label>Phường/Xã</Field.Label>
                          <Input name="ward" placeholder="Phường Bến Thành" />
                        </Field.Root>

                        <Field.Root name="district">
                          <Field.Label>Quận/Huyện</Field.Label>
                          <Input name="district" placeholder="Quận 1" />
                        </Field.Root>

                        <Field.Root name="city">
                          <Field.Label>Tỉnh/Thành phố</Field.Label>
                          <Input name="city" placeholder="TP.HCM" />
                        </Field.Root>

                        <Box >
                          <CheckboxCard.Root defaultChecked={addresses.length === 0} mt={5}>
                            <CheckboxCard.HiddenInput name="isDefault" />
                            <CheckboxCard.Control>
                              <CheckboxCard.Label>Đặt làm địa chỉ mặc định</CheckboxCard.Label>
                              <CheckboxCard.Indicator />
                            </CheckboxCard.Control>
                          </CheckboxCard.Root>
                        </Box>
                      </Grid>
                    </Dialog.Body>

                    <Dialog.Footer>
                      <Flex gap={3} justify="flex-end" w="full">
                        <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                          Hủy
                        </Button>
                        <Button type="submit">
                          Lưu địa chỉ
                        </Button>
                      </Flex>
                    </Dialog.Footer>
                  </form>
                </Dialog.Content>
              </Dialog.Positioner>
            </Dialog.Root>
          </Flex>

          {/* List addresses */}
          <Stack gap={5}>
            {addresses.map((addr) => {
              const isEditingCard = editingAddrIds.has(addr.id)
              const meta = getLabelMeta(addr.label)
              const LabelIcon = meta.icon

              return (
                <Card.Root
                  key={addr.id}
                  border="1px solid"
                  borderColor="border"
                  rounded="2xl"
                  shadow="sm"
                >
                  <Card.Body p={{ base: 4, md: 6 }}>
                    {/* Header */}
                    <Flex align="center" justify="space-between" mb={3} gap={3} wrap="wrap">
                      {!isEditingCard ? (
                        <Flex align="center" gap={3} wrap="wrap">
                          {/* Chip label */}
                          <Flex
                            align="center"
                            gap={1.5}
                            px="2.5"
                            py="0.5"
                            rounded="full"
                            border="1px solid"
                            borderColor="border"
                            fontSize="sm"
                          >
                            <LabelIcon />
                            <Text>{meta.label}</Text>
                          </Flex>
                          {addr.isDefault && <DefBadge />}
                        </Flex>
                      ) : (
                        <Heading size="md">Chỉnh sửa địa chỉ</Heading>
                      )}

                      {/* Actions (icon-only) */}
                      <Flex gap={1}>
                        {!isEditingCard ? (
                          <>
                            <IconButton
                              aria-label="Đặt mặc định"
                              size="sm"
                              variant="ghost"
                              onClick={() => setDefaultAddress(addr.id)}
                              title="Đặt làm mặc định"
                            >
                              <LuStar
                                style={{
                                  opacity: addr.isDefault ? 1 : 0.45,
                                  ...(addr.isDefault ? { fill: 'currentColor' } : {}),
                                }}
                              />
                            </IconButton>
                            <IconButton
                              aria-label="Chỉnh sửa"
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditAddress(addr.id)}
                              title="Chỉnh sửa"
                            >
                              <LuPencil />
                            </IconButton>
                            <IconButton
                              aria-label="Xoá địa chỉ"
                              size="sm"
                              variant="ghost"
                              colorPalette="red"
                              onClick={() => deleteAddress(addr.id)}
                              title="Xoá địa chỉ"
                            >
                              <LuTrash2 />
                            </IconButton>
                          </>
                        ) : (
                          <>
                            {/* Nút nằm trong form edit bên dưới (type=submit), ở đây chỉ để hủy nhanh */}
                            <Button
                              size="sm"
                              variant="outline"
                              leftIcon={<LuX />}
                              onClick={() => cancelEditAddress(addr.id)}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                      </Flex>
                    </Flex>

                    {/* BODY */}
                    {!isEditingCard ? (
                      // VIEW MODE: 2 dòng gọn
                      <Box>
                        <Flex align="center" gap={2} wrap="wrap" mb={1}>
                          <Text fontWeight="semibold">
                            {(addr.fullName || '—')}{addr.phone ? ` • ${addr.phone}` : ''}
                          </Text>
                        </Flex>
                        <Text color="fg.muted">{formatAddress(addr) || '—'}</Text>
                      </Box>
                    ) : (
                      // EDIT MODE: Uncontrolled form + onSubmit
                      <form onSubmit={(e) => handleEditAddressSubmit(e, addr.id)}>
                        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr 1fr' }} gap={4}>
                          <Field.Root name={`label-${addr.id}`} isEditing>
                            <Field.Label>Nhãn</Field.Label>
                            <Select.Root
                              defaultValue={[getLabelMeta(addr.label).value]}
                              collection={LABEL_OPTIONS_COLLECTION}
                              size="sm"
                            >
                              <Select.HiddenSelect name="label" />
                              <Select.Control>
                                
                                <Select.Trigger>
                                  <SelectTrigger />
                                </Select.Trigger>
                                <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                                
                              </Select.Control>
                              <Portal>
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
                              </Portal>
                            </Select.Root>
                          </Field.Root>

                          <Field.Root name={`fullName-${addr.id}`} isEditing>
                            <Field.Label>Người nhận</Field.Label>
                            <Input name="fullName" defaultValue={addr.fullName} placeholder="Họ tên người nhận" />
                          </Field.Root>

                          <Field.Root name={`phone-${addr.id}`} isEditing>
                            <Field.Label>Số điện thoại</Field.Label>
                            <Input name="phone" defaultValue={addr.phone} placeholder="090xxxxxxx" />
                          </Field.Root>
                        </Grid>

                        <Grid templateColumns={{ base: '1fr', md: '1fr' }} gap={4} mt={4}>
                          <Field.Root name={`line1-${addr.id}`} isEditing>
                            <Field.Label>Địa chỉ</Field.Label>
                            <Input name="line1" defaultValue={addr.line1} placeholder="Số nhà, đường, phường/xã" />
                          </Field.Root>
                        </Grid>

                        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr 1fr 1fr' }} gap={4} mt={4}>
                          <Field.Root name={`ward-${addr.id}`} isEditing>
                            <Field.Label>Phường/Xã</Field.Label>
                            <Input name="ward" defaultValue={addr.ward} placeholder="Phường Bến Thành" />
                          </Field.Root>

                          <Field.Root name={`district-${addr.id}`} isEditing>
                            <Field.Label>Quận/Huyện</Field.Label>
                            <Input name="district" defaultValue={addr.district} placeholder="Quận 1" />
                          </Field.Root>

                          <Field.Root name={`city-${addr.id}`} isEditing>
                            <Field.Label>Thành phố</Field.Label>
                            <Input name="city" defaultValue={addr.city} placeholder="Hà Nội" />
                          </Field.Root>

                          <Field.Root name={`country-${addr.id}`} isEditing>
                            <Field.Label>Quốc gia</Field.Label>
                            <Input name="country" defaultValue={addr.country || 'Việt Nam'} placeholder="Việt Nam" />
                          </Field.Root>
                        </Grid>

                        <Flex mt={4} gap={2}>
                          <Button type="submit" size="sm" leftIcon={<LuSave />}>Save</Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            leftIcon={<LuX />}
                            onClick={() => cancelEditAddress(addr.id)}
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



        <Tabs.Content value="payments">
          <Flex align="center" justify="space-between" mb={4}>
            <Heading size="lg">Phương thức thanh toán</Heading>
              <Dialog.Root open={isAddCardOpen} onOpenChange={(e) => setIsAddCardOpen(e.open)}>
                <Dialog.Trigger asChild>
                  <Button onClick={() => setIsAddCardOpen(true)}><LuPlus /> Liên kết thẻ</Button>
                </Dialog.Trigger>

                <Dialog.Backdrop />
                <Dialog.Positioner>
                  <Dialog.Content maxW="720px" rounded="2xl">
                    <Dialog.CloseTrigger />
                    <Dialog.Header>
                      <Dialog.Title>Liên kết thẻ mới</Dialog.Title>
                    </Dialog.Header>

                    <Dialog.Body>
                      <Grid templateColumns={{ base: '1fr', md: '1fr 2fr' }} gap={4}>
                        {/* Chủ thẻ */}
                        <Field.Root name="holder-new">
                          <Field.Label>Tên chủ thẻ</Field.Label>
                          <Input
                            value={newCard.holder}
                            onChange={(e) => setNewCard(s => ({ ...s, holder: e.target.value }))}
                            placeholder="NGUYEN VAN A"
                          />
                        </Field.Root>

                        {/* Số thẻ + logo brand trong input */}
                        <Field.Root name="number-new">
                          <Field.Label>Số thẻ</Field.Label>
                          <Box position="relative">
                            <Box position="absolute" left="3" top="50%" transform="translateY(-50%)" pointerEvents="none">
                              {(() => {
                                const meta = getBrandMeta(newCard.brand)
                                const Icon = meta.icon
                                return <Icon style={{ color: meta.color }} />
                              })()}
                            </Box>
                            <Input
                              pl="10"
                              inputMode="numeric"
                              value={groupCardNumber(newCard.number)}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, '').slice(0, 19)
                                const brand = detectBrandFromBIN(raw)
                                setNewCard(s => ({ ...s, number: raw, brand }))
                              }}
                              placeholder="4111 1111 1111 1111"
                            />
                          </Box>
                          {newCard.number ? (
                            luhnCheck(newCard.number) ? (
                              <Field.HelperText color="green.500">Số thẻ hợp lệ (Luhn)</Field.HelperText>
                            ) : (
                              <Field.ErrorText>Số thẻ chưa hợp lệ (Luhn)</Field.ErrorText>
                            )
                          ) : null}
                        </Field.Root>
                      </Grid>

                      <Separator my={4} />

                      <Grid templateColumns={{ base: '1fr', md: '2fr 1fr 1fr 1fr' }} gap={4}>
                        <Field.Root name="expMonth-new">
                          <Field.Label>Tháng (MM)</Field.Label>
                          <Input
                            inputMode="numeric"
                            maxLength={2}
                            value={newCard.expMonth}
                            onChange={(e) => setNewCard(s => ({ ...s, expMonth: e.target.value.replace(/\D/g, '').slice(0,2) }))}
                            placeholder="08"
                          />
                        </Field.Root>

                        <Field.Root name="expYear-new">
                          <Field.Label>Năm (YY)</Field.Label>
                          <Input
                            inputMode="numeric"
                            maxLength={2}
                            value={newCard.expYear}
                            onChange={(e) => setNewCard(s => ({ ...s, expYear: e.target.value.replace(/\D/g, '').slice(0,2) }))}
                            placeholder="27"
                          />
                        </Field.Root>

                        <Field.Root name="ccv-new">
                          <Field.Label>CCV / CVV</Field.Label>
                          <Input
                            inputMode="numeric"
                            maxLength={4}
                            value={newCard.ccv}
                            onChange={(e) => setNewCard(s => ({ ...s, ccv: e.target.value.replace(/\D/g, '').slice(0,4) }))}
                            placeholder="123"
                          />
                        </Field.Root>

                        {/* Đặt mặc định */}
                        <Field.Root name="default-new">
                          <Field.Label>&nbsp;</Field.Label>
                          <Button
                            variant={newCard.isDefault ? 'solid' : 'outline'}
                            onClick={() => setNewCard(s => ({ ...s, isDefault: !s.isDefault }))}
                            leftIcon={<LuStar style={{ opacity: newCard.isDefault ? 1 : 0.5, ...(newCard.isDefault ? { fill:'currentColor' } : {}) }} />}
                          >
                            {newCard.isDefault ? 'Mặc định' : 'Đặt mặc định'}
                          </Button>
                        </Field.Root>
                      </Grid>
                    </Dialog.Body>

                    <Dialog.Footer>
                      <Flex gap={3} justify="flex-end" w="full">
                        <Button variant="outline" onClick={() => { setIsAddCardOpen(false); resetNewCard() }}>Hủy</Button>
                        <Button onClick={handleCreateCard}>Liên kết</Button>
                      </Flex>
                    </Dialog.Footer>
                  </Dialog.Content>
                </Dialog.Positioner>
              </Dialog.Root>

          </Flex>

          <Stack gap={5}>
            {cards.map((card) => {
              const isEditing = editingCardIds.has(card.id)
              const draft = cardDrafts[card.id] || card
              const viewMeta = getBrandMeta(card.brand)

              return (
                <Card.Root key={card.id} border="1px solid" borderColor="border" rounded="2xl" shadow="sm">
                  <Card.Body p={{ base: 4, md: 6 }}>
                    <Flex align="center" justify="space-between" mb={3} gap={3} wrap="wrap">
                      {!isEditing ? (
                        <Flex align="center" gap={3} wrap="wrap">
                          {/* Chip brand + số thẻ mask + default */}
                          <Flex align="center" gap={1.5} px="2.5" py="0.5" rounded="full" border="1px solid" borderColor="border" fontSize="sm">
                            {React.createElement(viewMeta.icon, { style:{ color: viewMeta.color } })}
                            <Text>{viewMeta.label}</Text>
                          </Flex>
                          <Text fontWeight="semibold">{maskCard(card.number)}</Text>
                          {card.isDefault && (
                            <DefBadge/>
                          )}
                        </Flex>
                      ) : (
                        <Heading size="md">Chỉnh sửa thẻ</Heading>
                      )}

                      <Flex gap={1}>
                        {!isEditing ? (
                          <>
                            <IconButton aria-label="Đặt mặc định" size="sm" variant="ghost" onClick={() => setDefaultCard(card.id)}>
                            <LuStar style={{ opacity: card.isDefault ? 1 : 0.45, ...(card.isDefault?{ fill:'currentColor' }:{}) }} /></IconButton>
                            <IconButton aria-label="Chỉnh sửa" size="sm" variant="ghost" onClick={() => startEditCard(card.id)}><LuPencil /></IconButton>
                            <IconButton aria-label="Xoá thẻ" size="sm" variant="ghost" colorPalette="red" onClick={() => deleteCard(card.id)}><LuTrash2 /></IconButton>
                          </>
                        ) : (
                          <>
                            <Button size="sm" onClick={() => saveCard(card.id)}>Save</Button>
                            <Button size="sm" variant="outline" onClick={() => cancelEditCard(card.id)}>Cancel</Button>
                          </>
                        )}
                      </Flex>
                    </Flex>

                    {!isEditing ? (
                      <Text color="fg.muted">{card.holder || '—'} • {formatExpiry(card.expMonth, card.expYear)}</Text>
                    ) : (
                      <>
                        <Grid templateColumns={{ base: '1fr', md: '1fr 2fr' }} gap={4}>
                          <Field.Root name={`holder-${card.id}`} isEditing value={draft.holder}>
                            <Field.Label>Tên chủ thẻ</Field.Label>
                            <Input
                              value={draft.holder || ''}
                              onChange={(e) => changeCardDraft(card.id, 'holder', e.target.value)}
                              placeholder="NGUYEN VAN A"
                            />
                          </Field.Root>

                          {/* Số thẻ: icon brand ngay trong input */}
                          <Field.Root name={`number-${card.id}`} isEditing value={draft.number}>
                            <Field.Label>Số thẻ</Field.Label>
                            <Box position="relative">
                              {/* Icon bên trái trong input (tự nhận diện) */}
                              <Box position="absolute" left="3" top="50%" transform="translateY(-50%)" pointerEvents="none">
                                {(() => {
                                  const meta = getBrandMeta(draft.brand)
                                  const Icon = meta.icon
                                  return <Icon style={{ color: meta.color }} />
                                })()}
                              </Box>
                              <Input
                                pl="10"
                                inputMode="numeric"
                                value={groupCardNumber(draft.number)}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/\D/g, '').slice(0, 19)
                                  changeCardDraft(card.id, 'number', raw)
                                  const detected = detectBrandFromBIN(raw)
                                  if (detected !== draft.brand) changeCardDraft(card.id, 'brand', detected)
                                }}
                                placeholder="4111 1111 1111 1111"
                              />
                            </Box>
                            {/* Luhn helper */}
                            {draft.number ? (
                              luhnCheck(draft.number) ? (
                                <Field.HelperText color="green.500">Số thẻ hợp lệ (Luhn)</Field.HelperText>
                              ) : (
                                <Field.ErrorText>Số thẻ chưa hợp lệ (Luhn)</Field.ErrorText>
                              )
                            ) : null}
                          </Field.Root>


                        </Grid>

                        <Separator my={4} />

                        <Grid templateColumns={{ base: '1fr', md: '2fr 1fr 1fr 1fr' }} gap={4}>

                          <Field.Root name={`expMonth-${card.id}`} isEditing value={draft.expMonth}>
                            <Field.Label>Tháng (MM)</Field.Label>
                            <Input
                              inputMode="numeric"
                              maxLength={2}
                              value={draft.expMonth || ''}
                              onChange={(e) => changeCardDraft(card.id, 'expMonth', e.target.value.replace(/\D/g, '').slice(0, 2))}
                              placeholder="08"
                            />
                          </Field.Root>

                          <Field.Root name={`expYear-${card.id}`} isEditing value={draft.expYear}>
                            <Field.Label>Năm (YY)</Field.Label>
                            <Input
                              inputMode="numeric"
                              maxLength={2}
                              value={draft.expYear || ''}
                              onChange={(e) => changeCardDraft(card.id, 'expYear', e.target.value.replace(/\D/g, '').slice(0, 2))}
                              placeholder="27"
                            />
                          </Field.Root>

                          {/* CCV/CVV */}
                          <Field.Root name={`ccv-${card.id}`} isEditing value={draft.ccv}>
                            <Field.Label>CCV / CVV</Field.Label>
                            <Input
                              inputMode="numeric"
                              maxLength={4}           // hỗ trợ 3 (Visa/MC/JCB) và 4 (nếu mở rộng Amex)
                              value={draft.ccv || ''}
                              onChange={(e) =>
                                changeCardDraft(card.id, 'ccv', e.target.value.replace(/\D/g, '').slice(0, 4))
                              }
                              placeholder="123"
                            />
                            {/* <Field.HelperText>Ký tự bảo mật mặt sau thẻ (Visa/Mastercard/JCB: 3 số)</Field.HelperText> */}
                          </Field.Root>
                        </Grid>
                      </>

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
