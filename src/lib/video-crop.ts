import "server-only";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Reels are shot 9:16; Instagram's feed/carousel standard is 4:5. This
// crops the height down to reach that ratio, centered — same idea as a
// photo center-crop, just applied to every frame of the video. Height is
// derived from width (iw*5/4) so it works regardless of the source
// resolution, as long as it's taller than 4:5 to begin with.
export async function cropVideoToFeedRatio(input: Buffer, sourceExt: string): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), "zaia-crop-"));
  const inPath = join(dir, `in.${sourceExt || "mp4"}`);
  const outPath = join(dir, "out.mp4");

  try {
    await writeFile(inPath, input);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inPath)
        .videoFilters("crop=iw:iw*5/4:0:(ih-iw*5/4)/2")
        .outputOptions(["-preset veryfast", "-movflags +faststart"])
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .save(outPath);
    });

    return await readFile(outPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
