#!/usr/bin/env python3
"""Basit sorgu aracı.
  python3 scripts/sorgula.py liste [--tur oyun] [--telif kamu_mali]
  python3 scripts/sorgula.py ara "silistre"        # tam metin araması (FTS5)
  python3 scripts/sorgula.py goster <ia_identifier> # künye + metnin başı"""
import sqlite3, sys, pathlib, argparse
DB = pathlib.Path(__file__).resolve().parent.parent / "data" / "turkce_senaryo_arsivi.sqlite"
db = sqlite3.connect(DB)
ap = argparse.ArgumentParser(); sub = ap.add_subparsers(dest="cmd", required=True)
l = sub.add_parser("liste"); l.add_argument("--tur"); l.add_argument("--telif"); l.add_argument("--metinli", action="store_true")
a = sub.add_parser("ara"); a.add_argument("sorgu")
g = sub.add_parser("goster"); g.add_argument("idf")
x = ap.parse_args()
if x.cmd == "liste":
    q, p = "SELECT ia_identifier, tur, telif_durumu, yayin_yili, yazar, baslik, metin_dosyasi IS NOT NULL FROM eserler WHERE 1=1", []
    if x.tur: q += " AND tur=?"; p.append(x.tur)
    if x.telif: q += " AND telif_durumu=?"; p.append(x.telif)
    if x.metinli: q += " AND metin_dosyasi IS NOT NULL"
    for r in db.execute(q + " ORDER BY yazar", p):
        print(f"{'📄' if r[6] else '  '} {r[1]:8s} {r[2]:17s} {str(r[3] or ''):5s} {str(r[4] or '')[:28]:28s} {str(r[5])[:60]}  [{r[0]}]")
elif x.cmd == "ara":
    for r in db.execute("""SELECT e.ia_identifier, e.baslik, snippet(metinler_fts,0,'«','»','…',10)
                           FROM metinler_fts JOIN eserler e ON e.id=metinler_fts.rowid
                           WHERE metinler_fts MATCH ? ORDER BY rank LIMIT 20""", (x.sorgu,)):
        print(f"[{r[0]}] {r[1]}\n    {r[2].replace(chr(10),' ')}\n")
else:
    r = db.execute("SELECT * FROM eserler WHERE ia_identifier=?", (x.idf,)).fetchone()
    cols = [c[0] for c in db.execute("SELECT * FROM eserler LIMIT 0").description]
    for c, v in zip(cols, r or []): print(f"{c:18s} {v}")
    t = db.execute("SELECT m.metin FROM metinler m JOIN eserler e ON e.id=m.eser_id WHERE e.ia_identifier=?", (x.idf,)).fetchone()
    if t: print("\n--- metin (ilk 1500 karakter) ---\n" + t[0][:1500])
