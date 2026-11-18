import Link from "next/link";

import { Logo } from "@/components/brand";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ cuenta?: string }> }) {
  const { cuenta } = await searchParams;
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-4 py-16 text-center">
      {cuenta === "borrada" && <Alert variant="success">Tu cuenta y tus datos se borraron.</Alert>}
      <Logo className="w-64 sm:w-80" />
      <h1 className="text-3xl font-semibold sm:text-4xl">Conoce y cuida tu atención y tu memoria</h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        Neuravia te propone pruebas breves en el navegador, te muestra tus resultados y te da sugerencias para prevenir.
        Puedes hacerlas tú, con tu doctor o con un familiar.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/registro">Crear cuenta</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/login">Ya tengo cuenta</Link>
        </Button>
      </div>
      <p className="max-w-xl text-sm text-muted-foreground">
        Neuravia no da diagnósticos. Sus resultados son orientativos y no sustituyen la valoración de un profesional de la
        salud. Para personas de 18 a 45 años.{" "}
        <Link href="/privacidad" className="underline">
          Aviso de privacidad
        </Link>
      </p>
    </main>
  );
}
