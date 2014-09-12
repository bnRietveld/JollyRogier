/*
 * Just a reminder of how Javascript handles certain things
 */


describe("Extensions", function() {

	describe("Javascript", function() {

		describe("logical evaluations", function() {

			it("js types", function() {
				expect('0').to.be.ok;
				expect(-6).to.be.ok;
				expect(6).to.be.ok;
				expect(Infinity).to.be.ok;
				expect([]).to.be.ok;
				expect({}).to.be.ok;
				expect(function(){}).to.be.ok;

				expect(0).to.not.be.ok;
				expect("").to.not.be.ok;
				expect(NaN).to.not.be.ok;
				expect(null).to.not.be.ok;
				expect(undefined).to.not.be.ok;
			});
		});

		describe("enumerations", function() {
			var superProto = Object.create(Object.prototype);
			var proto      = Object.create(superProto);
			var obj        = Object.create(proto);

			Object.defineProperty(obj, 'a1', {value: 'a1', enumerable: true});
			Object.defineProperty(obj, 'b1', {value: 'b1', enumerable: false});
			Object.defineProperty(proto, 'a2', {value: 'a2', enumerable: true});
			Object.defineProperty(proto, 'b2', {value: 'b2', enumerable: false});
			Object.defineProperty(superProto, 'a3', {value: 'a3', enumerable: true});
			Object.defineProperty(superProto, 'b3', {value: 'b3', enumerable: false});

			it("for in: retrieves all 'enumerable' properties over de prototype chain", function() {
				var props = [];

				for(var prop in obj)
				{
					props.push(prop);
				}

				expect(props).to.eql(['a1', 'a2', 'a3']);
			});

			it("for in + hasOwnProperty: retrieves all 'enumerable' properties off the object itself", function() {
				var props = [];

				for(var prop in obj)
				{
					if(obj.hasOwnProperty(prop)) props.push(prop);
				}

				expect(props).to.eql(['a1']);
			});

			it("Object.keys: retrieves all 'enumerable' properties off the object itself", function() {
				expect(Object.keys(obj)).to.eql(['a1']);
			});
			// NOTE this is the only way to get non enumarable properties
			it("Object.get: retrieves all properties of the object itself", function() {
				expect(Object.getOwnPropertyNames(obj)).to.eql(['a1', 'b1']);
			});
		});

		describe("bitwise operators", function() {
			var num     =  435.5674;
			var num_neg = -435.5674;

			it("flooring & integer conversion", function() {
				expect(Math.floor(num)).to.equal(435);
				expect(Math.floor(num_neg)).to.equal(-436);
				// these can be used for integer conversion
				expect(num | 0).to.equal(435);
				expect(num_neg | 0).to.equal(-435);
				expect(num << 0).to.equal(435);
				expect(num_neg << 0).to.equal(-435);
				expect(num >> 0).to.equal(435);
				expect(num_neg >> 0).to.equal(-435);
			});
		});

        describe("hasOwnProperty non-enumerable", function() {
            it("can be used on non-enumerable properties", function() {
                var obj = {
                    monkey: 'skull'
                };

                Object.defineProperty(obj, 'aap', {value: 'gorilla', enumerable: false});

                expect(obj.aap).to.equal('gorilla');
                expect(obj.hasOwnProperty('aap')).to.equal(true);
            });
        });

		describe("typeof", function() {

			it("javascript types", function() {
				expect(typeof 6).to.eql('number');
				expect(typeof NaN).to.eql('number');
				expect(typeof Infinity).to.eql('number');
				expect(typeof 's').to.eql('string');
				expect(typeof []).to.eql('object'); // counter intuitive
				expect(typeof {}).to.eql('object');
				expect(typeof function(){}).to.eql('function');
				expect(typeof null).to.eql('object'); // counter intuitive. Although only objects can have the value null...
				expect(typeof undefined).to.eql('undefined');
			});

			it("javascript types", function() {
				expect(new Number(6) instanceof Number).to.be.true;
				expect(6 instanceof Number).to.be.false;
				expect(new String('str') instanceof String).to.be.true;
				expect('str' instanceof String).to.be.false; // works only on objects
				expect([] instanceof Array).to.be.true; // counter intuitive
				expect({} instanceof Object).to.be.true;
				expect(function(){} instanceof Function).to.be.true;
				expect(null instanceof Object).to.be.false; // counter intuitive. Although only objects can have the value null...
				expect(undefined instanceof Object).to.be.false;
			});

			it("custom types: named constructor", function() {
				function Animal() {} // make sure the constructor is a named function
				var animal = new Animal();

				expect(typeof(animal)).to.eql('object');
			});

			it("custom types: UNnamed constructor", function() {
				var Cat = function () {};  // unnamed constructor
				var cat = new Cat();

				expect(typeof(cat)).to.eql('object');
			});
		});

		describe("instanceof", function() {

			it("javascript types", function() {
				expect(new Number(6) instanceof Number).to.be.true;
				expect(6 instanceof Number).to.be.false;
				expect(new String('str') instanceof String).to.be.true;
				expect('str' instanceof String).to.be.false; // works only on objects
				expect([] instanceof Array).to.be.true; // counter intuitive
				expect({} instanceof Object).to.be.true;
				expect(function(){} instanceof Function).to.be.true;
				expect(null instanceof Object).to.be.false; // counter intuitive. Although only objects can have the value null...
				expect(undefined instanceof Object).to.be.false;
			});

			it("custom types: named constructor", function() {
				function Animal() {} // make sure the constructor is a named function
				var animal = new Animal();

				expect(animal instanceof Animal).to.be.true;
			});

			it("custom types: UNnamed constructor", function() {
				var Cat = function () {};  // unnamed constructor
				var cat = new Cat();

				expect(cat instanceof Cat).to.be.true;
			});
		});

		describe("closures", function() {

			it("vars in closures continue to work as normal vars", function() {
				var setNummie;

				var clo = (function() {
				    var nummie = 555;

					var fnc = function() {
						return nummie;
					};

					setNummie = function(val) {
						nummie = val;
					};

					return fnc;
				})();

				expect(clo()).to.eql(555);

				setNummie(666);

				expect(clo()).to.eql(666);
			});
		});

		describe("getters/setters", function() {

			it("setters cannot return values", function() {
				var obj = {
					get x() {
						return this._x;
					},
					set x(val) {
						this._x = val;

						return this;
					}
				};

				expect((obj.x = 666)).to.equal(666);
			});
		});

		describe("array", function() {

			it("array traps", function() {
				var arr = new Array(3);

				arr.push(666);

				expect(arr.length).to.equal(4);
				expect(arr[3]).to.equal(666);
				expect(arr[0]).to.equal(undefined);
			});

			it("array subclassing: naive", function() {
				var Array2 = function($len_val, opt_values) {
					if(opt_values === undefined)
						this.length = $len_val;
					else
						this.push.apply(this, arguments);
				};

				Array2.prototype = Object.create(Array.prototype);
				Array2.prototype.constructor = Array2;
				Array2.prototype.testmethod = function() {
					return 'aap';
				};

				var list = new Array2(4, 6); // in this case we can specify

				expect(list.length).to.eql(2);

				list.push(123);
				list.push(456);

				expect(list.length).to.eql(4);
				expect(list[3]).to.eql(456);
				expect(list.testmethod()).to.eql('aap'); // custom method
				expect(list.indexOf(123)).to.eql(2); // native method
				expect(list instanceof Array).to.be.true;
				expect(list instanceof Array2).to.be.true;


				var list2 = new Array2(4); // in this case we can specify

				expect(list2.length).to.eql(4);

				list2.push(123);
				list2.push(456);

				expect(list2.length).to.eql(6);
				expect(list2[5]).to.eql(456);
				expect(list2.testmethod()).to.eql('aap'); // custom method
				expect(list2.indexOf(456)).to.eql(5); // native method
				expect(list2 instanceof Array).to.be.true;
				expect(list2 instanceof Array2).to.be.true;
			});

			it("array subclassing: calling constructor does not work", function() {
				var Array2 = function() {
					Array.apply(this, arguments);
				};

				Array2.prototype = Object.create(Array.prototype);
				Array2.prototype.constructor = Array2;
				Array2.prototype.testmethod = function() {
					return 'aap';
				};

				var list = new Array2(4); // this does not work!!

				expect(list.length).to.eql(0); // this should be 4

				list.push(123);
				list.push(456);

				expect(list.length).to.eql(2);
				expect(list[1]).to.eql(456);
				expect(list.testmethod()).to.eql('aap');
				expect(list.indexOf(123)).to.eql(0);
			});
		});

		describe("Math", function() {
			var rad2Deg = function() {
				var radianToDegreesFactor = 180/Math.PI;

				return function (radians) {
					return radians*radianToDegreesFactor;
				};
			}();


			it("atan2", function() {
				expect(rad2Deg(Math.atan2( 0, 1))).to.equal(0);  // huh? I would expect 90
				expect(rad2Deg(Math.atan2( 1, 1))).to.equal(45);
				expect(rad2Deg(Math.atan2( 1, 0))).to.equal(90);
				expect(rad2Deg(Math.atan2( 1,-1))).to.equal(135);
				expect(rad2Deg(Math.atan2( 0,-1))).to.equal(180);
				expect(rad2Deg(Math.atan2(-1,-1))).to.equal(-135);
				expect(rad2Deg(Math.atan2(-1, 0))).to.equal(-90);
				expect(rad2Deg(Math.atan2(-1, 1))).to.equal(-45);
			});
		});
	});
});