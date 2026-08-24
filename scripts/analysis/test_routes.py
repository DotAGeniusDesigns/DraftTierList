"""Does route_share / yprr_est earn a place in the ACTUAL shipped model?

route_share is the from-participation-data proxy built in routes.py -- "on the
field for a dropback", not charted routes. It only survived the univariate
incremental check at WR and TE, not RB, so RB isn't tested here.

Bar: added to fit_wide.py's real, already-selected FEATURES[pos] set (not the
wider SECONDARY candidate pool), scored the same way fit_wide.py picks alpha --
leave-one-season-out, sign-constrained. If it doesn't beat the model that's
actually shipping, it doesn't belong in it.
"""
import io, sys
import numpy as np

_buf = sys.stdout
sys.stdout = io.StringIO()  # test_levers prints a research dump on import
from routes import attach_route_features
from wide_model import SECONDARY, SIGN, design, fit_signed, loso as loso_signed
sys.stdout = _buf

# Copied from fit_wide.py's FEATURES, not imported: fit_wide.py writes
# projectionModel.js unconditionally at module scope (no __main__ guard), so
# importing it would silently regenerate the shipped file as a side effect.
FEATURES = {
    "WR": ["ppg_half", "rec_yd_pg", "tgt_pg", "age", "team_change"],
    "TE": ["ppg_half", "rec_yd_pg", "age", "ypr", "target_share", "team_change"],
}

attach_route_features()
SIGN["route_share"] = +1
SIGN["yprr_est"] = +1
ALPHAS = [1, 5, 15, 40, 100]

def best(pos, keep):
    return max(loso_signed(pos, a, keep) for a in ALPHAS)

for pos in ("WR", "TE"):
    SECONDARY[pos] = SECONDARY[pos] + ["route_share", "yprr_est"]

    shipped = FEATURES[pos]
    r2_shipped = best(pos, shipped)
    r2_route = best(pos, shipped + ["route_share"])
    r2_yprr = best(pos, shipped + ["yprr_est"])
    r2_both = best(pos, shipped + ["route_share", "yprr_est"])

    print(f"\n{'='*78}\n{pos}: route_share/yprr_est vs. the actual shipped FEATURES{shipped}\n{'='*78}")
    print(f"  shipped alone                    LOSO R2 = {r2_shipped:.4f}")
    print(f"  shipped + route_share            LOSO R2 = {r2_route:.4f}  ({r2_route-r2_shipped:+.4f})")
    print(f"  shipped + yprr_est               LOSO R2 = {r2_yprr:.4f}  ({r2_yprr-r2_shipped:+.4f})")
    print(f"  shipped + both                   LOSO R2 = {r2_both:.4f}  ({r2_both-r2_shipped:+.4f})")

    # does route_share survive its sign bound when fit alongside everything
    # already shipped, or does it get parked at zero like target_share did?
    alpha = max(ALPHAS, key=lambda a: loso_signed(pos, a, shipped + ["route_share", "yprr_est"]))
    X, y, seas, names, med = design(pos, shipped + ["route_share", "yprr_est"])
    beta, mu, sd = fit_signed(X, y, names, alpha)
    print(f"\n  full fit (alpha={alpha}), coefficients ranked by |weight|:")
    for n, c in sorted(zip(names, beta[1:]), key=lambda t: -abs(t[1])):
        dead = " (fit to zero)" if abs(c) < 0.01 else ""
        flag = "  <-- NEW" if n in ("route_share", "yprr_est") else ""
        print(f"    {n:<20}{c:+.4f}{dead}{flag}")
