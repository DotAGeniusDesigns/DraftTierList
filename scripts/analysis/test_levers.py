"""Do team context, schedule and pedigree add anything the player's own stats miss?

Each candidate is added to the position's existing four-driver model and scored
leave-one-season-out. A lever only earns a place if it improves out-of-sample
accuracy on seasons the model never saw.
"""
import csv, math
import numpy as np
from metrics import pairs, DERIVED, SEASONS
from incremental import fit_predict
from corpus import norm
from team_context import context_for, SOS

DRIVERS = {
    "WR": ["ppg_half", "rec_yd_pg", "tgt_pg", "age"],
    "TE": ["ppg_half", "rec_yd_pg", "td_oe_pg", "age"],
    "RB": ["ppg_half", "scrim_yd_pg", "tgt_pg", "age"],
    "QB": ["ppg_half", "pass_yd_pg", "rush_att_pg", "int_pg"],
}
BLEND = {"WR": (0.7, 0.3), "TE": (0.7, 0.3), "RB": (0.6, 0.3, 0.1), "QB": (0.6, 0.3, 0.1)}

# ---- pedigree + durability, attached to every player-season -------------
DP = "/home/dotagenius/DraftList/.cache/nflstats/draft_picks.csv"
pick_by = {}
for p in csv.DictReader(open(DP)):
    if p.get("position") in ("QB", "RB", "WR", "TE") and p["season"].isdigit():
        pick_by[f'{norm(p["pfr_player_name"])}|{p["position"]}'] = int(p["pick"])

for s in SEASONS:
    for key, rec in DERIVED[s].items():
        pk = pick_by.get(key)
        rec["draft_pick_log"] = math.log(pk) if pk else None
        # Durability: share of a 17-game season played, averaged over the career
        # to date. One missed year is noise; a pattern is a real discount.
        hist = [DERIVED[y][key]["gp"] for y in SEASONS if y <= s and key in DERIVED[y]]
        rec["durability"] = float(np.mean([min(g, 17) / 17 for g in hist])) if hist else None
        rec["career_seasons"] = len(hist)

def enrich(a, b):
    """Features known on draft day for the season being predicted."""
    ctx = context_for(b.get("team"), a["season"]) if b.get("team") else {}
    out = dict(ctx)
    out["team_change"] = 0.0 if (a.get("team") and b.get("team") == a.get("team")) else 1.0
    out["draft_pick_log"] = a.get("draft_pick_log")
    out["durability"] = a.get("durability")
    out["career_seasons"] = a.get("career_seasons")
    return out

CANDIDATES = ["team_plays_pg", "team_pass_rate", "team_off_epa_pg", "team_sack_rate",
              "team_ypc", "team_points_pg", "sos", "team_change", "draft_pick_log",
              "durability", "career_seasons"]

def blended(rec, feat, blend):
    if feat == "age" or not blend:
        v = rec.get(feat)
        return v if v is not None else np.nan
    latest = rec["season"]
    vals, wts = [], []
    for w, off in zip(blend, range(len(blend))):
        r = DERIVED.get(latest - off, {}).get(f'{norm(rec["name"])}|{rec["pos"]}')
        if not r:
            continue
        x = r.get(feat)
        if x is not None:
            vals.append(x); wts.append(w)
    return float(np.average(vals, weights=wts)) if vals else np.nan

def loso(pos, base_feats, extra_feats):
    pr = pairs(pos)
    A = [a for a, _ in pr]
    EX = [enrich(a, b) for a, b in pr]
    y = np.array([b["ppg_half"] for _, b in pr], float)
    seas = np.array([a["season"] for a in A])
    cols = []
    for f in base_feats:
        v = np.array([blended(a, f, BLEND[pos]) for a in A], float)
        cols.append(np.where(np.isnan(v), np.nanmedian(v), v))
    for f in extra_feats:
        v = np.array([e.get(f) if e.get(f) is not None else np.nan for e in EX], float)
        if np.all(np.isnan(v)):
            raise ValueError(f"candidate {f} is empty for {pos} — check the join")
        v = np.where(np.isnan(v), np.nanmedian(v), v)
        if v.std() == 0:
            raise ValueError(f"candidate {f} is constant for {pos}")
        cols.append(v)
    X = np.column_stack(cols)
    pred = np.empty_like(y)
    for s in np.unique(seas):
        te = seas == s
        pred[te] = fit_predict(X[~te], y[~te], X[te])
    return 1 - ((y - pred) ** 2).sum() / ((y - y.mean()) ** 2).sum()

print("Value ADDED by each candidate lever, on top of the existing four drivers")
print("(leave-one-season-out R2; anything under +0.003 is noise at these samples)\n")
results = {}
for pos in ("WR", "RB", "TE", "QB"):
    base = loso(pos, DRIVERS[pos], [])
    scored = [(c, loso(pos, DRIVERS[pos], [c]) - base) for c in CANDIDATES]
    scored.sort(key=lambda t: -t[1])
    results[pos] = (base, scored)
    print(f"{pos}  baseline {base:.4f}   n={len(pairs(pos))}")
    for c, d in scored:
        mark = "  <-- helps" if d >= 0.003 else ""
        print(f"    {c:<18}{d:+.4f}{mark}")
    print()

print("\nAll candidates added together (ridge shrinks the weak ones):")
for pos in ("WR", "RB", "TE", "QB"):
    base, scored = results[pos]
    allin = loso(pos, DRIVERS[pos], CANDIDATES)
    helpful = [c for c, d in scored if d >= 0.003]
    sel = loso(pos, DRIVERS[pos], helpful) if helpful else base
    print(f"  {pos}: base {base:.4f} | +all {allin:.4f} ({allin-base:+.4f}) | "
          f"+only helpful {sel:.4f} ({sel-base:+.4f})  helpful={helpful}")
