"""EPA per dropback for QB -- a purer rate/efficiency cut than the pass_epa_pg
already in the corpus (which divides by games played, so it's part volume).
CPOE is NOT rebuilt here: it's already in corpus.py (attempt-weighted from the
nflverse weekly feed) and already tested -- see incremental.py's QB table and
scripts/analysis/README.md: "cpoe ... measure[s] negative" as an addition over
the prior-PPG baseline. This only adds the one genuinely new cut: EPA per
dropback rather than per game.

Uses the full play-by-play cache (routes.py fetched 2016-2025 for the
participation join; this adds 2015 so the QB corpus, which starts at 2015,
isn't shortened -- QB already runs on the thinnest sample here, n=281).
"""
import csv, io, os, sys
from collections import defaultdict
import numpy as np
from scipy import stats

sys.path.insert(0, os.path.dirname(__file__))
from metrics import DERIVED, SEASONS
from routes import load_gz_text, norm

QB_SEASONS = SEASONS  # 2015-2025, pbp now cached for all of them

def load_gsis_to_qb_key():
    gsis_to_key = {}
    for r in csv.DictReader(io.StringIO(load_gz_text("nflverse-players"))):
        g = (r.get("gsis_id") or "").strip()
        if g and r.get("position") == "QB":
            gsis_to_key[g] = f"{norm(r.get('display_name'))}|QB"
    return gsis_to_key

GSIS_TO_QB = load_gsis_to_qb_key()

def epa_per_dropback_for_season(season):
    """-> {norm(name)|QB: (total_epa, n_dropbacks)}"""
    counts = defaultdict(lambda: [0.0, 0])
    for r in csv.DictReader(io.StringIO(load_gz_text(f"nflverse-pbp-{season}"))):
        if r.get("season_type") != "REG" or r.get("qb_dropback") != "1":
            continue
        pid = r.get("passer_player_id")
        if not pid:
            continue
        key = GSIS_TO_QB.get(pid)
        if not key:
            continue
        try:
            epa = float(r.get("epa"))
        except (TypeError, ValueError):
            continue
        c = counts[key]
        c[0] += epa
        c[1] += 1
    return counts

_ATTACHED = False
def attach_qb_rate_features(verbose=False, min_dropbacks=100):
    global _ATTACHED
    if _ATTACHED:
        return
    _ATTACHED = True
    for season in QB_SEASONS:
        counts = epa_per_dropback_for_season(season)
        n_set = 0
        for key, rec in DERIVED.get(season, {}).items():
            if rec["pos"] != "QB":
                continue
            c = counts.get(key)
            if c and c[1] >= min_dropbacks:
                rec["epa_per_db"] = c[0] / c[1]
                n_set += 1
            else:
                rec["epa_per_db"] = None
        if verbose:
            print(f"  {season}: {n_set} QB seasons (dropbacks>={min_dropbacks})", file=sys.stderr)

if __name__ == "__main__":
    print("building epa_per_db per season...", file=sys.stderr)
    attach_qb_rate_features(verbose=True)

    for key, rec in DERIVED[2024].items():
        if key.startswith("patrickmahomes") or key.startswith("joeburrow"):
            print(key, {k: rec.get(k) for k in ("pass_att", "pass_epa", "epa_per_db")})

    a, b = [], []
    for s in QB_SEASONS[:-1]:
        nxt = DERIVED.get(s + 1)
        if not nxt:
            continue
        for key, rec in DERIVED[s].items():
            if rec["pos"] != "QB" or rec["gp"] < 8 or rec.get("epa_per_db") is None:
                continue
            t = nxt.get(key)
            if not t or t["gp"] < 6:
                continue
            a.append(rec); b.append(t)

    print(f"\n{'='*78}\nQB: epa_per_db as a year-N -> year-N+1 predictor (2015-2025)\n{'='*78}")
    print(f"n={len(a)} transition pairs")
    nxt_ppg = np.array([r["ppg_half"] for r in b])
    x = np.array([r["epa_per_db"] for r in a])
    pass_epa_pg = np.array([r["pass_epa_pg"] for r in a])
    cpoe = np.array([r.get("cpoe") if r.get("cpoe") is not None else np.nan for r in a])
    ppg = np.array([r["ppg_half"] for r in a])
    pass_yd_pg = np.array([r["pass_yd_pg"] for r in a])
    rush_att_pg = np.array([r["rush_att_pg"] for r in a])
    int_pg = np.array([r["int_pg"] for r in a])
    pass_td_pg = np.array([r["pass_td_pg"] for r in a])
    rush_yd_pg = np.array([r["rush_yd_pg"] for r in a])

    for name, v in (("epa_per_db", x), ("pass_epa_pg (already tested)", pass_epa_pg),
                    ("cpoe (already tested)", cpoe)):
        ok = ~np.isnan(v)
        rho, p = stats.spearmanr(v[ok], nxt_ppg[ok])
        print(f"  {name:<30} rho={rho:+.3f}  p={p:.1e}  n={ok.sum()}")

    shipped = [ppg, pass_yd_pg, rush_att_pg, int_pg, pass_td_pg, rush_yd_pg]
    X = np.column_stack(shipped + [np.ones(len(a))])
    ok = ~np.isnan(X).any(axis=1) & ~np.isnan(x)
    coef, *_ = np.linalg.lstsq(X[ok], x[ok], rcond=None)
    resid = x[ok] - X[ok] @ coef
    rho_p, p_p = stats.spearmanr(resid, nxt_ppg[ok])
    print(f"\n  epa_per_db | shipped QB features, partial rho={rho_p:+.3f}  p={p_p:.1e}  n={ok.sum()}")
