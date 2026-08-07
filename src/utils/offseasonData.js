// 2026 offseason tracker data — coaching changes, player movement, rookies,
// and three key bullet points per team. Compiled July 2026 from offseason
// reporting; key points refreshed 2026-08-07 against fresh camp reporting,
// the ESPN injury/news feeds, and current fantasy-expert consensus (ADP,
// depth-chart, and camp-battle coverage from FantasyPros, ESPN, SI/OnSI,
// PFF, RotoBaller, Yahoo, CBS, and beat-reporter camp notes).
// Live headlines/transactions: npm run offseason → offseasonNews.js
// Depth charts are NOT stored here — they are computed from playerDatabase
// so they always match the draft board rosters.

export const OFFSEASON_SEASON_LABEL = '2026 Offseason';

// status: 'new' = hired this offseason, 'returning' = retained from 2025
export const offseasonData = {
    ARI: {
        coaching: {
            hc: { name: 'Mike LaFleur', status: 'new', replaced: 'Jonathan Gannon' },
            notes: 'LaFleur arrives from the Rams to install a McVay-style passing game, with Nathaniel Hackett coordinating the offense.',
        },
        additions: [
            { name: 'Tyler Allgeier', pos: 'RB', detail: 'Signed from Atlanta on a deal that out-earns Conner and Benson combined' },
            { name: 'Jacoby Brissett', pos: 'QB', detail: 'Veteran bridge starter after Kyler Murray\'s exit' },
            { name: 'Kendrick Bourne', pos: 'WR', detail: 'Veteran depth behind Harrison and Wilson' },
        ],
        departures: [
            { name: 'Kyler Murray', pos: 'QB', detail: 'Released, signed with Minnesota' },
        ],
        rookies: [
            { name: 'Jeremiyah Love', pos: 'RB', detail: 'Round 1, No. 3 overall (Notre Dame) — immediate lead-back talent' },
            { name: 'Carson Beck', pos: 'QB', detail: 'Developmental pick behind Brissett' },
        ],
        keyPoints: [
            "Camp reps say timeshare, not bell cow — Allgeier is getting the early-down work Love was drafted for",
            "James Conner is fully healthy again but stuck as Arizona's third back behind Love and Allgeier",
            "Marvin Harrison Jr. remains the WR1 target hog, though drops and a cramping absence have cooled his year-2 breakout buzz",
        ],
    },

    ATL: {
        coaching: {
            hc: { name: 'Kevin Stefanski', status: 'new', replaced: 'Raheem Morris' },
            notes: 'Stefanski lands quickly after his Cleveland exit and brings a zone-run, play-action identity.',
        },
        additions: [
            { name: 'Tua Tagovailoa', pos: 'QB', detail: 'Signed after his Miami release to push Michael Penix Jr.' },
            { name: 'Cooper Rush', pos: 'QB', detail: 'Signed in camp as veteran insurance in the three-QB room' },
            { name: 'Jahan Dotson', pos: 'WR', detail: 'Replaces Darnell Mooney as the No. 2 receiver' },
        ],
        departures: [
            { name: 'Tyler Allgeier', pos: 'RB', detail: 'Signed with Arizona' },
            { name: 'Darnell Mooney', pos: 'WR', detail: 'Signed with the Giants' },
        ],
        rookies: [
            { name: 'Zachariah Branch', pos: 'WR', detail: 'Explosive slot/return weapon' },
        ],
        keyPoints: [
            "Bijan Robinson's camp holdout ended with a new long-term deal — still a locked-in top-2 overall fantasy back",
            "Tua has pulled ahead of an ACL-limited Penix Jr. (Questionable) for the Week 1 job — no longer a true tossup",
            "Drake London is the offense's alpha at 9+ targets a game regardless of who wins the QB competition",
        ],
    },

    BAL: {
        coaching: {
            hc: { name: 'Jesse Minter', status: 'new', replaced: 'John Harbaugh' },
            notes: 'The Ravens parted ways with Harbaugh in January after 18 seasons; Minter is a first-time NFL head coach from the defensive side.',
        },
        additions: [],
        departures: [
            { name: 'Isaiah Likely', pos: 'TE', detail: 'Signed with the Giants (3 yrs, $40M)' },
        ],
        rookies: [
            { name: 'Elijah Sarratt', pos: 'WR', detail: 'Physical possession receiver' },
            { name: 'Adam Randall', pos: 'RB', detail: 'Day 3 depth behind Henry' },
            { name: 'Ja\'Kobi Lane', pos: 'WR', detail: 'Big-bodied red-zone project' },
        ],
        keyPoints: [
            "Lamar Jackson is a rebound-value QB1 bet after a down 2025 — early camp is mixed, but the arm talent and rushing floor are unchanged",
            "Derrick Henry, 32, still projects for 300+ carries; a camp rest day was veteran management, not an injury flag",
            "Zay Flowers signed his extension and Mark Andrews is now the unquestioned TE1 with Likely gone",
        ],
    },

    BUF: {
        coaching: {
            hc: { name: 'Joe Brady', status: 'new', replaced: 'Sean McDermott' },
            notes: 'Buffalo moved on from McDermott after nine seasons and promoted OC Joe Brady, keeping scheme continuity for Josh Allen.',
        },
        additions: [
            { name: 'D.J. Moore', pos: 'WR', detail: 'Acquired from Chicago for a 2nd-round pick — the true No. 1 Allen has lacked' },
        ],
        departures: [],
        rookies: [
            { name: 'Skyler Bell', pos: 'WR', detail: 'Late-round slot depth' },
        ],
        keyPoints: [
            "James Cook's hold-in ended with a 4-year, $48M extension — the bell-cow role was never in doubt",
            "D.J. Moore and Khalil Shakir are the clear top two; Keon Coleman is now winning the WR3 job over Joshua Palmer",
            "Josh Allen has looked sharp building chemistry with Cook in camp — still a top-3 fantasy QB",
        ],
    },

    CAR: {
        coaching: {
            hc: { name: 'Dave Canales', status: 'returning' },
            notes: 'Continuity year three for Canales and Bryce Young.',
        },
        additions: [],
        departures: [],
        rookies: [
            { name: 'Chris Brazzell II', pos: 'WR', detail: 'Lanky vertical threat — season-ending LCL surgery in camp (IR)' },
            { name: 'Trevor Etienne', pos: 'RB', detail: 'Change-of-pace depth' },
        ],
        keyPoints: [
            "Tetairoa McMillan added muscle and more slot usage in year two — trending toward borderline WR1 value",
            "Hubbard is the healthy lead back, but a fully recovered Jonathon Brooks is one of the league's highest-upside handcuffs",
            "Brazzell's season-ending knee injury leaves the WR2 job thin behind McMillan",
        ],
    },

    CHI: {
        coaching: {
            hc: { name: 'Ben Johnson', status: 'returning' },
            notes: 'Year two of the Johnson offense with Caleb Williams entering a prove-it season.',
        },
        additions: [],
        departures: [
            { name: 'D.J. Moore', pos: 'WR', detail: 'Traded to Buffalo for a 2nd-round pick' },
        ],
        rookies: [],
        keyPoints: [
            "Colston Loveland is camp's biggest riser — now drafted behind only McBride and Bowers at tight end",
            "Monangai's camp injury hands the lead-back reps back to Swift, at least to open the season",
            "Caleb Williams (QB5 in 2025) is being drafted as low as QB7 — real value if the Ben Johnson leap continues",
        ],
    },

    CIN: {
        coaching: {
            hc: { name: 'Zac Taylor', status: 'returning' },
            notes: 'Rare full continuity — same staff, same core skill talent.',
        },
        additions: [],
        departures: [],
        rookies: [],
        keyPoints: [
            "Joe Burrow enters healthy and motivated, with camp reports the offense wants him under center more to unlock play-action — top-5 QB1 range",
            "Chase Brown's ADP has climbed into round 2 — Cincinnati added zero backfield competition behind him",
            "Chase and Higgins remain the league's best WR duo; the whole offense still rides on Burrow staying upright",
        ],
    },

    CLE: {
        coaching: {
            hc: { name: 'Todd Monken', status: 'new', replaced: 'Kevin Stefanski' },
            notes: 'Monken returns to Cleveland as HC with an open QB competition between Shedeur Sanders and Deshaun Watson.',
        },
        additions: [],
        departures: [
            { name: 'David Njoku', pos: 'TE', detail: 'Signed with the Chargers' },
            { name: 'Jerry Jeudy', pos: 'WR', detail: 'Retained, but in a reduced role as rookies arrive' },
        ],
        rookies: [
            { name: 'Spencer Fano', pos: 'OT', detail: 'Round 1, No. 9 overall — anchors the rebuilt line' },
            { name: 'KC Concepcion', pos: 'WR', detail: 'Dynamic slot weapon expected to play immediately; Questionable (shoulder) but still working in team drills' },
            { name: 'Denzel Boston', pos: 'WR', detail: 'Big X-receiver with red-zone chops' },
        ],
        keyPoints: [
            "The Sanders-Watson QB battle is trending Sanders' way early in camp, though Monken hasn't made it official",
            "Harold Fannin Jr. is now the clean TE1 with Njoku gone — one of the better value plays in fantasy off his TE8-pace rookie year",
            "Judkins (ankle, on track for Week 1) profiles as a volume RB2 with goal-line work; Sampson is the receiving-down flex piece",
        ],
    },

    DAL: {
        coaching: {
            hc: { name: 'Brian Schottenheimer', status: 'returning' },
            notes: 'Year two under Schottenheimer with the offense returning essentially intact.',
        },
        additions: [],
        departures: [],
        rookies: [
            { name: 'Caleb Downs', pos: 'S', detail: 'Round 1, No. 11 overall — instant defensive centerpiece' },
        ],
        keyPoints: [
            "Javonte Williams re-signed and remains the lead back, but Jaydon Blue is camp's biggest riser and forcing a real passing-down role",
            "Lamb and Pickens form a legit 1-2 punch, but the target split (roughly 28%/20%) keeps either one from being a clean top-5 WR",
            "Line and scheme are fully intact under Schottenheimer — a low-variance, pass-heavy offense for Dak",
        ],
    },

    DEN: {
        coaching: {
            hc: { name: 'Sean Payton', status: 'returning' },
            notes: 'Payton finally has the receiver corps he wanted after the Waddle blockbuster.',
        },
        additions: [
            { name: 'Jaylen Waddle', pos: 'WR', detail: 'Acquired from Miami in a package including pick No. 30' },
            { name: 'J.K. Dobbins', pos: 'RB', detail: 'Re-signed to pair with RJ Harvey' },
        ],
        departures: [],
        rookies: [
            { name: 'Jonah Coleman', pos: 'RB', detail: 'Compact, contact-balance runner added to the committee' },
        ],
        keyPoints: [
            "Waddle and Sutton are a confirmed 1-2 punch, with Marvin Mims Jr. drawing sleeper buzz for the No. 3 role",
            "Payton has named Dobbins the lead back, with Harvey carved out for third-down/receiving work — a real hierarchy, not a pure committee",
            "Bo Nix is fully healthy off last year's ankle issue and working unrestricted — no lingering QB1 concern",
        ],
    },

    DET: {
        coaching: {
            hc: { name: 'Dan Campbell', status: 'returning' },
            notes: 'Same staff, but the backfield philosophy shifted with Montgomery out and Pacheco in.',
        },
        additions: [
            { name: 'Isiah Pacheco', pos: 'RB', detail: 'Signed from Kansas City as the new complement to Gibbs' },
        ],
        departures: [
            { name: 'David Montgomery', pos: 'RB', detail: 'Traded to Houston' },
        ],
        rookies: [],
        keyPoints: [
            "Jahmyr Gibbs just signed a 3-year, $67.5M extension as the NFL's highest-paid back — the presumptive 2026 overall RB1",
            "Sam LaPorta is back at full strength after missing the back half of 2025 with a back injury — a clean TE1 bounce-back bet",
            "Amon-Ra St. Brown remains the alpha target earner in one of the league's safest, most stable offenses",
        ],
    },

    GB: {
        coaching: {
            hc: { name: 'Matt LaFleur', status: 'returning' },
            notes: 'Lost DC Jeff Hafley to Miami\'s head job; offense returns with a thinner receiver room.',
        },
        additions: [],
        departures: [
            { name: 'Romeo Doubs', pos: 'WR', detail: 'Signed with New England (4 yrs)' },
            { name: 'Malik Willis', pos: 'QB', detail: 'Backup QB cashed in with Miami (3 yrs, $67.5M)' },
        ],
        rookies: [],
        keyPoints: [
            "Tucker Kraft is off PUP and trending toward Week 1, but he's still tagged Questionable and limited to individual drills — not a lock yet",
            "Matthew Golden is winning early reps opposite Christian Watson, stepping into 131 targets vacated by Doubs and Wicks",
            "Josh Jacobs remains the unchallenged workhorse behind a strong offensive line",
        ],
    },

    HOU: {
        coaching: {
            hc: { name: 'DeMeco Ryans', status: 'returning' },
            notes: 'Backfield remade around David Montgomery; year two of the Nick Caley offense.',
        },
        additions: [
            { name: 'David Montgomery', pos: 'RB', detail: 'Acquired from Detroit to lead the backfield' },
        ],
        departures: [],
        rookies: [],
        keyPoints: [
            "Woody Marks and David Montgomery are a genuine tandem in camp — expect a real timeshare that caps both backs' ceilings",
            "Tank Dell is fully cleared and flashing for the first time since his ACL/MCL tear, battling Jayden Higgins for the WR2 job behind Nico Collins",
            "Nico Collins remains a top-5 WR when Stroud is on — the whole offense's fantasy value still hinges on his rebound",
        ],
    },

    IND: {
        coaching: {
            hc: { name: 'Shane Steichen', status: 'returning' },
            notes: 'Daniel Jones returns as the starter; Pittman was traded to Pittsburgh.',
        },
        additions: [
            { name: 'Alec Pierce', pos: 'WR', detail: 'Re-signed on a massive 4-yr, $116M deal as the new No. 1' },
        ],
        departures: [
            { name: 'Michael Pittman Jr.', pos: 'WR', detail: 'Traded to Pittsburgh' },
        ],
        rookies: [],
        keyPoints: [
            "Jonathan Taylor just signed a 3-year, $44M extension — the largest third contract ever for a running back, and the bankable centerpiece here",
            "Alec Pierce ($116M, the presumptive No. 1) remains on PUP recovering from ankle surgery, clouding his Week 1 status",
            "Josh Downs is next in line for a bigger target share with Pittman gone — his floor rises further if Pierce's ankle lingers",
        ],
    },

    JAX: {
        coaching: {
            hc: { name: 'Liam Coen', status: 'returning' },
            notes: 'Year two of the Coen offense with a fully turned-over backfield.',
        },
        additions: [
            { name: 'Chris Rodriguez Jr.', pos: 'RB', detail: 'Signed to compete for early-down work; Questionable in camp but practicing well' },
        ],
        departures: [
            { name: 'Travis Etienne Jr.', pos: 'RB', detail: 'Signed with New Orleans' },
        ],
        rookies: [],
        keyPoints: [
            "Tuten's backfield lead isn't as clean as it looked — a healthy Chris Rodriguez Jr. and LeQuint Allen have turned it into a real three-way camp battle",
            "Trevor Lawrence enters camp healthy off a stretch as fantasy's QB1 in points-per-game since last Week 5 — stock trending up in year two of Coen's system",
            "Brian Thomas Jr. is flashing early, but Travis Hunter's offensive role remains light and inconsistent — still a boom-bust dart throw",
        ],
    },

    KC: {
        coaching: {
            hc: { name: 'Andy Reid', status: 'returning' },
            notes: 'Kansas City replaced Pacheco with the offseason\'s first big RB splash, while Mahomes rehabs a torn ACL/LCL suffered in December.',
        },
        additions: [
            { name: 'Kenneth Walker III', pos: 'RB', detail: 'Signed from Seattle as the workhorse RB1' },
            { name: 'Justin Fields', pos: 'QB', detail: 'Veteran backup behind Mahomes' },
        ],
        departures: [
            { name: 'Isiah Pacheco', pos: 'RB', detail: 'Signed with Detroit' },
        ],
        rookies: [
            { name: 'Emmett Johnson', pos: 'RB', detail: 'Day 3 pass-catching depth; has fallen behind Walker, Brashard Smith and Demercado in camp reps' },
        ],
        keyPoints: [
            "Patrick Mahomes is rehabbing from a torn ACL/LCL suffered in December — he's targeting Week 1, but 'bounce-back' undersells the real injury risk here",
            "Xavier Worthy (shoulder) and rookie Cyrus Allen (leg) are both banged up in camp but trending back by mid-August — monitor Week 1 status",
            "Kenneth Walker III is the clear early-down RB1 Reid has lacked; the Rice/Kelce target hierarchy returns as before",
        ],
    },

    LAC: {
        coaching: {
            hc: { name: 'Jim Harbaugh', status: 'returning' },
            notes: 'Continuity at head coach, but new OC Mike McDaniel\'s motion-heavy scheme is a real shift — veteran pass-catchers were added around Herbert too.',
        },
        additions: [
            { name: 'David Njoku', pos: 'TE', detail: 'Signed from Cleveland' },
            { name: 'Keaton Mitchell', pos: 'RB', detail: 'Explosive change-of-pace behind Hampton' },
        ],
        departures: [],
        rookies: [],
        keyPoints: [
            "New OC Mike McDaniel's motion-heavy scheme is being sold as the unlock for both Justin Herbert and Ladd McConkey",
            "Omarion Hampton is the clear bell-cow target after a 77% snap share through four games before last year's high-ankle sprain",
            "McConkey profiles as a bounce-back candidate as McDaniel's primary motion receiver, despite a quieter 2025 on similar target volume",
        ],
    },

    LAR: {
        coaching: {
            hc: { name: 'Sean McVay', status: 'returning' },
            notes: 'Lost OC Mike LaFleur to Arizona\'s head job; promoted his replacement from within. Stafford and Adams both return.',
        },
        additions: [],
        departures: [],
        rookies: [
            { name: 'Ty Simpson', pos: 'QB', detail: 'Alabama QB drafted as the heir to Stafford' },
            { name: 'Max Klare', pos: 'TE', detail: 'Athletic pass-catching tight end' },
        ],
        keyPoints: [
            "Puka Nacua is a top-3 overall pick coming off a league-leading 129-catch, 1,715-yard season — still Stafford's clear top target",
            "Kyren Williams' workload is shrinking fast — Blake Corum is pushing for close to a 50/50 split, dropping Williams out of clean RB1 territory",
            "Davante Adams trims Nacua's target share slightly, but both remain must-starts in one of the league's best offenses",
        ],
    },

    LV: {
        coaching: {
            hc: { name: 'Klint Kubiak', status: 'new', replaced: 'Pete Carroll' },
            notes: 'Carroll\'s tenure lasted just one season; Kubiak arrives from Seattle\'s OC job to build around the No. 1 pick.',
        },
        additions: [
            { name: 'Jalen Nailor', pos: 'WR', detail: 'Signed for 3 yrs, $35M with a path to the No. 2 target role' },
            { name: 'Kirk Cousins', pos: 'QB', detail: 'Named the Week 1 starter over Mendoza to open camp — a bridge year, not just a mentor role' },
        ],
        departures: [
            { name: 'Geno Smith', pos: 'QB', detail: 'Moved on after a tough 2025; landed with the Jets' },
        ],
        rookies: [
            { name: 'Fernando Mendoza', pos: 'QB', detail: 'Round 1, No. 1 overall — Heisman winner, opens camp as the QB2 behind Cousins' },
        ],
        keyPoints: [
            "Kirk Cousins was named the Week 1 starter to open camp, with Mendoza as the QB2 bridge — expect a run-first offense early, not immediate rookie-QB volatility",
            "Ashton Jeanty carries real top-5 RB helium (ADP around pick 17 overall) behind a run-committed staff",
            "A fully healthy Brock Bowers is drawing 'best fantasy TE in football' buzz ahead of Trey McBride",
        ],
    },

    MIA: {
        coaching: {
            hc: { name: 'Jeff Hafley', status: 'new', replaced: 'Mike McDaniel' },
            notes: 'Hafley arrives from Green Bay\'s defense and immediately reshaped the roster, moving on from Tua and Waddle.',
        },
        additions: [
            { name: 'Malik Willis', pos: 'QB', detail: 'Signed for 3 yrs, $67.5M as the presumptive starter' },
        ],
        departures: [
            { name: 'Tua Tagovailoa', pos: 'QB', detail: 'Released; signed with Atlanta' },
            { name: 'Jaylen Waddle', pos: 'WR', detail: 'Traded to Denver for a package including pick No. 30' },
        ],
        rookies: [
            { name: 'Ollie Gordon II', pos: 'RB', detail: 'Second-year power back (2025 pick) expected to take on more work' },
            { name: 'Chris Bell', pos: 'WR', detail: 'Day 2 pick with vertical juice, still weeks out working back from an ACL' },
        ],
        keyPoints: [
            "De'Von Achane survives the roster overhaul as the clear centerpiece — still a consensus RB6",
            "Malik Willis's own legs could be the real threat to Achane's goal-line work in a run-heavy offense",
            "Rookie Chris Bell (ACL) remains weeks out, leaving a thin WR room behind Malik Washington to open camp",
        ],
    },

    MIN: {
        coaching: {
            hc: { name: 'Kevin O\'Connell', status: 'returning' },
            notes: 'O\'Connell reunites with Kyler Murray on a low-cost deal, creating an open QB competition with J.J. McCarthy.',
        },
        additions: [
            { name: 'Kyler Murray', pos: 'QB', detail: 'Signed a low-cost deal to compete for the starting job' },
            { name: 'Jauan Jennings', pos: 'WR', detail: 'Physical WR3/blocking specialist from San Francisco' },
        ],
        departures: [
            { name: 'Jalen Nailor', pos: 'WR', detail: 'Signed with Las Vegas' },
        ],
        rookies: [
            { name: 'Demond Claiborne', pos: 'RB', detail: 'Speedy depth behind Jones and Mason' },
        ],
        keyPoints: [
            "The Murray-McCarthy QB battle is genuinely unresolved, with a decision reportedly targeted for mid-August — not the formality many expected",
            "Justin Jefferson is a locked-in WR1 either way, though his ceiling scenario clearly favors a Murray-led passing attack",
            "Jordan Addison plays a prove-it year after a suspension-shortened 2025 — an extension is expected but still unsigned",
        ],
    },

    NE: {
        coaching: {
            hc: { name: 'Mike Vrabel', status: 'returning' },
            notes: 'Vrabel reunites with A.J. Brown after the blockbuster trade and keeps building around Drake Maye.',
        },
        additions: [
            { name: 'A.J. Brown', pos: 'WR', detail: 'Acquired from Philadelphia for a 2028 1st and 2027 5th' },
            { name: 'Romeo Doubs', pos: 'WR', detail: 'Signed from Green Bay (4 yrs)' },
        ],
        departures: [],
        rookies: [
            { name: 'Caleb Lomu', pos: 'OT', detail: 'Round 1, No. 28 overall — protects Maye\'s blind side' },
        ],
        keyPoints: [
            "A.J. Brown and Drake Maye are visibly building chemistry in padded practices — Maye's top-5 QB range still holds",
            "Rhamondre Stevenson is working with the first-team offense over Henderson early in camp — a real committee, not a clean Henderson lean",
            "Romeo Doubs' rapport with Maye is developing slower than Brown's, leaving the WR2 role less settled than it looks",
        ],
    },

    NO: {
        coaching: {
            hc: { name: 'Kellen Moore', status: 'returning' },
            notes: 'Year two of the Moore rebuild, now with an overhauled skill group around Tyler Shough.',
        },
        additions: [
            { name: 'Travis Etienne Jr.', pos: 'RB', detail: 'Signed from Jacksonville to lead the backfield' },
        ],
        departures: [],
        rookies: [
            { name: 'Jordyn Tyson', pos: 'WR', detail: 'Round 2 pick expected to start opposite Chris Olave immediately' },
        ],
        keyPoints: [
            "Chris Olave signed a long-term extension and profiles as a legit high-end WR1 off a WR7 2025 finish",
            "Travis Etienne now leads early-down work with Kamara restructured into a 1B passing-down role — real risk the two vulture each other",
            "Rookie Jordyn Tyson starts opposite Olave with elite route-running separation, though durability is a real question mark",
        ],
    },

    NYG: {
        coaching: {
            hc: { name: 'John Harbaugh', status: 'new', replaced: 'Brian Daboll' },
            notes: 'Daboll was let go mid-2025; Harbaugh signed on within two weeks of his Baltimore exit.',
        },
        additions: [
            { name: 'Isaiah Likely', pos: 'TE', detail: 'Followed Harbaugh from Baltimore (3 yrs, $40M) for his first true TE1 role' },
            { name: 'Darnell Mooney', pos: 'WR', detail: 'Veteran field-stretcher signed from Atlanta' },
        ],
        departures: [
            { name: 'Wan\'Dale Robinson', pos: 'WR', detail: 'Signed with Tennessee (4 yrs, $70M)' },
        ],
        rookies: [
            { name: 'Arvell Reese', pos: 'LB', detail: 'Round 1, No. 5 overall — the defense\'s new tone-setter' },
        ],
        keyPoints: [
            "Malik Nabers (ACL) is trending toward a Week 1 return with no PUP expected — his ADP is climbing fast as confidence builds",
            "Jaxson Dart projects as a low-end QB1 with real rushing equity; Cam Skattebo is expected full-go after his own injury",
            "Outside of Nabers, nearly every receiving role is open — Mooney, Likely, and Odell Beckham Jr. are all competing for a thin target pool",
        ],
    },

    NYJ: {
        coaching: {
            hc: { name: 'Aaron Glenn', status: 'returning' },
            notes: 'Geno Smith arrives as the bridge starter; the No. 2 overall pick went to defense.',
        },
        additions: [
            { name: 'Geno Smith', pos: 'QB', detail: 'Veteran bridge starter after his rough Las Vegas stint' },
        ],
        departures: [
            { name: 'Justin Fields', pos: 'QB', detail: 'Signed with Kansas City as Mahomes\' backup' },
        ],
        rookies: [
            { name: 'David Bailey', pos: 'EDGE', detail: 'Round 1, No. 2 overall — cornerstone pass rusher' },
            { name: 'Kenyon Sadiq', pos: 'TE', detail: 'Athletic Day 2 tight end dealing with a hernia setback in camp — Mason Taylor is the safer near-term TE play' },
            { name: 'Omar Cooper Jr.', pos: 'WR', detail: 'Polished route-runner added to a thin WR room' },
        ],
        keyPoints: [
            "Garrett Wilson is fully healthy after a season-ending knee injury cut his 2025 short — expect restored target volume",
            "Breece Hall's new extension confirms him as the clear three-down back, with league-winner ceiling back in play",
            "Rookie TE Kenyon Sadiq is dealing with a hernia setback and missing camp time — Mason Taylor is now the safer TE play here",
        ],
    },

    PHI: {
        coaching: {
            hc: { name: 'Nick Sirianni', status: 'returning' },
            notes: 'The A.J. Brown saga ended in a trade; the offense consolidates around Barkley, Smith, and Hurts.',
        },
        additions: [
            { name: 'Hollywood Brown', pos: 'WR', detail: 'Veteran speed signed to replace some of A.J. Brown\'s snaps' },
            { name: 'Dontayvion Wicks', pos: 'WR', detail: 'Depth/rotation signing from Green Bay' },
        ],
        departures: [
            { name: 'A.J. Brown', pos: 'WR', detail: 'Traded to New England for a 2028 1st and 2027 5th' },
        ],
        rookies: [
            { name: 'Makai Lemon', pos: 'WR', detail: 'USC slot technician drafted to grow into a starting role' },
        ],
        keyPoints: [
            "DeVonta Smith has posted 16.6 PPG in games without Brown the past two years — a real low-end WR1 case now that the trade is permanent",
            "Saquon Barkley remains an early second-round RB despite a 'down' RB14 2025 — new OC Sean Mannion's more under-center scheme is the bull case for a bounce-back",
            "Jalen Hurts keeps his rushing and tush-push floor, with the passing game expected to open up more under Mannion",
        ],
    },

    PIT: {
        coaching: {
            hc: { name: 'Mike McCarthy', status: 'new', replaced: 'Mike Tomlin' },
            notes: 'Tomlin stepped down after 19 seasons; McCarthy inherits Rodgers and an aggressive win-now roster.',
        },
        additions: [
            { name: 'Michael Pittman Jr.', pos: 'WR', detail: 'Acquired from Indianapolis with a 3-yr, $59M extension' },
            { name: 'Rico Dowdle', pos: 'RB', detail: 'Signed to pair with Warren — camp reps say real committee, not a clear pecking order' },
        ],
        departures: [],
        rookies: [
            { name: 'Germie Bernard', pos: 'WR', detail: 'Day 2 pick with inside-outside versatility' },
        ],
        keyPoints: [
            "Dowdle and Warren are actually splitting first-team reps in camp — a real committee, not Dowdle running away with the job",
            "Michael Pittman Jr. projects as the true WR1 by target share (111+ in 5 of his last 5 seasons) despite a lower ADP than Metcalf — a value flip worth knowing",
            "DK Metcalf is coming off a career-low 850 yards and now faces more competition for looks under McCarthy's tempered offense",
        ],
    },

    SEA: {
        coaching: {
            hc: { name: 'Mike Macdonald', status: 'returning' },
            notes: 'Lost OC Klint Kubiak to the Raiders\' head job; Charbonnet\'s torn ACL reshaped the backfield.',
        },
        additions: [
            { name: 'Emanuel Wilson', pos: 'RB', detail: 'Signed from Green Bay for immediate depth' },
        ],
        departures: [
            { name: 'Kenneth Walker III', pos: 'RB', detail: 'Signed with Kansas City' },
        ],
        rookies: [
            { name: 'Jadarian Price', pos: 'RB', detail: 'Round 1, No. 32 overall — clear path to lead-back duties' },
        ],
        keyPoints: [
            "Jaxon Smith-Njigba is a top-5 overall pick after a record-breaking 119-catch, 1,793-yard season and a new $168.6M extension",
            "Jadarian Price is one of the draft's biggest fantasy landing-spot risers as the clear lead back; Charbonnet (ACL) isn't expected back until around November",
            "Kupp and Shaheed round out a JSN-centric passing game behind a steady Sam Darnold",
        ],
    },

    SF: {
        coaching: {
            hc: { name: 'Kyle Shanahan', status: 'returning' },
            notes: 'Mike Evans chose the 49ers as his post-Tampa chapter; the offense reloads around CMC.',
        },
        additions: [
            { name: 'Mike Evans', pos: 'WR', detail: 'Signed after 12 seasons in Tampa — instant red-zone alpha' },
            { name: 'Christian Kirk', pos: 'WR', detail: 'Veteran slot insurance; Questionable in camp with a calf issue' },
            { name: 'Deebo Samuel', pos: 'WR', detail: 'Signed a 1-year deal (up to $7M), returning to SF to fill the WR2/gadget role after Pearsall\'s injury' },
        ],
        departures: [
            { name: 'Ricky Pearsall', pos: 'WR', detail: 'Season-ending IR after PCL surgery (Aug 1) — out for all of 2026' },
        ],
        rookies: [],
        keyPoints: [
            "Ricky Pearsall is out for the season (PCL surgery); San Francisco immediately re-signed Deebo Samuel to fill the WR2/gadget role",
            "Mike Evans (quad strain) has missed camp time, delaying his red-zone chemistry-building — not considered serious, but worth monitoring into Week 1",
            "CMC remains a locked-in top-5 RB1, though SF is managing his reps carefully at 30; Aiyuk's unresolved situation keeps the WR room crowded",
        ],
    },

    TB: {
        coaching: {
            hc: { name: 'Todd Bowles', status: 'returning' },
            notes: 'The post-Evans era begins with Egbuka as the new WR1.',
        },
        additions: [
            { name: 'Kenneth Gainwell', pos: 'RB', detail: 'Veteran passing-down depth behind Irving' },
        ],
        departures: [
            { name: 'Mike Evans', pos: 'WR', detail: 'Signed with San Francisco, ending a 12-year run' },
        ],
        rookies: [],
        keyPoints: [
            "Bucky Irving is fully cleared and full-go, but Kenneth Gainwell is being built into a real complementary role — call it a productive committee, not a clean bell cow",
            "Emeka Egbuka has less target competition than ever post-Evans and is a strong bet for a WR2-or-better breakout",
            "Chris Godwin looks fully explosive again, but Baker Mayfield is on his 4th offensive coordinator in 4 years — a real cap on the passing game's ceiling",
        ],
    },

    TEN: {
        coaching: {
            hc: { name: 'Robert Saleh', status: 'new', replaced: 'interim staff (Brian Callahan let go in-season)' },
            notes: 'Saleh runs the defense-first program while Brian Daboll takes over the offense as OC.',
        },
        additions: [
            { name: 'Wan\'Dale Robinson', pos: 'WR', detail: 'Signed for 4 yrs, $70M, reuniting with OC Brian Daboll' },
        ],
        departures: [],
        rookies: [
            { name: 'Carnell Tate', pos: 'WR', detail: 'Round 1, No. 4 overall — drafted to be Cam Ward\'s true No. 1' },
            { name: 'Nicholas Singleton', pos: 'RB', detail: 'Day 3 pick with a clear runway behind Pollard' },
        ],
        keyPoints: [
            "Rookie Carnell Tate has been 'one of the best' players in camp picking up the offense and already connected with Ward on a deep TD — the clear No. 1 target",
            "Calvin Ridley has slipped to presumptive WR3 behind Tate and Wan'Dale Robinson after his season-ending 2025 fibula fracture",
            "Offensive line uncertainty beyond the top three starters is a real risk to both Ward's protection and Pollard's rushing lanes",
        ],
    },

    WAS: {
        coaching: {
            hc: { name: 'Dan Quinn', status: 'returning' },
            notes: 'Retooled the skill group around Jayden Daniels after an injury-marred 2025.',
        },
        additions: [
            { name: 'Rachaad White', pos: 'RB', detail: 'Signed to pair with Croskey-Merritt' },
            { name: 'Chig Okonkwo', pos: 'TE', detail: 'Signed from Tennessee — sneaky late-round stack with Daniels' },
            { name: 'Stefon Diggs', pos: 'WR', detail: 'Signed a 1-year deal (up to $12M) — immediate WR2 behind McLaurin' },
        ],
        departures: [],
        rookies: [
            { name: 'Sonny Styles', pos: 'S', detail: 'Round 1, No. 7 overall — versatile defensive chess piece' },
            { name: 'Antonio Williams', pos: 'WR', detail: 'Polished slot receiver; popular redraft sleeper' },
            { name: 'Kaytron Allen', pos: 'RB', detail: 'Physical Day 3 back added to the committee' },
        ],
        keyPoints: [
            "Washington signed Stefon Diggs, immediately projected as a WR2 behind McLaurin — a real target bump for the passing game",
            "Jayden Daniels enters camp fully healthy behind a more protective, under-center scheme — still a top-5 fantasy QB when right",
            "The White/Croskey-Merritt/Allen backfield remains a muddled committee with no clear lead-back signal from camp",
        ],
    },
};

// Convenience: list of team abbreviations that hired a new head coach this cycle.
export const NEW_HC_TEAMS = Object.entries(offseasonData)
    .filter(([, t]) => t.coaching.hc.status === 'new')
    .map(([abbr]) => abbr);
