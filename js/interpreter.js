/*
 * added: outputs, booleans, keywords, string, multiline functions, returns, loops, conditions, conditional operators, eols, script-tags, postfixes
 */

'use strict';

var trump = trump || {};

trump.operators = {

	'I_DONT_THINK_I_AM_GOING_TO_LOSE_BUT_IF': 'condition',
	'I_AM_BUILDING_A_WALL': 'add',
	'I_SORTA_GET_AWAY_WITH_THINGS_LIKE_THAT': 'multiply',
	'SOMETHING_ELSE_MUST_BE_SMALL': 'subtract',
	'BECAUSE_THEY_LET_YOU_DOWN': 'divide',
	'POLITICALLY_CORRECT': 'remainder',
	'FREE_TRADE_IS': 'is',
	'THE_GREATEST_TEMPERAMENT_THAT': 'greater',
	'A_VERY_LITTLE_GUY': 'less',
	'KNOW_MORE_ABOUT': 'equals',
	'BABY_CRYING_WHILE_I_AM_SPEAKING': 'repeat',
	'END_JOB_KILLING': 'endrepeat',
	'OUT_OF_CONTROL': 'endif',
	'AND_BEAUTIFUL_PIECE_OF': 'and',
	'PLAY_GOLF_OR': 'or',
	'NOT_A_WAR_HERO': 'not',
	'SO_GREAT': 'pow',
	'AMAZING': 'eol',
	'ITS_HUGE': 'script',
	'YOU_CAN_NEVER_BE_TOO_GREEDY': 'endfunction',
	'THE_POINT_IS': 'beginfunction',
	'I_AM_SPEAKING_WITH_MYSELF': 'output',
	'THE_BEAUTY_OF_ME_IS_I_AM': 'return'
	
};


trump.LexerFunctions = {
	
	isOperator: function(c) { return /[(),]/.test(c); },
	isDigit: function(c) { return /[0-9]/.test(c); },
	isWhiteSpace: function(c) { return /\s/.test(c); },
	isString: function(c) { return c === '\''; },
	isIdentifier: function(c) { return typeof c === 'string' && ! trump.LexerFunctions.isDigit(c) &&
		! trump.LexerFunctions.isWhiteSpace(c) &&
		! trump.LexerFunctions.isOperator(c) &&
		! trump.LexerFunctions.isString(c); }

};

trump.Lexer = function(input) {
	
	this.tokens = [], this.c, this.i = 0;
	
	this.advance = function() { 
	
		return this.c = input[++this.i]; 
		
	};
	
	this.addToken = function(type, value) {
	
		this.tokens.push({
	
			type: type,
			value: value
	
		});
	
	};
	
	while (this.i < input.length) {
	
		this.c = input[this.i];
		
		if (trump.LexerFunctions.isString(this.c)) {
		
			var idn = '';
		
			while (! trump.LexerFunctions.isString(this.advance())) idn += this.c;
			
			this.addToken('string', idn);
			this.advance();
		
		} else if (trump.LexerFunctions.isWhiteSpace(this.c)) {
		
		 	this.advance();
		
		} else if (trump.LexerFunctions.isOperator(this.c)) {
			
			this.addToken(this.c);
			this.advance();
		
		} else if (trump.LexerFunctions.isDigit(this.c)) {
		
			var num = this.c;
		
			while (trump.LexerFunctions.isDigit(this.advance())) num += this.c;
			
			if (this.c === '.') {
			
				do num += this.c; while (trump.LexerFunctions.isDigit(this.advance()));
			
			}
			
			num = parseFloat(num);
			
			if (! isFinite(num)) throw new Error('Number is too large or too small');
		
			this.addToken('number', num);
		
		} else if (trump.LexerFunctions.isIdentifier(this.c)) {
		
			var idn = this.c;
		
			while (trump.LexerFunctions.isIdentifier(this.advance())) idn += this.c;
		
			if (idn in trump.operators) {
		
				this.addToken(idn);
				this.advance()
		
			} else if (idn === 'FAKE_NEWS' || idn === 'ALTERNATIVE_FACT') {
			
				idn = idn === 'ALTERNATIVE_FACT' ? true : false;
			
				this.addToken('boolean', idn);
				
				this.advance();
			
			} else {
				
				this.addToken('identifier', idn);
			
			}	
			
		} else {
		
			throw new Error('Unrecognized token');
		
		}
	
	}
	
	return this.tokens;

};

trump.Parser = function(tokens) {

	var self = this;

	this.symbols = {},
	
	this.symbol = function (id, nud, lbp, led) {
		
		var sym = this.symbols[id] || {};
		this.symbols[id] = {
			
			lbp: sym.lbp || lbp,
			nud: sym.nud || nud,
			led: sym.lef || led
		
		};
	
	};

	this.interpretToken = function(token) {
		
		var sym = Object.create(this.symbols[token.type]);
	
		sym.type = token.type;
		sym.value = token.value;
		
		return sym;
	
	};

	this.i = 0;
	this.token = function() { 
		
		return this.interpretToken(tokens[this.i]); 
		
	};
	
	this.advance = function() { 
		
		this.i++; 
		
		return this.token(); 
		
	};

	this.expression = function(rbp) {
		
		var left 	= null, 
			t 		= this.token();
		
		this.advance();
		
		if (! t.nud) 
			throw new Error('Unexpected token: ' + t.type);
		
		left = t.nud(t);
		
		while (rbp < this.token().lbp) {
		
			t = this.token();
			
			this.advance();
			
			if (! t.led) 
				throw new Error('Unexpected token: ' + t.type);
		
			left = t.led(left);
		
		}
		
		return left;
	
	};

	this.infix = function (id, lbp, rbp, led) {
		
		rbp = rbp || lbp;
		
		this.symbol(id, null, lbp, led || function(left) {
		
			return {
	
				type: id,
				left: left,
				right: self.expression(rbp)
	
			};
	
		});
	
	};
	
	this.prefix = function (id, rbp) {
		
		this.symbol(id, function () {
	
			return {
	
				type: id,
				right: self.expression(rbp)
	
			};
		
		});
	
	};
	
	this.postfix = function(id) {
	
		this.symbol(id, function() {
		
			return {
			
				type: id
			
			}
		
		});
	
	};


	this.symbol(',');
	this.symbol(')');
	this.symbol('(end)');

	this.symbol('number', function(number) {
		
		return number;
	
	});
	
	this.symbol('boolean', function(bool) {
	
		return bool;
	
	});
	
	this.symbol('string', function(string) {
	
		return string;
	
	});
	
	this.symbol('identifier', function(name) {
	
		if (self.token().type === '(') {
			
			var args = [];
			
			if (tokens[self.i + 1].type === ')') {
			
				self.advance();
			
			} else {
			
				do {
					
					self.advance();
					
					args.push(self.expression(2));
				
				} while (self.token().type === ',');
				
				if (self.token().type !== ')') 
					throw new Error('Expected closing parenthesis )');
			
			}
			
			self.advance();
			
			return {
			
				type: 'call',
				args: args,
				name: name.value
			
			};
		}
		
		return name;
	
	});

	this.symbol('(', function () {
		
		var value = self.expression(2);
		
		if (self.token().type !== ')') 
			throw new Error('Expected closing parenthesis )');
		
		self.advance();
		
		return value;
	
	});

	this.prefix('-', 7);
	this.infix('SO_GREAT', 6, 5);
	this.infix('I_SORTA_GET_AWAY_WITH_THINGS_LIKE_THAT', 4);
	this.infix('BECAUSE_THEY_LET_YOU_DOWN', 4);
	this.infix('POLITICALLY_CORRECT', 4);
	this.infix('I_AM_BUILDING_A_WALL', 3);
	this.infix('SOMETHING_ELSE_MUST_BE_SMALL', 3);
	this.infix('A_VERY_LITTLE_GUY', 7);
	this.infix('THE_GREATEST_TEMPERAMENT_THAT', 7);
	this.infix('KNOW_MORE_ABOUT', 7);
	this.infix('NOT_A_WAR_HERO', 7);
	this.prefix('I_DONT_THINK_I_AM_GOING_TO_LOSE_BUT_IF', 3);
	this.prefix('BABY_CRYING_WHILE_I_AM_SPEAKING', 3);
	this.prefix('I_AM_SPEAKING_WITH_MYSELF', 1);
	this.postfix('OUT_OF_CONTROL');
	this.postfix('END_JOB_KILLING');
	this.postfix('AMAZING');
	this.infix('AND_BEAUTIFUL_PIECE_OF', 4);
	this.infix('PLAY_GOLF_OR', 5);
	this.postfix('ITS_HUGE');
	this.postfix('YOU_CAN_NEVER_BE_TOO_GREEDY');
	this.postfix('THE_POINT_IS');
	this.prefix('THE_BEAUTY_OF_ME_IS_I_AM', 1);
	
	this.infix('FREE_TRADE_IS', 1, 2, function(left) {
	
		if (left.type === 'call') {
	
			for (var i = 0; i < left.args.length; i++) {
	
				if (left.args[i].type !== 'identifier') 
					throw new Error('Invalid argument name');
	
			}
			
			return {
			
				type: 'function',
				name: left.name,
				args: left.args,
				value: self.expression(2)
			
			};
		
		} else if (left.type === 'identifier') {
			
			return {
			
				type: 'assign',
				name: left.value,
				value: self.expression(2)
			
			};
		
		} else {
		
			throw new Error('Invalid lvalue');
			
		}
		
	});

	var arr = [];
	
	do {
	
		var exp = this.expression(0);
		
		arr.push(exp);
	
	} while (this.token().type !== 'ITS_HUGE');
	
	var begin = arr.shift();
	
	if (begin.type !== 'ITS_HUGE')
		throw new Error('Expected ITS_HUGE at the beginning of the script');
	
	this.parseTree = [];
	
	this.buildBlocks(arr, this.parseTree);
		
	return this.parseTree;
	
};

trump.Parser.prototype.buildBlocks = function(tree, arr) {

	while (tree.length > 0) {
	
		var temp = tree.shift();
		
		if (temp.type === 'BABY_CRYING_WHILE_I_AM_SPEAKING' || temp.type === 'I_DONT_THINK_I_AM_GOING_TO_LOSE_BUT_IF') {
		
			var tempArr = [];
			temp.left = temp.right;
			temp.right = tempArr;
			arr.push(temp);
			this.buildBlocks(tree, temp.right);
			
		
		} else if (temp.type === 'function') {
		
			var tempArr = [];
			var tempVal = temp.value;
			temp.value = tempArr;
			temp.value.push(tempVal);
			arr.push(temp);
			this.buildBlocks(tree, temp.value);
		
		} else if (temp.type === 'END_JOB_KILLING' || temp.type === 'OUT_OF_CONTROL' || temp.type === 'YOU_CAN_NEVER_BE_TOO_GREEDY') {
		
			arr.push(temp);
			return;
		
		} else if (temp.type !== 'AMAZING') {
		
			if (tree[0] && tree[0].type === 'AMAZING')
				arr.push(temp);
			else
				throw new Error('AMAZING expected');
		
		}
	
	
	}

};

trump.EvaluatorFunctions = {};

trump.EvaluatorFunctions.operators = {
		
	'I_AM_BUILDING_A_WALL': function (a, b) {
		
		if (typeof b === 'string')
			b = b.replace('\'', ''); 
		
		return a + b; 
			
	},
		
	'SOMETHING_ELSE_MUST_BE_SMALL': function (a, b) {
		
		if (typeof a === 'string' && typeof b === 'string') {
			
			b = b.replace('\'', '');
			
			return a.replace(b, '');
			
		} else if (typeof a === 'number' && typeof b === 'number') { 
		
			return a - b;
				
		} else {
			
			throw new Error('Not supported');
			
		}
			
	},
		
	'I_SORTA_GET_AWAY_WITH_THINGS_LIKE_THAT': function (a, b) { 
		
		if (typeof a === 'string' && typeof b === 'number') {
			
			return a.repeat(b);
			
		} else if (typeof a === 'number' && typeof b === 'number') {
			
			return a * b;
				
		} else {
			
			throw new Error('Not supported');
			
		}
			
	},
		
	'POLITICALLY_CORRECT': function (a, b) { 
		
		if (typeof a === 'number' && typeof b === 'number') {
			
			return a / b;
			
		} else {
			
			throw new Error('Not supported');
			
		}
			
	},
		
	'BECAUSE_THEY_LET_YOU_DOWN': function (a, b) { 
		
		if (typeof a === 'number' && typeof b === 'number') {
		
			return a % b;
				
		} else {
			
			throw new Error('Not supported');
			
		}
			
	},
		
	'SO_GREAT': function (a, b) { 
		
		if (typeof a === 'number' && typeof b === 'number') {
		
			return Math.pow(a, b); 
			
		} else {
			
			throw new Error('Not supported');
			
		}
			
	},
		
	'BABY_CRYING_WHILE_I_AM_SPEAKING': function(a) {
		
		return a;
		
	},
		
	'I_DONT_THINK_I_AM_GOING_TO_LOSE_BUT_IF': function(a) {
		
		return a;
		
	},
		
	'A_VERY_LITTLE_GUY': function(a, b) {
			
		return a < b;
			
	},
		
	'THE_GREATEST_TEMPERAMENT_THAT': function(a, b) {
		
		return a > b;
		
	},
		
	'KNOW_MORE_ABOUT': function(a, b) {
		
		return a === b;
		
	},
		
	'AND_BEAUTIFUL_PIECE_OF': function(a, b) {
		
		if (a && b)
			return true;
		return false;
		
	},
		
	'PLAY_GOLF_OR': function(a, b) {
		
		if (a || b)
			return true;
		return false;
		
	},
		
	'NOT_A_WAR_HERO': function(a, b) {
		
		return a !== b;
		
	},
	
	'I_AM_SPEAKING_WITH_MYSELF': function(a) {
	
		console.log(a);
	
	}
	
};

trump.EvaluatorFunctions.variables = {};

trump.EvaluatorFunctions.arrayFunctions = {

	'array': function() {
	
		var arr = [];
		
		if (arguments.length > 0) {
		
			for (var i = 0; i < arguments.length; i++)
				arr[i] = arguments[i];
	
		}
		
		return arr;
	
	},
	
	'add': function(arr, element) {
	
		arr.push(element);
	
	},
	
	'length': function(arr) {
	
		return arr.length; 
	
	},
	
	'set': function(arr, element, index) {
	
		arr[index] = element;
	
	},
	
	'get': function(arr, index) {
	
		return arr[index];
	
	},
	
	'remove': function(arr, index) {
	
		return arr.splice(index, 1);
	
	}

};

trump.EvaluatorFunctions.functions = {
	
	random: Math.random,
	array: trump.EvaluatorFunctions.arrayFunctions.array,
	add: trump.EvaluatorFunctions.arrayFunctions.add,
	length: trump.EvaluatorFunctions.arrayFunctions.length,
	'set': trump.EvaluatorFunctions.arrayFunctions.set,
	'get': trump.EvaluatorFunctions.arrayFunctions.get,
	remove: trump.EvaluatorFunctions.arrayFunctions.remove
	
};

trump.Evaluator = function(parseTree) {
	
	this.args = {};
	
	var self = this;

	this.parseNode = function(node) {
		
		if (node.type === 'number' || node.type === 'string' || node.type === 'boolean') {
		
			return node.value;
		
		} else if (trump.EvaluatorFunctions.operators[node.type]) {
		
			if (node.left && node.type !== 'I_DONT_THINK_I_AM_GOING_TO_LOSE_BUT_IF' && node.type !== 'BABY_CRYING_WHILE_I_AM_SPEAKING') {
			
				return trump.EvaluatorFunctions.operators[node.type](this.parseNode(node.left), this.parseNode(node.right));
			
			} else if (node.type === 'I_DONT_THINK_I_AM_GOING_TO_LOSE_BUT_IF') {
			
				if (trump.EvaluatorFunctions.operators[node.type](this.parseNode(node.left))) {
				
					for (var i = 0; i < node.right.length; i++) {
					
						this.parseNode(node.right[i]);
					
					}
				
				}
			
				
			} else if (node.type === 'BABY_CRYING_WHILE_I_AM_SPEAKING') {
			
				while (trump.EvaluatorFunctions.operators[node.type](this.parseNode(node.left))) {
				
					for (var i = 0; i < node.right.length; i++) {
					
						this.parseNode(node.right[i]);
					
					}
				
				}
			
			
			} else {
			
				var parsed = this.parseNode(node.right);
				return trump.EvaluatorFunctions.operators[node.type](parsed);
			
			}
			
		} else if (node.type === 'identifier') {
		
			var value = self.args.hasOwnProperty(node.value) ? self.args[node.value] : trump.EvaluatorFunctions.variables[node.value];
			
			if (typeof value === 'undefined') 
				throw new Error(node.value + ' is undefined');
		
			return value;
		
		} else if (node.type === 'assign') {
		
			trump.EvaluatorFunctions.variables[node.name] = this.parseNode(node.value);
		
		} else if (node.type === 'call') {
		
			for (var i = 0; i < node.args.length; i++) {
			
				node.args[i] = this.parseNode(node.args[i]);
				
			}
		
			var ret = trump.EvaluatorFunctions.functions[node.name].apply(null, node.args);
			
			return ret;
		
		}  else if (node.type === 'function') {
			
			trump.EvaluatorFunctions.functions[node.name] = function () {
				
				for (var i = 0; i < node.args.length; i++) {
					
					self.args[node.args[i].value] = arguments[i];
			
				}
				
				var ret;
				
				for (var i = 0; i < node.value.length - 1; i++) {
				
					if (node.value[i].type === 'THE_BEAUTY_OF_ME_IS_I_AM') {
					
						ret = self.parseNode(node.value[i].right)
						break;
					
					} else {
						
						var parse = node.value[i];
						
						self.parseNode(parse);
						
					}
				
				}
				
				self.args = {};
			
				return ret;
			
			};
		}
	};
	
	while (parseTree.length > 0) {
		
		var node = parseTree.shift();
		
		this.parseNode(node);;
	
	}

};

trump.init = function(input) {

	var lex = new trump.Lexer(input);

	var parseTree = new trump.Parser(lex);

	new trump.Evaluator(parseTree);

};
