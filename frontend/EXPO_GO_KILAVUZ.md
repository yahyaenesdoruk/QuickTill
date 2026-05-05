# 🛒 CartPay - Expo Go Kullanım Kılavuzu

## ✅ Expo Go'da Çalışan Versiyon

Uygulama, Expo Go ile uyumlu olacak şekilde güncellendi!

### 🔄 Ne Değişti?

1. **Barkod Tarayıcı → Ürün Seçici**
   - Gerçek kamera barkod tarama yerine
   - 22 ürün listesinden seçim yapabiliyorsunuz
   - Tıklayınca sepete ekliyor

2. **NFC Ödeme → Simüle Ödeme**  
   - NFC donanım beklemiyor
   - "Ödemeyi Simüle Et" butonu ile ödeme yapılıyor
   - Animasyonlar ve fişler aynı şekilde çalışıyor

3. **Diğer Tüm Özellikler Aynı**
   - ✅ Sepet yönetimi (ekleme, çıkarma, miktar değiştirme)
   - ✅ Meyve-Sebze bölümü (20 ürün, tartılı/adetli)
   - ✅ PDF fiş oluşturma ve paylaşma
   - ✅ Fiş geçmişi
   - ✅ Türkçe arayüz

---

## 📱 Expo Go'da Nasıl Açılır?

### Adım 1: QR Kod'u Tara
1. Telefonunuzda **Expo Go** uygulamasını açın
2. Platform'daki QR kodu tarayın

### Adım 2: Uygulama Açıldı! 🎉
- Uygulama "Sepet" tab'ında başlayacak
- Alt tarafta 3 tab göreceksiniz:
  - 🛒 **Sepet**
  - 🥦 **Meyve-Sebze** 
  - 🧾 **Fişlerim**

---

## 🎮 Nasıl Kullanılır?

### 1. Ürün Ekleme (Barkod Simülasyonu)

**Sepet** ekranında:
1. Sağ üstteki **barkod ikonu** 📷 veya 
2. "Barkod Okut" butonuna tıklayın

**Ürün Listesi** açılacak:
- 22 ürün görünecek (Süt, Peynir, Kola, Ekmek, vb.)
- Ürünün üzerine tıklayın
- Otomatik sepete eklenecek! ✅

### 2. Meyve-Sebze Ekleme

**Meyve-Sebze** tab'ına geçin:

#### Tartılan Ürünler (Domates, Muz, Elma, vb.):
1. Ürüne tıklayın
2. Gram girin (örn: 500)
3. "Sepete Ekle"

#### Adetli Ürünler (Maydanoz, Limon, vb.):
1. Ürüne tıklayın
2. +/- ile adet seçin
3. "Sepete Ekle"

**Filtreler:**
- **Tümü**: Hepsini göster
- **Tartılarak**: Sadece kiloluk ürünler
- **Adet**: Sadece adetli ürünler

### 3. Sepeti Yönetme

**Sepet** ekranında:
- **+/-** butonları: Miktar değiştir
- **🗑️ Çöp ikonu**: Ürünü sil
- Alt tarafta toplam fiyat görünür
- "Ödemeye Geç" ile ödeme adımına

### 4. Ödeme Yapma

**Ödeme** ekranında:
1. Sipariş özetini göreceksiniz
2. "Ödemeyi Simüle Et" butonuna tıklayın
3. ✅ Başarılı animasyonu göreceksiniz
4. Otomatik fiş oluşturulur
5. "Fişlerim" ekranına yönlendirilirsiniz

### 5. Fişleri Görüntüleme

**Fişlerim** tab'ında:
- Tüm geçmiş alışverişleriniz
- Fiş numarası, tarih, tutar
- Tıklayınca detay açılır

**Fiş Detayında:**
- 📄 **PDF İndir**: PDF olarak kaydet
- 📤 **Paylaş**: WhatsApp, Mail, vb. ile paylaş
- 🗑️ **Sil**: Fişi sil

---

## 📋 Örnek Ürünler

### Barkodlu Ürünler (22 adet):
```
Süt 1L - 28.50₺
Beyaz Peynir 500g - 89.90₺
Kaşar Peynir 350g - 125.00₺
Yoğurt 500g - 19.90₺
Su 1.5L - 6.50₺
Kola 2.5L - 42.90₺
Ayran 1L - 22.50₺
Ekmek - 8.00₺
Makarna 500g - 18.50₺
Pirinç 1kg - 42.00₺
... ve 12 ürün daha
```

### Meyve-Sebze (20 adet):

**Sebzeler (kg fiyatı):**
- Domates - 35.90₺/kg
- Biber - 42.50₺/kg
- Salatalık - 28.90₺/kg
- Patlıcan - 38.00₺/kg
- Patates - 22.50₺/kg
- Soğan - 18.90₺/kg

**Meyveler (kg fiyatı):**
- Muz - 52.90₺/kg
- Elma - 38.50₺/kg
- Portakal - 32.90₺/kg
- Mandalina - 35.00₺/kg

**Yeşillikler (adet):**
- Maydanoz - 4.50₺/adet
- Dereotu - 4.50₺/adet
- Marul - 12.50₺/adet
- Limon - 3.50₺/adet

---

## 💡 İpuçları

### Sepet İpuçları:
- Ürünü silmek için çöp ikonu'na tıklayın
- Miktarları + / - ile ayarlayın
- Toplam hep güncel görünür

### Meyve-Sebze İpuçları:
- **500 gram domates** için: "500" yazın
- **3 adet limon** için: +++ ile 3'e getirin
- Fiyat otomatik hesaplanır

### Fiş İpuçları:
- PDF indirme ve paylaşma Expo Go'da çalışır
- Fişler telefonunuzda saklanır
- Uygulama kapansa bile kayıtlı kalır

---

## ⚠️ Önemli Notlar

### Expo Go Sınırlamaları:
1. **Gerçek Barkod Tarama YOK**
   - Development build gerektirir
   - Şimdilik ürün listesinden seçim yapılıyor

2. **Gerçek NFC YOK**
   - Development build gerektirir
   - "Simüle Et" butonu kullanılıyor

3. **PDF İşlevleri Kısıtlı**
   - İndirme ve paylaşma çalışır
   - Ancak tam erişim için development build önerilir

### Çalışan Her Şey:
✅ Sepet yönetimi
✅ Miktar değiştirme
✅ Ürün ekleme/silme
✅ Meyve-sebze tartım
✅ Ödeme simülasyonu
✅ Fiş oluşturma
✅ PDF indirme/paylaşma
✅ Geçmiş fişler
✅ Türkçe dil
✅ Responsive tasarım

---

## 🔧 Geliştirici Notları

### Gerçek Barkod ve NFC için:
```bash
# Development build oluşturma
eas build --profile development --platform android
```

### Kullanılan Teknolojiler:
- React Native / Expo
- Expo Router (dosya tabanlı routing)
- AsyncStorage (local veri)
- Expo Print (PDF)
- Expo Sharing (paylaşım)
- Vector Icons (ikonlar)

---

## 🎯 Örnek Kullanım Senaryosu

1. **Başla**: Uygulama açılır, sepet boş
2. **Ürün ekle**: "Barkod Okut" → Süt seç → Sepette görünür
3. **Meyve ekle**: Meyve-Sebze → Domates → 750 gram → Ekle
4. **Yeşillik ekle**: Marul → 2 adet → Ekle
5. **Kontrol**: Sepette 3 ürün, toplam ~60₺
6. **Ödeme**: "Ödemeye Geç" → "Simüle Et" → Başarılı!
7. **Fiş**: Otomatik oluştu, PDF indir veya paylaş

---

## 📞 Destek

Sorun mu yaşıyorsunuz?
- Cache temizle: Expo Go'yu kapat, QR'ı tekrar tara
- App'i yenile: Expo Go'da shake → "Reload"
- Logları kontrol et: Development menüsünde

---

**🎉 CartPay Expo Go versiyonu kullanıma hazır!**

*Not: Bu okul projesi için eğitim amaçlı bir simülasyon uygulamasıdır.*
