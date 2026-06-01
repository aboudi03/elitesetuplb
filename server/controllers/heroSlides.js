const prisma = require("../utills/db");
const { asyncHandler, AppError } = require("../utills/errorHandler");

function normalizeBoolean(value, defaultValue = true) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.toLowerCase() === "true" || value.toLowerCase() === "enabled";
  }
  return defaultValue;
}

const getHeroSlides = asyncHandler(async (req, res) => {
  const mode = req.query.mode;

  const slides = await prisma.heroSlide.findMany({
    where: mode === "admin" ? {} : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return res.status(200).json(slides);
});

const createHeroSlide = asyncHandler(async (req, res) => {
  const {
    eyebrow,
    title,
    subtitle,
    href,
    productImage,
    backgroundImage,
    isActive = true,
    sortOrder = 0,
  } = req.body;

  if (!eyebrow || !title || !subtitle || !href || !productImage || !backgroundImage) {
    throw new AppError("Missing required hero slide fields", 400);
  }

  const slide = await prisma.heroSlide.create({
    data: {
      eyebrow,
      title,
      subtitle,
      href,
      productImage,
      backgroundImage,
      isActive: normalizeBoolean(isActive, true),
      sortOrder: Number(sortOrder) || 0,
    },
  });

  return res.status(201).json(slide);
});

const updateHeroSlide = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new AppError("Hero slide ID is required", 400);
  }

  const existingSlide = await prisma.heroSlide.findUnique({
    where: { id },
  });

  if (!existingSlide) {
    throw new AppError("Hero slide not found", 404);
  }

  const {
    eyebrow,
    title,
    subtitle,
    href,
    productImage,
    backgroundImage,
    isActive,
    sortOrder,
  } = req.body;

  const updatedSlide = await prisma.heroSlide.update({
    where: { id },
    data: {
      eyebrow: eyebrow ?? existingSlide.eyebrow,
      title: title ?? existingSlide.title,
      subtitle: subtitle ?? existingSlide.subtitle,
      href: href ?? existingSlide.href,
      productImage: productImage ?? existingSlide.productImage,
      backgroundImage: backgroundImage ?? existingSlide.backgroundImage,
      isActive:
        isActive === undefined
          ? existingSlide.isActive
          : normalizeBoolean(isActive, existingSlide.isActive),
      sortOrder: sortOrder === undefined ? existingSlide.sortOrder : Number(sortOrder) || 0,
    },
  });

  return res.status(200).json(updatedSlide);
});

const deleteHeroSlide = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new AppError("Hero slide ID is required", 400);
  }

  await prisma.heroSlide.delete({
    where: { id },
  });

  return res.status(204).send();
});

module.exports = {
  getHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
};
