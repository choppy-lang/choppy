/**
 * @fileOverview Lexer for choppy-lang
 * @author RyloRiz
 * @version 0.0.1
 */

import chalk from "chalk";
import Token from "./token";
import { Class, FileData, LANGUAGE_WORDS } from './util'

interface ScanData {
	isComment: boolean;
	multiline: boolean;
}

class Lexer {
	tokens: Token[] = [];
	stored = '';
	raw: string[];
	pos: number;
	currentTkn: any;
	lineNumber: number;
	columnNumber: number;
	file: FileData;
	scanData: ScanData;
	constructor(fileData: FileData) {
		this.tokens = [];
		this.stored = '';
		this.raw = fileData.source.split('');
		this.pos = 0;
		this.lineNumber = 1;
		this.columnNumber = 1;
		this.currentTkn = this.raw[this.pos];
		this.file = fileData;
		this.scanData = {
			isComment: false,
			multiline: false,
		}
	}

	get nextToken(): string {
		return this.raw[this.pos + 1];
	}

	#_advance() {
		this.columnNumber++;
		this.pos++;
		this.currentTkn = this.raw[this.pos];
		if (this.currentTkn === '\n') {
			this.#check();
			this.columnNumber = 1;
			this.lineNumber++;
			if (this.scanData.isComment && this.scanData.multiline === false) {
				this.scanData.isComment = false;
				this.stored = '';
			}
		}
	}

	#advance(amt: number = 1) {
		for (let i = 0; i < amt; i++) {
			this.#_advance();
		}
	}

	#throw(error: string) {
		let lines = [
			chalk.red(`${error}`),
			chalk.red(`\tat "${this.stored}" (${this.file.name}.${this.file.extension}:${this.lineNumber}:${this.columnNumber})`),
			chalk.gray(`\tat throw (choppy/src/lexer.ts:42:5)`),
			chalk.gray(`\tat run (choppy/src/index.ts:11:10)`)
		];
		console.log(lines.join('\n'));
		// console.log(chalk.red(`${error}`));
		// console.log(chalk.red(`\tat "${this.stored}" (${this.file.name}.${this.file.extension}:${this.lineNumber}:${this.columnNumber})`));
		// console.log(chalk.gray(`\tat throw (choppy/src/lexer.ts:42:5)`));
		// console.log(chalk.gray(`\tat run (choppy/src/index.ts:11:10)`));
		process.exit(1);
	}

	#push(custom?: string) {
		let tknGen = new Token(custom || this.stored, this.lineNumber, this.columnNumber);
		if (tknGen.dead !== false) {
			this.#throw(`ScanningError: Error when scanning token "${custom || this.stored}"`);
		} else {
			this.stored = '';
			this.tokens.push(tknGen);
		}
	}

	#check() {
		let stringData = {
			isString: false,
			isComplete: false,
			levels: 0
		};
		if (this.stored.startsWith('\'') || this.stored.startsWith('\"') || this.stored.startsWith('\`')) {
			stringData.isString = true;
			let stringStart = this.stored.split('')[0];

			let tempSplit = this.stored.split('');
			let tempIdx = 0;
			let tempTkn = tempSplit[tempIdx];

			let tempAdvance = () => {
				tempIdx++;
				tempTkn = tempSplit[tempIdx];
			}

			let stack = [];

			while (tempTkn) {
				if (stack.length === 0 && tempTkn === stringStart && tempSplit.length > 1 && this.stored.endsWith(stringStart)) {
					// End of string & complete
					stringData.isComplete = true;
				} else if (tempTkn === '\'' || tempTkn === '\"' || tempTkn === '\`') {
					if (stack[stack.length - 1] == tempTkn) {
						stack.pop();
					} else {
						stack.push(tempTkn);
					}
				}
				tempAdvance();
			}
		}

		if (!stringData.isString && /\s/.test(this.currentTkn)) {
			this.stored = '';
			return;
		}

		if (this.stored === "/" && /\/|\*/.test(this.nextToken)) {
		} else if (this.stored === "//") {
			this.scanData.isComment = true;
			this.scanData.multiline = false;
		} else if (this.stored === "/*") {
			this.scanData.isComment = true;
			this.scanData.multiline = true;
		} else if (this.stored === "*/") {
			if (this.scanData.isComment) {
				this.scanData.isComment = false;
				this.scanData.multiline = false;
			} else {
				this.#throw("SyntaxError: Unexpected end-of-comment Token");
			}
		} else if (this.scanData.isComment === true) {
		} else if (stringData.isString) {
			if (stringData.isComplete) {
				this.#push();
			}
		// } else if (/\d+(\.\d+)?/g.test(this.#stored)) {
		} else if (!isNaN(Number(this.stored.split('')[0]))) {
			// if (!this.stored.endsWith('.')) {
			// 	this.#push();
			// }
			let newRaw = this.stored + this.nextToken;
			if (/^(?:\d+(\.(\d+)?)?)$/.test(this.stored) && /^(?:\d+(\.(\d+)?)?)$/.test(newRaw)) {
				let raw2 = newRaw;
				let raw3 = newRaw;
				while (/^(?:\d+(\.(\d+)?)?)$/.test(raw2)) {
					// raw3 = raw2 + this.nextToken;
					raw3 = raw2;
					this.#advance();
					if (this.columnNumber === 1) {
						this.#throw("SyntaxError: Error scanning number")
					}
					if (/^\d+$/.test(raw2) && /\d|\./.test(this.nextToken)) {
						raw2 = raw2 + this.nextToken;
					} else if (/^\d+\.(\d*)?$/.test(raw2) && /\d/.test(this.nextToken)) {
						raw2 = raw2 + this.nextToken;
					} else {
						break;
					}
				}
				let realRaw: typeof raw2 | typeof raw3;
				if (/^(?:\d+(\.(\d+)?)?)$/.test(raw2)) {
					realRaw = raw2;
				} else {
					realRaw = raw3;
				}
				this.#push(realRaw);
			} else if (!this.stored.endsWith('.')) {
				this.#push();
			}
		} else {
			// Text-based checks
			if (/^(?:true|false|null|undefined|\:|\;|\=\=|\=|\(|\)|\[|\]|\{|\}|\.|\,|\+|\-|\*|\/|\^|\!|\&|\<|\>|\~)$/.test(this.stored)) {
				if ((this.stored === "=" || this.stored === ">" || this.stored === "<") && this.nextToken === "=") {
				} else {
					this.#push();
				}
			} else if (LANGUAGE_WORDS.find(e => e === this.stored)) {
				if (!(/\w/.test(this.nextToken))) {
					this.#push();
				}
			} else {
				// Do nothing bc we don't add stuff here, remember? // YEAH ABT THAT....
				let raw = this.stored;
				let newRaw = this.stored + this.nextToken;
				let rawAnalysis = Token.analyze(raw);
				let newRawAnalysis = Token.analyze(newRaw);
				if (/^\s$/.test(this.nextToken) || (rawAnalysis.dead === false && /*rawAnalysis.classification.class !== Class.Identifier*/ (newRawAnalysis.classification.class === null ? rawAnalysis.classification.class === Class.Identifier : rawAnalysis.classification.class !== Class.Identifier) && rawAnalysis.classification.class !== newRawAnalysis.classification.class)) {
					this.#push();
				}
			}
		}
	}

	scan(): Token[] {
		while (this.currentTkn !== null && this.currentTkn !== undefined) {
			// This is a add-check-push (ACP) lexer model (invented by me :))
			this.stored += this.currentTkn;
			this.#check();
			this.#advance();
		}
		return this.tokens;
	}
}

export default Lexer;