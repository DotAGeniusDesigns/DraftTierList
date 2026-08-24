"""RB: rushing yards over expected per attempt (NGS), broken-tackle rate (PFR
advanced stats), yards-before-contact per attempt (also PFR -- the free proxy
for O-line push this project doesn't otherwise have), and route participation
(already built in routes.py -- RB already failed that test, see below, not
rebuilt here).

RYOE/att: nflverse's `nextgen_stats` release, season-level rows (week=0),
2018-2025 -- NGS didn't compute expected rushing yards before 2018. Carries
its own player_gsis_id, joined through the same players crosswalk routes.py
uses.

Broken-tackle rate and yards-before-contact/att: nflverse's `pfr_advstats`
release, season-level rushing file, also 2018-2025. Joined on normalized
name+position directly (PFR's own columns), same as the participation feed's
name-based join. ybc_att (yards before contact, PFR's own per-attempt rate) is
the honest free substitute for PFF run-block grades or Football Outsiders'
adjusted line yards -- both paywalled/not bulk-downloadable. It's not a pure
O-line measure (still mixes in scheme, defense faced, and some back skill:
patience finding a crease is still on the runner), but it's the closest split
of "yards before the back does anything himself" available in a free feed.
"""
import csv, io, os, sys
from collections import defaultdict
import numpy as np
from scipy import stats

sys.path.insert(0, os.path.dirname(__file__))
from metrics import DERIVED
from routes import load_gz_text, norm, GSIS_TO_KEY

RATE_SEASONS = list(range(2018, 2026))

def ryoe_for_season(season):
    """-> {norm(name)|RB: yards_over_expected_per_att}"""
    out = {}
    for r in csv.DictReader(io.StringIO(load_gz_text("nflverse-ngs-rushing"))):
        if r["season"] != str(season) or r["week"] != "0" or r["season_type"] != "REG":
            continue
        if r.get("player_position") != "RB":
            continue
        v = r.get("rush_yards_over_expected_per_att")
        if not v:
            continue
        key = GSIS_TO_KEY.get((r.get("player_gsis_id") or "").strip())
        if key:
            out[key] = float(v)
    return out

def pfr_rush_for_season(season):
    """-> {norm(name)|RB: (broken_tackles, yards_before_contact, attempts)}"""
    out = {}
    for r in csv.DictReader(io.StringIO(load_gz_text("nflverse-pfr-rush"))):
        if r["season"] != str(season) or r.get("pos") != "RB":
            continue
        try:
            brk = float(r.get("brk_tkl") or 0)
            ybc = float(r.get("ybc") or 0)
            att = float(r.get("att") or 0)
        except ValueError:
            continue
        if att < 30:
            continue
        key = f"{norm(r.get('player'))}|RB"
        out[key] = (brk, ybc, att)
    return out

_ATTACHED = False
def attach_rb_rate_features(verbose=False):
    global _ATTACHED
    if _ATTACHED:
        return
    _ATTACHED = True
    for season in RATE_SEASONS:
        ryoe = ryoe_for_season(season)
        pfr = pfr_rush_for_season(season)
        n1 = n2 = n3 = 0
        for key, rec in DERIVED.get(season, {}).items():
            if rec["pos"] != "RB":
                continue
            rec["ryoe_att"] = ryoe.get(key)
            n1 += rec["ryoe_att"] is not None
            p = pfr.get(key)
            rec["brk_tkl_rate"] = (p[0] / p[2] * 100) if p else None
            rec["ybc_att"] = (p[1] / p[2]) if p else None
            n2 += rec["brk_tkl_rate"] is not None
            n3 += rec["ybc_att"] is not None
        if verbose:
            print(f"  {season}: {n1} ryoe_att, {n2} brk_tkl_rate, {n3} ybc_att", file=sys.stderr)

def test(feat, seasons):
    a, b = [], []
    for s in seasons[:-1]:
        nxt = DERIVED.get(s + 1)
        if not nxt:
            continue
        for key, rec in DERIVED[s].items():
            if rec["pos"] != "RB" or rec["gp"] < 8 or rec.get(feat) is None:
                continue
            t = nxt.get(key)
            if not t or t["gp"] < 6:
                continue
            a.append(rec); b.append(t)
    if len(a) < 30:
        print(f"  {feat}: n={len(a)}, too few")
        return
    nxt_ppg = np.array([r["ppg_half"] for r in b])
    x = np.array([r[feat] for r in a])
    rho, p = stats.spearmanr(x, nxt_ppg)
    shipped = ["scrim_yd_pg", "tgt_pg", "age"]
    X = np.vstack([np.array([r[c] for r in a]) for c in shipped] + [np.ones(len(a))]).T
    ok = ~np.isnan(X).any(axis=1)
    coef, *_ = np.linalg.lstsq(X[ok], x[ok], rcond=None)
    resid = x[ok] - X[ok] @ coef
    rho_p, p_p = stats.spearmanr(resid, nxt_ppg[ok])
    print(f"  {feat:<16} n={len(a):4d}  raw rho={rho:+.3f} (p={p:.1e})   "
          f"| scrim_yd_pg+tgt_pg+age partial rho={rho_p:+.3f} (p={p_p:.1e})")

if __name__ == "__main__":
    print("building ryoe_att / brk_tkl_rate / ybc_att per season (2018-2025)...", file=sys.stderr)
    attach_rb_rate_features(verbose=True)

    for key, rec in DERIVED[2024].items():
        if key.startswith("saquonbarkley") or key.startswith("derrickhenry"):
            print(key, {k: rec.get(k) for k in ("rush_att", "ryoe_att", "brk_tkl_rate", "ybc_att")})

    print(f"\n{'='*78}\nRB: as a year-N -> year-N+1 predictor (2018-2025)\n{'='*78}")
    test("ryoe_att", RATE_SEASONS)
    test("brk_tkl_rate", RATE_SEASONS)
    test("ybc_att", RATE_SEASONS)
