"""The shipped model: many inputs, four of them displayed, every sign honest.

Ridge alone gives a wider model that predicts better but explains worse — with
collinear inputs the weights redistribute until targets carry a NEGATIVE weight
for receivers and tight ends. That is fine for a black box and useless on a card
that has to tell someone why a number moved.

So every coefficient is fitted under a sign constraint taken from the research:
volume and production can only help, age / touchdown-luck / interceptions /
draft slot / a team change can only hurt. Ridge still shrinks the weak inputs
toward zero, which is what makes the tail safe to carry.
"""
import numpy as np
from scipy.optimize import lsq_linear
from metrics import pairs
from test_levers import DRIVERS, BLEND, enrich, blended

SECONDARY = {
    "WR": ["target_share", "wopr", "air_yards_share", "rz_tgt_pg", "td_oe_pg",
           "snap_pct", "ypt", "gp"],
    "TE": ["tgt_pg", "target_share", "wopr", "rz_tgt_pg", "snap_pct", "gp", "ypr"],
    "RB": ["opportunity_pg", "rz_att_pg", "td_oe_pg", "rush_share",
           "weighted_opp_pg", "snap_pct", "target_share", "gp"],
    "QB": ["pass_td_pg", "rush_yd_pg", "pass_rz_att_pg", "cmp_pct", "age", "gp"],
}
# Draft capital is deliberately NOT used for players who already have NFL
# production. It measures up as a lever (about +0.004 for backs) but it is
# pedigree standing in for performance: a back with three seasons on tape was
# handing +1.2 PPG to his draft slot, which is not something that should still be
# moving a projection. It remains the whole basis of the ROOKIE model, where
# there is nothing else to go on. Head-coaching change was tested too and adds
# nothing once the player's own stats and the team-change flag are in (see
# test_coaching.py); coordinator changes are in no nflverse feed and are untested.
CONTEXT = {
    "WR": ["team_change"], "TE": ["team_change"],
    "RB": ["team_change"],
    "QB": ["team_change", "durability"],
}
# +1 may only help, -1 may only hurt. Nothing is left free.
SIGN = {
    "ppg_half": +1, "rec_yd_pg": +1, "scrim_yd_pg": +1, "tgt_pg": +1,
    "opportunity_pg": +1, "target_share": +1, "wopr": +1, "air_yards_share": +1,
    "rz_tgt_pg": +1, "rz_att_pg": +1, "rush_share": +1, "weighted_opp_pg": +1,
    "snap_pct": +1, "ypt": +1, "ypr": +1, "gp": +1, "pass_yd_pg": +1, "pass_td_pg": +1,
    "rush_att_pg": +1, "rush_yd_pg": +1, "pass_rz_att_pg": +1, "cmp_pct": +1,
    "durability": +1,
    "age": -1, "td_oe_pg": -1, "int_pg": -1, "team_change": -1, "draft_pick_log": -1,
}

def features(pos):
    return DRIVERS[pos] + SECONDARY[pos], CONTEXT[pos]

def design(pos, keep=None):
    """Design matrix for `pos`. `keep` restricts and orders the columns, which is
    how the shipped fit refits on the inputs that survived its first pass."""
    feats, ctx = features(pos)
    pr = pairs(pos)
    A = [a for a, _ in pr]
    EX = [enrich(a, b) for a, b in pr]
    y = np.array([b["ppg_half"] for _, b in pr], float)
    seas = np.array([a["season"] for a in A])
    cols, names, med = [], [], []
    def add(f, raw):
        # A column that is all-missing, constant, or carries an infinity is
        # dropped rather than imputed — the solver cannot see past it and a
        # silent NaN would take the whole position's fit down with it.
        v = np.asarray(raw, float)
        v[~np.isfinite(v)] = np.nan
        if np.all(np.isnan(v)):
            return
        m = float(np.nanmedian(v))
        v = np.where(np.isnan(v), m, v)
        if not np.all(np.isfinite(v)) or v.std() == 0:
            return
        if keep is not None and f not in keep:
            return
        cols.append(v); names.append(f); med.append(m)

    for f in feats:
        add(f, [blended(a, f, BLEND[pos]) for a in A])
    for f in ctx:
        add(f, [e.get(f) if e.get(f) is not None else np.nan for e in EX])
    if keep is not None:
        order = [names.index(f) for f in keep if f in names]
        cols = [cols[i] for i in order]
        med = [med[i] for i in order]
        names = [names[i] for i in order]
    return np.column_stack(cols), y, seas, names, med

def fit_signed(Xtr, ytr, names, alpha):
    """Ridge with per-coefficient sign bounds, solved as a bounded least squares."""
    mu, sd = Xtr.mean(0), Xtr.std(0); sd[sd == 0] = 1
    Z = np.c_[np.ones(len(Xtr)), (Xtr - mu) / sd]
    k = Z.shape[1]
    # Ridge as extra rows: minimising |Zb - y|^2 + alpha|b|^2 (intercept free).
    pen = np.sqrt(alpha) * np.eye(k); pen[0, 0] = 0
    Za = np.vstack([Z, pen])
    ya = np.concatenate([ytr, np.zeros(k)])
    lo = np.full(k, -np.inf); hi = np.full(k, np.inf)
    for i, n in enumerate(names, start=1):
        if SIGN[n] > 0:
            lo[i] = 0.0
        else:
            hi[i] = 0.0
    res = lsq_linear(Za, ya, bounds=(lo, hi), max_iter=500)
    return res.x, mu, sd

def loso(pos, alpha, keep=None):
    X, y, seas, names, _ = design(pos, keep)
    pred = np.empty_like(y)
    for s in np.unique(seas):
        te = seas == s
        beta, mu, sd = fit_signed(X[~te], y[~te], names, alpha)
        Zte = np.c_[np.ones(te.sum()), (X[te] - mu) / sd]
        pred[te] = Zte @ beta
    return 1 - ((y - pred) ** 2).sum() / ((y - y.mean()) ** 2).sum()

if __name__ == "__main__":
    from test_expanded import loso as loso_free
    ALPHAS = [1, 5, 15, 40, 100]
    print("Sign-constrained wide model vs. the four-driver model\n")
    print(f"{'pos':<5}{'4 drivers':>11}{'wide free':>11}{'wide signed':>13}{'gain vs 4':>11}")
    for pos in ("WR", "RB", "TE", "QB"):
        base = loso_free(pos, DRIVERS[pos], [], 1.0)
        free = max(loso_free(pos, DRIVERS[pos] + SECONDARY[pos], CONTEXT[pos], a) for a in ALPHAS)
        signed = [(a, loso(pos, a)) for a in ALPHAS]
        a_b, r_b = max(signed, key=lambda t: t[1])
        print(f"{pos:<5}{base:>11.4f}{free:>11.4f}{r_b:>13.4f} (a={a_b:<3}){r_b-base:>+9.4f}")
        print("      " + "  ".join(f"{a}:{r:.4f}" for a, r in signed))
