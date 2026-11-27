#!/usr/bin/env python3
"""Bilinen Türkçe oyun/senaryo adlarını archive.org'da başlık araması ile arar.
Çıktı: data/ia_known_hits.jsonl"""
import json, sys, time, pathlib, internetarchive as ia
D = pathlib.Path(__file__).resolve().parent.parent / "data"
FIELDS = ["identifier","title","creator","date","language","subject","collection","licenseurl","description"]
# (aranacak başlık ifadesi, yazar ipucu)
KNOWN = [
 ("Vatan yahut Silistre","Namık Kemal"),("Vatan yahud Silistre","Namık Kemal"),("Silistre","Namık Kemal"),
 ("Zavallı Çocuk","Namık Kemal"),("Zavalli cocuk","Namık Kemal"),("Akif Bey","Namık Kemal"),
 ("Gülnihal","Namık Kemal"),("Kara Bela","Namık Kemal"),("Celaleddin Harzemşah","Namık Kemal"),("Celaleddin Harzemah","Namık Kemal"),
 ("Şair Evlenmesi","Şinasi"),("Sair evlenmesi","Şinasi"),
 ("Eşber","Abdülhak Hamit"),("Finten","Abdülhak Hamit"),("Tarık yahut Endülüs","Abdülhak Hamit"),("Tarik","Abdülhak Hamit"),
 ("Nesteren","Abdülhak Hamit"),("Duhter-i Hindu","Abdülhak Hamit"),("İçli Kız","Abdülhak Hamit"),("Sabr ü Sebat","Abdülhak Hamit"),
 ("Sardanapal","Abdülhak Hamit"),("İbn-i Musa","Abdülhak Hamit"),("Tezer","Abdülhak Hamit"),("İlhan","Abdülhak Hamit"),
 ("Liberte","Abdülhak Hamit"),("Zeynep","Abdülhak Hamit"),("Macera-yı Aşk","Abdülhak Hamit"),("Yadigar-ı harb","Abdülhak Hamit"),
 ("Eyvah","Ahmet Mithat"),("Çengi","Ahmet Mithat"),("Açıkbaş","Ahmet Mithat"),("Siyavuş","Ahmet Mithat"),("Çerkez Özdenler","Ahmet Mithat"),
 ("Vuslat","Recaizade Ekrem"),("Afife Anjelik","Recaizade Ekrem"),("Atala","Recaizade Ekrem"),
 ("Zor nikah","Ahmet Vefik"),("Zoraki tabip","Ahmet Vefik"),("Yorgaki Dandin","Ahmet Vefik"),("Azarya","Ahmet Vefik"),("Tartüf","Ahmet Vefik"),("Dekbazlık","Ahmet Vefik"),
 ("Geveze Berber","Ali Bey"),("Kokona yatıyor","Ali Bey"),("Misafir-i istiskal","Ali Bey"),
 ("Pinti Hamid","Teodor Kasap"),("İskilli Memo","Teodor Kasap"),
 ("Ecel-i kaza","Ebüzziya Tevfik"),("Vaveyla","Ebüzziya Tevfik"),
 ("Besa yahut Ahde vefa","Şemsettin Sami"),("Besa","Şemsettin Sami"),("Seydi Yahya","Şemsettin Sami"),("Gave","Şemsettin Sami"),
 ("İstanbul Efendisi","Musahipzade Celal"),("Bir kavuk devrildi","Musahipzade Celal"),("Aynaroz kadısı","Musahipzade Celal"),("Kafesten kafese","Musahipzade Celal"),("Lâle Devri","Musahipzade Celal"),
 ("Hazan bülbülü","Hüseyin Rahmi"),("Kokotlar mektebi","Hüseyin Rahmi"),
 ("Görenek","Mehmed Rıfat"),("Baria","Ali Ekrem"),("Akşam güneşi","Reşat Nuri"),("Taş parçası","Reşat Nuri"),("Hülleci","Reşat Nuri"),("Eski rüya","Reşat Nuri"),
 ("Ümidin güneşi","Reşat Nuri"),("Gazeteci düşmanı","Reşat Nuri"),("Balıkesir muhasebecisi","Reşat Nuri"),("İstiklal","Reşat Nuri"),
 ("Hababam sınıfı","Rıfat Ilgaz"),("Hababam","Rıfat Ilgaz"),
 ("Keşanlı Ali destanı","Haldun Taner"),("Gözlerimi kaparım vazifemi yaparım","Haldun Taner"),("Eşeğin gölgesi","Haldun Taner"),
 ("Bir adam yaratmak","Necip Fazıl"),("Tohum","Necip Fazıl"),("Reis Bey","Necip Fazıl"),
 ("Köşebaşı","Ahmet Kutsi Tecer"),("Ferhad ile Şirin","Nazım Hikmet"),("Kafatası","Nazım Hikmet"),("Bir ölü evi","Nazım Hikmet"),
 ("Yaşar ne yaşar ne yaşamaz","Aziz Nesin"),("Çiçu","Aziz Nesin"),("Tohum ve toprak","Orhan Asena"),("Hürrem Sultan","Orhan Asena"),
 ("Ana Hanım kızım","Cevat Fehmi"),("Kerem ile Aslı","Recep Bilginer"),("Isırgan otu","Recep Bilginer"),
 ("Kurban","Güngör Dilmen"),("Midas'ın kulakları","Güngör Dilmen"),("Kanlı Nigar","Sadık Şendil"),
 ("Karagöz oyunları","Karagöz"),("Karagöz perdeleri","Karagöz"),("Ortaoyunu","Ortaoyunu"),("Tuluat","Tuluat"),
 ("Yol senaryo","Yılmaz Güney"),("Sürü","Yılmaz Güney"),("Umut","Yılmaz Güney"),("Duvar","Yılmaz Güney"),
 ("Selvi boylum al yazmalım","Ali Özgentürk"),("Susuz yaz","Necati Cumalı"),("Muhsin Bey","Yavuz Turgul"),("Eşkıya","Yavuz Turgul"),
 ("Vizontele","Yılmaz Erdoğan"),("Uzak","Nuri Bilge Ceylan"),("Kış uykusu","Nuri Bilge Ceylan"),("Bir zamanlar Anadolu'da","Nuri Bilge Ceylan"),
 ("Kuyucaklı Yusuf","Sabahattin Ali"),("Kibar feyzo","Atıf Yılmaz"),("Tosun paşa","Kartal Tibet"),("Süt kardeşler","Ertem Eğilmez"),
]
def main():
    seen = {}
    for phrase, author in KNOWN:
        q = f'mediatype:texts AND title:("{phrase}")'
        try:
            for it in ia.search_items(q, fields=FIELDS):
                it["_known"] = {"phrase": phrase, "author_hint": author}
                seen.setdefault(it["identifier"], it)
        except Exception as e:
            print("hata", phrase, e, file=sys.stderr); time.sleep(3)
    with open(D / "ia_known_hits.jsonl", "w", encoding="utf-8") as f:
        for it in seen.values(): f.write(json.dumps(it, ensure_ascii=False) + "\n")
    print("toplam", len(seen), file=sys.stderr)
main()
