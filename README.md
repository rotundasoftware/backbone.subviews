# Backbone.Subviews

A minimalist View mixin for creating and managing subviews (views within views) in your Backbone.js apps.

## Benefits

* Use a clear and consistent syntax to insert subviews in your templates.
* Organize all javascript logic for creating subviews in one declarative hash.
* Access subviews via the automatically populated `myView.subviews` hash.
* Can be mixed into any View class, including the base views in [Marionette](https://github.com/marionettejs/backbone.marionette), [LayoutManager](https://github.com/tbranyen/backbone.layoutmanager), etc.
* Works seamlessly with [Backbone.Courier](Backbone.Courier) to bubble subview events to parent views.
* When a parent view is re-rendered, existing subview objects are reused, not recreated (state is preserved).
* Automatically cleans up subviews by calling their `remove` method when parent view is removed.

## Usage

In your template for MyView, insert a subview named "mySubview" by inserting a `div` element with a `data-subview` attribute:

	<script type='text/template' id="MyItemViewTemplate">
		<h1>This is my item view template</h1>

		<div data-subview="mySubview"></div>
	</script>

Now in MyItemView.js:

```javascript
MyItemViewClass = Backbone.View.extend( {
	initialize : function() {
		// add backbone.subview functionality to this view
		Backbone.Subviews.add( this );
	},

	subviewCreators : {
		"mySubview" : function() {
			var options = {};

			// do any logic required to create initialization options, etc.,
			// then instantiate and return new subview object
			return new MySubviewClass( options );
		}
	},

	render : function( data ) {
		// render funciton is just like normal.. nothing new here
		var templateFunction = _.template( $( "#MyItemViewTemplate" ).html() );
		this.$el.html( templateFunction( data ) );

		// after we are done rendering, our subviews will automatically be rendered in order
	},

	_onSubviewsRendered : {
		// this method (if it exists) is called after subviews are finished rendering.
		// anytime after subviews are rendered, you can find the subviews in the `subviews` hash

		this.listenTo( this.subviews.mySubview, "highlighted", this._mySubview_onHighlighted );
	},

	...
} );
```

## Details

To insert a subview, just put `<div data-subview="[subviewName]"></div>` in the appropriate place in the parent view's template, where [subviewName] is the name of the subview. This "placeholder" `div` will be completely replaced with the subview's DOM element.

Then include an entry for the subview in the `subviewCreators` hash. The key of each entry is this hash is a subview's name, and the value is a function that should create and return the new subview object.

After the parent view's `render` function is finished, the subviews will automatically be created and rendered (in the order their placeholder `div`s appear inside the parent view). Once all subviews have been created and rendered, the parent view's `_onSubviewsRendered` method is called (if one exists), in which you can execute any additional rendering logic that depends on subviews having already been rendered.

When a parent view is re-rendered, its subviews will be re-rendered (their `render` function will be called), but the subview objects will remain the same - they will not be replaced with completely new view objects. As a result any state information that the subview objects contain will be preserved.

A parent view will automatically call `remove` on all its subviews when its `remove` method is called.

## Usage with Backbone.Courier

Backbone.Subviews fits together with [Backbone.Courier](https://github.com/rotundasoftware/backbone.courier), a library that enables you to bubble events up the view hierarchy. By default Backbone.Courier expects subviews to be stored in the `subview` hash, which is exactly where Backbone.Subviews puts them. So right away you can use subviews in Backbone.Courier's `onMessages` and `passMessages` hashes. For example:

```javascript
MyItemViewClass = Backbone.View.extend( {
	initialize : function() {
		// add backbone.subview and backbone.courier functionality to this view
		Backbone.Subviews.add( this );
		Backbone.Courier.add( this );
	},

	subviewCreators : {
		"mySubview" : function() {
			new MySubviewClass();
		}
	},

	// respond to the "highlighted" message from
	// "mySubview" by calling _mySubview_onHighlighted
	onMessages {
		"highlighted mySubview" : "_mySubview_onHighlighted"
	},

	...
} );
```
## Usage with template helpers

To further simplify the syntax for inserting subviews in your templates, add a global template helper to your template language of choice. For example, with [underscore.js](https://github.com/documentcloud/underscore) templates, the [underscore-template-helpers](https://github.com/rotundasoftware/underscore-template-helpers) mixin can be used to support this syntax:

	<script type='text/template' id="MyItemViewTemplate">
		<h1>This is my item view template</h1>

		<%= subview( "mySubview" ) %>
	</script>

Just add the [underscore-template-helpers](https://github.com/rotundasoftware/underscore-template-helpers) mixin to your project and then declare the `subview` global template helper:

```javascript
_.addTemplateHelpers( {
	subview : function( subviewName ) {
		return "<div data-subview='" + subviewName + "'></div>"
	}
} );
```