/**
 * @fileOverview Parser for choppy-lang
 * @author RyloRiz
 * @version 0.0.1
 */

import chalk from "chalk"
import Token from "./token";
import { Class, FileData, getClassName, Kingdom, Phyla, splitArray } from "./util";

interface ExpressionParsingData {
	prompt?: ';' | '(' | ',' | '==';
	omitTrailing?: boolean;
	classEnder?: string;
	isTopLevel?: boolean;
}

type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U; // https://stackoverflow.com/a/54975267
type Modify<T, R> = Omit<T, keyof R> & R; // https://stackoverflow.com/a/69831223
type Primitive = StringType | NumberType | BooleanType | NullType | UndefinedType;
type Value = Literal | Identifier | Datatype;
type BlockType = Class.Colon | Class.LBrace;

class FakeToken extends Token {
	constructor(value: any) {
		super("", 0, 0);
		this.kingdom = Kingdom.Fake;
		this.phylum = Phyla.Fake;
		this.class = Class.Fake;
		this.token = value;
	}
}

let ExpressionParsingMap: {
	[key: string]: {
		symbols: Class[],
		toString: () => string
	}
} = {
	';': {
		symbols: [Class.Semicolon],
		toString: (): string => {
			return "';'"
		}
	},
	'(': {
		symbols: [Class.RParen],
		toString: (): string => {
			return "')'"
		}
	},
	',': {
		symbols: [Class.RParen, Class.Comma],
		toString: (): string => {
			return "')' or ','"
		}
	},
	'==': {
		symbols: [Class.Comparison],
		toString: (): string => {
			return "'=='"
		}
	}
}

/**
 * The most basic class with a constructor function
 */
abstract class Base {
	public lineNum: number;
	public colNum: number;
	constructor() { };

	// abstract toString(): string;
}

/**
 * A base class for Choppy datatypes
 */
abstract class Datatype extends Base {
	public value: any;
}

class VoidType extends Datatype {
	public type: 'void';
	public value: void;

	// toFakeString() {
	// 	return 'void';
	// }
}

class StringType extends Datatype {
	public type: 'string';
	public value: string;

	// toFakeString() {
	// 	return this.value;
	// }
}

class TemplateStringType extends Datatype {
	public parameters: {
		name: string;
		value: Expression;
	}[];
	public type: 'string';
	public value: string;

	// toFakeString() {
	// 	return this.value;
	// }
}

class NumberType extends Datatype {
	public type: 'number';
	public value: number;

	// toFakeString() {
	// 	return this.value.toString();
	// }
}

class BooleanType extends Datatype {
	public type: 'boolean';
	public value: boolean;

	// toFakeString() {
	// 	return this.value.toString();
	// }
}

class NullType extends Datatype {
	public type: 'null';
	public value: null;

	// toFakeString() {
	// 	return 'null';
	// }
}

class UndefinedType extends Datatype {
	public type: 'undefined';
	public value: undefined;

	// toFakeString() {
	// 	return 'undefined';
	// }
}

class ArrayType extends Datatype {
	public items: Value[] = [];

	// toString(expand: boolean = false) {
	// 	let lines: string[] = [];
	// 	this.items.forEach(line => lines.push(`\t${line.toString()}`));
	// 	return `[${expand ? lines.join(',\n') : lines.join(', ') }\n]`;
	// }
}

class DictionaryType extends Datatype {
	public items: Map<Primitive, Value> = new Map();

	// toString(expand: boolean = false) {
	// 	let lines: string[] = [];
	// 	for (const [k, v] of this.items.entries()) {
	// 		lines.push(`\t${k.toString()} = ${v.toString()}`);
	// 	}
	// 	return `{${expand ? lines.join(',\n') : lines.join(', ')}\n}`;
	// }
}

class Expression extends Base {
	public value: any;

	// toFakeString() {
	// 	return this.value.toString();
	// }
}

class Literal extends Base {
	public type?: string;
	public value: Primitive;

	// toFakeString() {
	// 	return this.value.toString();
	// }
}

class Identifier extends Base {
	public type?: string;
	public name: string;

	// toFakeString() {
	// 	return this.name;
	// }
}

class Accessor extends Base {
	public parent: Expression;
	public child: Expression;

	// toFakeString() {
	// 	return `${this.parent.toString()}.${this.child.toString()}`;
	// }
}

class BinaryOperation extends Base {
	public left: Expression;
	public right: Expression;

	// toFakeString() {
	// 	return `${this.left.toString()} == ${this.right.toString()}`;
	// }
}

class UnaryOperation extends Base {
	public value: Expression;

	// toFakeString() {
	// 	return `-${this.value.toString()}`;
	// }
}

class ReferenceOperation extends Base {
	public value: Identifier;

	// toFakeString() {
	// 	return `&${this.value.toString()}`;
	// }
}

class ReverseOperation extends Base {
	public value: Expression;

	// toFakeString() {
	// 	return `!${this.value.toString()}`;
	// }
}

abstract class ArithmeticOperation extends BinaryOperation {
	public abstract operation: '+' | '-' | '*' | '/' | '^';
}

class AdditionOperation extends ArithmeticOperation {
	public operation: '+'

	// toFakeString() {
	// 	return `${this.left.toString()} + ${this.right.toString()}`;
	// }
}

class SubtrationOperation extends ArithmeticOperation {
	public operation: '-'

	// toFakeString() {
	// 	return `${this.left.toString()} - ${this.right.toString()}`;
	// }
}

class MultiplicationOperation extends ArithmeticOperation {
	public operation: '*'

	// toFakeString() {
	// 	return `${this.left.toString()} * ${this.right.toString()}`;
	// }
}

class DivisionOperation extends ArithmeticOperation {
	public operation: '/'

	// toFakeString() {
	// 	return `${this.left.toString()} / ${this.right.toString()}`;
	// }
}

class ExponentiationOperation extends ArithmeticOperation {
	public operation: '^'

	// toFakeString() {
	// 	return `${this.left.toString()} ^ ${this.right.toString()}`;
	// }
}

abstract class InequalityOperation extends BinaryOperation {
	public operation: '<' | '>' | '<=' | '>=';
}

class LessThanOperation extends InequalityOperation {
	public operation: '<';

	// toFakeString() {
	// 	return `${this.left.toString()} < ${this.right.toString()}`;
	// }
}

class LessThanOrEqualOperation extends InequalityOperation {
	public operation: '<=';

	// toFakeString() {
	// 	return `${this.left.toString()} <= ${this.right.toString()}`;
	// }
}

class GreaterThanOperation extends InequalityOperation {
	public operation: '>';

	// toFakeString() {
	// 	return `${this.left.toString()} > ${this.right.toString()}`;
	// }
}

class GreaterThanOrEqualOperation extends InequalityOperation {
	public operation: '>=';

	// toFakeString() {
	// 	return `${this.left.toString()} >= ${this.right.toString()}`;
	// }
}

class VariableDeclaration extends Base {
	public constant: boolean;
	public name: string;
	public value: Expression;

	// toFakeString() {
	// 	return `${this.constant ? 'const' : 'let'} ${this.name.toString()} = ${this.value.toString()};`;
	// }
}

class VariableAssignment extends Base {
	public name: any;
	public value: Expression;

	// toFakeString() {
	// 	return `${this.name.toString()} = ${this.value.toString()};`;
	// }
}

class Block extends Base {
	public expressions: Expression[];
	public returnValue: Expression;

	// toFakeString() {
	// 	return `{${this.expressions.join('\n')}\n\n${this.returnValue.toString()}\n}`;
	// }
}

class ConditionalBlock extends Block {
	public condition: BinaryOperation;
}

class ConditionalStatement extends Base {
	public ifBlock: ConditionalBlock;
	public elseifBlocks: ConditionalBlock[];
	public elseBlock: Block;
}

abstract class ForLoop extends Block {
	public index: any;
}

class IncrementalLoop extends ForLoop {
	public condition: BinaryOperation; // the "i < 10"
	public fn: VariableAssignment; // the "i++"
	public index: VariableDeclaration; // the "let i = 0"
}

class ObjectLoop extends ForLoop {
	public object: any;
	public value: any;
}

class WhileLoop extends Block {
	public condition: BinaryOperation;
}

class Break extends Base { }

class Continue extends Base { }

class Pass extends Base { }

class Case extends Block {
	public condition: Expression;
}

class Switch extends Base {
	public cases: Case[] = [];
	public condition: Expression;
	public default: Block;
}

class FunctionBlock extends Block {
	public async: boolean;
	public name: string;
	public parameters: {
		type: string;
		name: string;
	}[];
}

class ReturnValue extends Base {
	public value: any;
}

class Await extends Base {
	public toAwait: Expression;
}

class FunctionCall extends Base {
	public arguments: Expression[];
	public name: string;
}

class Constructor extends FunctionBlock {
	public name: '[constructor]';
	public override_name: string;
}

class Destructor extends FunctionBlock {
	public name: '[destructor]';
}

class Member extends Base {
	public name: string;
	public static: boolean;
	public type?: string;
	public visibility: 'public' | 'protected' | 'private';
}

class PropertyMember extends Member {
	public value: Datatype;
}

class MethodMember extends Member {
	public async: boolean;
	public expressions: Expression[];
	public parameters: {
		type: string;
		name: string;
	}[];
	public returnValue: Expression;
}

class GetMemberAccessor extends FunctionBlock { }

class SetMemberAccessor extends FunctionBlock {
	public returnValue: Expression | undefined;
}

class ClassObject extends Base {
	public accessors: Array<GetMemberAccessor | SetMemberAccessor> = [];
	public constructors: Constructor[] = [];
	public destructor: Destructor;
	public extends?: string;
	public members: Member[] = [];
	public name: string;
	public primary_constructor: Constructor;
}

class ClassInstantiator extends Base {
	public arguments: Expression[];
	public name: string;
	// public value: Accessor | FunctionCall;
}

class Enum extends Base {
	public name: string;
	public value: ArrayType | DictionaryType;
}

// class DefaultImport extends Base {
// 	public name: string;
// }

// class NamedImport extends Base {
// 	public realName: string;
// 	public fakeName?: string;
// }

// class WildcardImport extends Base {
// 	public name?: string;
// }

// [x] import "./file"
// [x] import "module"
// [x] import DefaultExport from "./file"
// [x] import { NamedExport1, NamedExport2 as NE2 } from "./file"
// [x] import * as exported from "./file"
// [x] import * from "./file"
abstract class Import extends Base {
	public location: string | FileData;
}

class DirectFileImport extends Import { }

class DefaultNamedImport extends Import {
	public name: string;
}

class NamedImport extends Import {
	public exportedName: string;
	public importedName: string;
}

class WildcardImport extends Import {
	public importedName?: string;
}

// class ImportStatement extends Base {
// 	public location: string | FileData;
// 	public import: DirectFileImport | DefaultNamedImport | Array<NamedImport> | WildcardImport;
// }

// class Export extends Base {
// 	public exported: Expression;
// }

class DefaultExportStatement extends Base {
	public exportedName: string;
}

class NamedExportStatement extends Base {
	public exportedName: string;
	public importedName: string;
}

class Lambda extends Base {
	public body: Base;
	public name: string;
	public parameters: {
		type?: string;
		name: string;
	}[];
}

////////////////////////////////////////////////////////////////

class Parser {
	ast: Array<any> = [];
	lineNumber: number = 0;
	columnNumber: number = 0;
	pos: number = 0;
	tokens: Token[];
	currentToken: Token;
	file: FileData;
	constructor(tokens: Token[], fileData: FileData) {
		this.tokens = tokens;
		this.currentToken = tokens[0];
		this.file = fileData;
	}

	#nextToken(num: number = 1): Token {
		return this.tokens[this.pos + num];
	}

	#advance(): void {
		this.pos++;
		this.currentToken = this.tokens[this.pos];
		if (this.currentToken) {
			this.lineNumber = this.currentToken.lineNum;
			this.columnNumber = this.currentToken.colNum;
		}
	}

	#throw(error: string) {
		// console.trace("Trace");
		let lines = [
			chalk.red(`${error}`),
			chalk.red(`\tat "${this.currentToken.token}" (${this.file.name}.${this.file.extension}:${this.lineNumber}:${this.columnNumber})`),
			chalk.gray(`\tat throw (choppy/src/parser.ts:249:5)`),
			chalk.gray(`\tat run (choppy/src/index.ts:11:10)`)
		]
		console.log(lines.join('\n'));
		process.exit(1);
	}

	/**
	 * Parses an expression
	 * @start First token of the expression (not control chars)
	 * @param scan Specify what tokens to parse into an Expression
	 * @param data Modify how the parser runs
	 * @returns {any}
	 */
	#parseExpression(scan: Token[] = null, data?: ExpressionParsingData): any {
		// [x] 88
		// [x] 2 +|-|*\/\^ 6
		// [x] true|false
		// [x] null|undefined
		// [x] "hello world"
		// [x] (<any>)
		// [x] varName
		// [x] <any>.<any>
		// [x] -<any>
		// [x] !<any>
		// [x] <any> == <any>
		// [x] func(...)
		// [x] await <any>
		// [x] new ClassName()

		let _tempIdx: number;

		let thisProxy = this;
		let _advance: Function;
		let _currentToken: Function;
		let _nextToken: Function;

		if (scan !== null && scan !== undefined) {
			_tempIdx = 0;

			_advance = (): void => {
				_tempIdx++;
			}

			_currentToken = (): Token => {
				return scan[_tempIdx];
			}

			_nextToken = (n: number = 1): Token => {
				return scan[_tempIdx + n];
			}
		} else {
			_advance = (): void => {
				thisProxy.#advance();
			}

			_currentToken = (): Token => {
				return thisProxy.currentToken;
			}

			_nextToken = (): Token => {
				return thisProxy.#nextToken();
			}
		}

		/**
		 * Get the next expression (raw or wrapped in parentheses)
		 */
		let _nextExpression = () => {
			if (_currentToken().class === Class.LParen) {
				_advance();
				let v = thisProxy.#parseExpression();
			}
		}

		//////////////////////
		let expr: any;
		if (_currentToken().kingdom === Kingdom.Fake) {
			expr = _currentToken().token;
		} else if (_currentToken().class === Class.LParen) {
			_advance(); // OLD: Symbol>GroupSymbol>LParen NEW: *
			let value = thisProxy.#parseExpression(null, {
				prompt: '('
			});
			expr = new Expression();
			(expr as Expression).value = value;
			if (_currentToken().class !== Class.RParen) {
				thisProxy.#throw("SyntaxError: Did not terminate expression with parentheses");
			} else {
				_advance(); // OLD: Symbol>GroupSymbol>RParen NEW: Symbol>MiscSymbol>Semicolon
			}
		} else if (_nextToken()?.phylum === Phyla.ArithmeticSymbol) {
			let tokens = [];
			let classEnder = Class.Semicolon;
			let dataTopLevelStarterMap = {
				'rparen': Class.RParen
			}

			if (data?.classEnder !== undefined && data?.classEnder !== null) {
				classEnder = dataTopLevelStarterMap[data.classEnder];
			}

			// if (classEnder === Class.RParen) {
			let level = 0;
			while (true) {
				if (!_currentToken()) {
					break;
				}
				if (level === 0 && _currentToken().class === Class.RParen /*classEnder*/) {
					break;
				} else if (_currentToken().class === Class.LParen) {
					level++;
				} else if (_currentToken().class === Class.RParen) {
					level--;
				} else if (_currentToken().class === Class.Semicolon) {
					break;
				}
				tokens.push(_currentToken());
				_advance(); // OLD: * MID: * NEW: *
			}
			// } else {
			// 	while (_currentToken() ? _currentToken().class !== classEnder : false) {
			// 		tokens.push(_currentToken());
			// 		_advance(); // OLD: Datatype>Number>* MID: DataType>Number>*|Symbol>ArithmeticSymbol>* NEW: Symbol>MiscSymbol>Semicolon
			// 	}
			// }

			// while (_currentToken() ? _currentToken().class !== classEnder : false) {
			// 	tokens.push(_currentToken());
			// 	_advance(); // OLD: Datatype>Number>* MID: DataType>Number>*|Symbol>ArithmeticSymbol>* NEW: Symbol>MiscSymbol>Semicolon
			// }

			let operationPrecedence = {
				[Class.Exponent]: 1,
				[Class.Multiply]: 2,
				[Class.Divide]: 2,
				[Class.Add]: 3,
				[Class.Subtract]: 3,
			}

			function splitMathArray(arr: Array<Token>, find: Array<Class>): [Token[][], string[]] {
				let chunks: Array<Array<Token>> = [];
				let ops: Array<string> = [];
				let current: Array<Token> = [];
				let expressionCurrent: Array<Token> = [];
				let ignoreLevel = 0;
				for (let i = 0; i < arr.length; i++) {
					const t = arr[i];
					if (t.token === "(") {
						ignoreLevel++;
					} else if (t.token === ")") {
						ignoreLevel--;
						if (ignoreLevel === 0) {
							let value = thisProxy.#parseExpression(expressionCurrent);
							let _expr = new Expression();
							_expr.value = value;
							let _tkn = new FakeToken(_expr);
							current.push(_tkn);
							expressionCurrent = [];
						}
					} else if (ignoreLevel === 0) {
						if (find.find(e => e === t.class)) {
							chunks.push(current);
							ops.push(t.token);
							current = [];
						} else {
							current.push(t);
						}
					} else {
						expressionCurrent.push(t);
					}
				}
				if (current.length > 0) {
					chunks.push(current);
				}
				return [chunks, ops];
			}

			function goDown(c: Class): Class[] {
				let precedence = operationPrecedence[c];
				let down = precedence - 1;
				let keys = [];
				for (const [k, v] of Object.entries(operationPrecedence)) {
					if (v === down) {
						keys.push(k);
					}
				}
				return keys;
			}

			function altJoin(arr1: Token[][] | Token[], arr2: any[]) {
				let parent: any[] = [];
				for (let i = 0; i < arr1.length; i++) {
					if (arr1[i]['push']) {
						(arr1[i] as Token[]).forEach(e => parent.push(e));
					} else {
						parent.push(arr1[i]);
					}
					if (arr2[i] !== undefined) {
						parent.push(new Token(arr2[i], 0, 0));
					}
				}
				return parent;
			}

			/**
			 * Check if an array of Tokens has a Token that matches a Class
			 * @param check The `altJoin` value
			 * @param level The Enum.Class.* value
			 */
			function hasLevel(check: Token[], level: Class[]): boolean {
				let found: boolean = false;
				for (let i = 0; i < check.length; i++) {
					const e: Token = check[i];
					if (level.find(e2 => e.class === e2)) {
						found = true;
						break;
					}
				}
				return found;
			}

			function smartLevel(check: Token[], level: Class[]): Class[] {
				let has = hasLevel(check, level);
				if (has) {
					return level;
				} else {
					return goDown(level[0]);
				}
			}

			// function extract(val: Token) {
			// 	if (val.kingdom === Kingdom.Fake) {
			// 		return val.token;
			// 	} else {
			// 		return thisProxy.#parseExpression(val);
			// 	}
			// }

			function checker(tkns: Token[], classType: Class[]) {
				let [split, ops] = splitMathArray(tkns, classType);
				if (split.length === 1) {
					return checker(split[0], goDown(classType[0]));
				} else if (split.length > 1) {
					// Reverse-traverse & create op exprs for the corresponding op
					let expr2: ArithmeticOperation;
					let e = ops[ops.length - 1];
					if (e === '^') {
						expr2 = new ExponentiationOperation();
					} else if (e === '*') {
						expr2 = new MultiplicationOperation();
					} else if (e === '/') {
						expr2 = new DivisionOperation();
					} else if (e === '+') {
						expr2 = new AdditionOperation();
					} else if (e === '-') {
						expr2 = new SubtrationOperation();
					}
					if (split.length === 2) {
						if (split[0].length === 1) {
							expr2.left = thisProxy.#parseExpression(split[0]);
						} else {
							let _altjoined = altJoin(split[0], []);
							expr2.left = checker(_altjoined, smartLevel(_altjoined, classType));
						}
						if (split[split.length - 1].length === 1) {
							expr2.right = thisProxy.#parseExpression(split[split.length - 1]);
						} else {
							let _split = split[split.length - 1]; // aka split[1];
							let _altjoined = altJoin(_split, []);
							expr2.right = checker(_altjoined, smartLevel(_altjoined, classType));
						}
					} else {
						let _split = split.slice(0, -1);
						let _ops = ops.slice(0, -1);
						let _altjoined = altJoin(_split, _ops);
						expr2.left = checker(_altjoined, smartLevel(_altjoined, classType));
						// expr2.left = thisProxy.#parseExpression(split[0]);
						if (split[split.length - 1].find(e => e.phylum === Phyla.ArithmeticSymbol)) {
							expr2.right = checker(split[split.length - 1], smartLevel(split[split.length - 1], classType));
						} else {
							expr2.right = thisProxy.#parseExpression(split[split.length - 1]);
						}
					}
					return expr2;
				}
			}

			expr = checker(tokens, [Class.Add, Class.Subtract]);
		} else if (_currentToken().phylum === Phyla.Number) {
			// add new param to function
			// if (_nextToken().phylum !== Phyla.ArithmeticSymbol) {
			if (_nextToken()
				? (data
					? (data.prompt === '('
						? _nextToken().class === Class.RParen
						: (data.prompt === ','
							? (_nextToken().class === Class.RParen || _nextToken().class === Class.Comma)
							: (data.prompt === '=='
								? (_nextToken().class === Class.Comparison)
								: (_nextToken().class === Class.Semicolon))))
					: _nextToken().phylum !== Phyla.ArithmeticSymbol)
				: true) {
				expr = new NumberType();
				(expr as NumberType).value = Number(_currentToken().token);
				_advance(); // OLD: Primitives>Number>* NEW: Symbol>MiscSymbol>Semicolon
			}
			// else if (_nextToken().phylum === Phyla.ArithmeticSymbol) {
			// 	let tokens = [];
			// 	while (_currentToken() ? _currentToken().class !== Class.Semicolon : false) {
			// 		tokens.push(_currentToken());
			// 		_advance(); // OLD: Datatype>Number>* MID: DataType>Number>*|Symbol>ArithmeticSymbol>* NEW: Symbol>MiscSymbol>Semicolon
			// 	}

			// 	let operationPrecedence = {
			// 		[Class.Exponent]: 1,
			// 		[Class.Multiply]: 2,
			// 		[Class.Divide]: 2,
			// 		[Class.Add]: 3,
			// 		[Class.Subtract]: 3,
			// 	}

			// 	function splitMathArray(arr: Array<Token>, find: Array<Class>): [Token[][], string[]] {
			// 		let chunks: Array<Array<Token>> = [];
			// 		let ops: Array<string> = [];
			// 		let current: Array<Token> = [];
			// 		let expressionCurrent: Array<Token> = [];
			// 		let ignoreLevel = 0;
			// 		for (let i = 0; i < arr.length; i++) {
			// 			const t = arr[i];
			// 			if (t.token === "(") {
			// 				ignoreLevel++;
			// 			} else if (t.token === ")") {
			// 				ignoreLevel--;
			// 				if (ignoreLevel === 0) {
			// 					let value = thisProxy.#parseExpression(expressionCurrent);
			// 					let _expr = new Expression();
			// 					_expr.value = value;
			// 					let _tkn = new FakeToken(_expr);
			// 					current.push(_tkn);
			// 					expressionCurrent = [];
			// 				}
			// 			} else if (ignoreLevel === 0) {
			// 				if (find.find(e => e === t.class)) {
			// 					chunks.push(current);
			// 					ops.push(t.token);
			// 					current = [];
			// 				} else {
			// 					current.push(t);
			// 				}
			// 			} else {
			// 				expressionCurrent.push(t);
			// 			}
			// 		}
			// 		if (current.length > 0) {
			// 			chunks.push(current);
			// 		}
			// 		return [chunks, ops];
			// 	}

			// 	function goDown(c: Class): Class[] {
			// 		let precedence = operationPrecedence[c];
			// 		let down = precedence - 1;
			// 		let keys = [];
			// 		for (const [k, v] of Object.entries(operationPrecedence)) {
			// 			if (v === down) {
			// 				keys.push(k);
			// 			}
			// 		}
			// 		return keys;
			// 	}

			// 	function altJoin(arr1: Token[][] | Token[], arr2: any[]) {
			// 		let parent: any[] = [];
			// 		for (let i = 0; i < arr1.length; i++) {
			// 			if (arr1[i]['push']) {
			// 				(arr1[i] as Token[]).forEach(e => parent.push(e));
			// 			} else {
			// 				parent.push(arr1[i]);
			// 			}
			// 			if (arr2[i] !== undefined) {
			// 				parent.push(new Token(arr2[i], 0, 0));
			// 			}
			// 		}
			// 		return parent;
			// 	}

			// 	/**
			// 	 * Check if an array of Tokens has a Token that matches a Class
			// 	 * @param check The `altJoin` value
			// 	 * @param level The Enum.Class.* value
			// 	 */
			// 	function hasLevel(check: Token[], level: Class[]): boolean {
			// 		let found: boolean = false;
			// 		for (let i = 0; i < check.length; i++) {
			// 			const e: Token = check[i];
			// 			if (level.find(e2 => e.class === e2)) {
			// 				found = true;
			// 				break;
			// 			}
			// 		}
			// 		return found;
			// 	}

			// 	function smartLevel(check: Token[], level: Class[]): Class[] {
			// 		let has = hasLevel(check, level);
			// 		if (has) {
			// 			return level;
			// 		} else {
			// 			return goDown(level[0]);
			// 		}
			// 	}

			// 	// function extract(val: Token) {
			// 	// 	if (val.kingdom === Kingdom.Fake) {
			// 	// 		return val.token;
			// 	// 	} else {
			// 	// 		return thisProxy.#parseExpression(val);
			// 	// 	}
			// 	// }

			// 	function checker(tkns: Token[], classType: Class[]) {
			// 		let [split, ops] = splitMathArray(tkns, classType);
			// 		if (split.length === 1) {
			// 			return checker(split[0], goDown(classType[0]));
			// 		} else if (split.length > 1) {
			// 			// Reverse-traverse & create op exprs for the corresponding op
			// 			let expr2: ArithmeticOperation;
			// 			let e = ops[ops.length - 1];
			// 			if (e === '^') {
			// 				expr2 = new ExponentiationOperation();
			// 			} else if (e === '*') {
			// 				expr2 = new MultiplicationOperation();
			// 			} else if (e === '/') {
			// 				expr2 = new DivisionOperation();
			// 			} else if (e === '+') {
			// 				expr2 = new AdditionOperation();
			// 			} else if (e === '-') {
			// 				expr2 = new SubtrationOperation();
			// 			}
			// 			if (split.length === 2) {
			// 				if (split[0].length === 1) {
			// 					expr2.left = thisProxy.#parseExpression(split[0]);
			// 				} else {
			// 					let _altjoined = altJoin(split[0], []);
			// 					expr2.left = checker(_altjoined, smartLevel(_altjoined, classType));
			// 				}
			// 				if (split[split.length - 1].length === 1) {
			// 					expr2.right = thisProxy.#parseExpression(split[split.length - 1]);
			// 				} else {
			// 					let _split = split[split.length - 1]; // aka split[1];
			// 					let _altjoined = altJoin(_split, []);
			// 					expr2.right = checker(_altjoined, smartLevel(_altjoined, classType));
			// 				}
			// 			} else {
			// 				let _split = split.slice(0, -1);
			// 				let _ops = ops.slice(0, -1);
			// 				let _altjoined = altJoin(_split, _ops);
			// 				expr2.left = checker(_altjoined, smartLevel(_altjoined, classType));
			// 				// expr2.left = thisProxy.#parseExpression(split[0]);
			// 				if (split[split.length - 1].find(e => e.phylum === Phyla.ArithmeticSymbol)) {
			// 					expr2.right = checker(split[split.length - 1], smartLevel(split[split.length - 1], classType));
			// 				} else {
			// 					expr2.right = thisProxy.#parseExpression(split[split.length - 1]);
			// 				}
			// 			}
			// 			return expr2;
			// 		}
			// 	}

			// 	expr = checker(tokens, [Class.Add, Class.Subtract]);
			// }
		} else if (_currentToken().phylum === Phyla.Boolean) {
			expr = new BooleanType();
			(expr as BooleanType).value = _currentToken().token === "true" ? true : false;
			_advance(); // OLD: Primitives>Boolean>* NEW: Symbol>MiscSymbol>Semicolon
		} else if (_currentToken().phylum === Phyla.Unreal) {
			if (_currentToken().class === Class.Undefined) {
				expr = new UndefinedType();
			} else if (_currentToken().class === Class.Null) {
				expr = new NullType();
			}
			expr.value = _currentToken().token;
			_advance(); // OLD: Primitives>Unreal>* NEW: Symbol>MiscSymbol>Semicolon
		} else if (_currentToken().phylum === Phyla.String) {
			expr = new StringType();
			(expr as StringType).value = _currentToken().token;
			_advance(); // OLD: Primitives>String>* NEW: Symbol>MiscSymbol>Semicolon
		// } else if (_currentToken().phylum === Class.TemplateString) {
		// 	expr = new TemplateStringType();
		// 	(expr as TemplateStringType).value = _currentToken().token;
		// 	let exec = /(?:\$\{(.*)\})/g.exec(_currentToken().token);

		// 	_advance(); // OLD: Primitives>String>* NEW: Symbol>MiscSymbol>Semicolon
		} else if (_currentToken().class === Class.Subtract) {
			expr = new UnaryOperation();
			_advance(); // OLD: Primitives>ArithmeticSymbol>Subtract NEW: *
			(expr as UnaryOperation).value = thisProxy.#parseExpression(); //_currentToken().token;
			// _advance(); // OLD: Primitives>String>* NEW: Symbol>MiscSymbol>Semicolon
		} else if (_currentToken().class === Class.Reverse) {
			expr = new ReverseOperation();
			_advance(); // OLD: Symbol>MiscSymbol>Reverse NEW: *
			(expr as ReverseOperation).value = thisProxy.#parseExpression(); //_currentToken().token;
			// _advance(); // OLD: * NEW: Symbol>MiscSymbol>Semicolon
		} else if (_currentToken().class === Class.Reference) {
			expr = new ReferenceOperation();
			_advance(); // OLD: Symbol>MiscSymbol>Reference NEW: *
			(expr as ReferenceOperation).value = thisProxy.#parseExpression(); //_currentToken().token;
			// _advance(); // OLD: * NEW: Symbol>MiscSymbol>Semicolon
		} else if (_currentToken().class === Class.Identifier && (_nextToken() ? _nextToken().class === Class.LParen : false)) {
			expr = new FunctionCall();
			(expr as FunctionCall).name = _currentToken().token;
			_advance(); // OLD: Identifier>Identifier>Identifier NEW: Symbol>GroupSymbol>LParen
			_advance(); // OLD: Symbol>GroupSymbol>LParen NEW: __Expression
			let args: any[] = [];
			while (_currentToken() && _currentToken().class !== Class.RParen) {
				let e = thisProxy.#parseExpression(null, {
					prompt: ',',
					classEnder: 'rparen'
				});
				if (e) {
					args.push(e);
				}
				if (_currentToken().class === Class.Comma) {
					_advance(); // OLD: Symbol>MiscSymbol>Comma NEW: *
				}
			}
			(expr as FunctionCall).arguments = args;
			if (_currentToken().class === Class.RParen) {
				_advance(); // OLD: Symbol>GroupSymbol>RParen NEW: Symbol>MiscSymbol>Semicolon
			} else {
				this.#throw("SyntaxError: Function call must end with a closing parentheses");
			}
		} else if (_currentToken().token === "new") {
			_advance(); // OLD: Keyword>LanguageWords>LanguageWord
			expr = new ClassInstantiator();
			let value = this.#parseExpression();
			let name = value;
			let args = [];

			if (name.constructor.name === "Accessor") {
				while (name.child) {
					if (name.child && !name.child.child) {
						let _child = new Identifier();
						_child.name = name.child.name;
						args = name.child.arguments;
						name.child = _child;
						break;
					}
					name = name.child;
				}
			} else if (name.constructor.name === "FunctionCall") {
				args = name.arguments;
				let _value = new Identifier();
				_value.name = value.name;
				value = _value;
			}

			(expr as ClassInstantiator).arguments = args;
			(expr as ClassInstantiator).name = value;

			// let name = value;

			// if (name.constructor.name === "Accessor") {
			// 	while (name.child) {
			// 		if (name.child && !name.child.child) {
			// 			let _child = new Identifier();
			// 			_child = name.child.name;
			// 			name.child = _child;
			// 		}
			// 		name = name.child;
			// 	}
			// }

			// if (name.constructor.name === "FunctionCall") {
			// 	(expr as ClassInstantiator).arguments = (name as FunctionCall).arguments;
			// 	(expr as ClassInstantiator).name = (name as FunctionCall).name;
			// }
		} else if (_currentToken().token === "await") {
			_advance(); // OLD: Keyword>LanguageWords>LanguageWord NEW: *
			expr = new Await();
			(expr as Await).toAwait = this.#parseExpression();
		// } else if (_currentToken().token === "break") {
		// 	_advance(); // OLD: Keyword>LanguageWords>LanguageWord NEW: *
		// 	expr = new Break();
		// } else if (_currentToken().token === "continue") {
		// 	_advance(); // OLD: Keyword>LanguageWords>LanguageWord NEW: *
		// 	expr = new Continue();
		} else if (_currentToken().class === Class.Identifier) {
			expr = new Identifier();
			(expr as Identifier).name = _currentToken().token;
			_advance(); // OLD: Identifier>Identifier>Identifier NEW: Symbol>MiscSymbol>Semicolon
		} else if (_currentToken().class === Class.LBracket) {
			expr = new ArrayType();
			_advance(); // OLD: Symbol>GroupSymbol>LBracket NEW: __Expression
			while (_currentToken().class !== Class.RBracket) {
				let currentExpr = this.#parseExpression(null, {
					prompt: ','
				});

				if (currentExpr) {
					expr.items.push(currentExpr);

					if (_currentToken().class === Class.RBracket) {
						break;
					} else if (_nextToken().class === Class.RBracket) {
						_advance(); // OLD: Symbol>MiscSymbol>Comma NEW: Symbol>GroupSymbol>RBracket
						break;
					} else {
						_advance();  // OLD: Symbol>MiscSymbol>Comma NEW: __Expression
					}
				} else {
					this.#throw("SyntaxError: Expected expression");
				}
			}
			_advance(); // OLD: Symbol>GroupSymbol>RBracket NEW: Symbol>MiscSymbol>Semicolon
		} else if (_currentToken().class === Class.LBrace) {
			expr = new DictionaryType();
			_advance(); // OLD: Symbol>GroupSymbol>LBrace NEW: __Expression
			while (_currentToken().class !== Class.RBrace) {
				let keyName: string;

				if (_currentToken().class === Class.LBracket) {
					_advance(); // OLD: Symbol>GroupSymbol>LBracket NEW: Primitives>String>LiteralString

					if (_currentToken().class === Class.LiteralString) {
						keyName = _currentToken().token;

						_advance(); // OLD: Symbol>GroupSymbol>LiteralString NEW: Symbol>GroupSymbol>RBracket

						if (_currentToken().class !== Class.RBracket) {
							this.#throw("SyntaxError: Expected ']'");
						} else {
							_advance(); // OLD: Symbol>GroupSymbol>RBracket NEW: Symbol>EqualSymbol>Assigner
						}
					} else {
						this.#throw("SyntaxError: Expected literal string key");
					}
				} else if (_currentToken().class === Class.Identifier) {
					keyName = _currentToken().token;
					_advance(); // OLD: Identifier>Identifier>Identifier NEW: Symbol>EqualSymbol>Assigner
				} else {
					this.#throw("SyntaxError: Expected key");
				}

				if (_currentToken().class !== Class.Assigner) {
					this.#throw("SyntaxError: '=' to follow key");
				}

				_advance();

				let currentExpr = this.#parseExpression(null, {
					prompt: ','
				});

				if (currentExpr) {
					(expr as DictionaryType).items[keyName] = currentExpr;

					if (_currentToken().class === Class.RBrace) {
						break;
					} else if (_nextToken().class === Class.RBrace) {
						_advance(); // OLD: Symbol>MiscSymbol>Comma NEW: Symbol>GroupSymbol>RBrace
						break;
					} else {
						_advance();  // OLD: Symbol>MiscSymbol>Comma NEW: __Expression
					}
				} else {
					this.#throw("SyntaxError: Expected expression");
				}
			}
			_advance(); // OLD: Symbol>GroupSymbol>RBrace NEW: Symbol>MiscSymbol>Semicolon
		}

		let expr2: any;
		if (_currentToken()?.class === Class.Dot) {
			_advance(); // OLD: Symbol>MiscSymbol>Dot NEW: *
			let child = thisProxy.#parseExpression(null, {
				isTopLevel: false
			});
			let _expr = new Accessor();
			_expr.parent = expr;
			_expr.child = child;
			// _advance(); // OLD: * NEW: Symbol>MiscSymbol>Semicolon
			expr2 = _expr;
		} else {
			expr2 = expr;
		}

		if (data?.isTopLevel !== false) {
			// _advance();

			if (_currentToken()?.class === Class.Assigner) {
				_advance();
				let _expr = new VariableAssignment();
				_expr.name = expr2;
				_expr.value = thisProxy.#parseExpression(null, {
					isTopLevel: false
				});
				return _expr;
			} else if (_currentToken()?.class === Class.Comparison) {
				_advance(); // NEW: Symbol>EqualSymbol>Comparison NEW: *
				let _expr = new BinaryOperation();
				_expr.left = expr2;
				_expr.right = thisProxy.#parseExpression(null, {
					prompt: data?.prompt === '(' ? '(' : undefined,
					isTopLevel: false
				});
				// _expr.right = thisProxy.#parseExpression(null, {
				// 	prompt: '=='
				// });
				return _expr;
			} else if (_currentToken()?.class === Class.LessThan) {
				_advance(); // NEW: Symbol>EqualSymbol>Comparison NEW: *
				let _expr = new LessThanOperation();
				_expr.left = expr2;
				_expr.right = thisProxy.#parseExpression(null, {
					isTopLevel: false
				});
				return _expr;
			} else if (_currentToken()?.class === Class.LessThanOrEqual) {
				_advance(); // NEW: Symbol>EqualSymbol>Comparison NEW: *
				let _expr = new LessThanOrEqualOperation();
				_expr.left = expr2;
				_expr.right = thisProxy.#parseExpression(null, {
					isTopLevel: false
				});
				return _expr;
			} else if (_currentToken()?.class === Class.GreaterThan) {
				_advance(); // NEW: Symbol>EqualSymbol>Comparison NEW: *
				let _expr = new GreaterThanOperation();
				_expr.left = expr2;
				_expr.right = thisProxy.#parseExpression(null, {
					isTopLevel: false
				});
				return _expr;
			} else if (_currentToken()?.class === Class.GreaterThanOrEqual) {
				_advance(); // NEW: Symbol>EqualSymbol>Comparison NEW: *
				let _expr = new GreaterThanOrEqualOperation();
				_expr.left = expr2;
				_expr.right = thisProxy.#parseExpression(null, {
					isTopLevel: false
				});
				return _expr;
			}
		}
		return expr2;
	}

	/**
	 * Parse a block
	 * @start Symbol>GroupSymbol>LBrace
	 * @returns {Block}
	 */
	#parseBlock(blockType: BlockType = Class.LBrace): Block {
		if (this.currentToken.class === blockType) {
			let block = new Block();
			this.#advance();
			let expressions = [];
			// @ts-ignore
			while (this.currentToken.class !== Class.RBrace) {
				let exp = this.#parseStarter();
				this.#advance();
				if (exp) {
					if (exp.constructor.name === "ReturnValue") {
						block.returnValue = (exp as ReturnValue);
						break;
					} else {
						expressions.push(exp);
					}
				}
				if (blockType === Class.Colon && /case|default/.test(this.currentToken.token)) {
					break;
				}
			}

			block.expressions = expressions;

			if (!block.returnValue) {
				block.returnValue = new ReturnValue();
				block.returnValue.value = new VoidType();
			}

			if (blockType === Class.LBrace) {
				// @ts-ignore
				if (this.currentToken.class === Class.RBrace) {
					// this.#advance();
				} else {
					this.#throw("SyntaxError: Expected '}'");
				}
			}

			return block;
		} else {
			this.#throw("SyntaxError: Expected '}'");
		}
	}

	/**
	 * Parse a conditional block (if/while)
	 * @start Symbol>GroupSymbol>LParen
	 * @returns {ConditionalBlock}
	 */
	#parseConditionalBlock(hasCondition: boolean = true): ConditionalBlock {
		let block = new ConditionalBlock();
		let binOp: BinaryOperation;

		let value1: any;

		// if (hasCondition) {
			value1 = this.#parseExpression(null, {
				prompt: '('
			});
		// } else {
		// 	value1 = this.#parseExpression();
		// }

		if (value1) {
			if (value1.constructor.name === "BinaryOperation") {
				binOp = value1;
			} else if (value1.constructor.name === "Expression" && value1.value?.constructor.name === "BinaryOperation") {
				binOp = value1.value;
			} else {
				binOp = new BinaryOperation();
				binOp.left = value1;
				binOp.right = new BooleanType();
				binOp.right.value = true;
			}

			block.condition = binOp;

			let b = this.#parseBlock();

			if (b) {
				block.expressions = b.expressions;
				block.returnValue = b.returnValue;

				return block;
			} else {
				this.#throw("SyntaxError: Expected block");
			}

			// if (this.currentToken.class === Class.LBrace) {
			// 	this.#advance();
			// 	let expressions = [];
			// 	// @ts-ignore
			// 	while (this.currentToken.class !== Class.RBrace) {
			// 		let exp = this.#parseStarter();
			// 		this.#advance();
			// 		if (exp) {
			// 			if (exp.constructor.name === "ReturnValue") {
			// 				block.returnValue.value = exp;
			// 				break;
			// 			} else {
			// 				expressions.push(exp);
			// 			}
			// 		}
			// 	}

			// 	block.expressions = expressions;

			// 	if (!block.returnValue) {
			// 		block.returnValue = new ReturnValue();
			// 		block.returnValue.value = new NullType();
			// 	}

			// 	// @ts-ignore
			// 	if (this.currentToken.class === Class.RBrace) {
			// 		this.#advance();
			// 	} else {
			// 		this.#throw("SyntaxError: Expected '}' after conditional block");
			// 	}

			// 	return block;
			// } else {
			// 	this.#throw("SyntaxError: Expected '}' after condition");
			// }
		} else {
			this.#throw("SyntaxError: Must provide condition");
		}
	}

	#parseVariableDeclaration(): VariableDeclaration {
		// [x] let varName = 0;
		// [x] const varName = 0;
		let expr = new VariableDeclaration();

		expr.constant = this.currentToken.token === "const";

		this.#advance(); // OLD: let|const NEW: Identifier>Identifier>Identifier

		if (this.currentToken.class === Class.Identifier) {
			expr.name = this.currentToken.token;

			this.#advance(); // OLD: Identifier>Identifier>Identifier NEW: Symbol>EqualSymbol>Assigner

			// @ts-ignore TS cannot infer the new value
			if (this.currentToken.class === Class.Assigner) {
				this.#advance(); // OLD: Symbol>EqualSymbol>Assigner NEW: __Expression

				let expr2 = this.#parseExpression(); // OLD: __Expression NEW: Symbol>MiscSymbol>Semicolon

				if (expr2) {
					expr.value = expr2;

					// Damage Control
					if (this.currentToken.class !== Class.Semicolon) {
						this.#throw("SyntaxError: Expected semicolon after variable declaration");
						// this.#advance(); // OLD: Symbol>MiscSymbol>Semicolon NEW: <unknown>
					}

					// this.#advance(); // OLD: __Expression|Symbol>MiscSymbol>Semicolon NEW: <unknown>

					return expr;
				} else {
					this.#throw(`SyntaxError: Expected a value`);
				}
			} else {
				this.#throw(`SyntaxError: Expected '=' to follow variable identifier`);
			}
		} else {
			this.#throw(`SyntaxError: Expected variable name after identifier`);
		}
	}

	#parseVariableAssignment(data?: ExpressionParsingData): VariableAssignment {
		let expr = new VariableAssignment();

		if (this.currentToken.class === Class.Identifier) {
			expr.name = this.currentToken.token;

			this.#advance(); // OLD: Identifier>Identifier>Identifier NEW: Symbol>EqualSymbol>Assigner

			// @ts-ignore TS cannot infer the new value
			if (this.currentToken.class === Class.Assigner) {
				this.#advance(); // OLD: Symbol>EqualSymbol>Assigner NEW: __Expression

				let expr2 = this.#parseExpression(null, {
					classEnder: 'rparen'
				}); // OLD: __Expression NEW: Symbol>MiscSymbol>Semicolon

				if (expr2) {
					expr.value = expr2;

					// Damage Control
					if ((data?.omitTrailing !== true) && (!ExpressionParsingMap[data?.prompt || ';'].symbols.find(e => e === this.currentToken.class))) {
						this.#throw(`SyntaxError: Expected ${ExpressionParsingMap[data.prompt].toString()} after variable assignment`);
						// this.#advance(); // OLD: Symbol>MiscSymbol>Semicolon NEW: <unknown>
					}

					// this.#advance(); // OLD: __Expression|Symbol>MiscSymbol>Semicolon NEW: <unknown>

					return expr;
				} else {
					this.#throw(`SyntaxError: Expected a value`);
				}
			} else {
				this.#throw(`SyntaxError: Expected '=' to follow variable identifier`);
			}
		} else {
			this.#throw(`SyntaxError: Expected variable name after identifier`);
		}
	}

	#parseIfStatement(): ConditionalStatement {
		let expr = new ConditionalStatement();

		this.#advance(); // OLD: Keyword>LanguageWords>LanguageWord NEW: __Expression

		let ifBlock = this.#parseConditionalBlock();

		if (ifBlock) {
			expr.ifBlock = ifBlock;

			let elseifBlocks = [];

			while (this.#nextToken().token === "else" && this.#nextToken(2).token === "if") {
				this.#advance(); // OLD: Symbol>MiscSymbol>RBrace NEW: Keyword>LanguageWords>LanguageWord
				this.#advance(); // OLD: Keyword>LanguageWords>LanguageWord NEW: Keyword>LanguageWords>LanguageWord
				this.#advance(); // OLD: Keyword>LanguageWords>LanguageWord NEW: __Expression
				let elseifBlock = this.#parseConditionalBlock();
				if (elseifBlock) {
					elseifBlocks.push(elseifBlock);
				}
			}

			expr.elseifBlocks = elseifBlocks;

			if (this.currentToken.class === Class.RBrace && this.#nextToken().token === "else") {
				this.#advance(); // OLD: Symbol>MiscSymbol>RBrace NEW: Keyword>LanguageWords>LanguageWord
			}

			if (this.currentToken.token === "else") {
				this.#advance(); // OLD: Keyword>LanguageWords>LanguageWord NEW: __Expression
				let elseBlock = this.#parseBlock();
				if (elseBlock) {
					expr.elseBlock = elseBlock;
				}
			}

			return expr;
		} else {
			this.#throw("SyntaxError: Must provide if block in if-statement");
		}
	}

	#parseWhileLoop(): WhileLoop {
		let expr = new WhileLoop();

		this.#advance(); // OLD: Keyword>LanguageWords>LanguageWord NEW: __Expression

		let block = this.#parseConditionalBlock();

		if (block) {
			expr.condition = block.condition;
			expr.expressions = block.expressions;
			expr.returnValue = block.returnValue;

			return expr;
		} else {
			this.#throw("SyntaxError: Must provide block in while loop");
		}
	}

	#parseForLoop(): ForLoop {
		this.#advance(); // OLD: Keyword>LanguageWords>LanguageWord NEW: Symbol>GroupSymbol>LParen

		if (/let|const/.test(this.#nextToken().token)) {
			// [x] for (let i = 0; i < 5; i = i + 1) { }

			if (this.#nextToken(2).token === "const") {
				this.#throw("SyntaxError: Cannot use constant variable for index");
			}

			this.#advance();

			let expr = new IncrementalLoop();

			let loopDef = this.#parseVariableDeclaration();

			if (this.currentToken.class !== Class.Semicolon) {
				this.#throw("SyntaxError: Expected ';'");
			}

			this.#advance();

			let loopCondition = this.#parseExpression();

			if (this.currentToken.class !== Class.Semicolon) {
				this.#throw("SyntaxError: Expected ';'");
			}

			this.#advance();

			let loopEnd = this.#parseVariableAssignment({
				prompt: ';',
				omitTrailing: true
			});

			if (this.currentToken.class !== Class.RParen) {
				this.#throw("SyntaxError: Expected ')'");
			}

			this.#advance();

			if (this.currentToken.class !== Class.LBrace) {
				this.#throw("SyntaxError: Expected '{'");
			}

			let b = this.#parseBlock();

			if (!b) {
				this.#throw("SyntaxError: Expected block");
			}

			expr.condition = loopCondition;
			expr.expressions = b.expressions;
			expr.fn = loopEnd;
			expr.index = loopDef;
			expr.returnValue = b.returnValue;

			return expr;
		} else {
			// [x] for (k, _ in obj) {}
			// [x] for (_, v in obj) {}
			// [x] for (_, _ in obj) {}
			// [x] for (k, v in obj) {}
			let expr = new ObjectLoop();

			this.#advance(); // OLD: Symbol>GroupSymbol>LParen NEW: Identifier>Identifier>Identifier

			if (this.currentToken.class === Class.Identifier) {
				expr.index = this.currentToken.token;
			} else {
				this.#throw("SyntaxError: Expected identifier");
			}

			this.#advance(); // OLD: Identifier>Identifier>Identifier NEW: Symbol>MiscSymbol>Comma

			if (this.currentToken.class !== Class.Comma) {
				this.#throw("SyntaxError: Expected ','");
			}

			this.#advance(); // OLD: Symbol>MiscSymbol>Comma NEW: Identifier>Identifier>Identifier

			if (this.currentToken.class === Class.Identifier) {
				expr.value = this.currentToken.token;
			} else {
				this.#throw("SyntaxError: Expected identifier");
			}

			this.#advance(); // OLD: Identifier>Identifier>Identifier NEW: Keyword>LanguageWords>LanguageWord

			if (this.currentToken.token !== 'in') {
				this.#throw("SyntaxError: Expected 'in'");
			}

			this.#advance(); // OLD: Keyword>LanguageWords>LanguageWord NEW: __Expression

			expr.object = this.#parseExpression(null, {
				prompt: '('
			});

			if (!expr.object) {
				this.#throw("SyntaxError: Expected object");
			}

			this.#advance(); // OLD: __Expression NEW: Symbol>GroupSymbol>RBrace

			if (this.currentToken.class === Class.LBrace) {
				let b = this.#parseBlock();

				if (b) {
					expr.expressions = b.expressions;
					expr.returnValue = b.returnValue;

					return expr;
				} else {
					this.#throw("SyntaxError: Expected block");
				}
			}
		}
	}

	/**
	 * Parses a function
	 * @start requiresKeyword: Identifier>Identifier>Identifier ELSE: async|function
	 * @param {boolean} requiresKeyword Whether the function requires the keyword 'function' (can still be async)
	 * @returns {FunctionBlock}
	 */
	#parseFunction(requiresKeyword: boolean = true): FunctionBlock {
		let expr = new FunctionBlock();

		if (this.currentToken.token === "async") {
			expr.async = true;

			this.#advance();
		}

		if (this.currentToken.token !== "function" && requiresKeyword === true) {
			this.#throw("SyntaxError: 'function' keyword expected");
		} else if (this.currentToken.token === "function" && requiresKeyword === true) {
			this.#advance();
		}

		if (this.currentToken.class !== Class.Identifier) {
			this.#throw("SyntaxError: Expected identifier");
		}

		expr.name = this.currentToken.token;

		// if (!inline) {
		// 	expr.async = this.currentToken.token === "async";

		// 	this.#advance();

		// 	if (this.currentToken.class !== Class.Identifier) {
		// 		this.#throw("SyntaxError: Expected identifier");
		// 	}

		// 	expr.name = this.currentToken.token;
		// } else {
		// 	expr.name = "<anonymous>";
		// }

		this.#advance();

		//#region FunctionCall copied code
		this.#advance(); // OLD: Symbol>GroupSymbol>LParen NEW: __Expression
		let args: any[] = [];
		while (this.currentToken && this.currentToken.class !== Class.RParen) {
			let e = this.#parseExpression(null, {
				prompt: ','
			});
			if (e) {
				args.push(e);
			}
			if (this.currentToken.class === Class.Comma) {
				this.#advance(); // OLD: Symbol>MiscSymbol>Comma NEW: *
			}
		}
		expr.parameters = args;
		if (this.currentToken.class !== Class.RParen) {
			this.#throw("SyntaxError: Function parameters must end with a closing parentheses");
		}
		//#endregion

		this.#advance();

		if (this.currentToken.class !== Class.LBrace) {
			this.#throw("SyntaxError: Expected '{'");
		}

		let b = this.#parseBlock();

		if (!b) {
			this.#throw("SyntaxError: Expected block");
		}

		expr.expressions = b.expressions;
		expr.returnValue = b.returnValue;

		return expr;
	}

	#parseReturn() {
		let expr = new ReturnValue();

		this.#advance(); // OLD: Keyword>LanguageWords>LanguageWord NEW: __Expression

		let value = this.#parseExpression();

		if (value) {
			expr.value = value;
		} else {
			expr.value = new VoidType();
		}

		return expr;
	}

	#parseBreak(): Break {
		let expr = new Break();

		return expr;
	}

	#parseContinue(): Continue {
		let expr = new Continue();

		return expr;
	}

	#parsePass(): Pass {
		let expr = new Pass();

		return expr;
	}

	#parseCase(): Case {
		let expr = new Case();

		this.#advance(); // OLD: Keyword>LanguageWords>LanguageWord NEW: __Expression

		let condition = this.#parseExpression();

		if (!condition) {
			this.#throw("SyntaxError: Expected expression");
		}

		expr.condition = condition;

		let b = this.#parseBlock(Class.Colon);

		if (!b) {
			this.#throw("SyntaxError: Expected block");
		}

		expr.expressions = b.expressions;
		expr.returnValue = b.returnValue;

		return expr;
	}

	#parseSwitchStatement(): Switch {
		let expr = new Switch();

		this.#advance(); // OLD: Keyword>LanguageWords>LanguageWord NEW: __Expression

		let condition = this.#parseExpression();

		if (!condition) {
			this.#throw("SyntaxError: Expected expression");
		}

		expr.condition = condition;

		// this.#advance(); // OLD: __Expression NEW: Symbol>GroupSymbol>LBrace
		this.#advance(); // OLD: Symbol>GroupSymbol>LBrace NEW: Keyword>LanguageWords>LanguageWord

		while (this.currentToken?.class !== Class.RBrace) {
			if (this.currentToken.token === "case") {
				let caseBlock = this.#parseCase();

				if (!caseBlock) {
					this.#throw("SyntaxError: Expected case block");
				}

				expr.cases.push(caseBlock);
			} else if (this.currentToken.token === "default") {
				this.#advance();

				let defaultBlock = this.#parseBlock(Class.Colon);

				if (!defaultBlock) {
					this.#throw("SyntaxError: Expected default block");
				}

				expr.default = defaultBlock;
			} else {
				this.#throw(`SyntaxError: Expected 'case' or 'default', not ${this.currentToken.token}`);
			}
		}

		return expr;
	}

	#parseClass(): ClassObject {
		let expr = new ClassObject();

		this.#advance(); // OLD: Symbol>LanguageWords>LanguageWord NEW: Identifier>Identifier>Identifier

		if (this.currentToken.class !== Class.Identifier) {
			this.#throw("SyntaxError: Expected class name");
		}

		expr.name = this.currentToken.token;

		this.#advance(); // OLD: Identifier>Identifier>Identifier NEW: Symbol>GroupSymbol>LBrace|Symbol>LanguageWords>LanguageWord

		if (this.currentToken.token === "extends") {
			this.#advance(); // OLD: Symbol>LanguageWords>LanguageWord NEW: Identifier>Identifier>Identifier

			expr.extends = this.currentToken.token;
		} else if (this.currentToken.class !== Class.LBrace) {
			this.#throw("SyntaxError: Expected '{'");
		}

		this.#advance(); // OLD: Symbol>GroupSymbol>LBrace|Symbol>LanguageWords>LanguageWord NEW: __ClassStarter

		while (this.currentToken) {
			// [x] public? static? member = "value";
			// [x] public? static? method() { }
			// [x] <CLASSNAME>() { }
			// [x] <CLASSNAME>::<CONSTRUCTOR_NAME>() { }
			// [x] ~<CLASSNAME>() { }
			// [x] get prop() { }
			// [x] set prop() { }

			// let _expr: GetMemberAccessor | SetMemberAccessor | Member | Constructor | Destructor;

			if (this.currentToken.token === expr.name) {
				let _expr = new Constructor();

				if (this.#nextToken().class === Class.Colon) {
					this.#advance();
					this.#advance();

					if (this.currentToken.class !== Class.Colon) {
						this.#throw("SyntaxError: Expected ':'");
					}

					this.#advance();

					let fb = this.#parseFunction(false);

					_expr.async = fb.async;
					_expr.expressions = fb.expressions;
					_expr.override_name = fb.name;
					_expr.parameters = fb.parameters;
					_expr.returnValue = fb.returnValue;

					expr.constructors.push(_expr);
				} else {
					let fb = this.#parseFunction(false);

					_expr.async = fb.async;
					_expr.expressions = fb.expressions;
					_expr.override_name = fb.name;
					_expr.parameters = fb.parameters;
					_expr.returnValue = fb.returnValue;

					expr.primary_constructor = _expr;
				}
			} else if (this.currentToken.token === '~') {
				let _expr = new Destructor();

				this.#advance();

				let fb = this.#parseFunction(false);

				_expr.async = fb.async;
				_expr.expressions = fb.expressions;
				_expr.parameters = fb.parameters;
				_expr.returnValue = fb.returnValue;

				expr.destructor = _expr;
			} else if (this.currentToken.token === "get") {
				let _expr = new GetMemberAccessor();

				this.#advance();

				let fb = this.#parseFunction(false);

				_expr.async = fb.async;
				_expr.expressions = fb.expressions;
				_expr.name = fb.name;
				_expr.parameters = fb.parameters;
				_expr.returnValue = fb.returnValue;

				expr.accessors.push(_expr);
			} else if (this.currentToken.token === "set") {
				let _expr = new SetMemberAccessor();

				this.#advance();

				let fb = this.#parseFunction(false);

				_expr.async = fb.async;
				_expr.expressions = fb.expressions;
				_expr.name = fb.name;
				_expr.parameters = fb.parameters;
				_expr.returnValue = fb.returnValue;

				expr.accessors.push(_expr);
			} else if (this.currentToken.class === Class.RBrace) {
				break;
			} else {
				let _expr: PropertyMember | MethodMember;
				let visibility: 'public' | 'protected' | 'private';
				let isStatic: boolean;
				let isMethod: boolean;

				if (/public|protected|private/.test(this.currentToken.token)) {
					visibility = this.currentToken.token as "public" | "protected" | "private";

					this.#advance();
				}

				if (/static/.test(this.currentToken.token)) {
					isStatic = true;

					this.#advance();
				}

				if (this.#nextToken().class === Class.LParen) {
					_expr = new MethodMember();

					let fb = this.#parseFunction(false);

					_expr.async = fb.async;
					_expr.name = fb.name;
					_expr.expressions = fb.expressions;
					_expr.parameters = fb.parameters;
					_expr.returnValue = fb.returnValue;
				} else if (this.#nextToken().class === Class.Assigner) {
					_expr = new PropertyMember();

					let va = this.#parseVariableAssignment();

					_expr.name = va.name;
					_expr.value = va.value;
				} else {
					this.#throw("SyntaxError: Expected class member or method")
				}

				_expr.static = isStatic;
				_expr.visibility = visibility;

				expr.members.push(_expr);
			}

			this.#advance();
		}

		return expr;
	}

	// #parseEnum() {
	// 	let expr = new Enum();

	// 	this.#advance();

	// 	if (this.currentToken.class !== Class.Identifier) {
	// 		this.#throw("SyntaxError: Expected identifier");
	// 	}

	// 	expr.name = this.currentToken.token;

	// 	this.#advance();

	// 	let value = this.#parseExpression(); // FIXME Doesn't work, need custom array/dict parsing

	// 	if (!value) {
	// 		this.#throw("SyntaxError: Expected enum");
	// 	}

	// 	expr.value = value;

	// 	return expr;
	// }

	#parseImport(): DirectFileImport | DefaultNamedImport | NamedImport[] | WildcardImport {
		this.#advance();

		if (this.currentToken.phylum === Phyla.String) {
			let expr = new DirectFileImport();
			expr.location = this.currentToken.token;

			return expr;
		} else if (this.currentToken.class === Class.Identifier) {
			let expr = new DefaultNamedImport();
			expr.name = this.currentToken.token;

			this.#advance();

			if (this.currentToken.token !== 'from') {
				this.#throw("SyntaxError: Expected 'from'");
			}

			this.#advance();

			// @ts-ignore
			if (this.currentToken.phylum !== Phyla.String) {
				this.#throw("SyntaxError: Expected file location");
			}

			expr.location = this.currentToken.token;

			return expr;
		} else if (this.currentToken.class === Class.LBrace) {
			let expr: NamedImport[] = [];

			this.#advance();

			// @ts-ignore
			while (this.currentToken.class !== Class.RBrace) {
				let _expr = new NamedImport();

				// @ts-ignore
				if (this.currentToken.class !== Class.Identifier) {
					this.#throw("SyntaxError: Expected identifier");
				}

				_expr.exportedName = this.currentToken.token;

				if (this.#nextToken().token === "as") {
					this.#advance();
					this.#advance();

					// @ts-ignore
					if (this.currentToken.class !== Class.Identifier) {
						this.#throw("SyntaxError: Expected identifier");
					}

					_expr.importedName = this.currentToken.token;
				}

				if (this.#nextToken().class === Class.Comma) {
					this.#advance();
					this.#advance();

					_expr.importedName = _expr.exportedName;
				} else if (this.#nextToken().class === Class.RBrace) {
					this.#advance();
				} else {
					this.#throw("SyntaxError: Expected ',' or '}'");
				}

				expr.push(_expr);
			}

			this.#advance();

			if (this.currentToken.token !== 'from') {
				this.#throw("SyntaxError: Expected 'from'");
			}

			this.#advance();

			// @ts-ignore
			if (this.currentToken.phylum !== Phyla.String) {
				this.#throw("SyntaxError: Expected file location");
			}

			expr.forEach(e => {
				e.location = this.currentToken.token;
			});

			return expr;
		} else if (this.currentToken.class === Class.Multiply) {
			let expr = new WildcardImport();

			this.#advance();

			if (this.currentToken.token === 'as') {
				this.#advance();

				// @ts-ignore
				if (this.currentToken.class !== Class.Identifier) {
					this.#throw("SyntaxError: Expected identifier");
				}

				expr.importedName = this.currentToken.token;

				this.#advance();
			}

			if (this.currentToken.token !== 'from') {
				this.#throw("SyntaxError: Expected 'from'");
			}

			this.#advance();

			// @ts-ignore
			if (this.currentToken.phylum !== Phyla.String) {
				this.#throw("SyntaxError: Expected file location");
			}

			expr.location = this.currentToken.token;

			return expr;
		}
	}

	#parseExport(): DefaultExportStatement | NamedExportStatement {
		this.#advance();

		if (this.currentToken.token === "default") {
			let expr = new DefaultExportStatement();

			this.#advance();

			if (this.currentToken.class !== Class.Identifier) {
				this.#throw("SyntaxError: Expected identifier");
			}

			expr.exportedName = this.currentToken.token;

			return expr;
		} else if (this.currentToken.class === Class.Identifier) {
			let expr = new NamedExportStatement();

			expr.exportedName = this.currentToken.token;

			if (this.#nextToken().token === 'as') {
				this.#advance();
				this.#advance();

				if (this.currentToken.class !== Class.Identifier) {
					this.#throw("SyntaxError: Expected identifier");
				}

				expr.importedName = this.currentToken.token;
			} else {
				expr.importedName = expr.exportedName;
			}

			return expr;
		}
	}

	#parseLambda() {
		let expr = new Lambda();

		this.#advance();

		if (this.currentToken.class !== Class.Identifier) {
			this.#throw("SyntaxError: Expected identifier");
		}

		expr.name = this.currentToken.token;

		this.#advance();

		if (this.currentToken.class !== Class.LParen) {
			this.#throw("SyntaxError: Expected '('");
		}

		this.#advance();

		let params = [];

		while (this.currentToken.class !== Class.RParen) {
			if (this.currentToken.class !== Class.Identifier) {
				this.#throw("SyntaxError: Expected identifier");
			}

			params.push(this.currentToken.token);

			this.#advance();

			if (this.currentToken.class === Class.Comma) {
				this.#advance();
				// @ts-ignore
			} else if (this.currentToken.class === Class.RParen) {
				this.#advance();
				break;
			} else {
				this.#throw("SyntaxError: Expected ',' or ')'");
			}
		}

		// @ts-ignore
		if (this.currentToken.class === Class.RParen) {
			this.#advance();
		}

		expr.parameters = params;

		// @ts-ignore
		if (this.currentToken.class !== Class.Colon) {
			this.#throw("SyntaxError: Expected ':'");
		}

		this.#advance();

		let b = this.#parseExpression();

		if (!b) {
			this.#throw("SyntaxError: Expected expression");
		}

		expr.body = b;

		return expr;
	}

	#parseStarter() {
		let expr: unknown;
		if (/let|const/.test(this.currentToken.token)) {
			expr = this.#parseVariableDeclaration();
		} else if (/if/.test(this.currentToken.token)) {
			expr = this.#parseIfStatement();
		} else if (/while/.test(this.currentToken.token)) {
			expr = this.#parseWhileLoop();
		} else if (/for/.test(this.currentToken.token)) {
			expr = this.#parseForLoop();
		} else if (/function|async/.test(this.currentToken.token)) {
			expr = this.#parseFunction();
		} else if (/return/.test(this.currentToken.token)) {
			expr = this.#parseReturn();
		} else if (/break/.test(this.currentToken.token)) {
			expr = this.#parseBreak();
		} else if (/continue/.test(this.currentToken.token)) {
			expr = this.#parseContinue();
		} else if (/pass/.test(this.currentToken.token)) {
			expr = this.#parsePass();
		} else if (/switch/.test(this.currentToken.token)) {
			expr = this.#parseSwitchStatement();
		} else if (/class/.test(this.currentToken.token)) {
			expr = this.#parseClass();
		// } else if (/enum/.test(this.currentToken.token)) {
			// 	expr = this.#parseEnum();
		} else if (/import/.test(this.currentToken.token)) {
			expr = this.#parseImport();
		} else if (/export/.test(this.currentToken.token)) {
			expr = this.#parseExport();
		} else if (/lambda/.test(this.currentToken.token)) {
			expr = this.#parseLambda();
		} else {
			expr = this.#parseExpression();
		}
		return expr;
	}

	parse(): typeof this.ast {
		while (this.currentToken) {
			let building = this.#parseStarter();
			if (building) {
				this.ast.push(building);
			}
			this.#advance();
		}
		return this.ast;
	}
}

export default Parser;

export {
	Base as Base,
	Expression as Expression,
	Literal as Literal,
	Identifier as Identifier,
	VoidType as VoidType,
	StringType as StringType,
	NumberType as NumberType,
	BooleanType as BooleanType,
	NullType as NullType,
	UndefinedType as UndefinedType,
	ArrayType as ArrayType,
	DictionaryType as DictionaryType,
	Accessor as Accessor,
	BinaryOperation as BinaryOperation,
	UnaryOperation as UnaryOperation,
	ReferenceOperation as ReferenceOperation,
	ReverseOperation as ReverseOperation,
	AdditionOperation as AdditionOperation,
	SubtrationOperation as SubtrationOperation,
	MultiplicationOperation as MultiplicationOperation,
	DivisionOperation as DivisionOperation,
	ExponentiationOperation as ExponentiationOperation,
	LessThanOperation as LessThanOperation,
	LessThanOrEqualOperation as LessThanOrEqualOperation,
	GreaterThanOperation as GreaterThanOperation,
	GreaterThanOrEqualOperation as GreaterThanOrEqualOperation,
	VariableDeclaration as VariableDeclaration,
	VariableAssignment as VariableAssignment,
	Block as Block,
	ConditionalBlock as ConditionalBlock,
	ConditionalStatement as ConditionalStatement,
	IncrementalLoop as IncrementalLoop,
	ObjectLoop as ObjectLoop,
	WhileLoop as WhileLoop,
	Break as Break,
	Continue as Continue,
	Pass as Pass,
	Case as Case,
	Switch as Switch,
	FunctionBlock as FunctionBlock,
	ReturnValue as ReturnValue,
	Await as Await,
	FunctionCall as FunctionCall,
	Constructor as Constructor,
	Destructor as Destructor,
	Member as Member,
	PropertyMember as PropertyMember,
	MethodMember as MethodMember,
	GetMemberAccessor as GetMemberAccessor,
	SetMemberAccessor as SetMemberAccessor,
	ClassObject as ClassObject,
	ClassInstantiator as ClassInstantiator,
	DirectFileImport as DirectFileImport,
	DefaultNamedImport as DefaultNamedImport,
	NamedImport as NamedImport,
	WildcardImport as WildcardImport,
	DefaultExportStatement as DefaultExportStatement,
	NamedExportStatement as NamedExportStatement,
	Lambda as Lambda
};