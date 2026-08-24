"""First-read target share and first-downs-per-route-run.

first_read_share: share of a player's targets that were the QB's first
progression read. Built from FTN's `read_thrown` charting (values '1'/'2'/...
for progression reads, 'CHK'/'DES'/'SD' for checkdown/designed-shot/scramble-
drill), joined via (game_id, play_id) to the full play-by-play's
receiver_player_id, resolved to a corpus key through the same nflverse
players crosswalk routes.py uses. FTN only covers 2022-2025 -- three usable
transition pairs, not ten. Same caution this project already applies to QB
levers at n=281 (fit_wide.py's FEATURES comment): a result here needs to be
sized accordingly, not treated the same as an eleven-season finding.

fd_per_route: receiving first downs (from the already-cached nflverse weekly
feed -- present in the raw file, just not summed into corpus.py's join) over
routes_est (routes.py, 2016-2025). A first-down analog of yprr_est: same
routes-run denominator, same "on-field-for-a-dropback" caveat from routes.py.
"""
import csv, io, os, sys
from collections import defaultdict
import numpy as np
from scipy import stats

sys.path.insert(0, os.path.dirname(__file__))
from metrics import DERIVED
from routes import load_gz_text, norm, GSIS_TO_KEY, attach_route_features, ROUTE_SEASONS

FTN_SEASONS = [2022, 2023, 2024, 2025]
MIN_TARGETS = 15  # below this a target-share rate is too noisy to trust

def first_downs_for_season(season):
    """-> {norm(name)|pos: first_downs}, from the nflverse weekly feed."""
    rows = csv.DictReader(io.StringIO(load_gz_text(f"nflverse-week-{season}")))
    fd = defaultdict(float)
    for r in rows:
        if r.get("season_type") != "REG":
            continue
        pos = r.get("position")
        if pos not in ("WR", "RB", "TE"):
            continue
        try:
            v = float(r.get("receiving_first_downs") or 0)
        except ValueError:
            v = 0.0
        fd[f"{norm(r.get('player_display_name') or r.get('player_name'))}|{pos}"] += v
    return fd

def first_read_for_season(season):
    """-> {norm(name)|pos: (first_read_targets, total_targets)}"""
    read_by_key = {}
    for r in csv.DictReader(io.StringIO(load_gz_text(f"nflverse-ftn-{season}"))):
        read_by_key[(r["nflverse_game_id"], r["nflverse_play_id"])] = r.get("read_thrown")

    counts = defaultdict(lambda: [0, 0])
    for r in csv.DictReader(io.StringIO(load_gz_text(f"nflverse-pbp-{season}"))):
        if r.get("season_type") != "REG" or r.get("pass_attempt") != "1":
            continue
        rid = r.get("receiver_player_id")
        if not rid:
            continue
        key = GSIS_TO_KEY.get(rid)
        if not key:
            continue
        read = read_by_key.get((r["game_id"], r["play_id"]))
        if read is None:
            continue
        c = counts[key]
        c[1] += 1
        if read == "1":
            c[0] += 1
    return counts

_ATTACHED = False
def attach_first_read_features(verbose=False):
    global _ATTACHED
    if _ATTACHED:
        return
    _ATTACHED = True
    attach_route_features(verbose=verbose)  # fd_per_route needs routes_est

    for season in ROUTE_SEASONS:
        fd = first_downs_for_season(season)
        for key, rec in DERIVED.get(season, {}).items():
            if rec["pos"] not in ("WR", "RB", "TE"):
                continue
            r_est = rec.get("routes_est")
            f = fd.get(key)
            rec["fd_per_route"] = (f / r_est) if (r_est and r_est >= 30 and f is not None) else None

    for season in FTN_SEASONS:
        counts = first_read_for_season(season)
        n_set = 0
        for key, rec in DERIVED.get(season, {}).items():
            if rec["pos"] not in ("WR", "RB", "TE"):
                continue
            c = counts.get(key)
            if c and c[1] >= MIN_TARGETS:
                rec["first_read_share"] = c[0] / c[1] * 100
                n_set += 1
            else:
                rec["first_read_share"] = None
        if verbose:
            print(f"  {season}: {n_set} first_read_share seasons (target>={MIN_TARGETS})", file=sys.stderr)

def report(pos, feat, seasons):
    print(f"\n{'='*90}\n{pos}: {feat} as a year-N -> year-N+1 predictor ({seasons[0]}-{seasons[-1]})\n{'='*90}")
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
        print(f"  n={len(a)}, too few to report")
        return
    nxt_ppg = np.array([r["ppg_half"] for r in b])
    x = np.array([r[feat] for r in a])
    rho, p = stats.spearmanr(x, nxt_ppg)
    print(f"  n={len(a)} transition pairs")
    print(f"  {feat:<20} rho={rho:+.3f}  p={p:.1e}")

    shipped = {"WR": ["rec_yd_pg", "tgt_pg"], "RB": ["scrim_yd_pg", "tgt_pg"],
               "TE": ["rec_yd_pg", "target_share"]}[pos]
    X = np.vstack([np.array([r[c] for r in a]) for c in shipped] + [np.ones(len(a))]).T
    ok = ~np.isnan(X).any(axis=1)
    coef, *_ = np.linalg.lstsq(X[ok], x[ok], rcond=None)
    resid = x[ok] - X[ok] @ coef
    rho_p, p_p = stats.spearmanr(resid, nxt_ppg[ok])
    print(f"  {feat} | {'+'.join(shipped)} partial rho={rho_p:+.3f}  p={p_p:.1e}  n={ok.sum()}")

if __name__ == "__main__":
    print("building fd_per_route (2016-2025) / first_read_share (2022-2025)...", file=sys.stderr)
    attach_first_read_features(verbose=True)

    for pos in ("WR", "RB", "TE"):
        report(pos, "fd_per_route", ROUTE_SEASONS)
    for pos in ("WR", "RB", "TE"):
        report(pos, "first_read_share", FTN_SEASONS)
