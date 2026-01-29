'use client'
import type { Doc } from '.velite'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { sva } from 'styled-system/css'

const recipe = sva({
  slots: ['root', 'heading', 'list', 'item', 'link'],
  base: {
    root: {
      display: 'flex',
      flexDirection: 'column',
      gap: '3',
    },
    heading: {
      textStyle: 'header',
    },
    list: {
      borderStartWidth: '1px',
      display: 'flex',
      flexDirection: 'column',
      gap: '1px',
      pe: '4',
    },
    item: {
      borderStartWidth: '1px',
      borderColor: 'transparent',
      color: 'fg.muted',
      borderEndRadius: 'l2',
      fontSize: 'sm',
      display: 'flex',
      lineHeight: '2rem',
      ps: '4',
      ms: '-1px',
      transition: 'colors',
      transitionDuration: 'fastest',
      _hover: {
        bg: 'colorPalette.surface.bg',
        color: 'colorPalette.surface.fg',
        borderColor: 'colorPalette.surface.border.hover',
      },
      _currentPage: {
        bg: 'colorPalette.surface.bg.active',
        color: 'colorPalette.surface.fg',
        borderColor: 'colorPalette.solid.bg',
        _hover: {
          bg: 'colorPalette.surface.bg.active',
          color: 'colorPalette.surface.fg',
          borderColor: 'colorPalette.solid.bg',
        },
      },
    },
    link: {
      flex: '1',
    },
  },
})
const classNames = recipe()

interface Props {
  heading: string
  docs: Doc[]
}

export const SidebarGroup = (props: Props) => {
  const pathname = usePathname()

  const { heading, docs } = props
  return (
    <div className={classNames.root}>
      <h3 className={classNames.heading}>{heading === 'docs' ? 'Gettting Started' : heading}</h3>
      <ul className={classNames.list}>
        {docs.map((doc) => (
          <li
            key={doc.slug}
            className={classNames.item}
            aria-current={pathname === doc.href ? 'page' : undefined}
          >
            <NextLink href={doc.href} className={classNames.link} prefetch={false}>
              {doc.title}
            </NextLink>
          </li>
        ))}
      </ul>
    </div>
  )
}
