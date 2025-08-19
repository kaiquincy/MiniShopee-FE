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
      const res = await placeOrder(method) // backend của bạn tự initiate nếu PAYOS
      const result = res?.result || res
      const link = result?.paymentLink
      const orderId = result?.orderId
      // PAYOS: có link -> redirect
      if (link) {
        window.location.assign(link)
        return
      }
       // Method khác: không có link -> chỉ toast
      toaster.create({ title: msg || 'Đặt hàng thành công', status:'success' })
    } catch(e) {
      toaster.create({ title: 'Thanh toán thất bại', status:'error' })
      console.error(e)
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
