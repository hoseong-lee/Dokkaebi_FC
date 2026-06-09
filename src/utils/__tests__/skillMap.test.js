import { describe, it, expect } from 'vitest'
import { computeFifaAttrs, recommendPositions, overallRating, gradeFromOvr } from '../skillMap'

describe('computeFifaAttrs', () => {
  it('returns all 50 for empty skillTags', () => {
    const result = computeFifaAttrs({})
    expect(result.PAC).toBe(50)
    expect(result.SHO).toBe(50)
    expect(result.PAS).toBe(50)
    expect(result.DRI).toBe(50)
    expect(result.DEF).toBe(50)
    expect(result.PHY).toBe(50)
  })

  it('returns all 50 for undefined input', () => {
    const result = computeFifaAttrs()
    expect(result.PAC).toBe(50)
    expect(result.SHO).toBe(50)
  })

  it('scales SHO to 99 when only shooting is set', () => {
    // shooting=5, weight=2 → SHO raw=10 (max) → 99
    const result = computeFifaAttrs({ shooting: 5 })
    expect(result.SHO).toBe(99)
    // 다른 attr 들은 shooting 미관여이므로 50 (raw=0)
    expect(result.PAC).toBe(50)
    expect(result.PAS).toBe(50)
    expect(result.DRI).toBe(50)
    expect(result.DEF).toBe(50)
    expect(result.PHY).toBe(50)
  })

  it('keeps all attrs within 50~99 range', () => {
    const skillTags = {
      shooting: 3, passing: 2, dribbling: 4, defense: 1, speed: 2, stamina: 1,
      finishing: 2, vision: 1, aerial: 1, keeping: 1
    }
    const result = computeFifaAttrs(skillTags)
    for (const attrId of ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY']) {
      expect(result[attrId]).toBeGreaterThanOrEqual(50)
      expect(result[attrId]).toBeLessThanOrEqual(99)
    }
  })

  it('scales highest attr to 99 and zero raw to 50', () => {
    // speed only → PAC raw=2*2=4, 나머지 0
    const result = computeFifaAttrs({ speed: 2 })
    expect(result.PAC).toBe(99)
    expect(result.SHO).toBe(50)
    expect(result.DEF).toBe(50)
  })

  it('returns object with 6 keys', () => {
    const result = computeFifaAttrs({ shooting: 1 })
    expect(Object.keys(result).sort()).toEqual(['DEF', 'DRI', 'PAC', 'PAS', 'PHY', 'SHO'])
  })
})

describe('recommendPositions', () => {
  it('returns empty array for empty skillTags', () => {
    expect(recommendPositions({})).toEqual([])
  })

  it('recommends ST for shooting/finishing-heavy skills', () => {
    const skillTags = { shooting: 5, finishing: 5 }
    const result = recommendPositions(skillTags)
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].code).toBe('ST')
    expect(result[0].percent).toBe(100)
  })

  it('recommends GK for keeping-heavy skills', () => {
    const skillTags = { keeping: 5, reflexes: 3, commanding: 2 }
    const result = recommendPositions(skillTags)
    expect(result[0].code).toBe('GK')
  })

  it('returns at most topN entries', () => {
    const skillTags = {
      shooting: 2, finishing: 1, passing: 2, vision: 1, dribbling: 2,
      defense: 1, speed: 1, stamina: 1, keeping: 1, two_foot: 1, aerial: 1
    }
    const result = recommendPositions(skillTags, 3)
    expect(result.length).toBeLessThanOrEqual(3)
  })

  it('respects custom topN', () => {
    const skillTags = { shooting: 1, passing: 1, defense: 1, speed: 1, keeping: 1 }
    const result = recommendPositions(skillTags, 5)
    expect(result.length).toBeLessThanOrEqual(5)
  })

  it('sorts by score descending', () => {
    const skillTags = { shooting: 5, finishing: 5, passing: 1 }
    const result = recommendPositions(skillTags, 5)
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].score).toBeGreaterThanOrEqual(result[i + 1].score)
    }
  })

  it('includes percent normalized 0~100', () => {
    const skillTags = { shooting: 3, passing: 2 }
    const result = recommendPositions(skillTags)
    for (const r of result) {
      expect(r.percent).toBeGreaterThan(0)
      expect(r.percent).toBeLessThanOrEqual(100)
    }
  })
})

describe('overallRating', () => {
  it('returns average of attr values', () => {
    expect(overallRating({ PAC: 60, SHO: 80, PAS: 70, DRI: 70, DEF: 60, PHY: 70 })).toBe(68)
  })

  it('returns 50 for empty attrs', () => {
    expect(overallRating({})).toBe(50)
  })
})

describe('gradeFromOvr', () => {
  it('returns SS for >= 90', () => {
    expect(gradeFromOvr(95).label).toBe('SS')
    expect(gradeFromOvr(90).label).toBe('SS')
  })

  it('returns S for 80~89', () => {
    expect(gradeFromOvr(85).label).toBe('S')
  })

  it('returns A for 70~79', () => {
    expect(gradeFromOvr(75).label).toBe('A')
  })

  it('returns B for 60~69', () => {
    expect(gradeFromOvr(65).label).toBe('B')
  })

  it('returns C for < 60', () => {
    expect(gradeFromOvr(55).label).toBe('C')
    expect(gradeFromOvr(40).label).toBe('C')
  })
})
