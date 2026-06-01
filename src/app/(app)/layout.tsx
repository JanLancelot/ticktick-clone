import { auth } from "@/src/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { DashboardProvider } from "@/src/components/dashboard/DashboardContext"
import { CelebrationProvider } from "@/components/ui/CelebrationContext"
import AppShell from "@/src/components/dashboard/AppShell"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let session = null
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    })
  } catch (error) {
    console.error("Session verification failed in AppLayout:", error)
  }

  if (!session) {
    redirect("/login")
  }

  return (
    <DashboardProvider user={session.user}>
      <CelebrationProvider>
        <AppShell>{children}</AppShell>
      </CelebrationProvider>
    </DashboardProvider>
  )
}

