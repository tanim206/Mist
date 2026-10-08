import { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../lib/cloudinary";

export const uploadToCloudinary = (buffer: Buffer): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ resource_type: "auto" }, (error, result) => {
        if (error) return reject(error);
        if (!result)
          return reject(new Error("No result returned from Cloudinary"));
        resolve(result);
      })
      .end(buffer);
  });
};
