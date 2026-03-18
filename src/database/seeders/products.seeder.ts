import { DataSource } from 'typeorm';
import { Product } from '../../subscription-plans/entities/product.entity';
import { SubscriptionPlan } from '../../subscription-plans/entities/subscription-plan.entity';

// ── Seed data ────────────────────────────────────────────────────────────────

type ProductSeed = Omit<Product, 'id' | 'plans'>;

const PRODUCT_SEEDS: Record<string, ProductSeed[]> = {
  'The Wellness Box': [
    {
      name: 'Lavender Foam Cleanser',
      description: 'A gentle foaming cleanser infused with lavender extract to soothe and refresh skin.',
      category: 'Skincare',
      price: 4.99,
      image_url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&q=80',
      sku: 'LFC-001',
      weight_kg: 0.25,
      dimensions: '10x5x3 cm',
    },
    {
      name: 'Organic Rosehip Face Oil',
      description: 'Cold-pressed rosehip oil rich in vitamins A and C to brighten and hydrate.',
      category: 'Skincare',
      price: 8.99,
      image_url: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80',
      sku: 'ORF-002',
      weight_kg: 0.12,
      dimensions: '5x5x8 cm',
    },
    {
      name: 'Eucalyptus Body Scrub',
      description: 'Invigorating sugar scrub with eucalyptus oil to exfoliate and revive tired skin.',
      category: 'Body Care',
      price: 5.99,
      image_url: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&q=80',
      sku: 'EBS-003',
      weight_kg: 0.35,
      dimensions: '9x6x4 cm',
    },
    {
      name: 'Chamomile Sleep Tea (12 bags)',
      description: 'Caffeine-free chamomile blend to support relaxation and restful sleep.',
      category: 'Wellness',
      price: 3.49,
      image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80',
      sku: 'CST-004',
      weight_kg: 0.08,
      dimensions: '15x8x4 cm',
    },
    {
      name: 'Bamboo Facial Rounds (50pk)',
      description: 'Reusable and washable bamboo rounds — a sustainable swap for cotton pads.',
      category: 'Accessories',
      price: 2.99,
      image_url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80',
      sku: 'BFR-005',
      weight_kg: 0.11,
      dimensions: '12x12x4 cm',
    },
    {
      name: 'Peppermint Foot Balm',
      description: 'Cooling peppermint balm that soothes aching feet and softens rough heels.',
      category: 'Body Care',
      price: 6.49,
      image_url: 'https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=400&q=80',
      sku: 'PFB-006',
      weight_kg: 0.18,
      dimensions: '7x7x5 cm',
    },
  ],

  'Eco-Home Essentials': [
    {
      name: 'Beeswax Reusable Wraps (3pk)',
      description: 'Plastic-free food wraps made from organic cotton and beeswax — dishwasher safe.',
      category: 'Kitchen',
      price: 9.99,
      image_url: 'https://images.unsplash.com/photo-1611735341450-74d61e660ad2?w=400&q=80',
      sku: 'BRW-007',
      weight_kg: 0.15,
      dimensions: '20x15x1 cm',
    },
    {
      name: 'Bamboo Dish Brush Set',
      description: 'Natural bamboo handle brushes with sisal bristles, biodegradable and long-lasting.',
      category: 'Kitchen',
      price: 7.49,
      image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
      sku: 'BDB-008',
      weight_kg: 0.22,
      dimensions: '25x5x5 cm',
    },
    {
      name: 'Castile Soap Bar',
      description: 'Pure olive-oil castile bar free from sulfates, parabens, and synthetic fragrance.',
      category: 'Cleaning',
      price: 4.49,
      image_url: 'https://images.unsplash.com/photo-1607006483224-17433168dc6f?w=400&q=80',
      sku: 'CSB-009',
      weight_kg: 0.12,
      dimensions: '9x5x2 cm',
    },
    {
      name: 'Linen Produce Bags (5pk)',
      description: 'Lightweight organic linen bags for zero-waste grocery shopping.',
      category: 'Kitchen',
      price: 8.99,
      image_url: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&q=80',
      sku: 'LPB-010',
      weight_kg: 0.09,
      dimensions: '30x25x1 cm',
    },
    {
      name: 'Glass Spray Bottle 500ml',
      description: 'Amber borosilicate glass spray bottle — refillable and UV-protective for DIY cleaners.',
      category: 'Cleaning',
      price: 11.99,
      image_url: 'https://images.unsplash.com/photo-1514996937319-344454492b37?w=400&q=80',
      sku: 'GSB-011',
      weight_kg: 0.38,
      dimensions: '26x7x7 cm',
    },
    {
      name: 'Wool Dryer Balls (4pk)',
      description: 'New Zealand wool dryer balls that reduce drying time and soften laundry naturally.',
      category: 'Laundry',
      price: 12.99,
      image_url: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=400&q=80',
      sku: 'WDB-012',
      weight_kg: 0.35,
      dimensions: '18x12x8 cm',
    },
  ],

  "Gamer's Loot": [
    {
      name: 'RGB Keycap Puller Tool',
      description: 'Wire keycap puller with ergonomic grip for safe keyboard customisation.',
      category: 'Accessories',
      price: 6.99,
      image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80',
      sku: 'RKP-013',
      weight_kg: 0.05,
      dimensions: '8x4x2 cm',
    },
    {
      name: 'Gaming Thumb Grips (4pk)',
      description: 'High-friction silicone thumb grips for PS and Xbox controllers.',
      category: 'Accessories',
      price: 4.99,
      image_url: 'https://images.unsplash.com/photo-1592840062661-a5a7f78e2056?w=400&q=80',
      sku: 'GTG-014',
      weight_kg: 0.06,
      dimensions: '10x5x2 cm',
    },
    {
      name: 'Braided USB-C Cable 2m',
      description: 'Heavy-duty nylon braided USB-C cable with 60W fast-charge support.',
      category: 'Cables',
      price: 7.99,
      image_url: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&q=80',
      sku: 'BUC-015',
      weight_kg: 0.11,
      dimensions: '20x8x3 cm',
    },
    {
      name: 'Energy Drink Powder Sachets (5pk)',
      description: 'Sugar-free gaming fuel with B-vitamins, caffeine, and electrolytes.',
      category: 'Snacks',
      price: 8.49,
      image_url: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=400&q=80',
      sku: 'EDP-016',
      weight_kg: 0.12,
      dimensions: '15x10x2 cm',
    },
    {
      name: 'Screen Cleaning Kit',
      description: 'Microfiber cloth and streak-free spray solution for monitors and headsets.',
      category: 'Accessories',
      price: 5.49,
      image_url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&q=80',
      sku: 'SCK-017',
      weight_kg: 0.09,
      dimensions: '12x7x5 cm',
    },
    {
      name: 'Cable Management Clips (10pk)',
      description: 'Adhesive desk cable clips to keep your gaming setup tidy.',
      category: 'Accessories',
      price: 3.99,
      image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80',
      sku: 'CMC-018',
      weight_kg: 0.04,
      dimensions: '10x5x2 cm',
    },
  ],

  'Snack Stash Express': [
    {
      name: 'Sea Salt Dark Chocolate Bar',
      description: '70% cacao single-origin dark chocolate finished with flaky sea salt.',
      category: 'Chocolate',
      price: 3.99,
      image_url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&q=80',
      sku: 'SDC-019',
      weight_kg: 0.10,
      dimensions: '15x8x1 cm',
    },
    {
      name: 'Roasted Chickpea Mix 120g',
      description: 'Smoky paprika roasted chickpeas — a high-protein crunchy snack.',
      category: 'Savory',
      price: 2.99,
      image_url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&q=80',
      sku: 'RCM-020',
      weight_kg: 0.13,
      dimensions: '16x10x4 cm',
    },
    {
      name: 'Matcha Almond Granola Bar',
      description: 'Chewy oat bar with ceremonial matcha, toasted almonds, and honey.',
      category: 'Bars',
      price: 2.49,
      image_url: 'https://images.unsplash.com/photo-1605789538467-f715d58e03f9?w=400&q=80',
      sku: 'MAG-021',
      weight_kg: 0.07,
      dimensions: '14x5x1 cm',
    },
    {
      name: 'Spicy Mango Fruit Leather',
      description: 'All-natural mango fruit leather dusted with tajín-style chili salt.',
      category: 'Fruit Snacks',
      price: 1.99,
      image_url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=80',
      sku: 'SMF-022',
      weight_kg: 0.04,
      dimensions: '15x5x0.5 cm',
    },
    {
      name: 'Mixed Berry Trail Mix 100g',
      description: 'A blend of dried blueberries, cranberries, cashews, and pumpkin seeds.',
      category: 'Trail Mix',
      price: 3.49,
      image_url: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=400&q=80',
      sku: 'MBT-023',
      weight_kg: 0.11,
      dimensions: '14x9x4 cm',
    },
    {
      name: 'Oat & Honey Biscuits (6pk)',
      description: 'Lightly sweetened whole grain oat biscuits baked with raw honey.',
      category: 'Biscuits',
      price: 2.79,
      image_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80',
      sku: 'OHB-024',
      weight_kg: 0.16,
      dimensions: '18x10x5 cm',
    },
  ],

  'Glow Ritual Box': [
    {
      name: 'Vitamin C Brightening Serum',
      description: '15% L-ascorbic acid serum to even skin tone and boost radiance.',
      category: 'Serums',
      price: 12.99,
      image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80',
      sku: 'VCB-025',
      weight_kg: 0.05,
      dimensions: '4x4x10 cm',
    },
    {
      name: 'Hyaluronic Acid Moisturiser',
      description: 'Lightweight gel moisturiser with multi-weight hyaluronic acid for all-day hydration.',
      category: 'Moisturisers',
      price: 9.99,
      image_url: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400&q=80',
      sku: 'HAM-026',
      weight_kg: 0.07,
      dimensions: '5x5x9 cm',
    },
    {
      name: 'Rose Quartz Gua Sha Tool',
      description: 'Genuine rose quartz gua sha for facial massage to reduce puffiness and sculpt.',
      category: 'Tools',
      price: 15.99,
      image_url: 'https://images.unsplash.com/photo-1601049541271-f68d5ec1a75f?w=400&q=80',
      sku: 'RQG-027',
      weight_kg: 0.08,
      dimensions: '10x5x0.5 cm',
    },
    {
      name: 'Collagen Eye Patches (5 pairs)',
      description: 'Hydrogel eye patches infused with collagen and niacinamide to reduce dark circles.',
      category: 'Eye Care',
      price: 6.49,
      image_url: 'https://images.unsplash.com/photo-1590156206657-aec4e9c62b23?w=400&q=80',
      sku: 'CEP-028',
      weight_kg: 0.03,
      dimensions: '12x8x1 cm',
    },
    {
      name: 'SPF30 Face Mist 100ml',
      description: 'Lightweight refreshing mist with broad-spectrum SPF30 and nourishing aloe vera.',
      category: 'Sun Care',
      price: 11.99,
      image_url: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&q=80',
      sku: 'FMS-029',
      weight_kg: 0.14,
      dimensions: '8x4x4 cm',
    },
    {
      name: 'Micellar Cleansing Water 150ml',
      description: 'No-rinse micellar water that gently removes makeup, SPF, and impurities.',
      category: 'Cleansers',
      price: 5.99,
      image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80',
      sku: 'MCW-030',
      weight_kg: 0.17,
      dimensions: '6x6x14 cm',
    },
  ],
};

// ── Seeder function ───────────────────────────────────────────────────────────

export async function seedProducts(dataSource: DataSource): Promise<void> {
  const productRepository = dataSource.getRepository(Product);
  const planRepository = dataSource.getRepository(SubscriptionPlan);

  console.log('🌱 Seeding products...');

  // Build a sku → Product map for upsert-style logic
  const allSkus = Object.values(PRODUCT_SEEDS).flat().map((p) => p.sku!);
  const existingProducts = await productRepository.findBy(
    allSkus.map((sku) => ({ sku })),
  );
  const existingSkuMap = new Map(existingProducts.map((p) => [p.sku, p]));

  // Upsert all products and build a sku → saved Product map
  const savedProductsBySku = new Map<string, Product>();

  for (const seeds of Object.values(PRODUCT_SEEDS)) {
    for (const seed of seeds) {
      const existing = existingSkuMap.get(seed.sku!);
      if (existing) {
        savedProductsBySku.set(existing.sku!, existing);
        continue;
      }
      const created = productRepository.create(seed);
      const saved = await productRepository.save(created);
      savedProductsBySku.set(saved.sku!, saved);
      console.log(`  ✅ Created product: ${saved.name} (${saved.sku})`);
    }
  }

  console.log(`\n📦 Assigning products to plans...`);

  for (const [planName, seeds] of Object.entries(PRODUCT_SEEDS)) {
    // All billing-cycle variants share the same product list
    const plans = await planRepository.find({
      where: { name: planName },
      relations: ['products'],
    });

    if (plans.length === 0) {
      console.log(`  ⚠️  No plans found for "${planName}" — skipping`);
      continue;
    }

    const planProducts = seeds
      .map((s) => savedProductsBySku.get(s.sku!))
      .filter((p): p is Product => p !== undefined);

    for (const plan of plans) {
      const existingIds = new Set(plan.products.map((p) => p.id));
      const toAdd = planProducts.filter((p) => !existingIds.has(p.id));

      if (toAdd.length === 0) {
        continue;
      }

      plan.products = [...plan.products, ...toAdd];
      await planRepository.save(plan);
      console.log(
        `  ✅ "${planName}" (${plan.frequency_in_days}d) → added ${toAdd.length} product(s)`,
      );
    }
  }

  console.log('\n✅ Products seeder complete.');
}

// ── Run standalone ────────────────────────────────────────────────────────────

if (require.main === module) {
  const { AppDataSource } = require('../../config/database.config');

  AppDataSource.initialize()
    .then(async (dataSource: DataSource) => {
      await seedProducts(dataSource);
      await dataSource.destroy();
    })
    .catch((error: Error) => console.error('Products seeder error:', error));
}
