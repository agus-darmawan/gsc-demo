/** Current <video> frame as a JPEG data URL, or null when unavailable. */
export function captureFrame(
  video: HTMLVideoElement | null,
  maxWidth = 1280,
  quality = 0.85,
): string | null {
  if (!video || video.readyState < 2 || !video.videoWidth) return null;

  const scale = Math.min(1, maxWidth / video.videoWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  try {
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    // Tainted canvas: cross-origin video without CORS headers.
    return null;
  }
}
