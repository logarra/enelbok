#!/usr/bin/env python3
"""Otomatik + bilinen-başlık adaylarını birleştirir, elle ayıklama listesini uygular.
Çıktı: data/curated.jsonl"""
import json, re, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from textnorm import norm
D = pathlib.Path(__file__).resolve().parent.parent / "data"

# Toronto/Duke/McGill taramasında elle bulunan, başlıkta anahtar kelime olmayan oyunlar
MANUAL_ADD = {
 "elmelikelnrsulna00addd": "oyun", "gaspvenedametyin1201ba": "oyun", "perihansultan00mazluoft": "oyun",
 "jntrkperde00rusn": "oyun", "yadigarharbmanaz00abduoft": "oyun", "geveze-berber": "oyun",
 "yorgakidandn00moli": "oyun", "zorakitabip00moli": "oyun", "giyumtelguillaum00schi": "oyun",
 "ibnimsabd00abduoft": "oyun", "srdnplabd00abduoft": "oyun", "tezerabd00abduoft": "oyun",
 "aksamgunesi0001gu": "oyun", "hazanblbl00gruoft": "oyun", "kemal-kucuk-cinar": "oyun",
 "celaleddinharze00namk": "oyun",
 "ibnurrefik-ahmet-nuri-sekizinci-ceza-kanunu": "oyun",
 "recaizade-mahmut-ekrem-butun-eserleri-iii-meb-yayinlari": "oyun",
 "Karagoz-MuhittinSevilen": "karagoz", "cevdet-kudret-karagoz-cilt-i-bilgi-yayinevi": "karagoz",
}
# Gürültü: tiyatro/senaryo kelimesi geçen ama oyun metni olmayan kayıtlar
EXCLUDE_ID = set("""
1985.05.14taihlyilsonupiyesionlarboyleydi 2008.01.11-pdf-yonetmen-ve-senaryo-yazari-hemsehrimiz-c.-cem-erturk-vefat-etti
2008.01.11YnetmenVeSenaryoYazarHemehrimizC.CemErtrkVeftEtti 2008.01.11yonetmenvesenaryoyazarihemsehrimizc.cemerturkvefatetti
kutlu-dog-um-gelenegi-bi-r-senaryo-mu landfillistanbul0000akca putin-rusyaya-ne-birakacak-rusya-icin-dort-senaryo-muhammet-negi-z-tatyana-yurevna-chesnokova
coas.ojer.0502.19403k karagoz-ve-hacivat-ile-girisimcilik-muhammet-negiz_202504 trabzonx seminer-haber-ortahisar-ismetpasa-ilkokulu-ogrencilerine-karagoz-ve-hacivat-ile-
2011.08.21-pdf-karagoz-hacivat-oyununda-izleyenler-doyasiya-guldu 2024.04.02-pdf-mustafa-karagoz-vefat-etti-yukari-barakli
elfasl-ibnhazm-02 erol-mutercimler-ertugrul-faciasi-21.-yuzyila-dogru-turkiye-japonya-iliskisi-alfa-yayinlari
liverpool-faciasi pendik-faciasi copyrightemrearaciandantejulyaugust20131 LLT_1913072901 LLT_1926042101
the-albanian-besa-the-golden-rule belgelerle-tkpml-2-firtinalar-icinde-bicak-sirtinda-cilt-2-umut-yayimcilik-2000-v-2
tony-ceylan-yayinlari-haftalik-mecmua-no-01-uzak-ufuklar-13.02.1962-1 ilahi-komedya-turkce-cevirisi-dante-alighieri-rekin-teksoy
CNSELBBLGLLERLRRENRKENSARDICIMIZKARAGIZKARAGZEVLENYOR19131OYUNU kagthanefacias0000safa karagoz-hacivat-fenomen-macerasi huseyin-rahmi-gurpinar-kokotlar-mektebi
""".split())
EXCLUDE_RX = r"diyanet|vefat|gazete|cumhuriyet,|seminer|girisimcilik|iddianame|dergisi|sayi:|haber"
TURK_KNOWN_ONLY = {"Gave", "Liberte", "Besa", "Umut", "Uzak", "Duvar", "Sürü", "Kurban", "Tohum", "İstiklal", "Atala", "Eyvah", "Çengi", "Zeynep", "Tarik", "İlhan"}

def load(p):
    return [json.loads(l) for l in open(p, encoding="utf-8")] if p.exists() else []

items = {}
for it in load(D/"ia_filtered.jsonl"):
    items[it["identifier"]] = it
for it in load(D/"ia_known_verified.jsonl"):
    ph = it["_known"]["phrase"]
    if ph in TURK_KNOWN_ONLY and not re.search(r"abd00abd|abduoft|namk|guney", it["identifier"]):
        continue
    items.setdefault(it["identifier"], it)
    items[it["identifier"]].setdefault("_genre", "senaryo" if it["_known"]["author_hint"] in ("Yılmaz Güney",) else "oyun")
cand = {json.loads(l)["identifier"]: json.loads(l) for l in open(D/"ia_candidates.jsonl", encoding="utf-8")}
for idf, g in MANUAL_ADD.items():
    if idf in cand:
        items.setdefault(idf, cand[idf]); items[idf]["_genre"] = items[idf].get("_genre") or g
    elif idf not in items:
        items[idf] = {"identifier": idf, "_genre": g, "_needs_meta": True}

out = []
for idf, it in items.items():
    if idf in EXCLUDE_ID: continue
    if re.search(EXCLUDE_RX, norm(it.get("title"))): continue
    out.append(it)
with open(D/"curated.jsonl", "w", encoding="utf-8") as f:
    for it in out: f.write(json.dumps(it, ensure_ascii=False)+"\n")
print(len(out), file=sys.stderr)
for it in sorted(out, key=lambda x: x["identifier"]):
    print(it.get("_genre"), it["identifier"], "|", str(it.get("title"))[:60], "|", str(it.get("creator"))[:28])
