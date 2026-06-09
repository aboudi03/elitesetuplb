// *********************
// Role of the component: Quantity input for incrementing and decrementing product quantity on the single product page
// Name of the component: QuantityInput.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <QuantityInput quantityCount={quantityCount} setQuantityCount={setQuantityCount} />
// Input parameters: QuantityInputProps interface
// Output: one number input and two buttons
// *********************

"use client";

import React from "react";
import { FaPlus } from "react-icons/fa6";
import { FaMinus } from "react-icons/fa6";

interface QuantityInputProps {
  quantityCount: number;
  setQuantityCount: React.Dispatch<React.SetStateAction<number>>;
  maxQuantity?: number;
}

const QuantityInput = ({quantityCount, setQuantityCount, maxQuantity} : QuantityInputProps) => {


  const handleQuantityChange = (actionName: string): void => {
    if (actionName === "plus" && (!maxQuantity || quantityCount < maxQuantity)) {
      setQuantityCount(quantityCount + 1);
    } else if (actionName === "minus" && quantityCount !== 1) {
      setQuantityCount(quantityCount - 1);
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-x-4">
      <p className="text-lg font-semibold sm:text-xl">Quantity:</p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          className="size-10 leading-10 text-gray-600 transition hover:opacity-75 flex justify-center items-center border"
          onClick={() => handleQuantityChange("minus")}
        >
          <FaMinus />
        </button>

        <input
          type="number"
          id="Quantity"
          disabled={true}
          value={quantityCount}
          className="h-10 w-24 rounded border-gray-200 sm:text-sm"
        />

        <button
          type="button"
          className="size-10 leading-10 text-gray-600 transition hover:opacity-75 flex justify-center items-center border"
          onClick={() => handleQuantityChange("plus")}
          disabled={Boolean(maxQuantity && quantityCount >= maxQuantity)}
        >
          <FaPlus />
        </button>
      </div>
    </div>
  );
};

export default QuantityInput;
