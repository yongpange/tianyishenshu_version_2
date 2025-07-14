import ReportPageTemplate from '@/components/report/ReportPageTemplate'
import { REPORT_MODULES } from '@/config/reportModules'

export default function WealthPage() {
  return <ReportPageTemplate moduleConfig={REPORT_MODULES.wealth} />
}
