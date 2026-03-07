import { Product, Cart, Order, TimelineEvent, EventType, CartItem } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// --- In-Memory Storage ---
class InMemoryDB {
  products: Product[] = [];
  carts: Map<string, Cart> = new Map(); // userId -> Cart
  orders: Map<string, Order> = new Map(); // orderId -> Order
  events: TimelineEvent[] = [];

  constructor() {
    this.seedProducts();
  }

  private seedProducts() {
    const createModifiers = (hasProtein: boolean): any[] => {
      const groups = [];
      if (hasProtein) {
        groups.push({
          id: 'protein',
          name: 'Protein',
          minSelection: 1,
          maxSelection: 1,
          options: [
            { id: 'p1', name: 'Chicken', priceCents: 0 },
            { id: 'p2', name: 'Beef', priceCents: 200 },
            { id: 'p3', name: 'Tofu', priceCents: 0 },
          ]
        });
      }
      groups.push({
        id: 'toppings',
        name: 'Toppings',
        minSelection: 0,
        maxSelection: 5,
        options: [
          { id: 't1', name: 'Cheese', priceCents: 100 },
          { id: 't2', name: 'Lettuce', priceCents: 0 },
          { id: 't3', name: 'Tomato', priceCents: 0 },
          { id: 't4', name: 'Onion', priceCents: 0 },
          { id: 't5', name: 'Avocado', priceCents: 150 },
        ]
      });
      groups.push({
        id: 'sauces',
        name: 'Sauces',
        minSelection: 0,
        maxSelection: 3,
        options: [
          { id: 's1', name: 'Mayo', priceCents: 0 },
          { id: 's2', name: 'Spicy Mayo', priceCents: 50 },
          { id: 's3', name: 'BBQ', priceCents: 50 },
        ]
      });
      return groups;
    };

    this.products = [
      { id: 'prod_1', name: 'Classic Burger', description: 'Juicy beef patty with classic fixings.', basePriceCents: 1200, imageUrl: 'https://bigtwinsburger.com/wp-content/uploads/2024/10/12-2000x1200.jpg', modifierGroups: createModifiers(true) },
      { id: 'prod_2', name: 'Chicken Sandwich', description: 'Crispy chicken breast on a bun.', basePriceCents: 1100, imageUrl: 'https://somethingaboutsandwiches.com/wp-content/uploads/2022/02/bacon-chicken-sandwich.jpg', modifierGroups: createModifiers(true) },
      { id: 'prod_3', name: 'Veggie Bowl', description: 'Healthy greens and grains.', basePriceCents: 1000, imageUrl: 'https://data.thefeedfeed.com/static/2019/10/16/15712654875da79bcfdad05.jpg', modifierGroups: createModifiers(false) },
      { id: 'prod_4', name: 'Spicy Tacos', description: 'Three soft tacos with salsa.', basePriceCents: 1300, imageUrl: 'https://familiakitchen.com/wp-content/uploads/2021/01/iStock-960337396-3beef-barbacoa-tacos-e1695391119564.jpg', modifierGroups: createModifiers(true) },
      { id: 'prod_5', name: 'Fries', description: 'Golden crispy fries.', basePriceCents: 400, imageUrl: 'https://www.allrecipes.com/thmb/8_B6OD1w6h1V0zPi8KAGzD41Kzs=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/50223-homemade-crispy-seasoned-french-fries-VAT-Beauty-4x3-789ecb2eaed34d6e879b9a93dd56a50a.jpg', modifierGroups: [] },
      { id: 'prod_6', name: 'Soda', description: 'Refreshing carbonated beverage.', basePriceCents: 250, imageUrl: 'https://www.shutterstock.com/image-photo/full-size-cocacola-plastic-bottle-600nw-2642734713.jpg', modifierGroups: [] },
    ];
  }
}

// Singleton instance
const globalForDb = globalThis as unknown as { db: InMemoryDB };
const db = globalForDb.db || new InMemoryDB();

if (process.env.NODE_ENV !== 'production') globalForDb.db = db;

// --- Repository Functions ---

export const getProducts = async () => db.products;
export const getProductById = async (id: string) => db.products.find(p => p.id === id);

export const getCart = async (userId: string): Promise<Cart> => {
  if (!db.carts.has(userId)) {
    db.carts.set(userId, {
      userId,
      items: [],
      pricing: { subtotalCents: 0, taxCents: 0, serviceFeeCents: 0, totalCents: 0 }
    });
  }
  return db.carts.get(userId)!;
};

export const saveCart = async (cart: Cart) => {
  db.carts.set(cart.userId, cart);
  return cart;
};

export const createOrder = async (order: Order) => {
  db.orders.set(order.id, order);
  return order;
};

export const getOrder = async (orderId: string) => db.orders.get(orderId);

export const getOrderByIdempotencyKey = async (key: string) => {
  for (const order of db.orders.values()) {
    if (order.idempotencyKey === key) return order;
  }
  return null;
};

export const addEvent = async (event: Omit<TimelineEvent, 'eventId' | 'timestamp'>) => {
  const newEvent: TimelineEvent = {
    ...event,
    eventId: uuidv4(),
    timestamp: new Date().toISOString(),
  };
  db.events.push(newEvent);
  return newEvent;
};

export const getEventsByOrderId = async (orderId: string) => {
  return db.events
    .filter(e => e.orderId === orderId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

// --- Business Logic Helpers ---

export const calculateCartPricing = (items: CartItem[]) => {
  const subtotalCents = items.reduce((sum, item) => sum + item.totalPriceCents, 0);
  const taxCents = Math.round(subtotalCents * 0.10); // 10% tax
  const serviceFeeCents = items.length > 0 ? 200 : 0; // Flat $2.00 fee if cart not empty
  const totalCents = subtotalCents + taxCents + serviceFeeCents;
  
  return { subtotalCents, taxCents, serviceFeeCents, totalCents };
};
