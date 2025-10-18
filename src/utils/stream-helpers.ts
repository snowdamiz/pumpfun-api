import { FilterCriteria, LiveCoin } from '../types';

export function processStreamFilters(streams: LiveCoin[], criteria: FilterCriteria): LiveCoin[] {
  let filtered = [...streams];

  // Filter by participant count
  if (criteria.minParticipants !== undefined) {
    filtered = filtered.filter(
      stream => (stream.num_participants ?? 0) >= criteria.minParticipants!
    );
  }

  if (criteria.maxParticipants !== undefined) {
    filtered = filtered.filter(
      stream => (stream.num_participants ?? 0) <= criteria.maxParticipants!
    );
  }

  // Filter by market cap range
  if (criteria.marketCapRange) {
    if (criteria.marketCapRange.min !== undefined) {
      filtered = filtered.filter(stream => stream.usd_market_cap >= criteria.marketCapRange!.min!);
    }
    if (criteria.marketCapRange.max !== undefined) {
      filtered = filtered.filter(stream => stream.usd_market_cap <= criteria.marketCapRange!.max!);
    }
  }

  // Filter by creation time range
  if (criteria.createdTimeRange) {
    const startTime = new Date(criteria.createdTimeRange.start).getTime();
    const endTime = new Date(criteria.createdTimeRange.end).getTime();

    filtered = filtered.filter(stream => {
      const streamTime = stream.created_timestamp * 1000; // Convert to milliseconds
      return streamTime >= startTime && streamTime <= endTime;
    });
  }

  // Filter by social media presence
  if (criteria.hasSocialMedia) {
    if (criteria.hasSocialMedia.twitter !== undefined) {
      filtered = filtered.filter(stream => {
        const hasTwitter = !!(stream.twitter && stream.twitter.trim() !== '');
        return criteria.hasSocialMedia!.twitter ? hasTwitter : !hasTwitter;
      });
    }
    if (criteria.hasSocialMedia.telegram !== undefined) {
      filtered = filtered.filter(stream => {
        const hasTelegram = !!(stream.telegram && stream.telegram.trim() !== '');
        return criteria.hasSocialMedia!.telegram ? hasTelegram : !hasTelegram;
      });
    }
  }

  // Filter by content quality
  if (criteria.contentQuality) {
    if (criteria.contentQuality.hasTitle !== undefined) {
      filtered = filtered.filter(stream => {
        const hasTitle = !!(stream.livestream_title && stream.livestream_title.trim() !== '');
        return criteria.contentQuality!.hasTitle ? hasTitle : !hasTitle;
      });
    }
    if (criteria.contentQuality.hasDescription !== undefined) {
      filtered = filtered.filter(stream => {
        const hasDescription = !!(stream.description && stream.description.trim() !== '');
        return criteria.contentQuality!.hasDescription ? hasDescription : !hasDescription;
      });
    }
    if (criteria.contentQuality.minTitleLength !== undefined) {
      filtered = filtered.filter(
        stream => (stream.livestream_title?.length ?? 0) >= criteria.contentQuality!.minTitleLength!
      );
    }
    if (criteria.contentQuality.minDescriptionLength !== undefined) {
      filtered = filtered.filter(
        stream =>
          (stream.description?.length ?? 0) >= criteria.contentQuality!.minDescriptionLength!
      );
    }
  }

  // Filter by text patterns
  if (criteria.textPatterns) {
    if (criteria.textPatterns.nameContains && criteria.textPatterns.nameContains.length > 0) {
      filtered = filtered.filter(stream =>
        criteria.textPatterns!.nameContains!.some(pattern =>
          stream.name.toLowerCase().includes(pattern.toLowerCase())
        )
      );
    }
    if (criteria.textPatterns.symbolContains && criteria.textPatterns.symbolContains.length > 0) {
      filtered = filtered.filter(stream =>
        criteria.textPatterns!.symbolContains!.some(pattern =>
          stream.symbol.toLowerCase().includes(pattern.toLowerCase())
        )
      );
    }
    if (criteria.textPatterns.excludePatterns && criteria.textPatterns.excludePatterns.length > 0) {
      filtered = filtered.filter(stream => {
        const allText =
          `${stream.name} ${stream.symbol} ${stream.description || ''} ${stream.livestream_title || ''}`.toLowerCase();
        return !criteria.textPatterns!.excludePatterns!.some(pattern =>
          allText.includes(pattern.toLowerCase())
        );
      });
    }
  }

  // Apply sorting
  if (criteria.sortBy) {
    const sortOrder = criteria.sortOrder || 'desc';
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (criteria.sortBy) {
        case 'participants':
          comparison = (a.num_participants ?? 0) - (b.num_participants ?? 0);
          break;
        case 'market_cap':
          comparison = a.usd_market_cap - b.usd_market_cap;
          break;
        case 'created_at':
          comparison = a.created_timestamp - b.created_timestamp;
          break;
        default:
          return 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  return filtered;
}

export function getAppliedFilterNames(criteria: FilterCriteria): string[] {
  const filters: string[] = [];

  if (criteria.minParticipants !== undefined || criteria.maxParticipants !== undefined) {
    filters.push('participants');
  }
  if (criteria.marketCapRange) {
    filters.push('marketCap');
  }
  if (criteria.createdTimeRange) {
    filters.push('createdTime');
  }
  if (criteria.hasSocialMedia) {
    filters.push('socialMedia');
  }
  if (criteria.contentQuality) {
    filters.push('contentQuality');
  }
  if (criteria.textPatterns) {
    filters.push('textPatterns');
  }
  if (criteria.sortBy) {
    filters.push('sorting');
  }

  return filters;
}

export function summarizeFilterCriteria(criteria: FilterCriteria): Record<string, any> {
  const summary: Record<string, any> = {};

  if (criteria.minParticipants !== undefined || criteria.maxParticipants !== undefined) {
    summary.participantRange = {
      min: criteria.minParticipants,
      max: criteria.maxParticipants,
    };
  }

  if (criteria.limit !== undefined) {
    summary.limit = criteria.limit;
  }

  if (criteria.offset !== undefined) {
    summary.offset = criteria.offset;
  }

  if (criteria.marketCapRange) {
    summary.marketCapRange = criteria.marketCapRange;
  }

  if (criteria.createdTimeRange) {
    summary.createdTimeRange = criteria.createdTimeRange;
  }

  if (criteria.hasSocialMedia) {
    summary.hasSocialMedia = criteria.hasSocialMedia;
  }

  if (criteria.contentQuality) {
    summary.contentQuality = criteria.contentQuality;
  }

  if (criteria.textPatterns) {
    summary.textPatterns = {
      nameContains: criteria.textPatterns.nameContains?.length || 0,
      symbolContains: criteria.textPatterns.symbolContains?.length || 0,
      excludePatterns: criteria.textPatterns.excludePatterns?.length || 0,
    };
  }

  if (criteria.sortBy) {
    summary.sorting = `${criteria.sortBy}_${criteria.sortOrder || 'desc'}`;
  }

  return summary;
}

export function parseStreamUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    return pathParts[pathParts.length - 1] || null;
  } catch {
    return null;
  }
}
