import type { TimeRange } from '@/types/platform'
import styles from './Charts.module.css'

interface TimeRangeSelectorProps {
  value: TimeRange
  onChange: (range: TimeRange) => void
}

const RANGES: { value: TimeRange; label: string }[] = [
  { value: '1w', label: '1W' },
  { value: '2w', label: '2W' },
  { value: '1m', label: '1M' },
  { value: '3m', label: '3M' },
]

/**
 * TimeRangeSelector — Button group for selecting time range filter.
 * Supports 1 week, 2 weeks, 1 month, and 3 months.
 */
export default function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className={styles.timeRangeSelector} role="group" aria-label="Time range selector">
      {RANGES.map((range) => (
        <button
          key={range.value}
          className={`${styles.rangeBtn} ${value === range.value ? styles.rangeBtnActive : ''}`}
          onClick={() => onChange(range.value)}
          aria-pressed={value === range.value}
          aria-label={`Select ${range.label} time range`}
        >
          {range.label}
        </button>
      ))}
    </div>
  )
}
