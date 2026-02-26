import { describe, it, expect } from 'vitest'
import { parseFormula, evaluateAST, evaluateFormula } from './formula-parser'

describe('formula-parser', () => {
  describe('basic arithmetic', () => {
    it('addition: 2 + 3 → 5', () => {
      expect(evaluateFormula('2 + 3', {})).toBe(5)
    })

    it('subtraction: 10 - 4 → 6', () => {
      expect(evaluateFormula('10 - 4', {})).toBe(6)
    })

    it('multiplication: 3 * 7 → 21', () => {
      expect(evaluateFormula('3 * 7', {})).toBe(21)
    })

    it('division: 15 / 3 → 5', () => {
      expect(evaluateFormula('15 / 3', {})).toBe(5)
    })
  })

  describe('operator precedence', () => {
    it('2 + 3 * 4 → 14', () => {
      expect(evaluateFormula('2 + 3 * 4', {})).toBe(14)
    })
  })

  describe('parentheses', () => {
    it('(2 + 3) * 4 → 20', () => {
      expect(evaluateFormula('(2 + 3) * 4', {})).toBe(20)
    })

    it('((1 + 2) * (3 + 4)) → 21', () => {
      expect(evaluateFormula('((1 + 2) * (3 + 4))', {})).toBe(21)
    })
  })

  describe('variables', () => {
    it('Cost / Conversions → 20', () => {
      expect(evaluateFormula('Cost / Conversions', { Cost: 1000, Conversions: 50 })).toBe(20)
    })
  })

  describe('IF function', () => {
    it('IF true branch: Cost > 0', () => {
      expect(
        evaluateFormula('IF(Cost > 0, Revenue / Cost, 0)', { Cost: 1000, Revenue: 5000 })
      ).toBe(5)
    })

    it('IF false branch: Cost == 0', () => {
      expect(
        evaluateFormula('IF(Cost > 0, Revenue / Cost, 0)', { Cost: 0, Revenue: 5000 })
      ).toBe(0)
    })
  })

  describe('aggregate functions', () => {
    it('AVG(A, B, C) → 20', () => {
      expect(evaluateFormula('AVG(A, B, C)', { A: 10, B: 20, C: 30 })).toBe(20)
    })

    it('MIN(A, B) → 5', () => {
      expect(evaluateFormula('MIN(A, B)', { A: 10, B: 5 })).toBe(5)
    })

    it('MAX(A, B) → 10', () => {
      expect(evaluateFormula('MAX(A, B)', { A: 10, B: 5 })).toBe(10)
    })
  })

  describe('complex formulas', () => {
    it('(Revenue - COGS) / Cost → 3.5', () => {
      expect(
        evaluateFormula('(Revenue - COGS) / Cost', { Revenue: 10000, COGS: 3000, Cost: 2000 })
      ).toBe(3.5)
    })

    it('weighted calculation: Cost / (CV_A * 1.0 + CV_B * 0.5) → 50', () => {
      expect(
        evaluateFormula('Cost / (CV_A * 1.0 + CV_B * 0.5)', { Cost: 1000, CV_A: 10, CV_B: 20 })
      ).toBe(50)
    })
  })

  describe('division by zero', () => {
    it('returns null on division by zero', () => {
      expect(evaluateFormula('Cost / Conversions', { Cost: 1000, Conversions: 0 })).toBeNull()
    })
  })

  describe('unknown variables', () => {
    it('throws Error for unknown variable', () => {
      expect(() => evaluateFormula('Unknown + 1', {})).toThrow('Unknown variable: Unknown')
    })
  })

  describe('empty formula', () => {
    it('throws Error for empty string', () => {
      expect(() => evaluateFormula('', {})).toThrow('Empty formula')
    })

    it('throws Error for whitespace-only string', () => {
      expect(() => evaluateFormula('   ', {})).toThrow('Empty formula')
    })
  })

  describe('nested functions', () => {
    it('IF(AVG(A, B) > 100, MAX(A, B), MIN(A, B)) → 200', () => {
      expect(
        evaluateFormula('IF(AVG(A, B) > 100, MAX(A, B), MIN(A, B))', { A: 150, B: 200 })
      ).toBe(200)
    })

    it('IF(AVG(A, B) > 100, MAX(A, B), MIN(A, B)) → 5 when avg <= 100', () => {
      expect(
        evaluateFormula('IF(AVG(A, B) > 100, MAX(A, B), MIN(A, B))', { A: 5, B: 10 })
      ).toBe(5)
    })
  })

  describe('unary minus', () => {
    it('-Cost → -100', () => {
      expect(evaluateFormula('-Cost', { Cost: 100 })).toBe(-100)
    })
  })

  describe('null variables', () => {
    it('returns null when variable is null', () => {
      expect(evaluateFormula('Cost + Revenue', { Cost: 100, Revenue: null })).toBeNull()
    })

    it('SUM skips null values: SUM(A, B, C) → 40', () => {
      expect(evaluateFormula('SUM(A, B, C)', { A: 10, B: null, C: 30 })).toBe(40)
    })

    it('AVG skips null values', () => {
      expect(evaluateFormula('AVG(A, B, C)', { A: 10, B: null, C: 30 })).toBe(20)
    })

    it('all null args returns null', () => {
      expect(evaluateFormula('SUM(A, B)', { A: null, B: null })).toBeNull()
    })
  })

  describe('comparison operators', () => {
    it('5 > 3 → 1', () => {
      expect(evaluateFormula('5 > 3', {})).toBe(1)
    })

    it('3 > 5 → 0', () => {
      expect(evaluateFormula('3 > 5', {})).toBe(0)
    })

    it('5 >= 5 → 1', () => {
      expect(evaluateFormula('5 >= 5', {})).toBe(1)
    })

    it('5 == 5 → 1', () => {
      expect(evaluateFormula('5 == 5', {})).toBe(1)
    })

    it('5 != 3 → 1', () => {
      expect(evaluateFormula('5 != 3', {})).toBe(1)
    })
  })

  describe('parseFormula + evaluateAST separately', () => {
    it('works with separate parse and evaluate', () => {
      const ast = parseFormula('2 + 3 * 4')
      expect(evaluateAST(ast, {})).toBe(14)
    })

    it('AST can be reused with different variables', () => {
      const ast = parseFormula('Cost / Conversions')
      expect(evaluateAST(ast, { Cost: 1000, Conversions: 50 })).toBe(20)
      expect(evaluateAST(ast, { Cost: 500, Conversions: 25 })).toBe(20)
      expect(evaluateAST(ast, { Cost: 2000, Conversions: 100 })).toBe(20)
    })
  })
})
