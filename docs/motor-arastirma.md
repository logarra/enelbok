# Opel Astra J 1.6 Ecotec (A16XER) — Motor araştırması

Adım 1 çıktısı: modellemeden önce motorun bileşenleri, görevleri, bağlantıları ve konumları.

**Güven seviyesi:** ✅ birden fazla güvenilir kaynakta aynı · 🟡 tek kaynak / genel GM Family 1 bilgisi · ❓ doğrulanmadı (fotoğrafla teyit gerekli)

## Temel veriler

| Özellik | Değer | Güven | Kaynak |
|---|---|---|---|
| Motor ailesi | GM Family 1, Generation III (Ecotec) | ✅ | Wikipedia, mymotorlist |
| Tip | Sıralı 4 silindir, enine, atmosferik benzinli | ✅ | Wikipedia, enginecode.uk |
| Hacim | 1598 cc | ✅ | hepsi |
| Çap × strok | 79,0 × 81,5 mm | ✅ | Wikipedia, mymotorlist |
| Sıkıştırma | 10,8 : 1 | ✅ | Wikipedia, mymotorlist |
| Güç / tork | 85 kW (115 PS) @ 6000 · 155 Nm @ 4000 | ✅ | Wikipedia |
| Blok / kapak | Dökme demir blok (hafifletilmiş) · alüminyum silindir kapağı | ✅ | Wikipedia, mymotorlist |
| Supap düzeni | DOHC, 16 supap, kovan tipi itici (hidrolik değil) | ✅ | Wikipedia, mymotorlist |
| Değişken supap zamanlaması | DCVCP: emme **ve** egzoz eksantriğinde faz ayarlayıcı | ✅ | Wikipedia, mymotorlist |
| Eksantrik tahriki | **Triger kayışı** (zincir değil) | ✅ | Wikipedia, mymotorlist |
| Su pompası | Triger kayışından değil, **V kayışından** tahrikli | 🟡 | Wikipedia ("water pump no longer driven by it"), enginetechspecs |
| Emme | Değişken uzunluklu emme manifoldu (Opel “TwinPort” adını kullanır, VGIS) | ✅ | Wikipedia, mymotorlist |
| Yakıt | Sıralı çok noktalı enjeksiyon, 4 enjektör, dönüşsüz sistem | ✅ | Wikipedia, enginetechspecs |
| Ateşleme | Tek parça bobin modülü (4 buji başlığı) | 🟡 | mymotorlist ("ignition coil module") |
| Egzoz | Katalizör manifolda entegre | ✅ | Wikipedia, parça katalogları |
| Piston soğutma | Yağ püskürtme memeleri | ✅ | Wikipedia |
| Ateşleme sırası | 1-3-4-2 | 🟡 | enginetechspecs |
| Supap çapı | Emme 31 mm · egzoz 27 mm | 🟡 | enginetechspecs |
| Termostat | Plastik gövde, ≈ 90 °C (elektronik kontrollü termostat) | 🟡 | enginetechspecs, mymotorlist |
| Yağ | 5W-30 (dexos2), ≈ 4,5 L | ✅ | mymotorlist |
| Soğutma suyu | ≈ 6,5 L, Dexcool | 🟡 | enginetechspecs |
| Motor ağırlığı | ≈ 105–118 kg | 🟡 | üç kaynak farklı |
| Kırmızı bölge | 6500 d/d | 🟡 | enginetechspecs |

**Kaynaklar arasındaki çelişki:** enginecode.uk ve enginetechspecs “zincir”, “alüminyum blok” ve “hidrolik itici” yazıyor. Wikipedia ve mymotorlist ise “kayış”, “dökme demir blok”, “hidrolik itici yok” diyor. Ayrıca owner forumları da triger kayışı değişiminden bahsediyor. İlk iki site hatalı kabul edildi.

**Bilinen kronik sorunlar (bilgi kartlarına girecek):** VVT selenoid valf süzgeçlerinin tıkanması, yağ soğutucusu/filtre gövdesi contası kaçağı, plastik termostat gövdesi çatlağı, külbütör kapak contası sızıntısı, karter havalandırma (PCV) diyaframı yırtılması, bobin modülü arızası.

## Yön tanımları (araç içinde)

- **Ön** = radyatör tarafı · **Arka** = torpido sacı (kabin) tarafı
- **Sağ** = yolcu tarafı = triger kayışı ve yardımcı kayış tarafı
- **Sol** = sürücü tarafı = şanzıman tarafı

## Bileşenler — görev, bağlantı, konum

### 1. Blok grubu (motorun gövdesi)
| Parça | Ne işe yarar | Neye bağlı | Konum | Güven |
|---|---|---|---|---|
| Silindir bloğu | 4 silindiri ve krank yataklarını taşır, su ve yağ kanalları içinde | Kapak, karter, şanzıman, takozlar | Merkez | ✅ |
| Krank mili (5 ana yatak) | Pistonların ileri-geri hareketini dönmeye çevirir | Biyeller, volan (sol), krank dişlisi + kasnak (sağ) | Bloğun altında, enine | ✅ |
| 4 piston + segmanlar | Yanma basıncını alır | Biyel (piston pimi) | Silindirlerin içinde, Ø 79 mm | ✅ |
| 4 biyel | Pistonu kranka bağlar | Piston, krank muylusu | Silindir içi → krank | ✅ |
| Yağ püskürtme memeleri | Pistonların altını yağla soğutur | Blok yağ kanalı | Her silindirin altında | ✅ |
| Yağ karteri | Motor yağını toplar | Bloğun altı | En alt | ✅ |
| Volan | Dönüşü dengeler, debriyaj buraya bağlanır | Krank (sol uç), debriyaj | Sol uç | ✅ |

### 2. Silindir kapağı
| Parça | Ne işe yarar | Neye bağlı | Konum | Güven |
|---|---|---|---|---|
| Silindir kapağı (alüminyum) | Yanma odaları, emme ve egzoz kanalları | Blok üstü, manifoldlar | Bloğun üstü | ✅ |
| Emme eksantrik mili | Emme supaplarını açar | Faz ayarlayıcı + triger kayışı (sağ) | Kapağın emme tarafı | ✅ |
| Egzoz eksantrik mili | Egzoz supaplarını açar | Faz ayarlayıcı + triger kayışı (sağ) | Kapağın egzoz tarafı | ✅ |
| 2 faz ayarlayıcı (DCVCP) | Eksantrik zamanlamasını devre göre kaydırır | Eksantrik uçları, yağ basıncı, selenoid valfler | Sağ uç, triger kapağının içi | ✅ |
| 16 supap + yaylar + kovan iticiler | Silindire hava alır, egzozu bırakır | Eksantrik kamları | Kapağın içi | ✅ |
| Bobin modülü + 4 buji | Karışımı ateşler | Kablo demeti, ECU | Kapağın tam üstü, iki eksantrik arası | 🟡 |
| Külbütör kapağı | Üstü kapatır, yağ doldurma kapağı üzerinde | Kapak üstü | En üst | ✅ |

### 3. Triger sistemi (sağ uç)
| Parça | Ne işe yarar | Neye bağlı | Güven |
|---|---|---|---|
| Triger kayışı | Krank ile eksantrikleri senkron döndürür (koparsa supaplar eğilir) | Krank dişlisi, 2 faz ayarlayıcı dişlisi, gergi, avare | ✅ |
| Gergi + avare makara | Kayış gerginliğini korur | Blok / kapak | ✅ |
| Triger kapakları (üst/alt) | Kayışı korur | Blok, kapak | ✅ |

### 4. Yardımcı tahrik (sağ uç, en dışta)
| Parça | Ne işe yarar | Neye bağlı | Güven |
|---|---|---|---|
| Krank kasnağı (titreşim damperli) | V kayışını çevirir | Krank sağ ucu | ✅ |
| V kayışı (poly-V) + otomatik gergi | Yardımcıları çevirir | Kasnak, alternatör, klima, su pompası | ✅ |
| Alternatör | Aküyü şarj eder | V kayışı, akü | ✅ (konum ❓) |
| Klima kompresörü | Klima gazını sıkıştırır | V kayışı | ✅ (konum ❓) |
| Su pompası | Soğutma suyunu dolaştırır | V kayışı | 🟡 |

Not: Astra J’de direksiyon pompası elektro-hidrolik olduğu için kayışta değildir.

### 5. Emme · 6. Yakıt
| Parça | Ne işe yarar | Neye bağlı | Konum | Güven |
|---|---|---|---|---|
| Hava filtresi kutusu | Havayı süzer | Emiş hortumu | ❓ | ❓ |
| Emiş hortumu + hava sensörü | Temiz havayı taşır, miktarını ölçer | Filtre → gaz kelebeği | ❓ | 🟡 |
| Elektronik gaz kelebeği | Gaz pedalına göre hava miktarını ayarlar | Emme manifoldu girişi | ❓ | ✅ |
| Değişken emme manifoldu (plastik) | Havayı 4 silindire dağıtır, kanal uzunluğu devre göre değişir | Kapağın emme tarafı | ❓ ön mü arka mı | ✅ |
| Yakıt rayı + 4 enjektör | Her silindirin emme kanalına yakıt püskürtür | Manifold, yakıt hattı | Manifold üzerinde | ✅ |

### 7. Egzoz
| Parça | Ne işe yarar | Neye bağlı | Konum | Güven |
|---|---|---|---|---|
| Egzoz manifoldu + entegre katalizör | Gazı toplar, zararlı gazları dönüştürür | Kapağın egzoz tarafı → ön boru | ❓ ön mü arka mı | ✅ |
| Isı kalkanı | Çevreyi sıcaktan korur | Manifold üstü | Manifoldun üstü | ✅ |
| 2 lambda sondası | Katalizör öncesi/sonrası oksijeni ölçer | Manifold ve ön boru | ✅ |
| Ön boru + esnek bağlantı | Gazı alttaki egzoz hattına iletir | Katalizör → orta susturucu | ✅ |

### 8. Soğutma · 9. Yağlama
| Parça | Ne işe yarar | Neye bağlı | Güven |
|---|---|---|---|
| Termostat (plastik gövde, elektronik) | ≈ 90 °C’de radyatör devresini açar | Kapak ucu, radyatör hortumları | 🟡 (konum ❓) |
| Radyatör + elektrikli fan | Suyu soğutur | Termostat, su pompası | ✅ |
| Genleşme kabı | Basıncı ve seviyeyi dengeler | Radyatör, motor | ✅ |
| Yağ pompası | Yağı basınçla dolaştırır | Krank (ön uç) | 🟡 |
| Yağ filtresi + yağ soğutucusu gövdesi | Yağı süzer ve soğutur (kartuş filtre) | Blok | ✅ (konum ❓) |
| Yağ çubuğu, doldurma kapağı, PCV | Seviye kontrolü, karter gazlarını emmeye geri verir | Blok, külbütör kapağı | ✅ |

### 10. Elektrik / kontrol
| Parça | Ne işe yarar | Güven |
|---|---|---|
| ECU (motor beyni) | Enjeksiyon, ateşleme, VVT ve emme manifoldunu yönetir | ✅ (marka ❓) |
| Marş motoru | Motoru çevirip çalıştırır; şanzıman çanına bağlı | ✅ |
| Akü | Elektrik deposu; sol önde | ✅ |
| Krank ve eksantrik sensörleri | Devir ve konumu ölçer | ✅ |
| Vuruntu, su sıcaklığı, yağ basıncı sensörleri | Motoru korur | ✅ |
| 2 VVT selenoid valfi | Faz ayarlayıcılara yağ yönlendirir | ✅ |

### 11. Güç aktarma
| Parça | Ne işe yarar | Güven |
|---|---|---|
| Debriyaj (baskı, disk, rulman) + hidrolik silindir | Motor ile şanzımanı ayırır/birleştirir | ✅ |
| F17 5 ileri manuel şanzıman (diferansiyel entegre) | Vites oranları; sol uçta | ✅ |
| 2 aks mili | Gücü ön tekerleklere iletir | ✅ |
| Motor takozları | Motoru gövdeye bağlar, titreşimi süzer | ✅ |

## Fotoğraflarla doğrulanan yerleşim (kullanıcının gönderdiği 8 fotoğraf)

Fotoğraflar: Astra J 1.6 motor bölümü (önden, 3 adet), A16XER sökülmüş motor (triger ucundan 2, önden 1), egzoz manifoldu yakın çekim, yağ soğutucusu değişimi.

| Konu | Sonuç | Kanıt |
|---|---|---|
| Egzoz manifoldu | **Ön tarafta** (radyatöre bakar), üstünde nervürlü alüminyum ısı kalkanı, katalizör hemen altında | Önden çekilmiş 3 fotoğraf + yakın çekim |
| Emme manifoldu | **Arka tarafta** (torpido sacı tarafı); enjektör hattı arkada üstte | Önden çekimler (LPG enjektörleri arkada) |
| Gaz kelebeği | Motorun **sağ ucunda** (triger tarafı), önde ve alçakta; büyük körüklü hortum buraya bağlanıyor | Sökülmüş motor fotoğrafları |
| Hava filtresi kutusu | Motor bölümünün **sağ ön** köşesi | Önden çekimler |
| Triger kapağı | Sağ uçta büyük siyah plastik kapak; üstünde alüminyum motor takozu braketi | Sökülmüş motor |
| V kayışı | Sağ uçta: alternatör **önde-altta**, klima kompresörü **arkada-altta**, krank kasnağı ortada-altta, su pompası kasnağı ve gergi ortada | Sökülmüş motor (2 fotoğraf) |
| Yağ çubuğu | Sarı saplı, **önde**, egzoz ısı kalkanının sağ yanında | Önden çekimler |
| Yağ doldurma kapağı | Külbütör kapağının **sol ön** ucunda (şanzıman tarafı) | Yakın çekim, Vauxhall motor |
| Termostat gövdesi | Silindir kapağının **sol ucunda** (şanzıman tarafı), hortumlarla | Vauxhall motor fotoğrafı |
| Külbütör kapağı | Üstte ortada “ECOTEC” yazılı kapak; bobin modülü bu kapağın ortasında | Tüm fotoğraflar |
| Akü + sigorta kutusu | **Sol ön** | Önden çekimler |
| Fren hidroliği haznesi | Sol arkada, ön camın dibine yakın | Önden çekimler |
| Soğutma suyu genleşme kabı | Sol arkada, hidrolik haznesinin yanında | Önden çekimler |
| Yağ soğutucusu + filtre gövdesi | Alüminyum gövde, kartuş filtre kapaklı; motorun arka tarafında, emme manifoldunun altında (değişim için manifold sökülüyor) | Yağ soğutucusu değişim fotoğrafı |

Not: Fotoğraflardaki bazı araçlarda sonradan takılmış LPG enjektörleri var (arka üstteki beyaz soketli enjektörler). Fabrika aracında bunlar yoktur, modele eklenmeyecek.

## Kaynaklar

- Wikipedia, GM Family 1 engine (Generation III bölümü)
- mymotorlist.com — Opel Z16XER
- enginecode.uk — Vauxhall A16XER (kısmen hatalı)
- enginetechspecs.com — Opel A16XER (kısmen hatalı)
- Owner forumları: astraownersnetwork.co.uk (yağ filtresi kartuşu)
