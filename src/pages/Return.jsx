import { useMemo } from 'react'
import { useSearchParams, Link as RouterLink } from 'react-router-dom'
import { Box, Text, Heading, Button } from '@chakra-ui/react'
import { Flex } from '@chakra-ui/react/flex'
import { Grid } from '@chakra-ui/react/grid'
import { toaster } from '../components/ui/toaster'
import { FiCheckCircle, FiXCircle, FiExternalLink, FiCopy, FiRotateCcw } from 'react-icons/fi'

const glass = {
  bg: 'white',
  border: '1px solid',
  borderColor: 'gray.200',
  borderRadius: '16px',
  p: '16px',
  boxShadow: '0 10px 30px rgba(2,32,71,0.06)'
}

function strToBool(v) {
  if (typeof v !== 'string') return false
  return ['1', 'true', 'yes'].includes(v.toLowerCase())
}

export default function ReturnPage() {
  const [params] = useSearchParams()

  // Map theo URL mẫu bạn đưa:
  const orderId = params.get('orderCode') || ''          // mã đơn hàng của bạn
  const gatewayTxnId = params.get('id') || ''            // mã giao dịch từ gateway
  const status = (params.get('status') || '').toUpperCase() // PAID / CANCELED / FAILED
  const code = params.get('code') || ''                  // 00 thường là thành công
  const canceled = strToBool(params.get('cancel'))       // user cancel ở gateway?
  const message = params.get('message') || ''            // nếu gateway có trả

  // Tiêu chí thành công: không bị cancel, và (status === 'PAID' hoặc code === '00')
  const success = useMemo(() => {
    if (canceled) return false
    if (status === 'PAID') return true
    if (code === '00') return true
    return false
  }, [canceled, status, code])

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
      <Heading size="lg" mb="20px">Kết quả thanh toán</Heading>

      <Grid templateColumns={{ base: '1fr', lg: '1.1fr 0.9fr' }} gap="20px">
        <Box {...glass}>
          {success ? (
            <Flex align="center" gap="12px" mb="12px">
              <FiCheckCircle size={28} color="green" />
              <Heading size="md" color="green.600">Thanh toán thành công</Heading>
            </Flex>
          ) : (
            <Flex align="center" gap="12px" mb="12px">
              <FiXCircle size={28} color="crimson" />
              <Heading size="md" color="red.600">Giao dịch không hoàn tất</Heading>
            </Flex>
          )}

          <Text color="gray.700" mb="10px">
            {message ||
              (success
                ? 'Cảm ơn bạn! Đơn hàng đã được ghi nhận.'
                : canceled
                  ? 'Bạn đã huỷ thanh toán tại cổng.'
                  : status
                    ? `Trạng thái: ${status}.`
                    : code
                      ? `Mã kết quả: ${code}.`
                      : 'Không rõ trạng thái từ cổng thanh toán.')
            }
          </Text>

          <Box mt="12px" borderTop="1px solid" borderColor="gray.100" pt="12px">
            <Row
              label="Mã đơn hàng"
              value={
                <Flex align="center" gap="8px">
                  <Text fontWeight="medium">{orderId || '—'}</Text>
                  {!!orderId && (
                    <Button size="xs" variant="outline" onClick={copyOrderId} leftIcon={<FiCopy />}>
                      Sao chép
                    </Button>
                  )}
                </Flex>
              }
            />
            <Row label="Mã giao dịch (gateway)" value={gatewayTxnId || '—'} />
            <Row label="Trạng thái" value={success ? 'PAID' : (canceled ? 'CANCELED' : (status || '—'))} />
            <Row label="Mã code" value={code || '—'} />
          </Box>

          <Flex mt="16px" gap="10px" wrap="wrap">
            {orderId && (
              <Button as={RouterLink} to={`/orders`} variant={success ? 'solid' : 'outline'}
                      colorScheme={success ? 'green' : 'gray'} leftIcon={<FiExternalLink />}>
                Xem đơn hàng
              </Button>
            )}
            {success ? (
              <Button as={RouterLink} to="/products" variant="outline">Tiếp tục mua sắm</Button>
            ) : (
              <>
                <Button as={RouterLink} to="/checkout" colorScheme="orange" leftIcon={<FiRotateCcw />}>
                  Thanh toán lại
                </Button>
                <Button as={RouterLink} to="/" variant="ghost">Về trang chủ</Button>
              </>
            )}
          </Flex>

          {/* Gợi ý xác thực server-side:
             - Gửi toàn bộ query lên backend để verify chữ ký/hmac.
             - Backend cập nhật trạng thái order, sau đó client gọi GET /orders/:id để hiển thị chính xác.
          */}
        </Box>

        <Box {...glass}>
          <Heading size="sm" mb="10px" color="gray.700">Lưu ý</Heading>
          <Text color="gray.700" mb="6px">• Hãy chụp màn hình trang này nếu cần đối soát.</Text>
          <Text color="gray.700" mb="6px">• Nếu tiền đã trừ nhưng trạng thái chưa PAID, liên hệ CSKH.</Text>
          <Text color="gray.700">• Kiểm tra email/SMS xác nhận đơn hàng.</Text>
        </Box>
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
