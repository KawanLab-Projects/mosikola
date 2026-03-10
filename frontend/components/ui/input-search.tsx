import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export interface InputSearchProps<T> {
  placeholder?: string
  data: T[]
  onSearch: (searchTerm: string) => T[]
  onSelect: (item: T) => void
  renderItem: (item: T) => React.ReactNode
  isLoading?: boolean
  emptyMessage?: string
  className?: string
  value?: string
  onChange?: (value: string) => void
  clearOnSelect?: boolean
  keyExtractor: (item: T) => string | number
}

export function InputSearch<T>({
  placeholder,
  data,
  onSearch,
  onSelect,
  renderItem,
  isLoading,
  emptyMessage = "Tidak ditemukan.",
  className,
  value,
  onChange,
  clearOnSelect = false,
  keyExtractor
}: InputSearchProps<T>) {
  const [inputValue, setInputValue] = React.useState(value || "")
  const [debouncedValue, setDebouncedValue] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)
  const [results, setResults] = React.useState<T[]>([])
  const wrapperRef = React.useRef<HTMLDivElement>(null)

  // Update internal value if controlled value changes
  React.useEffect(() => {
    if (value !== undefined) {
      setInputValue(value)
    }
  }, [value])

  // Debounce logic
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue)
    }, 500) // 0.5 seconds delay
    return () => clearTimeout(timer)
  }, [inputValue])

  // Search logic
  React.useEffect(() => {
    if (debouncedValue) {
      const filtered = onSearch(debouncedValue)
      setResults(filtered)
    } else {
      setResults(data)
    }
  }, [debouncedValue, data, onSearch])

  // Click outside to close
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputValue(val)
    if (onChange) onChange(val)
    if (!isOpen) setIsOpen(true)
  }

  const handleSelect = (item: T) => {
    onSelect(item)
    setIsOpen(false)
    if (clearOnSelect) {
      setInputValue("")
      if (onChange) onChange("")
      setDebouncedValue("")
    }
  }

  return (
    <div className={cn("relative w-full", className)} ref={wrapperRef}>
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full z-[100] mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
          <div className="max-h-60 overflow-y-auto p-1">
            {results.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {isLoading ? "Memuat..." : emptyMessage}
              </div>
            ) : (
              results.map((item) => (
                <div
                  key={keyExtractor(item)}
                  onClick={() => handleSelect(item)}
                  className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  {renderItem(item)}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
