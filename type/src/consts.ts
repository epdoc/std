/**
 * Regular expression definitions for various patterns.
 */
export const REGEX = {
  isTrue: new RegExp(/^(true|yes|on)$/, 'i'),
  isFalse: new RegExp(/^(false|no|off)$/, 'i'),
  allHex: new RegExp(/^[0-9a-fA-F]+$/),
  firstUppercase: new RegExp(/(^[A-Z])/),
  allUppercase: new RegExp(/([A-Z])/, 'g'),
  firstCapitalize: new RegExp(/^([a-z])/),
  allCapitalize: new RegExp(/(\_[a-z])/, 'gi'),
  tr: new RegExp(/^[\[]tr[\]](.+)$/),
  camel2dash: new RegExp(/([a-z0-9])([A-Z])/, 'g'),
  dash2camel: new RegExp(/-(.)/, 'g'),
  escMatch: new RegExp(/[.*+?^${}()|[\]\\]/g),
  // customElement: new RegExp(/CustomElement$/),
  // html: new RegExp(/[&<>"'\/]/, 'g'),
  // instr: new RegExp(/^[\[]([^\]]+)[\]](.*)$/),
};
