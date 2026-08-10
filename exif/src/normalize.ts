import { _ } from '@epdoc/type';
import type { Integer } from '@epdoc/type';
import { APP_NORMALIZE_RULES, CAMERA_MODEL_MAP } from './consts.ts';
import type { Metadata } from './meta-types.ts';

export const CODEC_AUDIO_UNKNOWN = 'Unknown Audio Codec';

// ============================================================================
// Normalization helpers (moved from file.ts so defs can use them)
// ============================================================================

export function cameraName(meta: Metadata): string | undefined {
  const make = meta.Make ?? meta.ComAndroidManufacturer;
  const model = (meta.Model ?? meta.ComAndroidModel)?.toUpperCase();
  if (make && model && CAMERA_MODEL_MAP[make]?.[model]) {
    return `${make} ${CAMERA_MODEL_MAP[make][model]}`;
  }
}

export function application(software: string | undefined): string | undefined {
  if (!software) return undefined;
  for (const rule of APP_NORMALIZE_RULES) {
    if (rule.pattern.test(software)) {
      return rule.label;
    }
  }
  return software;
}

export function videoCodec(meta: Metadata): string | undefined {
  const raw = meta.VideoCodecID ??
    meta.CompressorName ??
    meta.CompressorID ??
    meta.VideoCodec ??
    meta.VideoCompression ??
    meta.Compressor;
  if (!raw) return 'Unknown Video Codec';

  // Matroska / ISO Identifiers & Common Strings
  if (/HEVC|H265|V_MPEGH\/ISO\/HEVC/i.test(raw)) return 'H.265 / HEVC';
  if (/AVC|H264|V_MPEG4\/ISO\/AVC|avc1/i.test(raw)) return 'H.264 / AVC';
  if (/VP9|V_VP9/i.test(raw)) return 'VP9';
  if (/VP8|V_VP8/i.test(raw)) return 'VP8';
  if (/AV1|V_AV1|av01/i.test(raw)) return 'AV1';
  if (/MPEG2|V_MPEG2/i.test(raw)) return 'MPEG-2';
  if (/MPEG4|V_MS\/VFW\/FOURCC|mp4v/i.test(raw)) return 'MPEG-4 Visual';
  if (/ProRes|apcn|apch|apcs|apco|422|4444/i.test(raw)) return 'Apple ProRes';
  if (/DNxHD|DNxHR|AVdn/i.test(raw)) return 'Avid DNxHD/HR';
  if (/Theora|V_THEORA/i.test(raw)) return 'Theora';

  // Return original trimmed string if no standard regex pattern matched
  return raw;
}
export function audioCodec(meta: Metadata): string | undefined {
  const raw = meta.AudioCodecID ??
    meta.AudioFormat ??
    meta.AudioCodec ??
    meta.AudioEncoding;
  if (!raw) return CODEC_AUDIO_UNKNOWN;

  // Matroska / ISO Identifiers & Common Strings
  if (/OPUS|A_OPUS/i.test(raw)) return 'Opus';
  if (/AAC|A_AAC|mp4a|0x00ff/i.test(raw)) return 'AAC';
  if (/FLAC|A_FLAC/i.test(raw)) return 'FLAC';
  if (/DTS|A_DTS/i.test(raw)) return 'DTS';
  if (/AC3|A_AC3|Dolby Digital/i.test(raw)) return 'AC-3 (Dolby Digital)';
  if (/EAC3|A_EAC3|EC-3|Dolby Digital Plus/i.test(raw)) return 'E-AC-3 (Dolby Digital Plus)';
  if (/TRUEHD|A_TRUEHD/i.test(raw)) return 'Dolby TrueHD';
  if (/Vorbis|A_VORBIS/i.test(raw)) return 'Vorbis';
  if (/MP3|A_MPEG\/L3|0x0055/i.test(raw)) return 'MP3';
  if (/PCM|A_PCM|lpcm|twos|sowt|0x0001/i.test(raw)) return 'PCM (Uncompressed)';
  if (/ALAC|alac/i.test(raw)) return 'ALAC (Apple Lossless)';

  // Return original trimmed string if no standard regex pattern matched
  return raw;
}

export interface VideoRes {
  width?: Integer;
  height?: Integer;
  tag?: string;
  isCropped?: boolean;
}

export function videoResolution(meta: Metadata): VideoRes | undefined {
  const w = _.isDefined(meta.ImageWidth) ? meta.ImageWidth : meta.SourceImageWidth;
  const h = _.isDefined(meta.ImageHeight) ? meta.ImageHeight : meta.SourceImageHeight;
  if (!w || !h) return undefined;
  const width = _.asInt(w);
  const height = _.asInt(h);

  // Check height range (accounting for cropped letterboxes)
  if (h >= 2000 || w >= 3800) {
    return { tag: '4K', width, height, isCropped: height < 2160 };
  }
  if (h >= 1350 || w >= 2500) {
    return { tag: '1440p', width, height, isCropped: height < 1440 };
  }
  if (h >= 960 || w >= 1800) {
    return { tag: '1080p', width, height, isCropped: height < 1080 };
  }
  if (h) {
    return { tag: '720p', width, height, isCropped: height < 720 };
  }
  if (h >= 500 || w >= 900) {
    return { tag: '576p', width, height, isCropped: height < 576 };
  }
  if (h) {
    return { tag: '480p', width, height, isCropped: height < 480 };
  }

  return { tag: 'SD', width, height, isCropped: false };
}

/**
 * Normalize offset strings (e.g., "-0600" or "Z") into ISO "+00:00" / "-06:00" format.
 */
export function tzOffset(tz: string): string {
  const trimmed = tz.trim();
  if (trimmed === 'Z') return '+00:00';
  if (/^[+-]\d{4}$/.test(trimmed)) {
    return `${trimmed.slice(0, 3)}:${trimmed.slice(3)}`;
  }
  return trimmed;
}
