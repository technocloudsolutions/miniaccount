'use client'

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/card"
import { Button } from "../ui/button"
import { Eye, Download } from "lucide-react"
import { ReportType, Report } from "../../lib/types/reports"
import { ReportViewer } from "./ReportViewer"
import { generateReport } from "@/lib/services/reportService"
import { format } from "date-fns"
import { getCurrentFilter } from './ReportFilter'

interface ReportCardProps {
  title: string
  description: string
  type: ReportType
}

export function ReportCard({ title, description, type }: ReportCardProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false)

  const handleExport = async () => {
    try {
      const report = await generateReport(type, getCurrentFilter())

      // Convert report data to CSV
      const csvContent = generateCSV(report)
      
      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${type}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error exporting report:', error)
      alert('Failed to export report')
    }
  }

  const generateCSV = (report: Report) => {
    const headers = ['Date', 'Description', 'Amount', 'Status']
    const rows = report.data.map(item => [
      format(new Date(item.date), 'yyyy-MM-dd'),
      item.label,
      item.value.toString(),
      item.details?.status || 'N/A'
    ])
    
    return [
      headers.join(','),
      ...rows.map((row: string[]) => row.join(','))
    ].join('\n')
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Placeholder for report preview/summary */}
          <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-md"></div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" size="sm" onClick={() => setIsViewerOpen(true)}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </CardFooter>
      </Card>

      <ReportViewer
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        reportType={type}
        title={title}
      />
    </>
  )
} 