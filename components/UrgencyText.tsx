// *********************
// IN DEVELOPMENT
// *********************

import React from "react";

const UrgencyText = ({ stock }: { stock: number }) => {
  return (
    <p className="text-lg font-semibold text-red-600 max-[500px]:text-base">
      Hurry up! only {stock} products left in stock!
    </p>
  );
};

export default UrgencyText;
