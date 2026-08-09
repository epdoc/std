import { DateTime } from '@epdoc/datetime';

/** WhatsApp mobile/shared: "IMG-20260406-WA0005.jpg" / "VID-20260406-WA0005.mp4" — date only. */
const REG_WHATSAPP_OLD = /^(?:IMG|VID)-(\d{4})(\d{2})(\d{2})-WA\d{4,}\./i;

/** WhatsApp desktop download: "WhatsApp Image 2026-06-29 at 17.20.56.jpeg" — full datetime. */
const REG_WHATSAPP_NEW =
  /^WhatsApp (?:Image|Video|Audio|Document|Sticker|Ptt) (\d{4})-(\d{2})-(\d{2}) at (\d{2})\.(\d{2})\.(\d{2})/i;

/** Signal desktop: "signal-2026-06-29-17-20-56-123.png". */
const REG_SIGNAL = /^signal-(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})(?:-(\d{3}))?/i;

/** 13-digit Unix epoch milliseconds embedded in the filename. */
const REG_EPOCH = /(?:^|[^0-9])(\d{13})(?:[^0-9]|$)/;

/** Generic compact datetime: "photo 2026-06-29 17-20-56.jpeg", "IMG_20260406_172056.jpg". */
const REG_GENERIC =
  /(?:^|[_.-])(\d{4})[_.-]?(\d{2})[_.-]?(\d{2})[_.-](\d{2})[_.-]?(\d{2})[_.-]?(\d{2})(?:(?:(\d{3}))?(?:[_.-]+(.+))?)?/i;

function build(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
): DateTime | undefined {
  try {
    return DateTime.fromComponents(year, month, day, hour, minute, second, millisecond);
  } catch {
    return undefined;
  }
}

/**
 * True when the filename follows a WhatsApp naming convention.
 *
 * Matches both the mobile pattern (`IMG-YYYYMMDD-WA####`, date only) and the
 * macOS desktop pattern (`WhatsApp Image YYYY-MM-DD at HH.MM.SS`).
 *
 * @param fileName The basename (with extension) of the file.
 */
export function isWhatsAppFilename(fileName: string | undefined): boolean {
  return !!fileName &&
    (REG_WHATSAPP_OLD.test(fileName) || REG_WHATSAPP_NEW.test(fileName));
}

/**
 * Extract a datetime from a media filename produced by common software
 * (WhatsApp, Signal, epoch-millisecond exports, or a generic compact pattern).
 *
 * The returned {@link DateTime} carries no timezone: it holds the wall-clock
 * components found in the filename. Callers interpret those components in the
 * timezone of their choosing, e.g. `withTz('local')` for timestamps recorded
 * on the local machine, or `withTz('utc')` for a canonical instant. The epoch
 * pattern is the exception — it returns a true instant (UTC).
 *
 * @param fileName The basename (with extension) of the file.
 * @returns The parsed date, or `undefined` when no pattern matches.
 */
export function dateFromFilename(fileName: string | undefined): DateTime | undefined {
  if (!fileName) return undefined;

  const waOld = fileName.match(REG_WHATSAPP_OLD);
  if (waOld) {
    return build(+waOld[1], +waOld[2], +waOld[3]);
  }

  const waNew = fileName.match(REG_WHATSAPP_NEW);
  if (waNew) {
    return build(+waNew[1], +waNew[2], +waNew[3], +waNew[4], +waNew[5], +waNew[6]);
  }

  const signal = fileName.match(REG_SIGNAL);
  if (signal) {
    return build(
      +signal[1],
      +signal[2],
      +signal[3],
      +signal[4],
      +signal[5],
      +signal[6],
      signal[7] ? +signal[7] : 0,
    );
  }

  const epoch = fileName.match(REG_EPOCH);
  if (epoch) {
    const dt = DateTime.fromEpochMilliseconds(+epoch[1]);
    if (dt.year >= 1980 && dt.year <= 2100) return dt;
  }

  const generic = fileName.match(REG_GENERIC);
  if (generic) {
    return build(
      +generic[1],
      +generic[2],
      +generic[3],
      +generic[4],
      +generic[5],
      +generic[6],
      generic[7] ? +generic[7] : 0,
    );
  }

  return undefined;
}
