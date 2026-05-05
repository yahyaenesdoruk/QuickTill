import { Product, ProduceItem } from '../models/Product';

export const sampleProducts: Product[] = [
  // Süt Ürünleri
  { id: '1', barcode: '8690504001011', name: 'Süt 1L', price: 28.50, category: 'Süt Ürünleri' },
  { id: '2', barcode: '8690504002012', name: 'Beyaz Peynir 500g', price: 89.90, category: 'Süt Ürünleri' },
  { id: '3', barcode: '8690504003013', name: 'Kaşar Peynir 350g', price: 125.00, category: 'Süt Ürünleri' },
  { id: '4', barcode: '8690504004014', name: 'Yoğurt 500g', price: 19.90, category: 'Süt Ürünleri' },
  
  // İçecekler
  { id: '5', barcode: '8690504005015', name: 'Su 1.5L', price: 6.50, category: 'İçecekler' },
  { id: '6', barcode: '8690504006016', name: 'Kola 2.5L', price: 42.90, category: 'İçecekler' },
  { id: '7', barcode: '8690504007017', name: 'Ayran 1L', price: 22.50, category: 'İçecekler' },
  { id: '8', barcode: '8690504008018', name: 'Meyve Suyu 1L', price: 28.90, category: 'İçecekler' },
  
  // Temel Gıda
  { id: '9', barcode: '8690504009019', name: 'Ekmek', price: 8.00, category: 'Temel Gıda' },
  { id: '10', barcode: '8690504010020', name: 'Makarna 500g', price: 18.50, category: 'Temel Gıda' },
  { id: '11', barcode: '8690504011021', name: 'Pirinç 1kg', price: 42.00, category: 'Temel Gıda' },
  { id: '12', barcode: '8690504012022', name: 'Un 1kg', price: 19.90, category: 'Temel Gıda' },
  { id: '13', barcode: '8690504013023', name: 'Şeker 1kg', price: 35.00, category: 'Temel Gıda' },
  
  // Konserveler
  { id: '14', barcode: '8690504014024', name: 'Salça 700g', price: 32.50, category: 'Konserve' },
  { id: '15', barcode: '8690504015025', name: 'Konserve Ton Balığı', price: 45.00, category: 'Konserve' },
  { id: '16', barcode: '8690504016026', name: 'Yeşil Zeytin 500g', price: 55.00, category: 'Konserve' },
  
  // Şarküteri
  { id: '17', barcode: '8690504017027', name: 'Salam 150g', price: 38.90, category: 'Şarküteri' },
  { id: '18', barcode: '8690504018028', name: 'Sosis 500g', price: 52.00, category: 'Şarküteri' },
  
  // Temizlik
  { id: '19', barcode: '8690504019029', name: 'Deterjan 3kg', price: 125.00, category: 'Temizlik' },
  { id: '20', barcode: '8690504020030', name: 'Bulaşık Deterjanı', price: 35.90, category: 'Temizlik' },
  
  // Atıştırmalık
  { id: '21', barcode: '8690504021031', name: 'Cips 150g', price: 22.50, category: 'Atıştırmalık' },
  { id: '22', barcode: '8690504022032', name: 'Çikolata 80g', price: 18.90, category: 'Atıştırmalık' },
];

export const produceItems: ProduceItem[] = [
  // Sebzeler (Tartılarak)
  { id: 'p1', name: 'Domates', pricePerKg: 35.90, category: 'Sebze', soldBy: 'weight' },
  { id: 'p2', name: 'Biber', pricePerKg: 42.50, category: 'Sebze', soldBy: 'weight' },
  { id: 'p3', name: 'Salatalık', pricePerKg: 28.90, category: 'Sebze', soldBy: 'weight' },
  { id: 'p4', name: 'Patlıcan', pricePerKg: 38.00, category: 'Sebze', soldBy: 'weight' },
  { id: 'p5', name: 'Patates', pricePerKg: 22.50, category: 'Sebze', soldBy: 'weight' },
  { id: 'p6', name: 'Soğan', pricePerKg: 18.90, category: 'Sebze', soldBy: 'weight' },
  { id: 'p7', name: 'Sarımsak', pricePerKg: 125.00, category: 'Sebze', soldBy: 'weight' },
  
  // Meyveler (Tartılarak)
  { id: 'p8', name: 'Muz', pricePerKg: 52.90, category: 'Meyve', soldBy: 'weight' },
  { id: 'p9', name: 'Elma', pricePerKg: 38.50, category: 'Meyve', soldBy: 'weight' },
  { id: 'p10', name: 'Armut', pricePerKg: 45.00, category: 'Meyve', soldBy: 'weight' },
  { id: 'p11', name: 'Portakal', pricePerKg: 32.90, category: 'Meyve', soldBy: 'weight' },
  { id: 'p12', name: 'Mandalina', pricePerKg: 35.00, category: 'Meyve', soldBy: 'weight' },
  { id: 'p13', name: 'Üzüm', pricePerKg: 68.90, category: 'Meyve', soldBy: 'weight' },
  { id: 'p14', name: 'Çilek', pricePerKg: 85.00, category: 'Meyve', soldBy: 'weight' },
  
  // Yeşillikler (Adet)
  { id: 'p15', name: 'Maydanoz', pricePerUnit: 4.50, category: 'Yeşillik', soldBy: 'unit' },
  { id: 'p16', name: 'Dereotu', pricePerUnit: 4.50, category: 'Yeşillik', soldBy: 'unit' },
  { id: 'p17', name: 'Nane', pricePerUnit: 4.50, category: 'Yeşillik', soldBy: 'unit' },
  { id: 'p18', name: 'Roka', pricePerUnit: 8.90, category: 'Yeşillik', soldBy: 'unit' },
  { id: 'p19', name: 'Marul', pricePerUnit: 12.50, category: 'Yeşillik', soldBy: 'unit' },
  
  // Limon (Adet)
  { id: 'p20', name: 'Limon', pricePerUnit: 3.50, category: 'Meyve', soldBy: 'unit' },
];
