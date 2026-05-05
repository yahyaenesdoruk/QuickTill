# 🛒 CartPay - Smart Shopping Cart App

A complete, fully functional smart shopping cart mobile application built with React Native/Expo. This app simulates a self-checkout kiosk system designed to be mounted on a shopping cart via a phone holder.

## ✨ Features

### 1. 📷 **Barcode Scanner**
- Real-time camera barcode scanning using device camera
- Automatic product lookup from local database
- Instant cart addition with visual confirmation
- 22 pre-loaded sample products with Turkish names
- Quantity auto-increment for duplicate scans

### 2. 🛍️ **Smart Cart Management**
- Beautiful item cards with product details
- Quantity controls (+/- buttons)
- **Swipe or tap to delete items**
- Running total and item count
- Empty state with scan prompt
- Sticky "Proceed to Payment" button

### 3. 🥬 **Fresh Produce Section (Barkodsuz)**
- 20+ Turkish produce items included:
  - **Vegetables (by weight)**: Domates, Biber, Salatalık, Patlıcan, Patates, Soğan, Sarımsak
  - **Fruits (by weight)**: Muz, Elma, Armut, Portakal, Mandalina, Üzüm, Çilek
  - **Greens (by unit)**: Maydanoz, Dereotu, Nane, Roka, Marul
  - **Other (by unit)**: Limon
- Filter by: All, Weight-based, Unit-based
- Modal input for weight (grams) or quantity
- Automatic price calculation

### 4. 💳 **NFC Payment Simulation**
- Beautiful pulsing NFC animation
- Real NFC detection (when device supports)
- Fallback "Simulate Payment" button
- Payment success animation
- Automatic receipt generation

### 5. 🧾 **Digital Receipts**
- **In-App Receipt View**:
  - Store branding
  - Unique receipt ID (e.g., #RCP-20240324-001)
  - Date & time
  - Itemized list with quantities and prices
  - Total amount
  - Payment method
  - Thank you message
  
- **PDF Generation & Sharing**:
  - Professional PDF layout
  - Download to device
  - Share via system share sheet
  - Formatted like real receipts
  - Eco-friendly note

### 6. 📚 **Receipt History**
- All past receipts sorted by date (newest first)
- Receipt cards showing ID, date, time, total, item count
- Tap to view full receipt detail
- Swipe or tap to delete
- Empty state illustration

## 🎨 UI/UX Highlights

- **Turkish Language**: Complete app in Turkish
- **Modern Design**: Clean white background with green accent (#2E7D32)
- **Bottom Navigation**: 3 tabs with icons
  - 🛒 Sepet (Cart)
  - 🥦 Meyve-Sebze (Produce)
  - 🧾 Fişlerim (Receipts)
- **Smooth Animations**: 
  - Item add confirmations
  - Swipe-to-delete
  - NFC pulse animation
  - Payment success
- **Responsive**: Works on all phone sizes

## 🗂️ Project Structure

```
/app/frontend/
  /app/
    _layout.tsx          # Bottom tab navigation
    index.tsx            # Entry point (redirects to cart)
    cart.tsx             # Shopping cart screen
    scanner.tsx          # Barcode scanner screen
    produce.tsx          # Fresh produce section
    payment.tsx          # NFC payment screen
    receipts.tsx         # Receipt history list
    receipt-detail.tsx   # Individual receipt view
  
  /src/
    /constants/
      Colors.ts          # App color palette
      Texts.ts           # All Turkish text strings
    
    /models/
      Product.ts         # Product & ProduceItem types
      CartItem.ts        # Cart item type
      Receipt.ts         # Receipt types
    
    /data/
      sampleProducts.ts  # 22 sample products + 20 produce items
    
    /services/
      CartService.ts     # Cart CRUD operations
      ReceiptService.ts  # Receipt generation & storage
      PdfService.ts      # PDF generation & sharing
    
    /components/
      CartItemCard.tsx       # Individual cart item
      ProduceItemCard.tsx    # Produce item with modal
      ReceiptView.tsx        # Receipt display component
      NfcAnimation.tsx       # Animated NFC pulse
```

## 📦 Dependencies

```json
{
  "expo-barcode-scanner": "^13.0.1",
  "react-native-nfc-manager": "^3.17.2",
  "expo-print": "~15.0.8",
  "expo-sharing": "~14.0.8",
  "@react-native-async-storage/async-storage": "^2.2.0",
  "expo-file-system": "~19.0.21",
  "react-native-gesture-handler": "~2.28.0",
  "@expo/vector-icons": "^15.0.3",
  "expo-router": "~6.0.22"
}
```

## 🚀 How to Use

### 1. **Start Shopping**
- Open the app (automatically goes to Cart tab)
- Cart is empty → tap "Barkod Okut" button
- Point camera at a product barcode
- Item automatically added to cart!

### 2. **Add Fresh Produce**
- Tap "Meyve-Sebze" tab
- Browse produce items
- Tap an item
- For weight-based: Enter grams
- For unit-based: Select quantity with +/- buttons
- Tap "Sepete Ekle"

### 3. **Manage Cart**
- View all items in cart
- Use +/- to adjust quantities
- Tap trash icon to remove items
- See running total at bottom

### 4. **Checkout**
- Tap "Ödemeye Geç" button
- See order summary
- Either:
  - **Tap NFC card** (if device supports NFC)
  - OR tap **"Ödemeyi Simüle Et"** button
- Wait for success animation
- Receipt automatically generated!

### 5. **View Receipts**
- Tap "Fişlerim" tab
- See all past purchases
- Tap any receipt to view details
- Download PDF or share
- Delete old receipts

## 📱 Sample Products Included

### Barcoded Products (22 items):
- Süt Ürünleri: Süt, Beyaz Peynir, Kaşar, Yoğurt
- İçecekler: Su, Kola, Ayran, Meyve Suyu
- Temel Gıda: Ekmek, Makarna, Pirinç, Un, Şeker
- Konserve: Salça, Ton Balığı, Zeytin
- Şarküteri: Salam, Sosis
- Temizlik: Deterjan, Bulaşık Deterjanı
- Atıştırmalık: Cips, Çikolata

### Fresh Produce (20 items):
- Vegetables, fruits, greens - all with realistic Turkish market prices!

## 🎯 Key Technical Features

- **Fully Offline**: No internet or backend required
- **Local Storage**: Uses AsyncStorage for all data persistence
- **Real Camera**: Actual barcode scanning with expo-barcode-scanner
- **Real NFC**: Detects actual NFC tags (with simulator fallback)
- **Real PDFs**: Generates downloadable/shareable PDF files
- **Permissions Handled**: Camera and NFC permissions properly requested
- **Platform Compatible**: iOS and Android ready

## 🔧 Configuration

### Permissions (already configured in app.json):

**Android:**
- CAMERA
- NFC
- READ_EXTERNAL_STORAGE
- WRITE_EXTERNAL_STORAGE

**iOS:**
- NSCameraUsageDescription: "Scan product barcodes to add items"
- NFCReaderUsageDescription: "Tap card to complete payment"

## 💡 Tips

1. **Scanning Barcodes**: Use the sample barcodes from `sampleProducts.ts` (starting with 8690504...)
2. **Testing NFC**: If device doesn't support NFC, use the "Simulate Payment" button
3. **PDF Viewing**: Generated PDFs are saved to device storage and can be shared
4. **Cart Persistence**: Cart data persists between app sessions
5. **Turkish Prices**: All prices in Turkish Lira (₺)

## 📊 Receipt ID Format

Receipts use unique IDs: `#RCP-YYYYMMDD-NNN`
- Example: `#RCP-20240324-001`
- Auto-increments for each new receipt
- Helps track purchase history

## 🎨 Color Scheme

- **Primary Green**: #2E7D32 (market/fresh theme)
- **Dark Green**: #1B5E20
- **Light Green**: #4CAF50
- **Background**: #FFFFFF (white)
- **Surface**: #F5F5F5 (light gray)
- **Error Red**: #D32F2F

## 🏫 School Project Ready

This is a complete, production-quality mobile app suitable for:
- Mobile development course projects
- UX/UI design demonstrations
- Offline-first architecture examples
- E-commerce/retail app showcases
- Turkish localization examples

---

**Built with ❤️ using React Native & Expo**

*Note: This is a simulation app for educational purposes. No real payments are processed.*
