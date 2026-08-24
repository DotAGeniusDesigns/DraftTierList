"""Derived per-season metrics + transition-pair construction."""
import json, os, math
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
corpus = json.load(open(os.path.join(HERE, "corpus.json")))
SEASONS = sorted(int(s) for s in corpus)

def safe(a, b, default=None):
    return a / b if b else default

def derive(r):
    """Adds rate/share metrics. Per-game rates use games played, not games active."""
    gp = r["gp"]
    d = dict(r)
    d["ppg_half"] = safe(r["pts_half"], gp, 0.0)
    d["ppg_ppr"] = safe(r["pts_ppr"], gp, 0.0)
    d["snap_pct"] = safe(r["off_snp"], r["tm_off_snp"])
    if d["snap_pct"] is not None:
        d["snap_pct"] *= 100

    tgt, rec = r["tgt"], r["rec"]
    d["tgt_pg"] = safe(tgt, gp, 0.0)
    d["rec_pg"] = safe(rec, gp, 0.0)
    d["rec_yd_pg"] = safe(r["rec_yd"], gp, 0.0)
    d["rz_tgt_pg"] = safe(r["rz_tgt"], gp, 0.0)
    d["catch_rate"] = safe(rec, tgt) if tgt >= 20 else None
    d["ypt"] = safe(r["rec_yd"], tgt) if tgt >= 20 else None
    d["ypr"] = safe(r["rec_yd"], rec) if rec >= 15 else None
    d["rec_td_pg"] = safe(r["rec_td"], gp, 0.0)
    d["td_per_tgt"] = safe(r["rec_td"], tgt) if tgt >= 20 else None

    att = r["rush_att"]
    d["rush_att_pg"] = safe(att, gp, 0.0)
    d["rush_yd_pg"] = safe(r["rush_yd"], gp, 0.0)
    d["rz_att_pg"] = safe(r["rz_att"], gp, 0.0)
    d["ypc"] = safe(r["rush_yd"], att) if att >= 30 else None
    d["rush_td_pg"] = safe(r["rush_td"], gp, 0.0)
    d["td_per_att"] = safe(r["rush_td"], att) if att >= 30 else None

    d["touches_pg"] = safe(att + rec, gp, 0.0)
    d["opportunity_pg"] = safe(att + tgt, gp, 0.0)
    d["total_td_pg"] = safe(r["rush_td"] + r["rec_td"], gp, 0.0)
    d["scrim_yd_pg"] = safe(r["rush_yd"] + r["rec_yd"], gp, 0.0)

    # PFF-style weighted opportunity (RB): red-zone work priced above the rest.
    nonrz_att = max(att - r["rz_att"], 0)
    nonrz_tgt = max(tgt - r["rz_tgt"], 0)
    d["weighted_opp_pg"] = safe(
        r["rz_att"] * 1.28 + r["rz_tgt"] * 2.39 + nonrz_att * 0.47 + nonrz_tgt * 1.54, gp, 0.0)

    pa = r["pass_att"]
    d["pass_att_pg"] = safe(pa, gp, 0.0)
    d["pass_yd_pg"] = safe(r["pass_yd"], gp, 0.0)
    d["pass_td_pg"] = safe(r["pass_td"], gp, 0.0)
    d["int_pg"] = safe(r["pass_int"], gp, 0.0)
    d["pass_rz_att_pg"] = safe(r["pass_rz_att"], gp, 0.0)
    d["ypa"] = safe(r["pass_yd"], pa) if pa >= 100 else None
    d["td_per_patt"] = safe(r["pass_td"], pa) if pa >= 100 else None

    for k in ("rec_epa", "rush_epa", "pass_epa"):
        d[k + "_pg"] = safe(r.get(k), gp) if r.get(k) is not None else None
    return d

DERIVED = {s: {k: derive(v) for k, v in corpus[str(s)].items()} for s in SEASONS}

def pairs(position, min_gp_from=8, min_gp_to=6):
    """(year N record, year N+1 record) for one position."""
    out = []
    for s in SEASONS[:-1]:
        nxt = DERIVED[s + 1]
        for key, rec in DERIVED[s].items():
            if rec["pos"] != position or rec["gp"] < min_gp_from:
                continue
            t = nxt.get(key)
            if not t or t["gp"] < min_gp_to:
                continue
            out.append((rec, t))
    return out

if __name__ == "__main__":
    # Validation: Sleeper's own scoring must reproduce a known line.
    c = DERIVED[2025].get("jamarrchase|WR")
    print(f"Chase 2025  half={c['pts_half']} ppg={c['ppg_half']:.2f} "
          f"tgt_share={c['target_share']:.1f} wopr={c['wopr']:.3f}")
    for pos in ("QB", "RB", "WR", "TE"):
        print(f"{pos}: {len(pairs(pos))} transition pairs")
