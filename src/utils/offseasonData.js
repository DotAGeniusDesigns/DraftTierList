// 2026 offseason tracker data — coaching changes, player movement, rookies,
// and three key bullet points per team. Compiled July 2026 from offseason
// reporting (coaching carousel, free agency, trades, and the 2026 draft).
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
            "Rookie Jeremiyah Love (No. 3 pick) leads a crowded backfield with top-5 RB upside",
            "New HC Mike LaFleur brings a McVay-style scheme; fresh start for Marvin Harrison Jr.",
            "Brissett/Beck at QB caps the ceiling until the position settles",
        ],
    },

    ATL: {
        coaching: {
            hc: { name: 'Kevin Stefanski', status: 'new', replaced: 'Raheem Morris' },
            notes: 'Stefanski lands quickly after his Cleveland exit and brings a zone-run, play-action identity.',
        },
        additions: [
            { name: 'Tua Tagovailoa', pos: 'QB', detail: 'Signed after his Miami release to push Michael Penix Jr.' },
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
            "Bijan Robinson a top-2 fantasy pick in Stefanski's zone-run scheme",
            "Tua vs. Penix QB battle clouds Drake London and Kyle Pitts",
            "RB2 room behind Bijan thins out after Allgeier's exit",
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
            "Jackson–Henry–Flowers–Andrews core returns intact under new HC Jesse Minter",
            "Likely's exit hands the TE role fully back to Mark Andrews",
            "Watch whether a defensive staff dials back the offense's aggression",
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
            "D.J. Moore trade gives Josh Allen his best No. 1 receiver since Diggs",
            "Joe Brady promotion keeps scheme continuity after McDermott's exit",
            "James Cook stays the bell cow; Shakir and Coleman get squeezed",
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
            { name: 'Chris Brazzell II', pos: 'WR', detail: 'Lanky vertical threat' },
            { name: 'Trevor Etienne', pos: 'RB', detail: 'Change-of-pace depth' },
        ],
        keyPoints: [
            "Tetairoa McMillan is the clear No. 1 and a top-30 fantasy pick",
            "Hubbard leads the backfield with Jonathon Brooks as the upside stash",
            "Bryce Young still caps the offense — WRs beyond McMillan are darts",
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
            "D.J. Moore trade opens ~130 targets for Odunze, Burden, and Loveland",
            "Colston Loveland set up for a year-2 TE breakout in Ben Johnson's scheme",
            "It all hinges on a Caleb Williams leap; Swift/Monangai a camp battle",
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
            "Full continuity — Burrow–Chase–Higgins intact, Chase a top-3 pick",
            "Chase Brown has the backfield essentially to himself",
            "The entire fantasy ecosystem rides on Burrow's health",
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
            { name: 'KC Concepcion', pos: 'WR', detail: 'Dynamic slot weapon expected to play immediately' },
            { name: 'Denzel Boston', pos: 'WR', detail: 'Big X-receiver with red-zone chops' },
        ],
        keyPoints: [
            "Open Sanders vs. Watson QB battle decides the offense's ceiling",
            "Judkins/Sampson backfield and Harold Fannin Jr. are the volume beneficiaries",
            "Rookies Concepcion and Boston join a rebuilt line (Fano, No. 9)",
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
            "Lamb + Pickens one of the best WR duos — but they split the targets",
            "Javonte Williams leads the backfield with Jaydon Blue as the handcuff",
            "Defense-focused offseason points to more balanced game scripts",
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
            "Jaylen Waddle trade gives Bo Nix a true field-tilting receiver",
            "Courtland Sutton slides into a red-zone-heavy WR2 role",
            "Backfield a frustrating Payton committee (Harvey/Dobbins/Coleman)",
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
            "Montgomery traded out — Jahmyr Gibbs is the engine with No. 1 overall upside",
            "St. Brown and LaPorta return to their usual high-value roles",
            "No coaching turnover — one of the league's safest ecosystems",
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
            "Thinner WR room finally consolidates roles around Watson and Golden",
            "Tucker Kraft a top-5 fantasy TE; Jayden Reed keeps the slot",
            "Josh Jacobs remains the workhorse behind a strong line",
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
            "David Montgomery trade adds a physical lead back next to Woody Marks",
            "Nico Collins a top-5 fantasy WR when Stroud plays to his level",
            "Fantasy fortunes hinge on a Stroud rebound behind a better line",
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
            "Jonathan Taylor remains the bankable workhorse centerpiece",
            "Pittman traded out; Alec Pierce ($116M) is the new clear No. 1",
            "Daniel Jones back at QB; Tyler Warren grows into a year-2 role",
        ],
    },

    JAX: {
        coaching: {
            hc: { name: 'Liam Coen', status: 'returning' },
            notes: 'Year two of the Coen offense with a fully turned-over backfield.',
        },
        additions: [
            { name: 'Chris Rodriguez Jr.', pos: 'RB', detail: 'Signed to compete for early-down work' },
        ],
        departures: [
            { name: 'Travis Etienne Jr.', pos: 'RB', detail: 'Signed with New Orleans' },
        ],
        rookies: [],
        keyPoints: [
            "Bhayshul Tuten inherits the backfield with league-winner upside",
            "Brian Thomas Jr. needs a bounce-back; Travis Hunter gets a bigger role",
            "Pivotal year for Trevor Lawrence in Coen's scheme",
        ],
    },

    KC: {
        coaching: {
            hc: { name: 'Andy Reid', status: 'returning' },
            notes: 'Kansas City replaced Pacheco with the offseason\'s first big RB splash.',
        },
        additions: [
            { name: 'Kenneth Walker III', pos: 'RB', detail: 'Signed from Seattle as the workhorse RB1' },
            { name: 'Justin Fields', pos: 'QB', detail: 'Veteran backup behind Mahomes' },
        ],
        departures: [
            { name: 'Isiah Pacheco', pos: 'RB', detail: 'Signed with Detroit' },
        ],
        rookies: [
            { name: 'Emmett Johnson', pos: 'RB', detail: 'Day 3 pass-catching depth' },
        ],
        keyPoints: [
            "Kenneth Walker III signed as the true workhorse Reid has lacked",
            "Rice/Worthy/Kelce hierarchy returns; Mahomes a bounce-back bet",
            "Justin Fields added as win-now insurance behind Mahomes",
        ],
    },

    LAC: {
        coaching: {
            hc: { name: 'Jim Harbaugh', status: 'returning' },
            notes: 'Continuity on the sideline, with veteran pass-catchers added around Herbert.',
        },
        additions: [
            { name: 'David Njoku', pos: 'TE', detail: 'Signed from Cleveland' },
            { name: 'Keaton Mitchell', pos: 'RB', detail: 'Explosive change-of-pace behind Hampton' },
        ],
        departures: [],
        rookies: [],
        keyPoints: [
            "Omarion Hampton a top-10 three-down back, spelled by Keaton Mitchell",
            "Ladd McConkey remains Herbert's target-share monster from the slot",
            "David Njoku upgrades TE (dims Oronde Gadsden's outlook)",
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
            "Stafford runs it back at 38 — Puka Nacua a top-5 overall pick",
            "Ty Simpson drafted as the QB of the future",
            "Stafford's health is the whole season; Kyren Williams a steady RB2",
        ],
    },

    LV: {
        coaching: {
            hc: { name: 'Klint Kubiak', status: 'new', replaced: 'Pete Carroll' },
            notes: 'Carroll\'s tenure lasted just one season; Kubiak arrives from Seattle\'s OC job to build around the No. 1 pick.',
        },
        additions: [
            { name: 'Jalen Nailor', pos: 'WR', detail: 'Signed for 3 yrs, $35M with a path to the No. 2 target role' },
            { name: 'Kirk Cousins', pos: 'QB', detail: 'Veteran mentor/bridge for the rookie' },
        ],
        departures: [
            { name: 'Geno Smith', pos: 'QB', detail: 'Moved on after a tough 2025; landed with the Jets' },
        ],
        rookies: [
            { name: 'Fernando Mendoza', pos: 'QB', detail: 'Round 1, No. 1 overall — Heisman winner and the new face of the franchise' },
        ],
        keyPoints: [
            "No. 1 overall pick Fernando Mendoza is the new franchise QB",
            "Ashton Jeanty (top-5 RB) and Brock Bowers anchor the offense",
            "Kubiak's wide-zone scheme; expect rookie-QB growing pains",
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
            { name: 'Chris Bell', pos: 'WR', detail: 'Day 2 pick with vertical juice, working back from an ACL' },
        ],
        keyPoints: [
            "Biggest overhaul in the league — Tua and Waddle both gone, Hafley in",
            "De'Von Achane is the survivor and centerpiece, still an RB1",
            "Malik Willis brings a run-heavy script to a thin receiver room",
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
            "Kyler Murray has the inside track over J.J. McCarthy at QB",
            "Justin Jefferson reclaims overall-WR1 upside with a steady passer",
            "Aaron Jones / Jordan Mason committee caps both as flex plays",
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
            "A.J. Brown trade gives Drake Maye a true alpha — Maye a top-5 QB",
            "Brown should soak up 130+ targets as the unquestioned No. 1",
            "Stevenson/Henderson backfield split — own the explosive Henderson",
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
            "Rookie Jordyn Tyson starts opposite Olave in a perfect scheme fit",
            "Travis Etienne headlines the backfield; Kamara reduced to a change-up",
            "Ceiling tied to Tyler Shough's year-2 development",
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
            "John Harbaugh headlines the coaching carousel for a young roster",
            "Malik Nabers a target-monopoly WR1; Likely a popular TE breakout",
            "Jaxson Dart and lead back Cam Skattebo take full ownership",
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
            { name: 'Kenyon Sadiq', pos: 'TE', detail: 'Athletic Day 2 tight end with immediate starter path' },
            { name: 'Omar Cooper Jr.', pos: 'WR', detail: 'Polished route-runner added to a thin WR room' },
        ],
        keyPoints: [
            "Geno Smith bounce-back is a modest but real QB upgrade",
            "Garrett Wilson and Breece Hall keep safe volume floors",
            "Rookie TE Kenyon Sadiq is a sleeper on an open depth chart",
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
            "A.J. Brown traded — DeVonta Smith inherits clear No. 1 duties",
            "Saquon Barkley still a top-3 pick in a run-heavy offense",
            "Jalen Hurts keeps his elite rushing and tush-push floor",
        ],
    },

    PIT: {
        coaching: {
            hc: { name: 'Mike McCarthy', status: 'new', replaced: 'Mike Tomlin' },
            notes: 'Tomlin stepped down after 19 seasons; McCarthy inherits Rodgers and an aggressive win-now roster.',
        },
        additions: [
            { name: 'Michael Pittman Jr.', pos: 'WR', detail: 'Acquired from Indianapolis with a 3-yr, $59M extension' },
            { name: 'Rico Dowdle', pos: 'RB', detail: 'Signed to lead the backfield, pushing Warren to a complementary role' },
        ],
        departures: [],
        rookies: [
            { name: 'Germie Bernard', pos: 'WR', detail: 'Day 2 pick with inside-outside versatility' },
        ],
        keyPoints: [
            "McCarthy takes over for Tomlin around a 42-year-old Aaron Rodgers",
            "Pittman added next to DK Metcalf; the boom-bust range is wide",
            "Rico Dowdle is the value play as McCarthy's lead back",
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
            "Backfield reset — Walker out, rookie Jadarian Price the likely lead",
            "Jaxon Smith-Njigba is the offense — a top-5 fantasy WR",
            "Kupp/Shaheed support; Sam Darnold steady under center",
        ],
    },

    SF: {
        coaching: {
            hc: { name: 'Kyle Shanahan', status: 'returning' },
            notes: 'Mike Evans chose the 49ers as his post-Tampa chapter; the offense reloads around CMC.',
        },
        additions: [
            { name: 'Mike Evans', pos: 'WR', detail: 'Signed after 12 seasons in Tampa — instant red-zone alpha' },
            { name: 'Christian Kirk', pos: 'WR', detail: 'Veteran slot insurance' },
        ],
        departures: [],
        rookies: [],
        keyPoints: [
            "Mike Evans signing is a red-zone cheat code in Shanahan's scheme",
            "Evans crowds the young SF WR room and pushes Aiyuk down the pecking order",
            "CMC and Kittle keep their roles — health is the perennial asterisk",
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
            "First season without Mike Evans — Emeka Egbuka steps in as WR1",
            "Bucky Irving a top-8 dual-threat back with the job to himself",
            "Godwin and McMillan restore depth around Baker Mayfield",
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
            "Rookie Carnell Tate (No. 4) is Cam Ward's true No. 1 — best WR landing spot",
            "Wan'Dale Robinson reunites with new OC Brian Daboll",
            "Tony Pollard leads the backfield; Singleton the camp name to watch",
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
        ],
        departures: [],
        rookies: [
            { name: 'Sonny Styles', pos: 'S', detail: 'Round 1, No. 7 overall — versatile defensive chess piece' },
            { name: 'Antonio Williams', pos: 'WR', detail: 'Polished slot receiver; popular redraft sleeper' },
            { name: 'Kaytron Allen', pos: 'RB', detail: 'Physical Day 3 back added to the committee' },
        ],
        keyPoints: [
            "Jayden Daniels gets a healthier, deeper cast — still the prize when healthy",
            "Terry McLaurin a volume-safe WR2; Okonkwo a sneaky Daniels stack",
            "Backfield a frustrating White / Croskey-Merritt committee",
        ],
    },
};

// Convenience: list of team abbreviations that hired a new head coach this cycle.
export const NEW_HC_TEAMS = Object.entries(offseasonData)
    .filter(([, t]) => t.coaching.hc.status === 'new')
    .map(([abbr]) => abbr);
