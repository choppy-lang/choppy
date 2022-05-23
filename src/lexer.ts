class Lexer {
	raw: string[];
	pos: number;
	currentTkn: any;
	tokens: any[];
	constructor(text: string) {
		this.raw = text.split('');
		this.pos = 0;
		this.currentTkn = this.raw[this.pos];
		this.tokens = [];
	}

	#advance(amt: number = 1) {
		this.pos += amt;
		this.currentTkn = this.raw[this.pos];
	}

	scan(text: string) {
		
	}
}