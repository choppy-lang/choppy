/**
 * @fileOverview Utilities for choppy-lang
 * @author RyloRiz
 * @version 0.0.1
 */

import Token from "./token";

enum Kingdom {
	Fake = "Fake",
	Primitives = "Primitives",
	Complex = "Complex",
	Symbol = "Symbol",
	Keyword = "Keyword",
	Identifier = "Identifier"
}

enum Phyla {
	Fake = "Fake",
	String = "String",
	Number = "Number",
	Boolean = "Boolean",
	Unreal = "Unreal",
	Array = "Array",
	Dictionary = "Dictionary",
	EqualSymbol = "EqualSymbol",
	GroupSymbol = "GroupSymbol",
	ArithmeticSymbol = "ArithmeticSymbol",
	MiscSymbol = "MiscSymbol",
	LanguageWords = "LanguageWords",
	Identifier = "Identifier"
}

enum Class {
	Fake = "Fake",
	LiteralString = "LiteralString",
	TemplateString = "TemplateString",
	Char = "Char", // Is this really necessary though? We're not trying to be gross like C
	Integer = "Integer",
	Float = "Float",
	Boolean = "Boolean",
	Null = "Null",
	Undefined = "Undefined",
	Unknown = "Unknown",
	Assigner = "Assigner",
	Comparison = "Comparison",
	LessThan = "LessThan",
	GreaterThan = "GreaterThan",
	LessThanOrEqual = "LessThanOrEqual",
	GreaterThanOrEqual = "GreaterThanOrEqual",
	LParen = "LParen",
	RParen = "RParen",
	LBracket = "LBracket",
	RBracket = "RBracket",
	LBrace = "LBrace",
	RBrace = "RBrace",
	Add = "Add",
	Subtract = "Subtract",
	Multiply = "Multiply",
	Divide = "Divide",
	Exponent = "Exponent",
	Colon = "Colon",
	Semicolon = "Semicolon",
	Reverse = "Reverse",
	Reference = "Reference",
	Tilde = "Tilde",
	Dot = "Dot",
	Comma = "Comma",
	LanguageWord = "LanguageWord",
	Identifier = "Identifier"
}

interface FileData {
	name: string;
	extension: string;
	path: string; // Maybe have two: winPath & unixPath?
	relativePath: string;
	source: string;
}

const LANGUAGE_WORDS = [
	//-- STANDARD
	'let',
	'const',
	'if',
	// 'elseif',
	'else',
	'while',
	'for',
	'in',
	'of',
	'continue',
	'break',
	'switch',
	'case',
	'function',
	'return',
	'class',
	'new',
	'constructor',
	'public',
	'private',
	'protected',
	'static',
	// 'enum',
	'get',
	'set',
	'import',
	'export',
	'from',
	'as',
	'default',
	'lambda',
	'extends',
	// 'interface',
	// 'struct',
	// 'implements',
	'async',
	'await',
	'pass',

	// NEW
	'kill',			// Destroy anything
	'exit'			// Exit the process
];

function getClassName(inst: any) {
	return inst.constructor.toString().match(/^class\s+(\S*)\s*{\s*constructor/);
}

function splitArray(arr: Array<Token>, find: Class) {
	let chunks: Array<Array<Token>> = [];
	let current: Array<Token> = [];
	for (let i = 0; i < arr.length; i++) {
		const t = arr[i];
		if (t.class === find) {
			chunks.push(current);
			current = [];
		} else {
			current.push(t);
		}
	}
	if (current.length > 0) {
		chunks.push(current);
	}
	return chunks;
}

function hash(str: string): number {
	let finalHash: number = 0;
	for (let i = 0; i < str.length; i++) {
		const charCode = str.charCodeAt(i);
		finalHash += charCode;
	}
	return finalHash;
}

class HashMap {
	#hashTable: any[];

	constructor() {
		this.#hashTable = [];
	}

	get(key: any) {
		let idx = hash(key);

		if (!this.#hashTable[idx]) {
			return undefined;
		}

		for (let keyVal of this.#hashTable[idx]) {
			if (keyVal[0] === key) {
				return keyVal[1];
			}
		}
	}

	delete(key: any) {
		let idx = hash(key);

		if (!this.#hashTable[idx]) {
			return undefined;
		}

		let idx2 = 0;
		for (let keyVal of this.#hashTable[idx]) {
			if (keyVal[0] === key) {
				delete this.#hashTable[idx][idx2];
			}
			idx2++;
		}
	}

	set(key: any, val: any) {
		let idx = hash(key);

		if (!this.#hashTable[idx]) {
			this.#hashTable[idx] = [];
		}

		this.#hashTable[idx].push([key, val]);
	}
}

export {
	// Enums
	Kingdom as Kingdom,
	Phyla as Phyla,
	Class as Class,

	// Interfaces
	FileData as FileData,

	// Misc
	LANGUAGE_WORDS as LANGUAGE_WORDS,

	// Functions
	getClassName as getClassName,
	splitArray as splitArray,

	// Classes
	HashMap as HashMap
}