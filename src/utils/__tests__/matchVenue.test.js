import { describe, it, expect } from 'vitest'
import { matchVenueLabel, matchVenueText } from '../matchVenue'

describe('matchVenueLabel', () => {
  it('returns venue.name when venueId hits in object lookup', () => {
    const match = { venueId: 'v1', location: 'old text' }
    const lookup = { v1: { name: '도깨비 운동장' } }
    expect(matchVenueLabel(match, lookup)).toBe('도깨비 운동장')
  })

  it('returns venue.name when venueId hits in function lookup', () => {
    const match = { venueId: 'v1' }
    const lookup = (id) => (id === 'v1' ? { name: '함수 운동장' } : null)
    expect(matchVenueLabel(match, lookup)).toBe('함수 운동장')
  })

  it('falls back to location when venueId is set but lookup miss (object)', () => {
    const match = { venueId: 'v999', location: '예전 텍스트' }
    const lookup = { v1: { name: '도깨비 운동장' } }
    expect(matchVenueLabel(match, lookup)).toBe('예전 텍스트')
  })

  it('falls back to location when venueId is set but lookup miss (function)', () => {
    const match = { venueId: 'v999', location: '예전 텍스트' }
    const lookup = () => null
    expect(matchVenueLabel(match, lookup)).toBe('예전 텍스트')
  })

  it('returns location when venueId is missing', () => {
    const match = { location: '직접 입력 장소' }
    expect(matchVenueLabel(match, {})).toBe('직접 입력 장소')
  })

  it('returns location when lookup is null', () => {
    const match = { venueId: 'v1', location: '예전 텍스트' }
    expect(matchVenueLabel(match, null)).toBe('예전 텍스트')
  })

  it('returns default fallback when neither venueId nor location exists', () => {
    expect(matchVenueLabel({}, {})).toBe('장소 미정')
    expect(matchVenueLabel({}, null)).toBe('장소 미정')
  })

  it('respects custom fallback', () => {
    expect(matchVenueLabel({}, null, '없음')).toBe('없음')
  })

  it('handles missing match', () => {
    expect(matchVenueLabel(null, null)).toBe('장소 미정')
    expect(matchVenueLabel(undefined, null)).toBe('장소 미정')
  })

  it('prefers venue.name over location even when both exist', () => {
    const match = { venueId: 'v1', location: '예전 텍스트' }
    const lookup = { v1: { name: '도깨비 운동장' } }
    expect(matchVenueLabel(match, lookup)).toBe('도깨비 운동장')
  })

  it('falls back to location when venue exists but has no name', () => {
    const match = { venueId: 'v1', location: '예전 텍스트' }
    const lookup = { v1: { id: 'v1' } } // no name
    expect(matchVenueLabel(match, lookup)).toBe('예전 텍스트')
  })
})

describe('matchVenueText', () => {
  it('uses empty fallback', () => {
    expect(matchVenueText({}, null)).toBe('')
    expect(matchVenueText({}, {})).toBe('')
  })

  it('returns venue.name when matched', () => {
    const match = { venueId: 'v1' }
    const lookup = { v1: { name: '도깨비 운동장' } }
    expect(matchVenueText(match, lookup)).toBe('도깨비 운동장')
  })

  it('returns location when no venue match', () => {
    const match = { location: '직접 텍스트' }
    expect(matchVenueText(match, null)).toBe('직접 텍스트')
  })
})
