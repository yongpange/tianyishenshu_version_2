import PageTemplate from '@/components/PageTemplate'
import { REPORT_MODULES } from '@/config/reportModules'

export default function PersonalityPage() {
  return <PageTemplate moduleConfig={REPORT_MODULES.personality} />
}