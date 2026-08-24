"""QB/RB/WR/TE: contract-year flag -- is the season being predicted the final
year of the player's current deal? A widely repeated but contested claim
(analysts split on whether it's real or survivorship/anecdote); this checks it
directly against the corpus instead of taking either side on faith.

Like vacated.py, this describes something knowable BEFORE the season being
predicted starts, so it's tested as a feature of that season (b), not of the
season used to predict it (a) -- same convention as team_change.

nflverse's `contracts` release (Over The Cap data via nflreadr), one row per
signed contract with year_signed + years. A player is in a contract year in
season S if some contract has year_signed + years - 1 == S. Multiple contracts
per player (rookie deal, extensions, second contract) are all considered.
"""
import csv, io, os, sys
from collections import defaultdict
import numpy as np
from scipy import stats

sys.path.insert(0, os.path.dirname(__file__))
from metrics import DERIVED, SEASONS
from routes import load_gz_text, norm

def load_contract_years():
    """-> {norm(name)|pos: set of seasons that are a contract-expiration year}"""
    out = defaultdict(set)
    for r in csv.DictReader(io.StringIO(load_gz_text("nflverse-contracts"))):
        if not r.get("year_signed", "").isdigit() or not r.get("years", "").isdigit():
            continue
        pos = r.get("position")
        if pos not in ("QB", "RB", "WR", "TE"):
            continue
        expires = int(r["year_signed"]) + int(r["years"]) - 1
        key = f"{norm(r.get('player'))}|{pos}"
        out[key].add(expires)
    return out

CONTRACT_YEARS = load_contract_years()

def is_contract_year(key, season):
    return season in CONTRACT_YEARS.get(key, ())

def test(pos, seasons):
    a_list, b_list, flag_list = [], [], []
    for s in seasons[:-1]:
        nxt = DERIVED.get(s + 1)
        if not nxt:
            continue
        for key, rec in DERIVED[s].items():
            if rec["pos"] != pos or rec["gp"] < 8:
                continue
            t = nxt.get(key)
            if not t or t["gp"] < 6:
                continue
            if key not in CONTRACT_YEARS:
                continue  # no contract on file at all -- don't guess "not a contract year"
            a_list.append(rec); b_list.append(t)
            flag_list.append(1.0 if is_contract_year(key, s + 1) else 0.0)
    n = len(a_list)
    flags = np.array(flag_list)
    if n < 30 or flags.std() == 0:
        print(f"  {pos}: n={n}, too few or no variance (contract-year rate {flags.mean():.1%})" if n else f"  {pos}: n=0")
        return
    nxt_ppg = np.array([r["ppg_half"] for r in b_list])
    rho, p = stats.spearmanr(flags, nxt_ppg)
    shipped = {"QB": ["ppg_half", "pass_yd_pg"], "RB": ["scrim_yd_pg", "tgt_pg"],
               "WR": ["rec_yd_pg", "tgt_pg"], "TE": ["rec_yd_pg", "target_share"]}[pos]
    X = np.vstack([np.array([r.get(c, np.nan) for r in a_list], float) for c in shipped] + [np.ones(n)]).T
    ok = ~np.isnan(X).any(axis=1)
    coef, *_ = np.linalg.lstsq(X[ok], flags[ok], rcond=None)
    resid = flags[ok] - X[ok] @ coef
    rho_p, p_p = stats.spearmanr(resid, nxt_ppg[ok])
    # direct comparison, no regression: contract-year vs not, same population
    cy_ppg = nxt_ppg[flags == 1]
    non_cy_ppg = nxt_ppg[flags == 0]
    print(f"  {pos:<3} n={n:4d} ({flags.mean():.0%} contract-year)  raw rho={rho:+.3f} (p={p:.1e})   "
          f"| {'+'.join(shipped)} partial rho={rho_p:+.3f} (p={p_p:.1e})   "
          f"mean PPG: contract-yr {cy_ppg.mean():.1f} vs other {non_cy_ppg.mean():.1f}")

if __name__ == "__main__":
    print(f"contracts loaded for {len(CONTRACT_YEARS)} player-position keys", file=sys.stderr)
    print(f"\n{'='*100}\ncontract-year flag as a predictor of the season it lands in (2015-2025)\n{'='*100}")
    for pos in ("QB", "RB", "WR", "TE"):
        test(pos, SEASONS)
