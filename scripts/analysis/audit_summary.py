import numpy as np
from wide_model import fit_signed
from audit_candidates import MODEL
from audit_final2 import build, score, ALPHAS, RECOMMENDED

FINAL = {
    "QB": MODEL["QB"]["features"] + ["career_best_ppg", "gap_below_peak"],
    "RB": RECOMMENDED["RB"],
    "WR": RECOMMENDED["WR"] + ["target_competition"],
    "TE": RECOMMENDED["TE"] + ["career_best_ppg"],
}
LABEL = {"ppg_half": "Prior production (PPG)", "ppg_reliable": "Prior production, games-weighted",
    "scrim_yd_pg": "Scrimmage yards/g", "rec_yd_pg": "Receiving yards/g", "tgt_pg": "Targets/g",
    "pass_yd_pg": "Passing yards/g", "rush_att_pg": "Rush attempts/g", "rush_yd_pg": "Rushing yards/g",
    "pass_td_pg": "Passing TDs/g", "int_pg": "Interceptions/g", "age": "Age",
    "team_change": "Changed teams", "durability": "Durability", "gp": "Games played",
    "ypr": "Yards per reception", "rec_td_pg": "Receiving TDs/g",
    "career_best_ppg": "Career-best PPG", "gap_below_peak": "Gap below career peak",
    "target_competition": "Target competition returning"}

for pos in ("QB", "RB", "WR", "TE"):
    feats = FINAL[pos]
    alpha = max(ALPHAS, key=lambda a: score(pos, feats, a)[0])
    l, h = score(pos, feats, alpha)
    l0, h0 = score(pos, MODEL[pos]["features"], MODEL[pos]["alpha"])
    X, y, seas, names = build(pos, feats)
    beta, mu, sd = fit_signed(X, y, names, alpha)
    print(f"\n{'='*72}\n{pos}   R2 {l0:.4f} -> {l:.4f}   hold-out {h0:.4f} -> {h:.4f} "
          f"({h-h0:+.4f})   {len(feats)} inputs\n{'='*72}")
    print(f"  {'metric':<34}{'weight':>9}{'10-90 swing':>15}")
    rows = [(f, beta[1+i], beta[1+i]*(np.percentile(X[:,i],90)-np.percentile(X[:,i],10))/sd[i])
            for i, f in enumerate(names)]
    for f, c, sw in sorted(rows, key=lambda r: -abs(r[1]))[:6]:
        print(f"  {LABEL.get(f,f):<34}{c:+9.3f}{sw:+14.1f} PPG")
