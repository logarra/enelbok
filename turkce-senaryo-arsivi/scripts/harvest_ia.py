#!/usr/bin/env python3
"""archive.org'dan Türkçe tiyatro oyunu / senaryo / skeç / Karagöz-ortaoyunu
metinlerini bulan aday toplayıcı. Çıktı: data/ia_candidates.jsonl"""
import json, re, sys, time, unicodedata, pathlib
import internetarchive as ia

OUT = pathlib.Path(__file__).resolve().parent.parent / "data" / "ia_candidates.jsonl"
FIELDS = ["identifier", "title", "creator", "date", "year", "language", "subject",
          "collection", "licenseurl", "rights", "description", "publisher"]

LANG = 'language:(tur OR turkish OR "Turkish" OR ota OR "Ottoman Turkish" OR türkçe OR turkce)'
KW_TITLE = ("piyes OR piyesi OR perde OR perdelik OR komedi OR komedya OR dram OR drām OR "
            "facia OR faciası OR trajedi OR tragedya OR vodvil OR operet OR tiyatro OR temsil OR "
            "oyun OR oyunu OR oyunlar OR oyunları OR skeç OR skec OR skeçler OR ortaoyunu OR "
            "\"orta oyunu\" OR karagöz OR karagoz OR hacivat OR tuluat OR senaryo OR senaryosu OR "
            "senaryolar OR senaryoları OR fasl OR fasıl OR \"perdelik oyun\" OR monolog")
KW_SUBJ = ('drama OR "Turkish drama" OR plays OR theater OR theatre OR tiyatro OR screenplays OR '
           '"motion picture plays" OR karagöz OR "shadow plays" OR "Turkish farces" OR senaryo')

PD_AUTHORS = ["Namık Kemal", "Namik Kemal", "Şinasi", "Sinasi", "Ahmet Vefik", "Ahmed Vefik",
    "Abdülhak Hamid", "Abdulhak Hamid", "Abdülhak Hâmid", "Ahmet Mithat", "Ahmed Midhat",
    "Recaizade", "Musahipzade", "Mûsâhipzâde", "İbnürrefik", "Ibnurrefik", "Ahmet Nuri",
    "Mehmet Rauf", "Hüseyin Rahmi", "Huseyin Rahmi", "Mahmut Yesari", "Yesari",
    "Ömer Seyfettin", "Hüseyin Suat", "Şemsettin Sami", "Semsettin Sami", "Ali Bey",
    "Tevfik Fikret", "Ebüzziya", "Muallim Naci", "Kemalpaşazade", "Halit Ziya",
    "Mehmet Rauf", "Celal Sahir", "Süleyman Nazif", "Şahabeddin Süleyman", "Sahabeddin",
    "Hasan Bedrettin", "Ahmet Rasim", "Ahmed Rasim", "Teodor Kasap", "Güllü Agop",
    "Mehmet Şakir", "Ali Haydar", "Feraizcizade", "Ziya Paşa", "Ziya Pasa", "Reşat Nuri",
    "Musahipzade Celal", "Yusuf Ziya", "Halide Edip", "Rıfat Ilgaz", "Rifat Ilgaz",
    "Haldun Taner", "Necip Fazıl", "Turgut Özakman", "Güngör Dilmen", "Aziz Nesin",
    "Cahit Atay", "Orhan Asena", "Recep Bilginer", "Oktay Arayıcı", "Vasıf Öngören",
    "Sermet Çağan", "Melih Cevdet", "Nazım Hikmet", "Nazim Hikmet", "Cevat Fehmi",
    "Ahmet Kutsi Tecer", "Sadık Şendil", "Safa Önal", "Yılmaz Güney", "Atıf Yılmaz",
    "Ertem Eğilmez", "Bülent Oran", "Vedat Türkali", "Lütfi Akad", "Metin Erksan",
    "Halit Refiğ", "Ümit Ünal", "Yavuz Turgul", "Nuri Bilge Ceylan", "Zeki Demirkubuz"]

QUERIES = [
    f"mediatype:texts AND {LANG} AND title:({KW_TITLE})",
    f"mediatype:texts AND {LANG} AND subject:({KW_SUBJ})",
    "mediatype:texts AND collection:dulturk",
    f"mediatype:texts AND collection:toronto AND language:(tur OR ota OR turkish)",
    "mediatype:texts AND title:(piyes OR perdelik OR senaryo OR senaryosu OR skeç OR ortaoyunu OR karagöz OR tuluat OR hacivat)",
    'mediatype:texts AND subject:("Turkish drama" OR "Turkish drama (Comedy)" OR "Turkish drama -- 20th century" OR "Theater -- Turkey" OR "Karagöz" OR "Shadow shows -- Turkey" OR "Motion picture plays, Turkish" OR "Screenplays, Turkish")',
    "mediatype:texts AND description:(senaryo OR \"tiyatro oyunu\" OR piyes OR perdelik OR skeç OR \"film senaryosu\" OR \"dizi senaryosu\")",
    "mediatype:texts AND (hababam OR \"Rıfat Ilgaz\" OR \"Rifat Ilgaz\")",
]
for a in PD_AUTHORS:
    QUERIES.append(f'mediatype:texts AND creator:("{a}")')

def main():
    seen = {}
    for q in QUERIES:
        n = 0
        for attempt in range(4):
            try:
                for it in ia.search_items(q, fields=FIELDS):
                    idf = it["identifier"]
                    if idf not in seen:
                        it["_queries"] = [q[:120]]
                        seen[idf] = it
                    else:
                        seen[idf]["_queries"].append(q[:120])
                    n += 1
                break
            except Exception as e:
                print("retry", attempt, e, file=sys.stderr); time.sleep(5 * (attempt + 1))
        print(f"{n:6d}  {q[:110]}", file=sys.stderr)
    with OUT.open("w", encoding="utf-8") as f:
        for it in seen.values():
            f.write(json.dumps(it, ensure_ascii=False) + "\n")
    print("toplam benzersiz:", len(seen), file=sys.stderr)

if __name__ == "__main__":
    main()
