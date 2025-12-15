import { useMemo } from 'react'
import { useSearchParams, Link as RouterLink } from 'react-router-dom'
import { Box, Text, Heading, Button, Flex, Grid } from '@chakra-ui/react'
import { toaster } from '../components/ui/toaster'
import {
  FiCheckCircle,
  FiXCircle,
  FiExternalLink,
  FiCopy,
  FiRotateCcw
} from 'react-icons/fi'

const glass = {
  bg: 'white',
  border: '1px solid',
  borderColor: 'gray.200',
  borderRadius: '16px',
  p: '20px',
  boxShadow: '0 10px 30px rgba(2,32,71,0.06)'
}

function strToBool(v) {
  if (typeof v !== 'string') return false
  return ['1', 'true', 'yes'].includes(v.toLowerCase())
}

export default function ReturnPage() {
  const [params] = useSearchParams()

  // Map from gateway return URL
  const orderId = params.get('orderCode') || ''
  const gatewayTxnId = params.get('id') || ''
  const status = (params.get('status') || '').toUpperCase() // PAID / CANCELED / FAILED
  const code = params.get('code') || ''
  const canceled = strToBool(params.get('cancel'))
  const message = params.get('message') || ''

  // Success criteria
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
      toaster.create({
        type: 'success',
        description: 'Order ID copied'
      })
    } catch {
      toaster.create({
        type: 'warning',
        description: 'Copy failed'
      })
    }
  }

  return (
    <Box px={{ base: 4, md: 8 }} py={{ base: 6, md: 10 }}>
      <Heading size="lg" mb="24px">
        Payment Result
      </Heading>

      <Grid
        templateColumns={{ base: '1fr', lg: '1.1fr 0.9fr' }}
        gap="24px"
      >
        {/* Main result */}
        <Box {...glass}>
          {success ? (
            <Flex align="center" gap="12px" mb="16px">
              <FiCheckCircle size={28} color="green" />
              <Heading size="md" color="green.600">
                Payment Successful
              </Heading>
            </Flex>
          ) : (
            <Flex align="center" gap="12px" mb="16px">
              <FiXCircle size={28} color="crimson" />
              <Heading size="md" color="red.600">
                Transaction Not Completed
              </Heading>
            </Flex>
          )}

          <Text color="gray.700" mb="16px">
            {message ||
              (success
                ? 'Thank you! Your order has been successfully recorded.'
                : canceled
                ? 'You canceled the payment at the gateway.'
                : status
                ? `Status: ${status}.`
                : code
                ? `Result code: ${code}.`
                : 'Unknown payment status from gateway.')}
          </Text>

          <Box
            mt="16px"
            pt="16px"
            borderTop="1px solid"
            borderColor="gray.100"
          >
            <Row
              label="Order ID"
              value={
                <Flex align="center" gap="8px">
                  <Text fontWeight="medium">{orderId || '—'}</Text>
                  {!!orderId && (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={copyOrderId}
                      leftIcon={<FiCopy />}
                    >
                      Copy
                    </Button>
                  )}
                </Flex>
              }
            />

            <Row
              label="Gateway Transaction ID"
              value={gatewayTxnId || '—'}
            />
            <Row
              label="Status"
              value={
                success
                  ? 'PAID'
                  : canceled
                  ? 'CANCELED'
                  : status || '—'
              }
            />
            <Row label="Result Code" value={code || '—'} />
          </Box>

          <Flex mt="24px" gap="12px" wrap="wrap">
            {orderId && (
              <Button
                as={RouterLink}
                to="/orders"
                colorScheme={success ? 'green' : 'gray'}
                variant={success ? 'solid' : 'outline'}
                leftIcon={<FiExternalLink />}
              >
                View Orders
              </Button>
            )}

            {success ? (
              <Button
                as={RouterLink}
                to="/products"
                variant="outline"
              >
                Continue Shopping
              </Button>
            ) : (
              <>
                <Button
                  as={RouterLink}
                  to="/checkout"
                  colorScheme="orange"
                  leftIcon={<FiRotateCcw />}
                >
                  Retry Payment
                </Button>
                <Button
                  as={RouterLink}
                  to="/"
                  variant="ghost"
                >
                  Back to Home
                </Button>
              </>
            )}
          </Flex>
        </Box>

        {/* Notes */}
        <Box {...glass}>
          <Heading size="sm" mb="12px" color="gray.700">
            Notes
          </Heading>
          <Text color="gray.700" mb="8px">
            • Please take a screenshot of this page for reconciliation.
          </Text>
          <Text color="gray.700" mb="8px">
            • If money was deducted but status is not PAID, contact customer
            support.
          </Text>
          <Text color="gray.700">
            • Check your email or SMS for order confirmation.
          </Text>
        </Box>
      </Grid>
    </Box>
  )
}

function Row({ label, value }) {
  return (
    <Flex
      justify="space-between"
      align="center"
      py="8px"
      gap="16px"
    >
      <Text color="gray.600">{label}</Text>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text fontWeight="medium">{value}</Text>
      ) : (
        value
      )}
    </Flex>
  )
}
