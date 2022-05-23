enum Kingdom {
	Primitives,
	Complex
}

enum Phyla {
	String,
	Number,
	Boolean,
	Unreal,
	Array,
	Dictionary
}

enum Class {
	String,
	Char,
	Integer,
	Float,
	Boolean,
	Null,
	Undefined,
	Unknown
}

class Token {
	token: string;
	kingdom: Kingdom;
	phylum: Phyla;
	class: Class;
	constructor(tkn: string) {
		this.token = tkn;
		this.kingdom = Kingdom.Primitives;
		if (/\d/.test(tkn)) {  // Number
			this.phylum = Phyla.Number;
			if (Number(tkn) % 2 === 0) { // Not float
				this.class = Class.Integer;
			} else {
				this.class = Class.Float;
			}
		}
	}
}