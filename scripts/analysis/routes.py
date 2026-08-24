"""Estimated route participation and yards-per-route-run, from nflverse's
pbp_participation feed joined to full play-by-play for the dropback flag.

Not a real routes-run count: pbp_participation's `route` column is charted only
for the targeted receiver, so what's derivable here is "on the field for a
dropback" -- a player who stays in to pass-block counts the same as one who
released. That bias falls almost entirely on RB/TE (blocking backs, in-line
TEs); WRs are on a route on essentially every dropback they're in for, so the
proxy is close to exact there. Treat RB/TE numbers as upper bounds on route
share, not the real thing.

Participation only goes back to 2016 (corpus starts 2015), so this costs the
2015->2016 transition pair.

Requires nflverse-pbp-{season}.gz and nflverse-participation-{season}.gz in
.cache/nflstats/, fetched from the `pbp` and `pbp_participation` nflverse-data
releases (not fetched by any generator yet -- this is a research spike).
"""
import csv, gzip, io, os, re, sys
from collections import defaultdict
import numpy as np
from scipy import stats

sys.path.insert(0, os.path.dirname(__file__))
from metrics import DERIVED, SEASONS as CORPUS_SEASONS

CACHE = "/home/dotagenius/DraftList/.cache/nflstats"
ROUTE_SEASONS = [s for s in range(2016, 2026)]

SUFFIX = re.compile(r"\b(jr|sr|ii|iii|iv|v)\b")
def norm(name):
    s = (name or "").lower().replace("'", "").replace(".", "").replace("’", "")
    s = re.sub(r"[^a-z0-9\s-]", " ", s)
    s = SUFFIX.sub(" ", s)
    return re.sub(r"[\s-]+", "", s)

def load_gz_text(name):
    return gzip.open(f"{CACHE}/{name}.gz", "rb").read().decode("utf8", "replace")

# nflverse's own player crosswalk (25k rows) -- far more complete than
# Sleeper's gsis_id field, which is missing for plenty of star players
# (CeeDee Lamb, Justin Jefferson included). Only needed for 2016-2022: the
# participation feed didn't carry offense_names/offense_positions before 2023,
# so those seasons have to go through offense_players (gsis ids) instead.
def load_gsis_crosswalk():
    data = load_gz_text("nflverse-players")
    gsis_to_key = {}
    for r in csv.DictReader(io.StringIO(data)):
        g = (r.get("gsis_id") or "").strip()
        pos = r.get("position")
        if g and pos in ("WR", "RB", "TE"):
            gsis_to_key[g] = f"{norm(r.get('display_name'))}|{pos}"
    return gsis_to_key

GSIS_TO_KEY = load_gsis_crosswalk()

def routes_for_season(season):
    """-> {norm(name)|pos: routes_est}, {team: team_dropbacks}

    2023+: joins on the participation feed's own offense_names/offense_positions
    (confirmed positionally aligned with offense_players). Before 2023 those
    columns don't exist in the feed at all, so falls back to offense_players
    (gsis ids) resolved through nflverse's players crosswalk.
    """
    pbp = csv.DictReader(io.StringIO(load_gz_text(f"nflverse-pbp-{season}")))
    dropback_keys = set()
    team_dropbacks = defaultdict(int)
    for r in pbp:
        if r.get("season_type") != "REG" or r.get("qb_dropback") != "1":
            continue
        dropback_keys.add((r["game_id"], r["play_id"]))
        team_dropbacks[r["posteam"]] += 1

    part = csv.DictReader(io.StringIO(load_gz_text(f"nflverse-participation-{season}")))
    routes_est = defaultdict(int)
    for r in part:
        if (r["nflverse_game_id"], r["play_id"]) not in dropback_keys:
            continue
        names = (r.get("offense_names") or "").split(";")
        poss = (r.get("offense_positions") or "").split(";")
        if r.get("offense_names") and r.get("offense_positions") and len(names) == len(poss):
            for name, pos in zip(names, poss):
                if pos in ("WR", "RB", "TE"):
                    routes_est[f"{norm(name)}|{pos}"] += 1
        else:
            for pid in (r.get("offense_players") or "").split(";"):
                key = GSIS_TO_KEY.get(pid)
                if key:
                    routes_est[key] += 1
    return routes_est, team_dropbacks

_ATTACHED = False
def attach_route_features(verbose=False):
    """Mutates DERIVED in place, adding routes_est/route_share/yprr_est to every
    WR/RB/TE season 2016-2025. Idempotent -- safe for other scripts to import
    and call without recomputing on every import."""
    global _ATTACHED
    if _ATTACHED:
        return
    _ATTACHED = True
    for season in ROUTE_SEASONS:
        key_routes, team_dropbacks = routes_for_season(season)
        n_set = 0
        for key, rec in DERIVED.get(season, {}).items():
            if rec["pos"] not in ("WR", "RB", "TE"):
                continue
            r_est = key_routes.get(key)
            team = rec.get("team")
            tdb = team_dropbacks.get(team) if team else None
            if r_est is not None and tdb:
                rec["routes_est"] = r_est
                rec["route_share"] = r_est / tdb * 100
                rec["yprr_est"] = rec["rec_yd"] / r_est if r_est >= 30 else None
                n_set += 1
            else:
                rec["routes_est"] = rec["route_share"] = rec["yprr_est"] = None
        if verbose:
            print(f"  {season}: {n_set} WR/RB/TE seasons matched", file=sys.stderr)

def report(pos):
    print(f"\n{'='*90}\n{pos}: route_share / yprr_est as a year-N -> year-N+1 predictor\n{'='*90}")
    a, b = [], []
    for s in ROUTE_SEASONS[:-1]:
        nxt = DERIVED.get(s + 1)
        if not nxt:
            continue
        for key, rec in DERIVED[s].items():
            if rec["pos"] != pos or rec["gp"] < 8 or rec.get("route_share") is None:
                continue
            t = nxt.get(key)
            if not t or t["gp"] < 6:
                continue
            a.append(rec); b.append(t)
    if len(a) < 30:
        print(f"  n={len(a)}, too few to report")
        return
    nxt_ppg = np.array([r["ppg_half"] for r in b])
    cols = {
        "route_share": np.array([r["route_share"] for r in a]),
        "routes_est": np.array([r["routes_est"] for r in a], float),
        "yprr_est": np.array([r["yprr_est"] if r["yprr_est"] is not None else np.nan for r in a]),
        "tgt_pg (shipped)": np.array([r["tgt_pg"] for r in a]),
        "rec_yd_pg (shipped)": np.array([r["rec_yd_pg"] for r in a]),
        "target_share": np.array([r.get("target_share") or np.nan for r in a]),
        "snap_pct": np.array([r.get("snap_pct") if r.get("snap_pct") is not None else np.nan for r in a]),
    }
    print(f"  n={len(a)} transition pairs, {ROUTE_SEASONS[0]}-{ROUTE_SEASONS[-1]}")
    for name, x in cols.items():
        ok = ~np.isnan(x)
        rho, p = stats.spearmanr(x[ok], nxt_ppg[ok])
        print(f"    {name:<24} rho={rho:+.3f}  p={p:.1e}  n={ok.sum()}")

    # incremental value: does route_share/yprr_est add anything beyond what's
    # already shipped for this position?
    shipped = {"WR": ["rec_yd_pg", "tgt_pg"], "RB": ["scrim_yd_pg", "tgt_pg"],
               "TE": ["rec_yd_pg", "target_share"]}[pos]
    X = np.vstack([cols[c if c in cols else f"{c} (shipped)"] if c in cols else
                   np.array([r[c] for r in a]) for c in shipped] + [np.ones(len(a))]).T
    for name in ("route_share", "yprr_est"):
        y = cols[name]
        ok = ~np.isnan(y) & ~np.isnan(X).any(axis=1)
        coef, *_ = np.linalg.lstsq(X[ok], y[ok], rcond=None)
        resid = y[ok] - X[ok] @ coef
        rho, p = stats.spearmanr(resid, nxt_ppg[ok])
        print(f"    {name} | {'+'.join(shipped)} partial rho={rho:+.3f}  p={p:.1e}  n={ok.sum()}")

if __name__ == "__main__":
    print("building routes_est / team_dropbacks per season...", file=sys.stderr)
    attach_route_features(verbose=True)

    # sanity check: a known 2024 workhorse WR
    for key, rec in DERIVED[2024].items():
        if key.startswith("ceedeelamb") or key.startswith("justinjefferson"):
            print(key, {k: rec.get(k) for k in ("tgt", "rec_yd", "routes_est", "route_share", "yprr_est")})

    for pos in ("WR", "RB", "TE"):
        report(pos)
