import type { RequestHandler } from "express";
import multer from "multer";

export const MAX_UPLOAD_SIZE_BYTES = 100 * 1024 * 1024;
export const MAX_UPLOAD_SIZE_MB = Math.round(
  MAX_UPLOAD_SIZE_BYTES / (1024 * 1024),
);

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_SIZE_BYTES,
    files: 1,
  },
});

export function singleFileUpload(fieldName: string): RequestHandler {
  return (req, res, next) => {
    memoryUpload.single(fieldName)(req, res, (err) => {
      if (!err) return next();

      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return void res.status(413).json({
            detail: `File too large. Maximum size is ${MAX_UPLOAD_SIZE_MB} MB.`,
          });
        }
        console.error("[upload] multer error", err.message);
        return void res.status(400).json({ detail: "Upload failed." });
      }

      return next(err);
    });
  };
}

export function detectedDocumentType(file: Express.Multer.File): string | null {
  const bytes = file.buffer;
  const isPdf =
    bytes.length >= 5 && bytes.subarray(0, 5).toString("ascii") === "%PDF-";
  const isZip =
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    bytes[2] === 0x03 &&
    bytes[3] === 0x04;

  if (isPdf && file.mimetype === "application/pdf") return "pdf";
  if (
    isZip &&
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }
  if (
    file.mimetype === "application/msword" ||
    file.mimetype === "application/octet-stream"
  ) {
    const isOle2 =
      bytes.length >= 8 &&
      bytes[0] === 0xd0 &&
      bytes[1] === 0xcf &&
      bytes[2] === 0x11 &&
      bytes[3] === 0xe0 &&
      bytes[4] === 0xa1 &&
      bytes[5] === 0xb1 &&
      bytes[6] === 0x1a &&
      bytes[7] === 0xe1;
    return isOle2 ? "doc" : null;
  }
  return null;
}

export function validateDocumentUpload(
  file: Express.Multer.File,
  suffix: string,
): string | null {
  const detected = detectedDocumentType(file);
  if (!detected) return "Uploaded file content is not a supported PDF, DOCX, or DOC.";
  if (detected !== suffix && !(detected === "doc" && suffix === "doc")) {
    return `Uploaded file content (${detected}) does not match extension (${suffix}).`;
  }
  return null;
}
