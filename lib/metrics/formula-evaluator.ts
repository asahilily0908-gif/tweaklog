/**
 * Lightweight formula evaluator for custom metric preview.
 *
 * Supports: +, -, *, /, parentheses, IF(cond, a, b), SUM(...), AVG(...), MIN(...), MAX(...)
 * Variables are bound from a Record<string, number | null>.
 * Division by zero returns null. Unknown variables return null.
 * Does NOT use eval().
 */

// ─── Tokenizer ────────────────────────────────────────────

type TokenType =
  | 'number'
  | 'ident'
  | 'op'
  | 'lparen'
  | 'rparen'
  | 'comma'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'eq'
  | 'neq'

interface Token {
  type: TokenType
  value: string
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < input.length) {
    const ch = input[i]

    // Whitespace
    if (/\s/.test(ch)) {
      i++
      continue
    }

    // Number (integer or decimal)
    if (/\d/.test(ch) || (ch === '.' && i + 1 < input.length && /\d/.test(input[i + 1]))) {
      let num = ''
      while (i < input.length && (/\d/.test(input[i]) || input[i] === '.')) {
        num += input[i]
        i++
      }
      tokens.push({ type: 'number', value: num })
      continue
    }

    // Identifiers (variable names, function names) — allow letters, digits, underscores
    if (/[a-zA-Z_]/.test(ch)) {
      let ident = ''
      while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) {
        ident += input[i]
        i++
      }
      tokens.push({ type: 'ident', value: ident })
      continue
    }

    // Two-char operators
    if (ch === '>' && input[i + 1] === '=') {
      tokens.push({ type: 'gte', value: '>=' })
      i += 2
      continue
    }
    if (ch === '<' && input[i + 1] === '=') {
      tokens.push({ type: 'lte', value: '<=' })
      i += 2
      continue
    }
    if (ch === '!' && input[i + 1] === '=') {
      tokens.push({ type: 'neq', value: '!=' })
      i += 2
      continue
    }
    if (ch === '=' && input[i + 1] === '=') {
      tokens.push({ type: 'eq', value: '==' })
      i += 2
      continue
    }

    // Single-char operators
    if (ch === '>') { tokens.push({ type: 'gt', value: '>' }); i++; continue }
    if (ch === '<') { tokens.push({ type: 'lt', value: '<' }); i++; continue }
    if ('+-*/'.includes(ch)) { tokens.push({ type: 'op', value: ch }); i++; continue }
    if (ch === '(') { tokens.push({ type: 'lparen', value: '(' }); i++; continue }
    if (ch === ')') { tokens.push({ type: 'rparen', value: ')' }); i++; continue }
    if (ch === ',') { tokens.push({ type: 'comma', value: ',' }); i++; continue }

    throw new Error(`Unexpected character: '${ch}'`)
  }

  return tokens
}

// ─── Parser (recursive descent) ──────────────────────────

type ASTNode =
  | { type: 'number'; value: number }
  | { type: 'variable'; name: string }
  | { type: 'binary'; op: string; left: ASTNode; right: ASTNode }
  | { type: 'unary'; op: string; operand: ASTNode }
  | { type: 'call'; name: string; args: ASTNode[] }
  | { type: 'comparison'; op: string; left: ASTNode; right: ASTNode }

class Parser {
  private tokens: Token[]
  private pos: number

  constructor(tokens: Token[]) {
    this.tokens = tokens
    this.pos = 0
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos]
  }

  private consume(expectedType?: TokenType): Token {
    const token = this.tokens[this.pos]
    if (!token) throw new Error('Unexpected end of expression')
    if (expectedType && token.type !== expectedType) {
      throw new Error(`Expected ${expectedType}, got ${token.type} ('${token.value}')`)
    }
    this.pos++
    return token
  }

  parse(): ASTNode {
    const node = this.parseComparison()
    if (this.pos < this.tokens.length) {
      throw new Error(`Unexpected token: '${this.tokens[this.pos].value}'`)
    }
    return node
  }

  private parseComparison(): ASTNode {
    let left = this.parseAddSub()
    const t = this.peek()
    if (t && ['gt', 'lt', 'gte', 'lte', 'eq', 'neq'].includes(t.type)) {
      this.consume()
      const right = this.parseAddSub()
      return { type: 'comparison', op: t.value, left, right }
    }
    return left
  }

  private parseAddSub(): ASTNode {
    let left = this.parseMulDiv()
    while (this.peek()?.type === 'op' && (this.peek()!.value === '+' || this.peek()!.value === '-')) {
      const op = this.consume().value
      const right = this.parseMulDiv()
      left = { type: 'binary', op, left, right }
    }
    return left
  }

  private parseMulDiv(): ASTNode {
    let left = this.parseUnary()
    while (this.peek()?.type === 'op' && (this.peek()!.value === '*' || this.peek()!.value === '/')) {
      const op = this.consume().value
      const right = this.parseUnary()
      left = { type: 'binary', op, left, right }
    }
    return left
  }

  private parseUnary(): ASTNode {
    if (this.peek()?.type === 'op' && this.peek()!.value === '-') {
      this.consume()
      const operand = this.parsePrimary()
      return { type: 'unary', op: '-', operand }
    }
    return this.parsePrimary()
  }

  private parsePrimary(): ASTNode {
    const t = this.peek()
    if (!t) throw new Error('Unexpected end of expression')

    // Number literal
    if (t.type === 'number') {
      this.consume()
      return { type: 'number', value: parseFloat(t.value) }
    }

    // Parenthesized expression or function call
    if (t.type === 'ident') {
      this.consume()
      // Check if it's a function call
      if (this.peek()?.type === 'lparen') {
        this.consume('lparen')
        const args: ASTNode[] = []
        if (this.peek()?.type !== 'rparen') {
          args.push(this.parseComparison())
          while (this.peek()?.type === 'comma') {
            this.consume('comma')
            args.push(this.parseComparison())
          }
        }
        this.consume('rparen')
        return { type: 'call', name: t.value.toUpperCase(), args }
      }
      // Variable
      return { type: 'variable', name: t.value }
    }

    // Parenthesized expression
    if (t.type === 'lparen') {
      this.consume('lparen')
      const expr = this.parseComparison()
      this.consume('rparen')
      return expr
    }

    throw new Error(`Unexpected token: '${t.value}'`)
  }
}

// ─── Evaluator ───────────────────────────────────────────

function evaluate(node: ASTNode, vars: Record<string, number | null>): number | null {
  switch (node.type) {
    case 'number':
      return node.value

    case 'variable': {
      const val = vars[node.name]
      if (val === undefined) return null
      return val
    }

    case 'unary': {
      const v = evaluate(node.operand, vars)
      if (v === null) return null
      return -v
    }

    case 'binary': {
      const l = evaluate(node.left, vars)
      const r = evaluate(node.right, vars)
      if (l === null || r === null) return null
      switch (node.op) {
        case '+': return l + r
        case '-': return l - r
        case '*': return l * r
        case '/': return r === 0 ? null : l / r
        default: return null
      }
    }

    case 'comparison': {
      const l = evaluate(node.left, vars)
      const r = evaluate(node.right, vars)
      if (l === null || r === null) return null
      switch (node.op) {
        case '>': return l > r ? 1 : 0
        case '<': return l < r ? 1 : 0
        case '>=': return l >= r ? 1 : 0
        case '<=': return l <= r ? 1 : 0
        case '==': return l === r ? 1 : 0
        case '!=': return l !== r ? 1 : 0
        default: return null
      }
    }

    case 'call': {
      const name = node.name
      const args = node.args.map((a) => evaluate(a, vars))

      if (name === 'IF') {
        if (args.length < 3) return null
        const cond = args[0]
        if (cond === null) return null
        return cond !== 0 ? args[1] : args[2]
      }

      // Filter out nulls for aggregate functions
      const nums = args.filter((a): a is number => a !== null)
      if (nums.length === 0) return null

      switch (name) {
        case 'SUM':
          return nums.reduce((a, b) => a + b, 0)
        case 'AVG':
          return nums.reduce((a, b) => a + b, 0) / nums.length
        case 'MIN':
          return Math.min(...nums)
        case 'MAX':
          return Math.max(...nums)
        default:
          return null
      }
    }
  }
}

// ─── Public API ──────────────────────────────────────────

export function evaluateFormula(
  formula: string,
  variables: Record<string, number | null>
): { value: number | null; error: string | null } {
  try {
    const tokens = tokenize(formula)
    if (tokens.length === 0) return { value: null, error: 'Empty formula' }
    const ast = new Parser(tokens).parse()
    const value = evaluate(ast, variables)
    return { value, error: null }
  } catch (err) {
    return { value: null, error: (err as Error).message }
  }
}
