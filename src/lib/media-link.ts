export function driveEmbedUrl(link: string): string | null {
  if (!/drive\.google\.com/.test(link)) return null;
  const fileIdMatch = link.match(/\/file\/d\/([^/?]+)/) ?? link.match(/[?&]id=([^&]+)/);
  if (!fileIdMatch) return null;
  return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
}

const VIDEO_EXTENSIONS = ["mp4", "mov", "webm", "m4v", "avi"];

// A carrossel can now mix photos and videos in the same post (see
// AdminPostEditor), so unlike a static/video post's fixed `type`, each
// media item's own file extension is what tells a thumbnail/preview
// whether to render an <img> or a <video>.
export function isVideoPath(storagePath: string): boolean {
  const ext = storagePath.split(".").pop()?.toLowerCase() ?? "";
  return VIDEO_EXTENSIONS.includes(ext);
}
