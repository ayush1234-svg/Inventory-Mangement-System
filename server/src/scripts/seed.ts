import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { Product } from '../models/Product.js';
import { Sale } from '../models/Sale.js';
import { Settings } from '../models/Settings.js';
import { StockAdjustment } from '../models/StockAdjustment.js';
import { User } from '../models/User.js';
import { rupeesToPaise } from '../utils/money.js';

interface SeedProduct {
  name: string;
  category: string;
  brand: string;
  model?: string;
  storage?: string;
  color?: string;
  imageUrl?: string;
  purchasePriceRupees: number;
  sellingPriceRupees: number;
  stockQuantity: number;
  lowStockThreshold: number;
}

const sampleProducts: SeedProduct[] = [
  // 1. Smartphones
  {
    name: 'Apple iPhone 15',
    category: 'Smartphones',
    brand: 'Apple',
    model: 'iPhone 15',
    storage: '128GB',
    color: 'Black',
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 65000,
    sellingPriceRupees: 71999,
    stockQuantity: 12,
    lowStockThreshold: 3,
  },
  {
    name: 'Apple iPhone 15',
    category: 'Smartphones',
    brand: 'Apple',
    model: 'iPhone 15',
    storage: '256GB',
    color: 'Blue',
    imageUrl: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 74000,
    sellingPriceRupees: 81999,
    stockQuantity: 8,
    lowStockThreshold: 3,
  },
  {
    name: 'Samsung Galaxy S24 5G',
    category: 'Smartphones',
    brand: 'Samsung',
    model: 'Galaxy S24',
    storage: '256GB',
    color: 'Onyx Black',
    imageUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 68000,
    sellingPriceRupees: 74999,
    stockQuantity: 10,
    lowStockThreshold: 3,
  },
  {
    name: 'OnePlus 12R 5G',
    category: 'Smartphones',
    brand: 'OnePlus',
    model: '12R',
    storage: '256GB',
    color: 'Cool Blue',
    imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 38000,
    sellingPriceRupees: 42999,
    stockQuantity: 15,
    lowStockThreshold: 4,
  },
  {
    name: 'Redmi Note 13 Pro+ 5G',
    category: 'Smartphones',
    brand: 'Xiaomi',
    model: 'Note 13 Pro+',
    storage: '256GB',
    color: 'Fusion Purple',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 27000,
    sellingPriceRupees: 31999,
    stockQuantity: 18,
    lowStockThreshold: 5,
  },
  {
    name: 'Realme 12 Pro 5G',
    category: 'Smartphones',
    brand: 'Realme',
    model: '12 Pro',
    storage: '128GB',
    color: 'Submarine Blue',
    imageUrl: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 21000,
    sellingPriceRupees: 24999,
    stockQuantity: 2, // LOW STOCK TRIGGER
    lowStockThreshold: 4,
  },
  {
    name: 'Vivo V30 5G',
    category: 'Smartphones',
    brand: 'Vivo',
    model: 'V30',
    storage: '128GB',
    color: 'Andaman Blue',
    imageUrl: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 29000,
    sellingPriceRupees: 33999,
    stockQuantity: 9,
    lowStockThreshold: 3,
  },

  // 2. Audio & Headphones
  {
    name: 'Apple AirPods Pro (2nd Gen) USB-C',
    category: 'Audio & Headphones',
    brand: 'Apple',
    model: 'AirPods Pro 2',
    color: 'White',
    imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 20000,
    sellingPriceRupees: 23990,
    stockQuantity: 6,
    lowStockThreshold: 2,
  },
  {
    name: 'Samsung Galaxy Buds2 Pro',
    category: 'Audio & Headphones',
    brand: 'Samsung',
    model: 'Buds2 Pro',
    color: 'Graphite',
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 12000,
    sellingPriceRupees: 14999,
    stockQuantity: 7,
    lowStockThreshold: 2,
  },
  {
    name: 'OnePlus Bullets Wireless Z2',
    category: 'Audio & Headphones',
    brand: 'OnePlus',
    model: 'Bullets Z2',
    color: 'Magico Black',
    imageUrl: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 1450,
    sellingPriceRupees: 1899,
    stockQuantity: 28,
    lowStockThreshold: 5,
  },
  {
    name: 'boAt Rockerz 450 Bluetooth On-Ear Headphones',
    category: 'Audio & Headphones',
    brand: 'boAt',
    model: 'Rockerz 450',
    color: 'Luscious Black',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 950,
    sellingPriceRupees: 1499,
    stockQuantity: 34,
    lowStockThreshold: 5,
  },
  {
    name: 'boAt Airdopes 141 True Wireless Earbuds',
    category: 'Audio & Headphones',
    brand: 'boAt',
    model: 'Airdopes 141',
    color: 'Bold Black',
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 850,
    sellingPriceRupees: 1299,
    stockQuantity: 1, // LOW STOCK TRIGGER
    lowStockThreshold: 5,
  },
  {
    name: 'Sony WH-CH520 Wireless Headphones',
    category: 'Audio & Headphones',
    brand: 'Sony',
    model: 'WH-CH520',
    color: 'Black',
    imageUrl: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 3600,
    sellingPriceRupees: 4490,
    stockQuantity: 11,
    lowStockThreshold: 3,
  },

  // 3. Cables & Chargers
  {
    name: 'Apple 20W USB-C Power Adapter',
    category: 'Cables & Chargers',
    brand: 'Apple',
    model: 'MHJE3HN/A',
    color: 'White',
    imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 1400,
    sellingPriceRupees: 1900,
    stockQuantity: 30,
    lowStockThreshold: 5,
  },
  {
    name: 'Samsung 25W Type-C Fast Charger',
    category: 'Cables & Chargers',
    brand: 'Samsung',
    model: 'EP-TA800',
    color: 'Black',
    imageUrl: 'https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 850,
    sellingPriceRupees: 1299,
    stockQuantity: 42,
    lowStockThreshold: 8,
  },
  {
    name: 'Anker Nano 30W GaN Fast Charger',
    category: 'Cables & Chargers',
    brand: 'Anker',
    model: '511 Nano 3',
    color: 'White',
    imageUrl: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 1100,
    sellingPriceRupees: 1599,
    stockQuantity: 14,
    lowStockThreshold: 3,
  },
  {
    name: 'boAt Rugged v3 Extra Tough Type-C Cable 1.5m',
    category: 'Cables & Chargers',
    brand: 'boAt',
    model: 'Rugged v3',
    color: 'Black',
    imageUrl: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 160,
    sellingPriceRupees: 349,
    stockQuantity: 55,
    lowStockThreshold: 10,
  },
  {
    name: 'Portronics Konnect 3-in-1 Multi-Cable 1.2m',
    category: 'Cables & Chargers',
    brand: 'Portronics',
    model: 'Konnect 3-in-1',
    color: 'Grey',
    imageUrl: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 190,
    sellingPriceRupees: 399,
    stockQuantity: 40,
    lowStockThreshold: 6,
  },
  {
    name: 'Ambrane 60W Fast Charging Type-C to Type-C Cable',
    category: 'Cables & Chargers',
    brand: 'Ambrane',
    model: 'ACT-60',
    color: 'Black',
    imageUrl: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 140,
    sellingPriceRupees: 299,
    stockQuantity: 3, // LOW STOCK TRIGGER
    lowStockThreshold: 6,
  },

  // 4. Power Banks
  {
    name: 'Mi 20000mAh 18W Fast Charging Power Bank 3i',
    category: 'Power Banks',
    brand: 'Xiaomi',
    model: 'Power Bank 3i',
    color: 'Sandstone Black',
    imageUrl: 'https://images.unsplash.com/photo-1609592426861-5517e57c8d9e?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 1650,
    sellingPriceRupees: 2199,
    stockQuantity: 18,
    lowStockThreshold: 4,
  },
  {
    name: 'URBN 20000mAh 22.5W Super Fast Charging Power Bank',
    category: 'Power Banks',
    brand: 'URBN',
    model: 'UPB202',
    color: 'Camo Green',
    imageUrl: 'https://images.unsplash.com/photo-1624823183493-4e38600c9e6c?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 1400,
    sellingPriceRupees: 1899,
    stockQuantity: 15,
    lowStockThreshold: 3,
  },
  {
    name: 'Ambrane 10000mAh MagSafe Wireless Power Bank',
    category: 'Power Banks',
    brand: 'Ambrane',
    model: 'Aerosync PB-10',
    color: 'Metallic Grey',
    imageUrl: 'https://images.unsplash.com/photo-1618577462036-7c64b6ff9ff0?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 1350,
    sellingPriceRupees: 1999,
    stockQuantity: 8,
    lowStockThreshold: 3,
  },

  // 5. Cases & Covers
  {
    name: 'iPhone 15 Matte Liquid Silicone Case',
    category: 'Cases & Covers',
    brand: 'Caseology',
    model: 'iPhone 15',
    color: 'Midnight Blue',
    imageUrl: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 180,
    sellingPriceRupees: 499,
    stockQuantity: 25,
    lowStockThreshold: 5,
  },
  {
    name: 'Samsung Galaxy S24 Armor Shockproof Bumper Case',
    category: 'Cases & Covers',
    brand: 'Spigen',
    model: 'Galaxy S24',
    color: 'Matte Black',
    imageUrl: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 290,
    sellingPriceRupees: 699,
    stockQuantity: 20,
    lowStockThreshold: 4,
  },
  {
    name: 'OnePlus 12R Sandstone Textured Protective Cover',
    category: 'Cases & Covers',
    brand: 'OnePlus',
    model: '12R',
    color: 'Sandstone Black',
    imageUrl: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 220,
    sellingPriceRupees: 599,
    stockQuantity: 16,
    lowStockThreshold: 3,
  },
  {
    name: 'Redmi Note 13 Clear Shock-Absorption Case',
    category: 'Cases & Covers',
    brand: 'Generic',
    model: 'Note 13',
    color: 'Transparent',
    imageUrl: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 80,
    sellingPriceRupees: 249,
    stockQuantity: 45,
    lowStockThreshold: 8,
  },

  // 6. Screen Protectors
  {
    name: 'iPhone 15 9H Hardness Edge-to-Edge Tempered Glass',
    category: 'Screen Protectors',
    brand: 'Spigen',
    model: 'iPhone 15',
    imageUrl: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 120,
    sellingPriceRupees: 399,
    stockQuantity: 50,
    lowStockThreshold: 10,
  },
  {
    name: 'Samsung Galaxy S24 UV Glue Curved Tempered Glass',
    category: 'Screen Protectors',
    brand: 'CurvedPro',
    model: 'Galaxy S24',
    imageUrl: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 190,
    sellingPriceRupees: 599,
    stockQuantity: 22,
    lowStockThreshold: 5,
  },
  {
    name: 'Universal Anti-Spy Privacy Tempered Glass 6.7"',
    category: 'Screen Protectors',
    brand: 'PrivacyShield',
    model: 'Universal 6.7"',
    imageUrl: 'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 140,
    sellingPriceRupees: 449,
    stockQuantity: 30,
    lowStockThreshold: 6,
  },

  // 7. Accessories
  {
    name: 'Magnetic Car Air Vent Mobile Mount Holder',
    category: 'Accessories',
    brand: 'Portronics',
    model: 'Clamp M',
    color: 'Black',
    imageUrl: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 220,
    sellingPriceRupees: 499,
    stockQuantity: 19,
    lowStockThreshold: 4,
  },
  {
    name: 'Adjustable Aluminum Desktop Phone & Tablet Stand',
    category: 'Accessories',
    brand: 'Ambrane',
    model: 'Torq Stand',
    color: 'Silver',
    imageUrl: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 280,
    sellingPriceRupees: 599,
    stockQuantity: 24,
    lowStockThreshold: 5,
  },
  {
    name: 'OTG Adapter USB Type-C to USB 3.0 Female',
    category: 'Accessories',
    brand: 'Generic',
    model: 'OTG-C',
    color: 'Metallic Grey',
    imageUrl: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 45,
    sellingPriceRupees: 149,
    stockQuantity: 60,
    lowStockThreshold: 12,
  },
  {
    name: '10-inch LED Ring Light with 7ft Tripod Stand',
    category: 'Accessories',
    brand: 'Digitek',
    model: 'DRL-10',
    color: 'Black',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80&auto=format&fit=crop',
    purchasePriceRupees: 650,
    sellingPriceRupees: 1199,
    stockQuantity: 8,
    lowStockThreshold: 2,
  },
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    await connectDB();

    // 1. Seed or update default Settings
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        shopName: 'WTL Mobile & Accessories',
        tagline: 'Smartphones • Audio • Accessories',
        address: 'Shop No. 14, Galaxy Commercial Complex, MG Road',
        contactNumber: '+91 98765 43210',
        email: 'store@wtlmobile.in',
        currency: 'INR',
        currencySymbol: '₹',
        taxEnabled: true,
        taxName: 'GST',
        taxRate: 18,
        invoicePrefix: 'WTL-',
        defaultLowStockThreshold: 5,
        invoiceFooterNote: 'Thank you for shopping with us! Standard manufacturer warranty applies.',
      });
      console.log('⚙️ Default shop settings configured (18% GST enabled, INR)');
    }

    // 2. Seed Shop Owner User
    const existingOwner = await User.findOne({ email: 'owner@wtlmobile.com' });
    let ownerUser = existingOwner;
    if (!existingOwner) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('adminPassword123!', salt);
      ownerUser = await User.create({
        name: 'WTL Store Manager',
        email: 'owner@wtlmobile.com',
        passwordHash,
        role: 'owner',
      });
      console.log('👤 Shop Owner created: owner@wtlmobile.com / adminPassword123!');
    }

    // 3. Clear existing Products and StockAdjustments for clean initial seeding
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log(`📦 Seeding ${sampleProducts.length} realistic mobile products and accessories...`);

      for (const item of sampleProducts) {
        const prod = await Product.create({
          name: item.name,
          category: item.category,
          brand: item.brand,
          model: item.model || '',
          storage: item.storage || '',
          color: item.color || '',
          imageUrl: item.imageUrl || '',
          purchasePrice: rupeesToPaise(item.purchasePriceRupees),
          sellingPrice: rupeesToPaise(item.sellingPriceRupees),
          stockQuantity: item.stockQuantity,
          lowStockThreshold: item.lowStockThreshold,
          isArchived: false,
        });

        // Record initial stock entry
        await StockAdjustment.create({
          productId: prod._id,
          productName: prod.name,
          previousQuantity: 0,
          newQuantity: prod.stockQuantity,
          quantityChange: prod.stockQuantity,
          reason: 'RESTOCK',
          note: 'Initial catalog stock import',
          userId: ownerUser?._id,
        });
      }
      console.log('✅ Products catalogue seeded successfully with audit logs.');
    } else {
      console.log(`ℹ️ Products catalogue already contains ${productCount} items, updating images...`);
    }

    // Ensure all products have their imageUrl synchronized
    console.log('🖼️ Synchronizing product images...');
    for (const item of sampleProducts) {
      if (item.imageUrl) {
        await Product.updateMany(
          { name: item.name, brand: item.brand },
          { $set: { imageUrl: item.imageUrl } }
        );
      }
    }

    // 4. Seed initial sales if no sales exist so that Dashboard and Reports immediately show real data
    const salesCount = await Sale.countDocuments();
    if (salesCount === 0) {
      console.log('🧾 Generating realistic sample completed sales...');

      const allProds = await Product.find({ isArchived: false });
      if (allProds.length > 5) {
        const sampleSalesData = [
          {
            items: [
              { prod: allProds[0], qty: 1 }, // iPhone 15
              { prod: allProds[13], qty: 1 }, // 20W Adapter
              { prod: allProds[23], qty: 1 }, // iPhone case
            ],
            paymentMethod: 'upi',
            customerName: 'Rahul Verma',
            customerPhone: '9876512345',
            discountType: 'none',
            discountValue: 0,
            daysAgo: 2,
          },
          {
            items: [
              { prod: allProds[3], qty: 1 }, // OnePlus 12R
              { prod: allProds[9], qty: 1 }, // Bullets Z2
            ],
            paymentMethod: 'card',
            customerName: 'Priya Sharma',
            customerPhone: '9812345678',
            discountType: 'percentage',
            discountValue: 5,
            daysAgo: 1,
          },
          {
            items: [
              { prod: allProds[10], qty: 1 }, // boAt 450
              { prod: allProds[16], qty: 2 }, // boAt Cable
            ],
            paymentMethod: 'cash',
            customerName: 'Amit Patel',
            customerPhone: '9988776655',
            discountType: 'none',
            discountValue: 0,
            daysAgo: 0, // Today
          },
          {
            items: [
              { prod: allProds[14], qty: 1 }, // Samsung 25W
              { prod: allProds[27], qty: 1 }, // S24 UV glass
            ],
            paymentMethod: 'upi',
            customerName: 'Sneha Rao',
            customerPhone: '9765432109',
            discountType: 'none',
            discountValue: 0,
            daysAgo: 0, // Today
          },
        ];

        let invSeq = 1;
        for (const s of sampleSalesData) {
          const saleDate = new Date();
          saleDate.setDate(saleDate.getDate() - s.daysAgo);

          let subtotal = 0;
          const lineItems = s.items.map((i) => {
            const lineTotal = i.prod.sellingPrice * i.qty;
            subtotal += lineTotal;
            return {
              productId: i.prod._id as mongoose.Types.ObjectId,
              name: i.prod.name,
              brand: i.prod.brand,
              model: i.prod.model || '',
              storage: i.prod.storage || '',
              color: i.prod.color || '',
              unitPrice: i.prod.sellingPrice,
              purchaseCost: i.prod.purchasePrice,
              quantity: i.qty,
              lineTotal,
            };
          });

          const discountAmount =
            s.discountType === 'percentage'
              ? Math.round((subtotal * s.discountValue) / 100)
              : 0;

          const taxable = subtotal - discountAmount;
          const taxRate = settings.taxEnabled ? settings.taxRate : 0;
          const taxAmount = settings.taxEnabled ? Math.round((taxable * taxRate) / 100) : 0;
          const finalAmount = taxable + taxAmount;

          const yyyy = saleDate.getFullYear();
          const mm = String(saleDate.getMonth() + 1).padStart(2, '0');
          const invoiceNumber = `WTL-${yyyy}${mm}-${String(invSeq).padStart(5, '0')}`;
          invSeq++;

          await Sale.create({
            invoiceNumber,
            date: saleDate,
            items: lineItems,
            subtotal,
            discountType: s.discountType as 'percentage' | 'fixed' | 'none',
            discountValue: s.discountValue,
            discountAmount,
            taxRate,
            taxAmount,
            finalAmount,
            paymentMethod: s.paymentMethod as 'cash' | 'upi' | 'card' | 'other',
            customerName: s.customerName,
            customerPhone: s.customerPhone,
            status: 'completed',
            createdBy: ownerUser?._id,
            notes: 'Sample verified sale',
          });
        }
        console.log('✅ Sample sales seeded successfully.');
      }
    }

    console.log('🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

seedDatabase();
