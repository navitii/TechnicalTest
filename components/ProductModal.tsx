'use client';

import { Product, ModifierGroup, ModifierOption } from '@/types';
import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { X } from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, modifiers: { groupId: string; optionId: string }[], quantity: number) => void;
}

export default function ProductModal({ product, isOpen, onClose, onAddToCart }: ProductModalProps) {
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);

  if (!isOpen || !product) return null;

  const handleToggleModifier = (group: ModifierGroup, optionId: string) => {
    setSelectedModifiers(prev => {
      const current = prev[group.id] || [];
      const isSelected = current.includes(optionId);

      if (group.maxSelection === 1) {
        // Radio behavior
        return { ...prev, [group.id]: [optionId] };
      } else {
        // Checkbox behavior
        if (isSelected) {
          return { ...prev, [group.id]: current.filter(id => id !== optionId) };
        } else {
          if (current.length < group.maxSelection) {
            return { ...prev, [group.id]: [...current, optionId] };
          }
          return prev; // Max reached
        }
      }
    });
  };

  const calculateTotal = () => {
    let total = product.basePriceCents;
    product.modifierGroups.forEach(group => {
      const selectedIds = selectedModifiers[group.id] || [];
      selectedIds.forEach(optId => {
        const opt = group.options.find(o => o.id === optId);
        if (opt) total += opt.priceCents;
      });
    });
    return total * quantity;
  };

  const isValid = () => {
    return product.modifierGroups.every(group => {
      const count = (selectedModifiers[group.id] || []).length;
      return count >= group.minSelection && count <= group.maxSelection;
    });
  };

  const handleSubmit = () => {
    const flattenedModifiers: { groupId: string; optionId: string }[] = [];
    Object.entries(selectedModifiers).forEach(([groupId, optionIds]) => {
      optionIds.forEach(optionId => {
        flattenedModifiers.push({ groupId, optionId });
      });
    });
    onAddToCart(product, flattenedModifiers, quantity);
    onClose();
    setSelectedModifiers({});
    setQuantity(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"  onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col" style={{backgroundColor: "#F6EFE3"}} onClick={(e) => e.stopPropagation()}>
        <div className="relative h-48 bg-gray-200 shrink-0">
             {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          <button onClick={onClose} className="absolute top-4 right-4 bg-white/80 p-2 rounded-full hover:bg-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 flex-1">
          <h2 className="text-2xl font-bold">{product.name}</h2>
          <p className="text-gray-600 mt-2">{product.description}</p>
          <p style={{backgroundColor: "#FABF0D", color: "#AF1D1D", width: "100px", textAlign: "center"}} className="text-lg font-semibold bg-gray-100 px-2 py-1 rounded mt-2">{formatCurrency(product.basePriceCents)}</p>

          <div className="mt-6 space-y-6">
            {product.modifierGroups.map(group => (
              <div key={group.id}>
                <h3 className="font-semibold text-gray-900">
                  {group.name}
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({group.minSelection === 1 && group.maxSelection === 1 ? 'Required' : `Choose up to ${group.maxSelection}`})
                  </span>
                </h3>
                <div className="mt-2 space-y-2">
                  {group.options.map(option => {
                    const isSelected = (selectedModifiers[group.id] || []).includes(option.id);
                    return (
                      <label key={option.id} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer" style={{border: "2px solid #AF1D1D"}}>
                        <div className="flex items-center">
                          <input
                            type={group.maxSelection === 1 ? 'radio' : 'checkbox'}
                            name={group.id}
                            checked={isSelected}
                            onChange={() => handleToggleModifier(group, option.id)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="ml-3">{option.name}</span>
                        </div>
                        {option.priceCents > 0 && (
                          <span className="text-gray-500">+{formatCurrency(option.priceCents)}</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-gray-50 shrink-0" style={{backgroundColor: "#F6EFE3"}}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center rounded-lg bg-white" style={{border: "1px solid #AF1D1D", backgroundColor: "#F6EFE3"}}>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-1" style={{cursor: "pointer"}}>-</button>
              <span className="px-3 font-medium">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-1" style={{cursor: "pointer"}}>+</button>
            </div>
            <div style={{backgroundColor: "#FABF0D", color: "#AF1D1D", width: "100px", textAlign: "center", padding: "3px"}} className="text-xl font-bold rounded">{formatCurrency(calculateTotal())}</div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!isValid()}
            className="w-full text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors add-to-cart-button"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
