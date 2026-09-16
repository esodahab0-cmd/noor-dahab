export async function compressImage(
  video: HTMLVideoElement,
  maxWidth = 400,
  quality = 0.55
): Promise<{ base64: string; isDark: boolean; brightness: number }> {
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
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return reject(new Error("No canvas context"));

      ctx.drawImage(video, 0, 0, width, height);

      // Analyze brightness
      let isDark = false;
      let brightness = 128;
      try {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        let colorSum = 0;
        const step = 4 * 4; // Sample every 4th pixel for speed
        let sampled = 0;
        for (let i = 0; i < data.length; i += step) {
          colorSum += (data[i] + data[i + 1] + data[i + 2]) / 3;
          sampled++;
        }
        brightness = Math.round(colorSum / (sampled || 1));
        isDark = brightness < 38; // Below 38 out of 255 is dark
      } catch (e) {}

      const base64 = canvas.toDataURL("image/jpeg", quality);
      resolve({ base64, isDark, brightness });
    } catch (e) { reject(e); }
  });
}