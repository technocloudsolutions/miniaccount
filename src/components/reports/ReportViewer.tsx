'use client'

import { useState, useEffect } from "react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Report, ReportType } from "@/lib/types/reports"
import { generateReport } from "@/lib/services/reportService"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Loading } from "../ui/loading"
import { getCurrentFilter } from './ReportFilter'

interface ReportViewerProps {
  isOpen: boolean
  onClose: () => void
  reportType: ReportType
  title: string
}

interface CustomEvent extends Event {
  detail: Report[];
}

export function ReportViewer({ isOpen, onClose, reportType, title }: ReportViewerProps) {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadReport()
    }
  }, [isOpen, reportType])

  useEffect(() => {
    const handleReportsGenerated = (event: CustomEvent) => {
      const reports = event.detail
      const currentReport = reports.find(r => r.type === reportType)
      if (currentReport) {
        setReport(currentReport)
      }
    }

    window.addEventListener('reportsGenerated', handleReportsGenerated as EventListener)
    return () => {
      window.removeEventListener('reportsGenerated', handleReportsGenerated as EventListener)
    }
  }, [reportType])

  const loadReport = async () => {
    setLoading(true)
    setError(null)
    try {
      const newReport = await generateReport(reportType, getCurrentFilter())
      console.log('Loaded report:', newReport)
      setReport(newReport)
    } catch (error) {
      console.error('Error loading report:', error)
      setError(error instanceof Error ? error.message : 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Detailed view of your {reportType} report
          </DialogDescription>
        </DialogHeader>

        {loading && <Loading />}
        
        {error && (
          <div className="p-4 text-sm text-red-500 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        {!loading && !error && report && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {report.summary.formattedTotal}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Number of Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{report.summary.count}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Average Amount</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {report.summary.formattedAverage}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            {report.data.length > 0 ? (
              <div className="h-[300px] mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={report.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                      formatter={(value) => [report.data.find(d => d.value === value)?.formattedValue || value, 'Amount']}
                    />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No data available for the selected period
              </div>
            )}

            {/* Detailed Transactions Table */}
            {report.data.length > 0 && (
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-left">Item Name</th>
                      {reportType === 'inventory' ? (
                        <>
                          <th className="p-2 text-right">Initial Stock</th>
                          <th className="p-2 text-right">Current Stock</th>
                          <th className="p-2 text-right">Unit Price</th>
                          <th className="p-2 text-right">Total Value</th>
                        </>
                      ) : (
                        <>
                          <th className="p-2 text-left">{reportType === 'purchases' ? 'Supplier Info' : 'Category'}</th>
                          <th className="p-2 text-right">Amount</th>
                        </>
                      )}
                      <th className="p-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.data.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">
                          {format(new Date(item.date), 'MMM dd, yyyy')}
                        </td>
                        <td className="p-2">{item.label}</td>
                        {reportType === 'inventory' ? (
                          <>
                            <td className="p-2 text-right">{item.details?.initialStock}</td>
                            <td className="p-2 text-right">{item.details?.currentStock}</td>
                            <td className="p-2 text-right">{item.details?.items[0]?.formattedPrice}</td>
                            <td className="p-2 text-right">{item.formattedValue}</td>
                          </>
                        ) : (
                          <>
                            <td className="p-2">{reportType === 'purchases' ? item.details?.supplier : item.details?.category || 'N/A'}</td>
                            <td className="p-2 text-right">{item.formattedValue}</td>
                          </>
                        )}
                        <td className="p-2">{item.details?.status || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
} 