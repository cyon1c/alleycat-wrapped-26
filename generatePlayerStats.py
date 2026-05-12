"""
Build stats-output from csv-exports: global.json, index.json, players/{id}.json
"""
from __future__ import annotations

import csv
import json
import math
import os
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Any

MIN_RANKED_MATCHES = 10
MAX_SANE_TIME = 3600
MATCHES_CSV = r"csv-exports\matches.csv"
PLAYERS_CSV = r"csv-exports\players.csv"
OUTPUT_DIR = "stats-output"
PLAYERS_SUBDIR = "players"
ANOMALOUS_MATCHES_CSV = "anomalous-matches.csv"
ANOMALOUS_MATCHES_JSON = "anomalous-matches.json"


def parseFloat(value: str) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except ValueError:
        return None


def reactionTimeIsInsane(t: float | None) -> bool:
    return t is None or t < 0 or t > MAX_SANE_TIME


def reactionTimeUsableForStats(t: float | None) -> bool:
    """Positive times within max; excludes 0 (invalid for rankings / time averages)."""
    return t is not None and 0 < t <= MAX_SANE_TIME


def assignCompetitionRanks(
    sortedPlayerIdsByWinsDesc: list[str],
    winsById: dict[str, int],
    totalMatchesById: dict[str, int],
) -> dict[str, int | None]:
    """Ranks only players with totalMatches >= MIN_RANKED_MATCHES; others None. Competition ranking (ties share rank)."""
    ranks: dict[str, int | None] = {pid: None for pid in sortedPlayerIdsByWinsDesc}
    eligible = [
        pid for pid in sortedPlayerIdsByWinsDesc if totalMatchesById.get(pid, 0) >= MIN_RANKED_MATCHES
    ]
    rank = 1
    i = 0
    while i < len(eligible):
        wins = winsById[eligible[i]]
        j = i
        while j < len(eligible) and winsById[eligible[j]] == wins:
            j += 1
        for k in range(i, j):
            ranks[eligible[k]] = rank
        rank += j - i
        i = j
    return ranks


def percentileLinear(sortedValues: list[float], p: float) -> float | None:
    if not sortedValues:
        return None
    if len(sortedValues) == 1:
        return sortedValues[0]
    k = (len(sortedValues) - 1) * (p / 100.0)
    floorIndex = int(math.floor(k))
    ceilIndex = int(math.ceil(k))
    if floorIndex == ceilIndex:
        return sortedValues[floorIndex]
    low = sortedValues[floorIndex]
    high = sortedValues[ceilIndex]
    return low + (k - floorIndex) * (high - low)


def computeTop3ClosestMatches(
    marginsWithMeta: list[tuple[float, str, int, float, float, str, str, str, str]],
) -> list[dict[str, Any]]:
    """
    Three smallest |hunter_time - bounty_time| among rankable matches (positive times, sane).
    Sort by margin, then rowid, then matchId; take the first three (so all three equal-time
    ties at margin 0 appear together when they are the three best).
    """
    if not marginsWithMeta:
        return []
    sortedM = sorted(marginsWithMeta, key=lambda x: (x[0], x[2], x[1]))
    out: list[dict[str, Any]] = []
    for m, mid, rid, ht, bt, hunterId, bountyId, hunterName, bountyName in sortedM[:3]:
        out.append(
            {
                "matchId": mid,
                "rowid": rid,
                "margin": m,
                "hunterId": hunterId,
                "hunterName": hunterName,
                "bountyId": bountyId,
                "bountyName": bountyName,
                "hunterTime": ht,
                "bountyTime": bt,
            }
        )
    return out


@dataclass
class MatchRecord:
    rowid: int
    matchId: str
    hunterId: str
    bountyId: str
    hunterTime: float
    bountyTime: float
    hunterWon: bool
    sane: bool


@dataclass
class PlayerAccumulator:
    playerId: str
    role: str
    name: str
    faction: str
    matches: list[tuple[int, bool, float, str, float, float, bool]] = field(default_factory=list)
    # each: (rowid, won, myTime, opponentId, hunterTime, bountyTime, sane)
    winsVs: defaultdict[str, int] = field(default_factory=lambda: defaultdict(int))
    lossesVs: defaultdict[str, int] = field(default_factory=lambda: defaultdict(int))


def longestStreaks(wonSequence: list[bool]) -> tuple[int, int, dict[str, Any]]:
    if not wonSequence:
        return 0, 0, {"type": "none", "count": 0}
    bestWin = bestLoss = 0
    curWin = curLoss = 0
    for w in wonSequence:
        if w:
            curWin += 1
            curLoss = 0
            bestWin = max(bestWin, curWin)
        else:
            curLoss += 1
            curWin = 0
            bestLoss = max(bestLoss, curLoss)
    last = wonSequence[-1]
    if last:
        curType, curCount = "win", curWin
    else:
        curType, curCount = "loss", curLoss
    return bestWin, bestLoss, {"type": curType, "count": curCount}


def winRateSlice(sliceWins: list[bool]) -> float | None:
    if not sliceWins:
        return None
    return sum(1 for x in sliceWins if x) / len(sliceWins)


def main() -> None:
    playersMeta: dict[str, dict[str, Any]] = {}
    with open(PLAYERS_CSV, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            pid = row["id"].strip()
            isHunter = row.get("hunter", "").strip() == "1"
            playersMeta[pid] = {
                "name": row.get("name", pid) or pid,
                "role": "hunter" if isHunter else "bounty",
                "faction": (row.get("faction") or "").strip(),
            }

    accum: dict[str, PlayerAccumulator] = {}

    def getAcc(pid: str) -> PlayerAccumulator:
        if pid not in accum:
            meta = playersMeta.get(pid, {"name": pid, "role": "unknown", "faction": ""})
            accum[pid] = PlayerAccumulator(
                playerId=pid,
                role=meta["role"],
                name=meta["name"],
                faction=meta["faction"],
            )
        return accum[pid]

    matchesOrdered: list[MatchRecord] = []
    hunterWinsTotal = 0
    bountyWinsTotal = 0
    anomalousRows: list[dict[str, Any]] = []

    saneHunterTimes: list[tuple[float, dict[str, Any]]] = []
    saneBountyTimes: list[tuple[float, dict[str, Any]]] = []
    marginsForClosest: list[tuple[float, str, int, float, float, str, str, str, str]] = []

    sumHunterTimeRankable = 0.0
    sumBountyTimeRankable = 0.0
    hunterTimeCountForAvg = 0
    bountyTimeCountForAvg = 0

    with open(MATCHES_CSV, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            matchId = row["match_id"].strip()
            hunterId = row["hunter"].strip()
            bountyId = row["bounty"].strip()
            ht = parseFloat(row.get("hunter_time", ""))
            bt = parseFloat(row.get("bounty_time", ""))
            wih = row.get("winner_is_hunter", "").strip() in ("1", "true", "True")
            rowid = int(row["rowid"])

            insane = reactionTimeIsInsane(ht) or reactionTimeIsInsane(bt)
            if insane:
                hunterName = playersMeta.get(hunterId, {}).get("name", hunterId)
                bountyName = playersMeta.get(bountyId, {}).get("name", bountyId)
                hunterInsane = reactionTimeIsInsane(ht)
                bountyInsane = reactionTimeIsInsane(bt)
                insaneParts: list[str] = []
                if hunterInsane:
                    insaneParts.append(f"{hunterName} (hunter), hunterTime={ht}")
                if bountyInsane:
                    insaneParts.append(f"{bountyName} (bounty), bountyTime={bt}")
                anomalousRows.append(
                    {
                        "matchId": matchId,
                        "rowid": rowid,
                        "hunterId": hunterId,
                        "hunterName": hunterName,
                        "bountyId": bountyId,
                        "bountyName": bountyName,
                        "hunterTime": ht,
                        "bountyTime": bt,
                        "hunterReactionTimeInsane": hunterInsane,
                        "bountyReactionTimeInsane": bountyInsane,
                        "insanePlayersSummary": "; ".join(insaneParts),
                        "winnerIsHunter": wih,
                    }
                )

            rec = MatchRecord(
                rowid=rowid,
                matchId=matchId,
                hunterId=hunterId,
                bountyId=bountyId,
                hunterTime=ht if ht is not None else -1.0,
                bountyTime=bt if bt is not None else -1.0,
                hunterWon=wih,
                sane=not insane,
            )
            matchesOrdered.append(rec)

            if wih:
                hunterWinsTotal += 1
            else:
                bountyWinsTotal += 1

            if not insane:
                if reactionTimeUsableForStats(ht):
                    sumHunterTimeRankable += ht
                    hunterTimeCountForAvg += 1
                if reactionTimeUsableForStats(bt):
                    sumBountyTimeRankable += bt
                    bountyTimeCountForAvg += 1

                if reactionTimeUsableForStats(ht) and reactionTimeUsableForStats(bt):
                    margin = abs(ht - bt)
                    hunterName = playersMeta.get(hunterId, {}).get("name", hunterId)
                    bountyName = playersMeta.get(bountyId, {}).get("name", bountyId)
                    marginsForClosest.append(
                        (margin, matchId, rowid, ht, bt, hunterId, bountyId, hunterName, bountyName)
                    )

                hunterName = playersMeta.get(hunterId, {}).get("name", hunterId)
                bountyName = playersMeta.get(bountyId, {}).get("name", bountyId)
                if reactionTimeUsableForStats(ht):
                    saneHunterTimes.append(
                        (ht, {"matchId": matchId, "hunterId": hunterId, "hunterName": hunterName, "hunterTime": ht})
                    )
                if reactionTimeUsableForStats(bt):
                    saneBountyTimes.append(
                        (bt, {"matchId": matchId, "bountyId": bountyId, "bountyName": bountyName, "bountyTime": bt})
                    )

            hunterWon = wih
            bountyWon = not wih

            saneFlag = not insane
            ha = getAcc(hunterId)
            ha.matches.append(
                (rowid, hunterWon, ht if ht is not None else 0.0, bountyId, ht or 0.0, bt or 0.0, saneFlag)
            )
            if hunterWon:
                ha.winsVs[bountyId] += 1
            else:
                ha.lossesVs[bountyId] += 1

            ba = getAcc(bountyId)
            ba.matches.append(
                (rowid, bountyWon, bt if bt is not None else 0.0, hunterId, ht or 0.0, bt or 0.0, saneFlag)
            )
            if bountyWon:
                ba.winsVs[hunterId] += 1
            else:
                ba.lossesVs[hunterId] += 1

    totalMatches = len(matchesOrdered)
    hunterWinRate = hunterWinsTotal / totalMatches if totalMatches else 0.0
    bountyWinRate = bountyWinsTotal / totalMatches if totalMatches else 0.0

    avgHunterTime = (
        sumHunterTimeRankable / hunterTimeCountForAvg if hunterTimeCountForAvg else None
    )
    avgBountyTime = (
        sumBountyTimeRankable / bountyTimeCountForAvg if bountyTimeCountForAvg else None
    )

    saneHunterTimes.sort(key=lambda x: (x[0], x[1]["matchId"]))
    saneBountyTimes.sort(key=lambda x: (x[0], x[1]["matchId"]))
    top3Hunter = [t[1] for t in saneHunterTimes[:3]]
    top3Bounty = [t[1] for t in saneBountyTimes[:3]]

    top3ClosestMatches = computeTop3ClosestMatches(marginsForClosest)

    totalMatchSeconds = sum(
        m.hunterTime + m.bountyTime
        for m in matchesOrdered
        if m.sane and reactionTimeUsableForStats(m.hunterTime) and reactionTimeUsableForStats(m.bountyTime)
    )

    # Ensure every registered player exists in accum (zero matches)
    for pid in playersMeta:
        getAcc(pid)

    activeIds = {pid for pid, a in accum.items() if len(a.matches) > 0}
    totalPlayersActive = len(activeIds)
    totalHuntersActive = sum(1 for pid in activeIds if accum[pid].role == "hunter")
    totalBountiesActive = sum(1 for pid in activeIds if accum[pid].role == "bounty")

    perPlayerStats: dict[str, dict[str, Any]] = {}

    for pid, a in accum.items():
        a.matches.sort(key=lambda t: t[0])
        wonSeq = [m[1] for m in a.matches]
        timeValues = [m[2] for m in a.matches if m[6] and m[2] > 0]
        totalGames = len(a.matches)
        wins = sum(1 for w in wonSeq if w)
        losses = totalGames - wins
        winRate = wins / totalGames if totalGames else 0.0

        fastestTime = min(timeValues) if timeValues else None
        slowestTime = max(timeValues) if timeValues else None
        avgTime = sum(timeValues) / len(timeValues) if timeValues else None
        totalTimeSeconds = sum(timeValues)

        lw, ll, currentStreak = longestStreaks(wonSeq)

        opponents: set[str] = set()
        for _, _, _, opp, _, _, _ in a.matches:
            opponents.add(opp)
        uniqueOpponents = len(opponents)

        def bestOpponent(
            counts: defaultdict[str, int],
        ) -> dict[str, Any] | None:
            if not counts:
                return None
            best = max(counts.values())
            candidates = sorted([oid for oid, c in counts.items() if c == best])
            oid = candidates[0]
            name = playersMeta.get(oid, {}).get("name", oid)
            return {"id": oid, "name": name, "count": counts[oid]}

        nemesisPick = bestOpponent(a.lossesVs)
        preyPick = bestOpponent(a.winsVs)
        nemesis = None
        if nemesisPick:
            nemesis = {"id": nemesisPick["id"], "name": nemesisPick["name"], "lossesTo": nemesisPick["count"]}
        prey = None
        if preyPick:
            prey = {"id": preyPick["id"], "name": preyPick["name"], "winsAgainst": preyPick["count"]}

        totalVs: defaultdict[str, int] = defaultdict(int)
        for oid in set(a.winsVs) | set(a.lossesVs):
            totalVs[oid] = a.winsVs[oid] + a.lossesVs[oid]
        rival = None
        if totalVs:
            bestTotal = max(totalVs.values())
            oid = sorted([k for k, v in totalVs.items() if v == bestTotal])[0]
            rival = {
                "id": oid,
                "name": playersMeta.get(oid, {}).get("name", oid),
                "totalMatches": totalVs[oid],
            }

        topOpponentsList: list[dict[str, Any]] = []
        for oid in sorted(totalVs.keys(), key=lambda x: (-totalVs[x], x))[:5]:
            w = a.winsVs[oid]
            l = a.lossesVs[oid]
            topOpponentsList.append(
                {
                    "id": oid,
                    "name": playersMeta.get(oid, {}).get("name", oid),
                    "wins": w,
                    "losses": l,
                    "totalMatches": w + l,
                }
            )

        n = len(wonSeq)
        if n >= 3:
            third = max(1, n // 3)
            early = wonSeq[:third]
            late = wonSeq[-third:]
        else:
            early = wonSeq
            late = wonSeq
        performanceArc = {
            "earlyWinRate": winRateSlice(early),
            "lateWinRate": winRateSlice(late),
        }

        escapeRate = None
        if a.role == "bounty" and totalGames:
            escapes = sum(1 for m in a.matches if m[1])
            escapeRate = escapes / totalGames

        marginsOnWins: list[float] = []
        for _, won, _, _, hTime, bTime, sane in a.matches:
            if won and sane and hTime > 0 and bTime > 0:
                marginsOnWins.append(abs(hTime - bTime))
        avgMarginOfVictory = sum(marginsOnWins) / len(marginsOnWins) if marginsOnWins else None

        perPlayerStats[pid] = {
            "id": pid,
            "name": a.name,
            "role": a.role,
            "faction": a.faction,
            "totalMatches": totalGames,
            "wins": wins,
            "losses": losses,
            "winRate": winRate,
            "avgTime": avgTime,
            "fastestTime": fastestTime,
            "slowestTime": slowestTime,
            "totalTimeSeconds": totalTimeSeconds,
            "longestWinStreak": lw,
            "longestLossStreak": ll,
            "currentStreak": currentStreak,
            "uniqueOpponents": uniqueOpponents,
            "nemesis": nemesis,
            "prey": prey,
            "rival": rival,
            "topOpponents": topOpponentsList,
            "performanceArc": performanceArc,
            "escapeRate": escapeRate,
            "avgMarginOfVictory": avgMarginOfVictory,
        }

    winStreaks = [perPlayerStats[pid]["longestWinStreak"] for pid in activeIds]
    lossStreaks = [perPlayerStats[pid]["longestLossStreak"] for pid in activeIds]
    avgWinStreak = sum(winStreaks) / len(winStreaks) if winStreaks else None
    avgLossStreak = sum(lossStreaks) / len(lossStreaks) if lossStreaks else None

    matchCountsList = sorted([perPlayerStats[pid]["totalMatches"] for pid in activeIds])
    matchCountPercentiles = None
    if matchCountsList:
        matchCountPercentiles = {
            "p25": percentileLinear([float(x) for x in matchCountsList], 25),
            "p50": percentileLinear([float(x) for x in matchCountsList], 50),
            "p75": percentileLinear([float(x) for x in matchCountsList], 75),
            "p90": percentileLinear([float(x) for x in matchCountsList], 90),
            "p99": percentileLinear([float(x) for x in matchCountsList], 99),
        }

    byWins = sorted(activeIds, key=lambda p: (-perPlayerStats[p]["wins"], p))
    winsById = {pid: perPlayerStats[pid]["wins"] for pid in activeIds}
    totalMatchesById = {pid: perPlayerStats[pid]["totalMatches"] for pid in activeIds}
    globalRanksRaw = assignCompetitionRanks(byWins, winsById, totalMatchesById)

    huntersOnly = sorted(
        [pid for pid in activeIds if perPlayerStats[pid]["role"] == "hunter"],
        key=lambda p: (-perPlayerStats[p]["wins"], p),
    )
    bountiesOnly = sorted(
        [pid for pid in activeIds if perPlayerStats[pid]["role"] == "bounty"],
        key=lambda p: (-perPlayerStats[p]["wins"], p),
    )
    roleRankHunter = assignCompetitionRanks(huntersOnly, winsById, totalMatchesById)
    roleRankBounty = assignCompetitionRanks(bountiesOnly, winsById, totalMatchesById)

    def topPlayersBy(
        key: str,
        valueField: str,
        n: int = 10,
    ) -> list[dict[str, Any]]:
        ordered = sorted(activeIds, key=lambda p: (-perPlayerStats[p][key], p))
        out: list[dict[str, Any]] = []
        for pid in ordered[:n]:
            out.append(
                {
                    "playerId": pid,
                    "name": perPlayerStats[pid]["name"],
                    valueField: perPlayerStats[pid][key],
                }
            )
        return out

    top10MostMatchesPlayed = topPlayersBy("totalMatches", "totalMatches")
    top10LongestWinStreaks = topPlayersBy("longestWinStreak", "streak")
    top10MostUniqueOpponents = topPlayersBy("uniqueOpponents", "uniqueOpponents")

    # Fastest average reaction time among players with enough matches and a valid avgTime
    eligibleForFastest = [
        pid for pid in activeIds
        if perPlayerStats[pid]["avgTime"] is not None
        and perPlayerStats[pid]["totalMatches"] >= MIN_RANKED_MATCHES
    ]
    top10FastestAvgTimes = [
        {
            "playerId": pid,
            "name": perPlayerStats[pid]["name"],
            "avgTime": perPlayerStats[pid]["avgTime"],
        }
        for pid in sorted(eligibleForFastest, key=lambda p: perPlayerStats[p]["avgTime"])[:10]
    ]

    globalPayload = {
        "totalMatches": totalMatches,
        "totalPlayersRegistered": len(playersMeta),
        "totalPlayersActive": totalPlayersActive,
        "totalHuntersActive": totalHuntersActive,
        "totalBountiesActive": totalBountiesActive,
        "hunterWinRate": hunterWinRate,
        "bountyWinRate": bountyWinRate,
        "avgHunterTime": avgHunterTime,
        "avgBountyTime": avgBountyTime,
        "avgWinStreak": avgWinStreak,
        "avgLossStreak": avgLossStreak,
        "top3FastestHunterTimes": top3Hunter,
        "top3FastestBountyTimes": top3Bounty,
        "top3ClosestMatches": top3ClosestMatches,
        "top10MostMatchesPlayed": top10MostMatchesPlayed,
        "top10LongestWinStreaks": top10LongestWinStreaks,
        "top10MostUniqueOpponents": top10MostUniqueOpponents,
        "top10FastestAvgTimes": top10FastestAvgTimes,
        "matchCountPercentiles": matchCountPercentiles,
        "totalMatchSeconds": totalMatchSeconds,
        "anomalousMatches": anomalousRows,
        "maxSaneTimeSeconds": MAX_SANE_TIME,
        "minRankedMatches": MIN_RANKED_MATCHES,
        "excludesZeroReactionTimesFromTimeStats": True,
    }

    indexList: list[dict[str, Any]] = []
    allPlayerIds = sorted(set(playersMeta.keys()) | activeIds)

    for pid in allPlayerIds:
        s = perPlayerStats.get(
            pid,
            {
                "id": pid,
                "name": playersMeta.get(pid, {}).get("name", pid),
                "role": playersMeta.get(pid, {}).get("role", "unknown"),
                "faction": playersMeta.get(pid, {}).get("faction", ""),
                "totalMatches": 0,
                "wins": 0,
                "losses": 0,
                "winRate": 0.0,
                "avgTime": None,
                "fastestTime": None,
            },
        )
        gr = globalRanksRaw.get(pid)
        rr = None
        if s["role"] == "hunter":
            rr = roleRankHunter.get(pid)
        elif s["role"] == "bounty":
            rr = roleRankBounty.get(pid)

        indexList.append(
            {
                "id": s["id"],
                "name": s["name"],
                "role": s["role"],
                "faction": s["faction"],
                "totalMatches": s["totalMatches"],
                "wins": s["wins"],
                "losses": s["losses"],
                "winRate": s["winRate"],
                "globalRank": gr,
                "roleRank": rr,
                "avgTime": s["avgTime"],
                "fastestTime": s["fastestTime"],
            }
        )

    os.makedirs(os.path.join(OUTPUT_DIR, PLAYERS_SUBDIR), exist_ok=True)

    globalPath = os.path.join(OUTPUT_DIR, "global.json")
    with open(globalPath, "w", encoding="utf-8") as f:
        json.dump(globalPayload, f, indent=2, ensure_ascii=False)
        f.write("\n")

    anomalyCsvPath = os.path.join(OUTPUT_DIR, ANOMALOUS_MATCHES_CSV)
    anomalyJsonPath = os.path.join(OUTPUT_DIR, ANOMALOUS_MATCHES_JSON)
    anomalyFieldnames = [
        "rowid",
        "matchId",
        "hunterId",
        "hunterName",
        "hunterTime",
        "hunterReactionTimeInsane",
        "bountyId",
        "bountyName",
        "bountyTime",
        "bountyReactionTimeInsane",
        "winnerIsHunter",
        "insanePlayersSummary",
    ]
    with open(anomalyCsvPath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=anomalyFieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(anomalousRows)
    with open(anomalyJsonPath, "w", encoding="utf-8") as f:
        json.dump(anomalousRows, f, indent=2, ensure_ascii=False)
        f.write("\n")

    indexPath = os.path.join(OUTPUT_DIR, "index.json")
    with open(indexPath, "w", encoding="utf-8") as f:
        json.dump(indexList, f, indent=2, ensure_ascii=False)
        f.write("\n")

    for pid in allPlayerIds:
        s = perPlayerStats.get(pid)
        if s is None:
            detail = {
                "id": pid,
                "name": playersMeta[pid]["name"],
                "role": playersMeta[pid]["role"],
                "faction": playersMeta[pid]["faction"],
                "totalMatches": 0,
                "wins": 0,
                "losses": 0,
                "winRate": 0.0,
                "globalRank": None,
                "roleRank": None,
                "avgTime": None,
                "fastestTime": None,
                "slowestTime": None,
                "totalTimeSeconds": 0,
                "longestWinStreak": 0,
                "longestLossStreak": 0,
                "currentStreak": {"type": "none", "count": 0},
                "uniqueOpponents": 0,
                "nemesis": None,
                "prey": None,
                "rival": None,
                "topOpponents": [],
                "performanceArc": {"earlyWinRate": None, "lateWinRate": None},
                "escapeRate": None,
                "avgMarginOfVictory": None,
            }
        else:
            gr = globalRanksRaw.get(pid)
            rr = None
            if s["role"] == "hunter":
                rr = roleRankHunter.get(pid)
            elif s["role"] == "bounty":
                rr = roleRankBounty.get(pid)
            detail = {**s, "globalRank": gr, "roleRank": rr}

        outPlayer = os.path.join(OUTPUT_DIR, PLAYERS_SUBDIR, f"{pid}.json")
        with open(outPlayer, "w", encoding="utf-8") as f:
            json.dump(detail, f, indent=2, ensure_ascii=False)
            f.write("\n")

    print(
        f"Wrote {globalPath}, {anomalyCsvPath}, {anomalyJsonPath}, {indexPath}, "
        f"and {len(allPlayerIds)} player files under {OUTPUT_DIR}/{PLAYERS_SUBDIR}/"
    )


if __name__ == "__main__":
    main()
