/**
 * @fileOverview Token class for choppy-lang
 * @author RyloRiz
 * @version 0.0.1
 */

import chalk from "chalk";
import { Kingdom, Phyla, Class, LANGUAGE_WORDS } from "./util"

class Token {
	token: string;
	kingdom: Kingdom;
	phylum: Phyla;
	class: Class;
	dead: boolean;
	lineNum: number;
	colNum: number;
	constructor(tkn: string, lineNum: number, colNum: number) {
		const tknData = Token.analyze(tkn);
		this.kingdom = tknData.classification.kingdom;
		this.phylum = tknData.classification.phylum;
		this.class = tknData.classification.class;
		this.dead = tknData.dead;
		this.token = tknData.token;
		this.lineNum = lineNum;
		this.colNum = colNum;
		// if (tknData.dead) {
		// 	debugger;
		// }

		// this.dead = false;
		// this.token = tkn;
		// if (/(?:\d+\.\d+)|(?:\'.*)|(?:\".*)|(?:\`.*)|true|false|null|undefined/.test(tkn)) {				// PRIMITIVE (regexr.com/6m9ec)
		// 	this.kingdom = Kingdom.Primitives;
		// 	if (/\d/.test(tkn)) {  																			// Number
		// 		this.phylum = Phyla.Number;
		// 		if (Number(tkn) % 2 === 0) { 																// - Integer
		// 			this.class = Class.Integer;
		// 		} else {																					// - Float
		// 			this.class = Class.Float;
		// 		}
		// 	} else if (tkn.startsWith('\'') && tkn.endsWith('\'')) {
		// 		this.token = tkn.slice(1, tkn.length - 1);													// String (single)
		// 		this.phylum = Phyla.String;
		// 		this.class = Class.LiteralString;
		// 	} else if (tkn.startsWith('"') && tkn.endsWith('"')) { 											// String (double)
		// 		this.token = tkn.slice(1, tkn.length - 1);
		// 		this.phylum = Phyla.String;
		// 		this.class = Class.LiteralString;
		// 	} else if (tkn.startsWith('`') && tkn.endsWith('`')) { 											// String (template)
		// 		this.phylum = Phyla.String;
		// 		this.class = Class.TemplateString;
		// 	} else if (/true|false/.test(tkn)) {															// Boolean
		// 		this.phylum = Phyla.Boolean;
		// 		this.class = Class.Boolean;
		// 	} else if (/null|undefined/.test(tkn)) {														// Unreal
		// 		this.phylum = Phyla.Unreal;
		// 		if (tkn === 'null') {																		// - Null
		// 			this.class = Class.Null;
		// 		} else if (tkn === 'undefined') {															// - Undefined
		// 			this.class = Class.Undefined;
		// 		}
		// 	}
		// } else if (/\=\=|\=|\:|\;|\(|\)|\[|\]|\{|\}/.test(tkn)) {											// SYMBOL (regexr.com/6m9ei)
		// 	this.kingdom = Kingdom.Symbol;
		// 	if (/^\={ 1, 2 }$/.test(tkn)) {																	// EqualSymbol
		// 		this.phylum = Phyla.EqualSymbol;
		// 		if (tkn === "=") {
		// 			this.class = Class.Comparison;
		// 		} else if (tkn === "==") {
		// 			this.class = Class.Assigner;
		// 		}
		// 	} else if (/\(|\)|\[|\]|\{|\}/.test(tkn)) {														// GroupSymbol
		// 		this.phylum = Phyla.GroupSymbol;
		// 		if (tkn === "(") {
		// 			this.class = Class.LParen;
		// 		} else if (tkn === ")") {
		// 			this.class = Class.RParen;
		// 		} else if (tkn === "[") {
		// 			this.class = Class.LBracket;
		// 		} else if (tkn === "]") {
		// 			this.class = Class.RBracket;
		// 		} else if (tkn === "{") {
		// 			this.class = Class.LBrace;
		// 		} else if (tkn === "}") {
		// 			this.class = Class.RBrace;
		// 		}
		// 	} else if (/\:|\;/.test(tkn)) {																	// MiscSymbol
		// 		this.phylum = Phyla.MiscSymbol;
		// 		if (tkn === ";") {
		// 			this.class = Class.Semicolon;
		// 		} else if (tkn === ":") {
		// 			this.class = Class.Colon;
		// 		}
		// 	} else if (tkn.includes('=')) {																	// EqualSymbol
		// 		this.phylum = Phyla.EqualSymbol;
		// 		if (tkn === "=") {
		// 			this.class = Class.Assigner;
		// 		} else if (tkn === "==") {
		// 			this.class = Class.Comparison;
		// 		}
		// 	}
		// } else if (LANGUAGE_WORDS.find(e => e.toLowerCase() === tkn)) {										// KEYWORD
		// 	this.kingdom = Kingdom.Keyword;
		// 	this.phylum = Phyla.LanguageWords;
		// 	this.class = Class.LanguageWord;
		// }
		// if (!this.class) {
		// 	this.dead = true;
		// }
	}

	public static analyze(tkn: string) {
		let t: {
			kingdom: Kingdom | null,
			phylum: Phyla | null,
			class: Class | null
		} = {
			kingdom: null,
			phylum: null,
			class: null
		}
		let token: string = tkn;
		let dead = false;

		if (/^(?:\d+(\.\d+)?)$|(?:\'.*)|(?:\".*)|(?:\`.*)|true|false|null|undefined/.test(tkn)) {			// PRIMITIVE (regexr.com/6m9ec) // Old num: (?:\d+\.\d+)|
			t.kingdom = Kingdom.Primitives;
			if (/\d/.test(tkn) && !tkn.includes(`"`) && !tkn.includes(`'`) && !tkn.includes(`\``)) {  																			// Number
				t.phylum = Phyla.Number;
				if (Number.isInteger(Number(tkn))) { 																// - Integer
					t.class = Class.Integer;
				} else {																					// - Float
					t.class = Class.Float;
				}
			} else if (tkn.startsWith('\'') && tkn.endsWith('\'')) {
				token = tkn.slice(1, tkn.length - 1);														// String (single)
				t.phylum = Phyla.String;
				t.class = Class.LiteralString;
			} else if (tkn.startsWith('"') && tkn.endsWith('"')) { 											// String (double)
				token = tkn.slice(1, tkn.length - 1);
				t.phylum = Phyla.String;
				t.class = Class.LiteralString;
			} else if (tkn.startsWith('`') && tkn.endsWith('`')) { 											// String (template)
				t.phylum = Phyla.String;
				t.class = Class.TemplateString;
			} else if (/true|false/.test(tkn)) {															// Boolean
				t.phylum = Phyla.Boolean;
				t.class = Class.Boolean;
			} else if (/null|undefined/.test(tkn)) {														// Unreal
				t.phylum = Phyla.Unreal;
				if (tkn === 'null') {																		// - Null
					t.class = Class.Null;
				} else if (tkn === 'undefined') {															// - Undefined
					t.class = Class.Undefined;
				}
			}
		} else if (/^(?:\=\=|\=|\:|\;|\(|\)|\[|\]|\{|\}|\.|\,|\+|\-|\*|\/|\^|\!|\&|\<|\>|\<\=|\>\=|\~)$/.test(tkn)) {								// SYMBOL (regexr.com/6m9ei)
			t.kingdom = Kingdom.Symbol;
			if (/^\={ 1, 2 }|\<|\>|\<\=|\>\=$/.test(tkn)) {																	// EqualSymbol
				t.phylum = Phyla.EqualSymbol;
				if (tkn === "=") {
					t.class = Class.Comparison;
				} else if (tkn === "==") {
					t.class = Class.Assigner;
				} else if (tkn === "<") {
					t.class = Class.LessThan;
				} else if (tkn === ">") {
					t.class = Class.GreaterThan;
				} else if (tkn === "<=") {
					t.class = Class.LessThanOrEqual;
				} else if (tkn === ">=") {
					t.class = Class.GreaterThanOrEqual;
				}
			} else if (/^(?:\(|\)|\[|\]|\{|\})$/.test(tkn)) {												// GroupSymbol
				t.phylum = Phyla.GroupSymbol;
				if (tkn === "(") {
					t.class = Class.LParen;
				} else if (tkn === ")") {
					t.class = Class.RParen;
				} else if (tkn === "[") {
					t.class = Class.LBracket;
				} else if (tkn === "]") {
					t.class = Class.RBracket;
				} else if (tkn === "{") {
					t.class = Class.LBrace;
				} else if (tkn === "}") {
					t.class = Class.RBrace;
				}
			} else if (/\+|\-|\*|\/|\^/.test(tkn)) {														// ArithmeticSymbol
				t.phylum = Phyla.ArithmeticSymbol;
				if (tkn === "+") {
					t.class = Class.Add;
				} else if (tkn === "-") {
					t.class = Class.Subtract;
				} else if (tkn === "*") {
					t.class = Class.Multiply;
				} else if (tkn === "/") {
					t.class = Class.Divide;
				} else if (tkn === "^") {
					t.class = Class.Exponent;
				}
			} else if (/\:|\;|\.|\,|\!|\&|\~/.test(tkn)) {														// MiscSymbol
				t.phylum = Phyla.MiscSymbol;
				if (tkn === ";") {
					t.class = Class.Semicolon;
				} else if (tkn === ":") {
					t.class = Class.Colon;
				} else if (tkn === ".") {
					t.class = Class.Dot;
				} else if (tkn === ",") {
					t.class = Class.Comma;
				} else if (tkn === "!") {
					t.class = Class.Reverse;
				} else if (tkn === "&") {
					t.class = Class.Reference;
				} else if (tkn === "~") {
					t.class = Class.Tilde;
				}
			} else if (tkn.includes('=')) {																	// EqualSymbol
				t.phylum = Phyla.EqualSymbol;
				if (tkn === "=") {
					t.class = Class.Assigner;
				} else if (tkn === "==") {
					t.class = Class.Comparison;
				}
			}
		} else if (LANGUAGE_WORDS.find(e => e.toLowerCase() === tkn)) {										// KEYWORD
			t.kingdom = Kingdom.Keyword;
			t.phylum = Phyla.LanguageWords;
			t.class = Class.LanguageWord;
		} else {
			if (/[\=|\:|\;|\(|\)|\[|\]|\{|\}|\.|\,|\+|\-|\*|\/|\^]$/.test(tkn)) {
				t.kingdom = null;
				t.phylum = null;
				t.class = null;
			} else {
				t.kingdom = Kingdom.Identifier;
				t.phylum = Phyla.Identifier;
				t.class = Class.Identifier;
			}
		}
		if (t.class === null || t.class === undefined) {
			dead = true;
		}
		return {
			token: token,
			dead: dead,
			classification: t
		}
	}

	// get token() {
	// 	return this.token;
	// }

	// set token(_) {
	// 	console.log(chalk.blue(`InternalError: Attempted to rewrite value of token. Please contact the developer(s) of Choppy with a repro of this issue`));
	// 	process.exit(1);
	// }

	// get kingdom() {
	// 	return this.kingdom;
	// }

	// set kingdom(_) {
	// 	console.log(chalk.blue(`InternalError: Attempted to rewrite value of kingdom. Please contact the developer(s) of Choppy with a repro of this issue`));
	// 	process.exit(1);
	// }

	// get phylum() {
	// 	return this.phylum;
	// }

	// set phylum(_) {
	// 	console.log(chalk.blue(`InternalError: Attempted to rewrite value of phylum. Please contact the developer(s) of Choppy with a repro of this issue`));
	// 	process.exit(1);
	// }

	// get class() {
	// 	return this.class;
	// }

	// set class(_) {
	// 	console.log(chalk.blue(`InternalError: Attempted to rewrite value of class. Please contact the developer(s) of Choppy with a repro of this issue`));
	// 	process.exit(1);
	// }
}

export default Token;