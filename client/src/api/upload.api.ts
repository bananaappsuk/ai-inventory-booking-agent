import { api } from "./client";
import type { Photo } from "../types";

export const uploadApi = {
  uploadPhoto: (file: File, folder: string) => {
    const formData = new FormData();
    formData.append("photo", file);
    formData.append("folder", folder);
    return api.postForm<Photo>("/uploads", formData);
  }
};
