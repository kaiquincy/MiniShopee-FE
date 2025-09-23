import { useSearchParams, Link as RouterLink } from 'react-router-dom'
import { useMemo } from 'react'

// Chakra v3
import { Box, Text, Heading, Button } from '@chakra-ui/react'
import { Flex } from '@chakra-ui/react/flex'
import { Grid } from '@chakra-ui/react/grid'

// Toaster
import { toaster } from '../components/ui/toaster'

// Icons
import { FiXCircle, FiRotateCcw, FiExternalLink, FiCopy } from 'react-icons/fi'

// (Optional) bạn có thể gọi lại placeOrder(method) nếu muốn cho “thanh toán lại” ngay tại đây

const glass = {
  bg: 'white',
  border: '1px solid',
  borderColor: 'gray.200',
  borderRadius: '16px',
  p: '16px',
  boxShadow: '0 10px 30px rgba(2,32,71,0.06)'
}

const currency = (n = 0) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
    .format(Number(n) || 0)

export default function CancelPage() {
  const [params] = useSearchParams()
  const orderId = params.get('orderId') || params.get('order_id') || ''
  const amount = params.get('amount') || params.get('total') || ''
  const reason = params.get('reason') || params.get('message') || 'Bạn đã huỷ thanh toán.'
  const amountText = useMemo(() => (amount ? currency(amount) : '—'), [amount])

  const copyOrderId = async () => {
    try {
      if (!orderId) return
      await navigator.clipboard.writeText(orderId)
      toaster.create({ type: 'success', description: 'Đã sao chép mã đơn hàng' })
    } catch {
      toaster.create({ type: 'warning', description: 'Không thể sao chép' })
    }
  }

  return (
    <Box>
      <Heading size="lg" mb="20px">Thanh toán đã bị huỷ</Heading>

      <Grid templateColumns={{ base: '1fr', lg: '1.1fr 0.9fr' }} gap="20px">
        <Box {...glass}>
          <Flex align="center" gap="12px" mb="12px">
            <FiXCircle size={28} color="crimson" />
            <Heading size="md" color="red.600">Giao dịch không hoàn tất</Heading>
          </Flex>

          <Text color="gray.700" mb="10px">{reason}</Text>

          <Box mt="12px" borderTop="1px solid" borderColor="gray.100" pt="12px">
            <Row label="Mã đơn hàng" value={
              <Flex align="center" gap="8px">
                <Text fontWeight="medium">{orderId || '—'}</Text>
                {!!orderId && (
                  <Button size="xs" variant="outline" onClick={copyOrderId} leftIcon={<FiCopy />}>
                    Sao chép
                  </Button>
                )}
              </Flex>
            }/>
            <Row label="Số tiền" value={amountText} />
          </Box>

          <Flex mt="16px" gap="10px" wrap="wrap">
            {orderId && (
              <Button as={RouterLink} to={`/orders/${orderId}`} variant="outline" leftIcon={<FiExternalLink />}>
                Xem đơn hàng
              </Button>
            )}
            <Button as={RouterLink} to="/checkout" colorScheme="orange" leftIcon={<FiRotateCcw />}>
              Thanh toán lại
            </Button>
            <Button as={RouterLink} to="/" variant="ghost">Tiếp tục mua sắm</Button>
          </Flex>
        </Box>

        <HelpCard />
      </Grid>
    </Box>
  )
}

function Row({ label, value }) {
  return (
    <Flex justify="space-between" align="center" py="6px" gap="16px">
      <Text color="gray.600">{label}</Text>
      {typeof value === 'string' || typeof value === 'number'
        ? <Text fontWeight="medium">{value}</Text>
        : value}
    </Flex>
  )
}

function HelpCard() {
  return (
    <Box {...glass}>
      <Heading size="sm" mb="10px" color="gray.700">Gặp sự cố khi thanh toán?</Heading>
      <Text color="gray.700" mb="6px">• Kiểm tra hạn mức / số dư hoặc thử thẻ khác.</Text>
      <Text color="gray.700" mb="6px">• Thử lại với phương thức khác (VD: PayOS / COD).</Text>
      <Text color="gray.700">• Nếu tiền đã trừ nhưng đơn chưa tạo, liên hệ CSKH kèm mã đơn hàng.</Text>
    </Box>
  )
}
