const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { asyncHandler, AppError } = require("../utills/errorHandler");

function normalizeParentId(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return null;
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function normalizeMenuImage(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return null;
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

async function getNextSortOrder(parentId) {
  const lastSibling = await prisma.category.findFirst({
    where: {
      parentId,
    },
    orderBy: [{ sortOrder: "desc" }, { name: "asc" }],
  });

  return (lastSibling?.sortOrder ?? -1) + 1;
}

async function isDescendantCategory(categoryId, potentialParentId) {
  if (!potentialParentId) return false;

  let currentParentId = potentialParentId;

  while (currentParentId) {
    if (currentParentId === categoryId) {
      return true;
    }

    const currentCategory = await prisma.category.findUnique({
      where: { id: currentParentId },
      select: { parentId: true },
    });

    currentParentId = currentCategory?.parentId || null;
  }

  return false;
}

const createCategory = asyncHandler(async (request, response) => {
  const { name } = request.body;
  const parentId = normalizeParentId(request.body.parentId);
  const menuImage = normalizeMenuImage(request.body.menuImage);

  if (!name || name.trim().length === 0) {
    throw new AppError("Category name is required", 400);
  }

  if (parentId) {
    const parentCategory = await prisma.category.findUnique({
      where: { id: parentId },
    });

    if (!parentCategory) {
      throw new AppError("Selected parent category was not found", 400);
    }
  }

  const category = await prisma.category.create({
    data: {
      name: name.trim(),
      menuImage,
      parentId,
      sortOrder: await getNextSortOrder(parentId),
    },
  });
  return response.status(201).json(category);
});

const updateCategory = asyncHandler(async (request, response) => {
  const { id } = request.params;
  const { name } = request.body;
  const parentId = normalizeParentId(request.body.parentId);
  const menuImage = normalizeMenuImage(request.body.menuImage);

  if (!id) {
    throw new AppError("Category ID is required", 400);
  }

  if (!name || name.trim().length === 0) {
    throw new AppError("Category name is required", 400);
  }

  const existingCategory = await prisma.category.findUnique({
    where: {
      id,
    },
  });

  if (!existingCategory) {
    throw new AppError("Category not found", 404);
  }

  if (parentId === id) {
    throw new AppError("A category cannot be its own parent", 400);
  }

  if (parentId) {
    const parentCategory = await prisma.category.findUnique({
      where: { id: parentId },
    });

    if (!parentCategory) {
      throw new AppError("Selected parent category was not found", 400);
    }

    if (await isDescendantCategory(id, parentId)) {
      throw new AppError("A category cannot be moved under one of its children", 400);
    }
  }

  const movedToAnotherParent = existingCategory.parentId !== parentId;
  const nextSortOrder = movedToAnotherParent
    ? await getNextSortOrder(parentId)
    : existingCategory.sortOrder;

  const updatedCategory = await prisma.category.update({
    where: {
      id: existingCategory.id,
    },
    data: {
      name: name.trim(),
      menuImage,
      parentId,
      sortOrder: nextSortOrder,
    },
  });

  return response.status(200).json(updatedCategory);
});

const reorderCategories = asyncHandler(async (request, response) => {
  const { orderedIds } = request.body;
  const parentId = normalizeParentId(request.body.parentId);

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    throw new AppError("orderedIds must be a non-empty array", 400);
  }

  const siblingCategories = await prisma.category.findMany({
    where: { parentId },
    select: { id: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const siblingIds = siblingCategories.map((category) => category.id);

  if (
    siblingIds.length !== orderedIds.length ||
    siblingIds.some((id) => !orderedIds.includes(id))
  ) {
    throw new AppError("Reorder payload must include all sibling categories exactly once", 400);
  }

  await prisma.$transaction(
    orderedIds.map((categoryId, index) =>
      prisma.category.update({
        where: { id: categoryId },
        data: { sortOrder: index },
      })
    )
  );

  const reorderedCategories = await prisma.category.findMany({
    where: { parentId },
    include: {
      parent: {
        select: { id: true, name: true },
      },
      _count: {
        select: {
          children: true,
          products: true,
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return response.status(200).json(reorderedCategories);
});

const deleteCategory = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) {
    throw new AppError("Category ID is required", 400);
  }

  const existingCategory = await prisma.category.findUnique({
    where: {
      id,
    },
    include: {
      _count: {
        select: {
          children: true,
        },
      },
    },
  });

  if (!existingCategory) {
    throw new AppError("Category not found", 404);
  }

  if ((existingCategory._count?.children || 0) > 0) {
    throw new AppError("Cannot delete category that still has child categories", 400);
  }

  const productsWithCategory = await prisma.product.findFirst({
    where: {
      categoryId: id,
    },
  });

  if (productsWithCategory) {
    throw new AppError("Cannot delete category that has products", 400);
  }

  await prisma.category.delete({
    where: {
      id,
    },
  });
  return response.status(204).send();
});

const getCategory = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) {
    throw new AppError("Category ID is required", 400);
  }

  const category = await prisma.category.findUnique({
    where: {
      id,
    },
    include: {
      parent: {
        select: { id: true, name: true },
      },
      children: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
  });
  
  if (!category) {
    throw new AppError("Category not found", 404);
  }
  
  return response.status(200).json(category);
});

const getAllCategories = asyncHandler(async (request, response) => {
  const treeMode = String(request.query.tree || "").toLowerCase() === "true";
  const menuMode = String(request.query.menu || "").toLowerCase() === "true";

  if (menuMode) {
    const categories = await prisma.category.findMany({
      where: {
        menuImage: {
          not: null,
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return response.json(categories);
  }

  if (treeMode) {
    const categories = await prisma.category.findMany({
      where: {
        parentId: null,
      },
      include: {
        children: {
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return response.json(categories);
  }

  const categories = await prisma.category.findMany({
    include: {
      parent: {
        select: { id: true, name: true },
      },
      _count: {
        select: {
          children: true,
          products: true,
        },
      },
    },
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  return response.json(categories);
});

module.exports = {
  createCategory,
  updateCategory,
  reorderCategories,
  deleteCategory,
  getCategory,
  getAllCategories,
};
