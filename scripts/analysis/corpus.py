"""Builds a player-season corpus (2015-2025) joining Sleeper season stats with
nflverse weekly market-share metrics. Writes corpus.json for the modeling step.

Spine is Sleeper (complete, pre-scored fantasy points, red-zone + snap data);
nflverse supplies target_share / air_yards_share / wopr / racr / EPA / cpoe.
Join is normalized name + position within a single season.
"""
import csv, gzip, io, json, os, re, sys
from collections import defaultdict
from datetime import date

CACHE = "/home/dotagenius/DraftList/.cache/nflstats"
OUT = os.path.join(os.path.dirname(__file__), "corpus.json")
SEASONS = list(range(2015, 2026))

SUFFIX = re.compile(r"\b(jr|sr|ii|iii|iv|v)\b")
def norm(name):
    s = (name or "").lower().replace("'", "").replace(".", "").replace("’", "")
    s = re.sub(r"[^a-z0-9\s-]", " ", s)
    s = SUFFIX.sub(" ", s)
    return re.sub(r"[\s-]+", "", s)

def load_gz(name):
    with gzip.open(os.path.join(CACHE, name + ".gz"), "rb") as f:
        return f.read()

def f(v):
    try:
        x = float(v)
        return x if x == x else 0.0
    except (TypeError, ValueError):
        return 0.0

# ---------------------------------------------------------------- sleeper ids
players = json.loads(load_gz("sleeper-players"))
meta = {}
for pid, p in players.items():
    pos = p.get("position")
    if not pos:
        continue
    meta[pid] = {
        "name": p.get("full_name") or "",
        "pos": pos,
        "birth": p.get("birth_date"),
    }

def age_at(birth, season):
    if not birth:
        return None
    try:
        y, m, d = [int(x) for x in birth.split("-")]
    except Exception:
        return None
    # Age on Sept 1 of that season.
    ref = date(season, 9, 1)
    return round((ref - date(y, m, d)).days / 365.25, 1)

# ------------------------------------------------------------ nflverse market
def nflverse_season(season):
    raw = load_gz(f"nflverse-week-{season}").decode("utf8", "replace")
    rows = [r for r in csv.DictReader(io.StringIO(raw)) if r.get("season_type") == "REG"]
    team_tot = defaultdict(lambda: [0.0, 0.0])  # (team,week) -> targets, air yards
    for r in rows:
        k = (r["team"], r["week"])
        team_tot[k][0] += f(r.get("targets"))
        team_tot[k][1] += f(r.get("receiving_air_yards"))
    agg = defaultdict(lambda: defaultdict(float))
    names = {}
    for r in rows:
        pid = r.get("player_id")
        if not pid:
            continue
        a = agg[pid]
        names[pid] = (r.get("player_display_name") or r.get("player_name"), r.get("position"))
        if r.get("team"):
            a.setdefault("teams", {})
            a["teams"][r["team"]] = a["teams"].get(r["team"], 0) + 1
        a["weeks"] += 1
        a["tgt"] += f(r.get("targets"))
        a["ay"] += f(r.get("receiving_air_yards"))
        a["recyd"] += f(r.get("receiving_yards"))
        tt = team_tot[(r["team"], r["week"])]
        a["tm_tgt"] += tt[0]
        a["tm_ay"] += tt[1]
        a["rec_epa"] += f(r.get("receiving_epa"))
        a["rush_epa"] += f(r.get("rushing_epa"))
        a["pass_epa"] += f(r.get("passing_epa"))
        att = f(r.get("attempts"))
        a["cpoe_w"] += f(r.get("passing_cpoe")) * att
        a["patt"] += att
        a["carries"] += f(r.get("carries"))
        a["tm_carries"] += 0  # filled below
    # team rush attempts per week for opportunity share
    team_rush = defaultdict(float)
    for r in rows:
        team_rush[(r["team"], r["week"])] += f(r.get("carries"))
    for r in rows:
        pid = r.get("player_id")
        if pid:
            agg[pid]["tm_carries"] += team_rush[(r["team"], r["week"])]
    out = {}
    for pid, a in agg.items():
        nm, pos = names[pid]
        ts = a["tgt"] / a["tm_tgt"] if a["tm_tgt"] else 0.0
        ays = a["ay"] / a["tm_ay"] if a["tm_ay"] else 0.0
        # Team the player logged the most weeks for, so an in-season trade
        # resolves to where he actually played rather than his last game.
        team = max(a["teams"].items(), key=lambda kv: kv[1])[0] if a.get("teams") else None
        out[(norm(nm), pos)] = {
            "team": team,
            "target_share": ts * 100,
            "air_yards_share": ays * 100,
            "wopr": 1.5 * ts + 0.7 * ays,
            "racr": (a["recyd"] / a["ay"]) if a["ay"] >= 50 and pos in ("WR", "TE") else None,
            "adot": (a["ay"] / a["tgt"]) if a["tgt"] >= 20 else None,
            "rec_epa": a["rec_epa"],
            "rush_epa": a["rush_epa"],
            "pass_epa": a["pass_epa"],
            "cpoe": (a["cpoe_w"] / a["patt"]) if a["patt"] >= 100 else None,
            "rush_share": (a["carries"] / a["tm_carries"] * 100) if a["tm_carries"] else 0.0,
        }
    return out

# ----------------------------------------------------------------- assemble
corpus = defaultdict(dict)   # season -> key -> record
for season in SEASONS:
    sl = json.loads(load_gz(f"sleeper-stats-{season}"))
    nv = nflverse_season(season)
    hits = 0
    for pid, raw in sl.items():
        if not isinstance(raw, dict):
            continue
        m = meta.get(pid)
        if not m or m["pos"] not in ("QB", "RB", "WR", "TE"):
            continue
        gp = f(raw.get("gp"))
        if gp < 1:
            continue
        key = (norm(m["name"]), m["pos"])
        rec = {
            "name": m["name"], "pos": m["pos"], "season": season, "gp": gp,
            "age": age_at(m["birth"], season),
            "pts_half": f(raw.get("pts_half_ppr")),
            "pts_ppr": f(raw.get("pts_ppr")),
            "pts_std": f(raw.get("pts_std")),
            "off_snp": f(raw.get("off_snp")), "tm_off_snp": f(raw.get("tm_off_snp")),
            "tgt": f(raw.get("rec_tgt")), "rec": f(raw.get("rec")),
            "rec_yd": f(raw.get("rec_yd")), "rec_td": f(raw.get("rec_td")),
            "rz_tgt": f(raw.get("rec_rz_tgt")), "rec_ay": f(raw.get("rec_air_yd")),
            "rush_att": f(raw.get("rush_att")), "rush_yd": f(raw.get("rush_yd")),
            "rush_td": f(raw.get("rush_td")), "rz_att": f(raw.get("rush_rz_att")),
            "pass_att": f(raw.get("pass_att")), "pass_yd": f(raw.get("pass_yd")),
            "pass_td": f(raw.get("pass_td")), "pass_int": f(raw.get("pass_int")),
            "pass_rz_att": f(raw.get("pass_rz_att")),
        }
        adv = nv.get(key)
        if adv:
            hits += 1
            rec.update(adv)
        corpus[season][key] = rec
    print(f"  {season}: {len(corpus[season])} player-seasons, {hits} joined to nflverse", file=sys.stderr)

json.dump({str(s): {f"{k[0]}|{k[1]}": v for k, v in d.items()} for s, d in corpus.items()},
          open(OUT, "w"))
print(f"wrote {OUT}", file=sys.stderr)
