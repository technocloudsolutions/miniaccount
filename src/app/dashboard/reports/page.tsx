import { Metadata } from "next"
import { ReportCard } from "../../../components/reports/ReportCard"
import { ReportFilter } from "../../../components/reports/ReportFilter"
import { Button } from "../../../components/ui/button"
import { Download } from "lucide-react"
import { ReportType } from "../../../lib/types/reports"

export const metadata: Metadata = {
  title: "Reports",
  description: "View and analyze your business data",
}

const reportTypes: { type: ReportType; title: string; description: string }[] = [
  {
    type: "sales",
    title: "Sales Report",
    description: "Overview of all sales transactions and revenue",
  },
  {
    type: "expenses",
    title: "Expenses Report",
    description: "Breakdown of all business expenses",
  },
  {
    type: "purchases",
    title: "Purchase Report",
    description: "Analysis of inventory purchases",
  },
  {
    type: "inventory",
    title: "Inventory Report",
    description: "Current stock levels and movement",
  },
  {
    type: "profit_loss",
    title: "Profit & Loss",
    description: "Complete profit and loss analysis",
  },
]

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export All
        </Button>
      </div>

      <ReportFilter />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report) => (
          <ReportCard
            key={report.type}
            title={report.title}
            description={report.description}
            type={report.type}
          />
        ))}
      </div>
    </div>
  )
} 