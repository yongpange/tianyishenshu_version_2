import PageTemplate from '@/components/PageTemplate'
import { REPORT_MODULES } from '@/config/reportModules'

export default function WealthPage() {
  return <PageTemplate moduleConfig={REPORT_MODULES.wealth} />
}
