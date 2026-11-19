import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="aurora flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">No encontramos esta página</h1>
      <p className="text-muted-foreground">Puede que no exista o que no tengas acceso.</p>
      <Button asChild>
        <Link href="/inicio">Ir al inicio</Link>
      </Button>
    </main>
  );
}
