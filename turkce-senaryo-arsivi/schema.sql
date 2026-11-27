-- Türkçe Senaryo / Oyun Arşivi şeması
DROP TABLE IF EXISTS metinler_fts;
DROP TABLE IF EXISTS metinler;
DROP TABLE IF EXISTS eserler;
CREATE TABLE eserler (
  id INTEGER PRIMARY KEY,
  ia_identifier TEXT UNIQUE,
  baslik TEXT, yazar TEXT, yazar_olum_yili INTEGER,
  tur TEXT CHECK (tur IN ('oyun','senaryo','skec','karagoz','cizgi_roman')),
  yayin_yili INTEGER, yayin_tarihi_notu TEXT,
  dil TEXT, yazi TEXT, koleksiyon TEXT,
  erisim TEXT,                 -- serbest | odunc_kisitli
  lisans TEXT,
  telif_durumu TEXT,           -- kamu_mali | acik_lisans | acik_lisans_beyan | telifli | belirsiz
  telif_gerekce TEXT,
  kaynak TEXT, kaynak_url TEXT, pdf_url TEXT,
  metin_dosyasi TEXT, metin_karakter INTEGER, ocr_kalite REAL,
  notlar TEXT
);
CREATE TABLE metinler (eser_id INTEGER PRIMARY KEY REFERENCES eserler(id), metin TEXT);
CREATE VIRTUAL TABLE metinler_fts USING fts5(metin, content='metinler', content_rowid='eser_id', tokenize='unicode61 remove_diacritics 2');
