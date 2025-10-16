/**
 * Filter Builder Utilities for PumpFun API Client
 *
 * This module provides predefined filter builders for common use cases
 * and utilities for creating custom filters.
 */

import { LiveCoin } from '../types';

/**
 * Custom filter function type for advanced filtering
 */
export type StreamFilterFunction = (stream: LiveCoin) => boolean;

/**
 * Helper functions for common filter patterns
 */
export const FilterBuilders = {
  /**
   * Filter for high-quality streams with good engagement
   */
  highQualityStreams: (): StreamFilterFunction => {
    return (stream: LiveCoin): boolean => {
      const hasTitle = stream.livestream_title && stream.livestream_title.trim().length > 10;
      const hasDescription = stream.description && stream.description.trim().length > 50;
      const hasSocial = !!(stream.twitter || stream.telegram);
      const hasParticipants = (stream.num_participants ?? 0) >= 5;
      const hasActivity = (stream.reply_count ?? 0) >= 10;

      return Boolean(hasTitle && hasDescription && hasSocial && hasParticipants && hasActivity);
    };
  },

  /**
   * Filter for new and trending streams
   */
  newAndTrending: (maxAgeHours: number = 24): StreamFilterFunction => {
    return (stream: LiveCoin) => {
      const now = Date.now();
      const ageHours = (now - stream.created_timestamp * 1000) / (1000 * 60 * 60);
      const isRecent = ageHours <= maxAgeHours;
      const hasEngagement = (stream.num_participants ?? 0) >= 3;
      const isGrowing = (stream.reply_count ?? 0) >= 5;

      return isRecent && (hasEngagement || isGrowing);
    };
  },

  /**
   * Filter for established streams with stable metrics
   */
  establishedStreams: (minMarketCap: number = 10000): StreamFilterFunction => {
    return (stream: LiveCoin) => {
      const hasEstablishedCap = stream.usd_market_cap >= minMarketCap;
      const hasConsistentActivity = (stream.num_participants ?? 0) >= 10;
      const hasSustainedEngagement = (stream.reply_count ?? 0) >= 20;

      return hasEstablishedCap && hasConsistentActivity && hasSustainedEngagement;
    };
  },

  /**
   * Filter for active community streams
   */
  activeCommunity: (minRepliesPerHour: number = 5): StreamFilterFunction => {
    return (stream: LiveCoin) => {
      const now = Date.now();
      const ageHours = (now - stream.created_timestamp * 1000) / (1000 * 60 * 60);
      const repliesPerHour = ageHours > 0 ? (stream.reply_count ?? 0) / ageHours : 0;
      const isActiveNow = (stream.num_participants ?? 0) >= 5;
      const hasSocial = !!(stream.twitter || stream.telegram);

      return repliesPerHour >= minRepliesPerHour && isActiveNow && hasSocial;
    };
  },

  /**
   * Filter for professional/potentially valuable streams
   */
  professionalStreams: (): StreamFilterFunction => {
    return (stream: LiveCoin): boolean => {
      const hasLongTitle = stream.livestream_title && stream.livestream_title.length >= 20;
      const hasDetailedDescription = stream.description && stream.description.length >= 200;
      const hasBranding = !!(stream.image_uri && stream.image_uri !== '');
      const hasSocialPresence = !!(stream.twitter && stream.telegram);
      const hasSignificantCap = stream.usd_market_cap >= 5000;

      return Boolean(
        hasLongTitle &&
          hasDetailedDescription &&
          hasBranding &&
          hasSocialPresence &&
          hasSignificantCap
      );
    };
  },

  /**
   * Filter for streams with specific market cap range
   */
  marketCapRange: (min: number, max: number): StreamFilterFunction => {
    return (stream: LiveCoin) => {
      return stream.usd_market_cap >= min && stream.usd_market_cap <= max;
    };
  },

  /**
   * Filter for streams with specific participant range
   */
  participantRange: (min: number, max: number): StreamFilterFunction => {
    return (stream: LiveCoin) => {
      const participants = stream.num_participants ?? 0;
      return participants >= min && participants <= max;
    };
  },
};

/**
 * Create named custom filter function
 */
export function createCustomFilter(filterFn: StreamFilterFunction, name?: string): StreamFilterFunction {
  // Create a wrapper function to preserve the name for debugging
  const wrapper = (stream: LiveCoin) => filterFn(stream);
  if (name) {
    Object.defineProperty(wrapper, 'name', {
      value: name,
      writable: false,
      configurable: true,
    });
  }
  return wrapper;
}