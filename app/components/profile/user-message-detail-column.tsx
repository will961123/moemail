"use client"

import { useTranslations } from "next-intl"
import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { Loader2 } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface MessageDetail {
  id: string
  from_address?: string
  to_address?: string
  subject: string
  content: string
  html?: string
  received_at?: number
  type: string
}

type ViewMode = "html" | "text"

interface UserMessageDetailColumnProps {
  messageDetail: MessageDetail | null
  loading: boolean
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  showBackButton?: boolean
  onBack?: () => void
}

export function UserMessageDetailColumn({
  messageDetail,
  loading,
  viewMode,
  onViewModeChange,
  showBackButton = false,
  onBack,
}: UserMessageDetailColumnProps) {
  const t = useTranslations("profile.userManagement")
  const tMessageView = useTranslations("emails.messageView")
  const tLayout = useTranslations("emails.layout")
  const { theme } = useTheme()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const updateIframeContent = () => {
    if (viewMode === "html" && messageDetail?.html && iframeRef.current) {
      const iframe = iframeRef.current
      const doc = iframe.contentDocument || iframe.contentWindow?.document

      if (doc) {
        doc.open()
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <base target="_blank">
              <style>
                html, body {
                  margin: 0;
                  padding: 0;
                  min-height: 100%;
                  font-family: system-ui, -apple-system, sans-serif;
                  color: ${theme === 'dark' ? '#fff' : '#000'};
                  background: ${theme === 'dark' ? '#1a1a1a' : '#fff'};
                }
                body {
                  padding: 20px;
                }
                img {
                  max-width: 100%;
                  height: auto;
                }
                a {
                  color: #2563eb;
                }
                ::-webkit-scrollbar {
                  width: 6px;
                  height: 6px;
                }
                ::-webkit-scrollbar-track {
                  background: transparent;
                }
                ::-webkit-scrollbar-thumb {
                  background: ${theme === 'dark'
                    ? 'rgba(130, 109, 217, 0.3)'
                    : 'rgba(130, 109, 217, 0.2)'};
                  border-radius: 9999px;
                  transition: background-color 0.2s;
                }
                ::-webkit-scrollbar-thumb:hover {
                  background: ${theme === 'dark'
                    ? 'rgba(130, 109, 217, 0.5)'
                    : 'rgba(130, 109, 217, 0.4)'};
                }
                * {
                  scrollbar-width: thin;
                  scrollbar-color: ${theme === 'dark'
                    ? 'rgba(130, 109, 217, 0.3) transparent'
                    : 'rgba(130, 109, 217, 0.2) transparent'};
                }
              </style>
            </head>
            <body>${messageDetail.html}</body>
          </html>
        `)
        doc.close()

        const updateHeight = () => {
          const container = iframe.parentElement
          if (container) {
            iframe.style.height = `${container.clientHeight}px`
          }
        }

        updateHeight()
        window.addEventListener('resize', updateHeight)

        const resizeObserver = new ResizeObserver(updateHeight)
        resizeObserver.observe(doc.body)

        doc.querySelectorAll('img').forEach((img: HTMLImageElement) => {
          img.onload = updateHeight
        })

        return () => {
          window.removeEventListener('resize', updateHeight)
          resizeObserver.disconnect()
        }
      }
    }
  }

  useEffect(() => {
    updateIframeContent()
  }, [messageDetail?.html, viewMode, theme])

  return (
    <>
      <div className="p-2 border-b-2 border-primary/20 flex items-center justify-between shrink-0">
        {showBackButton && onBack && (
          <button
            onClick={onBack}
            className="text-sm text-primary"
          >
            {tLayout("backToMessageList")}
          </button>
        )}
        <span className="text-sm font-medium">{tLayout("messageContent")}</span>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary/60" />
          </div>
        ) : messageDetail ? (
          <div className="h-full flex flex-col">
            <div className="p-4 space-y-3 border-b border-primary/20">
              <h3 className="text-base font-bold">{messageDetail.subject}</h3>
              <div className="text-xs text-gray-500 space-y-1">
                {messageDetail.from_address && (
                  <p>{tMessageView("from")}: {messageDetail.from_address}</p>
                )}
                {messageDetail.to_address && (
                  <p>{tMessageView("to")}: {messageDetail.to_address}</p>
                )}
                <p>{tMessageView("time")}: {new Date(messageDetail.received_at || 0).toLocaleString()}</p>
              </div>
            </div>

            {messageDetail.html && messageDetail.content && (
              <div className="border-b border-primary/20 p-2">
                <RadioGroup
                  value={viewMode}
                  onValueChange={(value) => onViewModeChange(value as ViewMode)}
                  className="flex items-center gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="html" id={`html-${showBackButton ? 'mobile' : 'desktop'}`} />
                    <Label
                      htmlFor={`html-${showBackButton ? 'mobile' : 'desktop'}`}
                      className="text-xs cursor-pointer"
                    >
                      {tMessageView("htmlFormat")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="text" id={`text-${showBackButton ? 'mobile' : 'desktop'}`} />
                    <Label
                      htmlFor={`text-${showBackButton ? 'mobile' : 'desktop'}`}
                      className="text-xs cursor-pointer"
                    >
                      {tMessageView("textFormat")}
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            <div className="flex-1 overflow-auto relative">
              {viewMode === "html" && messageDetail.html ? (
                <iframe
                  ref={iframeRef}
                  className="absolute inset-0 w-full h-full border-0 bg-transparent"
                  sandbox="allow-same-origin allow-popups"
                />
              ) : (
                <div className="p-4 text-sm whitespace-pre-wrap">
                  {messageDetail.content}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}
