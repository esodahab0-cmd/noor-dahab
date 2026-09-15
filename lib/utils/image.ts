export async function compressImage(
  video: HTMLVideoElement,
  maxWidth = 1024,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      let width = video.videoWidth || 640;
      let height = video.videoHeight || 480;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("No canvas context"));
      ctx.drawImage(video, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    } catch (e) { reject(e); }
  });
}
