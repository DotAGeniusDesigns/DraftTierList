#!/usr/bin/env python3
"""Rebuild rawTierList2026.txt from the canonical user player order + ADP list."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW_FILE = ROOT / 'scripts' / 'rawTierList2026.txt'

TIER_STARTS = [1, 8, 16, 28, 48, 68, 96, 130, 166, 212, 274, 318]

TEAM_ALIASES = {'JAC': 'JAX'}

BYE = {
    'ARI': 14, 'ATL': 11, 'BAL': 13, 'BUF': 7, 'CAR': 5, 'CHI': 10, 'CIN': 6,
    'CLE': 11, 'DAL': 14, 'DEN': 10, 'DET': 6, 'GB': 11, 'HOU': 8, 'IND': 13,
    'JAX': 7, 'KC': 5, 'LAR': 11, 'LAC': 7, 'LV': 13, 'MIA': 6, 'MIN': 6,
    'NE': 11, 'NO': 8, 'NYG': 8, 'NYJ': 13, 'PHI': 10, 'PIT': 9, 'SF': 8,
    'SEA': 11, 'TB': 10, 'TEN': 9, 'WAS': 7, 'FA': None,
}

# New players not in the previous raw file.
NEW_PLAYER_META = {
    ('ben sinnott', 'WAS'): ('Ben Sinnott', 'TE'),
    ('cyrus allen', 'KC'): ('Cyrus Allen', 'WR'),
    ('dallas cowboys', 'DAL'): ('Dallas Cowboys', 'DST'),
    ('deion burks', 'IND'): ('Deion Burks', 'WR'),
    ('erick all jr.', 'CIN'): ('Erick All Jr.', 'TE'),
    ('jake elliott', 'PHI'): ('Jake Elliott', 'K'),
    ('new york giants', 'NYG'): ('New York Giants', 'DST'),
    ('tommy tremble', 'CAR'): ('Tommy Tremble', 'TE'),
    ('zane gonzalez', 'MIA'): ('Zane Gonzalez', 'K'),
}

USER_LIST = '''
Jahmyr Gibbs (DET)
Bijan Robinson (ATL)
Ja'Marr Chase (CIN)
Puka Nacua (LAR)
Jaxon Smith-Njigba (SEA)
Amon-Ra St. Brown (DET)
Christian McCaffrey (SF)
Jonathan Taylor (IND)
CeeDee Lamb (DAL)
Justin Jefferson (MIN)
James Cook III (BUF)
Ashton Jeanty (LV)
Drake London (ATL)
Saquon Barkley (PHI)
A.J. Brown (NE)
Brock Bowers (LV)
Chase Brown (CIN)
Omarion Hampton (LAC)
De'Von Achane (MIA)
Nico Collins (HOU)
Derrick Henry (BAL)
George Pickens (DAL)
Kenneth Walker III (KC)
Trey McBride (ARI)
Rashee Rice (KC)
Chris Olave (NO)
Josh Allen (BUF)
DeVonta Smith (PHI)
Zay Flowers (BAL)
Kyren Williams (LAR)
Tee Higgins (CIN)
Tetairoa McMillan (CAR)
Jeremiyah Love (ARI)
Lamar Jackson (BAL)
Josh Jacobs (GB)
Breece Hall (NYJ)
Malik Nabers (NYG)
Emeka Egbuka (TB)
Garrett Wilson (NYJ)
Colston Loveland (CHI)
Javonte Williams (DAL)
Ladd McConkey (LAC)
Drake Maye (NE)
Jaylen Waddle (DEN)
Terry McLaurin (WAS)
Travis Etienne Jr. (NO)
Davante Adams (LAR)
Joe Burrow (CIN)
Cam Skattebo (NYG)
Luther Burden III (CHI)
Mike Evans (SF)
Quinshon Judkins (CLE)
Tyler Warren (IND)
Jayden Daniels (WAS)
Jameson Williams (DET)
D'Andre Swift (CHI)
Bucky Irving (TB)
Christian Watson (GB)
David Montgomery (HOU)
TreVeyon Henderson (NE)
DJ Moore (BUF)
Rome Odunze (CHI)
Jalen Hurts (PHI)
Bhayshul Tuten (JAC)
Jadarian Price (SEA)
Tucker Kraft (GB)
Caleb Williams (CHI)
Justin Herbert (LAC)
Carnell Tate (TEN)
Jaylen Warren (PIT)
Marvin Harrison Jr. (ARI)
Trevor Lawrence (JAC)
Tony Pollard (TEN)
Brian Thomas Jr. (JAC)
DK Metcalf (PIT)
Rhamondre Stevenson (NE)
Harold Fannin Jr. (CLE)
Alec Pierce (IND)
Dak Prescott (DAL)
Parker Washington (JAC)
Sam LaPorta (DET)
Chuba Hubbard (CAR)
Kyle Pitts Sr. (ATL)
Courtland Sutton (DEN)
Rico Dowdle (PIT)
Chris Godwin Jr. (TB)
J.K. Dobbins (DEN)
Jordyn Tyson (NO)
Jaxson Dart (NYG)
Brock Purdy (SF)
Michael Pittman Jr. (PIT)
Michael Wilson (ARI)
Quentin Johnston (LAC)
RJ Harvey (DEN)
Blake Corum (LAR)
Kyle Monangai (CHI)
Patrick Mahomes II (KC)
Makai Lemon (PHI)
Bo Nix (DEN)
Josh Downs (IND)
Travis Kelce (KC)
George Kittle (SF)
Jakobi Meyers (JAC)
Matthew Stafford (LAR)
Kenny Gainwell (TB)
Wan'Dale Robinson (TEN)
Jordan Addison (MIN)
Rachaad White (WAS)
Jayden Reed (GB)
Aaron Jones Sr. (MIN)
Jared Goff (DET)
Dalton Kincaid (BUF)
Jonathon Brooks (CAR)
Kyler Murray (MIN)
Jacory Croskey-Merritt (WAS)
Jordan Mason (MIN)
Dallas Goedert (PHI)
Jake Ferguson (DAL)
Baker Mayfield (TB)
Xavier Worthy (KC)
Jordan Love (GB)
Tyler Shough (NO)
Mark Andrews (BAL)
Jayden Higgins (HOU)
Tyrone Tracy Jr. (NYG)
Romeo Doubs (NE)
Khalil Shakir (BUF)
Chris Rodriguez Jr. (JAC)
Jalen Coker (CAR)
KC Concepcion (CLE)
Isaiah Likely (NYG)
Tyler Allgeier (ARI)
Malik Willis (MIA)
Matthew Golden (GB)
Woody Marks (HOU)
Tyjae Spears (TEN)
Rashid Shaheed (SEA)
Alvin Kamara (NO)
C.J. Stroud (HOU)
Dylan Sampson (CLE)
Sam Darnold (SEA)
Juwan Johnson (NO)
Brenton Strange (JAC)
Isiah Pacheco (DET)
Chig Okonkwo (WAS)
Hunter Henry (NE)
Zach Charbonnet (SEA)
Tank Bigsby (PHI)
Brian Robinson Jr. (ATL)
Oronde Gadsden II (LAC)
Keaton Mitchell (LAC)
Cam Ward (TEN)
Jauan Jennings (MIN)
Daniel Jones (IND)
Adonai Mitchell (NYJ)
Bryce Young (CAR)
Jonah Coleman (DEN)
Jerry Jeudy (CLE)
Dalton Schultz (HOU)
Jalen McMillan (TB)
Tre Tucker (LV)
Omar Cooper Jr. (NYJ)
De'Zhaun Stribling (SF)
T.J. Hockenson (MIN)
AJ Barner (SEA)
Ryan Flournoy (DAL)
Denzel Boston (CLE)
Tre' Harris (LAC)
Deebo Samuel Sr. (SF)
Jacoby Brissett (ARI)
Travis Hunter (JAC)
Braelon Allen (NYJ)
Sean Tucker (TB)
Houston Texans (HOU)
James Conner (ARI)
Kayshon Boutte (NE)
Kenyon Sadiq (NYJ)
Denver Broncos (DEN)
Ray Davis (BUF)
Seattle Seahawks (SEA)
Calvin Ridley (TEN)
Jalen Nailor (LV)
Los Angeles Rams (LAR)
Kimani Vidal (LAC)
Philadelphia Eagles (PHI)
Terrance Ferguson (LAR)
Jacksonville Jaguars (JAC)
Dontayvion Wicks (PHI)
Emanuel Wilson (SEA)
Malik Washington (MIA)
Darnell Mooney (NYG)
MarShawn Lloyd (GB)
Emmett Johnson (KC)
Isaac TeSlaa (DET)
New England Patriots (NE)
Ted Hurst III (TB)
Pittsburgh Steelers (PIT)
Pat Freiermuth (PIT)
Geno Smith (NYJ)
Gunnar Helm (TEN)
Rashod Bateman (BAL)
Los Angeles Chargers (LAC)
Minnesota Vikings (MIN)
Brandon Aubrey (DAL)
Troy Franklin (DEN)
Pat Bryant (DEN)
Jaylin Noel (HOU)
Cade Otton (TB)
Ka'imi Fairbairn (HOU)
Baltimore Ravens (BAL)
Cameron Dicker (LAC)
Aaron Rodgers (PIT)
Nicholas Singleton (TEN)
Stefon Diggs (FA)
Kansas City Chiefs (KC)
Cam Little (JAC)
Jason Myers (SEA)
Green Bay Packers (GB)
Tank Dell (HOU)
Eddy Pineiro (SF)
Detroit Lions (DET)
Tyler Loop (BAL)
Antonio Williams (WAS)
Kaytron Allen (WAS)
Jaydon Blue (DAL)
Buffalo Bills (BUF)
Jake Bates (DET)
Mike Washington Jr. (LV)
Evan McPherson (CIN)
Cooper Kupp (SEA)
Oscar Delp (NO)
Jaylen Wright (MIA)
Cairo Santos (CHI)
David Njoku (LAC)
Andy Borregales (NE)
Ollie Gordon II (MIA)
Chimere Dike (TEN)
Chase McLaughlin (TB)
Colby Parkinson (LAR)
Harrison Mevis (LAR)
Keon Coleman (BUF)
Tua Tagovailoa (ATL)
Evan Engram (DEN)
Fernando Mendoza (LV)
Cleveland Browns (CLE)
George Holani (SEA)
Zachariah Branch (ATL)
Chris Boswell (PIT)
Harrison Butker (KC)
Jack Bech (LV)
Elic Ayomanor (TEN)
Justice Hill (BAL)
Germie Bernard (PIT)
Tory Horton (SEA)
Wil Lutz (DEN)
Isaiah Davis (NYJ)
DJ Giddens (IND)
Jordan James (SF)
Tyquan Thornton (KC)
Eli Stowers (PHI)
Demond Claiborne (MIN)
Christian Kirk (SF)
Chris Brooks (GB)
Samaje Perine (CIN)
Atlanta Falcons (ATL)
Malik Davis (DAL)
Elijah Sarratt (BAL)
Michael Penix Jr. (ATL)
Kirk Cousins (LV)
LeQuint Allen Jr. (JAC)
Malachi Fields (NYG)
Darius Slayton (NYG)
Trey Benson (ARI)
Ty Johnson (BUF)
Chris Bell (MIA)
Deshaun Watson (CLE)
Greg Dulcich (MIA)
Devaughn Vele (NO)
Xavier Legette (CAR)
Shedeur Sanders (CLE)
Devin Neal (NO)
Brandon Aiyuk (SF)
Will Reichard (MIN)
Kaelon Black (SF)
San Francisco 49ers (SF)
Marvin Mims Jr. (DEN)
Mason Taylor (NYJ)
Kaleb Johnson (PIT)
Hollywood Brown (PHI)
Emari Demercado (KC)
Theo Johnson (NYG)
Kendre Miller (NO)
Keenan Allen (LAC)
Devin Singletary (NYG)
Jerome Ford (WAS)
Brashard Smith (KC)
Mack Hollins (NE)
Najee Harris (LAC)
Kyle Williams (NE)
Adam Randall (BAL)
Tyreek Hill (FA)
Trevor Etienne (CAR)
Tahj Brooks (CIN)
Mike Gesicki (CIN)
Isaiah Bond (CLE)
New Orleans Saints (NO)
Seth McGowan (IND)
Skyler Bell (BUF)
Isaac Guerendo (SF)
Jarquez Hunter (LAR)
Charlie Smyth (NO)
Ja'Kobi Lane (BAL)
Jaleel McLaughlin (DEN)
Indianapolis Colts (IND)
Chris Brazzell II (CAR)
Chicago Bears (CHI)
Audric Estime (NO)
Jake Tonges (SF)
Will Shipley (PHI)
Kareem Hunt (FA)
Joe Mixon (FA)
Darnell Washington (PIT)
Andrei Iosivas (CIN)
J.J. McCarthy (MIN)
Cedric Tillman (CLE)
Caleb Douglas (MIA)
Konata Mumpfield (LAR)
Tez Johnson (TB)
Luke McCaffrey (WAS)
Jalen Royals (KC)
Calvin Austin III (NYG)
Jahan Dotson (ATL)
Jalen Tolbert (MIA)
Carolina Panthers (CAR)
Bam Knight (ARI)
Max Klare (LAR)
Elijah Arroyo (SEA)
Mac Jones (SF)
Jake Elliott (PHI)
Noah Gray (KC)
Cole Kmet (CHI)
Tyler Higbee (LAR)
Olamide Zaccheaus (ATL)
Ja'Tavion Sanders (CAR)
DeMario Douglas (NE)
Joshua Palmer (BUF)
Carson Beck (ARI)
Michael Mayer (LV)
Justin Fields (KC)
Cyrus Allen (KC)
Treylon Burks (WAS)
Dawson Knox (BUF)
Eli Heidenreich (PIT)
Dont'e Thornton Jr. (LV)
Kendrick Bourne (ARI)
Anthony Richardson Sr. (IND)
Erick All Jr. (CIN)
Bryce Lance (NO)
Michael Carter (TEN)
J'Mari Taylor (JAC)
Raheim Sanders (CLE)
Ty Simpson (LAR)
Brenen Thompson (LAC)
Xavier Hutchinson (HOU)
Jawhar Jordan (HOU)
John Metchie III (CAR)
Nick Chubb (FA)
Eli Raridon (NE)
Noah Fant (NO)
Jaylin Lane (WAS)
Justin Joly (DEN)
Luke Musgrave (GB)
Dallas Cowboys (DAL)
Tyler Bass (BUF)
Kalif Raymond (CHI)
Deion Burks (IND)
KaVontae Turpin (DAL)
New York Giants (NYG)
Tommy Tremble (CAR)
Austin Ekeler (FA)
Ben Sinnott (WAS)
Zane Gonzalez (MIA)
'''.strip().splitlines()

ADP_VALUES = '''
2 1 3 4 6 8 5 7 12 11 9 10 17 14 23 20 15 16 13 24 21 26 19 18 30 29 22 33 40 28 37 38 25 35 27 32 34 41 42 43 31 45 52 48 55 39 58 50 36 47 61 46 54 60 59 56 44 66 51 49 53 64 63 57 62 68 76 79 69 67 78 82 80 71 84 73 65 83 81 87 75 74 70 90 77 91 92 86 88 99 103 89 106 72 93 85 97 94 102 119 98 96 111 105 104 117 109 110 116 112 114 101 95 125 108 113 118 107 131 123 127 139 115 156 136 132 151 153 160 137 100 134 130 143 141 155 145 147 154 170 144 146 138 158 142 133 124 181 135 128 175 163 165 176 227 164 148 203 174 179 229 171 196 172 177 262 169 233 167 220 173 208 226 120 178 207 150 129 236 126 223 184 121 232 140 185 192 296 255 254 252 256 180 187 162 283 197 198 250 211 281 206 183 122 272 274 273 215 152 191 149 190 186 157 214 168 159 210 231 199 209 200 216 228 246 217 193 182 230 277 N/A 240 225 161 194 326 289 224 261 189 301 244 286 166 238 257 234 212 205 303 314 248 271 294 219 333 329 269 N/A 235 241 291 331 320 245 N/A 297 247 258 287 243 N/A 263 267 293 268 222 299 N/A 249 324 213 221 264 202 279 288 265 N/A 334 242 275 276 285 332 280 N/A 317 284 335 188 N/A N/A 282 N/A 310 336 312 N/A 300 323 239 N/A 292 315 204 295 260 N/A 302 311 278 N/A 266 N/A 298 N/A N/A N/A N/A N/A 304 270 306 N/A 307 N/A N/A 218 N/A N/A N/A N/A N/A N/A N/A 259 N/A N/A 316 N/A N/A N/A N/A N/A N/A N/A N/A N/A N/A N/A 313 322 N/A N/A N/A N/A N/A N/A N/A N/A N/A 195 253 N/A N/A N/A 201 N/A 251 N/A N/A
'''.split()


def norm_name(name: str) -> str:
    return re.sub(r'\s+', ' ', name.strip().lower())


def canon_team(team: str) -> str:
    team = team.upper()
    return TEAM_ALIASES.get(team, team)


def parse_user_line(line: str) -> tuple[str, str]:
    m = re.match(r'^(.+?)\s*\(([A-Za-z]{2,3})\)\s*$', line.strip())
    if not m:
        raise ValueError(f'Bad line: {line!r}')
    return m.group(1).strip(), canon_team(m.group(2))


def load_existing_meta() -> dict[tuple[str, str], dict]:
    meta = {}
    for line in RAW_FILE.read_text(encoding='utf-8').splitlines():
        s = line.strip()
        if not s or s.startswith('#'):
            continue
        parts = [p.strip() for p in s.split('|')]
        m = re.match(r'^(.*?)\s*\(([A-Za-z]{2,3})\)$', parts[1])
        name, team = m.group(1).strip(), canon_team(m.group(2))
        pos_match = re.match(r'^([A-Za-z]+)', parts[2])
        entry = {
            'name': name,
            'team': team,
            'position': pos_match.group(1).upper(),
        }
        meta[(norm_name(name), team)] = entry
        # Also index by name alone so team moves (e.g. FA -> SF) keep position data.
        meta.setdefault((norm_name(name), '*'), entry)
    return meta


def tier_for_rank(rank: int) -> int:
    tier = 1
    for idx, start in enumerate(TIER_STARTS):
        if rank >= start:
            tier = idx + 1
    return tier


def format_diff(ecr: int, adp_raw: str) -> str:
    adp_raw = adp_raw.strip()
    if adp_raw.upper() in ('N/A', ''):
        return ''
    adp = int(float(adp_raw))
    diff = adp - ecr
    return '0' if diff == 0 else f'{diff:+d}'


def main() -> None:
    existing = load_existing_meta()
    players = [parse_user_line(line) for line in USER_LIST if line.strip()]
    adps = ADP_VALUES

    if len(players) != len(adps):
        raise SystemExit(f'Count mismatch: {len(players)} players vs {len(adps)} ADPs')

    pos_counts: dict[str, int] = {}
    lines: list[str] = [
        '# Fantasy Football 2026 default draft board.',
        '# Scoring: Half PPR — ECR and ADP columns use half-PPR consensus (more formats later).',
        '# Format:  rank | Player Name (TEAM) | POSITION+RANK | BYE | ECR_VS_ADP',
        '# Tier boundaries are marked with "# Tier N". Blank ECR_VS_ADP means "no ADP data".',
        '# Edit this file and re-run `node scripts/generatePlayerDatabase.js` to regenerate the database.',
        '',
    ]
    current_tier = None

    for rank, ((raw_name, team), adp_raw) in enumerate(zip(players, adps), start=1):
        key = (norm_name(raw_name), team)
        if key in NEW_PLAYER_META:
            display_name, position = NEW_PLAYER_META[key]
        elif key in existing:
            display_name = existing[key]['name']
            position = existing[key]['position']
        elif (norm_name(raw_name), '*') in existing:
            prior = existing[(norm_name(raw_name), '*')]
            display_name = raw_name
            position = prior['position']
        else:
            # Fall back to user-provided name; infer position from partial matches.
            display_name = raw_name
            position = existing.get((norm_name(raw_name), team), {}).get('position')
            if not position:
                raise SystemExit(f'Missing metadata for {raw_name} ({team}) at rank {rank}')

        pos_counts[position] = pos_counts.get(position, 0) + 1
        pos_rank = f'{position}{pos_counts[position]}'
        bye = BYE.get(team)
        bye_str = '' if bye is None else str(bye)
        diff = format_diff(rank, adp_raw)

        tier = tier_for_rank(rank)
        if tier != current_tier:
            lines.extend(['', f'# Tier {tier}', ''])
            current_tier = tier

        diff_part = f' | {diff}' if diff != '' else ' | '
        lines.append(
            f'{rank} | {display_name} ({team}) | {pos_rank} | {bye_str}{diff_part}'
        )

    RAW_FILE.write_text('\n'.join(lines).rstrip() + '\n', encoding='utf-8')
    print(f'Wrote {len(players)} players to {RAW_FILE}')


if __name__ == '__main__':
    main()
