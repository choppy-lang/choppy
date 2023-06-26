/**
 * @fileOverview Loader for choppy-lang
 * @author RyloRiz
 * @version 0.0.1
 */

import fs from 'fs'
import path from 'path'
import CLIMake from 'climake'
import chalk from 'chalk'
import Lexer from './lexer'
import Parser from './parser'
import Interpreter from './interpreter'
import Compiler from './compiler' // yeah no
import { FileData } from './util'

function run(shouldCompile: boolean = false, fileData: FileData, outputFileName: string = 'unnamed') {
	let lexer = new Lexer(fileData);
	let tokens = lexer.scan();

	let parser = new Parser(tokens, fileData);
	let ast = parser.parse();

	if (shouldCompile) {
		let compiledBinary = Compiler.compile(ast, process.platform);
		let num = 0;
		let name: string;
		if (fs.existsSync(path.join(__dirname, `${outputFileName}`))) {
			while (fs.existsSync(path.join(__dirname, `${outputFileName}-${num}`))) {
				num++;
				if (num >= 50) {
					console.log(chalk.yellow(`MaxOutputReachedError: Too many default name-generated executables. Rename or delete some to fix this.`));
				}
			}
			name = `${outputFileName}-${num}`;
		} else {
			name = `${outputFileName}`;
		}
		if (process.platform === 'win32') {
			name += '.exe';
		}
		fs.writeFileSync(path.join(__dirname, name), compiledBinary);
	} else {
		let intepreter = new Interpreter(ast, fileData);
		intepreter.interpret();
	}
}

let cli = new CLIMake();

cli.argument('compiler', 'c', 'Compile the input to an executable');

cli.handle((opts: any) => {
	let input: string = opts._[0];
	if (/\w+\.\w+/.test(input)) {
		if (input.endsWith('.chp') || input.endsWith('.chop')) {
			if (fs.existsSync(path.join(__dirname, input))) {
				let i = fs.readFileSync(path.join(__dirname, input));
				let split = input.split('.');
				let ext = split.pop();
				run(opts.args['compile'] ? true : false, {
					name: split.join('.'),
					extension: ext,
					relativePath: path.relative(__dirname, input),
					path: path.resolve(input),
					source: i.toString('base64')
				});
			} else {
				console.log(chalk.red(`NotFoundError: ${input} does not exist`));
			}
		} else {
			console.log(chalk.red(`InvalidFileTypeError: ${input} must have a '.chp' or '.chop' extension`));
		}
	} else {
		run(opts.args['compile'] ? true : false, {
			name: 'unnamed',
			extension: 'chp',
			relativePath: '?',
			path: '?',
			source: input
		});
	}
});