import { AppHeader } from "@/components/app-header";
import { requireProfile } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile();
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader profile={profile} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        Neuravia no da diagnósticos. Los resultados son orientativos.
      </footer>
    </div>
  );
}
