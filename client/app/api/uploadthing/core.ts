import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

const auth = (req: Request) => ({ id: "fakeId" }); // TODO: Implement proper auth

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Ticket photo uploader for trips
  ticketUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      // TODO: Add proper authentication check
      return { uploadedBy: "traveler" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.uploadedBy);
      console.log("File URL:", file.url);

      return { uploadedBy: metadata.uploadedBy, url: file.url };
    }),

  // Profile photo uploader for user profiles
  profileUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      // TODO: Add proper authentication check
      return { uploadedBy: "user" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Profile upload complete for userId:", metadata.uploadedBy);
      console.log("File URL:", file.url);

      return { uploadedBy: metadata.uploadedBy, url: file.url };
    }),

  // Document uploader for KYC and other documents
  documentUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 5,
    },
  })
    .middleware(async ({ req }) => {
      // TODO: Add proper authentication check
      return { uploadedBy: "user" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Document upload complete for userId:", metadata.uploadedBy);
      console.log("File URL:", file.url);

      return { uploadedBy: metadata.uploadedBy, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;