/**
 * Resend API Key 配置工具函数
 */

export interface ResendApiKeyConfig {
  domain: string
  apiKey: string
}

export interface ResendApiKeysData {
  keys: ResendApiKeyConfig[]
}

/**
 * 从邮箱地址提取域名
 * @param email 邮箱地址
 * @returns 域名（小写）
 */
export function extractDomain(email: string): string {
  const parts = email.split('@')
  return parts.length === 2 ? parts[1].toLowerCase() : ''
}

/**
 * 根据发件人邮箱选择对应的 API Key（精确匹配）
 * @param fromEmail 发件人邮箱地址
 * @param config API Key 配置数据
 * @returns 匹配的 API Key，如果未找到返回 null
 */
export function selectApiKey(
  fromEmail: string,
  config: ResendApiKeysData | null
): string | null {
  if (!config || !config.keys || config.keys.length === 0) {
    return null
  }

  const domain = extractDomain(fromEmail)
  const matchedConfig = config.keys.find(k => k.domain.toLowerCase() === domain)

  return matchedConfig?.apiKey || null
}

/**
 * 验证域名格式
 * @param domain 域名
 * @returns 是否有效
 */
export function validateDomain(domain: string): boolean {
  // 域名格式：字母数字开头，可包含连字符和点，以字母结尾
  return /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i.test(domain)
}

/**
 * 验证 Resend API Key 格式
 * @param key API Key
 * @returns 是否有效
 */
export function validateApiKey(key: string): boolean {
  return key.trim().length > 0
}

/**
 * 验证完整的 API Keys 配置
 * @param config 配置数据
 * @returns 验证结果
 */
export function validateApiKeysConfig(
  config: ResendApiKeysData
): { valid: boolean; error?: string } {
  if (!config.keys || config.keys.length === 0) {
    return { valid: false, error: '至少需要配置一个域名' }
  }

  // 检查域名重复
  const domains = config.keys.map(k => k.domain.toLowerCase())
  const uniqueDomains = new Set(domains)
  if (domains.length !== uniqueDomains.size) {
    return { valid: false, error: '存在重复的域名配置' }
  }

  // 验证每个配置
  for (const item of config.keys) {
    if (!validateDomain(item.domain)) {
      return { valid: false, error: `域名格式错误: ${item.domain}` }
    }
    if (!validateApiKey(item.apiKey)) {
      return { valid: false, error: 'API Key 格式错误（应以 re_ 开头）' }
    }
  }

  return { valid: true }
}
