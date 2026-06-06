const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getSingleProductImages(request, response) {
  const { id } = request.params;
  const images = await prisma.image.findMany({
    where: { productID: id },
    orderBy: { sortOrder: "asc" },
  });
  if (!images) {
    return response.json({ error: "Images not found" }, { status: 404 });
  }
  return response.json(images);
}

async function createImage(request, response) {
  try {
    const { productID, image, sortOrder = 0 } = request.body;
    const createImage = await prisma.image.create({
      data: {
        productID,
        image,
        sortOrder: Number(sortOrder) || 0,
      },
    });
    return response.status(201).json(createImage);
  } catch (error) {
    console.error("Error creating image:", error);
    return response.status(500).json({ error: "Error creating image" });
  }
}

async function updateImage(request, response) {
  try {
    const { id } = request.params; // Getting product id from params
    const { productID, image, sortOrder } = request.body;

    // Checking whether photo exists for the given product id
    const existingImage = await prisma.image.findFirst({
      where: {
        productID: id, // Finding photo with a product id
      },
    });

    // if photo doesn't exist, return coresponding status code
    if (!existingImage) {
      return response
        .status(404)
        .json({ error: "Image not found for the provided productID" });
    }

    // Updating photo using coresponding imageID
    const updatedImage = await prisma.image.update({
      where: {
        imageID: existingImage.imageID, // Using imageID of the found existing image
      },
      data: {
        productID: productID,
        image: image,
        sortOrder:
          sortOrder === undefined
            ? existingImage.sortOrder
            : Number(sortOrder) || 0,
      },
    });

    return response.json(updatedImage);
  } catch (error) {
    console.error("Error updating image:", error);
    return response.status(500).json({ error: "Error updating image" });
  }
}

async function deleteImage(request, response) {
  try {
    const { id } = request.params;
    await prisma.image.deleteMany({
      where: {
        productID: String(id), // Converting id to string
      },
    });
    return response.status(204).send();
  } catch (error) {
    console.error("Error deleting image:", error);
    return response.status(500).json({ error: "Error deleting image" });
  }
}

async function deleteSingleImage(request, response) {
  try {
    const { imageId } = request.params;

    const existingImage = await prisma.image.findUnique({
      where: { imageID: String(imageId) },
    });

    if (!existingImage) {
      return response.status(404).json({ error: "Image not found" });
    }

    const absoluteImagePath = path.join(__dirname, "..", "..", "public", existingImage.image);

    await prisma.image.delete({
      where: {
        imageID: String(imageId),
      },
    });

    if (fs.existsSync(absoluteImagePath)) {
      fs.rmSync(absoluteImagePath, { force: true });
    }

    return response.status(204).send();
  } catch (error) {
    console.error("Error deleting single image:", error);
    return response.status(500).json({ error: "Error deleting image" });
  }
}

async function syncProductImages(request, response) {
  try {
    const { productId } = request.params;
    const { images = [], removedPaths = [] } = request.body;

    const existingProduct = await prisma.product.findUnique({
      where: { id: String(productId) },
    });

    if (!existingProduct) {
      return response.status(404).json({ error: "Product not found" });
    }

    const existingImages = await prisma.image.findMany({
      where: { productID: String(productId) },
    });

    const nextImageIds = images
      .map((image) => image.imageID)
      .filter((imageId) => typeof imageId === "string" && imageId.length > 0);

    const nextImagePaths = images
      .map((image) => image.image)
      .filter((imagePath) => typeof imagePath === "string" && imagePath.length > 0);

    const imagesToDelete = existingImages.filter(
      (existingImage) => !nextImageIds.includes(existingImage.imageID)
    );

    await prisma.$transaction(async (transaction) => {
      for (const image of images) {
        const imagePath = typeof image.image === "string" ? image.image.trim() : "";
        if (!imagePath) {
          continue;
        }

        if (image.imageID) {
          await transaction.image.update({
            where: { imageID: String(image.imageID) },
            data: {
              image: imagePath,
              sortOrder: Number(image.sortOrder) || 0,
            },
          });
        } else {
          await transaction.image.create({
            data: {
              productID: String(productId),
              image: imagePath,
              sortOrder: Number(image.sortOrder) || 0,
            },
          });
        }
      }

      for (const image of imagesToDelete) {
        await transaction.image.delete({
          where: { imageID: image.imageID },
        });
      }
    });

    const filePathsToDelete = new Set();

    for (const image of imagesToDelete) {
      if (
        image.image &&
        image.image !== existingProduct.mainImage &&
        !nextImagePaths.includes(image.image)
      ) {
        filePathsToDelete.add(image.image);
      }
    }

    for (const removedPath of removedPaths) {
      if (
        typeof removedPath === "string" &&
        removedPath.length > 0 &&
        removedPath !== existingProduct.mainImage &&
        !nextImagePaths.includes(removedPath)
      ) {
        filePathsToDelete.add(removedPath);
      }
    }

    for (const filePath of filePathsToDelete) {
      const absoluteImagePath = path.join(__dirname, "..", "..", "public", filePath);
      if (fs.existsSync(absoluteImagePath)) {
        fs.rmSync(absoluteImagePath, { force: true });
      }
    }

    const syncedImages = await prisma.image.findMany({
      where: { productID: String(productId) },
      orderBy: { sortOrder: "asc" },
    });

    return response.json(syncedImages);
  } catch (error) {
    console.error("Error syncing product images:", error);
    return response.status(500).json({ error: "Error syncing product images" });
  }
}



module.exports = {
  getSingleProductImages,
  createImage,
  updateImage,
  deleteImage,
  deleteSingleImage,
  syncProductImages,
};
