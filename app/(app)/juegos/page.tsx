import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GAMES } from "@/components/games/catalog";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";

export const metadata: Metadata = { title: "Minijuegos" };

export default async function GamesPage() {
  const { profile } = await requireProfile();
  if (profile.role === "professional") redirect("/inicio");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Minijuegos</h1>
        <p className="mt-1 text-muted-foreground">
          Ejercicios cortos para entrenar la atención y la memoria. Son para practicar: los puntajes no se guardan ni
          cambian tus resultados.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((g) => (
          <Link key={g.slug} href={`/juegos/${g.slug}`} className="group">
            <Card className="h-full transition-colors group-hover:border-primary">
              <CardHeader>
                <Badge variant={g.domain === "Memoria" ? "lavender" : "cyan"} className="w-fit">
                  {g.domain}
                </Badge>
                <CardTitle>{g.name}</CardTitle>
                <CardDescription>{g.text}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
