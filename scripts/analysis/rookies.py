"""How well does draft capital predict rookie-season fantasy PPG?

Zeros are kept: a drafted skill player who never records a season counts as 0.0
PPG. Dropping them would only measure rookies who already succeeded, which is
the same survivorship trap the veteran study avoids.
"""
import csv, os, math
import numpy as np
from scipy import stats
from metrics import DERIVED, SEASONS
from corpus import norm

DP = "/home/dotagenius/DraftList/.cache/nflstats/draft_picks.csv"
POS = ("QB", "RB", "WR", "TE")

picks = [r for r in csv.DictReader(open(DP))
         if r.get("position") in POS and r["season"].isdigit()]

rows = []
for p in picks:
    yr = int(p["season"])
    if yr < 2015 or yr > max(SEASONS):
        continue
    key = f'{norm(p["pfr_player_name"])}|{p["position"]}'
    rec = DERIVED.get(yr, {}).get(key)
    ppg = rec["ppg_half"] if rec else 0.0
    rows.append({"pick": int(p["pick"]), "round": int(p["round"]), "pos": p["position"],
                 "ppg": ppg, "played": 1 if rec else 0, "name": p["pfr_player_name"], "season": yr})

print(f"{len(rows)} drafted skill players, 2015-{max(SEASONS)}")
print(f"never recorded a rookie season: {sum(1 for r in rows if not r['played'])} "
      f"({100*sum(1 for r in rows if not r['played'])/len(rows):.0f}%)\n")

# --- how much does draft slot matter? ---
print("Rookie half-PPR PPG by draft slot (all skill positions)")
print(f"  {'slot':<14}{'n':>5}{'mean PPG':>11}{'median':>9}{'% >8 PPG':>10}{'% never played':>16}")
bands = [(1,12),(13,32),(33,64),(65,105),(106,160),(161,262)]
for lo,hi in bands:
    sub=[r for r in rows if lo<=r["pick"]<=hi]
    if not sub: continue
    pp=np.array([r["ppg"] for r in sub])
    print(f"  {f'{lo}-{hi}':<14}{len(sub):>5}{pp.mean():>11.2f}{np.median(pp):>9.2f}"
          f"{100*np.mean(pp>8):>9.0f}%{100*np.mean([1-r['played'] for r in sub]):>15.0f}%")

print("\nBy position, first two rounds (pick 1-64):")
print(f"  {'pos':<6}{'n':>5}{'mean PPG':>11}{'median':>9}{'% >8 PPG':>10}")
for pos in POS:
    sub=[r for r in rows if r["pos"]==pos and r["pick"]<=64]
    if len(sub)<8: continue
    pp=np.array([r["ppg"] for r in sub])
    print(f"  {pos:<6}{len(sub):>5}{pp.mean():>11.2f}{np.median(pp):>9.2f}{100*np.mean(pp>8):>9.0f}%")

# --- predictive strength ---
print("\nPredictive strength of draft capital on rookie PPG")
for pos in POS:
    sub=[r for r in rows if r["pos"]==pos]
    if len(sub)<40: continue
    x=np.array([math.log(r["pick"]) for r in sub]); y=np.array([r["ppg"] for r in sub])
    rho=stats.spearmanr([r["pick"] for r in sub], y)[0]
    r2=stats.pearsonr(x,y)[0]**2
    print(f"  {pos}: n={len(sub):<4} spearman(pick, PPG)={rho:+.3f}  R2 on log(pick)={r2:.3f}")

# --- the model actually shipped: log(pick) per position ---
print("\nFitted rookie model  PPG = a + b*ln(pick)   [used by draftScore.js]")
COEF={}
for pos in POS:
    sub=[r for r in rows if r["pos"]==pos]
    x=np.array([math.log(r["pick"]) for r in sub]); y=np.array([r["ppg"] for r in sub])
    A=np.c_[np.ones(len(x)),x]
    (a,b),*_=np.linalg.lstsq(A,y,rcond=None)
    resid=y-(a+b*x)
    COEF[pos]=(a,b,resid.std())
    print(f"  {pos}: a={a:+.4f}  b={b:+.4f}  residual sd={resid.std():.2f}")
    for pk in (3,10,25,50,100):
        print(f"        pick {pk:<4} -> {max(a+b*math.log(pk),0):.1f} PPG")
