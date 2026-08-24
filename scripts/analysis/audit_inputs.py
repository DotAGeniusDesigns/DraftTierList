"""What is each shipped input actually worth?

Refits the model without each input in turn and measures the leave-one-season-out
loss. An input that costs nothing to remove is not earning its place on the card
or in the file, whatever its coefficient looks like.
"""
import json
import numpy as np
from wide_model import design, fit_signed, loso

MODEL = json.loads(
    open("/home/dotagenius/DraftList/src/utils/projectionModel.js").read()
    .split("PROJECTION_MODEL = ")[1].split("export const ROOKIE_MODEL")[0].rstrip().rstrip(";")
)

print("Drop-one-input audit (leave-one-season-out R2)\n")
for pos in ("QB", "RB", "WR", "TE"):
    spec = MODEL[pos]
    feats, alpha = spec["features"], spec["alpha"]
    full = loso(pos, alpha, feats)
    X, y, seas, names, _ = design(pos, feats)
    beta, mu, sd = fit_signed(X, y, names, alpha)
    print(f"{pos}  full R2={full:.4f}  n={len(y)}  alpha={alpha}")
    rows = []
    for f in feats:
        without = [g for g in feats if g != f]
        rows.append((f, full - loso(pos, alpha, without),
                     abs(beta[1 + names.index(f)])))
    print(f"    {'input':<18}{'coef':>8}{'R2 lost if dropped':>21}")
    for f, loss, c in sorted(rows, key=lambda r: -r[1]):
        flag = ""
        if loss < 0:
            flag = "   <- REMOVING IT HELPS"
        elif loss < 0.0005:
            flag = "   <- pays for nothing"
        print(f"    {f:<18}{c:>8.3f}{loss:>21.5f}{flag}")
    print()

# How often is an input missing and silently replaced by the league median?
print("Median-imputation rate per input (share of training rows with no value)\n")
from metrics import pairs
from test_levers import BLEND, blended
for pos in ("QB", "RB", "WR", "TE"):
    pr = pairs(pos)
    A = [a for a, _ in pr]
    out = []
    for f in MODEL[pos]["features"]:
        if f in ("team_change", "durability"):
            continue
        v = np.array([blended(a, f, BLEND[pos]) for a in A], float)
        share = float(np.mean(~np.isfinite(v)))
        if share > 0.01:
            out.append((f, share))
    if out:
        print(f"  {pos}: " + ", ".join(f"{f} {100*s:.0f}%" for f, s in sorted(out, key=lambda t: -t[1])))
    else:
        print(f"  {pos}: none above 1%")
