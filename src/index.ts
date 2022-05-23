import fs from 'fs'
import path from 'path'
import CLIMake from 'climake'
import chalk from 'chalk'
import Lexer from './lexer'
import Parser from './parser'
import Interpreter from './interpreter'
import Compiler from './compiler' // yeah no

function run(input: string, shouldCompile: boolean = false, fileName: string = 'a') {
	let lexer = new Lexer(input);
	let tokens = lexer.scan(input);

	let ast = Parser.parse(tokens);

	if (shouldCompile) {
		let compiledBinary = Compiler.compile(ast, process.platform);
		let num = 0;
		let name: string;
		if (fs.existsSync(path.join(__dirname, `${fileName}`))) {
			while (fs.existsSync(path.join(__dirname, `${fileName}-${num}`))) {
				num++;
				if (num >= 50) {
					console.log(chalk.yellow(`MaxOutputReachedError: Too many default name-generated executables. Rename some to fix this.`));
				}
			}
			name = `${fileName}-${num}`
		} else {
			name = `${fileName}`
		}
		if (process.platform === 'win32') {
			name += '.exe'
		}
		fs.writeFileSync(path.join(__dirname, name), compiledBinary);
	} else {
		Interpreter.interpret(ast);
	}
}

let cli = new CLIMake();

cli.argument('compiler', 'c', 'Compile the input to an executable');

cli.handle((opts: any) => {
	let input = opts._[0];
	if (/\w+\.\w+/.test(input)) {
		if (input.endsWith('.chp') || input.endsWith('.chop')) {
			if (fs.existsSync(path.join(__dirname, input))) {
				let i = fs.readFileSync(path.join(__dirname, input));
				run(i.toString('base64'), opts.args['compile'] ? true : false)
			} else {
				console.log(chalk.red(`NotFoundError: ${input} does not exist`));
			}
		} else {
			console.log(chalk.red(`InvalidFileTypeError: ${input} must have a '.chp' or '.chop' extension`));
		}
	} else {
		run(input, opts.args['compile'] ? true : false)
	}
});