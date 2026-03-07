'use client';

import { useEffect, useRef, useState } from 'react';
import { Product, Cart } from '@/types';
import { formatCurrency } from '@/lib/utils';
import ProductModal from '@/components/ProductModal';
import CartSheet from '@/components/CartSheet';
import { Hamburger, ShoppingBag } from 'lucide-react';

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);

  const fetchCart = () => {
    fetch('/api/cart').then(res => res.json()).then(setCart);
  };

  const handleExploreClick = () => {
    if (menuRef.current) {
      menuRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    fetch('/api/menu').then(res => res.json()).then(setProducts);
    fetchCart();
  }, []);

  const addToCart = async (product: Product, modifiers: { groupId: string; optionId: string }[], quantity: number) => {
    await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id, modifiers, quantity }),
    });
    fetchCart();
    setIsCartOpen(true);
  };

  const removeFromCart = async (itemId: string) => {
    await fetch(`/api/cart/${itemId}`, { method: 'DELETE' });
    fetchCart();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20" style={{backgroundColor: "#F6EFE3"}}>
      <header className="bg-white sticky top-0 z-10 restaurant-header">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
            <Hamburger style={{color: "#AF1D1D"}}/>
            <h1 style={{color: '#AF1D1D'}} className="text-xl font-bold tracking-tight">Navi Burger</h1>
          </div>
          <button 
            onClick={() => setIsCartOpen(true)}
            style={{cursor: "pointer"}}
            className="relative p-2 hover:bg-yellow-100 rounded-full"
          >
            <ShoppingBag style={{color: "#AF1D1D"}} />
            {cart && cart.items.length > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {cart.items.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className='promotion-container'>
        <div style={{display: "flex", flexDirection: "column", gap: "10px"}}>
          <h1 style={{ color: "white", fontSize: "5rem", lineHeight: 1.2, fontWeight: "bold", textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }} className="">
            Order Your<br />
            Favorites in<br />
            Minutes
          </h1>
          <span style={{color: "#FAFFFA", marginTop: "10px"}}>The best burgers here at navi burger Lorem ipsum dolor sit amet<br/> consectetur adipisicing elit.</span>
          <div className='explore-button' onClick={handleExploreClick}>Explore Now</div>
        </div>
        <img src="https://png.pngtree.com/png-vector/20240829/ourmid/pngtree-delicious-and-testy-cheese-burger-png-image_13659847.png" alt="Promotion"  />
      </div>

      <main ref={menuRef} className="max-w-5xl mx-auto px-4 py-8 menu-container">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div 
              key={product.id} 
              className="product-card"
              onClick={() => setSelectedProduct(product)}
            >
              <div className="h-48 overflow-hidden">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 product-image"
                  style={{ borderRadius: "15px 15px 0 0" }}
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg">{product.name}</h3>
                  <span className="font-medium bg-gray-100 px-2 py-1 rounded text-sm" style={{backgroundColor: "#FABF0D", color: "#AF1D1D"}}>
                    {formatCurrency(product.basePriceCents)}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mt-2 line-clamp-2">{product.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <ProductModal 
        product={selectedProduct} 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        onAddToCart={addToCart}
      />

      <CartSheet 
        cart={cart} 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)}
        onRemoveItem={removeFromCart}
      />
    </div>
  );
}
