const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const PUBLIC_ROOT = path.join(__dirname, "..", "..", "public");
const WEBP_QUALITY = 82;

function ensurePathInsidePublic(resolvedPath) {
  const normalizedPublicRoot = `${PUBLIC_ROOT}${path.sep}`;
  if (resolvedPath !== PUBLIC_ROOT && !resolvedPath.startsWith(normalizedPublicRoot)) {
    throw new Error("Invalid public asset path");
  }
}

function normalizeRelativePath(relativePath) {
  return String(relativePath || "")
    .replace(/^\/+/, "")
    .replace(/\\/g, "/")
    .trim();
}

function resolvePublicPath(relativePath) {
  const normalizedRelativePath = normalizeRelativePath(relativePath);
  const absolutePath = path.resolve(PUBLIC_ROOT, normalizedRelativePath);
  ensurePathInsidePublic(absolutePath);

  return {
    relativePath: normalizedRelativePath,
    absolutePath,
  };
}

function buildWebpFileName(fileName) {
  const baseName = path.basename(fileName, path.extname(fileName));
  return `${baseName}.webp`;
}

async function writeWebpFromBuffer(buffer, destinationPath) {
  await fs.promises.mkdir(path.dirname(destinationPath), { recursive: true });
  await sharp(buffer).rotate().webp({ quality: WEBP_QUALITY }).toFile(destinationPath);
}

async function convertPublicImageToWebp(relativePath, options = {}) {
  const { preferredFileName } = options;
  const source = resolvePublicPath(relativePath);

  if (!fs.existsSync(source.absolutePath)) {
    throw new Error("Source image was not found");
  }

  if (path.extname(source.relativePath).toLowerCase() === ".webp") {
    return {
      oldRelativePath: source.relativePath,
      relativePath: source.relativePath,
      absolutePath: source.absolutePath,
      fileName: path.basename(source.relativePath),
      changed: false,
    };
  }

  const sourceDirectory = path.dirname(source.absolutePath);
  const targetFileName = preferredFileName || buildWebpFileName(path.basename(source.relativePath));
  const targetAbsolutePath = path.join(sourceDirectory, targetFileName);
  const targetRelativePath = path
    .posix.join(path.posix.dirname(source.relativePath), targetFileName)
    .replace(/^\.\//, "");

  await fs.promises.mkdir(sourceDirectory, { recursive: true });
  await sharp(source.absolutePath).rotate().webp({ quality: WEBP_QUALITY }).toFile(targetAbsolutePath);

  if (source.absolutePath !== targetAbsolutePath && fs.existsSync(source.absolutePath)) {
    fs.rmSync(source.absolutePath, { force: true });
  }

  return {
    oldRelativePath: source.relativePath,
    relativePath: targetRelativePath,
    absolutePath: targetAbsolutePath,
    fileName: targetFileName,
    changed: source.relativePath !== targetRelativePath,
  };
}

module.exports = {
  PUBLIC_ROOT,
  WEBP_QUALITY,
  buildWebpFileName,
  normalizeRelativePath,
  resolvePublicPath,
  writeWebpFromBuffer,
  convertPublicImageToWebp,
};
