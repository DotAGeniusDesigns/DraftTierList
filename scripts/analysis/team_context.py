"""Team-level context features: offensive environment, line play, schedule.

Everything here must be knowable on draft day, so a feature attached to season
N+1 is always measured from season N. A player's team context is taken from the
team he will PLAY for in N+1 (which you know when you draft him), scored on how
that team performed in N. Strength of schedule uses the published N+1 fixture
list against each opponent's N defence.
"""
import csv, os
from collections import defaultdict
import numpy as np
from metrics import DERIVED, SEASONS
from corpus import load_gz

CACHE = "/home/dotagenius/DraftList/.cache/nflstats"

def num(v):
    try:
        x = float(v)
        return x if x == x else 0.0
    except (TypeError, ValueError):
        return 0.0

# ---------------------------------------------------------------- schedules
GAMES = [r for r in csv.DictReader(open(os.path.join(CACHE, "schedules.csv")))
         if r.get("game_type") == "REG"]

points_for = defaultdict(float)
points_against = defaultdict(float)
games_played = defaultdict(int)
for g in GAMES:
    s = int(g["season"])
    if g.get("result") in ("", "NA", None):
        continue
    h, a = g["home_team"], g["away_team"]
    hs, as_ = num(g["home_score"]), num(g["away_score"])
    points_for[(s, h)] += hs; points_against[(s, h)] += as_; games_played[(s, h)] += 1
    points_for[(s, a)] += as_; points_against[(s, a)] += hs; games_played[(s, a)] += 1

def def_strength(season, team):
    """Points allowed per game. Higher = weaker defence = friendlier matchup."""
    n = games_played.get((season, team), 0)
    return points_against[(season, team)] / n if n else None

def opponents(season, team):
    out = []
    for g in GAMES:
        if int(g["season"]) != season:
            continue
        if g["home_team"] == team:
            out.append(g["away_team"])
        elif g["away_team"] == team:
            out.append(g["home_team"])
    return out

def sos(season, team):
    """Mean opponent defensive weakness for `season`, priced off season-1 form."""
    vals = [def_strength(season - 1, o) for o in opponents(season, team)]
    vals = [v for v in vals if v is not None]
    return float(np.mean(vals)) if vals else None

# ------------------------------------------------------- offence from weekly
def team_offense(season):
    """Pace, pass lean, efficiency and line play, per team, for one season."""
    raw = load_gz(f"nflverse-week-{season}").decode("utf8", "replace")
    import io
    rows = [r for r in csv.DictReader(io.StringIO(raw)) if r.get("season_type") == "REG"]
    agg = defaultdict(lambda: defaultdict(float))
    weeks = defaultdict(set)
    for r in rows:
        t = r.get("team")
        if not t:
            continue
        a = agg[t]
        weeks[t].add(r.get("week"))
        a["att"] += num(r.get("attempts"))
        a["carries"] += num(r.get("carries"))
        a["pass_epa"] += num(r.get("passing_epa"))
        a["rush_epa"] += num(r.get("rushing_epa"))
        a["rush_yd"] += num(r.get("rushing_yards"))
        # Sacks taken is the cleanest line-play signal in this feed.
        a["sacks"] += num(r.get("sacks_suffered"))
    out = {}
    for t, a in agg.items():
        n = max(len(weeks[t]), 1)
        plays = a["att"] + a["carries"]
        out[t] = {
            "plays_pg": plays / n,
            "pass_rate": a["att"] / plays if plays else None,
            "off_epa_pg": (a["pass_epa"] + a["rush_epa"]) / n,
            # Sack rate and yards per carry are the two halves of line play the
            # feed can see: pass protection and run blocking.
            "sack_rate": a["sacks"] / (a["att"] + a["sacks"]) if (a["att"] + a["sacks"]) else None,
            "ypc": a["rush_yd"] / a["carries"] if a["carries"] else None,
            "points_pg": points_for[(season, t)] / games_played[(season, t)]
            if games_played.get((season, t)) else None,
        }
    return out

TEAM_OFFENSE = {s: team_offense(s) for s in SEASONS}
SOS = {}
for s in list(SEASONS) + [max(SEASONS) + 1]:
    for t in {g["home_team"] for g in GAMES if int(g["season"]) == s}:
        SOS[(s, t)] = sos(s, t)

def context_for(team, prior_season):
    """Team context for a player joining `team`, priced off `prior_season`."""
    off = TEAM_OFFENSE.get(prior_season, {}).get(team)
    if not off:
        return {}
    return {
        "team_plays_pg": off["plays_pg"],
        "team_pass_rate": (off["pass_rate"] * 100) if off["pass_rate"] is not None else None,
        "team_off_epa_pg": off["off_epa_pg"],
        "team_sack_rate": (off["sack_rate"] * 100) if off["sack_rate"] is not None else None,
        "team_ypc": off["ypc"],
        "team_points_pg": off["points_pg"],
        "sos": SOS.get((prior_season + 1, team)),
    }

if __name__ == "__main__":
    print("2026 strength of schedule (opponent points allowed per game in 2025)")
    rank = sorted(((v, t) for (s, t), v in SOS.items() if s == 2026 and v), reverse=True)
    print("  easiest:", ", ".join(f"{t} {v:.1f}" for v, t in rank[:6]))
    print("  hardest:", ", ".join(f"{t} {v:.1f}" for v, t in rank[-6:]))
    print("\n2025 team offence sample")
    for t in ("DET", "BAL", "CIN", "CLE"):
        c = context_for(t, 2025)
        print(f"  {t}: plays/g {c['team_plays_pg']:.1f}  pass% {c['team_pass_rate']:.1f}  "
              f"EPA/g {c['team_off_epa_pg']:+.1f}  sack% {c['team_sack_rate']:.1f}  "
              f"ypc {c['team_ypc']:.2f}  pts/g {c['team_points_pg']:.1f}  SOS {c['sos']:.1f}")
