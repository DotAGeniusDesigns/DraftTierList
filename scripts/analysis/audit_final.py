"""The recommended model, position by position: inputs, weights, R2.

QB is deliberately left as it ships — its proposed change scored well
leave-one-season-out and then reversed on a clean hold-out.
"""
import numpy as np
from metrics import pairs
from wide_model import fit_signed, SIGN, loso
from audit_candidates import MODEL
from audit_proposed import build, loso_spec, ALPHAS

RECOMMENDED = {
    "QB": MODEL["QB"]["features"],                                   # unchanged
    "RB": ["ppg_reliable", "scrim_yd_pg", "age", "team_change", "ppg_trend"],
    "WR": ["ppg_half", "rec_yd_pg", "tgt_pg", "age", "team_change", "gp"],
    "TE": ["ppg_reliable", "rec_yd_pg", "age", "team_change", "ypr", "rec_td_pg"],
}
LABEL = {
    "ppg_half": "Prior production (PPG)", "ppg_reliable": "Prior production, games-weighted",
    "scrim_yd_pg": "Scrimmage yards/g", "rec_yd_pg": "Receiving yards/g", "tgt_pg": "Targets/g",
    "pass_yd_pg": "Passing yards/g", "rush_att_pg": "Rush attempts/g", "rush_yd_pg": "Rushing yards/g",
    "pass_td_pg": "Passing TDs/g", "int_pg": "Interceptions/g", "age": "Age",
    "team_change": "Changed teams", "durability": "Durability", "gp": "Games played",
    "ppg_trend": "PPG trend vs prior yr", "ypr": "Yards per reception", "rec_td_pg": "Receiving TDs/g",
    "target_share": "Target share", "td_oe_pg": "TDs over expected",
}

for pos in ("QB", "RB", "WR", "TE"):
    feats = RECOMMENDED[pos]
    shipped = loso(pos, MODEL[pos]["alpha"], MODEL[pos]["features"])
    alpha, r2 = max(((a, loso_spec(pos, feats, a)) for a in ALPHAS), key=lambda t: t[1])
    X, y, seas, names = build(pos, feats)
    beta, mu, sd = fit_signed(X, y, names, alpha)

    # Hold-out: fit on 2015-2021, score 2022-2025.
    tr, te = seas <= 2021, seas >= 2022
    b2, m2, s2 = fit_signed(X[tr], y[tr], names, alpha)
    p = np.c_[np.ones(te.sum()), (X[te] - m2) / s2] @ b2
    hold = 1 - ((y[te] - p) ** 2).sum() / ((y[te] - y[te].mean()) ** 2).sum()

    tag = "UNCHANGED" if feats == MODEL[pos]["features"] else f"was {shipped:.4f}"
    print(f"\n{'='*74}\n{pos}   R2 = {r2:.4f}  ({tag})   hold-out 2022-25 = {hold:.4f}"
          f"   n = {len(y)}\n{'='*74}")
    print(f"  {'metric':<34}{'weight':>9}{'10th-90th swing':>18}")
    rows = []
    for i, f in enumerate(names):
        c = beta[1 + i]
        lo, hi = np.percentile(X[:, i], [10, 90])
        swing = c * (hi - lo) / sd[i]
        rows.append((f, c, swing))
    for f, c, swing in sorted(rows, key=lambda r: -abs(r[1]))[:6]:
        print(f"  {LABEL.get(f, f):<34}{c:+9.3f}{swing:+17.1f} PPG")
