/**
 * @fileOverview Interpreter for choppy-lang
 * @author RyloRiz
 * @version 0.0.1
 */

import chalk from "chalk";
import {
	Base,
	Expression,
	Literal,
	Identifier,
	VoidType,
	StringType,
	NumberType,
	BooleanType,
	NullType,
	UndefinedType,
	ArrayType,
	DictionaryType,
	Accessor,
	BinaryOperation,
	UnaryOperation,
	ReferenceOperation,
	ReverseOperation,
	AdditionOperation,
	SubtrationOperation,
	MultiplicationOperation,
	DivisionOperation,
	ExponentiationOperation,
	LessThanOperation,
	LessThanOrEqualOperation,
	GreaterThanOperation,
	GreaterThanOrEqualOperation,
	VariableDeclaration,
	VariableAssignment,
	Block,
	ConditionalBlock,
	ConditionalStatement,
	IncrementalLoop,
	ObjectLoop,
	WhileLoop,
	Break,
	Continue,
	Pass,
	Case,
	Switch,
	FunctionBlock,
	ReturnValue,
	Await,
	FunctionCall,
	Constructor,
	Destructor,
	Member,
	PropertyMember,
	MethodMember,
	GetMemberAccessor,
	SetMemberAccessor,
	ClassObject,
	ClassInstantiator,
	DirectFileImport,
	DefaultNamedImport,
	NamedImport,
	WildcardImport,
	DefaultExportStatement,
	NamedExportStatement,
	Lambda
} from "./parser";
import { FileData, getClassName as get } from "./util";

class Scope {
	public name: string = "<anonymous>";
	public variables: Map<string, any> = new Map<string, any>();
	constructor(name: string) {
		this.name = name;
	}
}

class Interpreter {
	ast: Base[] = [];
	lineNumber: number = 0;
	columnNumber: number = 0;
	pos: number = 0;
	scopePos: number = 0;
	currentNode: Base;
	currentScope: Scope;
	scopes: Scope[] = [];
	file: FileData;
	constructor(ast: Array<any>, fileData: FileData) {
		this.ast = ast;
		this.currentNode = ast[this.pos];
		this.file = fileData;
		let globalScope = new Scope('<global>');
		this.currentScope = globalScope;
		this.scopes.push(globalScope);
	}

	#nextToken(num: number = 1): Base {
		return this.ast[this.pos + num];
	}

	#advance(): void {
		this.pos++;
		this.currentNode = this.ast[this.pos];
		if (this.currentNode) {
			this.lineNumber = this.currentNode.lineNum;
			this.columnNumber = this.currentNode.colNum;
		}
	}

	#pushScope(name: string): void {
		let s = new Scope(name);
		this.scopes.push(s);
		this.scopePos++;
		this.currentScope = this.scopes[this.scopePos];
	}

	#popScope(): void {
		this.scopes.pop();
		this.scopePos--;
		this.currentScope = this.scopes[this.scopePos];
	}

	#throw(error: string) {
		// console.trace("Trace");
		let split = this.file.source.split("\n");
		let line = split[this.lineNumber];
		let columns = line.split("");
		let errTkn = columns[this.columnNumber];
		let caretLine = (new Array(this.columnNumber - 1 > 0 ? this.columnNumber - 1 : 0)).fill(' ').join('') + '^';
		let lines = [
			chalk.red(`${line}`),
			chalk.red(`${caretLine}`),
			chalk.red(`${error}`),
			chalk.red(`\tat ${this.currentScope.name} (${this.file.name}.${this.file.extension}:${this.lineNumber}:${this.columnNumber})`),
			chalk.gray(`\tat throw (choppy/src/interpreter.ts:37:5)`),
			chalk.gray(`\tat run (choppy/src/index.ts:11:10)`)
		];
		console.log(lines.join('\n'));
		process.exit(1);
	}

	#executeFunction(func: FunctionBlock, args: any[]) {
		this.#pushScope(func.name);
		for (let index = 0; index < func.parameters.length; index++) {
			const param = func.parameters[index];
			this.currentScope.variables.set(param.name, this.#evaluate(args[index]));
		}
		func.expressions.forEach(expr => {
			this.#evaluate(expr);
		});
		return this.#evaluate(func.returnValue);
	}

	#evaluate(node: Base) {
		if (node.constructor.name == 'Expression') {
			const expr = node as Expression;
			return this.#evaluate(expr.value);
		} else if (node.constructor.name == 'Literal') {
			const expr = node as Literal;
			return expr.value;
		} else if (node.constructor.name == 'Identifier') {
			const expr = node as Identifier;
			let name = expr.name;
			for (let index = this.scopes.length - 1; index >= 0; index--) {
				let found = this.scopes[index].variables.get(name);
				if (found) {
					return found.value;
				}
			}
			this.#throw(`ReferenceError: ${name} does not exist`);
		} else if (node.constructor.name === 'Accessor') {
			const expr = node as Accessor;
			// Ah shoot the AST is structured extremely inefficiently:
			// It stores nested Accessors in the child node,
			// so if you call #evaluate() on the child, it'll
			// return undefined because you need the parent node
			// to have access to the child.
			// Instead, I have to manually evaluate the whole
			// Accessor, nested and all.
			function recursive(expr2) {
				let parent = this.#evaluate(expr2.parent);
				if (expr2.child.constructor.name === 'Accessor') {
					let child = expr2.child as unknown as Accessor; // Some Expression > Accessor type conflict, i don't want to deal with this rn
					if (child.parent.constructor.name === "FunctionCall") {
						let func = parent.get((child.parent as unknown as Identifier).name);
						let returnValue = this.#executeFunction(func, (child.parent as unknown as FunctionCall).arguments);
						child.parent = returnValue as unknown as Expression;
					} else if (child.parent.constructor.name === "Identifier") {
						child.parent = parent.get((child.parent as unknown as Identifier).name);
					}
					return recursive(expr2.child);
				} else {
					if (expr2.child.constructor.name === "FunctionCall") {
						let func = parent.get((expr2.child as unknown as Identifier).name);
						let returnValue = this.#executeFunction(func, (expr2.child as unknown as FunctionCall).arguments);
						return returnValue as unknown as Expression;
					} else if (expr2.child.constructor.name === "Identifier") {
						return parent.get((expr2.child as unknown as Identifier).name);
					}
				}
			}
			return recursive(expr);
		} else if (node.constructor.name === 'BinaryOperation') {
			const expr = node as BinaryOperation;
			let left = this.#evaluate(expr.left);
			let right = this.#evaluate(expr.right);
			if (left.type === right.type) {
				let rt = new BooleanType();
				rt.value = (left.value === right.value);
				return rt;
			} else {
				this.#throw(`TypeError: Cannot compare types '${left.type}' and '${right.type}'`);
			}
		} else if (node.constructor.name === 'UnaryOperation') {
			const expr = node as UnaryOperation;
			let value = this.#evaluate(expr.value);
			if (value.type === 'number') {
				let rt = new NumberType();
				rt.value = -value;
				return rt;
			} else {
				this.#throw(`TypeError: Cannot negate type '${value.type}'`);
			}
		} else if (node.constructor.name === 'ReverseOperation') {
			const expr = node as ReverseOperation;
			let value = this.#evaluate(expr.value);
			if (value.type === 'boolean') {
				let rt = new BooleanType();
				if (value.value === true) {
					rt.value = false;
					return rt;
				} else if (value.value === false) {
					rt.value = true;
					return rt;
				}
			} else {
				this.#throw(`TypeError: Cannot reverse type '${value.type}'`);
			}
		} else if (node.constructor.name === 'AdditionOperation') {
			const expr = node as AdditionOperation;
			let left = this.#evaluate(expr.left);
			let right = this.#evaluate(expr.left);
			if (left.type === 'number' && right.type === 'number') {
				let rt = new NumberType();
				rt.value = left.value + right.value;
				return rt;
			} else {
				this.#throw(`TypeError: Cannot perform add on types '${left.type}' and '${right.type}'`);
			}
		} else if (node.constructor.name === 'SubtrationOperation') {
			const expr = node as SubtrationOperation;
			let left = this.#evaluate(expr.left);
			let right = this.#evaluate(expr.left);
			if (left.type === 'number' && right.type === 'number') {
				let rt = new NumberType();
				rt.value = left.value - right.value;
				return rt;
			} else {
				this.#throw(`TypeError: Cannot perform sub on types '${left.type}' and '${right.type}'`);
			}
		} else if (node.constructor.name === 'MultiplicationOperation') {
			const expr = node as MultiplicationOperation;
			let left = this.#evaluate(expr.left);
			let right = this.#evaluate(expr.left);
			if (left.type === 'number' && right.type === 'number') {
				let rt = new NumberType();
				rt.value = left.value * right.value;
				return rt;
			} else {
				this.#throw(`TypeError: Cannot perform mul on types '${left.type}' and '${right.type}'`);
			}
		} else if (node.constructor.name === 'DivisionOperation') {
			const expr = node as DivisionOperation;
			let left = this.#evaluate(expr.left);
			let right = this.#evaluate(expr.left);
			if (left.type === 'number' && right.type === 'number') {
				let rt = new NumberType();
				rt.value = left.value / right.value;
				return rt;
			} else {
				this.#throw(`TypeError: Cannot perform div on types '${left.type}' and '${right.type}'`);
			}
		} else if (node.constructor.name === 'ExponentiationOperation') {
			const expr = node as ExponentiationOperation;
			let left = this.#evaluate(expr.left);
			let right = this.#evaluate(expr.left);
			if (left.type === 'number' && right.type === 'number') {
				let rt = new NumberType();
				rt.value = left.value ** right.value;
				return rt;
			} else {
				this.#throw(`TypeError: Cannot perform exp on types '${left.type}' and '${right.type}'`);
			}
		} else if (node.constructor.name === 'LessThanOperation') {
			const expr = node as LessThanOperation;
			let left = this.#evaluate(expr.left);
			let right = this.#evaluate(expr.left);
			if (left.type === 'number' && right.type === 'number') {
				let rt = new BooleanType();
				rt.value = left.value < right.value;
				return rt;
			} else {
				this.#throw(`TypeError: Cannot perform '<' on types '${left.type}' and '${right.type}'`);
			}
		} else if (node.constructor.name === 'LessThanOrEqualOperation') {
			const expr = node as LessThanOrEqualOperation;
			let left = this.#evaluate(expr.left);
			let right = this.#evaluate(expr.left);
			if (left.type === 'number' && right.type === 'number') {
				let rt = new BooleanType();
				rt.value = left.value <= right.value;
				return rt;
			} else {
				this.#throw(`TypeError: Cannot perform '<=' on types '${left.type}' and '${right.type}'`);
			}
		} else if (node.constructor.name === 'GreaterThanOperation') {
			const expr = node as GreaterThanOperation;
			let left = this.#evaluate(expr.left);
			let right = this.#evaluate(expr.left);
			if (left.type === 'number' && right.type === 'number') {
				let rt = new BooleanType();
				rt.value = left.value > right.value;
				return rt;
			} else {
				this.#throw(`TypeError: Cannot perform '>' on types '${left.type}' and '${right.type}'`);
			}
		} else if (node.constructor.name === 'GreaterThanOrEqualOperation') {
			const expr = node as GreaterThanOrEqualOperation;
			let left = this.#evaluate(expr.left);
			let right = this.#evaluate(expr.left);
			if (left.type === 'number' && right.type === 'number') {
				let rt = new BooleanType();
				rt.value = left.value >= right.value;
				return rt;
			} else {
				this.#throw(`TypeError: Cannot perform '>=' on types '${left.type}' and '${right.type}'`);
			}
		} else if (node.constructor.name === 'VariableDeclaration') {
			const expr = node as VariableDeclaration;
			if (this.currentScope.variables.get(expr.name)) {
				this.#throw(`SyntaxError: Variable '${expr.name}' has already been declared`)
			}
			this.currentScope.variables.set(expr.name, {
				constant: expr.constant,
				value: this.#evaluate(expr.value)
			});
		} else if (node.constructor.name === 'VariableAssignment') {
			const expr = node as VariableAssignment;
			for (let index = this.scopes.length - 1; index >= 0; index--) {
				const scope = this.scopes[index];
				if (scope.variables.has(expr.name)) {
					if (scope.variables.get(expr.name).constant === true) {
						this.#throw(`SyntaxError: Cannot modify constant variable '${expr.name}'`);
					} else {
						scope.variables.set(expr.name, {
							constant: false,
							value: expr.value
						});
						break;
					}
				}
			}
		} else if (node.constructor.name === 'Block') {
			const expr = node as Block;
			for (let i = 0; i < expr.expressions.length; i++) {
				const line = expr.expressions[i];
				this.#evaluate(line);
			}
			return this.#evaluate(expr.returnValue);
		} else if (node.constructor.name === 'ConditionalBlock') {
			const expr = node as ConditionalBlock;
			let canPass = this.#evaluate(expr.condition) as BooleanType;
			if (canPass.value === true) {
				for (let i = 0; i < expr.expressions.length; i++) {
					const line = expr.expressions[i];
					this.#evaluate(line);
				}
				return this.#evaluate(expr.returnValue);
			} else {
				return 0;
			}
		} else if (node.constructor.name === 'ConditionalStatement') {
			const expr = node as ConditionalStatement;
			let ifBlock = this.#evaluate(expr.ifBlock);
			if (ifBlock === 0) {
				for (let i = 0; i < expr.elseifBlocks.length; i++) {
					const elseifBlock = expr.elseifBlocks[i];
					let check = this.#evaluate(elseifBlock);
					if (check !== 0) {
						return check;
					}
				}
				if (expr.elseBlock?.constructor.name === 'Block') {
					return this.#evaluate(expr.elseBlock);
				}
			} else {
				return ifBlock;
			}
		} else if (node.constructor.name === 'IncrementalLoop') {
			const expr = node as IncrementalLoop;
			this.#pushScope(`for_loop<${Math.random()}>`)
			this.#evaluate(expr.index);
			while (this.#evaluate(expr.condition).value === true) {
				for (let i = 0; i < expr.expressions.length; i++) {
					const line = expr.expressions[i];
					this.#evaluate(line);
				}
				if (expr.returnValue?.constructor.name !== 'VoidType') {
					// TODO Ok so basically we have to way to detect whether a line of expressions returned something to pass on to the parent stack
				}
				this.#evaluate(expr.fn);
			}
		}
		return new VoidType();
	}

	interpret(): any[] {
		let rts: any[] = [];
		for (let index = 0; index < this.ast.length; index++) {
			const node = this.ast[index];
			let rt = this.#evaluate(node);
			rts.push(rt);
		}
		return rts;
	}
}

export default Interpreter;