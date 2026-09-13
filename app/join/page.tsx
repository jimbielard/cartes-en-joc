import { JoinSessionForm } from "@/components/join-session-form";

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const params = await searchParams;
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-xl">
        <JoinSessionForm initialCode={params.code ?? ""} />
      </div>
    </main>
  );
}
