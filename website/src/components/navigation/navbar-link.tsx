'use client'
import NextLink, { type LinkProps } from 'next/link'
import { usePathname } from 'next/navigation'
import { css, cx } from 'styled-system/css'

interface Props extends LinkProps {
  children?: React.ReactNode
  href: string
}

export const NavbarLink = (props: Props) => {
  const { children, href, ...linkProps } = props
  const pathname = usePathname()
  const isActive = pathname.startsWith(href)

  return (
    <NextLink
      href={href}
      prefetch={false}
      aria-current={isActive ? 'page' : undefined}
      data-active={isActive ? '' : undefined}
      className={cx(
        'group',
        css({
          color: 'fg.muted',
          position: 'relative',
          display: 'block',
          height: 'full',
          width: 'full',
          textStyle: 'md',
          userSelect: 'none',
          py: '4',
          px: '5',
          _hover: {
            color: 'fg.default',
          },
          _currentPage: {
            color: 'fg.default',
          },
        }),
      )}
      {...linkProps}
    >
      {children}
      <span
        className={css({
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          height: '2px',
          width: '100%',
          background: 'colorPalette.solid.bg',
          transform: 'scaleX(0)',
          transformOrigin: 'left',
          transition: 'transform 0.3s ease',
          transitionTimingFunction: 'ease-in-out',
          pointerEvents: 'none',
          _groupHover: {
            transform: 'scaleX(1)',
          },
          _groupActive: {
            transform: 'scaleX(1)',
          },
        })}
      />
    </NextLink>
  )
}
