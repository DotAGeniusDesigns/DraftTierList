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
- **What did help:** changing teams (every position), durability (QB), and TE
  yards-after-catch over expectation (`ngsrecv.py`, from NGS). The last one is
  worth its provenance: leave-one-season-out +0.0064, and it passes the
  five-origin rolling audit outright — positive at 5/5 origins, mean +0.0083,
  and the gain *grows* as the training window lengthens (+0.0023 → +0.0152),
  which is what a real effect looks like. TE-only on purpose; WR measured
  negative. Thin in the corpus (NGS publishes ~50 qualifying players a season,
  so only 28% of qualifying TE seasons carry a real value) but fine on the
  board, where 18/19 top-150 TEs have a real 2023+ value.
- **`ryoe_att` was shipped and then pulled — LOSO is not enough on its own.**
  NGS rushing yards over expected per attempt scored +0.0033 leave-one-season-
  out, stable across every alpha, and went into the RB model on that. Put
  through the rolling origin afterwards it is positive only at the earliest
  origin (+0.0044 at 2018) and negative at all four later ones, mean −0.0027,
  so it was removed. The plumbing is still there (`rbrate.py` builds it,
  `updateStats.js` joins `rush.yoeAtt`), so re-enabling is one line in
  `FEATURES` — but not on a LOSO score. **Leave-one-season-out trains on future
  seasons to predict past ones, so it can reward a period-specific artifact
  that never generalises forward. Rolling origin only ever trains on the past.
  Anything new gets both.** `avg_yac_above_expectation` measured NEGATIVE
  at WR (-0.0001 to -0.0008) and is TE-only for that reason. `route_share` (`routes.py`, "on the field for a dropback" from
  nflverse's participation feed, 2016+) measured similarly at WR/TE
  (+0.0009-0.0016) but was NOT shipped — smaller than ryoe_att's gain and never
  revisited after that call. Broken-tackle rate (also `rbrate.py`), first-read
  share and first downs per route (`firstread.py`, FTN charting), and QB EPA
  per dropback / CPOE (`qbrate.py`) were all tested and add nothing once
  current production is already in the model. Opportunity share as a percent
  of team plays and seasons of experience were tested the same way as one-off
  checks, not committed scripts — same result, nothing survived controlling
  for current production.
- **The contract-year "boost" runs the wrong way, and not where the theory
  says.** Following up the screen result, `contract_interaction.py` tested the
  sharper version of the claim — that the effect is concentrated among
  low-production or low-usage players — in PPG units, within prior-PPG and
  prior-snap-share buckets, so regression to the mean is held constant. In the
  bottom third, where the theory expects the most: WR −0.16 (p=.52), RB −0.48
  (p=.25), TE −0.03 (p=.88). Nothing. Every difference that IS significant is
  **negative** and sits in the MIDDLE bucket: WR −0.80 by PPG and −1.59 by snap
  share, RB −1.01 and −1.39, TE −0.89 (all p<.05, several p<.005).
  Contract-year players *underperform* same-production peers. The likely
  reading is selection, not motivation — teams extend the players they believe
  in, so still being on an expiring deal is mild negative information, and the
  middle tier is exactly where that discriminates (stars get extended, fringe
  players are fringe either way). Splitting the low bucket by age finds nothing
  at any age, so it isn't career stage either. Note these are uncorrected for
  ~16 comparisons, but the direction is uniform and the strongest are p<.005.
- **Compound metrics were built and tested as a family; none reached the bar**
  (`composites.py`, `test_composites.py`). These are constructed stats rather
  than new raw inputs — the premise being that two individually ambiguous
  numbers can become unambiguous together. Built: expected fantasy points from
  the opportunity mix (`xfp_pg`, priced per target by air-yard bucket and per
  carry by field position) and actual-minus-expected; late-season role (final
  four games played, and its delta vs the season average); weekly target-share
  volatility; carries inside the FIVE and share of the team's; NGS separation
  residualised on aDOT to strip the depth confound; light-box rate; PFR's
  before/after-contact split and a `team_change × portable_share` interaction;
  absolute intended air yards per game. Screened with Pearson against
  out-of-sample residuals, Holm-corrected across 21. **0 of 21 survived.**
  Three RB near-misses (raw p<.05) were escalated anyway:
  `fp_over_xfp` looked best on LOSO (+0.0029) and failed the rolling origin
  (mean −0.0001, positive at 2/5) — and its sign had to be flipped from the
  pre-declared one to test it at all, which is its own warning.
  `role_trend_touch` (+0.0012 LOSO, +0.0016 rolling, 4/5) and `late_ppg`
  (+0.0014, +0.0012, 4/5) are directionally consistent but sit under the
  +0.003 noise floor, and putting all three in together scored WORSE on the
  rolling origin than either alone — they are one collinear signal, not three.
  Worth knowing which ideas died, because several were well-motivated:
  **the portable/non-portable production split was flat** (`portable_share`
  r=+0.011, the team-change interaction r=−0.010), so "discount the part of a
  back's production that belonged to his line when he moves" is either wrong or
  not captured by PFR's YBC/YAC columns. **Goal-line share was flat** (+0.015)
  — owning the five-yard-line does not predict next season beyond what the
  model already holds. **Depth-adjusting separation did not rescue it** (WR
  +0.047, p=.21 — better than the raw metric, still nothing). QB designed runs
  vs scrambles: both flat. xFP itself is well calibrated (CeeDee Lamb 2024:
  14.1 expected against 14.19 actual); it is the *residual* from it that
  carries no forward signal.
- **Subgroup interactions were searched once, under discipline, and found
  nothing** (`test_interactions.py`). The idea is sound — a metric can matter
  for part of the population and wash out on average — but it is also the
  easiest way to manufacture a false positive, so the run was constrained:
  eleven interactions pre-specified with a written mechanism BEFORE looking,
  screened with Pearson against out-of-sample residuals, Holm-corrected across
  the family. **0 of 9 testable interactions survived.** Two more (WR
  separation, TE yac-over-expected, both inside a small-role slice) had
  subgroups too small to test at all.
  The most interesting near-miss, and the only one worth ever revisiting, is QB
  passing efficiency conditioned on rushing volume: for pocket QBs
  (`rush_att_pg < 4`, n=196) `epa_per_db` correlates +0.118 with the residual,
  and for rushing QBs (n=78) it is −0.172. Opposite signs inside and outside is
  the actual shape of a real interaction, not a main effect leaking. But raw
  p=.099, Holm p=.85, and the three QB rows are NOT three pieces of evidence —
  `epa_per_db`, `pass_epa_pg` and `cpoe` all measure passing quality and are
  effectively one hypothesis tested three ways. n=78 rushing QBs cannot resolve
  it. Revisit only with more seasons, not with a different slice of these.
  The broader lesson matches everything else here: the main effects already
  capture what is capturable. Note the structural tension if anyone is tempted
  to go further — a tree model would find interactions natively, but this
  project requires every input to render as a signed, explainable contribution
  on a card, which a boosted ensemble cannot do.
- **Contract year is also the cautionary tale — check the joint fit, not the
  screen.** A contract-year flag (`contractyear.py`, from nflverse's OTC
  `contracts` release) showed the largest partial correlation of any candidate
  ever tested here: +0.16 to +0.28 at RB/WR/TE, holding up even after adding
  age to the controls (which did kill QB's, so that one really was career stage
  in disguise). In the real sign-constrained joint fit it is worth **exactly
  nothing** — fit to zero at RB and WR, -0.0009 at TE. Solved jointly, the ridge
  absorbs it into `age`. The reverse also happened the same round: `ryoe_att`
  looked dead on the screen (partial p=.44) and is now shipped. A cheap partial
  correlation is a filter for what to test properly, never a verdict.
  `test_rescreen.py` re-ran every candidate rejected on that screen against the
  real bar. The verdicts almost all held: only TE `first_read_share` moved
  (dead on the screen, +0.0011 in the fit) and WR `route_share` reconfirmed at
  +0.0016. Neither is shipped — both are inside the noise band, and
  `first_read_share` has FTN charting for only 2022-2025, the thinnest coverage
  of anything tested here.
- **Also measured and rejected that round:** yards before contact per attempt
  (`rbrate.py` `ybc_att` — the best free stand-in for PFF run-block grades or
  Football Outsiders' adjusted line yards, both paywalled; partial rho −0.001,
  so O-line quality does not reach the RB projection through this proxy), NGS
  average separation and average cushion (`ngsrecv.py`, both ~zero at WR and TE,
  matching what analysts report about cushion), and vacated target share /
  vacated air-yards share (`vacated.py`, dead at all three positions, raw and
  partial). Vacated share is the only team-opportunity feature tested here that
  is not derived from the player's own line, and it still adds nothing.
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
