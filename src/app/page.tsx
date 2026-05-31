import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Dashboard from "@/src/components/dashboard/Dashboard";

export default async function Home() {
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch (error) {
    console.error("Session verification failed:", error);
  }

  if (!session) {
    redirect("/login");
  }

  return <Dashboard user={session.user} />;
}