import {
  bool as _bool,
  BOOL_PRESETS as _BOOL_PRESETS,
  bytes as _bytes,
  percent as _percent,
  uptime as _uptime,
} from '@epdoc/fmt';
import type {
  BoolFormatterOptions as _BoolFormatterOptions,
  BoolPresetName as _BoolPresetName,
  BytesOptions as _BytesOptions,
  PercentOptions as _PercentOptions,
  UptimeOptions as _UptimeOptions,
} from '@epdoc/fmt';

export { _bool as bool, _BOOL_PRESETS as BOOL_PRESETS, _bytes as bytes, _percent as percent, _uptime as uptime };
export type {
  _BoolFormatterOptions as BoolFormatterOptions,
  _BoolPresetName as BoolPresetName,
  _BytesOptions as BytesOptions,
  _PercentOptions as PercentOptions,
  _UptimeOptions as UptimeOptions,
};

export const formatters = { bool: _bool, bytes: _bytes, percent: _percent, uptime: _uptime };
