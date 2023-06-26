/**
 * @fileOverview Unofficial test suite for choppy-lang
 * @author RyloRiz
 * @version 0.0.1
 */

const Token = require('../dist/token').default;
const Lexer = require('../dist/lexer').default;
const Parser = require('../dist/parser').default;
const Interpreter = require('../dist/interpreter').default;

// function hola() {
// 	return a.trim().replace('world', '') + 89;
// }

// let a = 5 + 4 - 3 * 2 / 1;
// let b = 6 * 46 - 23 + 5 / 2;
// let c = 1 + 1;

//

let inputs = {
	parseExpression: `
// let a = 1 + 4 * (2 / 3);
// let b = 8 + ("hello wotld");

// let c = -7;
// let d = -(89);
// let e = !7;
// let f = !("f");

// let g = func();
// let h = foo(9.3);
// let i = foo(8, "90");

// let j = Person.walk(5).murder(50, "bobby").damage;

// let k = new Bobby();
// let l = new Car.Ford("Truck", 1950);

// let m = await joey.murder("Bob");

// let n = 8 == 6;

// let a = 90;
// if (a == 90) {
// 	let b = print("Hello world!");
// } else if (a == 80) {
// 	idk("lol");
// } else if (a == 100) {
// 	do("Something");
// } else {
// 	print("die:", 80);
// }

// for (k, v in players) {
// 	print(k, v);
// }

// for (let i = 0; i < 5; i = i + 1) {
// 	print(i);
// }

// function hiMom(message) {
// 	print("I say: " + message);
// }

// switch (8 + 6) {
// 	case (14):
// 		print("cool");
// 	case (9):
// 		print("wtf");
// 	default:
// 		die();
// }

// this.member = Some.value;

class Weather {
	public static sunny = 0;
	public static rainy = 1;

	Weather() {
		this.status = Weather.sunny;
	}

	Weather::sunny() {
		this.status = Weather.sunny;
	}

	Weather::rainy() {
		this.status = Weather.rainy;
	}

	~Weather() {
		print("Dying");
	}

	get weather() {
		return this.status;
	}

	set weather(status) {
		this.status = status;
	}

	startRaining() {
		this.status = Weather.rainy;
	}

	stopRaining() {
		this.status = Weather.sunny;
	}

	static opposite(status) {
		return 1 - status;
	}
}

let colorado = Weather::sunny();
colorado.stopRaining();

// let array = [
// 	6,
// 	"hello world",
// 	true,
// 	null,
// 	undefined
// ];

// let dict = {
// 	key1 = "hello",
// 	['key2'] = "world",
// 	key3 = "i'm",
// 	['key4'] = "cool"
// };

// let breakName = 0;

// import "file";
// import Def from './def';
// import { idk, urmom as hi } from './mom';
// import * as People from './people';
// import * from './family';

// export default ClassName;
// export NamedThingy as ItsNamed;
// export AnotherNamedThingy;

// lambda anon (a, b) : print(a, b);

function idkWtfThisIs() {
	let y = 5;
	let x = 345;
	return x + y;
}
	`,
	interpretExpression: [
		`
let a = 4;
for (let i = 0; i < a; i = i + 1) {
	if (i == 1) {
		return i;
	}
}
		`,
		`
let a = 5;
let b = 4;

function add(x, y) {
	return x + y;
}

print(add(a, b));
		`,
	]
};

let whatToScan = inputs.interpretExpression[0].trim();

let lexer = new Lexer({
	name: '<unnamed>',
	extension: 'chp',
	relativePath: '?',
	path: '?',
	source: whatToScan
});
let tkns = lexer.scan();
tkns;

let parser = new Parser(tkns, {
	name: '<unnamed>',
	extension: 'chp',
	relativePath: '?',
	path: '?',
	source: whatToScan
});
let ast = parser.parse();
ast;

let interpreter = new Interpreter(ast, {
	name: '<unnamed>',
	extension: 'chp',
	relativePath: '?',
	path: '?',
	source: whatToScan
});
let intepreted = interpreter.interpret();
intepreted;