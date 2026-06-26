import { useLocation } from 'react-router-dom'
import { Seo } from './Seo'

const PUBLIC_PATHS = new Set(['/'])

export function AppSeo() {
  const { pathname } = useLocation()
  const isPublic = PUBLIC_PATHS.has(pathname)

  if (isPublic) {
    return <Seo />
  }

  return <Seo title="MaSoVa" description="MaSoVa restaurant workspace." noindex path={pathname} />
}