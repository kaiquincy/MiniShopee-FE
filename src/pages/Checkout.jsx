import { Button, Heading, Stack } from '@chakra-ui/react'
import { useState } from 'react'
import { placeOrder } from '../api/orders'
import { initiatePayment } from '../api/payment'
import { toaster } from '../components/ui/toaster'
import { Radio, RadioGroup } from '../components/ui/radio'


export default function Checkout() {
  const [method, setMethod] = useState('PAYOS')

  const doPay = async()=>{
    try {
      const msg = await placeOrder(method) // backend của bạn tự initiate nếu PAYOS
      // Thử gọi initiate riêng để lấy link (nếu cần)
      try {
        const r = await initiatePayment(method)
        const link = r?.checkoutUrl || r?.result?.checkoutUrl || r?.paymentUrl
        if (link) window.location.href = link
      } catch {
        // nếu không có link, chỉ thông báo
      }
      toaster.create({ title: msg || 'Đặt hàng thành công', status:'success' })
    } catch(e) {
      toaster.create({ title: 'Thanh toán thất bại', status:'error' })
    }
  }

  return (
    <>
      <Heading size="md" mb={4}>Phương thức thanh toán</Heading>
      <RadioGroup value={method} onValueChange={(e)=>setMethod(e.value)}>
        <Stack>
          <Radio value="PAYOS">PayOS (For Vietnamese people only)</Radio>
          <Radio value="VISA">Visa (Debit/Credit)</Radio>
          <Radio value="COD">COD</Radio>
        </Stack>
      </RadioGroup>
      <Button mt={4} onClick={doPay}>Đặt hàng</Button>
    </>
  )
}
