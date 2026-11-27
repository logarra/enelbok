#!/usr/bin/env python3
"""Adayları tür (oyun/senaryo/skeç/karagöz) açısından puanlar. data/ia_filtered.jsonl üretir."""
import json, re, sys, unicodedata, pathlib
D = pathlib.Path(__file__).resolve().parent.parent / "data"

def norm(s):
    if isinstance(s, list): s = " ; ".join(map(str, s))
    s = str(s or "").replace("ı", "i").replace("İ", "i")
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[ʻʿʾ'’`]", "", s.lower())
    return s

# (regex, tür, ağırlık)
RULES = [
    (r"\bsenaryo(su|lar|lari|sudur)?\b", "senaryo", 3),
    (r"\bscreenplays?\b|motion picture plays", "senaryo", 3),
    (r"\bpiyes(i|ler)?\b", "oyun", 3),
    (r"\b\d+\s*perde(lik)?\b|\b(bir|iki|uc|dort|bes|alti|yedi)\s*perde(lik)?\b|\bperdelik\b", "oyun", 3),
    (r"\b(bir|iki|uc|dort|bes|alti|\d+)\s*fasl?[ıi]?\b|\bfasl\b", "oyun", 2),
    (r"\bkomed(i|ya|yasi|isi)\b|\bvodvil\b|\boperet\b|\bfars\b", "oyun", 2),
    (r"\bdram\b|\bdrami\b|\bfacia(si)?\b|\bfaci[ae]\b|\btrajedi(si)?\b|\btragedya\b", "oyun", 2),
    (r"\btiyatro(su|lar)?\b|\btemsil\b|\bmonolog\b", "oyun", 1),
    (r"\boyun(u|lar|lari)?\b", "oyun", 1),
    (r"turkish drama|drama|plays\b|\btheat(er|re)\b", "oyun", 1),
    (r"\bskec(ler|leri)?\b|\bsketch", "skec", 3),
    (r"\bkaragoz\b|\bhacivat\b|shadow (plays|shows)", "karagoz", 3),
    (r"\borta ?oyunu\b|\btuluat\b|meddah", "karagoz", 2),
]
NEG = r"soru bankasi|tarih(i)? |history and criticism|criticism|elestiri|incelem|tez\b|thesis|makale|bulten|gazete|dergi|sayi\b|video|izle\b|dvdrip|bolum izle|oyuncak|cd oyun|game|futbol|satranc|cocuk oyunlari|oyun ve oyuncak"
TURK = r"\b(tur|turkish|ota|ottoman|turkce|turk)\b"

def score(it):
    t = norm(it.get("title")); s = norm(it.get("subject")); d = norm(it.get("description"))[:600]
    blob_t = t; blob = f"{t} | {s} | {d}"
    sc = {}; why = []
    for rx, g, w in RULES:
        if re.search(rx, blob_t): sc[g] = sc.get(g, 0) + w*2; why.append(rx[:18])
        elif re.search(rx, s): sc[g] = sc.get(g, 0) + w
        elif re.search(rx, d): sc[g] = sc.get(g, 0) + max(1, w-1)
    neg = bool(re.search(NEG, t + " " + s))
    lang = norm(it.get("language"))
    turkish = bool(re.search(TURK, lang)) or any(c in str(it.get("title")) for c in "ğşıİĞŞ")
    total = sum(sc.values()) - (3 if neg else 0)
    genre = max(sc, key=sc.get) if sc else None
    return total, genre, turkish, neg

def main():
    keep = []
    for line in open(D / "ia_candidates.jsonl", encoding="utf-8"):
        it = json.loads(line)
        total, genre, turkish, neg = score(it)
        if not turkish: continue
        if total >= 4:
            it["_score"], it["_genre"] = total, genre
            keep.append(it)
    keep.sort(key=lambda x: -x["_score"])
    with open(D / "ia_filtered.jsonl", "w", encoding="utf-8") as f:
        for it in keep: f.write(json.dumps(it, ensure_ascii=False) + "\n")
    print("geçen:", len(keep), file=sys.stderr)
    if "-v" in sys.argv:
        for it in keep:
            print(it["_score"], it["_genre"], it["identifier"], "|", str(it.get("title"))[:70], "|", str(it.get("creator"))[:30], "|", it.get("date","")[:4])

main()
