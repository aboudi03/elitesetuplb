"use client";
import Link from "next/link";
import Image from "next/image";
import { FaTrash } from "react-icons/fa";
import { useWishlistStore } from "@/app/_zustand/wishlistStore";
import apiClient from "@/lib/api";
import { useSession } from "next-auth/react";

interface WishItemProps {
  id: string;
  title: string;
  price: number;
  image: string;
  slug: string;
  stockAvailabillity: number;
}

type SessionUserWithId = {
  id?: string;
};

const WishItem = ({
  id,
  title,
  price,
  image,
  slug,
  stockAvailabillity,
}: WishItemProps) => {
  const { data: session } = useSession();
  const { wishlist, setWishlist } = useWishlistStore();
  const sessionUser = session?.user as SessionUserWithId | undefined;

  const removeFromWishlist = async () => {
    try {
      if (sessionUser?.id) {
        await apiClient.delete(
          `/api/wishlist/${sessionUser.id}/${id}`,
          { cache: "no-store" }
        );

        const updatedWishlist = wishlist.filter((item) => item.id !== id);
        setWishlist(updatedWishlist);
      }
    } catch (error) {
      console.error("Error removing item from wishlist:", error);
    }
  };

  return (
    <tr className="hover:bg-base-200">
      <td>
        <input type="checkbox" className="checkbox" />
      </td>
      <td>
        <div className="flex items-center gap-3">
          {image && (
            <Image
              src={image}
              alt={title}
              width={50}
              height={50}
              className="rounded"
            />
          )}
        </div>
      </td>
      <td>
        <Link href={`/product/${slug}`} className="text-blue-500 hover:underline">
          {title}
        </Link>
      </td>
      <td>
        <span
          className={`px-3 py-1 rounded-full text-sm ${
            stockAvailabillity > 0
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {stockAvailabillity > 0 ? "In Stock" : "Out of Stock"}
        </span>
      </td>
      <td>
        <button
          onClick={removeFromWishlist}
          className="btn btn-sm btn-error btn-ghost"
          title="Remove from wishlist"
        >
          <FaTrash />
        </button>
      </td>
    </tr>
  );
};

export default WishItem;
