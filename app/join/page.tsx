import { JoinSessionForm } from "@/components/join-session-form";

export default async function JoinPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-xl">
        <JoinSessionForm />
      </div>
    </main>
  );
}
