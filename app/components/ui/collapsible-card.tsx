"use client"

import { useState, type ReactNode } from "react"
import { ChevronDown, ChevronUp, type LucideIcon } from "lucide-react"

interface CollapsibleCardProps {
  title: string
  icon: LucideIcon
  children: ReactNode
  defaultOpen?: boolean
}

export function CollapsibleCard({
  title,
  icon: Icon,
  children,
  defaultOpen = false
}: CollapsibleCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="bg-background rounded-lg border-2 border-primary/20 p-6">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 cursor-pointer select-none hover:opacity-80 transition-opacity ${
          isOpen ? "mb-6" : ""
        }`}
      >
        <Icon className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold flex-1">{title}</h2>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </div>
      {isOpen && <div>{children}</div>}
    </div>
  )
}