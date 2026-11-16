import { getIconSvgProps } from './Icon'
import type { IconProps } from './Icon'

export function ClockIcon(props: IconProps) {
  return (
    <svg {...getIconSvgProps(props, '0 0 24 24')}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
