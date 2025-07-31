import PageTemplate from '@/components/PageTemplate'
import { REPORT_MODULES } from '@/config/reportModules'

export default function HealthPage() {
  return <PageTemplate moduleConfig={REPORT_MODULES.health} />
}
