/**
 * @copyright   2016, Miles Johnson
 * @license     https://opensource.org/licenses/MIT
 * @flow
 */

import React, { PropTypes } from 'react';
import { UNICODE_TO_SHORTNAME, SHORTNAME_TO_UNICODE, SHORTNAME_TO_CODEPOINT } from '../data/emoji';

import type { EmojiProps } from '../types';

// http://git.emojione.com/demos/latest/sprites-png.html
// http://git.emojione.com/demos/latest/sprites-svg.html
// https://css-tricks.com/using-svg/
export default function Emoji({ shortName, unicode, emojiPath }: EmojiProps) {
  if (!shortName && !unicode) {
    throw new Error('Emoji component requires a `unicode` character or a `shortName`.');
  }

  // Return the invalid value instead of throwing errors,
  // as this will avoid unnecessary noise in production.
  if (
    (unicode && typeof UNICODE_TO_SHORTNAME[unicode] === 'undefined') ||
    (shortName && typeof SHORTNAME_TO_UNICODE[shortName] === 'undefined')
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

  const codePoint = SHORTNAME_TO_CODEPOINT[shortName];
  const path = emojiPath || '{{codepoint}}';
  const ext = emojiPath ? emojiPath.substr(-3).toLowerCase() : '';

  return (
    <span
      className={`interweave__emoji ${ext}`}
      data-unicode={unicode}
      data-codepoint={codePoint}
      data-shortname={shortName}
    >
      <img src={path.replace('{{codepoint}}', codePoint)} alt={shortName} />
    </span>
  );
}

Emoji.propTypes = {
  shortName: PropTypes.string,
  unicode: PropTypes.string,
  emojiPath: PropTypes.string,
};
