"""Re-tests every candidate previously rejected on a Spearman partial-correlation
screen, using the REAL bar instead: added to the shipped FEATURES set, scored
leave-one-season-out under the sign constraint.

Why this exists. The screen those candidates were dismissed on ranked both
sides (Spearman). The fit minimises squared error in PPG, which responds to
Pearson. On a binary or skewed input those disagree in SIGN -- contract_year
screened at Spearman +0.196 / Pearson -0.024, and ryoe_att at Spearman -0.083 /
Pearson +0.060, so the screen produced one false positive and one false
negative in the same round. Frisch-Waugh-Lovell says the OLS coefficient's sign
always matches the PEARSON partial, so the screen was simply the wrong statistic.
Rather than fix it, this replaces it with the thing it was approximating.
"""
import io, sys
import numpy as np

_buf = sys.stdout
sys.stdout = io.StringIO()
import wide_model
from wide_model import SECONDARY, CONTEXT, SIGN, design, fit_signed, loso as loso_signed
from routes import attach_route_features, norm
from firstread import attach_first_read_features
from ngsrecv import attach_ngs_recv_features
from rbrate import attach_rb_rate_features
from qbrate import attach_qb_rate_features
from vacated import vacated_for
sys.stdout = _buf

attach_route_features()
attach_first_read_features()
attach_ngs_recv_features()
attach_rb_rate_features()
attach_qb_rate_features()

# vacated_* describe the team the player is joining, so they arrive through
# enrich (like team_change), not as a blended per-season stat.
_orig_enrich = wide_model.enrich
def enrich_with_vacated(a, b):
    out = _orig_enrich(a, b)
    vt, va = vacated_for(b.get("team"), a["season"])
    out["vacated_target_share"] = vt
    out["vacated_air_yards_share"] = va
    return out
wide_model.enrich = enrich_with_vacated

FEATURES = {
    "QB": ["ppg_half", "pass_yd_pg", "rush_att_pg", "int_pg",
           "pass_td_pg", "rush_yd_pg", "team_change", "durability"],
    "RB": ["ppg_half", "scrim_yd_pg", "age", "tgt_pg", "team_change", "ryoe_att"],
    "WR": ["ppg_half", "rec_yd_pg", "tgt_pg", "age", "team_change"],
    "TE": ["ppg_half", "rec_yd_pg", "age", "ypr", "target_share", "team_change",
           "avg_yac_above_expectation"],
}
ALPHAS = [1, 5, 15, 40, 100]

# Signs from the research, same convention as wide_model.SIGN. avg_cushion is
# the one genuinely ambiguous case: analysts read a big cushion as the defence
# not respecting you, and its raw correlation here is negative, so -1.
CANDIDATES = {
    "WR": [("route_share", +1), ("yprr_est", +1), ("fd_per_route", +1),
           ("first_read_share", +1), ("avg_separation", +1), ("avg_cushion", -1),
           ("vacated_target_share", +1), ("vacated_air_yards_share", +1)],
    "TE": [("route_share", +1), ("yprr_est", +1), ("fd_per_route", +1),
           ("first_read_share", +1), ("avg_separation", +1), ("avg_cushion", -1),
           ("vacated_target_share", +1), ("vacated_air_yards_share", +1)],
    "RB": [("route_share", +1), ("yprr_est", +1), ("fd_per_route", +1),
           ("first_read_share", +1), ("brk_tkl_rate", +1), ("ybc_att", +1),
           ("vacated_target_share", +1), ("vacated_air_yards_share", +1)],
    "QB": [("epa_per_db", +1)],
}
CONTEXT_FEATS = {"vacated_target_share", "vacated_air_yards_share"}

for pos, cands in CANDIDATES.items():
    for feat, sign in cands:
        SIGN[feat] = sign
        if feat in CONTEXT_FEATS:
            if feat not in CONTEXT[pos]:
                CONTEXT[pos] = CONTEXT[pos] + [feat]
        elif feat not in SECONDARY[pos]:
            SECONDARY[pos] = SECONDARY[pos] + [feat]

def best(pos, keep):
    return max(loso_signed(pos, a, keep) for a in ALPHAS)

print("Real-bar re-test of candidates rejected on the Spearman screen")
print("(gain = LOSO R2 with the candidate minus LOSO R2 of the shipped set)\n")
for pos in ("WR", "RB", "TE", "QB"):
    shipped = FEATURES[pos]
    base = best(pos, shipped)
    print(f"{pos}  shipped LOSO R2 = {base:.4f}")
    rows = []
    for feat, _ in CANDIDATES[pos]:
        try:
            r2 = best(pos, shipped + [feat])
        except Exception as exc:
            print(f"    {feat:<26} SKIPPED ({exc})")
            continue
        alpha = max(ALPHAS, key=lambda a: loso_signed(pos, a, shipped + [feat]))
        X, y, seas, names, med = design(pos, shipped + [feat])
        beta, _, _ = fit_signed(X, y, names, alpha)
        coef = beta[1 + names.index(feat)] if feat in names else float("nan")
        rows.append((r2 - base, feat, r2, coef))
    for gain, feat, r2, coef in sorted(rows, reverse=True):
        mark = "  <-- BEATS the shipped set" if gain > 0.001 else ""
        print(f"    {feat:<26} R2={r2:.4f}  gain={gain:+.4f}  coef={coef:+.4f}{mark}")
    print()
