#!/usr/bin/env python3
"""meta.jsonl -> data/turkce_senaryo_arsivi.sqlite (+ eserler.csv)
Telif kuralı (FSEK md.27): eser sahibinin ölümünden itibaren 70 yıl, ölümü izleyen
yılın başından sayılır. 2026 itibarıyla ölüm yılı <= 1955 olan yazarların eserleri kamu malı.
Tam metin YALNIZCA kamu malı / açık lisanslı ve serbest erişimli kayıtlar için indirilir;
telifli ya da ödünç (lending) kayıtlar için sadece künye + bağlantı tutulur."""
import json, re, html, sqlite3, csv, pathlib, sys, time, datetime, urllib.parse, urllib.request
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from textnorm import norm
ROOT = pathlib.Path(__file__).resolve().parent.parent
D = ROOT / "data"; TXT = D / "metinler"; TXT.mkdir(exist_ok=True)
YEAR = datetime.date.today().year
PD_CUTOFF = YEAR - 71                     # 2026 -> 1955

# Kaynak metadatasında ölüm yılı olmayan yazarlar için elle doğrulanmış bilgiler
AUTHORS = {  # anahtar: norm(alt dize) -> (görünen ad, ölüm yılı, not)
 "namik kemal": ("Namık Kemal", 1888, None), "namk kemal": ("Namık Kemal", 1888, None), "nmk kem": ("Namık Kemal", 1888, None),
 "abdulhak hamit": ("Abdülhak Hâmit Tarhan", 1937, None), "ali bey": ("Manastırlı Âli Bey", 1899, None),
 "ahmet vefik": ("Ahmet Vefik Paşa (çev./uyarlama)", 1891, "Molière uyarlaması"), "moliere": ("Molière", 1673, None),
 "kasab, teodor": ("Teodor Kasap", 1905, None), "schiller": ("Friedrich Schiller", 1805, None),
 "guntekin": ("Reşat Nuri Güntekin", 1956, "1 Ocak 2027'de kamu malı olur"),
 "resat-nuri": ("Reşat Nuri Güntekin", 1956, "1 Ocak 2027'de kamu malı olur"),
 "yilmaz-guney": ("Yılmaz Güney", 1984, None), "taner, haldun": ("Haldun Taner", 1986, None),
 "ortac, yusuf ziya": ("Yusuf Ziya Ortaç", 1967, None), "siyavusgil": ("Sabri Esat Siyavuşgil", 1968, None),
 "metin and": ("Metin And", 2008, None), "namkkemal": ("Namık Kemal", 1888, None), "marivaux": ("Pierre de Marivaux (çeviri)", "CEVIRI", "modern Türkçe çeviri: çevirmenin telif hakkı ayrıca korunur"),
 "aristophanes": ("Aristophanes (çeviri)", "CEVIRI", "modern Türkçe çeviri: çevirmenin telif hakkı ayrıca korunur"),
 "gurpinar": ("Hüseyin Rahmi Gürpınar", 1944, None), "gurpnar": ("Hüseyin Rahmi Gürpınar", 1944, None),
 "yesari": ("Mahmut Yesari", 1945, None), "atalay, besim": ("Besim Atalay", 1965, None),
 "sedes": ("Selami İzzet Sedes", 1964, None), "arseven": ("Celal Esat Arseven", 1972, None),
 "ozansoy": ("Faik Ali Ozansoy", 1950, None), "bolayr": ("Ali Ekrem Bolayır", 1937, None),
 "ebuzziya": ("Ebüzziya Tevfik", 1913, None), "hikmet, said": ("Said Hikmet", 1930, None),
 "sahabeddin": ("Şahabeddin Süleyman", 1921, None), "mehmed rifat": ("Mehmed Rifat", 1907, None),
 "kemal kucuk": ("M. Kemal Küçük", None, "yükleyen CC0 beyan etmiş; yazarın ölüm tarihi doğrulanamadı"),
 "haddad": ("Necib Haddad", 1899, None),
 "ibnurrefik": ("İbnürrefik Ahmet Nuri Sekizinci", 1935, None),
 "recaizade": ("Recaizade Mahmut Ekrem", 1914, "1997 MEB baskısı (çeviriyazı: İsmail Parlatır vd.); dipnot/giriş metinleri yayınevine ait olabilir"),
 "sevilen": ("Muhittin Sevilen", 1960, None), "cevdet kudret": ("Cevdet Kudret", 1992, "Karagöz fasıllarının derlemesi (3 cilt)"), "addd, najb": ("Necib Haddad (çev.)", 1899, None),
}

def author_info(m):
    blob = norm(" ".join(str(m.get(k) or "") for k in ("creator", "title", "identifier")))
    for k, v in AUTHORS.items():
        if k in blob: return v
    cr = m.get("creator"); cr = cr if isinstance(cr, list) else [cr] if cr else []
    deaths = []
    for c in cr:
        mm = re.search(r"(\d{4})\??\s*-\s*(\d{4})", str(c)) or re.search(r"d\.\s*(\d{4})()", str(c))
        if mm: deaths.append(int(mm.group(2) or mm.group(1)))
    name = re.sub(r"^\d+\s+", "", str(cr[0])) if cr else None
    return (name, max(deaths) if deaths else None, None)

def pub_year(m):
    y = re.search(r"\d{4}", str(m.get("date") or m.get("year") or ""))
    if not y: return None, None
    y = int(y.group()); 
    if y < 1400: return y, "hicri/rumi takvim (~" + str(y + 583) + ")"   # Osmanlı baskı tarihleri
    return y, None

def copyright_status(m, death, py, restricted):
    lic = m.get("licenseurl") or ""
    if death == "CEVIRI":
        return "telifli", "özgün eser kamu malı ama Türkçe çeviri yeni; çevirmen hakları sürüyor"
    if restricted:
        return "telifli", "Internet Archive'da yalnızca ödünç (Controlled Digital Lending) erişimli; telifli baskı"
    gy = (py + 583) if py and py < 1400 else py
    if death is not None and death <= PD_CUTOFF:
        return "kamu_mali", f"yazar {death} yılında öldü (ölüm+70 yıl doldu)"
    if death is None and gy and gy <= 1900:
        return "kamu_mali", f"yazarın ölüm tarihi bilinmiyor; eser ~{gy} yılında basılmış (130+ yıl), yazarın 1955 öncesi öldüğü varsayıldı"
    if death is None and gy and gy <= 1928:
        return "kamu_mali_olasi", f"yazarın ölüm tarihi doğrulanamadı; eser ~{gy} basımı (ABD'de kamu malı; Türkiye'de büyük olasılıkla kamu malı)"
    if death is None and "publicdomain" in lic:
        return "acik_lisans_beyan", "yükleyen kamu malı/CC0 beyan etmiş, doğrulanmadı"
    if death is None and "creativecommons" in lic and "publicdomain" not in lic:
        return "acik_lisans", lic
    if death is not None:
        return "telifli", f"yazar {death} yılında öldü; koruma {death+70} sonuna kadar sürer"
    return "belirsiz", "yazar/tarih bilgisi yetersiz"

MIN_QUAL = 70
VOCAB = set((D / "tr_sozluk.txt").read_text(encoding="utf-8").split())
def turkish_quality(t):
    """3+ harfli sözcüklerin yüzde kaçı Türkçe Vikikaynak sözlüğünde var (0-100)."""
    toks = [w for w in re.findall(r"[a-zçğıöşüâîû]+", t.replace("I","ı").replace("İ","i").lower()) if len(w) >= 3]
    if not toks: return 0.0
    return round(100 * sum(1 for x in toks if x in VOCAB) / len(toks), 1)

def fetch_text(idf, fname):
    url = f"https://archive.org/stream/{idf}/{urllib.parse.quote(fname)}"
    for a in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "TurkceSenaryoArsivi/0.1"})
            s = urllib.request.urlopen(req, timeout=90).read().decode("utf-8", "replace")
            m = re.search(r"<pre[^>]*>(.*?)</pre>", s, re.S)
            return html.unescape(m.group(1)) if m else ""
        except Exception as e:
            time.sleep(4 * (a + 1))
    return None

GENRES = {json.loads(l)["identifier"]: json.loads(l).get("_genre") for l in open(D/"curated.jsonl", encoding="utf-8")}
# Elle verilen tür / not düzeltmeleri
OVERRIDE = {
 "aetersenaryo": ("senaryo", "Aeterverse kısa film senaryosu (amatör, CC BY-NC-ND 4.0)"),
 "nizam-cemberli-kimdir-senaryo": ("senaryo", "Amatör senaryo (2024)"),
 "scribd.vdownloaders.com_26-sahne-bk-eve-do-nu-s-senaryo": ("senaryo", "'Eve Dönüş' 26 sahnelik senaryo; Scribd'den yeniden yüklenmiş, hak durumu belirsiz"),
 "yilmaz-guney-umut": ("senaryo", "Yılmaz Güney – Umut (kitap; senaryo/öykü). Telifli"),
 "citcit-ile-babisko-romantik-komedi": ("cizgi_roman", "Çizgi roman/mizah albümü; oyun metni değil"),
 "ESKBBRKARAGAZFASLALDLLDYADAKARAGAZRNPEHLVANLlGI.Dr.METINAND": ("karagoz", "Metin And makalesi; eski bir Karagöz faslının metnini içerir"),
 "KaragozSabriEsatSiyavusgil": ("karagoz", "Siyavuşgil'in Karagöz incelemesi; fasıl metinleri içerir"),
 "sabri-esat-siyavusgil-karagoz": ("karagoz", "Siyavuşgil'in Karagöz incelemesi; fasıl metinleri içerir"),
 "2016.03.14Ske-HerodotCevdet-Dzeltilmi": ("skec", "Okul skeçi metni (Herodot Cevdet)"),
 "resat-nuri-guntekin-aksam-gunesi": ("oyun", "Reşat Nuri'nin birden fazla eseri (Akşam Güneşi vb.) içeren derleme"),
 "aksamgunesi0001gu": ("oyun", "Akşam Güneşi (1926 baskı)"),
}

def main():
    db = sqlite3.connect(D / "turkce_senaryo_arsivi.sqlite")
    db.executescript(open(ROOT / "schema.sql", encoding="utf-8").read())
    for f in TXT.glob("*.txt"): f.unlink()
    rows = []
    for l in open(D / "meta.jsonl", encoding="utf-8"):
        r = json.loads(l); m = r.get("metadata", {}); idf = r["identifier"]
        files = r.get("files", [])
        restricted = str(m.get("access-restricted-item")).lower() == "true" or "inlibrary" in str(m.get("collection"))
        name, death, anote = author_info(m)
        py, pnote = pub_year(m)
        status, why = copyright_status(m, death, py, restricted)
        genre, note = OVERRIDE.get(idf, (GENRES.get(idf) or "oyun", None))
        txts = [f["name"] for f in files if f["name"].endswith("_djvu.txt")]
        pdfs = [f["name"] for f in files if f["name"].lower().endswith(".pdf")]
        lang = m.get("language"); lang = ",".join(lang) if isinstance(lang, list) else (lang or "")
        coll = m.get("collection"); coll = ",".join(coll) if isinstance(coll, list) else (coll or "")
        title = m.get("title"); title = title[0] if isinstance(title, list) else title
        text, qual, tpath = None, None, None
        can_text = status in ("kamu_mali", "kamu_mali_olasi", "acik_lisans", "acik_lisans_beyan") and not restricted and genre != "cizgi_roman"
        if can_text and not txts:
            txts = [f["name"] for f in files if f["name"].endswith(".txt") and not f["name"].endswith(("_meta.txt", "_files.txt"))]
        if can_text and txts:
            parts = []
            for fn in txts[:40]:
                t = fetch_text(idf, fn)
                if t: parts.append(t)
            text = "\n\n".join(parts) if parts else None
            if text:
                qual = turkish_quality(text)
            if text and qual < MIN_QUAL:
                text = None                      # okunaksız OCR: saklamıyoruz, PDF bağlantısı kalır
            if text:
                tpath = f"data/metinler/{idf}.txt"
                (ROOT / tpath).write_text(text, encoding="utf-8")
        script = "arap" if re.search(r"\bota\b", lang) and not re.search(r"\btur\b", lang) else "latin"
        if qual is not None and qual < MIN_QUAL: script_note = "OCR okunaksız (büyük olasılıkla Arap harfli Osmanlıca baskı) – PDF/sayfa görüntüsünü kullanın"
        else: script_note = None
        row = dict(ia_identifier=idf, baslik=title, yazar=name, yazar_olum_yili=death, tur=genre,
                   yayin_yili=py, yayin_tarihi_notu=pnote, dil=lang, yazi=script, koleksiyon=coll,
                   erisim="odunc_kisitli" if restricted else "serbest", lisans=m.get("licenseurl") or "",
                   telif_durumu=status, telif_gerekce=why, kaynak="Internet Archive",
                   kaynak_url=f"https://archive.org/details/{idf}",
                   pdf_url=(f"https://archive.org/download/{idf}/{urllib.parse.quote(pdfs[0])}" if pdfs and not restricted else None),
                   metin_dosyasi=tpath, metin_karakter=len(text) if text else None, ocr_kalite=qual,
                   notlar="; ".join(x for x in (note, anote, script_note) if x) or None)
        rows.append(row)
        cols = list(row)
        db.execute(f"INSERT OR REPLACE INTO eserler ({','.join(cols)}) VALUES ({','.join('?'*len(cols))})", [row[c] for c in cols])
        if text:
            eid = db.execute("SELECT id FROM eserler WHERE ia_identifier=?", (idf,)).fetchone()[0]
            db.execute("INSERT OR REPLACE INTO metinler (eser_id, metin) VALUES (?,?)", (eid, text))
        print(f"{status:18s} {genre:8s} {qual!s:6s} {idf[:50]}", file=sys.stderr)
    db.execute("INSERT INTO metinler_fts(metinler_fts) VALUES('rebuild')")
    db.commit()
    with open(D / "eserler.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
    print(len(rows), "kayıt", file=sys.stderr)

main()
