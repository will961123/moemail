/**
 * 用户角色定义
 *
 * 角色层级（从高到低）：
 * - EMPEROR（皇帝）：网站所有者，拥有所有权限
 * - DUKE（公爵）：高级用户，可管理临时邮箱及邮件、配置 Webhook、OpenAPI 部分权限
 * - KNIGHT（骑士）：普通用户，可管理临时邮箱及邮件、配置 Webhook
 * - CIVILIAN（平民）：访客，无使用权限
 */
export const ROLES = {
  /** 皇帝 - 网站所有者，拥有所有权限 */
  EMPEROR: 'emperor',
  /** 公爵 - 可管理临时邮箱及邮件、配置 Webhook、OpenAPI 部分权限 */
  DUKE: 'duke',
  /** 骑士 - 可管理临时邮箱及邮件、配置 Webhook */
  KNIGHT: 'knight',
  /** 平民 - 无使用权限 */
  CIVILIAN: 'civilian',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

/**
 * 权限定义
 *
 * 各权限说明：
 * - MANAGE_EMAIL: 管理临时邮箱及邮件（创建、查看、删除邮箱和邮件、管理分享链接）
 * - MANAGE_WEBHOOK: 配置 Webhook（设置邮件接收通知）
 * - MANAGE_CONFIG: 管理网站配置（系统设置、域名、默认角色等）
 * - MANAGE_API_KEY: 管理 API 密钥（创建、查看、删除 API Key）
 * - MANAGE_USER: 管理用户（查看、删除用户及其数据、管理用户角色）
 *
 */
export const PERMISSIONS = {
  /** 管理临时邮箱及邮件 - 创建、查看、删除邮箱和邮件、管理分享链接 */
  MANAGE_EMAIL: 'manage_email',
  /** 配置 Webhook - 设置邮件接收通知 */
  MANAGE_WEBHOOK: 'manage_webhook',
  /** 管理网站配置 - 系统设置、域名、默认角色等 */
  MANAGE_CONFIG: 'manage_config',
  /** 管理 API 密钥 - 创建、查看、删除 API Key */
  MANAGE_API_KEY: 'manage_api_key',
  /** 管理用户 - 查看、删除用户及其数据、管理用户角色 */
  MANAGE_USER: 'manage_user',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * 角色权限映射表
 *
 * 定义每个角色拥有的权限：
 * - EMPEROR: 拥有所有权限
 * - DUKE: 管理临时邮箱及邮件、配置 Webhook、管理 API 密钥
 * - KNIGHT: 管理临时邮箱及邮件、配置 Webhook
 * - CIVILIAN: 无任何权限
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // 皇帝：拥有所有权限
  [ROLES.EMPEROR]: Object.values(PERMISSIONS),

  // 公爵：管理临时邮箱及邮件、配置 Webhook、管理 API 密钥
  [ROLES.DUKE]: [
    PERMISSIONS.MANAGE_EMAIL,        // 可管理临时邮箱及邮件（包括分享链接）
    PERMISSIONS.MANAGE_WEBHOOK,      // 可配置邮件接收 Webhook 通知
    PERMISSIONS.MANAGE_API_KEY,      // 可创建和管理 API 密钥
  ],

  // 骑士：管理临时邮箱及邮件、配置 Webhook
  [ROLES.KNIGHT]: [
    PERMISSIONS.MANAGE_EMAIL,        // 可管理临时邮箱及邮件（包括分享链接）
    PERMISSIONS.MANAGE_WEBHOOK,      // 可配置邮件接收 Webhook 通知
  ],

  // 平民：无任何权限
  [ROLES.CIVILIAN]: [],
} as const;

/**
 * 检查用户是否拥有指定权限
 *
 * @param userRoles - 用户的角色列表
 * @param permission - 要检查的权限
 * @returns 如果用户拥有该权限则返回 true，否则返回 false
 */
export function hasPermission(userRoles: Role[], permission: Permission): boolean {
  return userRoles.some(role => ROLE_PERMISSIONS[role]?.includes(permission));
}
