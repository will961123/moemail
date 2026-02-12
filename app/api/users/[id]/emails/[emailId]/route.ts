import { createDb } from "@/lib/db"
import { eq, and } from "drizzle-orm"
import { NextResponse } from "next/server"
import { emails, users, userRoles, roles } from "@/lib/schema"
import { getUserId } from "@/lib/apiKey"
import { ROLES } from "@/lib/permissions"

export const runtime = "edge"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; emailId: string }> }
) {
  const currentUserId = await getUserId()

  if (!currentUserId) {
    return NextResponse.json(
      { error: "未授权" },
      { status: 401 }
    )
  }

  try {
    const { id: targetUserId, emailId } = await params
    const db = createDb()

    // 检查目标用户是否是皇帝
    const userWithRoles = await db.query.users.findFirst({
      where: eq(users.id, targetUserId),
      with: {
        userRoles: {
          with: {
            role: true
          }
        }
      }
    })

    if (!userWithRoles) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      )
    }

    const isEmperor = userWithRoles.userRoles.some(
      ur => ur.role.name === ROLES.EMPEROR
    )

    if (isEmperor) {
      return NextResponse.json(
        { error: "不能删除皇帝用户的邮箱" },
        { status: 403 }
      )
    }

    // 检查邮箱是否存在且属于该用户
    const email = await db.query.emails.findFirst({
      where: and(
        eq(emails.id, emailId),
        eq(emails.userId, targetUserId)
      )
    })

    if (!email) {
      return NextResponse.json(
        { error: "邮箱不存在" },
        { status: 404 }
      )
    }

    // 删除邮箱（关联的消息会通过外键级联删除）
    await db.delete(emails).where(eq(emails.id, emailId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete email:', error)
    return NextResponse.json(
      { error: "删除邮箱失败" },
      { status: 500 }
    )
  }
}
