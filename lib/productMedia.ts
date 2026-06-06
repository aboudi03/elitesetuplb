export type ProductMediaRow = {
  id: string;
  imageId?: string;
  path?: string;
  previewUrl: string;
  file?: File;
  fileName: string;
  isMain: boolean;
  sortOrder: number;
  source: "existing-main" | "existing-gallery" | "pending";
};

function reindexGalleryRows(rows: ProductMediaRow[]) {
  const mainRow = rows.find((row) => row.isMain) || null;
  const galleryRows = rows
    .filter((row) => !row.isMain)
    .map((row, index) => ({ ...row, sortOrder: index + 1 }));

  return mainRow ? [{ ...mainRow, sortOrder: 0 }, ...galleryRows] : galleryRows;
}

export function buildMediaRows(
  mainImage: string | null | undefined,
  otherImages: OtherImages[] = []
) {
  const rows: ProductMediaRow[] = [];

  if (mainImage) {
    rows.push({
      id: `main-${mainImage}`,
      path: mainImage,
      previewUrl: `/${mainImage}`,
      fileName: mainImage.split("/").pop() || mainImage,
      isMain: true,
      sortOrder: 0,
      source: "existing-main",
    });
  }

  const sortedOtherImages = [...otherImages].sort(
    (left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0)
  );

  sortedOtherImages.forEach((image, index) => {
    rows.push({
      id: image.imageID,
      imageId: image.imageID,
      path: image.image,
      previewUrl: `/${image.image}`,
      fileName: image.image.split("/").pop() || image.image,
      isMain: false,
      sortOrder: index + 1,
      source: "existing-gallery",
    });
  });

  return reindexGalleryRows(rows);
}

export function createPendingMediaRows(files: FileList | null) {
  if (!files || files.length === 0) return [];

  return Array.from(files).map((file) => ({
    id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
    previewUrl: URL.createObjectURL(file),
    file,
    fileName: file.name,
    isMain: false,
    sortOrder: 0,
    source: "pending" as const,
  }));
}

export function appendMediaRows(
  currentRows: ProductMediaRow[],
  incomingRows: ProductMediaRow[]
) {
  if (incomingRows.length === 0) return currentRows;

  const nextRows = [...currentRows, ...incomingRows];

  if (!nextRows.some((row) => row.isMain) && nextRows[0]) {
    nextRows[0] = { ...nextRows[0], isMain: true };
  }

  return reindexGalleryRows(nextRows);
}

export function setMainMediaRow(rows: ProductMediaRow[], rowId: string) {
  const selectedRow = rows.find((row) => row.id === rowId);
  if (!selectedRow) return rows;

  const otherRows = rows
    .filter((row) => row.id !== rowId)
    .map((row) => ({ ...row, isMain: false }));

  return reindexGalleryRows([{ ...selectedRow, isMain: true }, ...otherRows]);
}

export function moveMediaRow(
  rows: ProductMediaRow[],
  rowId: string,
  direction: "up" | "down"
) {
  const mainRow = rows.find((row) => row.isMain) || null;
  const galleryRows = rows.filter((row) => !row.isMain);
  const index = galleryRows.findIndex((row) => row.id === rowId);

  if (index === -1) return rows;

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= galleryRows.length) return rows;

  const reorderedRows = [...galleryRows];
  const [movedRow] = reorderedRows.splice(index, 1);
  reorderedRows.splice(targetIndex, 0, movedRow);

  return reindexGalleryRows(mainRow ? [mainRow, ...reorderedRows] : reorderedRows);
}

export function removeMediaRow(rows: ProductMediaRow[], rowId: string) {
  const remainingRows = rows.filter((row) => row.id !== rowId);

  if (remainingRows.length === 0) {
    return [];
  }

  if (!remainingRows.some((row) => row.isMain)) {
    remainingRows[0] = { ...remainingRows[0], isMain: true };
  }

  return reindexGalleryRows(remainingRows);
}
