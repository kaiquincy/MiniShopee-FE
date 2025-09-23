import React, { useMemo } from 'react'

// Chakra v3
import { Flex } from '@chakra-ui/react/flex'
import { Tooltip } from '../components/ui/tooltip'
import { IconButton } from "@chakra-ui/react"
import { Text } from '@chakra-ui/react/text'

// Icons (react-icons/fi)
import {
  FiCheckCircle,
  FiTruck,
  FiPackage,
  FiXCircle,
  FiRotateCcw,
  FiPlayCircle,
  FiCreditCard,
} from 'react-icons/fi'

// Import flow
import { ORDER, ALLOWED } from '../seller/utils/orderFlow'

// Meta: icon + label + color cho từng action đích
const ACTION_META = {
  [ORDER.PAID]:       { label: 'Xác nhận đã thanh toán',   icon: FiCreditCard,   colorPalette: 'green'  },
  [ORDER.PROCESSING]: { label: 'Bắt đầu xử lý đơn',        icon: FiPlayCircle,   colorPalette: 'blue'   },
  [ORDER.SHIPPING]:   { label: 'Đang giao hàng',            icon: FiTruck,        colorPalette: 'teal'   },
  [ORDER.DELIVERED]:  { label: 'Đã giao',                   icon: FiPackage,      colorPalette: 'purple' },
  [ORDER.COMPLETED]:  { label: 'Hoàn tất đơn',              icon: FiCheckCircle,  colorPalette: 'green'  },
  [ORDER.CANCELLED]:  { label: 'Huỷ đơn',                   icon: FiXCircle,      colorPalette: 'red'    },
  [ORDER.REFUNDED]:   { label: 'Hoàn tiền',                 icon: FiRotateCcw,    colorPalette: 'orange' },
}

/**
 * Props:
 * - status: trạng thái hiện tại (ORDER.*)
 * - onAction: (nextStatus) => void | Promise<void>
 * - loadingFor?: object { [ORDER.*]: boolean } — để hiển thị isLoading cho từng nút khi call API
 * - disabled?: boolean — khoá tất cả các nút
 * - size?: 'sm' | 'md' | 'lg'
 * - variant?: Chakra variant, mặc định 'ghost'
 */
export default function OrderActions({
  status,
  onAction,
  loadingFor = {},
  disabled = false,
  size = 'md',
  variant = 'ghost',
}) {
  const actions = useMemo(() => ALLOWED[status] || [], [status])

  if (!actions.length) {
    return (
      <Text color="gray.500" fontSize="sm" aria-live="polite">
        No next actions
      </Text>
    )
  }

  return (
    <Flex gap="8px" wrap="wrap" align="center">
      {actions.map(next => {
        const meta = ACTION_META[next] || {}
        const Icon = meta.icon || FiPlayCircle
        const isLoading = !!loadingFor[next]

        return (
          <Tooltip key={next} label={meta.label || next} openDelay={200}>
            <IconButton
            aria-label={meta.label || next}
            onClick={() => onAction(next)}
            isLoading={isLoading}
            isDisabled={disabled || isLoading}
            variant={variant}
            size={size}
            borderRadius="12px"
            colorPalette={meta.colorPalette || 'gray'}
            >
            <Icon />   {/* 👈 icon truyền vào như children */}
            </IconButton>
          </Tooltip>
        )
      })}
    </Flex>
  )
}
