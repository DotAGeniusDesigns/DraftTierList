"""WR/TE: NGS separation, cushion, and YAC over expectation.

nflverse's `nextgen_stats` release, receiving file, season-level rows (week=0),
2016-2025. Joined via the feed's own player_gsis_id through the same players
crosswalk routes.py uses.

Folk claims worth checking against this corpus rather than trusting secondhand
(4for4/RotoBaller, August 2026): cushion is reported to have ~zero correlation
with fantasy output; separation is reported as mixed -- high separation can
mean "wide open because not a threat" as easily as "good route runner."
"""
import csv, io, os, sys
from collections import defaultdict
import numpy as np
from scipy import stats

sys.path.insert(0, os.path.dirname(__file__))
from metrics import DERIVED
from routes import load_gz_text, GSIS_TO_KEY

NGS_RECV_SEASONS = list(range(2016, 2026))
FIELDS = ["avg_separation", "avg_cushion", "avg_yac_above_expectation"]

def ngs_recv_for_season(season):
    """-> {norm(name)|pos: {field: value}}"""
    out = {}
    for r in csv.DictReader(io.StringIO(load_gz_text("nflverse-ngs-receiving"))):
        if r["season"] != str(season) or r["week"] != "0" or r["season_type"] != "REG":
            continue
        if r.get("player_position") not in ("WR", "TE"):
            continue
        key = GSIS_TO_KEY.get((r.get("player_gsis_id") or "").strip())
        if not key:
            continue
        vals = {}
        for f in FIELDS:
            v = r.get(f)
            if v:
                vals[f] = float(v)
        out[key] = vals
    return out

_ATTACHED = False
def attach_ngs_recv_features(verbose=False):
    global _ATTACHED
    if _ATTACHED:
        return
    _ATTACHED = True
    for season in NGS_RECV_SEASONS:
        ngs = ngs_recv_for_season(season)
        n_set = 0
        for key, rec in DERIVED.get(season, {}).items():
            if rec["pos"] not in ("WR", "TE"):
                continue
            vals = ngs.get(key, {})
            for f in FIELDS:
                rec[f] = vals.get(f)
            n_set += bool(vals)
        if verbose:
            print(f"  {season}: {n_set} WR/TE seasons", file=sys.stderr)

def test(pos, feat, seasons):
    a, b = [], []
    for s in seasons[:-1]:
        nxt = DERIVED.get(s + 1)
        if not nxt:
            continue
        for key, rec in DERIVED[s].items():
            if rec["pos"] != pos or rec["gp"] < 8 or rec.get(feat) is None:
                continue
            t = nxt.get(key)
            if not t or t["gp"] < 6:
                continue
            a.append(rec); b.append(t)
    if len(a) < 30:
        print(f"  {pos} {feat}: n={len(a)}, too few")
        return
    nxt_ppg = np.array([r["ppg_half"] for r in b])
    x = np.array([r[feat] for r in a])
    rho, p = stats.spearmanr(x, nxt_ppg)
    shipped = {"WR": ["rec_yd_pg", "tgt_pg"], "TE": ["rec_yd_pg", "target_share"]}[pos]
    X = np.vstack([np.array([r[c] for r in a]) for c in shipped] + [np.ones(len(a))]).T
    ok = ~np.isnan(X).any(axis=1)
    coef, *_ = np.linalg.lstsq(X[ok], x[ok], rcond=None)
    resid = x[ok] - X[ok] @ coef
    rho_p, p_p = stats.spearmanr(resid, nxt_ppg[ok])
    print(f"  {pos} {feat:<24} n={len(a):4d}  raw rho={rho:+.3f} (p={p:.1e})   "
          f"| {'+'.join(shipped)} partial rho={rho_p:+.3f} (p={p_p:.1e})")

if __name__ == "__main__":
    print("building NGS separation/cushion/yac_oe per season (2016-2025)...", file=sys.stderr)
    attach_ngs_recv_features(verbose=True)

    print(f"\n{'='*90}\nWR/TE: NGS receiving as a year-N -> year-N+1 predictor (2016-2025)\n{'='*90}")
    for pos in ("WR", "TE"):
        for feat in FIELDS:
            test(pos, feat, NGS_RECV_SEASONS)
