/**
 * Recursive-descent formula parser & evaluator.
 *
 * Parses custom metric formulas into an AST, then evaluates them
 * against a variable context. No eval() is used.
 *
 * Supports: +, -, *, /, (), comparisons (>, <, >=, <=, ==, !=),
 *           unary minus, IF, SUM, AVG, MIN, MAX.
 */

// ─── AST Types ──────────────────────────────────────────

export type ASTNode =
  | { type: 'number'; value: number }
  | { type: 'variable'; name: string }
  | { type: 'binary'; op: '+' | '-' | '*' | '/'; left: ASTNode; right: ASTNode }
  | { type: 'function'; name: 'IF' | 'SUM' | 'AVG' | 'MIN' | 'MAX'; args: ASTNode[] }
  | { type: 'unary'; op: '-'; operand: ASTNode }
  | { type: 'comparison'; op: '>' | '<' | '>=' | '<=' | '==' | '!='; left: ASTNode; right: ASTNode }

// ─── Tokenizer ──────────────────────────────────────────

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

    if (/\s/.test(ch)) {
      i++
      continue
    }

    // Number literal
    if (/\d/.test(ch) || (ch === '.' && i + 1 < input.length && /\d/.test(input[i + 1]))) {
      let num = ''
      while (i < input.length && (/\d/.test(input[i]) || input[i] === '.')) {
        num += input[i]
        i++
      }
      tokens.push({ type: 'number', value: num })
      continue
    }

    // Identifiers (variable names, function names)
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
    if (ch === '>' && input[i + 1] === '=') { tokens.push({ type: 'gte', value: '>=' }); i += 2; continue }
    if (ch === '<' && input[i + 1] === '=') { tokens.push({ type: 'lte', value: '<=' }); i += 2; continue }
    if (ch === '!' && input[i + 1] === '=') { tokens.push({ type: 'neq', value: '!=' }); i += 2; continue }
    if (ch === '=' && input[i + 1] === '=') { tokens.push({ type: 'eq', value: '==' }); i += 2; continue }

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

// ─── Parser (recursive descent) ─────────────────────────

const KNOWN_FUNCTIONS = new Set(['IF', 'SUM', 'AVG', 'MIN', 'MAX'])

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
      return { type: 'comparison', op: t.value as ASTNode & { type: 'comparison' } extends { op: infer O } ? O : never, left, right }
    }
    return left
  }

  private parseAddSub(): ASTNode {
    let left = this.parseMulDiv()
    while (this.peek()?.type === 'op' && (this.peek()!.value === '+' || this.peek()!.value === '-')) {
      const op = this.consume().value as '+' | '-'
      const right = this.parseMulDiv()
      left = { type: 'binary', op, left, right }
    }
    return left
  }

  private parseMulDiv(): ASTNode {
    let left = this.parseUnary()
    while (this.peek()?.type === 'op' && (this.peek()!.value === '*' || this.peek()!.value === '/')) {
      const op = this.consume().value as '*' | '/'
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

    // Identifier — could be function call or variable
    if (t.type === 'ident') {
      this.consume()
      if (this.peek()?.type === 'lparen') {
        // Function call
        const fnName = t.value.toUpperCase()
        if (!KNOWN_FUNCTIONS.has(fnName)) {
          throw new Error(`Unknown function: ${t.value}`)
        }
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
        return { type: 'function', name: fnName as 'IF' | 'SUM' | 'AVG' | 'MIN' | 'MAX', args }
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

// ─── Evaluator ──────────────────────────────────────────

export function evaluateAST(ast: ASTNode, variables: Record<string, number | null>): number | null {
  switch (ast.type) {
    case 'number':
      return ast.value

    case 'variable': {
      if (!(ast.name in variables)) {
        throw new Error(`Unknown variable: ${ast.name}`)
      }
      return variables[ast.name]
    }

    case 'unary': {
      const v = evaluateAST(ast.operand, variables)
      if (v === null) return null
      return -v
    }

    case 'binary': {
      const l = evaluateAST(ast.left, variables)
      const r = evaluateAST(ast.right, variables)
      if (l === null || r === null) return null
      switch (ast.op) {
        case '+': return l + r
        case '-': return l - r
        case '*': return l * r
        case '/': return r === 0 ? null : l / r
      }
    }

    case 'comparison': {
      const l = evaluateAST(ast.left, variables)
      const r = evaluateAST(ast.right, variables)
      if (l === null || r === null) return null
      switch (ast.op) {
        case '>':  return l > r ? 1 : 0
        case '<':  return l < r ? 1 : 0
        case '>=': return l >= r ? 1 : 0
        case '<=': return l <= r ? 1 : 0
        case '==': return l === r ? 1 : 0
        case '!=': return l !== r ? 1 : 0
      }
    }

    case 'function': {
      if (ast.name === 'IF') {
        if (ast.args.length < 3) throw new Error('IF requires 3 arguments')
        const cond = evaluateAST(ast.args[0], variables)
        if (cond === null) return null
        // Evaluate only the chosen branch
        return cond !== 0
          ? evaluateAST(ast.args[1], variables)
          : evaluateAST(ast.args[2], variables)
      }

      // Aggregate functions: evaluate all args, filter nulls
      const values = ast.args.map((a) => evaluateAST(a, variables))
      const nums = values.filter((v): v is number => v !== null)
      if (nums.length === 0) return null

      switch (ast.name) {
        case 'SUM': return nums.reduce((a, b) => a + b, 0)
        case 'AVG': return nums.reduce((a, b) => a + b, 0) / nums.length
        case 'MIN': return Math.min(...nums)
        case 'MAX': return Math.max(...nums)
      }
    }
  }
}

// ─── Public API ─────────────────────────────────────────

/** Parse a formula string into an AST. Throws on syntax errors or empty input. */
export function parseFormula(formula: string): ASTNode {
  if (!formula.trim()) throw new Error('Empty formula')
  const tokens = tokenize(formula)
  if (tokens.length === 0) throw new Error('Empty formula')
  return new Parser(tokens).parse()
}

/** Parse + evaluate in one step. Throws on unknown variables or syntax errors. */
export function evaluateFormula(formula: string, variables: Record<string, number | null>): number | null {
  const ast = parseFormula(formula)
  return evaluateAST(ast, variables)
}
