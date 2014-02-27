$( document ).ready( function() {

	var MySubviewClass = Backbone.View.extend( {

		initialize : function() {

			this.listenTo( Backbone, "message", function() {
				ok( false, "Subview listener was triggered" );
			} );

		},

		render : function() {
			this.$el.html( "rendered" );
		}

	} );

	module( "Subview creation",
		{
			teardown : function() {
				itemViewInstance.remove();
			}
		}
	);

	asyncTest( "Subview creator methods are called when parent is rendered", function() {

		var MyItemViewClass = Backbone.View.extend( {

			el : "#container",

			initialize : function() {
				Backbone.Subviews.add( this );
				stop();
				this.render();
			},

			render : function() {
				this.$el.html( "<div data-subview=\"mySubview\"></div>" );
				this.$el.append( "<div data-subview=\"mySecondSubview\"></div>" );
			},

			subviewCreators : {

				mySubview : function() {

					ok( true, "First subview creator method called" );

					start();
					return new MySubviewClass();
				},

				mySecondSubview : function() {

					ok( true, "Second subview creator method called" );

					start();
					return new MySubviewClass();
				}
			}

		} );

        expect(2);
		itemViewInstance = new MyItemViewClass();

	} );


	asyncTest( "Subviews are accessible through `subviews` hash",  function() {

		var MyItemViewClass = Backbone.View.extend( {

			el : "#container",

			initialize : function() {
				Backbone.Subviews.add( this );
				this.render();
			},

			subviewCreators : {
				mySubview : function() {
					return new MySubviewClass();
				}
			},

			render : function() {
				this.$el.html( "<div data-subview=\"mySubview\"></div>" );
			},

			onSubviewsRendered : function() {
				ok( this.subviews.mySubview.cid, "Subview is in subview hash" );
				start();
			}

		} );

        expect(1);
		itemViewInstance = new MyItemViewClass();

	} );

	asyncTest( "Subview Creators gets jquery wrapped placeholder as parameter",  function() {

		var MyItemViewClass = Backbone.View.extend( {

			el : "#container",

			initialize : function() {
				Backbone.Subviews.add( this );
				this.render();
			},

			render : function() {
				this.$el.html( "<div data-other=\"1\" data-subview=\"mySubview\"></div>" );
			},

			subviewCreators : {
				mySubview : function(placeholder) {
                    var data = placeholder.attr( "data-other" );
                    equal( data, 1, "Data attribute present" );
                    start();
					return new MySubviewClass();
				}
			},

		} );

        expect(1);
		itemViewInstance = new MyItemViewClass();

	} );

	asyncTest( "Subviews can be specified on on non-DIV elements", function() {
		var MyItemViewClass = Backbone.View.extend( {
			el : "#container",

			initialize : function() {
				Backbone.Subviews.add( this );
				this.render();
			},

			render : function() {
				this.$el.html( "<table><head><tr data-subview=\"mySubview\"></tr></thead></table>" );
			},

			subviewCreators : {
				mySubview : function() {
					ok( true, "Subview creator method called" );
					start();
					return new MySubviewClass();
				},
			}

		} );

        expect(1);
		itemViewInstance = new MyItemViewClass();

    });


	asyncTest( "Multiple subviews of same type can be hashed separately by id",  function() {

		var MyItemViewClass = Backbone.View.extend( {

			el : "#container",

			initialize : function() {
				Backbone.Subviews.add( this );
				this.render();
			},

			subviewCreators : {
				mySubview : function() {
					return new MySubviewClass();
				}
			},

			render : function() {
				this.$el.html( 
                    "<div data-subview=\"mySubview\" data-subview-id=\"1\"></div>" +
                    "<div data-subview=\"mySubview\" data-subview-id=\"2\"></div>" 
                );
			},

			onSubviewsRendered : function() {
                console.log(this.subviews);
				ok( this.subviews[1].cid , "First Subview is in subview hash" );
				ok( this.subviews[2].cid , "Second Subview is in subview hash" );
				start();
			}

		} );

        expect(2);
		itemViewInstance = new MyItemViewClass();

	} );


	module( "Subview rendering",
		{
			teardown : function() {
				itemViewInstance.remove();
			}
		}
	);

	asyncTest( "Subviews are rendered when parent is rendered", function() {

		var MyItemViewClass = Backbone.View.extend( {

			el : "#container",

			initialize : function() {
				Backbone.Subviews.add( this );
				this.render();
			},

			render : function() {
				this.$el.html( "<div data-subview=\"mySubview\"></div>" );
			},

			subviewCreators : {
				mySubview : function() {
					return new MySubviewClass();
				}
			},

			onSubviewsRendered : function() {
				start();
				ok( true, "onSubviewsRendered is called" );
				equal( $( "#container div" ).html(), "rendered", "subview is rendered" );
			}

		} );


        expect(4);

		stop();

		itemViewInstance = new MyItemViewClass();
		itemViewInstance.render();

	} );

	asyncTest( "All Subviews of same time are rendered when parent is rendered", function() {

		var MyItemViewClass = Backbone.View.extend( {

			el : "#container",

			initialize : function() {
				Backbone.Subviews.add( this );
				this.render();
			},

			render : function() {
				this.$el.html( 
                    "<div data-subview=\"mySubview\" data-subview-id=\"1\"></div>" +
                    "<div data-subview=\"mySubview\" data-subview-id=\"2\"></div>"
                );
			},

			subviewCreators : {
				mySubview : function() {
					return new MySubviewClass();
				}
			},

			onSubviewsRendered : function() {
                var divs;
				ok( true, "onSubviewsRendered is called" );
                $divs = $( "#container div" );
				equal( $divs.length, 2, "Both subviews rendered" );
                $divs.each(function (index, element) {
                    equal( $(element).html(), "rendered", "subview is rendered" );
                });
				start();
			}

		} );


        expect(8);

	stop();

		itemViewInstance = new MyItemViewClass();
		itemViewInstance.render();

	} );


	test( "Subviews replace placeholder divs", function() {

		var MyItemViewClass = Backbone.View.extend( {

			el : "#container",

			initialize : function() {
				Backbone.Subviews.add( this );
				this.render();
			},

			render : function() {
				this.$el.html( "<span><div data-subview=\"mySubview\"></div></span>" );
			},

			subviewCreators : {
				mySubview : function() {
					return new MySubviewClass();
				},
				mySecondSubview : function() {
					return new MySubviewClass();
				}
			}

		} );

        expect(1);
		itemViewInstance = new MyItemViewClass();

		var subViewInstance = itemViewInstance.subviews.mySubview;
		equal( subViewInstance.$el.parent().prop( "tagName" ), "SPAN", "Subview replaces corresponding placeholder" );

	} );

	asyncTest( "Subviews mantain state when parent view is rerended", function() {

		var renderCount = 0;

		var MyItemViewClass = Backbone.View.extend( {

			el : "#container",

			initialize : function() {
				Backbone.Subviews.add( this );
				this.render();
			},

			render : function() {
				this.$el.html( "<div data-subview=\"mySubview\"></div>" );
			},

			subviewCreators : {
				mySubview : function() {

					return new MySubviewClass();
				}
			},

			onSubviewsRendered : function() {
				renderCount++;
				if ( renderCount === 2 ) {
					ok( this.subviews.mySubview.state, "Subview state is perserved" );
				}
				start();
			}

		} );

        expect(1);

		stop();

		itemViewInstance = new MyItemViewClass();

		var Subview = itemViewInstance.subviews.mySubview;
		Subview.state = true;

		itemViewInstance.render();

	} );

	module( "Subview removal",
		{
			teardown : function() {
				itemViewInstance.remove();
			}
		}
	);

	asyncTest( "Calling remove on parent calls remove on it's subviews", function() {

		var MyItemViewClass = Backbone.View.extend( {

			el : "#container",

			initialize : function() {
				Backbone.Subviews.add( this );
				this.render();
			},

			render : function() {
				this.$el.html( "<div data-subview=\"mySubview\"></div>" );
			},

			subviewCreators : {
				mySubview : function() {

					return new MySubviewClass();
				}
			}

		} );

        expect(2);

		itemViewInstance = new MyItemViewClass();

		itemViewInstance.remove();

		equal( $( "#container" ).children().length, 0, "Subview DOM elements were removed" );

		Backbone.trigger( "message" );

		setTimeout( function() {
			start();
			ok( true, "The removed subview listeners were not triggered" );
		}, 100 );

	} );

	asyncTest( "Calling remove on parent calls remove on it's subviews", function() {

		var MyItemViewClass = Backbone.View.extend( {

			el : "#container",

			initialize : function() {
				Backbone.Subviews.add( this );
				this.render();
			},

			render : function() {
				this.$el.html( 
                    "<div data-subview=\"mySubview\" data-subview-id=\"1\"></div>" +
                    "<div data-subview=\"mySubview\" data-subview-id=\"2\"></div>" 
                );
			},

			subviewCreators : {
				mySubview : function() {
					return new MySubviewClass();
				}
			}

		} );

        expect(2);

		itemViewInstance = new MyItemViewClass();

		itemViewInstance.remove();

		equal( $( "#container" ).children().length, 0, "Subview DOM elements were removed" );

		Backbone.trigger( "message" );

		setTimeout( function() {
			start();
			ok( true, "The removed subview listeners were not triggered" );
		}, 100 );

	} );

} );
