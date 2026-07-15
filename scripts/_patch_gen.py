from pathlib import Path
p = Path("/home/dotagenius/DraftList/scripts/generatePlayerDatabase.js")
text = p.read_text()
text = text.replace(
    "reusing existing player headshots from\n * the previous database whenever a name matches so returning players keep their\n * photos.",
    "loading headshots from scripts/playerPhotoMap.json (normalized name lookup).",
)
if "PHOTO_MAP_FILE" not in text:
    needle = "const DB_FILE = path.join(ROOT, 'src', 'utils', 'playerDatabase.js');"
    repl = needle + "\nconst PHOTO_MAP_FILE = path.join(__dirname, 'playerPhotoMap.json');"
    text = text.replace(needle, repl)
start = text.index("function loadExistingPhotos()")
end = text.index("function slugify", start)
new_block = """function loadPhotoMap() {
    if (!fs.existsSync(PHOTO_MAP_FILE)) return {};
    const raw = JSON.parse(fs.readFileSync(PHOTO_MAP_FILE, 'utf8'));
    const map = {};
    for (const [key, url] of Object.entries(raw)) {
        if (typeof url === 'string' && url) map[normalizeName(key)] = url;
    }
    return map;
}

"""
text = text[:start] + new_block + text[end:]
text = text.replace("function buildRecords(players, existingPhotos)", "function buildRecords(players, photoMap)")
text = text.replace(
    "            const reused = existingPhotos[normalizeName(p.name)];\n            photoExpr = reused ? JSON.stringify(reused) : 'PLACEHOLDER_PHOTO';",
    "            const mapped = photoMap[normalizeName(p.name)];\n            photoExpr = mapped ? JSON.stringify(mapped) : 'PLACEHOLDER_PHOTO';",
)
text = text.replace(
    "    const existingPhotos = loadExistingPhotos();\n    const players = parseRaw(raw);\n    const records = buildRecords(players, existingPhotos);",
    "    const photoMap = loadPhotoMap();\n    const players = parseRaw(raw);\n    const records = buildRecords(players, photoMap);",
)
old_log = """    const reusedCount = records.filter(
        (r) => r.photoExpr !== 'PLACEHOLDER_PHOTO' && r.position !== 'DST'
    ).length;

    console.log('Players written: ' + records.length);
    console.log('Photos reused:   ' + reusedCount);"""
new_log = """    const withPhotoCount = records.filter(
        (r) => r.photoExpr !== 'PLACEHOLDER_PHOTO' && r.position !== 'DST'
    ).length;
    const placeholderCount = records.filter(
        (r) => r.photoExpr === 'PLACEHOLDER_PHOTO' && r.position !== 'DST'
    ).length;

    console.log('Players written: ' + records.length);
    console.log('Photos from map: ' + withPhotoCount);
    console.log('Placeholders:    ' + placeholderCount);"""
text = text.replace(old_log, new_log)
p.write_text(text)
print("OK")
