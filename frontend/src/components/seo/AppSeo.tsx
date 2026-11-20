import { useLocation } from 'react-router-dom'
import { Seo } from './Seo'
import { isPublicSitePath } from '../../apps/ProductSite/locales'

export function AppSeo() {
  const { pathname } = useLocation()

  // The getmasova.rest marketing and legal pages set their own tags (ProductSitePage, LegalPageLayout).
  if (isPublicSitePath(pathname)) return null

  return <Seo title="MaSoVa" description="MaSoVa restaurant workspace." noindex path={pathname} />
}