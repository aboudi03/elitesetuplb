interface Product {
  id: string;
  slug?: string | null;
  title?: string | null;
  model: string;
  sku?: string | null;
  price: number;
  rating: number;
  description?: string | null;
  mainImage?: string | null;
  manufacturer?: string | null;
  colors?: string | null;
  sizes?: string | null;
  categoryId: string | null;
  category?: { name: string } | null;
  inStock: number;
  isActive: boolean;
  featured?: boolean;
  featuredSortOrder?: number | null;
  cost?: number;
  taxRate?: number;
  merchantId?: string | null;
  merchant?: { id: string; name: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

interface Merchant {
  id: string;
  name: string;
  email: string;
  description: string;
  phone: string;
  address: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

interface SingleProductPageProps {
  params: {
    id: string;
    productSlug: string;
  };
}

type ProductInWishlist = {
  id: string;
  title: string;
  price: number;
  image: string;
  slug: string;
  stockAvailabillity: number;
};

interface OtherImages {
  imageID: string;
  productID: string;
  image: string;
  sortOrder?: number;
}

interface Category {
  id: string;
  name: string;
  menuImage?: string | null;
  parentId?: string | null;
  parent?: { id: string; name: string } | null;
  children?: Category[];
  sortOrder?: number;
  _count?: {
    children?: number;
    products?: number;
  };
}

interface User {
  id: string;
  email: string;
  password: string | null;
  role: string;
}

interface Order {
  id: string;
  orderNumber?: number | null;
  adress: string;
  apartment: string;
  company: string;
  dateTime: string;
  email: string;
  lastname: string;
  name: string;
  phone: string;
  postalCode?: string;
  status: string;
  city: string;
  country?: string;
  deliveryZoneId?: string | null;
  deliveryFee?: number;
  grandTotal?: number | null;
  orderNotice: string?;
  total: number;
  failedHistoryCount?: number;
  cancelledHistoryCount?: number;
}

interface FeaturedBrand {
  id: string;
  title: string;
  logo: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  products: Array<{
    id: string;
    sortOrder: number;
    productId: string;
    product: Product;
  }>;
}

interface DealProduct {
  id: string;
  productId: string;
  sortOrder: number;
  product: Product;
}

interface Deal {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  specialPrice: number;
  originalPrice?: number;
  savings?: number;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  sortOrder: number;
  products: DealProduct[];
  createdAt?: string;
  updatedAt?: string;
}

interface ProductBannerTargetProduct {
  id: string;
  productId: string;
  product?: Pick<Product, "id" | "title" | "model" | "mainImage">;
}

interface ProductBannerTargetCategory {
  id: string;
  categoryId: string;
  category?: Pick<Category, "id" | "name">;
}

interface ProductBanner {
  id: string;
  title: string;
  image: string;
  altText?: string | null;
  scopeType: "ALL" | "PRODUCTS" | "CATEGORIES";
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  sortOrder: number;
  products: ProductBannerTargetProduct[];
  categories: ProductBannerTargetCategory[];
  productIds?: string[];
  categoryIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface SingleProductBtnProps {
  product: Product;
  quantityCount: number;
  selectedColor?: string;
  selectedSize?: string;
}


interface WishListItem {
  id: string;
  userId: string;
  productId: string;
  product: Product;
}


declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image: string;
      role: string;
    };
  }

  interface User {
    id: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

interface Window {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
}
