import ReportPageTemplate from '@/components/report/ReportPageTemplate'
import { REPORT_MODULES } from '@/config/reportModules'

export default function HealthPage() {
  return <ReportPageTemplate moduleConfig={REPORT_MODULES.health} />
}
