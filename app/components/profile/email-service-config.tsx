"use client"

import React, { useState, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ResendApiKeyConfig {
  domain: string
  apiKey: string
}

interface EmailServiceConfig {
  enabled: boolean
  apiKeys: {
    keys: ResendApiKeyConfig[]
  }
  roleLimits: {
    duke: number
    knight: number
  }
}

export function EmailServiceConfig() {
  const t = useTranslations("profile.emailService")
  const tCard = useTranslations("profile.card")
  const tSend = useTranslations("emails.send")
  const [config, setConfig] = useState<EmailServiceConfig>({
    enabled: false,
    apiKeys: {
      keys: []
    },
    roleLimits: {
      duke: -1,
      knight: -1,
    }
  })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({})
  const { toast } = useToast()
  const isFetchingRef = useRef(false)

  // 域名配置对话框状态
  const [domainDialogOpen, setDomainDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [domainForm, setDomainForm] = useState({ domain: "", apiKey: "" })
  const [domainFormErrors, setDomainFormErrors] = useState({ domain: "", apiKey: "" })

  // 删除确认对话框状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null)

  // 验证域名格式
  const validateDomain = (domain: string): boolean => {
    return /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i.test(domain)
  }

  // 验证 API Key 格式
  const validateApiKey = (key: string): boolean => {
    return key.trim().length > 0
  }

  // 打开添加域名对话框
  const handleAddDomain = () => {
    setEditingIndex(null)
    setDomainForm({ domain: "", apiKey: "" })
    setDomainFormErrors({ domain: "", apiKey: "" })
    setDomainDialogOpen(true)
  }

  // 打开编辑域名对话框
  const handleEditDomain = (index: number) => {
    const keyConfig = config.apiKeys.keys[index]
    setEditingIndex(index)
    setDomainForm({ domain: keyConfig.domain, apiKey: keyConfig.apiKey })
    setDomainFormErrors({ domain: "", apiKey: "" })
    setDomainDialogOpen(true)
  }

  // 保存域名配置
  const handleSaveDomain = () => {
    const errors = { domain: "", apiKey: "" }
    let hasError = false

    // 验证域名
    if (!domainForm.domain.trim()) {
      errors.domain = t("domainRequired")
      hasError = true
    } else if (!validateDomain(domainForm.domain)) {
      errors.domain = t("domainInvalid")
      hasError = true
    } else {
      // 检查域名重复（编辑时排除自己）
      const isDuplicate = config.apiKeys.keys.some((k, i) =>
        k.domain.toLowerCase() === domainForm.domain.toLowerCase() && i !== editingIndex
      )
      if (isDuplicate) {
        errors.domain = t("domainDuplicate")
        hasError = true
      }
    }

    // 验证 API Key
    if (!domainForm.apiKey.trim()) {
      errors.apiKey = t("apiKeyRequired")
      hasError = true
    } else if (!validateApiKey(domainForm.apiKey)) {
      errors.apiKey = t("apiKeyInvalid")
      hasError = true
    }

    if (hasError) {
      setDomainFormErrors(errors)
      return
    }

    // 保存配置
    const newKeys = [...config.apiKeys.keys]
    if (editingIndex !== null) {
      newKeys[editingIndex] = { domain: domainForm.domain, apiKey: domainForm.apiKey }
    } else {
      newKeys.push({ domain: domainForm.domain, apiKey: domainForm.apiKey })
    }

    setConfig(prev => ({
      ...prev,
      apiKeys: { keys: newKeys }
    }))
    setDomainDialogOpen(false)
  }

  // 打开删除确认对话框
  const handleDeleteDomain = (index: number) => {
    setDeletingIndex(index)
    setDeleteDialogOpen(true)
  }

  // 确认删除域名配置
  const confirmDeleteDomain = () => {
    if (deletingIndex === null) return

    // 检查是否至少保留一个配置
    if (config.apiKeys.keys.length <= 1) {
      toast({
        title: t("atLeastOneKey"),
        variant: "destructive",
      })
      setDeleteDialogOpen(false)
      return
    }

    const newKeys = config.apiKeys.keys.filter((_, i) => i !== deletingIndex)
    setConfig(prev => ({
      ...prev,
      apiKeys: { keys: newKeys }
    }))
    setDeleteDialogOpen(false)
    toast({
      title: t("deleteSuccess"),
    })
  }

  // 切换 API Key 显示/隐藏
  const toggleShowToken = (domain: string) => {
    setShowTokens(prev => ({
      ...prev,
      [domain]: !prev[domain]
    }))
  }


  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    if (isFetchingRef.current) {
      return
    }

    isFetchingRef.current = true
    setFetching(true)
    try {
      const res = await fetch("/api/config/email-service")
      if (res.ok) {
        const data = await res.json() as EmailServiceConfig
        setConfig(data)
      }
    } catch (error) {
      console.error("Failed to fetch email service config:", error)
    } finally {
      isFetchingRef.current = false
      setFetching(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const saveData = {
        enabled: config.enabled,
        apiKeys: config.apiKeys,
        roleLimits: config.roleLimits
      }

      const res = await fetch("/api/config/email-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveData),
      })

      if (!res.ok) {
        const error = await res.json() as { error: string }
        throw new Error(error.error || t("saveFailed"))
      }

      toast({
        title: t("saveSuccess"),
        description: t("saveSuccess"),
      })
    } catch (error) {
      toast({
        title: t("saveFailed"),
        description: error instanceof Error ? error.message : t("saveFailed"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
        {fetching ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("loading")}</p>
            </div>
          </div>
        ) : (
          <>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enabled" className="text-sm font-medium">
              {t("enable")}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t("enableDescription")}
            </p>
          </div>
          <Switch
            id="enabled"
            checked={config.enabled}
            onCheckedChange={(checked: boolean) =>
              setConfig((prev: EmailServiceConfig) => ({ ...prev, enabled: checked }))
            }
          />
        </div>

        {config.enabled && (
          <>
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("roleLimits")}
              </Label>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg text-sm">
                  <div className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    {t("fixedRoleLimits")}
                  </div>
                  <div className="space-y-2 text-blue-800">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span><strong>{tCard("roles.EMPEROR")}</strong> - {t("emperorLimit")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      <span><strong>{tCard("roles.CIVILIAN")}</strong> - {t("civilianLimit")}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <p className="text-sm font-medium text-gray-900">{t("configRoleLabel")}</p>
                  </div>
                  {[
                    { value: "duke", label: tCard("roles.DUKE"), key: "duke" as const },
                    { value: "knight", label: tCard("roles.KNIGHT"), key: "knight" as const }
                  ].map((role) => {
                    const isDisabled = config.roleLimits[role.key] === -1
                    const isEnabled = !isDisabled
                    
                    return (
                      <div 
                        key={role.value} 
                        className={`group relative p-4 border-2 rounded-xl transition-all duration-200 ${
                          isEnabled
                            ? 'border-primary/30 bg-primary/5 shadow-sm' 
                            : 'border-gray-200 hover:border-primary/20 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <Checkbox
                                id={`role-${role.value}`}
                                checked={isEnabled}
                                onChange={(checked: boolean) => {
                                  setConfig((prev: EmailServiceConfig) => ({
                                    ...prev,
                                    roleLimits: {
                                      ...prev.roleLimits,
                                      [role.key]: checked ? 0 : -1
                                    }
                                  }))
                                }}
                              />
                            </div>
                            <div>
                              <Label 
                                htmlFor={`role-${role.value}`} 
                                className="text-base font-semibold cursor-pointer select-none flex items-center gap-2"
                              >
                                <span className="text-2xl">
                                  {role.value === 'duke' ? '🏰' : '⚔️'}
                                </span>
                                {role.label}
                              </Label>
                              <p className="text-xs text-muted-foreground mt-1">
                                {isEnabled ? t("enabled") : t("disabled")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <Label className="text-xs font-medium text-gray-600 block mb-1">{t("dailyLimit")}</Label>
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="number"
                                  min="-1"
                                  value={config.roleLimits[role.key]}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                    setConfig((prev: EmailServiceConfig) => ({
                                      ...prev,
                                      roleLimits: {
                                        ...prev.roleLimits,
                                        [role.key]: parseInt(e.target.value) || 0
                                      }
                                    }))
                                  }
                                  className="w-20 h-9 text-center text-sm font-medium"
                                  placeholder="0"
                                  disabled={isDisabled}
                                />
                                <span className="text-xs text-muted-foreground whitespace-nowrap">{tSend("dailyLimitUnit")}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">0 = {t("unlimited")}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  {t("domainConfigs")}
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddDomain}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t("addDomain")}
                </Button>
              </div>

              {config.apiKeys.keys.length === 0 ? (
                <div className="p-4 border-2 border-dashed rounded-lg text-center text-sm text-muted-foreground">
                  {t("noDomainConfigs")}
                </div>
              ) : (
                <div className="space-y-2">
                  {config.apiKeys.keys.map((keyConfig, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg space-y-2 bg-card"
                    >
                      <div className="flex items-end justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="text-sm font-medium">
                            {t("domain")}: {keyConfig.domain}
                          </div>
                          <div className="relative">
                            <Input
                              type={showTokens[keyConfig.domain] ? "text" : "password"}
                              value={keyConfig.apiKey}
                              readOnly
                              className="pr-20 text-sm"
                            />
                            <div className="absolute right-0 top-0 h-full flex items-center gap-1 pr-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => toggleShowToken(keyConfig.domain)}
                              >
                                {showTokens[keyConfig.domain] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4 mb-0.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditDomain(index)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDomain(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <Button
          onClick={handleSave}
          disabled={loading}
          className="w-full"
        >
          {loading ? t("saving") : t("save")}
        </Button>
        </>
        )}

        {/* 添加/编辑域名配置对话框 */}
        <Dialog open={domainDialogOpen} onOpenChange={setDomainDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingIndex !== null ? t("editDialogTitle") : t("addDialogTitle")}
              </DialogTitle>
              <DialogDescription>
                {t("domainPlaceholder")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="domain">{t("domain")}</Label>
                <Input
                  id="domain"
                  value={domainForm.domain}
                  onChange={(e) => {
                    setDomainForm(prev => ({ ...prev, domain: e.target.value }))
                    setDomainFormErrors(prev => ({ ...prev, domain: "" }))
                  }}
                  placeholder={t("domainPlaceholder")}
                  disabled={editingIndex !== null}
                />
                {domainFormErrors.domain && (
                  <p className="text-sm text-destructive">{domainFormErrors.domain}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dialogApiKey">{t("apiKey")}</Label>
                <Input
                  id="dialogApiKey"
                  type="password"
                  value={domainForm.apiKey}
                  onChange={(e) => {
                    setDomainForm(prev => ({ ...prev, apiKey: e.target.value }))
                    setDomainFormErrors(prev => ({ ...prev, apiKey: "" }))
                  }}
                  placeholder={t("apiKeyPlaceholder")}
                />
                {domainFormErrors.apiKey && (
                  <p className="text-sm text-destructive">{domainFormErrors.apiKey}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDomainDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button onClick={handleSaveDomain}>
                {t("confirm")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 删除确认对话框 */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("deleteConfirm")}</AlertDialogTitle>
              <AlertDialogDescription>
                {deletingIndex !== null && config.apiKeys.keys[deletingIndex]?.domain}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteDomain}>
                {t("confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  )
} 