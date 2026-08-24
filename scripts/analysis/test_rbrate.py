"""Does ryoe_att / brk_tkl_rate earn a place in the ACTUAL shipped RB model?

Same bar as test_routes.py: added to fit_wide.py's real, already-selected
FEATURES["RB"] (not just the four-driver baseline), scored leave-one-season-out,
sign-constrained. brk_tkl_rate is the only one worth this step -- ryoe_att's
partial correlation against shipped features was already dead (p=.44); it's
included for completeness, not because it looked promising.
"""
import io, sys
import numpy as np

_buf = sys.stdout
sys.stdout = io.StringIO()  # test_levers prints a research dump on import
from rbrate import attach_rb_rate_features
from wide_model import SECONDARY, SIGN, design, fit_signed, loso as loso_signed
sys.stdout = _buf

attach_rb_rate_features()
SIGN["ryoe_att"] = +1
SIGN["brk_tkl_rate"] = +1
ALPHAS = [1, 5, 15, 40, 100]

# Copied from fit_wide.py's FEATURES, not imported: fit_wide.py writes
# projectionModel.js unconditionally at module scope (no __main__ guard).
FEATURES_RB = ["ppg_half", "scrim_yd_pg", "age", "tgt_pg", "team_change"]

def best(keep):
    return max(loso_signed("RB", a, keep) for a in ALPHAS)

SECONDARY["RB"] = SECONDARY["RB"] + ["ryoe_att", "brk_tkl_rate"]

r2_shipped = best(FEATURES_RB)
r2_ryoe = best(FEATURES_RB + ["ryoe_att"])
r2_brk = best(FEATURES_RB + ["brk_tkl_rate"])
r2_both = best(FEATURES_RB + ["ryoe_att", "brk_tkl_rate"])

print(f"\n{'='*78}\nRB: ryoe_att/brk_tkl_rate vs. the actual shipped FEATURES{FEATURES_RB}\n{'='*78}")
print(f"  shipped alone                    LOSO R2 = {r2_shipped:.4f}")
print(f"  shipped + ryoe_att               LOSO R2 = {r2_ryoe:.4f}  ({r2_ryoe-r2_shipped:+.4f})")
print(f"  shipped + brk_tkl_rate           LOSO R2 = {r2_brk:.4f}  ({r2_brk-r2_shipped:+.4f})")
print(f"  shipped + both                   LOSO R2 = {r2_both:.4f}  ({r2_both-r2_shipped:+.4f})")

alpha = max(ALPHAS, key=lambda a: loso_signed("RB", a, FEATURES_RB + ["ryoe_att", "brk_tkl_rate"]))
X, y, seas, names, med = design("RB", FEATURES_RB + ["ryoe_att", "brk_tkl_rate"])
beta, mu, sd = fit_signed(X, y, names, alpha)
print(f"\n  full fit (alpha={alpha}), coefficients ranked by |weight|:")
for n, c in sorted(zip(names, beta[1:]), key=lambda t: -abs(t[1])):
    dead = " (fit to zero)" if abs(c) < 0.01 else ""
    flag = "  <-- NEW" if n in ("ryoe_att", "brk_tkl_rate") else ""
    print(f"    {n:<20}{c:+.4f}{dead}{flag}")
