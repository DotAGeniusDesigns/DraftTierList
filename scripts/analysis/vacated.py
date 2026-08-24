"""WR/RB/TE: vacated target share / vacated air-yards share -- how much of a
team's passing-game volume opened up because the players who had it left,
entering the season being predicted.

Unlike everything else tested in this project, this describes the TEAM's
incoming situation, not the player's own history -- so it's tested the way
team_change already is (team_context.py's context_for convention): as a
feature of the season being PREDICTED, priced off the season before it. A
player's vacated share is his new team's, not his own team from last year.

No new feed -- built directly from the nflverse weekly files already cached
for the corpus (2015-2025), independent of the corpus's own gp>=8 filter so
the team totals reflect the whole depth chart, not just qualifying players.
"""
import csv, io, os, sys
from collections import defaultdict
import numpy as np
from scipy import stats

sys.path.insert(0, os.path.dirname(__file__))
from metrics import DERIVED, SEASONS
from routes import load_gz_text, norm

def team_target_picture(season):
    """-> {norm(name)|pos: (team_of_record, season_targets, season_air_yards)}"""
    acc = defaultdict(lambda: defaultdict(float))
    for r in csv.DictReader(io.StringIO(load_gz_text(f"nflverse-week-{season}"))):
        if r.get("season_type") != "REG" or r.get("position") not in ("WR", "RB", "TE"):
            continue
        key = f"{norm(r.get('player_display_name') or r.get('player_name'))}|{r['position']}"
        a = acc[key]
        try:
            a["tgt"] += float(r.get("targets") or 0)
            a["ay"] += float(r.get("receiving_air_yards") or 0)
        except ValueError:
            pass
        team = r.get("team")
        if team:
            a[f"team|{team}"] += 1
    out = {}
    for key, a in acc.items():
        teams = {k.split("|", 1)[1]: v for k, v in a.items() if k.startswith("team|")}
        team = max(teams.items(), key=lambda kv: kv[1])[0] if teams else None
        out[key] = (team, a["tgt"], a["ay"])
    return out

_PICTURE_CACHE = {}
def picture(season):
    if season not in _PICTURE_CACHE:
        _PICTURE_CACHE[season] = team_target_picture(season)
    return _PICTURE_CACHE[season]

def vacated_for(team, prior_season):
    """-> (vacated_target_share, vacated_air_yards_share) for `team` entering
    prior_season+1, priced off who kept vs. lost their prior_season role."""
    if not team:
        return None, None
    before, after = picture(prior_season), picture(prior_season + 1)
    total_tgt = total_ay = stayed_tgt = stayed_ay = 0.0
    for key, (t, tgt, ay) in before.items():
        if t != team:
            continue
        total_tgt += tgt
        total_ay += ay
        nxt = after.get(key)
        if nxt and nxt[0] == team:
            stayed_tgt += tgt
            stayed_ay += ay
    if total_tgt <= 0:
        return None, None
    vac_tgt = (total_tgt - stayed_tgt) / total_tgt * 100
    vac_ay = (total_ay - stayed_ay) / total_ay * 100 if total_ay > 0 else None
    return vac_tgt, vac_ay

def test(pos, seasons):
    a_list, b_list, vt_list, va_list = [], [], [], []
    for s in seasons[:-1]:
        nxt = DERIVED.get(s + 1)
        if not nxt or (s + 1) not in seasons:
            continue
        for key, rec in DERIVED[s].items():
            if rec["pos"] != pos or rec["gp"] < 8:
                continue
            t = nxt.get(key)
            if not t or t["gp"] < 6:
                continue
            vt, va = vacated_for(t.get("team"), s)
            if vt is None:
                continue
            a_list.append(rec); b_list.append(t)
            vt_list.append(vt); va_list.append(va if va is not None else np.nan)
    n = len(a_list)
    if n < 30:
        print(f"  {pos}: n={n}, too few")
        return
    nxt_ppg = np.array([r["ppg_half"] for r in b_list])
    shipped = {"WR": ["rec_yd_pg", "tgt_pg"], "RB": ["scrim_yd_pg", "tgt_pg"],
               "TE": ["rec_yd_pg", "target_share"]}[pos]
    X = np.vstack([np.array([r.get(c, np.nan) for r in a_list], float) for c in shipped] + [np.ones(n)]).T
    ok_base = ~np.isnan(X).any(axis=1)
    for name, x in (("vacated_target_share", np.array(vt_list)),
                    ("vacated_air_yards_share", np.array(va_list))):
        ok = ok_base & ~np.isnan(x)
        rho, p = stats.spearmanr(x[ok], nxt_ppg[ok])
        coef, *_ = np.linalg.lstsq(X[ok], x[ok], rcond=None)
        resid = x[ok] - X[ok] @ coef
        rho_p, p_p = stats.spearmanr(resid, nxt_ppg[ok])
        print(f"  {pos} {name:<24} n={ok.sum():4d}  raw rho={rho:+.3f} (p={p:.1e})   "
              f"| {'+'.join(shipped)} partial rho={rho_p:+.3f} (p={p_p:.1e})")

if __name__ == "__main__":
    print(f"\n{'='*90}\nvacated target/air-yards share as a predictor of the season it lands in "
          f"(2015-2025)\n{'='*90}")
    for pos in ("WR", "RB", "TE"):
        test(pos, SEASONS)
