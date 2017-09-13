/**
 * @copyright   2016, Miles Johnson
 * @license     https://opensource.org/licenses/MIT
 * @flow
 */

import React from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';
import { EmojiShape, EmojiPathShape } from 'interweave/lib/shapes';
import EmojiButton from './Emoji';
import {
  GROUPS,
  GROUP_RECENTLY_USED,
  GROUP_SEARCH_RESULTS,
  GROUP_SMILEYS_PEOPLE,
  SCROLL_BUFFER,
  SCROLL_DEBOUNCE,
} from './constants';

import type { Emoji, EmojiPath } from 'interweave'; // eslint-disable-line

type EmojiListProps = {
  activeEmojiIndex: number,
  activeGroup: string,
  emojiPath: EmojiPath,
  emojis: Emoji[],
  hasRecentlyUsed: boolean,
  onEnterEmoji: (emoji: Emoji) => void,
  onLeaveEmoji: (emoji: Emoji) => void,
  onSelectEmoji: (emoji: Emoji) => void,
  onSelectGroup: (group: string, reset?: boolean) => void,
  recentEmojis: Emoji[],
  scrollToGroup: string,
  searchQuery: string,
};

type EmojiListState = {
  loadedGroups: Set<string>,
};

export default class EmojiList extends React.PureComponent<EmojiListProps, EmojiListState> {
  container: ?HTMLDivElement;

  static contextTypes = {
    classNames: PropTypes.objectOf(PropTypes.string),
    messages: PropTypes.objectOf(PropTypes.string),
  };

  static propTypes = {
    activeEmojiIndex: PropTypes.number.isRequired,
    activeGroup: PropTypes.string.isRequired,
    emojiPath: EmojiPathShape.isRequired,
    emojis: PropTypes.arrayOf(EmojiShape).isRequired,
    hasRecentlyUsed: PropTypes.bool.isRequired,
    recentEmojis: PropTypes.arrayOf(EmojiShape).isRequired,
    scrollToGroup: PropTypes.string.isRequired,
    searchQuery: PropTypes.string.isRequired,
    onEnterEmoji: PropTypes.func.isRequired,
    onLeaveEmoji: PropTypes.func.isRequired,
    onSelectEmoji: PropTypes.func.isRequired,
    onSelectGroup: PropTypes.func.isRequired,
  };

  constructor({ activeGroup, emojis }: EmojiListProps) {
    super();

    const loadedGroups = [
      activeGroup,
      GROUP_RECENTLY_USED,
      GROUP_SEARCH_RESULTS,
    ];

    // When recently used emojis are rendered,
    // the smileys group is usually within view as well,
    // so we should preload both of them.
    if (activeGroup === GROUP_RECENTLY_USED) {
      loadedGroups.push(GROUP_SMILEYS_PEOPLE);
    }

    this.state = {
      loadedGroups: new Set(loadedGroups),
    };
  }

  /**
   * Update scroll position after the list has rendered.
   */
  componentDidUpdate(prevProps: EmojiListProps) {
    const { searchQuery, scrollToGroup } = this.props;

    // Search query has changed
    if (searchQuery && searchQuery !== prevProps.searchQuery) {
      this.scrollToGroup(GROUP_SEARCH_RESULTS);
    }

    // Scroll to group when the tab is clicked
    if (scrollToGroup && scrollToGroup !== prevProps.scrollToGroup) {
      this.scrollToGroup(scrollToGroup);
    }
  }

  /**
   * Partition the dataset into multiple arrays based on the group they belong to.
   */
  groupEmojis(): { [group: string]: Emoji[] } {
    const { emojis, hasRecentlyUsed, recentEmojis, searchQuery } = this.props;
    const groups = {};

    // Add recently used group if not searching
    if (!searchQuery && hasRecentlyUsed) {
      groups[GROUP_RECENTLY_USED] = recentEmojis;
    }

    // Partition emojis into separate groups
    emojis.forEach((emoji) => {
      const group = searchQuery ? GROUP_SEARCH_RESULTS : GROUPS[emoji.group];

      if (groups[group]) {
        groups[group].push(emoji);
      } else {
        groups[group] = [emoji];
      }
    });

    // Sort each group
    Object.keys(groups).forEach((group) => {
      if (group !== GROUP_RECENTLY_USED) {
        groups[group].sort((a, b) => a.order - b.order);
      }

      // Remove the group if no emojis
      if (groups[group].length === 0) {
        delete groups[group];
      }
    });

    return groups;
  }

  /**
   * Set the container div as the reference.
   */
  handleRef = (ref: ?HTMLDivElement) => {
    this.container = ref;
  };

  /**
   * Triggered when the container is scrolled.
   */
  handleScroll = (e: SyntheticWheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.persist();

    this.handleScrollDebounced(e.currentTarget);
  };

  /**
   * A scroll handler that is debounced for performance.
   */
  handleScrollDebounced = debounce((container) => {
    this.loadEmojiImages(container);
  }, SCROLL_DEBOUNCE);

  /**
   * Loop over each group section within the scrollable container
   * and determine the active group and whether to load emoji images.
   */
  loadEmojiImages(container: HTMLDivElement) {
    const { searchQuery } = this.props;
    const { loadedGroups } = this.state;
    let updateState = false;

    Array.from(container.children).forEach((section) => {
      const group = section.id.replace('emoji-group-', '');

      // While a group section is within view, update the active group
      if (
        !searchQuery &&
        section.offsetTop <= container.scrollTop &&
        (section.offsetTop + section.offsetHeight) > container.scrollTop
      ) {
        // Only update if not loaded
        if (!loadedGroups.has(group)) {
          loadedGroups.add(group);
          updateState = true;
        }

        // Only update if a different group
        if (group !== this.props.activeGroup) {
          this.props.onSelectGroup(group);
        }
      }

      // Before a group section is scrolled into view, lazy load emoji images
      if (
        !loadedGroups.has(group) &&
        section.offsetTop <= (container.scrollTop + container.offsetHeight + SCROLL_BUFFER)
      ) {
        loadedGroups.add(group);
        updateState = true;
      }
    });

    if (updateState) {
      this.setState({
        loadedGroups: new Set(loadedGroups),
      });
    }
  }

  /**
   * Scroll a group section to the top of the scrollable container.
   */
  scrollToGroup(group: string) {
    const element = document.getElementById(`emoji-group-${group}`);

    if (!element || !this.container) {
      return;
    }

    // Scroll to the section
    this.container.scrollTop = element.offsetTop;

    // Eager load emoji images
    this.loadEmojiImages(this.container);
  }

  render() {
    const {
      activeEmojiIndex,
      emojiPath,
      onEnterEmoji,
      onLeaveEmoji,
      onSelectEmoji,
    } = this.props;
    const { classNames, messages } = this.context;
    const { loadedGroups } = this.state;
    const groupedEmojis = this.groupEmojis();
    const noResults = (Object.keys(groupedEmojis).length === 0);

    console.log('EmojiList.render');

    return (
      <div
        className={classNames.emojis}
        ref={this.handleRef}
        onScroll={this.handleScroll}
      >
        {noResults ? (
          <div className={classNames.noResults}>
            {messages.noResults}
          </div>
        ) : (
          Object.keys(groupedEmojis).map(group => (
            <section
              key={group}
              className={classNames.emojisSection}
              id={`emoji-group-${group}`}
            >
              <header className={classNames.emojisHeader}>
                {messages[group]}
              </header>

              <div className={classNames.emojisBody}>
                {groupedEmojis[group].map((emoji, index) => (
                  <EmojiButton
                    key={emoji.hexcode}
                    active={index === activeEmojiIndex}
                    emoji={emoji}
                    emojiPath={emojiPath}
                    showImage={loadedGroups.has(group)}
                    onEnter={onEnterEmoji}
                    onLeave={onLeaveEmoji}
                    onSelect={onSelectEmoji}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    );
  }
}
