/**
 * BullMQ job payload for generating xs/sm/md image thumbnails after upload.
 */
export interface GenerateThumbnailsJobData {
  fileName: string;
  directory: string;
  mimetype: string;
}
