"""Does orthogonalising the collinear tail beat feeding it in raw?

The wide fit declares 11-13 inputs per position but only 6-8 survive: the
opportunity metrics correlate 0.95-0.99 with each other and with prior PPG, so
ridge plus the sign bounds park the rest at exactly zero. Nothing is learned
from them.

This residualises each collinear input against the position's primary block —
what is left is the part of a player's opportunity that his production does NOT
already explain, which is the only part that can add anything. The transform
never touches y, so it is not leakage and is fitted once outside the CV loop.
"""
import numpy as np
from metrics import pairs
from test_levers import BLEND, enrich, blended
from wide_model import DRIVERS, SECONDARY, CONTEXT, SIGN, fit_signed

# The block each secondary input is measured against. Deliberately production and
# volume only: residualising opportunity on age would mix two different ideas.
BASE = {
    "WR": ["ppg_half", "rec_yd_pg", "tgt_pg"],
    "TE": ["ppg_half", "rec_yd_pg"],
    "RB": ["ppg_half", "scrim_yd_pg"],
    "QB": ["ppg_half", "pass_yd_pg", "rush_att_pg"],
}
# Inputs that are already "above expected" or are not opportunity at all keep
# their raw form — residualising them would say nothing.
NO_RESID = {"td_oe_pg", "gp", "age", "team_change", "durability", "draft_pick_log"}

def build(pos):
    feats = DRIVERS[pos] + SECONDARY[pos]
    pr = pairs(pos)
    A = [a for a, _ in pr]
    EX = [enrich(a, b) for a, b in pr]
    y = np.array([b["ppg_half"] for _, b in pr], float)
    seas = np.array([a["season"] for a in A])
    cols, names = {}, []
    for f in feats:
        v = np.asarray([blended(a, f, BLEND[pos]) for a in A], float)
        v[~np.isfinite(v)] = np.nan
        if np.all(np.isnan(v)):
            continue
        v = np.where(np.isnan(v), np.nanmedian(v), v)
        if v.std() == 0:
            continue
        cols[f] = v; names.append(f)
    for f in CONTEXT[pos]:
        v = np.asarray([e.get(f) if e.get(f) is not None else np.nan for e in EX], float)
        v[~np.isfinite(v)] = np.nan
        if np.all(np.isnan(v)):
            continue
        v = np.where(np.isnan(v), np.nanmedian(v), v)
        if v.std() == 0:
            continue
        cols[f] = v; names.append(f)
    return cols, names, y, seas

def residualise(pos, cols, names):
    base = [b for b in BASE[pos] if b in cols]
    B = np.c_[np.ones(len(cols[base[0]]))] if base else None
    for b in base:
        B = np.c_[B, cols[b]]
    out, info = dict(cols), {}
    for f in names:
        if f in NO_RESID or f in base:
            continue
        beta, *_ = np.linalg.lstsq(B, cols[f], rcond=None)
        r = cols[f] - B @ beta
        if r.std() == 0:
            continue
        out[f] = r
        info[f] = [float(v) for v in beta]
    return out, info, base

def loso(cols, names, y, seas, alpha):
    X = np.column_stack([cols[n] for n in names])
    pred = np.empty_like(y)
    for s in np.unique(seas):
        te = seas == s
        beta, mu, sd = fit_signed(X[~te], y[~te], names, alpha)
        pred[te] = np.c_[np.ones(te.sum()), (X[te] - mu) / sd] @ beta
    return 1 - ((y - pred) ** 2).sum() / ((y - y.mean()) ** 2).sum()

def live_count(cols, names, y, alpha):
    X = np.column_stack([cols[n] for n in names])
    beta, *_ = fit_signed(X, y, names, alpha)
    return sum(1 for c in beta[1:] if abs(c) >= 0.01), beta[1:]

if __name__ == "__main__":
    ALPHAS = [1, 5, 15, 40, 100]
    print("Raw tail vs residualised tail, leave-one-season-out\n")
    print(f"{'pos':<5}{'raw R2':>10}{'a':>5}{'live':>6}   {'resid R2':>10}{'a':>5}{'live':>6}{'gain':>9}")
    for pos in ("WR", "RB", "TE", "QB"):
        cols, names, y, seas = build(pos)
        raw_a, raw_r2 = max(((a, loso(cols, names, y, seas, a)) for a in ALPHAS), key=lambda t: t[1])
        rl, _ = live_count(cols, names, y, raw_a)
        rc, info, base = residualise(pos, cols, names)
        res_a, res_r2 = max(((a, loso(rc, names, y, seas, a)) for a in ALPHAS), key=lambda t: t[1])
        nl, beta = live_count(rc, names, y, res_a)
        print(f"{pos:<5}{raw_r2:>10.4f}{raw_a:>5}{rl:>6}   {res_r2:>10.4f}{res_a:>5}{nl:>6}{res_r2-raw_r2:>+9.4f}")
        print(f"      base={base}")
        for n, c in sorted(zip(names, beta), key=lambda t: -abs(t[1])):
            if abs(c) >= 0.01:
                print(f"        {n:<22}{c:+.4f}{'  [resid]' if n in info else ''}")
        print()
