/**
 * @copyright   2016, Miles Johnson
 * @license     https://opensource.org/licenses/MIT
 * @flow
 */

import React, { PropTypes } from 'react';
import emojiData, { UNICODE_TO_SHORTNAME, SHORTNAME_TO_UNICODE } from '../data/emoji';

import type { EmojiProps } from '../types';

// http://git.emojione.com/demos/latest/sprites-png.html
// http://git.emojione.com/demos/latest/sprites-svg.html
// https://css-tricks.com/using-svg/
export default function Emoji({ shortName, unicode, emojiPath, enlargeEmoji = false }: EmojiProps) {
  if (!shortName && !unicode) {
    throw new Error('Emoji component requires a `unicode` character or a `shortName`.');
  }

  // Return the invalid value instead of throwing errors,
  // as this will avoid unnecessary noise in production.
  if (
    (unicode && !UNICODE_TO_SHORTNAME[unicode]) ||
    (shortName && !SHORTNAME_TO_UNICODE[shortName])
  ) {
    return (
      <span>{unicode || shortName}</span>
    );
  }

  // Retrieve any missing values
  if (!shortName && unicode) {
    shortName = UNICODE_TO_SHORTNAME[unicode];
  } else if (!unicode && shortName) {
    unicode = SHORTNAME_TO_UNICODE[shortName];
  }

  const emoji = emojiData[shortName];
  const path = emojiPath || '{{hexcode}}';
  const ext = emojiPath ? emojiPath.substr(-3).toLowerCase() : '';
  const className = [
    'interweave__emoji',
    ext && `interweave__emoji--${ext}`,
    enlargeEmoji && 'interweave__emoji--large',
  ].filter(Boolean).join(' ');

  return (
    <span
      className={className}
      data-unicode={unicode}
      data-hexcode={emoji.hexCode}
      data-codepoint={emoji.codePoint.join('-')}
      data-shortname={shortName}
    >
      <img src={path.replace('{{hexcode}}', emoji.hexCode)} alt={shortName} />
    </span>
  );
}

Emoji.propTypes = {
  shortName: PropTypes.string,
  unicode: PropTypes.string,
  emojiPath: PropTypes.string,
  enlargeEmoji: PropTypes.bool,
};