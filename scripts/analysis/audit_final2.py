"""Final candidate sets, scored leave-one-season-out AND on a clean hold-out."""
import numpy as np
from metrics import pairs
from wide_model import fit_signed, SIGN, loso
from audit_candidates import MODEL, extras as ex1
from audit_proposed import build as build1, ALPHAS
from audit_deep import deep, RECOMMENDED

SIGN.update({"career_best_ppg": +1, "gap_below_peak": +1, "dev_from_own_mean": -1,
             "target_competition": -1, "ppg_reliable": +1, "ypr": +1, "rec_td_pg": -1})

CACHE = {}
def cols(pos):
    if pos not in CACHE:
        d = dict(ex1(pos)); d.update(deep(pos)); CACHE[pos] = d
    return CACHE[pos]

def build(pos, feats):
    from test_levers import BLEND, blended, enrich
    pr = pairs(pos); A = [a for a, _ in pr]; EX = [enrich(a, b) for a, b in pr]
    y = np.array([b["ppg_half"] for _, b in pr], float)
    seas = np.array([a["season"] for a in A]); extra = cols(pos)
    out, names = [], []
    for f in feats:
        if f in extra:
            v = np.array(extra[f], float)
        elif f in ("team_change", "durability", "draft_pick_log"):
            v = np.array([e.get(f) if e.get(f) is not None else np.nan for e in EX], float)
        else:
            v = np.array([blended(a, f, BLEND[pos]) for a in A], float)
        v[~np.isfinite(v)] = np.nan
        if np.all(np.isnan(v)): continue
        v = np.where(np.isnan(v), np.nanmedian(v), v)
        if v.std() == 0: continue
        out.append(v); names.append(f)
    return np.column_stack(out), y, seas, names

def score(pos, feats, alpha):
    X, y, seas, names = build(pos, feats)
    pred = np.empty_like(y)
    for s in np.unique(seas):
        te = seas == s
        b, m, sd = fit_signed(X[~te], y[~te], names, alpha)
        pred[te] = np.c_[np.ones(te.sum()), (X[te] - m) / sd] @ b
    l = 1 - ((y - pred) ** 2).sum() / ((y - y.mean()) ** 2).sum()
    tr, te = seas <= 2021, seas >= 2022
    b, m, sd = fit_signed(X[tr], y[tr], names, alpha)
    p = np.c_[np.ones(te.sum()), (X[te] - m) / sd] @ b
    h = 1 - ((y[te] - p) ** 2).sum() / ((y[te] - y[te].mean()) ** 2).sum()
    return l, h

VARIANTS = {
    "QB": [("shipped", MODEL["QB"]["features"]),
           ("+ career best", MODEL["QB"]["features"] + ["career_best_ppg"]),
           ("+ career best & peak gap", MODEL["QB"]["features"] + ["career_best_ppg", "gap_below_peak"])],
    "RB": [("shipped", MODEL["RB"]["features"]),
           ("recommended", RECOMMENDED["RB"])],
    "WR": [("shipped", MODEL["WR"]["features"]),
           ("no gp, no target share", RECOMMENDED["WR"]),
           ("+ target competition", RECOMMENDED["WR"] + ["target_competition"])],
    "TE": [("shipped", MODEL["TE"]["features"]),
           ("recommended", RECOMMENDED["TE"]),
           ("+ career best", RECOMMENDED["TE"] + ["career_best_ppg"])],
}
print(f"{'pos':<4}{'variant':<26}{'n in':>6}{'LOSO':>9}{'hold-out':>11}{'vs shipped':>13}")
for pos, variants in VARIANTS.items():
    base_l = base_h = None
    for label, feats in variants:
        a, l = max(((a, score(pos, feats, a)[0]) for a in ALPHAS), key=lambda t: t[1])
        l, h = score(pos, feats, a)
        if base_l is None: base_l, base_h = l, h
        print(f"{pos:<4}{label:<26}{len(feats):>6}{l:>9.4f}{h:>11.4f}"
              f"{f'{l-base_l:+.4f} / {h-base_h:+.4f}':>13}")
    print()
