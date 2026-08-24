"""Fits what DESIGNATION_RISK and BODY_PART_SEVERITY in draftScore.js currently
guess: given a player is carrying an injury designation, how many games does he
actually go on to miss?

Those two tables were written as priors, and the comment explaining why says the
ESPN feed only ever holds today's report, so there is no history to fit against.
That is true of ESPN. It is not true of nflverse, which publishes the weekly
league injury report for 2009-2025 with a status (Out / Doubtful / Questionable)
and the body part. This measures the thing the tables assert.

Method. For every weekly injury-report row, look forward over the next six
weeks and count how many of them the player did not appear in. Byes are excluded
by checking the team's real schedule, so a bye is never scored as a missed game.
Games after the regular season ends are not counted against him either.

Two honest limits:
  - IR / PUP cannot be fitted here. They are ESPN designations; the league
    report only carries Out / Doubtful / Questionable, so those three get fitted
    numbers and IR / PUP keep a prior (informed by the Out figure, which is the
    closest observable thing).
  - "Played" means the player appears in that week's stats file. A player who
    dressed and recorded nothing counts as absent. For skill players in a real
    role this is rare, and it biases every designation the same way.
"""
import csv, gzip, io, os, sys
from collections import defaultdict
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from routes import load_gz_text

SEASONS = list(range(2015, 2026))
CACHE = "/home/dotagenius/DraftList/.cache/nflstats"
FORWARD = 6  # weeks of look-ahead

# Body-part groups mirroring BODY_PART_SEVERITY's tiers, so the fit is directly
# comparable to what is shipped rather than a differently-cut set.
GROUPS = [
    ("season-ending", r"acl|achilles|torn|rupture|lisfranc"),
    ("surgical/fracture", r"surgery|fracture|broken"),
    ("knee/back/foot/hip", r"knee|back|foot|hip"),
    ("soft tissue/head", r"hamstring|groin|quad|calf|shoulder|concussion"),
]
import re
GROUP_RE = [(name, re.compile(pat, re.I)) for name, pat in GROUPS]

def group_of(text):
    for name, rx in GROUP_RE:
        if rx.search(text or ""):
            return name
    return "other"

def team_bye_weeks():
    """(season, team) -> set of weeks with no game."""
    played = defaultdict(set)
    weeks_in = defaultdict(set)
    for r in csv.DictReader(open(os.path.join(CACHE, "schedules.csv"))):
        if r.get("game_type") != "REG" or not r.get("week", "").isdigit():
            continue
        s, w = int(r["season"]), int(r["week"])
        weeks_in[s].add(w)
        played[(s, r["home_team"])].add(w)
        played[(s, r["away_team"])].add(w)
    return played, weeks_in

PLAYED_WEEKS, WEEKS_IN = team_bye_weeks()

def weeks_active(season):
    """gsis_id -> set of weeks the player appears in the weekly stats file."""
    out = defaultdict(set)
    for r in csv.DictReader(io.StringIO(load_gz_text(f"nflverse-week-{season}"))):
        if r.get("season_type") != "REG":
            continue
        pid, wk = r.get("player_id"), r.get("week")
        if pid and str(wk).isdigit():
            out[pid].add(int(wk))
    return out

def collect():
    rows = []
    for season in SEASONS:
        active = weeks_active(season)
        last_week = max(WEEKS_IN[season]) if WEEKS_IN.get(season) else 18
        raw = gzip.open(f"{CACHE}/nflverse-injuries-{season}.gz", "rb").read().decode("utf8", "replace")
        for r in csv.DictReader(io.StringIO(raw)):
            if r.get("game_type") != "REG" or r.get("position") not in ("QB", "RB", "WR", "TE"):
                continue
            status = (r.get("report_status") or "").strip()
            if not status:
                continue
            pid, team = r.get("gsis_id"), r.get("team")
            if not pid or not str(r.get("week", "")).isdigit():
                continue
            w0 = int(r["week"])
            team_weeks = PLAYED_WEEKS.get((season, team), set())
            missed = 0
            eligible = 0
            for w in range(w0, min(w0 + FORWARD, last_week + 1)):
                if w not in team_weeks:      # bye -- not a missed game
                    continue
                eligible += 1
                if w not in active.get(pid, set()):
                    missed += 1
            if eligible == 0:
                continue
            text = f"{r.get('report_primary_injury','')} {r.get('report_secondary_injury','')}"
            rows.append({
                "season": season, "status": status, "group": group_of(text),
                "injury": (r.get("report_primary_injury") or "").strip(),
                "missed": missed, "eligible": eligible,
                "missed_now": 0 if w0 in active.get(pid, set()) else 1,
                # normalise to a full six-week window so short end-of-season
                # look-aheads do not read as healthy
                "rate": missed / eligible,
            })
    return rows

if __name__ == "__main__":
    rows = collect()
    print(f"{len(rows)} player-week injury reports, {SEASONS[0]}-{SEASONS[-1]}, "
          f"{FORWARD}-week look-ahead\n")

    print("=" * 84)
    print("BY DESIGNATION  (what DESIGNATION_RISK asserts)")
    print("=" * 84)
    print(f"{'status':<14}{'n':>7}{'miss that week':>16}{'games missed /6wk':>20}{'shipped prior':>15}")
    SHIPPED = {"Out": 2, "Doubtful": 1.5, "Questionable": 1.5}
    by_status = {}
    for status in ("Out", "Doubtful", "Questionable"):
        sub = [r for r in rows if r["status"] == status]
        if not sub:
            continue
        now = np.mean([r["missed_now"] for r in sub])
        exp6 = np.mean([r["rate"] for r in sub]) * FORWARD
        by_status[status] = exp6
        print(f"{status:<14}{len(sub):>7}{now:>15.1%}{exp6:>20.2f}{SHIPPED.get(status, 0):>15.1f}")

    print("\n" + "=" * 84)
    print("BY BODY PART, WITHIN DESIGNATION  (what BODY_PART_SEVERITY asserts)")
    print("=" * 84)
    print(f"{'status':<14}{'body-part group':<22}{'n':>7}{'games missed /6wk':>20}{'multiplier':>13}")
    mult = defaultdict(dict)
    for status in ("Out", "Questionable"):
        base = by_status.get(status)
        for name, _ in GROUP_RE + [("other", None)]:
            sub = [r for r in rows if r["status"] == status and r["group"] == name]
            if len(sub) < 40:
                continue
            exp6 = np.mean([r["rate"] for r in sub]) * FORWARD
            m = exp6 / base if base else float("nan")
            mult[status][name] = m
            print(f"{status:<14}{name:<22}{len(sub):>7}{exp6:>20.2f}{m:>13.2f}")

    print("\n" + "=" * 84)
    print("SHIPPED MULTIPLIERS FOR COMPARISON")
    print("=" * 84)
    for name, mv in (("season-ending", 3), ("surgical/fracture", 2),
                     ("knee/back/foot/hip", 2), ("soft tissue/head", 1.2), ("other", 1.0)):
        got = mult.get("Questionable", {}).get(name)
        gotO = mult.get("Out", {}).get(name)
        print(f"  {name:<22} shipped x{mv:<5} fitted: Questionable "
              f"{('x%.2f' % got) if got else '   n/a'}   Out "
              f"{('x%.2f' % gotO) if gotO else '   n/a'}")

    # ---------------------------------------------------------------------
    # The six-week window above answers "what happens next", which is the right
    # question mid-season and the wrong one at a draft. A draft-time projection
    # needs REST OF SEASON. Early-season reports (weeks 1-4) are the closest
    # observable analogue to a player carrying a designation in August.
    print("\n" + "=" * 84)
    print("DRAFT-TIME ANALOGUE: weeks 1-4 reports -> games missed REST OF SEASON")
    print("=" * 84)
    early = defaultdict(list)
    for season in SEASONS:
        active = weeks_active(season)
        last_week = max(WEEKS_IN[season]) if WEEKS_IN.get(season) else 18
        raw = gzip.open(f"{CACHE}/nflverse-injuries-{season}.gz", "rb").read().decode("utf8", "replace")
        seen = set()
        for r in csv.DictReader(io.StringIO(raw)):
            if r.get("game_type") != "REG" or r.get("position") not in ("QB", "RB", "WR", "TE"):
                continue
            status = (r.get("report_status") or "").strip()
            pid, team = r.get("gsis_id"), r.get("team")
            if not status or not pid or not str(r.get("week", "")).isdigit():
                continue
            w0 = int(r["week"])
            if w0 > 4 or (season, pid) in seen:
                continue
            seen.add((season, pid))   # first early report per player-season only
            team_weeks = PLAYED_WEEKS.get((season, team), set())
            missed = sum(1 for w in range(w0, last_week + 1)
                         if w in team_weeks and w not in active.get(pid, set()))
            early[status].append(missed)
    print(f"{'status':<16}{'n':>7}{'games missed, rest of season':>32}{'shipped prior':>15}")
    for status in ("Out", "Doubtful", "Questionable"):
        v = early.get(status, [])
        if len(v) < 30:
            continue
        print(f"{status:<16}{len(v):>7}{np.mean(v):>32.2f}{SHIPPED.get(status,0):>15.1f}")
    print("\n  (these are TOTAL rest-of-season misses, so they replace the date-implied")
    print("   figure rather than adding to it -- see the note in draftScore.js)")

    print("\n" + "=" * 84)
    print("WHY THE SEVERE BODY-PART TIERS NEVER FIRED")
    print("=" * 84)
    from collections import Counter
    c = Counter(r["injury"] for r in rows if r["injury"])
    print("  most common report_primary_injury values:", ", ".join(
        f"{k}({v})" for k, v in c.most_common(10)))
    print("  Teams file a body part, not a diagnosis: 'Knee', never 'torn ACL'. The")
    print("  acl/achilles/torn/rupture and surgery/fracture tiers cannot match this")
    print("  feed at all, so they are UNTESTED here rather than disproven -- ESPN's")
    print("  free-text label, which is what draftScore.js actually matches against,")
    print("  is more descriptive than the league report.")
