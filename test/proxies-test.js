(function( $, QUnit ) {
	module( "jQuery.LazyProxy", {
		setup: function() {
			jQuery.LazyProxy.init();
		}
	});

	test( "LazyProxy properties should be functions", function() {
		var proxy = new $.LazyProxy();

		for( prop in proxy ){
			// TODO fragile
			if( proxy.hasOwnProperty(prop) && prop !== "accumulatedCalls" ) {
				ok( typeof proxy[prop] === "function" );
			}
		}
	});

	test( "arguments are forwarded properly to functions created with jQuery.functor", function() {
		var first, second;

		$.fn.bar = jQuery.functor(function( elem, arg1, arg2 ){
			first = arg1;
			second = arg2;
			return elem;
		});

		$("div").bar("first", "second").force();

		deepEqual(first, "first");
		deepEqual(second, "second");
	});

	test( "non lazy function following a lazy function forces the execution of composed morphisms", function() {
		var fooRan = false, $divs;

		$.fn.foo = jQuery.functor(function( elem ){
			fooRan = true;
			return elem;
		});

		$divs = $( "div" );
		$divs.foo();

		ok( !fooRan, "foo has not yet run" );

		$divs.addClass( "none" );

		ok( fooRan, "foo has run" );
	});

	test( "two lazy functions get fused", function() {
		var elementOrder = [], $divs, pushOrder;

		pushOrder = function( elem ){
			elementOrder.push(elem);
			return elem;
		};

		$.fn.foo = jQuery.functor(pushOrder);
		$.fn.bar = jQuery.functor(pushOrder);

		$divs = $( "div" ).foo().bar().force();

		// the first element should be pushed on the stack twice
		deepEqual( [$divs[0], $divs[0]], elementOrder.slice(0, 2) );
	});

	test( "two non lazy functions don't get fused", function() {
		var elementOrder = [], $divs, pushOrder;

		pushOrder = function( elem ){
			elementOrder.push(elem);
			return elem;
		};

		$.fn.foo = function() {
			return this.map(pushOrder);
		};

		$.fn.bar = function() {
			return this.map(pushOrder);
		};

		$divs = $( "div" ).foo().bar().force();

		deepEqual( [$divs[0], $divs[1]], elementOrder.slice(0, 2) );
	});

	test( "lazy functions actually alter the dom elements", function() {
		$.fn.bar = jQuery.functor(function( elem ) {
			elem.setAttribute("data-foo", "bar");
		});

		$( "div" ).bar().force();

		$( "div" ).each(function(i, elem) {
			deepEqual( elem.getAttribute("data-foo"), "bar");
		});
	});

	test( "lazy functions reset composed after force", function() {
		$.fn.bar = jQuery.functor(function( elem ) {
			elem.setAttribute("data-foo", "bar");
		});

		var divs = $( "div" );
		equal( divs.composed, undefined );
		divs.bar();
		ok( divs.composed, "composed is not the default of undefined" );
		divs.force();
		equal( divs.composed, undefined );
	});

	module( "jQuery.WarningProxy", {
		setup: function() {
			$.fn.foo = jQuery.functor(function( elem ) {
				return elem;
			});

			$.fn.bar = jQuery.functor(function( elem ) {
				return elem;
			});

			$.fn.baz = function() { return this; };

			jQuery.WarningProxy.init();
		}
	});

	test( "should increment its count on method invocation", function() {
		var $divs = $( "div" );

		deepEqual( $divs._proxyState.chainCount, 0, "chainCount should init to 0");

		$divs.bar().baz();

		deepEqual( $divs._proxyState.chainCount, 1, "chainCount should increment on $.fn method invocation");
	});

	test( "should log a message with all the method names", function() {
		var $divs = $( "div" ), msg;

		$divs._proxy.log = function( val ) {
			msg = val;
		};

		// TODO make # of chained methods dependent on _proxy.warnThreshold
		$divs.foo().bar().baz();

		deepEqual( ["foo", "bar"].toString(), msg );
	});

	test( "default jQuery.fn methods should behave as normal", function() {
		var $divs = $( "div" );

		$divs.addClass( "normal-method-test" );

		$divs.each(function(i, elem) {
		  ok( elem.getAttribute( "class" ).indexOf( "normal-method-test" ) >= 0 );
		});
	});
})( jQuery, QUnit );