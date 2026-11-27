# Türkçe Senaryo ve Oyun Arşivi

Açık internet arşivlerinde bulunan Türkçe **tiyatro oyunu, film/dizi senaryosu, skeç ve
Karagöz / ortaoyunu** metinlerinin künye ve tam metin veritabanı.

* `data/turkce_senaryo_arsivi.sqlite`: SQLite veritabanı (`eserler` tablosu, `metinler` tablosu, `metinler_fts` tam metin arama dizini)
* `data/eserler.csv`: aynı künyeler, CSV olarak
* `data/metinler/*.txt`: indirilmiş tam metinler (yalnızca kamu malı veya açık lisanslı olanlar)
* `ESER_LISTESI.md`: tüm kayıtların okunabilir tablosu

## Hızlı kullanım

```bash
pip install internetarchive pyarrow
python3 scripts/sorgula.py liste --metinli          # tam metni olan eserler
python3 scripts/sorgula.py liste --telif kamu_mali  # kamu malı eserler
python3 scripts/sorgula.py ara "silistre"           # metinler içinde arama
python3 scripts/sorgula.py goster geveze-berber      # künye + metnin başı
```

## Veriyi yeniden üretme

```bash
python3 scripts/harvest_ia.py     # archive.org'da ~100 sorgu → data/ia_candidates.jsonl
python3 scripts/classify.py       # tür puanlaması → data/ia_filtered.jsonl
python3 scripts/known_titles.py   # bilinen oyun/senaryo adlarıyla arama
python3 scripts/verify_known.py   # yazar/başlık doğrulaması
python3 scripts/curate.py         # birleştirme + elle ayıklama → data/curated.jsonl
python3 scripts/fetch_meta.py     # her kaydın tam metadatası + dosya listesi
python3 scripts/build_db.py       # telif sınıflandırması, metin indirme, SQLite + CSV
```

Kullanılan açık kaynak araç: [jjjake/internetarchive](https://github.com/jjjake/internetarchive)
(archive.org Python istemcisi). OCR kalite ölçümü için Türkçe sözlük, Hugging Face'teki
[`wikimedia/wikisource`](https://huggingface.co/datasets/wikimedia/wikisource) Türkçe dökümünden
çıkarıldı (`data/tr_sozluk.txt`).

## Taranan kaynaklar ve bulgular

| Kaynak | Sonuç |
|---|---|
| **Internet Archive (archive.org)** | Ana kaynak. ~2.450 aday tarandı, 70 kayıt seçildi. Toronto Üniversitesi (Robarts), Duke Üniversitesi (dulturk) ve Ohio State Osmanlıca koleksiyonları, ayrıca kullanıcı yüklemeleri. |
| **Türkçe Vikikaynak** | Hugging Face dökümü (7.220 sayfa) tarandı. Tiyatro oyunu ya da senaryo yok; çoğu türkü, kanun ve iddianame. |
| **Project Gutenberg** | Türkçe oyun metni yok (erişim de zaman aşımına uğradı). |
| **GitHub** | Türkçe senaryo/oyun veri seti bulunamadı. Çıkan sonuçlar senaryo *yazım editörleri* ve TEKNOFEST NLP projeleri. |

## Telif kuralı (önemli)

Türkiye'de (FSEK md. 27) koruma, eser sahibinin ölümünden sonra **70 yıl** sürer ve ölümü
izleyen yılın başından sayılır. 2026'da **1955 ve öncesinde** ölen yazarların eserleri kamu malıdır.

| `telif_durumu` | Anlamı | Tam metin saklanır mı? |
|---|---|---|
| `kamu_mali` | Yazar ≤1955'te öldü veya eser 1900 öncesi basım | Evet (OCR okunurluğu ≥70 ise) |
| `kamu_mali_olasi` | 1900–1928 basımı, yazarın ölüm yılı doğrulanamadı | Evet (okunur ise) |
| `acik_lisans` | Yükleyen Creative Commons lisansı vermiş | Evet |
| `acik_lisans_beyan` | Yükleyen CC0/kamu malı beyan etmiş, doğrulanmadı | Evet, ama dikkatli kullanın |
| `telifli` | Yazar 1955 sonrası öldü / modern çeviri / ödünç kitap | **Hayır**, yalnızca künye + bağlantı |
| `belirsiz` | Amatör/kaynağı belirsiz yükleme | **Hayır**, yalnızca künye + bağlantı |

Telifli eserlerin tam metni bilinçli olarak indirilmedi. Bu eserler archive.org'da duruyor
olsa da çoğunun izinsiz yüklenmiş olması muhtemel.

**Not:** *Hababam Sınıfı* Reşat Nuri'nin değil, **Rıfat Ilgaz**'ın eseridir (1993'te öldü,
2063 sonuna kadar telifli). archive.org'da Ilgaz'ın oyun ya da senaryo metni bulunamadı.
**Reşat Nuri Güntekin** 1956'da öldüğü için eserleri **1 Ocak 2027'de** kamu malı olur.
Arşivde *Akşam Güneşi* gibi oyunları var ve şu an `telifli` olarak işaretli. O tarihte
`build_db.py` yeniden çalıştırılınca tam metinleri de otomatik indirilir (kesim yılı
tarihe göre hesaplanıyor).

## Bilinen sınırlamalar

* **Arap harfli Osmanlıca baskılar:** Toronto/Duke koleksiyonundaki ~40 kamu malı oyun
  (Namık Kemal *Vatan yahud Silistre*, *Kara Bela*, *Celaleddin Harzemşah*; Abdülhak Hâmit
  *Eşber*, *Finten*, *Tarık*, *İbn-i Musa*, *Sardanapal*; Ebüzziya *Ecel-i Kaza*; Mahmut Yesari
  piyesleri…) archive.org'da Latin alfabesi OCR'ı ile işlendiği için metin dosyaları anlamsız.
  Bu kayıtlar için `pdf_url` (sayfa görüntüleri) veriliyor; metne ihtiyaç olursa Osmanlıca
  OCR (ör. GitHub `Fbilalyy/ottoman_ocr`, `hakantrkgl/ottomantranslate`) ile işlenmeleri gerekir.
* **Film ve dizi senaryoları:** Açık arşivlerde yayımlanmış tam Türk film veya dizi senaryosu
  neredeyse yok. Bulunanlar amatör kısa film senaryoları ve telifli Yılmaz Güney *Umut*.
  Yeşilçam ve dizi senaryoları yapımcıların arşivlerinde duruyor, kamuya açık değil.
* Elle ayıklama listeleri `scripts/curate.py` içindedir. Yanlış eşleşme görürseniz oraya ekleyin.
