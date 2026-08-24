"""Year-N metric -> Year-N+1 fantasy PPG (predictive power), and
   Year-N metric -> Year-N+1 same metric (stickiness)."""
import numpy as np
from scipy import stats
from metrics import pairs

REC = ["target_share", "air_yards_share", "wopr", "tgt_pg", "rec_pg", "rz_tgt_pg",
       "rec_yd_pg", "racr", "adot", "ypt", "ypr", "catch_rate", "rec_td_pg",
       "td_per_tgt", "rec_epa_pg", "snap_pct"]
RUSH = ["rush_att_pg", "rush_share", "rz_att_pg", "rush_yd_pg", "ypc", "rush_td_pg",
        "td_per_att", "rush_epa_pg", "touches_pg", "opportunity_pg",
        "weighted_opp_pg", "scrim_yd_pg", "total_td_pg", "snap_pct"]
PASS = ["pass_att_pg", "pass_yd_pg", "pass_td_pg", "int_pg", "pass_rz_att_pg", "ypa",
        "td_per_patt", "cpoe", "pass_epa_pg", "rush_att_pg", "rush_yd_pg",
        "rush_td_pg", "rush_epa_pg"]
BASE = ["ppg_half", "age", "gp"]

SETS = {
    "WR": BASE + REC,
    "TE": BASE + REC,
    "RB": BASE + REC + RUSH,
    "QB": BASE + PASS,
}

def col(rows, k):
    return np.array([r.get(k) if r.get(k) is not None else np.nan for r in rows], float)

def report(pos):
    pr = pairs(pos)
    a = [x for x, _ in pr]
    b = [y for _, y in pr]
    nxt = col(b, "ppg_half")
    rows = []
    for m in dict.fromkeys(SETS[pos]):
        x = col(a, m)
        ok = ~np.isnan(x) & ~np.isnan(nxt)
        if ok.sum() < 60:
            continue
        rho, p = stats.spearmanr(x[ok], nxt[ok])
        # stickiness: same metric, next year
        y2 = col(b, m)
        ok2 = ~np.isnan(x) & ~np.isnan(y2)
        st = stats.spearmanr(x[ok2], y2[ok2])[0] if ok2.sum() >= 60 else np.nan
        rows.append((m, rho, st, int(ok.sum()), p))
    rows.sort(key=lambda r: -abs(r[1]))
    print(f"\n{'='*78}\n{pos}  (n={len(pr)} transition pairs, 2015->2025)\n{'='*78}")
    print(f"{'metric':<20}{'predicts next PPG':>19}{'stickiness':>13}{'n':>7}{'p':>10}")
    for m, rho, st, n, p in rows:
        star = "*" if p < 0.001 else (" " if p < 0.05 else "!")
        print(f"{m:<20}{rho:>18.3f}{star}{st:>13.3f}{n:>7}{p:>10.1e}")

for pos in ("WR", "RB", "TE", "QB"):
    report(pos)
