type ProductPrice = {
  price: number;
  salePrice?: number | null;
};

export const getValidSalePrice = (product: ProductPrice) => {
  const regularPrice = Number(product.price || 0);
  const salePrice = Number(product.salePrice);

  return Number.isFinite(salePrice) && salePrice > 0 && salePrice < regularPrice
    ? salePrice
    : null;
};

export const getEffectiveProductPrice = (product: ProductPrice) =>
  getValidSalePrice(product) ?? Number(product.price || 0);
