export type MediaGpsLocation = {
  latitude: number;
  longitude: number;
};

export type MediaOptimizationStatus =
  | "not_needed"
  | "optimized"
  | "skipped"
  | "failed";

export type MediaPreparationResult = {
  file: File;
  originalSize: number;
  optimizedSize: number;
  status: MediaOptimizationStatus;
  error?: string;
};

export type LocationSuggestion = {
  latitude: number;
  longitude: number;
  confidence: number;
  source: "media_gps" | "mixed_media";
  label: string;
};

const IMAGE_OPTIMIZE_THRESHOLD = 2.5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 2400;
const JPEG_QUALITY = 0.86;
const NEARBY_DISTANCE_METERS = 350;
const VIDEO_OPTIMIZE_THRESHOLD = 12 * 1024 * 1024;
const MAX_VIDEO_DIMENSION = 1080;
let ffmpegInstancePromise: Promise<
  import("@ffmpeg/ffmpeg").FFmpeg
> | null = null;

export async function prepareMediaForUpload(
  file: File
): Promise<MediaPreparationResult> {
  if (file.type.startsWith("image/")) {
    return prepareImageForUpload(file);
  }

  if (file.type.startsWith("video/")) {
    return prepareVideoForUpload(file);
  }

  return {
    file,
    originalSize: file.size,
    optimizedSize: file.size,
    status: "skipped",
  };
}

export async function prepareImageForUpload(
  file: File
): Promise<MediaPreparationResult> {
  const originalSize = file.size;

  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return {
      file,
      originalSize,
      optimizedSize: file.size,
      status: "skipped",
    };
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height)
    );

    if (file.size <= IMAGE_OPTIMIZE_THRESHOLD && scale === 1) {
      bitmap.close();
      return {
        file,
        originalSize,
        optimizedSize: file.size,
        status: "not_needed",
      };
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));

    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      throw new Error("Canvas is not available.");
    }

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const outputType = file.type === "image/png" ? "image/webp" : file.type;
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, outputType, JPEG_QUALITY);
    });

    if (!blob || blob.size >= file.size) {
      return {
        file,
        originalSize,
        optimizedSize: file.size,
        status: "not_needed",
      };
    }

    const extension = outputType === "image/webp" ? "webp" : "jpg";
    const baseName = file.name.replace(/\.[^.]+$/, "");
    const optimizedFile = new File([blob], `${baseName}.${extension}`, {
      type: outputType,
      lastModified: Date.now(),
    });

    return {
      file: optimizedFile,
      originalSize,
      optimizedSize: optimizedFile.size,
      status: "optimized",
    };
  } catch {
    return {
      file,
      originalSize,
      optimizedSize: file.size,
      status: "failed",
    };
  }
}

async function prepareVideoForUpload(
  file: File
): Promise<MediaPreparationResult> {
  const originalSize = file.size;

  if (file.size <= VIDEO_OPTIMIZE_THRESHOLD && file.type === "video/mp4") {
    return {
      file,
      originalSize,
      optimizedSize: file.size,
      status: "not_needed",
    };
  }

  try {
    const ffmpeg = await getFfmpeg();
    const { fetchFile } = await import("@ffmpeg/util");
    const inputName = `input.${getFileExtension(file.name, "video")}`;
    const outputName = "output.mp4";

    try {
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch {
      // Files may not exist from a previous run.
    }

    await ffmpeg.writeFile(inputName, await fetchFile(file));
    await ffmpeg.exec([
      "-i",
      inputName,
      "-vf",
      `scale='min(${MAX_VIDEO_DIMENSION},iw)':-2:force_original_aspect_ratio=decrease`,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "25",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      outputName,
    ]);

    const output = await ffmpeg.readFile(outputName);
    const bytes =
      output instanceof Uint8Array
        ? output
        : new TextEncoder().encode(output);
    const arrayBuffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(arrayBuffer).set(bytes);
    const blob = new Blob([arrayBuffer], { type: "video/mp4" });

    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    if (!blob || blob.size >= file.size) {
      return {
        file,
        originalSize,
        optimizedSize: file.size,
        status: "not_needed",
      };
    }

    const baseName = file.name.replace(/\.[^.]+$/, "");
    const optimizedFile = new File([blob], `${baseName}.mp4`, {
      type: "video/mp4",
      lastModified: Date.now(),
    });

    return {
      file: optimizedFile,
      originalSize,
      optimizedSize: optimizedFile.size,
      status: "optimized",
    };
  } catch (error) {
    return {
      file,
      originalSize,
      optimizedSize: file.size,
      status: "failed",
      error:
        error instanceof Error
          ? error.message
          : "Video compression failed.",
    };
  }
}

async function getFfmpeg() {
  if (!ffmpegInstancePromise) {
    ffmpegInstancePromise = (async () => {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const ffmpeg = new FFmpeg();

      await ffmpeg.load({
        coreURL: "/ffmpeg/ffmpeg-core.js",
        wasmURL: "/ffmpeg/ffmpeg-core.wasm",
      });

      return ffmpeg;
    })();
  }

  return ffmpegInstancePromise;
}

function getFileExtension(fileName: string, fallback: string) {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? fallback;
}

export async function extractJpegGps(file: File): Promise<MediaGpsLocation | null> {
  if (file.type !== "image/jpeg") return null;

  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);

  if (view.getUint16(0, false) !== 0xffd8) return null;

  let offset = 2;

  while (offset < view.byteLength) {
    const marker = view.getUint16(offset, false);
    offset += 2;

    if (marker === 0xffda || marker === 0xffd9) break;

    const size = view.getUint16(offset, false);
    const segmentStart = offset + 2;

    if (marker === 0xffe1 && readAscii(view, segmentStart, 6) === "Exif\0\0") {
      return readExifGps(view, segmentStart + 6);
    }

    offset += size;
  }

  return null;
}

export function createLocationSuggestion(
  locations: MediaGpsLocation[]
): LocationSuggestion | null {
  if (locations.length === 0) return null;

  const clusters: MediaGpsLocation[][] = [];

  for (const location of locations) {
    const cluster = clusters.find((items) =>
      items.some(
        (item) =>
          distanceMeters(
            item.latitude,
            item.longitude,
            location.latitude,
            location.longitude
          ) <= NEARBY_DISTANCE_METERS
      )
    );

    if (cluster) {
      cluster.push(location);
    } else {
      clusters.push([location]);
    }
  }

  const largest = clusters.sort((a, b) => b.length - a.length)[0];
  if (!largest) return null;

  const latitude =
    largest.reduce((total, item) => total + item.latitude, 0) / largest.length;
  const longitude =
    largest.reduce((total, item) => total + item.longitude, 0) / largest.length;
  const confidence = Math.min(1, largest.length / locations.length);

  return {
    latitude,
    longitude,
    confidence,
    source: clusters.length > 1 ? "mixed_media" : "media_gps",
    label: formatCoordinateLabel(latitude, longitude),
  };
}

export function formatCoordinateLabel(latitude: number, longitude: number) {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

function readExifGps(view: DataView, tiffStart: number) {
  const endianMark = readAscii(view, tiffStart, 2);
  const littleEndian = endianMark === "II";

  if (!littleEndian && endianMark !== "MM") return null;
  if (view.getUint16(tiffStart + 2, littleEndian) !== 42) return null;

  const firstIfdOffset = view.getUint32(tiffStart + 4, littleEndian);
  const gpsIfdOffset = findTagValueOffset(
    view,
    tiffStart + firstIfdOffset,
    0x8825,
    littleEndian
  );

  if (!gpsIfdOffset) return null;

  const gpsIfd = tiffStart + gpsIfdOffset;
  const latitudeRef = readAsciiTag(view, tiffStart, gpsIfd, 0x0001, littleEndian);
  const latitude = readRationalTripletTag(
    view,
    tiffStart,
    gpsIfd,
    0x0002,
    littleEndian
  );
  const longitudeRef = readAsciiTag(
    view,
    tiffStart,
    gpsIfd,
    0x0003,
    littleEndian
  );
  const longitude = readRationalTripletTag(
    view,
    tiffStart,
    gpsIfd,
    0x0004,
    littleEndian
  );

  if (latitude === null || longitude === null) return null;

  return {
    latitude: latitudeRef === "S" ? -latitude : latitude,
    longitude: longitudeRef === "W" ? -longitude : longitude,
  };
}

function findTagValueOffset(
  view: DataView,
  ifdStart: number,
  tagId: number,
  littleEndian: boolean
) {
  const entries = view.getUint16(ifdStart, littleEndian);

  for (let index = 0; index < entries; index += 1) {
    const entry = ifdStart + 2 + index * 12;
    const tag = view.getUint16(entry, littleEndian);

    if (tag === tagId) {
      return view.getUint32(entry + 8, littleEndian);
    }
  }

  return null;
}

function readAsciiTag(
  view: DataView,
  tiffStart: number,
  ifdStart: number,
  tagId: number,
  littleEndian: boolean
) {
  const entries = view.getUint16(ifdStart, littleEndian);

  for (let index = 0; index < entries; index += 1) {
    const entry = ifdStart + 2 + index * 12;
    const tag = view.getUint16(entry, littleEndian);
    const count = view.getUint32(entry + 4, littleEndian);

    if (tag === tagId) {
      if (count <= 4) return readAscii(view, entry + 8, count).replace(/\0/g, "");

      const offset = view.getUint32(entry + 8, littleEndian);
      return readAscii(view, tiffStart + offset, count).replace(/\0/g, "");
    }
  }

  return "";
}

function readRationalTripletTag(
  view: DataView,
  tiffStart: number,
  ifdStart: number,
  tagId: number,
  littleEndian: boolean
) {
  const offset = findTagValueOffset(view, ifdStart, tagId, littleEndian);
  if (!offset) return null;

  const values = [0, 1, 2].map((index) => {
    const valueOffset = tiffStart + offset + index * 8;
    const numerator = view.getUint32(valueOffset, littleEndian);
    const denominator = view.getUint32(valueOffset + 4, littleEndian);
    return denominator === 0 ? 0 : numerator / denominator;
  });

  return values[0] + values[1] / 60 + values[2] / 3600;
}

function readAscii(view: DataView, offset: number, length: number) {
  let output = "";

  for (let index = 0; index < length; index += 1) {
    output += String.fromCharCode(view.getUint8(offset + index));
  }

  return output;
}

function distanceMeters(
  latA: number,
  lonA: number,
  latB: number,
  lonB: number
) {
  const earthRadiusMeters = 6_371_000;
  const latDelta = degreesToRadians(latB - latA);
  const lonDelta = degreesToRadians(lonB - lonA);
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(degreesToRadians(latA)) *
      Math.cos(degreesToRadians(latB)) *
      Math.sin(lonDelta / 2) *
      Math.sin(lonDelta / 2);

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}
