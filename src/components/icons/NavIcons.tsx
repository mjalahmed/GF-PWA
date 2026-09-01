import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { title?: string }

function IconBase({ title, children, className, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? 'size-5'}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  )
}

export function IconHome(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" fillOpacity="0.12" />
      <path d="M8 17.5c0-.8.7-1.5 1.5-1.5h5c.8 0 1.5.7 1.5 1.5V19H8v-1.5Z" fill="currentColor" />
      <path d="M9.5 16 11 12h2l1.5 4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="18" r=".75" fill="currentColor" />
      <circle cx="14" cy="18" r=".75" fill="currentColor" />
    </IconBase>
  )
}

export function IconSearch(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16.5 16.5 4 4" />
    </IconBase>
  )
}

export function IconCalendar(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M8 3.5v3M16 3.5v3M3.5 10h17" />
    </IconBase>
  )
}

export function IconInvoice(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 3.5h10a1.5 1.5 0 0 1 1.5 1.5v14l-2.2-1.4-2.3 1.4-2.2-1.4-2.3 1.4-2.2-1.4-2.3 1.4V5A1.5 1.5 0 0 1 7 3.5Z" />
      <path d="M8.5 9h7M8.5 12.5h7M8.5 16h4" />
    </IconBase>
  )
}

export function IconProfile(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="9" r="3.25" />
      <path d="M5.5 19.5c1.6-3 4-4.5 6.5-4.5s4.9 1.5 6.5 4.5" />
    </IconBase>
  )
}

export function IconChevron(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m9 6 6 6-6 6" />
    </IconBase>
  )
}
