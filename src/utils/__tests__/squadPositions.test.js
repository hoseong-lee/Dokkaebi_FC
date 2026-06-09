import { describe, it, expect } from 'vitest'
import { parsePositions, normalizePositions } from '../squadPositions'

describe('parsePositions', () => {
  it('parses new format { slotId: playerId } into Map', () => {
    const input = { GK: 'p1', CB1: 'p3', CB2: 'p4' }
    const result = parsePositions(input)
    expect(result).toBeInstanceOf(Map)
    expect(result.size).toBe(3)
    expect(result.get('GK')).toBe('p1')
    expect(result.get('CB1')).toBe('p3')
    expect(result.get('CB2')).toBe('p4')
  })

  it('parses legacy format { playerId: { slotId } } into Map<slotId, playerId>', () => {
    const input = {
      p1: { slotId: 'GK' },
      p3: { slotId: 'CB1' },
      p4: { slotId: 'CB2' }
    }
    const result = parsePositions(input)
    expect(result.size).toBe(3)
    expect(result.get('GK')).toBe('p1')
    expect(result.get('CB1')).toBe('p3')
    expect(result.get('CB2')).toBe('p4')
  })

  it('returns empty Map for empty input', () => {
    const result = parsePositions({})
    expect(result).toBeInstanceOf(Map)
    expect(result.size).toBe(0)
  })

  it('returns empty Map for null input', () => {
    const result = parsePositions(null)
    expect(result).toBeInstanceOf(Map)
    expect(result.size).toBe(0)
  })

  it('returns empty Map for undefined input', () => {
    const result = parsePositions(undefined)
    expect(result).toBeInstanceOf(Map)
    expect(result.size).toBe(0)
  })

  it('returns empty Map for non-object input', () => {
    expect(parsePositions('invalid').size).toBe(0)
    expect(parsePositions(123).size).toBe(0)
  })

  it('skips empty string values', () => {
    const input = { GK: 'p1', CB1: '' }
    const result = parsePositions(input)
    expect(result.size).toBe(1)
    expect(result.get('GK')).toBe('p1')
    expect(result.has('CB1')).toBe(false)
  })

  it('skips legacy entries without slotId', () => {
    const input = {
      p1: { slotId: 'GK' },
      p2: { foo: 'bar' },
      p3: null
    }
    const result = parsePositions(input)
    expect(result.size).toBe(1)
    expect(result.get('GK')).toBe('p1')
  })
})

describe('normalizePositions', () => {
  it('returns new format plain object from new format input', () => {
    const input = { GK: 'p1', CB1: 'p3' }
    const result = normalizePositions(input)
    expect(result).toEqual({ GK: 'p1', CB1: 'p3' })
    expect(result).not.toBeInstanceOf(Map)
    expect(typeof result).toBe('object')
  })

  it('converts legacy format to new format plain object', () => {
    const input = {
      p1: { slotId: 'GK' },
      p3: { slotId: 'CB1' }
    }
    const result = normalizePositions(input)
    expect(result).toEqual({ GK: 'p1', CB1: 'p3' })
  })

  it('returns empty object for empty input', () => {
    expect(normalizePositions({})).toEqual({})
    expect(normalizePositions(null)).toEqual({})
    expect(normalizePositions(undefined)).toEqual({})
  })
})
