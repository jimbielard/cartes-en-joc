import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { JoinSessionForm } from "@/components/join-session-form";

export default async function JoinPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-xl">
        <JoinSessionForm />
      </div>
    </main>
  );
}
