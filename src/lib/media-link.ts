export function driveEmbedUrl(link: string): string | null {
  if (!/drive\.google\.com/.test(link)) return null;
  const fileIdMatch = link.match(/\/file\/d\/([^/?]+)/) ?? link.match(/[?&]id=([^&]+)/);
  if (!fileIdMatch) return null;
  return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
}

// Supabase Storage's public object URL forces a Content-Disposition:
// attachment response when a `download` query param is present, instead of
// opening/playing inline in the browser tab.
export function downloadUrl(publicUrl: string, filename: string): string {
  const separator = publicUrl.includes("?") ? "&" : "?";
  return `${publicUrl}${separator}download=${encodeURIComponent(filename)}`;
}

export function mediaFileName(storagePath: string, index: number): string {
  const ext = storagePath.split(".").pop() || "jpg";
  return `${index + 1}.${ext}`;
}

// Triggers a download for every item, staggered so the browser doesn't
// choke on/drop several simultaneous downloads or flag it as a pop-up burst.
export function downloadAllMedia(media: Array<{ url: string; storage_path: string }>) {
  media.forEach((m, i) => {
    setTimeout(() => {
      const name = mediaFileName(m.storage_path, i);
      const a = document.createElement("a");
      a.href = downloadUrl(m.url, name);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }, i * 300);
  });
}
