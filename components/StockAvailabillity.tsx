// *********************
// Role of the component: Stock availability component for displaying current stock status of the product
// Name of the component: StockAvailabillity.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <StockAvailabillity stock={stock} inStock={inStock} />
// Input parameters: { stock: number, inStock: number }
// Output: styled text that displays current stock status on the single product page
// *********************

import React from 'react'
import { FaCheck } from 'react-icons/fa6'
import { FaXmark } from "react-icons/fa6";


const StockAvailabillity = ({ stock, inStock } : { stock: number, inStock: number }) => {
  const availableQuantity = Number(inStock || stock || 0);
  const shouldShowExactStock = availableQuantity > 0 && availableQuantity <= 5;

  return (
    <p className='flex gap-x-2 text-xl max-[500px]:justify-center'>Availability:
    { availableQuantity > 0 ? (
      <span className='flex items-center gap-x-1 text-success'>
        {shouldShowExactStock ? `In stock (${availableQuantity} available)` : "In stock"} <FaCheck />
      </span>
    ) : (
      <span className='flex items-center gap-x-1 text-error'>Out of stock <FaXmark /></span>
    )}
    </p>
  )
}

export default StockAvailabillity
