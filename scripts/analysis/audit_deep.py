"""Second pass: constructed features, not raw feed columns.

The first audit swept every metric nflverse and Sleeper hand over directly. This
one builds features that are not in any feed — who is throwing the ball next
season, who else is still on the roster competing for it, where a player sits
against his own career rather than against the league, and whether the shape of
his career (not just his age) says anything.
"""
import numpy as np
from metrics import DERIVED, SEASONS, pairs
from corpus import norm
from test_levers import BLEND, blended
from wide_model import fit_signed, SIGN
from audit_candidates import extras as base_extras, MODEL, tm
from audit_proposed import build, loso_spec, ALPHAS

# ---- who threw the ball for each team-season, and how well ------------------
PASSER = {}
for yr, recs in DERIVED.items():
    best = {}
    for r in recs.values():
        if r["pos"] != "QB" or not r.get("team"):
            continue
        key = (yr, tm(r["team"]))
        if r.get("pass_att", 0) > best.get(key, (None, -1))[1]:
            best[key] = (r, r.get("pass_att", 0))
    for k, (r, _) in best.items():
        PASSER[k] = r

# ---- team-season receiving share, by player ---------------------------------
TSHARE = {}
for yr, recs in DERIVED.items():
    for r in recs.values():
        if not r.get("team") or r["pos"] not in ("WR", "TE", "RB"):
            continue
        TSHARE.setdefault((yr, tm(r["team"])), {})[r["name"]] = r.get("target_share") or 0.0

def career(pos, name, upto):
    return [DERIVED[s][f"{norm(name)}|{pos}"] for s in SEASONS
            if s <= upto and f"{norm(name)}|{pos}" in DERIVED[s]]

def deep(pos):
    pr = pairs(pos)
    out = {}
    n = len(pr)
    qb_new, qb_epa, comp, best, dev, exp2, agexp, peak_gap = ([] for _ in range(8))
    for a, b in pr:
        yr, team = a["season"], tm(b.get("team"))
        # 1/2. the quarterback he will be catching from. Who that is comes from
        # the next season's roster — depth-chart knowledge, the same assumption
        # `team_change` already makes. How good he is must come from the season
        # just finished: reading his year N+1 EPA would be scoring the player on
        # the outcome we are trying to predict, and it inflated this lever to
        # +0.010 for WR before the fix.
        p0, p1 = PASSER.get((yr, tm(a.get("team")))), PASSER.get((yr + 1, team))
        if pos == "QB" or not p0 or not p1:
            qb_new.append(np.nan); qb_epa.append(np.nan)
        else:
            qb_new.append(0.0 if p0["name"] == p1["name"] else 1.0)
            prior = DERIVED.get(yr, {}).get(f'{norm(p1["name"])}|QB')
            qb_epa.append(prior.get("pass_epa_pg") if prior and prior.get("pass_epa_pg") is not None
                          else np.nan)
        # 3. target competition still on the roster next season
        prev, cur = TSHARE.get((yr, team)), TSHARE.get((yr + 1, team))
        if pos == "QB" or not prev:
            comp.append(np.nan)
        else:
            ret = set(cur or {})
            comp.append(sum(v for k, v in prev.items() if k != a["name"] and k in ret))
        # 4-6. the player against his own career rather than the league
        hist = career(pos, a["name"], yr)
        ppgs = [h["ppg_half"] for h in hist]
        best.append(max(ppgs) if ppgs else np.nan)
        dev.append(a["ppg_half"] - float(np.mean(ppgs)) if ppgs else np.nan)
        peak_gap.append(max(ppgs) - a["ppg_half"] if ppgs else np.nan)
        # 7/8. career shape
        exp2.append(1.0 if len(hist) == 1 else 0.0)
        agexp.append((a.get("age") or np.nan) * len(hist))
    out["qb_changed"] = np.array(qb_new, float)
    out["incoming_qb_epa"] = np.array(qb_epa, float)
    out["target_competition"] = np.array(comp, float)
    out["career_best_ppg"] = np.array(best, float)
    out["dev_from_own_mean"] = np.array(dev, float)
    out["gap_below_peak"] = np.array(peak_gap, float)
    out["is_second_year"] = np.array(exp2, float)
    out["age_x_experience"] = np.array(agexp, float)
    return out

RECOMMENDED = {
    "QB": MODEL["QB"]["features"],
    "RB": ["ppg_reliable", "scrim_yd_pg", "age", "team_change"],
    "WR": ["ppg_half", "rec_yd_pg", "tgt_pg", "age", "team_change"],
    "TE": ["ppg_reliable", "rec_yd_pg", "age", "team_change", "ypr", "rec_td_pg"],
}

def loso_extra(pos, base, name, col, sign, alpha):
    X, y, seas, names = build(pos, base)
    v = np.array(col, float); v[~np.isfinite(v)] = np.nan
    if np.all(np.isnan(v)):
        return None
    v = np.where(np.isnan(v), np.nanmedian(v), v)
    if v.std() == 0:
        return None
    X = np.c_[X, v]; names = names + [name]
    SIGN[name] = sign
    pred = np.empty_like(y)
    for s in np.unique(seas):
        te = seas == s
        beta, mu, sd = fit_signed(X[~te], y[~te], names, alpha)
        pred[te] = np.c_[np.ones(te.sum()), (X[te] - mu) / sd] @ beta
    return 1 - ((y - pred) ** 2).sum() / ((y - y.mean()) ** 2).sum()

if __name__ == "__main__":
    print("Constructed features, on top of the recommended input set\n")
    for pos in ("QB", "RB", "WR", "TE"):
        base = RECOMMENDED[pos]
        alpha, full = max(((a, loso_spec(pos, base, a)) for a in ALPHAS), key=lambda t: t[1])
        print(f"{pos}  base R2 = {full:.4f}  (alpha {alpha}, {len(base)} inputs)")
        rows = []
        for name, col in deep(pos).items():
            best = None
            for sign in (+1, -1):
                r2 = loso_extra(pos, base, name, col, sign, alpha)
                if r2 is not None and (best is None or r2 > best[0]):
                    best = (r2, sign)
            if best:
                rows.append((name, best[0] - full, best[1]))
        for name, gain, sign in sorted(rows, key=lambda r: -r[1]):
            mark = "  <-- HELPS" if gain > 0.003 else ""
            print(f"    {name:<22}{gain:+.5f}   sign {sign:+d}{mark}")
        print()
