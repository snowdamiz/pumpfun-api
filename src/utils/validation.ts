import { FilterCriteria, ContentFilters } from '../types';

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function isValidMintId(mintId: string): boolean {
  return typeof mintId === 'string' && mintId.length > 0 && /^[a-zA-Z0-9]+$/.test(mintId);
}

export function validateFilterCriteria(criteria: FilterCriteria): void {
  if (criteria.minParticipants !== undefined && criteria.minParticipants < 0) {
    throw new ValidationError('minParticipants must be non-negative');
  }

  if (criteria.maxParticipants !== undefined && criteria.maxParticipants < 0) {
    throw new ValidationError('maxParticipants must be non-negative');
  }

  if (criteria.minParticipants !== undefined && criteria.maxParticipants !== undefined) {
    if (criteria.minParticipants > criteria.maxParticipants) {
      throw new ValidationError('minParticipants cannot be greater than maxParticipants');
    }
  }

  if (criteria.limit !== undefined && criteria.limit <= 0) {
    throw new ValidationError('limit must be positive');
  }

  if (criteria.offset !== undefined && criteria.offset < 0) {
    throw new ValidationError('offset must be non-negative');
  }

  if (criteria.marketCapRange) {
    if (criteria.marketCapRange.min !== undefined && criteria.marketCapRange.min < 0) {
      throw new ValidationError('marketCapRange.min must be non-negative');
    }
    if (criteria.marketCapRange.max !== undefined && criteria.marketCapRange.max < 0) {
      throw new ValidationError('marketCapRange.max must be non-negative');
    }
    if (criteria.marketCapRange.min !== undefined && criteria.marketCapRange.max !== undefined) {
      if (criteria.marketCapRange.min > criteria.marketCapRange.max) {
        throw new ValidationError('marketCapRange.min cannot be greater than marketCapRange.max');
      }
    }
  }

  if (criteria.createdTimeRange) {
    const start = new Date(criteria.createdTimeRange.start);
    const end = new Date(criteria.createdTimeRange.end);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ValidationError('createdTimeRange must contain valid ISO date strings');
    }

    if (start >= end) {
      throw new ValidationError('createdTimeRange.start must be before createdTimeRange.end');
    }
  }

  if (criteria.contentQuality) {
    if (criteria.contentQuality.minTitleLength !== undefined && criteria.contentQuality.minTitleLength < 0) {
      throw new ValidationError('contentQuality.minTitleLength must be non-negative');
    }
    if (criteria.contentQuality.minDescriptionLength !== undefined && criteria.contentQuality.minDescriptionLength < 0) {
      throw new ValidationError('contentQuality.minDescriptionLength must be non-negative');
    }
  }

  if (criteria.sortBy && !['participants', 'market_cap', 'created_at'].includes(criteria.sortBy)) {
    throw new ValidationError('sortBy must be one of: participants, market_cap, created_at');
  }

  if (criteria.sortOrder && !['asc', 'desc'].includes(criteria.sortOrder)) {
    throw new ValidationError('sortOrder must be either "asc" or "desc"');
  }
}

export function validateContentFilters(filters: ContentFilters): void {
  if (filters.limit !== undefined && filters.limit <= 0) {
    throw new ValidationError('limit must be positive');
  }

  if (filters.maxHighlights !== undefined && filters.maxHighlights <= 0) {
    throw new ValidationError('maxHighlights must be positive');
  }

  if (filters.maxPreviousStreams !== undefined && filters.maxPreviousStreams <= 0) {
    throw new ValidationError('maxPreviousStreams must be positive');
  }

  if (filters.daysBack !== undefined && filters.daysBack <= 0) {
    throw new ValidationError('daysBack must be positive');
  }

  if (filters.minDuration !== undefined && filters.minDuration < 0) {
    throw new ValidationError('minDuration must be non-negative');
  }

  if (filters.maxDuration !== undefined && filters.maxDuration <= 0) {
    throw new ValidationError('maxDuration must be positive');
  }

  if (filters.minDuration !== undefined && filters.maxDuration !== undefined) {
    if (filters.minDuration > filters.maxDuration) {
      throw new ValidationError('minDuration cannot be greater than maxDuration');
    }
  }

  if (filters.minViewCount !== undefined && filters.minViewCount < 0) {
    throw new ValidationError('minViewCount must be non-negative');
  }

  if (filters.maxViewCount !== undefined && filters.maxViewCount < 0) {
    throw new ValidationError('maxViewCount must be non-negative');
  }

  if (filters.minViewCount !== undefined && filters.maxViewCount !== undefined) {
    if (filters.minViewCount > filters.maxViewCount) {
      throw new ValidationError('minViewCount cannot be greater than maxViewCount');
    }
  }

  if (filters.dateRange) {
    const start = new Date(filters.dateRange.start);
    const end = new Date(filters.dateRange.end);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ValidationError('dateRange must contain valid ISO date strings');
    }

    if (start >= end) {
      throw new ValidationError('dateRange.start must be before dateRange.end');
    }
  }

  if (filters.sortBy && !['created_at', 'duration', 'view_count', 'stream_start'].includes(filters.sortBy)) {
    throw new ValidationError('sortBy must be one of: created_at, duration, view_count, stream_start');
  }

  if (filters.sortOrder && !['ASC', 'DESC'].includes(filters.sortOrder)) {
    throw new ValidationError('sortOrder must be either "ASC" or "DESC"');
  }
}

export { ValidationError };

