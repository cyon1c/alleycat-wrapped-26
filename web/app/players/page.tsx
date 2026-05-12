import { getAllPlayers, getGlobalStats } from "@/lib/data";
import PlayerSearch from "@/components/playerSearch";
import { formatNumber } from "@/lib/utils";

export const metadata = {
  title: "Assets // Alleycat Wrapped '26",
};

export default function PlayersPage() {
  const players = getAllPlayers();
  const global = getGlobalStats();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="font-sub text-2xl md:text-3xl text-[var(--cyan)] glow-cyan mb-2">
          // ASSETS
        </h1>
        <p className="font-body text-[var(--text-dim)] text-sm">
          {formatNumber(global.totalPlayersActive)} active ·{" "}
          {formatNumber(global.totalPlayersRegistered)} registered ·{" "}
          {formatNumber(global.totalMatches)} matches
        </p>
      </div>

      <PlayerSearch players={players} />
    </div>
  );
}
