"use client";

import { DashboardSidebar } from "@/components";
import { getRuntimeApiBaseUrl } from "@/lib/api";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaCircleInfo } from "react-icons/fa6";

type AdminHeroSlide = {
  id?: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  href: string;
  productImage: string;
  backgroundImage: string;
  isActive: boolean;
  sortOrder: number;
};

const emptySlide: AdminHeroSlide = {
  eyebrow: "",
  title: "",
  subtitle: "",
  href: "/shop",
  productImage: "",
  backgroundImage: "",
  isActive: true,
  sortOrder: 0,
};

const FieldHelp = ({ text }: { text: string }) => {
  return (
    <span
      className="group relative inline-flex items-center"
      tabIndex={0}
      aria-label={text}
    >
      <FaCircleInfo className="text-sm text-[var(--site-muted)] transition group-hover:text-[var(--site-accent)] group-focus-visible:text-[var(--site-accent)]" />
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-64 -translate-x-1/2 rounded-md border border-[var(--site-border)] bg-[var(--site-panel)] px-3 py-2 text-xs font-normal leading-5 text-[var(--site-text)] shadow-lg group-hover:block group-focus-visible:block">
        {text}
      </span>
    </span>
  );
};

const HeroSlidesAdminPage = () => {
  const [slides, setSlides] = useState<AdminHeroSlide[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSlides = async () => {
    try {
      const response = await fetch(`${getRuntimeApiBaseUrl()}/api/hero-slides?mode=admin`, {
        cache: "no-store",
      });
      const data = await response.json();
      setSlides(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load hero slides");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const updateSlideField = (
    index: number,
    field: keyof AdminHeroSlide,
    value: string | number | boolean
  ) => {
    setSlides((currentSlides) =>
      currentSlides.map((slide, currentIndex) =>
        currentIndex === index ? { ...slide, [field]: value } : slide
      )
    );
  };

  const uploadAsset = async (file: File) => {
    const formData = new FormData();
    formData.append("uploadedFile", file);

    const response = await fetch(`${getRuntimeApiBaseUrl()}/api/main-image`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    return response.json();
  };

  const saveSlide = async (slide: AdminHeroSlide, index: number) => {
    if (
      !slide.eyebrow ||
      !slide.title ||
      !slide.subtitle ||
      !slide.href ||
      !slide.productImage ||
      !slide.backgroundImage
    ) {
      toast.error("Please complete both images and all text fields");
      return;
    }

    try {
      const endpoint = slide.id
        ? `${getRuntimeApiBaseUrl()}/api/hero-slides/${slide.id}`
        : `${getRuntimeApiBaseUrl()}/api/hero-slides`;
      const method = slide.id ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(slide),
      });

      if (!response.ok) {
        throw new Error("Save failed");
      }

      const savedSlide = await response.json();
      toast.success(slide.id ? "Hero slide updated" : "Hero slide created");

      setSlides((currentSlides) =>
        currentSlides.map((currentSlide, currentIndex) =>
          currentIndex === index ? savedSlide : currentSlide
        )
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to save hero slide");
    }
  };

  const deleteSlide = async (slideId?: string) => {
    if (!slideId) return;

    try {
      const response = await fetch(`${getRuntimeApiBaseUrl()}/api/hero-slides/${slideId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      setSlides((currentSlides) => currentSlides.filter((slide) => slide.id !== slideId));
      toast.success("Hero slide deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete hero slide");
    }
  };

  return (
    <div className="mx-auto flex max-w-screen-2xl justify-start gap-y-5 bg-[var(--site-bg)] text-[var(--site-text)] xl:h-full max-xl:flex-col">
      <DashboardSidebar />
      <div className="flex w-full flex-col gap-6 xl:ml-5 max-xl:px-5">
        <div className="flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-start">
          <div>
            <h1 className="text-3xl font-semibold">Hero Slides</h1>
            <p className="mt-2 max-w-3xl text-sm text-[var(--site-muted)]">
              Manage the homepage hero separately from product main images. Each slide has two
              different assets: the product image in front and the background image behind it.
            </p>
            <div className="mt-3 rounded-xl border border-[var(--site-border)] bg-[var(--site-panel)] p-4 text-sm text-[var(--site-muted)]">
              <p className="font-medium text-[var(--site-text)]">What each image means:</p>
              <p className="mt-2">
                <span className="font-medium text-[var(--site-text)]">Foreground product image</span>
                {" "}
                is the item floating in front on the right side of the hero.
              </p>
              <p className="mt-1">
                <span className="font-medium text-[var(--site-text)]">Background image</span>
                {" "}
                is the large full-width image behind the card and behind the product image.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-md bg-[var(--site-accent)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--site-accent-strong)]"
            onClick={() => setSlides((currentSlides) => [...currentSlides, { ...emptySlide, sortOrder: currentSlides.length }])}
          >
            Add slide
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-[var(--site-muted)]">Loading hero slides...</p>
        ) : (
          <div className="grid gap-6">
            {slides.map((slide, index) => (
              <section
                key={slide.id ?? `new-slide-${index}`}
                className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-panel)] p-5 shadow-sm"
              >
                <div className="mb-5 flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-start">
                  <h2 className="text-xl font-semibold">Slide {index + 1}</h2>
                  <div className="flex gap-2">
                    {slide.id && (
                      <button
                        type="button"
                        className="rounded-md border border-red-500 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500 hover:text-white"
                        onClick={() => deleteSlide(slide.id)}
                      >
                        Delete
                      </button>
                    )}
                    <button
                      type="button"
                      className="rounded-md bg-[var(--site-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--site-accent-strong)]"
                      onClick={() => saveSlide(slide, index)}
                    >
                      Save slide
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="form-control">
                    <div className="label">
                      <span className="label-text flex items-center gap-2">
                        Eyebrow
                        <FieldHelp text="Small top text above the main title, like 'RGB Keyboards' or 'Audio drop'." />
                      </span>
                    </div>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={slide.eyebrow}
                      onChange={(event) => updateSlideField(index, "eyebrow", event.target.value)}
                    />
                    <p className="mt-2 text-xs text-[var(--site-muted)]">
                      This is the small label above the big heading.
                    </p>
                  </label>

                  <label className="form-control">
                    <div className="label">
                      <span className="label-text flex items-center gap-2">
                        Target link
                        <FieldHelp text="Where the hero buttons should send the user when they click the main call to action." />
                      </span>
                    </div>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={slide.href}
                      onChange={(event) => updateSlideField(index, "href", event.target.value)}
                    />
                    <p className="mt-2 text-xs text-[var(--site-muted)]">
                      Example: `/shop`, `/shop/gaming-keyboards`, or any page in your store.
                    </p>
                  </label>

                  <label className="form-control">
                    <div className="label">
                      <span className="label-text flex items-center gap-2">
                        Title
                        <FieldHelp text="The main large heading shown in the white left content box of the hero." />
                      </span>
                    </div>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={slide.title}
                      onChange={(event) => updateSlideField(index, "title", event.target.value)}
                    />
                    <p className="mt-2 text-xs text-[var(--site-muted)]">
                      This is the big main text customers notice first.
                    </p>
                  </label>

                  <label className="form-control">
                    <div className="label">
                      <span className="label-text flex items-center gap-2">
                        Sort order
                        <FieldHelp text="Controls slide order. Lower numbers appear first, so 0 shows before 1, and 1 before 2." />
                      </span>
                    </div>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={slide.sortOrder}
                      onChange={(event) =>
                        updateSlideField(index, "sortOrder", Number(event.target.value))
                      }
                    />
                    <p className="mt-2 text-xs text-[var(--site-muted)]">
                      Lower number = earlier in the slider.
                    </p>
                  </label>

                  <label className="form-control lg:col-span-2">
                    <div className="label">
                      <span className="label-text flex items-center gap-2">
                        Subtitle
                        <FieldHelp text="The smaller descriptive paragraph under the title in the left content box." />
                      </span>
                    </div>
                    <textarea
                      className="textarea textarea-bordered h-24"
                      value={slide.subtitle}
                      onChange={(event) => updateSlideField(index, "subtitle", event.target.value)}
                    />
                    <p className="mt-2 text-xs text-[var(--site-muted)]">
                      Use this for the short supporting description below the title.
                    </p>
                  </label>

                  <label className="form-control">
                    <div className="label">
                      <span className="label-text flex items-center gap-2">
                        Foreground product image
                        <FieldHelp text="The product cutout shown in front of everything, usually floating on the right side of the hero." />
                      </span>
                    </div>
                    <input
                      type="file"
                      className="file-input file-input-bordered w-full"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;

                        try {
                          const uploaded = await uploadAsset(file);
                          updateSlideField(index, "productImage", uploaded.path);
                          toast.success("Product image uploaded");
                        } catch (error) {
                          console.error(error);
                          toast.error("Failed to upload product image");
                        }
                      }}
                    />
                    <p className="mt-2 text-xs text-[var(--site-muted)]">
                      Saved path: {slide.productImage || "No file uploaded yet"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--site-muted)]">
                      This is not the background. It is the front product photo.
                    </p>
                    {slide.productImage && (
                      <Image
                        src={`/${slide.productImage}`}
                        alt={`${slide.title || "Hero"} product image`}
                        width={180}
                        height={180}
                        className="mt-3 h-32 w-auto rounded-lg object-contain"
                      />
                    )}
                  </label>

                  <label className="form-control">
                    <div className="label">
                      <span className="label-text flex items-center gap-2">
                        Background image
                        <FieldHelp text="The large image behind the whole hero section, filling the banner area from edge to edge." />
                      </span>
                    </div>
                    <input
                      type="file"
                      className="file-input file-input-bordered w-full"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;

                        try {
                          const uploaded = await uploadAsset(file);
                          updateSlideField(index, "backgroundImage", uploaded.path);
                          toast.success("Background image uploaded");
                        } catch (error) {
                          console.error(error);
                          toast.error("Failed to upload background image");
                        }
                      }}
                    />
                    <p className="mt-2 text-xs text-[var(--site-muted)]">
                      Saved path: {slide.backgroundImage || "No file uploaded yet"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--site-muted)]">
                      This sits behind both the left text card and the foreground product image.
                    </p>
                    {slide.backgroundImage && (
                      <Image
                        src={`/${slide.backgroundImage}`}
                        alt={`${slide.title || "Hero"} background image`}
                        width={320}
                        height={180}
                        className="mt-3 h-32 w-full rounded-lg object-cover"
                      />
                    )}
                  </label>

                  <label className="form-control">
                    <div className="label">
                      <span className="label-text flex items-center gap-2">
                        Visibility
                        <FieldHelp text="Enabled slides can appear on the homepage. Disabled slides stay saved in admin but are hidden from customers." />
                      </span>
                    </div>
                    <select
                      className="select select-bordered"
                      value={slide.isActive ? "enabled" : "disabled"}
                      onChange={(event) =>
                        updateSlideField(index, "isActive", event.target.value === "enabled")
                      }
                    >
                      <option value="enabled">Enabled</option>
                      <option value="disabled">Disabled</option>
                    </select>
                    <p className="mt-2 text-xs text-[var(--site-muted)]">
                      Disable a slide if you want to keep it saved but not show it on the homepage.
                    </p>
                  </label>
                </div>
              </section>
            ))}

            {slides.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[var(--site-border)] bg-[var(--site-panel)] p-8 text-sm text-[var(--site-muted)]">
                No hero slides yet. Use "Add slide" to create your first homepage banner.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroSlidesAdminPage;
