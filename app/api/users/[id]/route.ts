import { createDb } from "@/lib/db"
import { NextResponse } from "next/server"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { getUserId } from "@/lib/apiKey"

export const runtime = "edge"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUserId = await getUserId()

  if (!currentUserId) {
    return NextResponse.json(
      { error: "未授权" },
      { status: 401 }
    )
  }

  try {
    const { id: targetUserId } = await params

    // 不能删除自己
    if (targetUserId === currentUserId) {
      return NextResponse.json(
        { error: "不能删除自己" },
        { status: 400 }
      )
    }

    const db = createDb()

    // 检查用户是否存在
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, targetUserId),
      with: {
        userRoles: {
          with: {
            role: true
          }
        }
      }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      )
    }

    // 检查是否是 EMPEROR 角色
    const isEmperor = targetUser.userRoles.some(ur => ur.role.name === 'emperor')
    if (isEmperor) {
      return NextResponse.json(
        { error: "不能删除皇帝角色的用户" },
        { status: 400 }
      )
    }

    // 删除用户（级联删除会自动处理相关数据）
    // 由于外键设置了 onDelete: "cascade"，以下数据会自动删除：
    // - accounts (OAuth 账号)
    // - emails (临时邮箱)
    // - messages (通过 emails 的级联删除)
    // - webhooks
    // - userRoles
    // - apiKeys
    await db.delete(users).where(eq(users.id, targetUserId))

    return NextResponse.json({
      success: true,
      message: "用户已删除"
    })
  } catch (error) {
    console.error('Failed to delete user:', error)
    return NextResponse.json(
      { error: "删除用户失败" },
      { status: 500 }
    )
  }
}
