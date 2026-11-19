import Link from "next/link";

import { signOut } from "@/app/actions/auth";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/auth";

const ROLE_LABEL: Record<Profile["role"], string> = {
  patient: "Paciente",
  professional: "Profesional",
  companion: "Acompañante",
};

export function AppHeader({ profile }: { profile: Profile }) {
  return (
    <header className="glass sticky top-0 z-20 rounded-none border-x-0 border-t-0">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Logo href="/inicio" className="w-28" />
        <nav className="flex flex-wrap items-center justify-end gap-1 text-sm sm:gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/inicio">Inicio</Link>
          </Button>
          {profile.role === "professional" ? (
            <Button asChild variant="ghost" size="sm">
              <Link href="/informacion">Información</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/consejos">Consejos</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/juegos">Juegos</Link>
              </Button>
            </>
          )}
          <Button asChild variant="ghost" size="sm">
            <Link href="/vincular">Vincular</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/cuenta">Mi cuenta</Link>
          </Button>
          <span className="hidden text-muted-foreground md:inline">
            {profile.display_name} · {ROLE_LABEL[profile.role]}
          </span>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              Salir
            </Button>
          </form>
        </nav>
      </div>
    </header>
  );
}

export { ROLE_LABEL };
