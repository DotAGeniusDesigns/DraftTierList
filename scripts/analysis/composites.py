"""Compound / qualified metrics -- stats built by combining or splitting other
stats, rather than new raw inputs.

The idea behind every one of these: two numbers that are individually ambiguous
become unambiguous together, because combining them cancels a confound. Raw
separation is confounded by route depth; raw target share is confounded by
whether the role was held all year or inherited for four games; raw rushing
production is a mix of what the line gave and what the back earned.

Everything here is knowable in August of the season being predicted. All of it
is built from feeds already cached by routes.py / rbrate.py / ngsrecv.py plus
the weekly and play-by-play files.

Built here
----------
late_tgt_pg, late_touch_pg, late_ppg     final four games played, not the season
                                         average -- "how did he finish"
role_trend_tgt, role_trend_touch         late-four minus season average
tgt_share_cv                             weekly target-share volatility: a role
                                         held every week vs one inherited for a
                                         few games while someone was hurt
games_above_role                         weeks at >=15% target share
gl_att_pg, gl_share                      carries inside the FIVE, not the 20
qb_designed_pg, qb_scramble_pg           designed QB runs (scheme, sticky) vs
                                         scrambles (pressure, injury exposure)
xfp_pg, fp_over_xfp                      expected fantasy points from the
                                         opportunity mix, and actual minus it
sep_oe                                   NGS separation residualised on aDOT
light_box_pct                            share of carries against <8 in the box
yac_att, ybc_att, portable_share         PFR's before/after-contact split; the
                                         portable share is what a back takes
                                         with him when he changes teams
air_yd_pg                                absolute intended air yards per game
"""
import csv, io, json, os, sys
from collections import defaultdict
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from metrics import DERIVED, SEASONS
from routes import load_gz_text, norm

CACHE = "/home/dotagenius/DraftList/.cache/nflstats"
PBP_CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "composites_pbp.json")
POS = ("QB", "RB", "WR", "TE")

def full_crosswalk():
    """gsis_id -> norm(name)|pos, all four positions (routes.py's is WR/RB/TE)."""
    out = {}
    for r in csv.DictReader(io.StringIO(load_gz_text("nflverse-players"))):
        g = (r.get("gsis_id") or "").strip()
        if g and r.get("position") in POS:
            out[g] = f"{norm(r.get('display_name'))}|{r['position']}"
    return out

GSIS = full_crosswalk()

# ----------------------------------------------------------------- weekly ---
def weekly_features(season):
    """Late-season role, role volatility, weekly target-share spread."""
    rows = [r for r in csv.DictReader(io.StringIO(load_gz_text(f"nflverse-week-{season}")))
            if r.get("season_type") == "REG" and r.get("position") in POS]
    team_tgt = defaultdict(float)
    for r in rows:
        if r.get("team") and r.get("week"):
            try:
                team_tgt[(r["team"], r["week"])] += float(r.get("targets") or 0)
            except ValueError:
                pass

    per = defaultdict(list)
    for r in rows:
        key = f"{norm(r.get('player_display_name') or r.get('player_name'))}|{r['position']}"
        def f(k):
            try:
                return float(r.get(k) or 0)
            except ValueError:
                return 0.0
        tt = team_tgt.get((r.get("team"), r.get("week")), 0.0)
        per[key].append({
            "week": int(r["week"]) if str(r.get("week", "")).isdigit() else 0,
            "tgt": f("targets"), "car": f("carries"), "rec": f("receptions"),
            "half": f("fantasy_points") + 0.5 * f("receptions"),
            "tgt_share": (f("targets") / tt * 100) if tt > 0 else np.nan,
        })

    out = {}
    for key, wks in per.items():
        wks.sort(key=lambda w: w["week"])
        n = len(wks)
        if n == 0:
            continue
        late = wks[-4:] if n >= 4 else wks
        mean = lambda seq, k: float(np.mean([w[k] for w in seq])) if seq else np.nan
        shares = np.array([w["tgt_share"] for w in wks], float)
        shares = shares[~np.isnan(shares)]
        cv = float(shares.std() / shares.mean()) if len(shares) >= 4 and shares.mean() > 0 else np.nan
        out[key] = {
            "late_tgt_pg": mean(late, "tgt"),
            "late_touch_pg": float(np.mean([w["car"] + w["tgt"] for w in late])),
            "late_ppg": mean(late, "half"),
            "role_trend_tgt": mean(late, "tgt") - mean(wks, "tgt"),
            "role_trend_touch": float(np.mean([w["car"] + w["tgt"] for w in late])
                                      - np.mean([w["car"] + w["tgt"] for w in wks])),
            "tgt_share_cv": cv,
            "games_above_role": float(sum(1 for s in shares if s >= 15)),
        }
    return out

# -------------------------------------------------------------------- pbp ---
# xFP prices each opportunity at what that KIND of opportunity is worth on
# average, so a player's expected points reflect the mix of chances he got
# rather than whether they happened to convert. Buckets are league-wide and
# pooled over every season, so no player's own results set his own baseline.
AY_BINS = [-99, -1, 3, 8, 13, 18, 25, 99]
YL_BINS = [0, 2, 5, 10, 20, 50, 100]

def scan_pbp():
    """One pass over every season's play-by-play. Cached to JSON -- it is slow."""
    if os.path.exists(PBP_CACHE):
        with open(PBP_CACHE) as fh:
            return json.load(fh)

    tgt_pts, tgt_n = defaultdict(float), defaultdict(int)
    car_pts, car_n = defaultdict(float), defaultdict(int)
    plays = []
    for season in SEASONS:
        for r in csv.DictReader(io.StringIO(load_gz_text(f"nflverse-pbp-{season}"))):
            if r.get("season_type") != "REG":
                continue
            def fnum(k):
                try:
                    return float(r.get(k) or 0)
                except ValueError:
                    return 0.0
            yl = fnum("yardline_100")
            yg = fnum("yards_gained")
            if r.get("pass_attempt") == "1" and r.get("receiver_player_id"):
                comp = r.get("complete_pass") == "1"
                td = r.get("pass_touchdown") == "1"
                pts = (0.5 + 0.1 * yg + 6.0 * td) if comp else 0.0
                b = int(np.digitize(fnum("air_yards"), AY_BINS))
                tgt_pts[b] += pts; tgt_n[b] += 1
                plays.append((season, "t", r["receiver_player_id"], b, pts, yl))
            elif r.get("rush_attempt") == "1" and r.get("rusher_player_id"):
                td = r.get("rush_touchdown") == "1"
                pts = 0.1 * yg + 6.0 * td
                b = int(np.digitize(yl, YL_BINS))
                car_pts[b] += pts; car_n[b] += 1
                scramble = r.get("qb_scramble") == "1"
                plays.append((season, "s" if scramble else "r",
                              r["rusher_player_id"], b, pts, yl))

    tgt_exp = {b: tgt_pts[b] / tgt_n[b] for b in tgt_n if tgt_n[b] > 200}
    car_exp = {b: car_pts[b] / car_n[b] for b in car_n if car_n[b] > 200}

    agg = defaultdict(lambda: defaultdict(float))
    for season, kind, pid, b, pts, yl in plays:
        key = GSIS.get(pid)
        if not key:
            continue
        a = agg[f"{season}|{key}"]
        if kind == "t":
            a["xfp"] += tgt_exp.get(b, 0.0)
            a["fp"] += pts
        else:
            a["xfp"] += car_exp.get(b, 0.0)
            a["fp"] += pts
            if kind == "s":
                a["scramble"] += 1
            else:
                a["designed"] += 1
            if yl <= 5:
                a["gl_att"] += 1
    out = {k: dict(v) for k, v in agg.items()}
    with open(PBP_CACHE, "w") as fh:
        json.dump(out, fh)
    return out

# ------------------------------------------------------------------ attach --
_ATTACHED = False
def attach_composites(verbose=False):
    global _ATTACHED
    if _ATTACHED:
        return
    _ATTACHED = True

    if verbose:
        print("  scanning play-by-play (cached after first run)...", file=sys.stderr)
    pbp = scan_pbp()

    # team inside-5 carries, for gl_share
    gl_team = defaultdict(float)
    for k, v in pbp.items():
        season, key = k.split("|", 1)
        gl_team[season] += 0.0  # placeholder; team split below needs the record

    if verbose:
        print("  weekly + NGS + PFR...", file=sys.stderr)

    # PFR before/after contact
    pfr = defaultdict(dict)
    for r in csv.DictReader(io.StringIO(load_gz_text("nflverse-pfr-rush"))):
        if r.get("pos") != "RB" or not r.get("season", "").isdigit():
            continue
        try:
            att = float(r.get("att") or 0)
            ybc = float(r.get("ybc") or 0)
            yac = float(r.get("yac") or 0)
        except ValueError:
            continue
        if att < 30:
            continue
        pfr[int(r["season"])][f"{norm(r.get('player'))}|RB"] = (ybc, yac, att)

    # NGS receiving: separation, aDOT, and NGS rushing: box counts
    ngs_recv = defaultdict(dict)
    for r in csv.DictReader(io.StringIO(load_gz_text("nflverse-ngs-receiving"))):
        if r["week"] != "0" or r["season_type"] != "REG":
            continue
        key = GSIS.get((r.get("player_gsis_id") or "").strip())
        if not key:
            continue
        try:
            sep = float(r["avg_separation"]); adot = float(r["avg_intended_air_yards"])
        except (ValueError, KeyError, TypeError):
            continue
        ngs_recv[int(r["season"])][key] = (sep, adot)

    ngs_rush = defaultdict(dict)
    for r in csv.DictReader(io.StringIO(load_gz_text("nflverse-ngs-rushing"))):
        if r["week"] != "0" or r["season_type"] != "REG":
            continue
        key = GSIS.get((r.get("player_gsis_id") or "").strip())
        v = r.get("percent_attempts_gte_eight_defenders")
        if key and v:
            ngs_rush[int(r["season"])][key] = float(v)

    # separation over expected for the depth: one league-wide line per season
    sep_oe = {}
    for season, d in ngs_recv.items():
        if len(d) < 30:
            continue
        keys = list(d)
        adot = np.array([d[k][1] for k in keys])
        sep = np.array([d[k][0] for k in keys])
        A = np.c_[adot, np.ones(len(adot))]
        coef, *_ = np.linalg.lstsq(A, sep, rcond=None)
        resid = sep - A @ coef
        sep_oe[season] = dict(zip(keys, resid))

    for season in SEASONS:
        wk = weekly_features(season)
        # team inside-5 carries this season, for the share version
        team_gl = defaultdict(float)
        for key, rec in DERIVED.get(season, {}).items():
            p = pbp.get(f"{season}|{key}")
            if p and rec.get("team"):
                team_gl[rec["team"]] += p.get("gl_att", 0.0)

        for key, rec in DERIVED.get(season, {}).items():
            gp = rec["gp"] or 1
            w = wk.get(key, {})
            for f in ("late_tgt_pg", "late_touch_pg", "late_ppg", "role_trend_tgt",
                      "role_trend_touch", "tgt_share_cv", "games_above_role"):
                v = w.get(f)
                rec[f] = None if v is None or (isinstance(v, float) and np.isnan(v)) else float(v)

            p = pbp.get(f"{season}|{key}", {})
            rec["xfp_pg"] = p["xfp"] / gp if p.get("xfp") else None
            rec["fp_over_xfp"] = ((p["fp"] - p["xfp"]) / gp) if p.get("xfp") else None
            rec["gl_att_pg"] = (p.get("gl_att", 0.0) / gp) if p else None
            tg = team_gl.get(rec.get("team"), 0.0)
            rec["gl_share"] = (p.get("gl_att", 0.0) / tg * 100) if (p and tg > 0) else None
            rec["qb_designed_pg"] = (p.get("designed", 0.0) / gp) if (p and rec["pos"] == "QB") else None
            rec["qb_scramble_pg"] = (p.get("scramble", 0.0) / gp) if (p and rec["pos"] == "QB") else None

            pf = pfr.get(season, {}).get(key)
            if pf:
                ybc, yac, att = pf
                rec["ybc_att"] = ybc / att
                rec["yac_att"] = yac / att
                rec["portable_share"] = yac / (ybc + yac) * 100 if (ybc + yac) > 0 else None
            else:
                rec["ybc_att"] = rec["yac_att"] = rec["portable_share"] = None

            rec["sep_oe"] = sep_oe.get(season, {}).get(key)
            lb = ngs_rush.get(season, {}).get(key)
            rec["light_box_pct"] = (100.0 - lb) if lb is not None else None
            rec["air_yd_pg"] = (rec.get("rec_ay") or 0) / gp if rec.get("rec_ay") else None

        if verbose:
            got = sum(1 for r in DERIVED[season].values() if r.get("xfp_pg") is not None)
            print(f"    {season}: {got} player-seasons with xFP", file=sys.stderr)

if __name__ == "__main__":
    attach_composites(verbose=True)
    print("\nsanity check, 2024:")
    for name in ("ceedeelamb|WR", "saquonbarkley|RB", "lamarjackson|QB"):
        r = DERIVED[2024].get(name)
        if not r:
            continue
        show = ("ppg_half", "xfp_pg", "fp_over_xfp", "late_tgt_pg", "role_trend_tgt",
                "tgt_share_cv", "gl_att_pg", "gl_share", "qb_designed_pg",
                "qb_scramble_pg", "portable_share", "sep_oe", "light_box_pct", "air_yd_pg")
        print(" ", name, {k: (round(r[k], 2) if isinstance(r.get(k), float) else r.get(k))
                          for k in show if r.get(k) is not None})
