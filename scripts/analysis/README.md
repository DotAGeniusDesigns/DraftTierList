# Metric research

One-off analysis used to pick the draft-kit scoring inputs. Not part of the app
build — nothing in `src/` imports this.

Requires `python3` with `numpy` and `scipy`, and a populated `.cache/nflstats/`
(run `npm run stats` once to fill it).

```bash
cd scripts/analysis
python3 corpus.py       # 2015-2025 player-seasons -> corpus.json  (run first)
python3 univariate.py   # predictive power + year-over-year stickiness
python3 incremental.py  # out-of-sample value ADDED beyond prior-season PPG
python3 stepwise.py     # forward selection, production-vs-opportunity head-to-head
python3 agebust.py      # age curves and boom/bust base rates
python3 samevsnext.py   # same-season vs next-season R^2
python3 rookies.py      # draft capital as a rookie predictor
python3 fit_model.py    # four-driver fit; still the source of the rookie model
python3 team_context.py # team offence, line play, strength of schedule
python3 test_levers.py  # do team context / schedule / pedigree add anything?
python3 test_expanded.py# does a wider model beat four drivers?
python3 wide_model.py   # the sign-constrained wide fit
python3 test_resid.py   # does orthogonalising the collinear tail help? (no)
python3 test_qbsplit.py # split the QB fit; can the zero-weight inputs be dropped?
python3 fit_wide.py     # SHIPPED: writes src/utils/projectionModel.js
```

`fit_wide.py` is what actually generates the model the app uses. Findings worth
keeping in mind before adding levers:

- **Strength of schedule does not help.** Season-long SOS scored negative at all
  four positions. The spread between the easiest and hardest 2026 schedule is
  about 2.5 points per game of opponent defence, and a player's own production
  already reflects more than that.
- **Team context does not help either** — pace, pass rate, offensive EPA, points,
  sack rate and rushing efficiency all landed at or below zero. They are heavily
  collinear with the player's own stats, which already encode the offence.
- **A new head coach adds nothing.** Players on teams that changed coach do lose
  more ground the following year (RB median -0.69 PPG vs -0.32), but the effect
  vanishes once their own stats are in the model: WR -0.0005, RB +0.0002,
  TE +0.0001, QB -0.0047. Teams fire coaches after bad seasons, and the badness
  is already visible in the player's line. See `test_coaching.py`.
- **Coordinator changes are untested.** No nflverse feed carries OC or play-caller
  history, so there is no way to fit or validate one here.
- **Depth-chart rank is untestable too** — `depth_charts` only goes back to 2024,
  which is two year-over-year pairs. Not enough to fit a weight worth trusting.
- **What did help:** changing teams (every position) and durability (QB).
- **Most of the declared inputs fit to exactly zero, and that is correct.** The
  opportunity metrics correlate 0.95-0.99 with each other and with prior PPG
  (`target_share`~`wopr` 0.986, `ppg_half`~`rec_yd_pg` 0.982), so the sign bounds
  park the redundant ones at the boundary. Residualising them against the
  production block — the obvious fix — buys WR +0.0009, RB +0.0003, TE +0.0001,
  QB +0.0026, all at or under the noise floor, and leaves WR with fewer live
  inputs than before (`test_resid.py`). Dropping them instead costs nothing and
  scores marginally better, so `fit_wide.py` fits twice and ships only the
  survivors.
- **The card's four drivers are ranked by fitted weight.** They used to come from
  a hand-kept list in `test_levers.py`, which drifted: RB displayed `tgt_pg` at a
  coefficient of exactly zero, and QB displayed `int_pg`, its eighth-largest
  input, instead of `team_change`, its fourth.
- **Splitting the QB fit into passing and rushing is real but marginal.** The two
  blocks correlate only ~0.4 and reconstruct total PPG at r = 0.995, and fitting
  them apart scores +0.0044 leave-one-season-out. Not shipped — thin on n=281 and
  it doubles the QB model for ~1% relative. `test_qbsplit.py` keeps the harness.
- **There is no better QB indicator in these feeds.** Over a prior-PPG baseline
  only `rush_att_pg` (+0.0112), `pass_td_pg` (+0.0068) and `rush_yd_pg` (+0.0054)
  add anything, and all three are already in. `cpoe`, `pass_epa_pg`, `ypa`,
  `td_per_patt` and `pass_rz_att_pg` all measure negative. QB R² ~0.40 is a
  ceiling, not an oversight.
- **Rookies are graded off recency-weighted band means, not a curve.** The fitted
  `a + b*ln(pick)` curve is gone. It only ever governed picks outside the very top
  (the band mean bound RB 1-7, WR 1-14, TE 1-11, QB 1-2), so the card quoted a
  band average as its evidence and printed a different number next to it. Band
  means carry a five-year half-life because the rookie year trend is positive for
  pass catchers — WR +0.098 PPG/yr (t=+1.91), TE +0.100 (t=+2.06) — while RB is a
  genuine null (-0.019, t=-0.26). Quoting the RB figure for all four positions is
  an easy and previously-made mistake. Means are forced non-increasing across
  bands; that guard currently binds only on TE, whose top band rests on n=3.
- **Draft capital is deliberately excluded for veterans.** It scores as a lever
  (+0.004 for RB, and its correlation with next-season PPG holds even at 5+
  seasons of experience) but it is pedigree substituting for performance — a back
  with three years on tape was getting +1.2 PPG from his draft slot. Removing it
  costs RB about 0.005. It is still the entire basis of the rookie model.

`fit_wide.py` is the only script here that writes into `src/`. It regenerates
`projectionModel.js`, which `src/utils/draftScore.js` reads at runtime to build
the Draft Kit cards, so rerun it after refreshing the stat cache if you want the
coefficients to move. `fit_model.py` used to write that same path; it now emits
`projectionModel.four-driver.js` beside the scripts, because the two no longer
share a rookie schema and running it would have NaN'd every rookie card. Each position's four drivers are chosen by out-of-sample
score subject to every driver keeping the sign its research supports — an
unconstrained search scores marginally higher but returns collinearity artifacts
(snap share as a negative driver, touchdowns-over-expected as a positive one)
that cannot honestly be shown on a card. The script asserts those signs before
writing, so a bad fit fails loudly instead of shipping.

Corpus: ~6,700 player-seasons (QB/RB/WR/TE), 2015-2025, from the full Sleeper +
nflverse feeds rather than the 350-player board, so it is not survivorship-biased.
Validation runs on leave-one-season-out CV: each transition season is predicted by
a model fit only on the other seasons.
