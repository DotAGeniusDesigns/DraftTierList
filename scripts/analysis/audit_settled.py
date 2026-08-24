import numpy as np
from wide_model import fit_signed, SIGN
from audit_candidates import MODEL
from audit_final2 import build, ALPHAS
from audit_supplant import rolling

FINAL = {
    "QB": MODEL["QB"]["features"],
    "RB": ["ppg_half", "scrim_yd_pg", "age", "team_change", "tgt_pg"],
    "WR": ["ppg_half", "rec_yd_pg", "tgt_pg", "age", "team_change"],
    "TE": ["ppg_half", "rec_yd_pg", "age", "team_change", "ypr", "target_share"],
}
LABEL = {"ppg_half": "Prior production (PPG)", "scrim_yd_pg": "Scrimmage yards/g",
    "rec_yd_pg": "Receiving yards/g", "tgt_pg": "Targets/g", "pass_yd_pg": "Passing yards/g",
    "rush_att_pg": "Rush attempts/g", "rush_yd_pg": "Rushing yards/g", "pass_td_pg": "Passing TDs/g",
    "int_pg": "Interceptions/g", "age": "Age", "team_change": "Changed teams",
    "durability": "Durability", "ypr": "Yards per reception", "target_share": "Target share"}

for pos in ("QB", "RB", "WR", "TE"):
    alpha = MODEL[pos]["alpha"]
    ship, fin = rolling(pos, MODEL[pos]["features"], alpha), rolling(pos, FINAL[pos], alpha)
    X, y, seas, names = build(pos, FINAL[pos])
    beta, mu, sd = fit_signed(X, y, names, alpha)
    print(f"\n{'='*70}\n{pos}   rolling-origin R2  {ship.mean():.4f} -> {fin.mean():.4f} "
          f"({fin.mean()-ship.mean():+.4f}, wins {int(np.sum(fin>ship))}/5)   "
          f"{len(MODEL[pos]['features'])} -> {len(FINAL[pos])} inputs\n{'='*70}")
    rows = [(f, beta[1+i], beta[1+i]*(np.percentile(X[:,i],90)-np.percentile(X[:,i],10))/sd[i])
            for i, f in enumerate(names)]
    for f, c, sw in sorted(rows, key=lambda r: -abs(r[1])):
        dead = "   DEAD" if abs(c) < 0.01 else ""
        print(f"  {LABEL.get(f,f):<28}{c:+8.3f}{sw:+13.1f} PPG{dead}")
