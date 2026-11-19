import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { GAMES } from "@/components/games/catalog";
import { GameView } from "@/components/games/game-view";
import { requireProfile } from "@/lib/auth";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: GAMES.find((g) => g.slug === slug)?.name ?? "Minijuego" };
}

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = GAMES.find((g) => g.slug === slug);
  if (!game) notFound();
  const { profile } = await requireProfile();
  if (profile.role === "professional") redirect("/inicio");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/juegos" className="text-sm text-primary hover:underline">
          ← Minijuegos
        </Link>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{game.name}</h1>
        <p className="mt-1 text-muted-foreground">{game.text}</p>
      </div>
      <GameView slug={game.slug} />
    </div>
  );
}
