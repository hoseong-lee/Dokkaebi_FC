import { describe, it, expect } from 'vitest'
import { matchResult, matchIntensity, quarterTally } from '../match'

describe('matchResult', () => {
  it('returns W when dokkaebi > opponent', () => {
    const match = { status: 'finished', score: { dokkaebi: 3, opponent: 1 } }
    expect(matchResult(match)).toBe('W')
  })

  it('returns L when dokkaebi < opponent', () => {
    const match = { status: 'finished', score: { dokkaebi: 1, opponent: 3 } }
    expect(matchResult(match)).toBe('L')
  })

  it('returns D when dokkaebi == opponent', () => {
    const match = { status: 'finished', score: { dokkaebi: 2, opponent: 2 } }
    expect(matchResult(match)).toBe('D')
  })

  it('returns null when match is not finished', () => {
    const match = { status: 'scheduled', score: { dokkaebi: 3, opponent: 1 } }
    expect(matchResult(match)).toBeNull()
  })

  it('returns null when score is null (legacy fallback)', () => {
    const match = { status: 'finished', score: null }
    expect(matchResult(match)).toBeNull()
  })

  it('returns null when score.dokkaebi is null', () => {
    const match = { status: 'finished', score: { dokkaebi: null, opponent: 1 } }
    expect(matchResult(match)).toBeNull()
  })

  it('returns null for undefined match', () => {
    expect(matchResult(undefined)).toBeNull()
    expect(matchResult(null)).toBeNull()
  })

  it('uses score even when quarters exist (score is single source of truth)', () => {
    // 쿼터별로는 2승 1패라도 골 득실 합계로 판정
    const match = {
      status: 'finished',
      score: { dokkaebi: 1, opponent: 5 },
      quarters: [
        { score: { dokkaebi: 1, opponent: 0 } },
        { score: { dokkaebi: 0, opponent: 0 } },
        { score: { dokkaebi: 0, opponent: 5 } }
      ]
    }
    expect(matchResult(match)).toBe('L')
  })
})

describe('quarterTally', () => {
  it('returns null when quarters is empty array', () => {
    expect(quarterTally({ quarters: [] })).toBeNull()
  })

  it('returns null when quarters is missing', () => {
    expect(quarterTally({})).toBeNull()
  })

  it('returns null when quarters is not array', () => {
    expect(quarterTally({ quarters: 'invalid' })).toBeNull()
  })

  it('aggregates win/loss/draw per quarter correctly', () => {
    const match = {
      quarters: [
        { score: { dokkaebi: 2, opponent: 1 } }, // W
        { score: { dokkaebi: 0, opponent: 0 } }, // D
        { score: { dokkaebi: 1, opponent: 3 } }, // L
        { score: { dokkaebi: 4, opponent: 2 } }  // W
      ]
    }
    const result = quarterTally(match)
    expect(result.quarterWins).toBe(2)
    expect(result.quarterLosses).toBe(1)
    expect(result.quarterDraws).toBe(1)
    expect(result.gf).toBe(7)
    expect(result.ga).toBe(6)
    expect(result.gd).toBe(1)
  })

  it('handles missing score with default 0', () => {
    const match = { quarters: [{}, { score: { dokkaebi: 1 } }] }
    const result = quarterTally(match)
    expect(result.gf).toBe(1)
    expect(result.ga).toBe(0)
    expect(result.quarterDraws).toBe(1)
    expect(result.quarterWins).toBe(1)
  })
})

describe('matchIntensity', () => {
  it('returns null when match is not finished', () => {
    expect(matchIntensity({ status: 'scheduled', score: { dokkaebi: 1, opponent: 0 } })).toBeNull()
  })

  it('returns null when score.dokkaebi is null', () => {
    expect(matchIntensity({ status: 'finished', score: { dokkaebi: null, opponent: 1 } })).toBeNull()
  })

  it('returns big_win when diff >= 4', () => {
    const match = { status: 'finished', score: { dokkaebi: 5, opponent: 1 } } // diff=4
    expect(matchIntensity(match)).toEqual({ key: 'big_win', close: false })
  })

  it('returns big_win when diff exactly 4', () => {
    const match = { status: 'finished', score: { dokkaebi: 4, opponent: 0 } }
    expect(matchIntensity(match)).toEqual({ key: 'big_win', close: false })
  })

  it('returns win with close=true when diff == 1', () => {
    const match = { status: 'finished', score: { dokkaebi: 2, opponent: 1 } }
    expect(matchIntensity(match)).toEqual({ key: 'win', close: true })
  })

  it('returns win with close=false when diff > 1 and < 4', () => {
    const match = { status: 'finished', score: { dokkaebi: 3, opponent: 0 } }
    expect(matchIntensity(match)).toEqual({ key: 'win', close: false })
  })

  it('returns draw with close=false', () => {
    const match = { status: 'finished', score: { dokkaebi: 2, opponent: 2 } }
    expect(matchIntensity(match)).toEqual({ key: 'draw', close: false })
  })

  it('returns loss with close=true when diff == -1', () => {
    const match = { status: 'finished', score: { dokkaebi: 1, opponent: 2 } }
    expect(matchIntensity(match)).toEqual({ key: 'loss', close: true })
  })

  it('returns big_loss when diff <= -4', () => {
    const match = { status: 'finished', score: { dokkaebi: 0, opponent: 5 } }
    expect(matchIntensity(match)).toEqual({ key: 'big_loss', close: false })
  })

  it('treats 5-point diff as big_win', () => {
    const match = { status: 'finished', score: { dokkaebi: 6, opponent: 1 } }
    expect(matchIntensity(match).key).toBe('big_win')
  })
})
