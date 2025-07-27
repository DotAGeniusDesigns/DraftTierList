// Local player database with images and information
import { getTeamLogo, getByeWeek } from './teamData.js';

export const playerDatabase = {
    // Tier 1 Players
    'jamarr-chase': {
        id: 'jamarr-chase',
        name: "Ja'Marr Chase",
        position: 'WR',
        team: 'CIN',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/ja_marr_chase.png',
        tier: 1
    },
    'bijan-robinson': {
        id: 'bijan-robinson',
        name: 'Bijan Robinson',
        position: 'RB',
        team: 'ATL',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/bijan_robinson.png',
        tier: 1
    },
    'saquon-barkley': {
        id: 'saquon-barkley',
        name: 'Saquon Barkley',
        position: 'RB',
        team: 'PHI',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/saquon_barkley.png',
        tier: 1
    },
    'justin-jefferson': {
        id: 'justin-jefferson',
        name: 'Justin Jefferson',
        position: 'WR',
        team: 'MIN',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/justin_jefferson.png',
        tier: 1
    },
    'jahmyr-gibbs': {
        id: 'jahmyr-gibbs',
        name: 'Jahmyr Gibbs',
        position: 'RB',
        team: 'DET',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/jahmyr_gibbs.png',
        tier: 1
    },
    'ceedee-lamb': {
        id: 'ceedee-lamb',
        name: 'CeeDee Lamb',
        position: 'WR',
        team: 'DAL',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/ceedee_lamb.png',
        tier: 1
    },

    // Tier 2 Players
    'puka-nacua': {
        id: 'puka-nacua',
        name: 'Puka Nacua',
        position: 'WR',
        team: 'LAR',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/puka_nacua.png',
        tier: 2
    },
    'malik-nabers': {
        id: 'malik-nabers',
        name: 'Malik Nabers',
        position: 'WR',
        team: 'NYG',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/malik_nabers.png',
        tier: 2
    },
    'amon-ra-st-brown': {
        id: 'amon-ra-st-brown',
        name: 'Amon-Ra St. Brown',
        position: 'WR',
        team: 'DET',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/amonra_st_brown.png',
        tier: 2
    },
    'nico-collins': {
        id: 'nico-collins',
        name: 'Nico Collins',
        position: 'WR',
        team: 'HOU',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/nico_collins.png',
        tier: 2
    },
    'ashton-jeanty': {
        id: 'ashton-jeanty',
        name: 'Ashton Jeanty',
        position: 'RB',
        team: 'LV',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/ashton_jeanty.png',
        tier: 2
    },
    'derrick-henry': {
        id: 'derrick-henry',
        name: 'Derrick Henry',
        position: 'RB',
        team: 'BAL',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/derrick_henry.png',
        tier: 2
    },
    'christian-mccaffrey': {
        id: 'christian-mccaffrey',
        name: 'Christian McCaffrey',
        position: 'RB',
        team: 'SF',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/christian_mccaffrey.png',
        tier: 2
    },
    'brian-thomas-jr': {
        id: 'brian-thomas-jr',
        name: 'Brian Thomas Jr.',
        position: 'WR',
        team: 'JAC',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/brian_thomas_jr.png',
        tier: 2
    },
    'de-von-achane': {
        id: 'de-von-achane',
        name: "De'Von Achane",
        position: 'RB',
        team: 'MIA',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/de_von_achane.png',
        tier: 2
    },

    // Tier 3 Players
    'drake-london': {
        id: 'drake-london',
        name: 'Drake London',
        position: 'WR',
        team: 'ATL',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/drake_london.png',
        tier: 3
    },
    'brock-bowers': {
        id: 'brock-bowers',
        name: 'Brock Bowers',
        position: 'TE',
        team: 'LV',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/brock_bowers.png',
        tier: 3
    },
    'aj-brown': {
        id: 'aj-brown',
        name: 'A.J. Brown',
        position: 'WR',
        team: 'PHI',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/aj_brown.png',
        tier: 3
    },
    'josh-jacobs': {
        id: 'josh-jacobs',
        name: 'Josh Jacobs',
        position: 'RB',
        team: 'GB',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/josh_jacobs.png',
        tier: 3
    },
    'jonathan-taylor': {
        id: 'jonathan-taylor',
        name: 'Jonathan Taylor',
        position: 'RB',
        team: 'IND',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/jonathan_taylor.png',
        tier: 3
    },
    'bucky-irving': {
        id: 'bucky-irving',
        name: 'Bucky Irving',
        position: 'RB',
        team: 'TB',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/bucky_irving.png',
        tier: 3
    },
    'ladd-mcconkey': {
        id: 'ladd-mcconkey',
        name: 'Ladd McConkey',
        position: 'WR',
        team: 'LAC',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/ladd_mcconkey.png',
        tier: 3
    },
    'trey-mcbride': {
        id: 'trey-mcbride',
        name: 'Trey McBride',
        position: 'TE',
        team: 'ARI',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/trey_mcbride.png',
        tier: 3
    },
    'josh-allen': {
        id: 'josh-allen',
        name: 'Josh Allen',
        position: 'QB',
        team: 'BUF',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/josh_allen.png',
        tier: 3
    },
    'lamar-jackson': {
        id: 'lamar-jackson',
        name: 'Lamar Jackson',
        position: 'QB',
        team: 'BAL',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/lamar_jackson.png',
        tier: 3
    },

    // Tier 4 Players
    'chase-brown': {
        id: 'chase-brown',
        name: 'Chase Brown',
        position: 'RB',
        team: 'CIN',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/chase_brown.png',
        tier: 4
    },
    'kyren-williams': {
        id: 'kyren-williams',
        name: 'Kyren Williams',
        position: 'RB',
        team: 'LAR',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/kyren_williams.png',
        tier: 4
    },
    'tee-higgins': {
        id: 'tee-higgins',
        name: 'Tee Higgins',
        position: 'WR',
        team: 'CIN',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/tee_higgins.png',
        tier: 4
    },
    'jaxon-smith-njigba': {
        id: 'jaxon-smith-njigba',
        name: 'Jaxon Smith-Njigba',
        position: 'WR',
        team: 'SEA',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/jaxon_smithnjigba.png',
        tier: 4
    },
    'tyreek-hill': {
        id: 'tyreek-hill',
        name: 'Tyreek Hill',
        position: 'WR',
        team: 'MIA',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/tyreek_hill.png',
        tier: 4
    },
    'jayden-daniels': {
        id: 'jayden-daniels',
        name: 'Jayden Daniels',
        position: 'QB',
        team: 'WAS',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/jayden_daniels.png',
        tier: 4
    },
    'garrett-wilson': {
        id: 'garrett-wilson',
        name: 'Garrett Wilson',
        position: 'WR',
        team: 'NYJ',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/garrett_wilson.png',
        tier: 4
    },
    'george-kittle': {
        id: 'george-kittle',
        name: 'George Kittle',
        position: 'TE',
        team: 'SF',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/george_kittle.png',
        tier: 4
    },
    'davante-adams': {
        id: 'davante-adams',
        name: 'Davante Adams',
        position: 'WR',
        team: 'LAR',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/davante_adams.png',
        tier: 4
    },
    'breece-hall': {
        id: 'breece-hall',
        name: 'Breece Hall',
        position: 'RB',
        team: 'NYJ',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/breece_hall.png',
        tier: 4
    },
    'mike-evans': {
        id: 'mike-evans',
        name: 'Mike Evans',
        position: 'WR',
        team: 'TB',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/mike_evans.png',
        tier: 4
    },
    'james-cook': {
        id: 'james-cook',
        name: 'James Cook',
        position: 'RB',
        team: 'BUF',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/james_cook.png',
        tier: 4
    },
    'jalen-hurts': {
        id: 'jalen-hurts',
        name: 'Jalen Hurts',
        position: 'QB',
        team: 'PHI',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/jalen_hurts.png',
        tier: 4
    },
    'terry-mclaurin': {
        id: 'terry-mclaurin',
        name: 'Terry McLaurin',
        position: 'WR',
        team: 'WAS',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/terry_mclaurin.png',
        tier: 4
    },
    'kenneth-walker-iii': {
        id: 'kenneth-walker-iii',
        name: 'Kenneth Walker III',
        position: 'RB',
        team: 'SEA',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/kenneth_walker_iii.png',
        tier: 4
    },
    'alvin-kamara': {
        id: 'alvin-kamara',
        name: 'Alvin Kamara',
        position: 'RB',
        team: 'NO',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/alvin_kamara.png',
        tier: 4
    },
    'marvin-harrison-jr': {
        id: 'marvin-harrison-jr',
        name: 'Marvin Harrison Jr.',
        position: 'WR',
        team: 'ARI',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/marvin_harrison_jr.png',
        tier: 4
    },

    // Tier 5 Players
    'dj-moore': {
        id: 'dj-moore',
        name: 'DJ Moore',
        position: 'WR',
        team: 'CHI',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/dj_moore.png',
        tier: 5
    },
    'chuba-hubbard': {
        id: 'chuba-hubbard',
        name: 'Chuba Hubbard',
        position: 'RB',
        team: 'CAR',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/chuba_hubbard.png',
        tier: 5
    },
    'joe-burrow': {
        id: 'joe-burrow',
        name: 'Joe Burrow',
        position: 'QB',
        team: 'CIN',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/joe_burrow.png',
        tier: 5
    },
    'james-conner': {
        id: 'james-conner',
        name: 'James Conner',
        position: 'RB',
        team: 'ARI',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/james_conner.png',
        tier: 5
    },
    'dk-metcalf': {
        id: 'dk-metcalf',
        name: 'DK Metcalf',
        position: 'WR',
        team: 'PIT',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/dk_metcalf.png',
        tier: 5
    },
    'omarion-hampton': {
        id: 'omarion-hampton',
        name: 'Omarion Hampton',
        position: 'RB',
        team: 'LAC',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/omarion_hampton.png',
        tier: 5
    },
    'courtland-sutton': {
        id: 'courtland-sutton',
        name: 'Courtland Sutton',
        position: 'WR',
        team: 'DEN',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/courtland_sutton.png',
        tier: 5
    },
    'rashee-rice': {
        id: 'rashee-rice',
        name: 'Rashee Rice',
        position: 'WR',
        team: 'KC',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/rashee_rice.png',
        tier: 5
    },
    'joe-mixon': {
        id: 'joe-mixon',
        name: 'Joe Mixon',
        position: 'RB',
        team: 'HOU',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/joe_mixon.png',
        tier: 5
    },
    'devonta-smith': {
        id: 'devonta-smith',
        name: 'DeVonta Smith',
        position: 'WR',
        team: 'PHI',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/devonta_smith.png',
        tier: 5
    },
    'zay-flowers': {
        id: 'zay-flowers',
        name: 'Zay Flowers',
        position: 'WR',
        team: 'BAL',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/zay_flowers.png',
        tier: 5
    },
    'jameson-williams': {
        id: 'jameson-williams',
        name: 'Jameson Williams',
        position: 'WR',
        team: 'DET',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/jameson_williams.png',
        tier: 5
    },
    'david-montgomery': {
        id: 'david-montgomery',
        name: 'David Montgomery',
        position: 'RB',
        team: 'DET',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/david_montgomery.png',
        tier: 5
    },
    'xavier-worthy': {
        id: 'xavier-worthy',
        name: 'Xavier Worthy',
        position: 'WR',
        team: 'KC',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/xavier_worthy.png',
        tier: 5
    },
    'sam-laporta': {
        id: 'sam-laporta',
        name: 'Sam LaPorta',
        position: 'TE',
        team: 'DET',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/sam_laporta.png',
        tier: 5
    },
    'd-andre-swift': {
        id: 'd-andre-swift',
        name: "D'Andre Swift",
        position: 'RB',
        team: 'CHI',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/d_andre_swift.png',
        tier: 5
    },
    'tetairoa-mcmillan': {
        id: 'tetairoa-mcmillan',
        name: 'Tetairoa McMillan',
        position: 'WR',
        team: 'CAR',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/tetairoa_mcmillan.png',
        tier: 5
    },
    'treveyon-henderson': {
        id: 'treveyon-henderson',
        name: 'TreVeyon Henderson',
        position: 'RB',
        team: 'NE',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/treveyon_henderson.png',
        tier: 5
    },
    'jaylen-waddle': {
        id: 'jaylen-waddle',
        name: 'Jaylen Waddle',
        position: 'WR',
        team: 'MIA',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/jaylen_waddle.png',
        tier: 5
    },
    'rj-harvey': {
        id: 'rj-harvey',
        name: 'RJ Harvey',
        position: 'RB',
        team: 'DEN',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/rj_harvey.png',
        tier: 5
    },

    // Tier 6 Players
    'patrick-mahomes-ii': {
        id: 'patrick-mahomes-ii',
        name: 'Patrick Mahomes II',
        position: 'QB',
        team: 'KC',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/patrick_mahomes.png',
        tier: 6
    },
    'aaron-jones-sr': {
        id: 'aaron-jones-sr',
        name: 'Aaron Jones Sr.',
        position: 'RB',
        team: 'MIN',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/aaron_jones_sr.png',
        tier: 6
    },
    'calvin-ridley': {
        id: 'calvin-ridley',
        name: 'Calvin Ridley',
        position: 'WR',
        team: 'TEN',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/calvin_ridley.png',
        tier: 6
    },
    'chris-olave': {
        id: 'chris-olave',
        name: 'Chris Olave',
        position: 'WR',
        team: 'NO',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/chris_olave.png',
        tier: 6
    },
    'kaleb-johnson': {
        id: 'kaleb-johnson',
        name: 'Kaleb Johnson',
        position: 'RB',
        team: 'PIT',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/kaleb_johnson.png',
        tier: 6
    },
    'tony-pollard': {
        id: 'tony-pollard',
        name: 'Tony Pollard',
        position: 'RB',
        team: 'TEN',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/tony_pollard.png',
        tier: 6
    },
    'isiah-pacheco': {
        id: 'isiah-pacheco',
        name: 'Isiah Pacheco',
        position: 'RB',
        team: 'KC',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/isiah_pacheco.png',
        tier: 6
    },
    'george-pickens': {
        id: 'george-pickens',
        name: 'George Pickens',
        position: 'WR',
        team: 'DAL',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/george_pickens.png',
        tier: 6
    },
    'baker-mayfield': {
        id: 'baker-mayfield',
        name: 'Baker Mayfield',
        position: 'QB',
        team: 'TB',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/baker_mayfield.png',
        tier: 6
    },
    'tj-hockenson': {
        id: 'tj-hockenson',
        name: 'T.J. Hockenson',
        position: 'TE',
        team: 'MIN',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/tj_hockenson.png',
        tier: 6
    },
    'travis-hunter': {
        id: 'travis-hunter',
        name: 'Travis Hunter',
        position: 'WR',
        team: 'JAC',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/travis_hunter.png',
        tier: 6
    },
    'chris-godwin': {
        id: 'chris-godwin',
        name: 'Chris Godwin',
        position: 'WR',
        team: 'TB',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/chris_godwin.png',
        tier: 6
    },
    'brian-robinson-jr': {
        id: 'brian-robinson-jr',
        name: 'Brian Robinson Jr.',
        position: 'RB',
        team: 'WAS',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/brian_robinson_jr.png',
        tier: 6
    },
    'bo-nix': {
        id: 'bo-nix',
        name: 'Bo Nix',
        position: 'QB',
        team: 'DEN',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/bo_nix.png',
        tier: 6
    },
    'jerry-jeudy': {
        id: 'jerry-jeudy',
        name: 'Jerry Jeudy',
        position: 'WR',
        team: 'CLE',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/jerry_jeudy.png',
        tier: 6
    },
    'kyler-murray': {
        id: 'kyler-murray',
        name: 'Kyler Murray',
        position: 'QB',
        team: 'ARI',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/kyler_murray.png',
        tier: 6
    },
    'jordan-addison': {
        id: 'jordan-addison',
        name: 'Jordan Addison',
        position: 'WR',
        team: 'MIN',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/jordan_addison.png',
        tier: 6
    },
    'rome-odunze': {
        id: 'rome-odunze',
        name: 'Rome Odunze',
        position: 'WR',
        team: 'CHI',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/rome_odunze.png',
        tier: 6
    },
    'travis-kelce': {
        id: 'travis-kelce',
        name: 'Travis Kelce',
        position: 'TE',
        team: 'KC',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/travis_kelce.png',
        tier: 6
    },
    'mark-andrews': {
        id: 'mark-andrews',
        name: 'Mark Andrews',
        position: 'TE',
        team: 'BAL',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/mark_andrews.png',
        tier: 6
    },
    'jauan-jennings': {
        id: 'jauan-jennings',
        name: 'Jauan Jennings',
        position: 'WR',
        team: 'SF',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/jauan_jennings.png',
        tier: 6
    },

    // Tier 7 Players
    'jakobi-meyers': {
        id: 'jakobi-meyers',
        name: 'Jakobi Meyers',
        position: 'WR',
        team: 'LV',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/jakobi_meyers.png',
        tier: 7
    },
    'david-njoku': {
        id: 'david-njoku',
        name: 'David Njoku',
        position: 'TE',
        team: 'CLE',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/david_njoku.png',
        tier: 7
    },
    'travis-etienne-jr': {
        id: 'travis-etienne-jr',
        name: 'Travis Etienne Jr.',
        position: 'RB',
        team: 'JAC',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/travis_etienne_jr.png',
        tier: 7
    },
    'tyrone-tracy-jr': {
        id: 'tyrone-tracy-jr',
        name: 'Tyrone Tracy Jr.',
        position: 'RB',
        team: 'NYG',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/tyrone_tracy_jr.png',
        tier: 7
    },
    'justin-fields': {
        id: 'justin-fields',
        name: 'Justin Fields',
        position: 'QB',
        team: 'NYJ',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/justin_fields.png',
        tier: 7
    },
    'evan-engram': {
        id: 'evan-engram',
        name: 'Evan Engram',
        position: 'TE',
        team: 'DEN',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/evan_engram.png',
        tier: 7
    },
    'jaylen-warren': {
        id: 'jaylen-warren',
        name: 'Jaylen Warren',
        position: 'RB',
        team: 'PIT',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/jaylen_warren.png',
        tier: 7
    },
    'khalil-shakir': {
        id: 'khalil-shakir',
        name: 'Khalil Shakir',
        position: 'WR',
        team: 'BUF',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/khalil_shakir.png',
        tier: 7
    },
    'brock-purdy': {
        id: 'brock-purdy',
        name: 'Brock Purdy',
        position: 'QB',
        team: 'SF',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/brock_purdy.png',
        tier: 7
    },
    'quinshon-judkins': {
        id: 'quinshon-judkins',
        name: 'Quinshon Judkins',
        position: 'RB',
        team: 'CLE',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/quinshon_judkins.png',
        tier: 7
    },
    'caleb-williams': {
        id: 'caleb-williams',
        name: 'Caleb Williams',
        position: 'QB',
        team: 'CHI',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/caleb_williams.png',
        tier: 7
    },
    'dak-prescott': {
        id: 'dak-prescott',
        name: 'Dak Prescott',
        position: 'QB',
        team: 'DAL',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/dak_prescott.png',
        tier: 7
    },
    'jayden-reed': {
        id: 'jayden-reed',
        name: 'Jayden Reed',
        position: 'WR',
        team: 'GB',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/jayden_reed.png',
        tier: 7
    },
    'justin-herbert': {
        id: 'justin-herbert',
        name: 'Justin Herbert',
        position: 'QB',
        team: 'LAC',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/justin_herbert.png',
        tier: 7
    },
    'stefon-diggs': {
        id: 'stefon-diggs',
        name: 'Stefon Diggs',
        position: 'WR',
        team: 'NE',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/stefon_diggs.png',
        tier: 7
    },
    'deebo-samuel-sr': {
        id: 'deebo-samuel-sr',
        name: 'Deebo Samuel Sr.',
        position: 'WR',
        team: 'WAS',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/deebo_samuel_sr.png',
        tier: 7
    },
    'javonte-williams': {
        id: 'javonte-williams',
        name: 'Javonte Williams',
        position: 'RB',
        team: 'DAL',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/javonte_williams.png',
        tier: 7
    },
    'najee-harris': {
        id: 'najee-harris',
        name: 'Najee Harris',
        position: 'RB',
        team: 'LAC',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/najee_harris.png',
        tier: 7
    },
    'tucker-kraft': {
        id: 'tucker-kraft',
        name: 'Tucker Kraft',
        position: 'TE',
        team: 'GB',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/tucker_kraft.png',
        tier: 7
    },
    'jared-goff': {
        id: 'jared-goff',
        name: 'Jared Goff',
        position: 'QB',
        team: 'DET',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/jared_goff.png',
        tier: 7
    },
    'ricky-pearsall': {
        id: 'ricky-pearsall',
        name: 'Ricky Pearsall',
        position: 'WR',
        team: 'SF',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/ricky_pearsall.png',
        tier: 7
    },
    'josh-downs': {
        id: 'josh-downs',
        name: 'Josh Downs',
        position: 'WR',
        team: 'IND',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/josh_downs.png',
        tier: 7
    },
    'jordan-mason': {
        id: 'jordan-mason',
        name: 'Jordan Mason',
        position: 'RB',
        team: 'MIN',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/jordan_mason.png',
        tier: 7
    },
    'rhamondre-stevenson': {
        id: 'rhamondre-stevenson',
        name: 'Rhamondre Stevenson',
        position: 'RB',
        team: 'NE',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/rhamondre_stevenson.png',
        tier: 7
    },
    'drake-maye': {
        id: 'drake-maye',
        name: 'Drake Maye',
        position: 'QB',
        team: 'NE',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/drake_maye.png',
        tier: 7
    },
    'zach-charbonnet': {
        id: 'zach-charbonnet',
        name: 'Zach Charbonnet',
        position: 'RB',
        team: 'SEA',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/zach_charbonnet.png',
        tier: 7
    },
    'jordan-love': {
        id: 'jordan-love',
        name: 'Jordan Love',
        position: 'QB',
        team: 'GB',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/jordan_love.png',
        tier: 7
    },
    'michael-pittman-jr': {
        id: 'michael-pittman-jr',
        name: 'Michael Pittman Jr.',
        position: 'WR',
        team: 'IND',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/michael_pittman_jr.png',
        tier: 7
    },
    'cam-skattebo': {
        id: 'cam-skattebo',
        name: 'Cam Skattebo',
        position: 'RB',
        team: 'NYG',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/cam_skattebo.png',
        tier: 7
    },
    'cooper-kupp': {
        id: 'cooper-kupp',
        name: 'Cooper Kupp',
        position: 'WR',
        team: 'SEA',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/cooper_kupp.png',
        tier: 7
    },
    'tyjae-spears': {
        id: 'tyjae-spears',
        name: 'Tyjae Spears',
        position: 'RB',
        team: 'TEN',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/tyjae_spears.png',
        tier: 7
    },
    'dalton-kincaid': {
        id: 'dalton-kincaid',
        name: 'Dalton Kincaid',
        position: 'TE',
        team: 'BUF',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/dalton_kincaid.png',
        tier: 7
    },
    'trevor-lawrence': {
        id: 'trevor-lawrence',
        name: 'Trevor Lawrence',
        position: 'QB',
        team: 'JAC',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/trevor_lawrence.png',
        tier: 7
    },
    'darnell-mooney': {
        id: 'darnell-mooney',
        name: 'Darnell Mooney',
        position: 'WR',
        team: 'ATL',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/darnell_mooney.png',
        tier: 7
    },
    'brandon-aiyuk': {
        id: 'brandon-aiyuk',
        name: 'Brandon Aiyuk',
        position: 'WR',
        team: 'SF',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/brandon_aiyuk.png',
        tier: 7
    },
    // Tier 8 Players
    'cj-stroud': {
        id: 'cj-stroud',
        name: 'C.J. Stroud',
        position: 'QB',
        team: 'HOU',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/cj_stroud.png',
        tier: 8
    },
    'jake-ferguson': {
        id: 'jake-ferguson',
        name: 'Jake Ferguson',
        position: 'TE',
        team: 'DAL',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/jake_ferguson.png',
        tier: 8
    },
    'rachaad-white': {
        id: 'rachaad-white',
        name: 'Rachaad White',
        position: 'RB',
        team: 'TB',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/rachaad_white.png',
        tier: 8
    },
    'dallas-goedert': {
        id: 'dallas-goedert',
        name: 'Dallas Goedert',
        position: 'TE',
        team: 'PHI',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/dallas_goedert.png',
        tier: 8
    },
    'tyler-warren': {
        id: 'tyler-warren',
        name: 'Tyler Warren',
        position: 'TE',
        team: 'IND',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/tyler_warren.png',
        tier: 8
    },
    'tank-bigsby': {
        id: 'tank-bigsby',
        name: 'Tank Bigsby',
        position: 'RB',
        team: 'JAC',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/tank_bigsby.png',
        tier: 8
    },
    'jk-dobbins': {
        id: 'jk-dobbins',
        name: 'J.K. Dobbins',
        position: 'RB',
        team: 'DEN',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/jk_dobbins.png',
        tier: 8
    },
    'emeka-egbuka': {
        id: 'emeka-egbuka',
        name: 'Emeka Egbuka',
        position: 'WR',
        team: 'TB',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/emeka_egbuka.png',
        tier: 8
    },
    'matthew-golden': {
        id: 'matthew-golden',
        name: 'Matthew Golden',
        position: 'WR',
        team: 'GB',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/matthew_golden.png',
        tier: 8
    },
    'jj-mccarthy': {
        id: 'jj-mccarthy',
        name: 'J.J. McCarthy',
        position: 'QB',
        team: 'MIN',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/jj_mccarthy.png',
        tier: 8
    },
    'keon-coleman': {
        id: 'keon-coleman',
        name: 'Keon Coleman',
        position: 'WR',
        team: 'BUF',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/keon_coleman.png',
        tier: 8
    },
    'austin-ekeler': {
        id: 'austin-ekeler',
        name: 'Austin Ekeler',
        position: 'RB',
        team: 'WAS',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/austin_ekeler.png',
        tier: 8
    },
    'rashid-shaheed': {
        id: 'rashid-shaheed',
        name: 'Rashid Shaheed',
        position: 'WR',
        team: 'NO',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/rashid_shaheed.png',
        tier: 8
    },
    'trey-benson': {
        id: 'trey-benson',
        name: 'Trey Benson',
        position: 'RB',
        team: 'ARI',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/trey_benson.png',
        tier: 8
    },
    'ray-davis': {
        id: 'ray-davis',
        name: 'Ray Davis',
        position: 'RB',
        team: 'BUF',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/ray_davis.png',
        tier: 8
    },
    'matthew-stafford': {
        id: 'matthew-stafford',
        name: 'Matthew Stafford',
        position: 'QB',
        team: 'LAR',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/matthew_stafford.png',
        tier: 8
    },
    'christian-kirk': {
        id: 'christian-kirk',
        name: 'Christian Kirk',
        position: 'WR',
        team: 'HOU',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/christian_kirk.png',
        tier: 8
    },
    'tua-tagovailoa': {
        id: 'tua-tagovailoa',
        name: 'Tua Tagovailoa',
        position: 'QB',
        team: 'MIA',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/tua_tagovailoa.png',
        tier: 8
    },
    'jonnu-smith': {
        id: 'jonnu-smith',
        name: 'Jonnu Smith',
        position: 'TE',
        team: 'PIT',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/jonnu_smith.png',
        tier: 8
    },
    'colston-loveland': {
        id: 'colston-loveland',
        name: 'Colston Loveland',
        position: 'TE',
        team: 'CHI',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/colston_loveland.png',
        tier: 8
    },
    'rashod-bateman': {
        id: 'rashod-bateman',
        name: 'Rashod Bateman',
        position: 'WR',
        team: 'BAL',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/rashod_bateman.png',
        tier: 8
    },
    'tyler-allgeier': {
        id: 'tyler-allgeier',
        name: 'Tyler Allgeier',
        position: 'RB',
        team: 'ATL',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/tyler_allgeier.png',
        tier: 8
    },
    'isaac-guerendo': {
        id: 'isaac-guerendo',
        name: 'Isaac Guerendo',
        position: 'RB',
        team: 'SF',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/isaac_guerendo.png',
        tier: 8
    },
    'bryce-young': {
        id: 'bryce-young',
        name: 'Bryce Young',
        position: 'QB',
        team: 'CAR',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/bryce_young.png',
        tier: 8
    },
    'rico-dowdle': {
        id: 'rico-dowdle',
        name: 'Rico Dowdle',
        position: 'RB',
        team: 'CAR',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/rico_dowdle.png',
        tier: 8
    },
    'luther-burden-iii': {
        id: 'luther-burden-iii',
        name: 'Luther Burden III',
        position: 'WR',
        team: 'CHI',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/luther_burden_iii.png',
        tier: 8
    },
    'hunter-henry': {
        id: 'hunter-henry',
        name: 'Hunter Henry',
        position: 'TE',
        team: 'NE',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/hunter_henry.png',
        tier: 8
    },
    'cedric-tillman': {
        id: 'cedric-tillman',
        name: 'Cedric Tillman',
        position: 'WR',
        team: 'CLE',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/cedric_tillman.png',
        tier: 8
    },
    'bhayshul-tuten': {
        id: 'bhayshul-tuten',
        name: 'Bhayshul Tuten',
        position: 'RB',
        team: 'JAC',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/bhayshul_tuten.png',
        tier: 8
    },
    'marvin-mims-jr': {
        id: 'marvin-mims-jr',
        name: 'Marvin Mims Jr.',
        position: 'WR',
        team: 'DEN',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/marvin_mims_jr.png',
        tier: 8
    },
    'jaylen-wright': {
        id: 'jaylen-wright',
        name: 'Jaylen Wright',
        position: 'RB',
        team: 'MIA',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/jaylen_wright.png',
        tier: 8
    },
    'tre-harris': {
        id: 'tre-harris',
        name: 'Tre Harris',
        position: 'WR',
        team: 'LAC',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/tre_harris.png',
        tier: 8
    },
    'marquise-brown': {
        id: 'marquise-brown',
        name: 'Marquise Brown',
        position: 'WR',
        team: 'KC',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/marquise_brown.png',
        tier: 8
    },
    'michael-penix-jr': {
        id: 'michael-penix-jr',
        name: 'Michael Penix Jr.',
        position: 'QB',
        team: 'ATL',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/michael_penix_jr.png',
        tier: 8
    },
    'jayden-higgins': {
        id: 'jayden-higgins',
        name: 'Jayden Higgins',
        position: 'WR',
        team: 'HOU',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/jayden_higgins.png',
        tier: 8
    },

    // Tier 9 Players
    'kyle-pitts': {
        id: 'kyle-pitts',
        name: 'Kyle Pitts',
        position: 'TE',
        team: 'ATL',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/kyle_pitts.png',
        tier: 9
    },
    'braelon-allen': {
        id: 'braelon-allen',
        name: 'Braelon Allen',
        position: 'RB',
        team: 'NYJ',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/braelon_allen.png',
        tier: 9
    },
    'jaydon-blue': {
        id: 'jaydon-blue',
        name: 'Jaydon Blue',
        position: 'RB',
        team: 'DAL',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/jaydon_blue.png',
        tier: 9
    },
    'jerome-ford': {
        id: 'jerome-ford',
        name: 'Jerome Ford',
        position: 'RB',
        team: 'CLE',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/jerome_ford.png',
        tier: 9
    },
    'romeo-doubs': {
        id: 'romeo-doubs',
        name: 'Romeo Doubs',
        position: 'WR',
        team: 'GB',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/romeo_doubs.png',
        tier: 9
    },
    'zach-ertz': {
        id: 'zach-ertz',
        name: 'Zach Ertz',
        position: 'TE',
        team: 'WAS',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/zach_ertz.png',
        tier: 9
    },
    'adam-thielen': {
        id: 'adam-thielen',
        name: 'Adam Thielen',
        position: 'WR',
        team: 'CAR',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/adam_thielen.png',
        tier: 9
    },
    'geno-smith': {
        id: 'geno-smith',
        name: 'Geno Smith',
        position: 'QB',
        team: 'LV',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/geno_smith.png',
        tier: 9
    },
    'quentin-johnston': {
        id: 'quentin-johnston',
        name: 'Quentin Johnston',
        position: 'WR',
        team: 'LAC',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/quentin_johnston.png',
        tier: 9
    },
    'kyle-williams': {
        id: 'kyle-williams',
        name: 'Kyle Williams',
        position: 'WR',
        team: 'NE',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 9
    },
    'jalen-mcmillan': {
        id: 'jalen-mcmillan',
        name: 'Jalen McMillan',
        position: 'WR',
        team: 'TB',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/jalen_mcmillan.png',
        tier: 9
    },
    'roschon-johnson': {
        id: 'roschon-johnson',
        name: 'Roschon Johnson',
        position: 'RB',
        team: 'CHI',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/roschon_johnson.png',
        tier: 9
    },
    'isaiah-likely': {
        id: 'isaiah-likely',
        name: 'Isaiah Likely',
        position: 'TE',
        team: 'BAL',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/isaiah_likely.png',
        tier: 9
    },
    'marshawn-lloyd': {
        id: 'marshawn-lloyd',
        name: 'MarShawn Lloyd',
        position: 'RB',
        team: 'GB',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/marshawn_lloyd.png',
        tier: 9
    },
    'dylan-sampson': {
        id: 'dylan-sampson',
        name: 'Dylan Sampson',
        position: 'RB',
        team: 'CLE',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/dylan_sampson.png',
        tier: 9
    },
    'nick-chubb': {
        id: 'nick-chubb',
        name: 'Nick Chubb',
        position: 'RB',
        team: 'HOU',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/nick_chubb.png',
        tier: 9
    },
    'wan-dale-robinson': {
        id: 'wan-dale-robinson',
        name: "Wan'Dale Robinson",
        position: 'WR',
        team: 'NYG',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/wan_dale_robinson.png',
        tier: 9
    },
    'blake-corum': {
        id: 'blake-corum',
        name: 'Blake Corum',
        position: 'RB',
        team: 'LAR',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/blake_corum.png',
        tier: 9
    },
    'xavier-legette': {
        id: 'xavier-legette',
        name: 'Xavier Legette',
        position: 'WR',
        team: 'CAR',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/xavier_legette.png',
        tier: 9
    },
    'deandre-hopkins': {
        id: 'deandre-hopkins',
        name: 'DeAndre Hopkins',
        position: 'WR',
        team: 'BAL',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/deandre_hopkins.png',
        tier: 9
    },
    'sam-darnold': {
        id: 'sam-darnold',
        name: 'Sam Darnold',
        position: 'QB',
        team: 'SEA',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/sam_darnold.png',
        tier: 9
    },
    'joshua-palmer': {
        id: 'joshua-palmer',
        name: 'Joshua Palmer',
        position: 'WR',
        team: 'BUF',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/joshua_palmer.png',
        tier: 9
    },
    'denver-broncos': {
        id: 'denver-broncos',
        name: 'Denver Broncos',
        position: 'DST',
        team: 'DEN',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 9
    },
    'demario-douglas': {
        id: 'demario-douglas',
        name: 'DeMario Douglas',
        position: 'WR',
        team: 'NE',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/demario_douglas.png',
        tier: 9
    },
    'mike-gesicki': {
        id: 'mike-gesicki',
        name: 'Mike Gesicki',
        position: 'TE',
        team: 'CIN',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/mike_gesicki.png',
        tier: 9
    },
    'brenton-strange': {
        id: 'brenton-strange',
        name: 'Brenton Strange',
        position: 'TE',
        team: 'JAC',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/brenton_strange.png',
        tier: 9
    },
    'philadelphia-eagles': {
        id: 'philadelphia-eagles',
        name: 'Philadelphia Eagles',
        position: 'DST',
        team: 'PHI',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 9
    },
    'cameron-ward': {
        id: 'cameron-ward',
        name: 'Cameron Ward',
        position: 'QB',
        team: 'TEN',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 9
    },
    'pat-freiermuth': {
        id: 'pat-freiermuth',
        name: 'Pat Freiermuth',
        position: 'TE',
        team: 'PIT',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/pat_freiermuth.png',
        tier: 9
    },
    'jalen-coker': {
        id: 'jalen-coker',
        name: 'Jalen Coker',
        position: 'WR',
        team: 'CAR',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/jalen_coker.png',
        tier: 9
    },
    'jack-bech': {
        id: 'jack-bech',
        name: 'Jack Bech',
        position: 'WR',
        team: 'LV',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/jack_bech.png',
        tier: 9
    },
    'kareem-hunt': {
        id: 'kareem-hunt',
        name: 'Kareem Hunt',
        position: 'RB',
        team: 'KC',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/kareem_hunt.png',
        tier: 9
    },
    'alec-pierce': {
        id: 'alec-pierce',
        name: 'Alec Pierce',
        position: 'WR',
        team: 'IND',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/alec_pierce.png',
        tier: 9
    },
    'cade-otton': {
        id: 'cade-otton',
        name: 'Cade Otton',
        position: 'TE',
        team: 'TB',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/cade_otton.png',
        tier: 9
    },
    'baltimore-ravens': {
        id: 'baltimore-ravens',
        name: 'Baltimore Ravens',
        position: 'DST',
        team: 'BAL',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 9
    },
    'minnesota-vikings': {
        id: 'minnesota-vikings',
        name: 'Minnesota Vikings',
        position: 'DST',
        team: 'MIN',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 9
    },

    // Tier 10 Players
    'pittsburgh-steelers': {
        id: 'pittsburgh-steelers',
        name: 'Pittsburgh Steelers',
        position: 'DST',
        team: 'PIT',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'dj-giddens': {
        id: 'dj-giddens',
        name: 'DJ Giddens',
        position: 'RB',
        team: 'IND',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'chig-okonkwo': {
        id: 'chig-okonkwo',
        name: 'Chig Okonkwo',
        position: 'TE',
        team: 'TEN',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/chig_okonkwo.png',
        tier: 10
    },
    'justice-hill': {
        id: 'justice-hill',
        name: 'Justice Hill',
        position: 'RB',
        team: 'BAL',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'houston-texans': {
        id: 'houston-texans',
        name: 'Houston Texans',
        position: 'DST',
        team: 'HOU',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'aaron-rodgers': {
        id: 'aaron-rodgers',
        name: 'Aaron Rodgers',
        position: 'QB',
        team: 'PIT',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/aaron_rodgers.png',
        tier: 10
    },
    'kansas-city-chiefs': {
        id: 'kansas-city-chiefs',
        name: 'Kansas City Chiefs',
        position: 'DST',
        team: 'KC',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'michael-wilson': {
        id: 'michael-wilson',
        name: 'Michael Wilson',
        position: 'WR',
        team: 'ARI',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/michael_wilson.png',
        tier: 10
    },
    'buffalo-bills': {
        id: 'buffalo-bills',
        name: 'Buffalo Bills',
        position: 'DST',
        team: 'BUF',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'mason-taylor': {
        id: 'mason-taylor',
        name: 'Mason Taylor',
        position: 'TE',
        team: 'NYJ',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/mason_taylor.png',
        tier: 10
    },
    'brandon-aubrey': {
        id: 'brandon-aubrey',
        name: 'Brandon Aubrey',
        position: 'K',
        team: 'DAL',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'adonai-mitchell': {
        id: 'adonai-mitchell',
        name: 'Adonai Mitchell',
        position: 'WR',
        team: 'IND',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/adonai_mitchell.png',
        tier: 10
    },
    'dalton-schultz': {
        id: 'dalton-schultz',
        name: 'Dalton Schultz',
        position: 'TE',
        team: 'HOU',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/dalton_schultz.png',
        tier: 10
    },
    'jake-bates': {
        id: 'jake-bates',
        name: 'Jake Bates',
        position: 'K',
        team: 'DET',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'dontayvion-wicks': {
        id: 'dontayvion-wicks',
        name: "Dontayvion Wicks",
        position: 'WR',
        team: 'GB',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/dontayvion_wicks.png',
        tier: 10
    },
    'detroit-lions': {
        id: 'detroit-lions',
        name: 'Detroit Lions',
        position: 'DST',
        team: 'DET',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'kendre-miller': {
        id: 'kendre-miller',
        name: 'Kendre Miller',
        position: 'RB',
        team: 'NO',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/kendre_miller.png',
        tier: 10
    },
    'jaylin-noel': {
        id: 'jaylin-noel',
        name: 'Jaylin Noel',
        position: 'WR',
        team: 'HOU',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'los-angeles-rams': {
        id: 'los-angeles-rams',
        name: 'Los Angeles Rams',
        position: 'DST',
        team: 'LAR',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'darius-slayton': {
        id: 'darius-slayton',
        name: 'Darius Slayton',
        position: 'WR',
        team: 'NYG',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'wil-lutz': {
        id: 'wil-lutz',
        name: 'Wil Lutz',
        position: 'K',
        team: 'DEN',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'los-angeles-chargers': {
        id: 'los-angeles-chargers',
        name: 'Los Angeles Chargers',
        position: 'DST',
        team: 'LAC',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'cameron-dicker': {
        id: 'cameron-dicker',
        name: 'Cameron Dicker',
        position: 'K',
        team: 'LAC',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'green-bay-packers': {
        id: 'green-bay-packers',
        name: 'Green Bay Packers',
        position: 'DST',
        team: 'GB',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'andrei-iosivas': {
        id: 'andrei-iosivas',
        name: 'Andrei Iosivas',
        position: 'WR',
        team: 'CIN',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'devin-neal': {
        id: 'devin-neal',
        name: 'Devin Neal',
        position: 'RB',
        team: 'NO',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'chris-boswell': {
        id: 'chris-boswell',
        name: 'Chris Boswell',
        position: 'K',
        team: 'PIT',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'seattle-seahawks': {
        id: 'seattle-seahawks',
        name: 'Seattle Seahawks',
        position: 'DST',
        team: 'SEA',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'will-shipley': {
        id: 'will-shipley',
        name: 'Will Shipley',
        position: 'RB',
        team: 'PHI',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'chase-mclaughlin': {
        id: 'chase-mclaughlin',
        name: 'Chase McLaughlin',
        position: 'K',
        team: 'TB',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'kyle-monangai': {
        id: 'kyle-monangai',
        name: 'Kyle Monangai',
        position: 'RB',
        team: 'CHI',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'elijah-arroyo': {
        id: 'elijah-arroyo',
        name: 'Elijah Arroyo',
        position: 'TE',
        team: 'SEA',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'kaimi-fairbairn': {
        id: 'kaimi-fairbairn',
        name: "Ka'imi Fairbairn",
        position: 'K',
        team: 'HOU',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'miles-sanders': {
        id: 'miles-sanders',
        name: 'Miles Sanders',
        position: 'RB',
        team: 'DAL',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/miles_sanders.png',
        tier: 10
    },
    'evan-mcpherson': {
        id: 'evan-mcpherson',
        name: 'Evan McPherson',
        position: 'K',
        team: 'CIN',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'jaleel-mclaughlin': {
        id: 'jaleel-mclaughlin',
        name: 'Jaleel McLaughlin',
        position: 'RB',
        team: 'DEN',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/jaleel_mclaughlin.png',
        tier: 10
    },
    'harrison-butker': {
        id: 'harrison-butker',
        name: 'Harrison Butker',
        position: 'K',
        team: 'KC',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'new-york-jets': {
        id: 'new-york-jets',
        name: 'New York Jets',
        position: 'DST',
        team: 'NYJ',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'keenan-allen': {
        id: 'keenan-allen',
        name: 'Keenan Allen',
        position: 'WR',
        team: 'FA',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'calvin-austin-iii': {
        id: 'calvin-austin-iii',
        name: 'Calvin Austin III',
        position: 'WR',
        team: 'PIT',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'juwan-johnson': {
        id: 'juwan-johnson',
        name: 'Juwan Johnson',
        position: 'TE',
        team: 'NO',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'anthony-richardson-sr': {
        id: 'anthony-richardson-sr',
        name: 'Anthony Richardson Sr.',
        position: 'QB',
        team: 'IND',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/anthony_richardson_sr.png',
        tier: 10
    },
    'keaton-mitchell': {
        id: 'keaton-mitchell',
        name: 'Keaton Mitchell',
        position: 'RB',
        team: 'BAL',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/keaton_mitchell.png',
        tier: 10
    },
    'tyler-bass': {
        id: 'tyler-bass',
        name: 'Tyler Bass',
        position: 'K',
        team: 'BUF',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'jatavion-sanders': {
        id: 'jatavion-sanders',
        name: "Ja'Tavion Sanders",
        position: 'TE',
        team: 'CAR',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'jarquez-hunter': {
        id: 'jarquez-hunter',
        name: 'Jarquez Hunter',
        position: 'RB',
        team: 'LAR',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'devaughn-vele': {
        id: 'devaughn-vele',
        name: 'Devaughn Vele',
        position: 'WR',
        team: 'DEN',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/devaughn_vele.png',
        tier: 10
    },
    'pat-bryant': {
        id: 'pat-bryant',
        name: 'Pat Bryant',
        position: 'WR',
        team: 'DEN',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/pat_bryant.png',
        tier: 10
    },
    'raheem-mostert': {
        id: 'raheem-mostert',
        name: 'Raheem Mostert',
        position: 'RB',
        team: 'LV',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'san-francisco-49ers': {
        id: 'san-francisco-49ers',
        name: 'San Francisco 49ers',
        position: 'DST',
        team: 'SF',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'elic-ayomanor': {
        id: 'elic-ayomanor',
        name: 'Elic Ayomanor',
        position: 'WR',
        team: 'TEN',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'russell-wilson': {
        id: 'russell-wilson',
        name: 'Russell Wilson',
        position: 'QB',
        team: 'NYG',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/russell_wilson.png',
        tier: 10
    },
    'jake-elliott': {
        id: 'jake-elliott',
        name: 'Jake Elliott',
        position: 'K',
        team: 'PHI',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'cole-kmet': {
        id: 'cole-kmet',
        name: 'Cole Kmet',
        position: 'TE',
        team: 'CHI',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 10
    },
    'audric-estime': {
        id: 'audric-estime',
        name: 'Audric Estime',
        position: 'RB',
        team: 'DEN',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/audric_estime.png',
        tier: 10
    },

    // Tier 11 Players
    'brashard-smith': {
        id: 'brashard-smith',
        name: 'Brashard Smith',
        position: 'RB',
        team: 'KC',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'elijah-mitchell': {
        id: 'elijah-mitchell',
        name: 'Elijah Mitchell',
        position: 'RB',
        team: 'KC',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'tyler-lockett': {
        id: 'tyler-lockett',
        name: 'Tyler Lockett',
        position: 'WR',
        team: 'TEN',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'jalen-tolbert': {
        id: 'jalen-tolbert',
        name: 'Jalen Tolbert',
        position: 'WR',
        team: 'DAL',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'jason-sanders': {
        id: 'jason-sanders',
        name: 'Jason Sanders',
        position: 'K',
        team: 'MIA',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'ollie-gordon-ii': {
        id: 'ollie-gordon-ii',
        name: 'Ollie Gordon II',
        position: 'RB',
        team: 'MIA',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'diontae-johnson': {
        id: 'diontae-johnson',
        name: 'Diontae Johnson',
        position: 'WR',
        team: 'CLE',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'brandin-cooks': {
        id: 'brandin-cooks',
        name: 'Brandin Cooks',
        position: 'WR',
        team: 'NO',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'younghoe-koo': {
        id: 'younghoe-koo',
        name: 'Younghoe Koo',
        position: 'K',
        team: 'ATL',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'trevor-etienne': {
        id: 'trevor-etienne',
        name: 'Trevor Etienne',
        position: 'RB',
        team: 'CAR',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'tahj-brooks': {
        id: 'tahj-brooks',
        name: 'Tahj Brooks',
        position: 'RB',
        team: 'CIN',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'daniel-jones': {
        id: 'daniel-jones',
        name: 'Daniel Jones',
        position: 'QB',
        team: 'IND',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/daniel_jones.png',
        tier: 11
    },
    'dyami-brown': {
        id: 'dyami-brown',
        name: 'Dyami Brown',
        position: 'WR',
        team: 'JAC',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'dallas-cowboys': {
        id: 'dallas-cowboys',
        name: 'Dallas Cowboys',
        position: 'DST',
        team: 'DAL',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'elijah-moore': {
        id: 'elijah-moore',
        name: 'Elijah Moore',
        position: 'WR',
        team: 'BUF',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'tampa-bay-buccaneers': {
        id: 'tampa-bay-buccaneers',
        name: 'Tampa Bay Buccaneers',
        position: 'DST',
        team: 'TB',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'antonio-gibson': {
        id: 'antonio-gibson',
        name: 'Antonio Gibson',
        position: 'RB',
        team: 'NE',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'joshua-karty': {
        id: 'joshua-karty',
        name: 'Joshua Karty',
        position: 'K',
        team: 'LAR',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'devin-singletary': {
        id: 'devin-singletary',
        name: 'Devin Singletary',
        position: 'RB',
        team: 'NYG',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'roman-wilson': {
        id: 'roman-wilson',
        name: 'Roman Wilson',
        position: 'WR',
        team: 'PIT',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'jalen-royals': {
        id: 'jalen-royals',
        name: 'Jalen Royals',
        position: 'WR',
        team: 'KC',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'nick-westbrook-ikhine': {
        id: 'nick-westbrook-ikhine',
        name: 'Nick Westbrook-Ikhine',
        position: 'WR',
        team: 'MIA',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'kenneth-gainwell': {
        id: 'kenneth-gainwell',
        name: 'Kenneth Gainwell',
        position: 'RB',
        team: 'PIT',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'kayshon-boutte': {
        id: 'kayshon-boutte',
        name: 'Kayshon Boutte',
        position: 'WR',
        team: 'NE',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'amari-cooper': {
        id: 'amari-cooper',
        name: 'Amari Cooper',
        position: 'WR',
        team: 'FA',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'sean-tucker': {
        id: 'sean-tucker',
        name: 'Sean Tucker',
        position: 'RB',
        team: 'TB',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'khalil-herbert': {
        id: 'khalil-herbert',
        name: 'Khalil Herbert',
        position: 'RB',
        team: 'IND',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'ty-johnson': {
        id: 'ty-johnson',
        name: 'Ty Johnson',
        position: 'RB',
        team: 'BUF',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'matt-gay': {
        id: 'matt-gay',
        name: 'Matt Gay',
        position: 'K',
        team: 'WAS',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'noah-gray': {
        id: 'noah-gray',
        name: 'Noah Gray',
        position: 'TE',
        team: 'KC',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'malik-washington': {
        id: 'malik-washington',
        name: 'Malik Washington',
        position: 'WR',
        team: 'MIA',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'jordan-james': {
        id: 'jordan-james',
        name: 'Jordan James',
        position: 'RB',
        team: 'SF',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'cleveland-browns': {
        id: 'cleveland-browns',
        name: 'Cleveland Browns',
        position: 'DST',
        team: 'CLE',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'woody-marks': {
        id: 'woody-marks',
        name: 'Woody Marks',
        position: 'RB',
        team: 'HOU',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'zack-moss': {
        id: 'zack-moss',
        name: 'Zack Moss',
        position: 'RB',
        team: 'CIN',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/zack_moss.png',
        tier: 11
    },
    'isaiah-davis': {
        id: 'isaiah-davis',
        name: 'Isaiah Davis',
        position: 'RB',
        team: 'NYJ',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'tyler-shough': {
        id: 'tyler-shough',
        name: 'Tyler Shough',
        position: 'QB',
        team: 'NO',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/tyler_shough.png',
        tier: 11
    },
    'joe-flacco': {
        id: 'joe-flacco',
        name: 'Joe Flacco',
        position: 'QB',
        team: 'CLE',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/joe_flacco.png',
        tier: 11
    },
    'harold-fannin-jr': {
        id: 'harold-fannin-jr',
        name: 'Harold Fannin Jr.',
        position: 'TE',
        team: 'CLE',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'tre-tucker': {
        id: 'tre-tucker',
        name: 'Tre Tucker',
        position: 'WR',
        team: 'LV',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'taysom-hill': {
        id: 'taysom-hill',
        name: 'Taysom Hill',
        position: 'TE',
        team: 'NO',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'chicago-bears': {
        id: 'chicago-bears',
        name: 'Chicago Bears',
        position: 'DST',
        team: 'CHI',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'darren-waller': {
        id: 'darren-waller',
        name: 'Darren Waller',
        position: 'TE',
        team: 'MIA',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'tim-patrick': {
        id: 'tim-patrick',
        name: 'Tim Patrick',
        position: 'WR',
        team: 'DET',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'alexander-mattison': {
        id: 'alexander-mattison',
        name: 'Alexander Mattison',
        position: 'RB',
        team: 'MIA',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'noah-fant': {
        id: 'noah-fant',
        name: 'Noah Fant',
        position: 'TE',
        team: 'FA',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'dameon-pierce': {
        id: 'dameon-pierce',
        name: 'Dameon Pierce',
        position: 'RB',
        team: 'HOU',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'terrance-ferguson': {
        id: 'terrance-ferguson',
        name: 'Terrance Ferguson',
        position: 'TE',
        team: 'LAR',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'jaxson-dart': {
        id: 'jaxson-dart',
        name: 'Jaxson Dart',
        position: 'QB',
        team: 'NYG',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/jaxson_dart.png',
        tier: 11
    },
    'damien-martinez': {
        id: 'damien-martinez',
        name: 'Damien Martinez',
        position: 'RB',
        team: 'SEA',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'daniel-carlson': {
        id: 'daniel-carlson',
        name: 'Daniel Carlson',
        position: 'K',
        team: 'LV',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'xavier-restrepo': {
        id: 'xavier-restrepo',
        name: 'Xavier Restrepo',
        position: 'WR',
        team: 'TEN',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'theo-johnson': {
        id: 'theo-johnson',
        name: 'Theo Johnson',
        position: 'TE',
        team: 'NYG',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    'sincere-mccormick': {
        id: 'sincere-mccormick',
        name: 'Sincere McCormick',
        position: 'RB',
        team: 'LV',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 11
    },
    // Tier 12 Players
    'kimani-vidal': {
        id: 'kimani-vidal',
        name: 'Kimani Vidal',
        position: 'RB',
        team: 'LAC',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'parker-washington': {
        id: 'parker-washington',
        name: 'Parker Washington',
        position: 'WR',
        team: 'JAC',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'jalen-nailor': {
        id: 'jalen-nailor',
        name: 'Jalen Nailor',
        position: 'WR',
        team: 'MIN',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'tory-horton': {
        id: 'tory-horton',
        name: 'Tory Horton',
        position: 'WR',
        team: 'SEA',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'christian-watson': {
        id: 'christian-watson',
        name: 'Christian Watson',
        position: 'WR',
        team: 'GB',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'phil-mafah': {
        id: 'phil-mafah',
        name: 'Phil Mafah',
        position: 'RB',
        team: 'DAL',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'luke-mccaffrey': {
        id: 'luke-mccaffrey',
        name: 'Luke McCaffrey',
        position: 'WR',
        team: 'WAS',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'oronde-gadsden-ii': {
        id: 'oronde-gadsden-ii',
        name: 'Oronde Gadsden II',
        position: 'TE',
        team: 'LAC',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'gabe-davis': {
        id: 'gabe-davis',
        name: 'Gabe Davis',
        position: 'WR',
        team: 'FA',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'ty-chandler': {
        id: 'ty-chandler',
        name: 'Ty Chandler',
        position: 'RB',
        team: 'MIN',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'ben-sinnott': {
        id: 'ben-sinnott',
        name: 'Ben Sinnott',
        position: 'TE',
        team: 'WAS',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'isaac-teslaa': {
        id: 'isaac-teslaa',
        name: 'Isaac TeSlaa',
        position: 'WR',
        team: 'DET',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'emanuel-wilson': {
        id: 'emanuel-wilson',
        name: 'Emanuel Wilson',
        position: 'RB',
        team: 'GB',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'jason-myers': {
        id: 'jason-myers',
        name: 'Jason Myers',
        position: 'K',
        team: 'SEA',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'jermaine-burton': {
        id: 'jermaine-burton',
        name: 'Jermaine Burton',
        position: 'WR',
        team: 'CIN',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'chris-brooks': {
        id: 'chris-brooks',
        name: 'Chris Brooks',
        position: 'RB',
        team: 'GB',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'jacory-croskey-merritt': {
        id: 'jacory-croskey-merritt',
        name: 'Jacory Croskey-Merritt',
        position: 'RB',
        team: 'WAS',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'shedeur-sanders': {
        id: 'shedeur-sanders',
        name: 'Shedeur Sanders',
        position: 'QB',
        team: 'CLE',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/shedeur_sanders.png',
        tier: 12
    },
    'tez-johnson': {
        id: 'tez-johnson',
        name: 'Tez Johnson',
        position: 'WR',
        team: 'TB',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'new-england-patriots': {
        id: 'new-england-patriots',
        name: 'New England Patriots',
        position: 'DST',
        team: 'NE',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'raheim-sanders': {
        id: 'raheim-sanders',
        name: 'Raheim Sanders',
        position: 'RB',
        team: 'LAC',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'tyler-higbee': {
        id: 'tyler-higbee',
        name: 'Tyler Higbee',
        position: 'TE',
        team: 'LAR',
        photo: 'https://wp.theringer.com/wp-content/uploads/fantasy-football/2025/players/tyler_higbee.png',
        tier: 12
    },
    'chris-rodriguez-jr': {
        id: 'chris-rodriguez-jr',
        name: 'Chris Rodriguez Jr.',
        position: 'RB',
        team: 'WAS',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'tyler-conklin': {
        id: 'tyler-conklin',
        name: 'Tyler Conklin',
        position: 'TE',
        team: 'LAC',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'dont-e-thornton-jr': {
        id: 'dont-e-thornton-jr',
        name: "Dont'e Thornton Jr.",
        position: 'WR',
        team: 'LV',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'tutu-atwell': {
        id: 'tutu-atwell',
        name: 'Tutu Atwell',
        position: 'WR',
        team: 'LAR',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'miami-dolphins': {
        id: 'miami-dolphins',
        name: 'Miami Dolphins',
        position: 'DST',
        team: 'MIA',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'will-reichard': {
        id: 'will-reichard',
        name: 'Will Reichard',
        position: 'K',
        team: 'MIN',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'will-dissly': {
        id: 'will-dissly',
        name: 'Will Dissly',
        position: 'TE',
        team: 'LAC',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'arizona-cardinals': {
        id: 'arizona-cardinals',
        name: 'Arizona Cardinals',
        position: 'DST',
        team: 'ARI',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'zamir-white': {
        id: 'zamir-white',
        name: 'Zamir White',
        position: 'RB',
        team: 'LV',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'jordan-whittington': {
        id: 'jordan-whittington',
        name: 'Jordan Whittington',
        position: 'WR',
        team: 'LAR',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'tai-felton': {
        id: 'tai-felton',
        name: 'Tai Felton',
        position: 'WR',
        team: 'MIN',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'cam-akers': {
        id: 'cam-akers',
        name: 'Cam Akers',
        position: 'RB',
        team: 'NO',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'tyler-loop': {
        id: 'tyler-loop',
        name: 'Tyler Loop',
        position: 'K',
        team: 'BAL',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'gus-edwards': {
        id: 'gus-edwards',
        name: 'Gus Edwards',
        position: 'RB',
        team: 'FA',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'ray-ray-mccloud-iii': {
        id: 'ray-ray-mccloud-iii',
        name: 'Ray-Ray McCloud III',
        position: 'WR',
        team: 'ATL',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'marquez-valdes-scantling': {
        id: 'marquez-valdes-scantling',
        name: 'Marquez Valdes-Scantling',
        position: 'WR',
        team: 'SEA',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'savion-williams': {
        id: 'savion-williams',
        name: 'Savion Williams',
        position: 'WR',
        team: 'GB',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'aj-dillon': {
        id: 'aj-dillon',
        name: 'A.J. Dillon',
        position: 'RB',
        team: 'PHI',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'demarcus-robinson': {
        id: 'demarcus-robinson',
        name: 'Demarcus Robinson',
        position: 'WR',
        team: 'SF',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'jalen-milroe': {
        id: 'jalen-milroe',
        name: 'Jalen Milroe',
        position: 'QB',
        team: 'SEA',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'john-metchie-iii': {
        id: 'john-metchie-iii',
        name: 'John Metchie III',
        position: 'WR',
        team: 'HOU',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'justin-tucker': {
        id: 'justin-tucker',
        name: 'Justin Tucker',
        position: 'K',
        team: 'FA',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'troy-franklin': {
        id: 'troy-franklin',
        name: 'Troy Franklin',
        position: 'WR',
        team: 'DEN',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'noah-brown': {
        id: 'noah-brown',
        name: 'Noah Brown',
        position: 'WR',
        team: 'WAS',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'samaje-perine': {
        id: 'samaje-perine',
        name: 'Samaje Perine',
        position: 'RB',
        team: 'CIN',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    'josh-reynolds': {
        id: 'josh-reynolds',
        name: 'Josh Reynolds',
        position: 'WR',
        team: 'NYJ',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 12
    },
    // Tier 13 Players
    'dawson-knox': {
        id: 'dawson-knox',
        name: 'Dawson Knox',
        position: 'TE',
        team: 'BUF',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'michael-mayer': {
        id: 'michael-mayer',
        name: 'Michael Mayer',
        position: 'TE',
        team: 'LV',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'jameis-winston': {
        id: 'jameis-winston',
        name: 'Jameis Winston',
        position: 'QB',
        team: 'NYG',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'kavontae-turpin': {
        id: 'kavontae-turpin',
        name: 'KaVontae Turpin',
        position: 'WR',
        team: 'DAL',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'chimere-dike': {
        id: 'chimere-dike',
        name: 'Chimere Dike',
        position: 'WR',
        team: 'TEN',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'luke-musgrave': {
        id: 'luke-musgrave',
        name: 'Luke Musgrave',
        position: 'TE',
        team: 'GB',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'spencer-rattler': {
        id: 'spencer-rattler',
        name: 'Spencer Rattler',
        position: 'QB',
        team: 'NO',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'mack-hollins': {
        id: 'mack-hollins',
        name: 'Mack Hollins',
        position: 'WR',
        team: 'NE',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'jake-moody': {
        id: 'jake-moody',
        name: 'Jake Moody',
        position: 'K',
        team: 'SF',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'austin-hooper': {
        id: 'austin-hooper',
        name: 'Austin Hooper',
        position: 'TE',
        team: 'NE',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'kirk-cousins': {
        id: 'kirk-cousins',
        name: 'Kirk Cousins',
        position: 'QB',
        team: 'ATL',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'new-york-giants': {
        id: 'new-york-giants',
        name: 'New York Giants',
        position: 'DST',
        team: 'NYG',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'donovan-edwards': {
        id: 'donovan-edwards',
        name: 'Donovan Edwards',
        position: 'RB',
        team: 'NYJ',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'brandon-mcmanus': {
        id: 'brandon-mcmanus',
        name: 'Brandon McManus',
        position: 'K',
        team: 'GB',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'tank-dell': {
        id: 'tank-dell',
        name: 'Tank Dell',
        position: 'WR',
        team: 'HOU',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'lequint-allen-jr': {
        id: 'lequint-allen-jr',
        name: 'LeQuint Allen Jr.',
        position: 'RB',
        team: 'JAC',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'curtis-samuel': {
        id: 'curtis-samuel',
        name: 'Curtis Samuel',
        position: 'WR',
        team: 'BUF',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'allen-lazard': {
        id: 'allen-lazard',
        name: 'Allen Lazard',
        position: 'WR',
        team: 'NYJ',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'gunnar-helm': {
        id: 'gunnar-helm',
        name: 'Gunnar Helm',
        position: 'TE',
        team: 'TEN',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'washington-commanders': {
        id: 'washington-commanders',
        name: 'Washington Commanders',
        position: 'DST',
        team: 'WAS',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'greg-dortch': {
        id: 'greg-dortch',
        name: 'Greg Dortch',
        position: 'WR',
        team: 'ARI',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'foster-moreau': {
        id: 'foster-moreau',
        name: 'Foster Moreau',
        position: 'TE',
        team: 'NO',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'cam-little': {
        id: 'cam-little',
        name: 'Cam Little',
        position: 'K',
        team: 'JAC',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'jaylin-lane': {
        id: 'jaylin-lane',
        name: 'Jaylin Lane',
        position: 'WR',
        team: 'WAS',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'isaiah-bond': {
        id: 'isaiah-bond',
        name: 'Isaiah Bond',
        position: 'WR',
        team: 'FA',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'eddy-pineiro': {
        id: 'eddy-pineiro',
        name: 'Eddy Pineiro',
        position: 'K',
        team: 'FA',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'kenny-pickett': {
        id: 'kenny-pickett',
        name: 'Kenny Pickett',
        position: 'QB',
        team: 'CLE',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'jahan-dotson': {
        id: 'jahan-dotson',
        name: 'Jahan Dotson',
        position: 'WR',
        team: 'PHI',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'aj-barner': {
        id: 'aj-barner',
        name: 'AJ Barner',
        position: 'TE',
        team: 'SEA',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'tommy-tremble': {
        id: 'tommy-tremble',
        name: 'Tommy Tremble',
        position: 'TE',
        team: 'CAR',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'trey-sermon': {
        id: 'trey-sermon',
        name: 'Trey Sermon',
        position: 'RB',
        team: 'PIT',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'jacob-cowing': {
        id: 'jacob-cowing',
        name: 'Jacob Cowing',
        position: 'WR',
        team: 'SF',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'dillon-gabriel': {
        id: 'dillon-gabriel',
        name: 'Dillon Gabriel',
        position: 'QB',
        team: 'CLE',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'luke-schoonmaker': {
        id: 'luke-schoonmaker',
        name: 'Luke Schoonmaker',
        position: 'TE',
        team: 'DAL',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'kalel-mullings': {
        id: 'kalel-mullings',
        name: 'Kalel Mullings',
        position: 'RB',
        team: 'TEN',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'robert-woods': {
        id: 'robert-woods',
        name: 'Robert Woods',
        position: 'WR',
        team: 'PIT',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'atlanta-falcons': {
        id: 'atlanta-falcons',
        name: 'Atlanta Falcons',
        position: 'DST',
        team: 'ATL',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'van-jefferson': {
        id: 'van-jefferson',
        name: 'Van Jefferson',
        position: 'WR',
        team: 'TEN',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'arian-smith': {
        id: 'arian-smith',
        name: 'Arian Smith',
        position: 'WR',
        team: 'NYJ',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'matt-prater': {
        id: 'matt-prater',
        name: 'Matt Prater',
        position: 'K',
        team: 'FA',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'jalyhn-polk': {
        id: 'jalyhn-polk',
        name: "Ja'Lynn Polk",
        position: 'WR',
        team: 'NE',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'mason-rudolph': {
        id: 'mason-rudolph',
        name: 'Mason Rudolph',
        position: 'QB',
        team: 'PIT',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'emari-demercado': {
        id: 'emari-demercado',
        name: 'Emari Demercado',
        position: 'RB',
        team: 'ARI',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'ameer-abdullah': {
        id: 'ameer-abdullah',
        name: 'Ameer Abdullah',
        position: 'RB',
        team: 'FA',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'cincinnati-bengals': {
        id: 'cincinnati-bengals',
        name: 'Cincinnati Bengals',
        position: 'DST',
        team: 'CIN',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'kendrick-bourne': {
        id: 'kendrick-bourne',
        name: 'Kendrick Bourne',
        position: 'WR',
        team: 'NE',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'chad-ryland': {
        id: 'chad-ryland',
        name: 'Chad Ryland',
        position: 'K',
        team: 'ARI',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'craig-reynolds': {
        id: 'craig-reynolds',
        name: 'Craig Reynolds',
        position: 'RB',
        team: 'DET',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'jalin-hyatt': {
        id: 'jalin-hyatt',
        name: 'Jalin Hyatt',
        position: 'WR',
        team: 'NYG',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'indianapolis-colts': {
        id: 'indianapolis-colts',
        name: 'Indianapolis Colts',
        position: 'DST',
        team: 'IND',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'olamide-zaccheaus': {
        id: 'olamide-zaccheaus',
        name: 'Olamide Zaccheaus',
        position: 'WR',
        team: 'CHI',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'josh-oliver': {
        id: 'josh-oliver',
        name: 'Josh Oliver',
        position: 'TE',
        team: 'MIN',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'cade-stover': {
        id: 'cade-stover',
        name: 'Cade Stover',
        position: 'TE',
        team: 'HOU',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    },
    'blake-grupe': {
        id: 'blake-grupe',
        name: 'Blake Grupe',
        position: 'K',
        team: 'NO',
        photo: 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg',
        tier: 13
    }
};

// For each DST entry, update the photo to use getTeamLogo(team) instead of the placeholder or any other image
Object.keys(playerDatabase).forEach((id) => {
    const player = playerDatabase[id];
    if (player.position === 'DST' && player.team && typeof getTeamLogo === 'function') {
        player.photo = getTeamLogo(player.team);
    }
});

// Helper function to get player data by ID
export const getPlayerData = (playerId) => {
    return playerDatabase[playerId] || null;
};

// Helper function to get all players
export const getAllPlayers = () => {
    return Object.values(playerDatabase);
};

// Helper function to get players by tier
export const getPlayersByTier = (tier) => {
    return Object.values(playerDatabase).filter(player => player.tier === tier);
};

// Helper function to search players by name
export const searchPlayers = (searchTerm) => {
    const term = searchTerm.toLowerCase();
    return Object.values(playerDatabase).filter(player =>
        player.name.toLowerCase().includes(term) ||
        player.team.toLowerCase().includes(term) ||
        player.position.toLowerCase().includes(term)
    );
}; 