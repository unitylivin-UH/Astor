import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { adminSelectTrigger } from '@/admin/adminClassNames'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export type OrderChartBucket = {
  label: string
  short_label?: string
  date?: string
  year?: number
  month?: number
  count: number
  is_current: boolean
}

export type OrderChartData = {
  daily: OrderChartBucket[]
  weekly: OrderChartBucket[]
  monthly: OrderChartBucket[]
}

type ChartMode = 'daily' | 'weekly' | 'monthly'

const MODE_META: Record<ChartMode, { label: string; description: string; selectLabel: string }> = {
  daily: {
    label: 'Daily',
    description: 'Orders this week by day',
    selectLabel: 'This week',
  },
  weekly: {
    label: 'Weekly',
    description: 'Orders over the last 7 days',
    selectLabel: 'Last 7 days',
  },
  monthly: {
    label: 'Monthly',
    description: 'Orders over the last 12 months',
    selectLabel: 'Last 12 months',
  },
}

const chartConfig = {
  orders: {
    label: 'Orders',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

function bucketLabel(bucket: OrderChartBucket, mode: ChartMode) {
  if (mode === 'monthly') return bucket.label
  return bucket.short_label ?? bucket.label.slice(0, 3)
}

function toChartRows(buckets: OrderChartBucket[], mode: ChartMode) {
  return buckets.map((bucket) => ({
    date: bucket.date,
    label: bucketLabel(bucket, mode),
    orders: bucket.count,
  }))
}

function formatAxisTick(value: string, mode: ChartMode) {
  if (mode === 'monthly') return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function formatTooltipLabel(value: string, mode: ChartMode) {
  if (mode === 'monthly') return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function AdminOrdersChart({ data }: { data: OrderChartData }) {
  const [mode, setMode] = useState<ChartMode>('daily')
  const buckets = data[mode]
  const chartData = useMemo(() => toChartRows(buckets, mode), [buckets, mode])
  const xDataKey = mode === 'monthly' ? 'label' : 'date'

  return (
    <Card className="admin-card mt-6 border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] pt-0 shadow-[var(--admin-shadow)]">
      <CardHeader className="flex flex-col gap-4 space-y-0 border-b border-[var(--admin-border)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <CardTitle className="text-[var(--admin-text)]">Orders</CardTitle>
          <CardDescription className="text-[var(--admin-muted)]">
            {MODE_META[mode].description}
          </CardDescription>
        </div>
        <Select value={mode} onValueChange={(value) => setMode(value as ChartMode)}>
          <SelectTrigger
            className={cn(
              'admin-branded-select-trigger shrink-0 rounded-lg sm:ml-auto',
              adminSelectTrigger,
              'h-10 w-full sm:w-[160px]',
            )}
            aria-label="Select chart range"
          >
            <SelectValue placeholder={MODE_META.daily.selectLabel} />
          </SelectTrigger>
          <SelectContent className="admin-branded-select-content rounded-xl">
            {(Object.keys(MODE_META) as ChartMode[]).map((item) => (
              <SelectItem key={item} value={item} className="admin-branded-select-item rounded-lg">
                {MODE_META[item].selectLabel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full justify-start">
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-orders)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-orders)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <YAxis
              domain={[0, 'auto']}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={32}
              allowDecimals={false}
            />
            <XAxis
              dataKey={xDataKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={mode === 'monthly' ? 16 : 32}
              tickFormatter={(value) => formatAxisTick(String(value), mode)}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => formatTooltipLabel(String(value), mode)}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="orders"
              type="monotone"
              baseValue={0}
              fill="url(#fillOrders)"
              stroke="var(--color-orders)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
