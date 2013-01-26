# Backbone.Subviews

A minimalist view mixin for creating and managing subviews (views within views) in your Backbone.js apps.

## Benefits

* Use a clear and consistent syntax to insert subviews in your templates.
* Organize all javascript logic for creating subviews in one declarative hash.
* Access subviews via the automatically populated `myView.subviews` hash.
* Can be mixed in to any View class, including the base views in [Marionette](https://github.com/marionettejs/backbone.marionette), [LayoutManager](https://github.com/tbranyen/backbone.layoutmanager), etc.
* Works seamlessly with [Backbone.Courier](Backbone.Courier) to bubble subview events.
* When parent view is re-rendered, existing subview objects are reused (preserving state).
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
			// do any logic required to create initialization options
			new MySubviewClass( options );
		}
	},

	render : function( data ) {
		// render funciton is just like normal.. nothing new here
		var templateFunction = _.template( $( "#MyItemViewTemplate" ).html() );
		this.$el.html( templateFunction( data ) );

		// after we are done rendering, our subviews will automatically be rendered in order
	},

	_onSubviewsRendered : {
		// this function (if it exists) is called after subviews are finished rendering.
		// anytime after subviews are rendered, you can find the subviews in the `subviews` hash

		this.listenTo( this.subviews.mySubview, "highlighted", this._mySubview_onHighlighted );
	},

	...
} );
```

## Details

To insert a subview into a view, simply include `<div data-subview="[subviewName]"></div>` in the view's template, where [subviewName] is the name of the subview. This "placeholder" `div` will be completely replaced with the subview's element.

Then include an entry for the subview in the `subviewCreators` hash. The key of each entry is this hash is a subview's name, and the value is a function that should create and return the subview instance.

Subviews are not rendered until after the parent view has completely finished rendering. The sequence of events is as follows:

	1. The parent view's `render` function is called
	2. [subviews are automatically created and rendered in order]
	3. The `_onSubviewsRendered` function (if one exists) is called on the parent view

When a parent view is re-rendered, its subviews will be re-rendered (their `render` function will be called), as opposed to being replaced with completely new view objects. As a result any state information that the subview objects contain will be preserved.

A parent view will automatically call `remove` on all its subviews when its `remove` method is called.

## Usage with Backbone.Courier

Backbone.Subviews fits together with [Backbone.Courier](https://github.com/dgbeck/backbone.courier), a library that enables you to bubble events up the view hierarchy. Backbone.Courier by default expects subviews to be stored in the `subview` hash, which is exactly where Backbone.Subviews puts them. Thus without any configuration required you can your subviews in Backbone.Courier's `onMessages` and `passMessages` hashes. For example:

```javascript
MyItemViewClass = Backbone.View.extend( {
	initialize : function() {
		// add backbone.subview functionality to this view
		Backbone.Subviews.add( this );

		// and backbone.courier functionality to this view
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

To further simplify the syntax for inserting subviews in your templates, add a global template helper to your template language of choice. For example, with [Underscore](https://github.com/documentcloud/underscore) templates, the [underscore-template-helpers](https://github.com/dgbeck/underscore-template-helpers) mixin can be used to support this syntax:

	<script type='text/template' id="MyItemViewTemplate">
		<h1>This is my item view template</h1>

		<%= subview( "mySubview" ) %>
	</script>

Just add the `subview` global template helper:

```javascript
_.addTemplateHelpers( {
	subview : function( subviewName ) {
		return "<div data-subview='" + subviewName + "'></div>"
	}
} );
```

You can turn on debugMode be setting the variable of the same name to true, which will help in debugging errors in rendering code by leaving breadcrumbs in the console log.
