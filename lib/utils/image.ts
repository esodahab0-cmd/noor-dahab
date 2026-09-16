export async function compressImage(
  video: HTMLVideoElement,
  maxWidth = 400,
  quality = 0.55
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      let width = video.videoWidth || 400;
      let height = video.videoHeight || 300;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: false });
      if (!ctx) return reject(new Error("No canvas context"));

      ctx.drawImage(video, 0, 0, width, height);
      // Ultra-lightweight JPEG compression (~20-30KB) to save bandwidth and hosting resources
      resolve(canvas.toDataURL("image/jpeg", quality));
    } catch (e) { reject(e); }
  });
}