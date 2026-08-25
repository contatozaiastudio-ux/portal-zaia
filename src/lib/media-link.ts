export function driveEmbedUrl(link: string): string | null {
  if (!/drive\.google\.com/.test(link)) return null;
  const fileIdMatch = link.match(/\/file\/d\/([^/?]+)/) ?? link.match(/[?&]id=([^&]+)/);
  if (!fileIdMatch) return null;
  return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
}
