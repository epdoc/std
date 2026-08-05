import { APP_NORMALIZE_RULES, CAMERA_MODEL_MAP } from './consts.ts';
import type { Metadata } from './metadata.ts';

// ============================================================================
// Normalization helpers (moved from file.ts so defs can use them)
// ============================================================================

export function cameraName(meta: Metadata): string | undefined {
  const make = meta.Make;
  const model = meta.Model?.toUpperCase();
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
  if (!raw) return 'Unknown Audio Codec';

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
