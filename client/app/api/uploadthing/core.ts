import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

// Sanitized logger for upload events
const logUploadEvent = (event: string, fileKey?: string) => {
  const sanitizedFileKey = fileKey ? fileKey.split('/').pop() : 'unknown';
  console.log(`[UPLOAD] ${event} - File: ${sanitizedFileKey}`);
};

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Ticket photo uploader for trips
  ticketUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .onUploadComplete(async ({ file }) => {
      logUploadEvent("Ticket upload complete", file.key);
      return { url: file.ufsUrl };
    }),

  // Profile photo uploader for user profiles
  profileUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .onUploadComplete(async ({ file }) => {
      logUploadEvent("Profile upload complete", file.key);
      return { url: file.ufsUrl };
    }),

  // Document uploader for KYC and other documents
  documentUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 5,
    },
  })
    .onUploadComplete(async ({ file }) => {
      logUploadEvent("Document upload complete", file.key);
      return { url: file.ufsUrl };
    }),

  // Product photo uploader for shopper requests
  productUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 3, // Allow up to 3 photos per product
    },
  })
    .onUploadComplete(async ({ file }) => {
      logUploadEvent("Product photo upload complete", file.key);
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;