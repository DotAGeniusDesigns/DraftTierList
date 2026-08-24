"""Does the contract-year flag earn a place in the ACTUAL shipped model, for
the three positions where it survived controlling for age too (RB/WR/TE --
QB's signal was fully explained by age, see contractyear.py)?

Same bar as test_routes.py/test_rbrate.py: added to fit_wide.py's real,
already-selected FEATURES (not just a baseline), scored leave-one-season-out,
sign-constrained.

contract_year is a CONTEXT feature like team_change (known before the season
being predicted starts), not a blended per-season stat, so it's wired in by
wrapping wide_model.enrich rather than attaching to DERIVED records directly.
"""
import io, sys
import numpy as np

_buf = sys.stdout
sys.stdout = io.StringIO()  # test_levers/corpus print a research dump on import
import wide_model
from wide_model import SECONDARY, SIGN, CONTEXT, design, fit_signed, loso as loso_signed
from contractyear import CONTRACT_YEARS, is_contract_year
from rbrate import attach_rb_rate_features
from routes import norm
sys.stdout = _buf

attach_rb_rate_features()

_orig_enrich = wide_model.enrich
def enrich_with_contract(a, b):
    out = _orig_enrich(a, b)
    key = f"{norm(b['name'])}|{b['pos']}"
    out["contract_year"] = (1.0 if is_contract_year(key, b["season"]) else 0.0) \
        if key in CONTRACT_YEARS else None
    return out
wide_model.enrich = enrich_with_contract

SIGN["contract_year"] = +1
SIGN["ryoe_att"] = +1
ALPHAS = [1, 5, 15, 40, 100]

# Copied from fit_wide.py's FEATURES (RB already includes ryoe_att, shipped
# last session), not imported: fit_wide.py writes projectionModel.js
# unconditionally at module scope.
FEATURES = {
    "RB": ["ppg_half", "scrim_yd_pg", "age", "tgt_pg", "team_change", "ryoe_att"],
    "WR": ["ppg_half", "rec_yd_pg", "tgt_pg", "age", "team_change"],
    "TE": ["ppg_half", "rec_yd_pg", "age", "ypr", "target_share", "team_change"],
}

def best(pos, keep):
    return max(loso_signed(pos, a, keep) for a in ALPHAS)

for pos in ("RB", "WR", "TE"):
    CONTEXT[pos] = CONTEXT[pos] + ["contract_year"]
    shipped = FEATURES[pos]
    r2_shipped = best(pos, shipped)
    r2_plus = best(pos, shipped + ["contract_year"])
    print(f"\n{'='*78}\n{pos}: contract_year vs. the actual shipped FEATURES{shipped}\n{'='*78}")
    print(f"  shipped alone                 LOSO R2 = {r2_shipped:.4f}")
    print(f"  shipped + contract_year       LOSO R2 = {r2_plus:.4f}  ({r2_plus-r2_shipped:+.4f})")
    for a in ALPHAS:
        b0 = loso_signed(pos, a, shipped)
        b1 = loso_signed(pos, a, shipped + ["contract_year"])
        print(f"    alpha={a:<4} shipped={b0:.4f}  +contract_year={b1:.4f}  gain={b1-b0:+.4f}")

    alpha = max(ALPHAS, key=lambda a: loso_signed(pos, a, shipped + ["contract_year"]))
    X, y, seas, names, med = design(pos, shipped + ["contract_year"])
    beta, mu, sd = fit_signed(X, y, names, alpha)
    print(f"\n  full fit (alpha={alpha}), coefficients ranked by |weight|:")
    for n, c in sorted(zip(names, beta[1:]), key=lambda t: -abs(t[1])):
        dead = " (fit to zero)" if abs(c) < 0.01 else ""
        flag = "  <-- NEW" if n == "contract_year" else ""
        print(f"    {n:<20}{c:+.4f}{dead}{flag}")
