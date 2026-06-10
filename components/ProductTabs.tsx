// *********************
// Role of the component: Single product tabs on the single product page containing product description, main product info and reviews
// Name of the component: ProductTabs.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <ProductTabs product={product} />
// Input parameters: { product: Product }
// Output: Single product tabs containing product description, main product info and reviews
// *********************

"use client";

import React, { useEffect, useState } from "react";
import { formatCategoryName } from "@/utils/categoryFormating";
import { sanitize } from "@/lib/sanitize";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { FaStar } from "react-icons/fa6";

type ProductReview = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  isEdited: boolean;
};

type ReviewResponse = {
  averageRating: number;
  count: number;
  reviews: ProductReview[];
};

const ProductTabs = ({ product }: { product: Product }) => {
  const { data: session, status: sessionStatus } = useSession();
  const [currentProductTab, setCurrentProductTab] = useState<number>(0);
  const [reviewData, setReviewData] = useState<ReviewResponse>({
    averageRating: 0,
    count: 0,
    reviews: [],
  });
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: "",
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const additionalInfoItems = [
    {
      label: "Manufacturer",
      value: sanitize(product?.manufacturer) || "Not specified",
    },
    {
      label: "Category",
      value: product?.category?.name
        ? sanitize(formatCategoryName(product?.category?.name))
        : "No category",
    },
    {
      label: "Color",
      value: "Check available options above",
    },
  ];

  useEffect(() => {
    let isCancelled = false;

    const loadReviews = async () => {
      setIsLoadingReviews(true);

      try {
        const response = await fetch(`/api/reviews/${product.id}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch reviews");
        }

        const data = await response.json();

        if (!isCancelled) {
          setReviewData({
            averageRating: Number(data?.averageRating || 0),
            count: Array.isArray(data?.reviews) ? data.reviews.length : 0,
            reviews: Array.isArray(data?.reviews) ? data.reviews : [],
          });
        }
      } catch (error) {
        if (!isCancelled) {
          toast.error("Could not load reviews right now.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingReviews(false);
        }
      }
    };

    loadReviews();

    return () => {
      isCancelled = true;
    };
  }, [product.id]);

  const submitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!reviewForm.comment.trim()) {
      toast.error("Please write a short review before submitting.");
      return;
    }

    setIsSubmittingReview(true);

    try {
      const response = await fetch(`/api/reviews/${product.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: reviewForm.rating,
          comment: reviewForm.comment.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Could not submit review.");
      }

      const updatedReviewsResponse = await fetch(`/api/reviews/${product.id}`, {
        cache: "no-store",
      });

      if (!updatedReviewsResponse.ok) {
        throw new Error("Review submitted but reload failed.");
      }

      const updatedReviews = await updatedReviewsResponse.json();
      setReviewData({
        averageRating: Number(updatedReviews?.averageRating || 0),
        count: Array.isArray(updatedReviews?.reviews) ? updatedReviews.reviews.length : 0,
        reviews: Array.isArray(updatedReviews?.reviews) ? updatedReviews.reviews : [],
      });
      setReviewForm((current) => ({
        ...current,
        comment: "",
      }));
      toast.success("Review saved successfully.");
    } catch (error: any) {
      toast.error(error?.message || "Could not submit review.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const renderStars = (rating: number, sizeClassName = "h-4 w-4") =>
    Array.from({ length: 5 }).map((_, index) => (
      <FaStar
        key={`${rating}-${index}`}
        className={`${sizeClassName} ${
          index < rating ? "text-[var(--site-accent)]" : "text-[var(--site-border)]"
        }`}
      />
    ));

  return (
    <div className="px-5 text-[var(--site-text)] max-sm:px-0">
      <div role="tablist" className="tabs tabs-bordered w-full">
        <a
          role="tab"
          className={`tab flex-1 text-center text-lg text-[var(--site-text)] pb-8 max-[500px]:text-sm max-[400px]:px-2 max-[400px]:text-xs ${
            currentProductTab === 0 && "tab-active"
          }`}
          onClick={() => setCurrentProductTab(0)}
        >
          Additional info
        </a>
        <a
          role="tab"
          className={`tab flex-1 text-center text-lg text-[var(--site-text)] pb-8 max-[500px]:text-sm max-[400px]:px-2 max-[400px]:text-xs ${
            currentProductTab === 1 && "tab-active"
          }`}
          onClick={() => setCurrentProductTab(1)}
        >
          Reviews
        </a>
      </div>
      <div className="pt-5">
        {currentProductTab === 0 && (
          <div className="grid gap-3 pt-1 sm:gap-4">
            {additionalInfoItems.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-[var(--site-border)] bg-[linear-gradient(180deg,var(--site-panel),var(--site-panel-soft))] px-4 py-4 shadow-sm"
              >
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--site-muted)]">
                  {item.label}
                </p>
                <p className="mt-2 break-words text-base font-semibold text-[var(--site-text)] sm:text-lg">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {currentProductTab === 1 && (
          <div className="grid gap-6">
            <div className="rounded-2xl border border-[var(--site-border)] bg-[linear-gradient(180deg,var(--site-panel),var(--site-panel-soft))] px-5 py-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--site-muted)]">
                    Customer rating
                  </p>
                  {reviewData.count > 0 ? (
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-3xl font-black text-[var(--site-text)]">
                        {reviewData.averageRating.toFixed(1)}
                      </span>
                      <div className="flex items-center gap-1">
                        {renderStars(Math.round(reviewData.averageRating), "h-5 w-5")}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-lg font-bold text-[var(--site-text)]">No reviews yet</p>
                  )}
                </div>
                <p className="text-sm font-semibold text-[var(--site-muted)]">
                  {reviewData.count} {reviewData.count === 1 ? "review" : "reviews"}
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              <div className="grid gap-4">
                {isLoadingReviews ? (
                  <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel)] px-5 py-6 text-sm text-[var(--site-muted)]">
                    Loading reviews...
                  </div>
                ) : reviewData.reviews.length > 0 ? (
                  reviewData.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel)] px-5 py-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-base font-bold text-[var(--site-text)]">
                            {sanitize(review.authorName)}
                          </p>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--site-muted)]">
                            {new Date(review.createdAt).toLocaleDateString()}
                            {review.isEdited ? " | updated" : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[var(--site-muted)]">
                        {sanitize(review.comment)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--site-border)] bg-[var(--site-panel)] px-5 py-8 text-center text-sm text-[var(--site-muted)]">
                    No reviews yet. Be the first to share your experience with this product.
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel)] px-5 py-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--site-muted)]">
                  Leave a review
                </p>
                {sessionStatus === "authenticated" ? (
                  <form className="mt-4 grid gap-4" onSubmit={submitReview}>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[var(--site-text)]">
                        Your rating
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: 5 }).map((_, index) => {
                          const ratingValue = index + 1;
                          const isActive = reviewForm.rating >= ratingValue;
                          return (
                            <button
                              key={ratingValue}
                              type="button"
                              onClick={() =>
                                setReviewForm((current) => ({
                                  ...current,
                                  rating: ratingValue,
                                }))
                              }
                              className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                                isActive
                                  ? "border-[var(--site-accent)] bg-[var(--site-accent-soft)] text-[var(--site-accent)]"
                                  : "border-[var(--site-border)] bg-[var(--site-panel-soft)] text-[var(--site-muted)]"
                              }`}
                              aria-label={`Set rating to ${ratingValue}`}
                            >
                              <FaStar className="h-4 w-4" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="review-comment"
                        className="mb-2 block text-sm font-semibold text-[var(--site-text)]"
                      >
                        Your comment
                      </label>
                      <textarea
                        id="review-comment"
                        value={reviewForm.comment}
                        onChange={(event) =>
                          setReviewForm((current) => ({
                            ...current,
                            comment: event.target.value,
                          }))
                        }
                        rows={5}
                        className="w-full rounded-xl border border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 py-3 text-sm text-[var(--site-text)] outline-none transition focus:border-[var(--site-accent)]"
                        placeholder="Share what stood out, how it feels, or how it performs."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="theme-button inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-black uppercase disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmittingReview ? "Saving..." : "Submit review"}
                    </button>
                  </form>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-[var(--site-border)] bg-[var(--site-panel-soft)] px-4 py-5 text-sm text-[var(--site-muted)]">
                    Log in to leave a rating and comment for this product.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductTabs;
