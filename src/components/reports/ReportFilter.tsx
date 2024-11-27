'use client'

import { useState, useEffect, useCallback } from "react"
import { Card } from "../ui/card"
import { Button } from "../ui/button"
import { Calendar } from "../ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover"
import { ReportTimeframe, ReportFilter as FilterType } from "../../lib/types/reports"
import { generateReport } from "@/lib/services/reportService"
import { useAuth } from "@/components/providers/AuthProvider"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { DateRange } from "react-day-picker"

// Create a global state for current filter
let currentFilter: FilterType = {
  timeframe: 'monthly',
  dateRange: {
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date()
  }
}

export function ReportFilter() {
  const [timeframe, setTimeframe] = useState<ReportTimeframe>('monthly')
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  })
  const { user } = useAuth()

  const handleGenerateReport = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      console.log('Generating reports with filter:', currentFilter)

      // Generate all report types with the current filter
      const reports = await Promise.all([
        generateReport('sales', currentFilter),
        generateReport('expenses', currentFilter),
        generateReport('purchases', currentFilter),
        generateReport('inventory', currentFilter),
        generateReport('profit_loss', currentFilter),
      ])

      console.log('Generated Reports:', reports)
      
      // Dispatch event with the new reports
      const event = new CustomEvent('reportsGenerated', { 
        detail: reports 
      })
      window.dispatchEvent(event)
    } catch (error: unknown) {
      console.error('Error generating reports:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  const handleTimeframeChange = useCallback(async (newTimeframe: ReportTimeframe) => {
    setTimeframe(newTimeframe)
    let dateRange;
    
    if (newTimeframe === 'custom') {
      dateRange = {
        startDate: date.from || new Date(),
        endDate: date.to || new Date()
      }
    } else {
      dateRange = getDateRangeFromTimeframe(newTimeframe)
    }

    currentFilter = {
      timeframe: newTimeframe,
      dateRange
    }
    await handleGenerateReport()
  }, [date, handleGenerateReport])

  const handleDateRangeChange = async (newDate: DateRange | undefined) => {
    if (!newDate) return;
    
    setDate({
      from: newDate.from,
      to: newDate.to
    });
    
    if (newDate.from && newDate.to) {
      currentFilter = {
        timeframe: 'custom',
        dateRange: {
          startDate: newDate.from,
          endDate: newDate.to
        }
      }
      setTimeframe('custom')
      await handleGenerateReport()
    }
  }

  const getDateRangeFromTimeframe = (timeframe: ReportTimeframe) => {
    const endDate = new Date()
    let startDate = new Date()

    switch (timeframe) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'monthly':
        startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'yearly':
        startDate = new Date(endDate.getFullYear() - 1, endDate.getMonth(), 1)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      default:
        startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
    }

    return { startDate, endDate }
  }

  // Initial load
  useEffect(() => {
    if (user) {
      handleGenerateReport()
    }
  }, [user, handleGenerateReport])

  return (
    <Card className="p-4">
      <div className="flex flex-wrap gap-4">
        <Select 
          value={timeframe} 
          onValueChange={(value) => handleTimeframeChange(value as ReportTimeframe)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>

        {timeframe === 'custom' && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={{ from: date?.from, to: date?.to }}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        )}

        <Button 
          variant="outline" 
          onClick={handleGenerateReport}
          disabled={loading || !user}
        >
          {loading ? 'Generating...' : 'Generate Reports'}
        </Button>
      </div>
    </Card>
  )
}

// Export the current filter for other components to use
export function getCurrentFilter(): FilterType {
  return currentFilter
} 