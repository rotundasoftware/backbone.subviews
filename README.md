# Backbone.Subviews

A minimalist view mixin for creating and managing subviews in your [Backbone.js](http://backbonejs.org/) applications. 

This plugin is designed to manage a fixed number of subviews. See [Backbone.CollectionView](http://rotundasoftware.github.io/backbone.collectionView/) for a plugin to manage a dynamic number of subviews (i.e. an array of subviews, or a "collection" of subviews). 

## Benefits

* Provides a clean, consistent syntax for subviews in templates: `<div data-subview="mySubview"></div>`
* Automatically places references to subviews in a hash keyed by name: `this.subviews.mySubview`
* Maintains subview objects when a parent view is re-rendered, preserving subview state.
* Automatically cleans up (i.e. removes) subviews when a parent view is removed.
* Can be mixed into any view class.

## Example

In a view template, insert a subview "mySubview" using a placeholder `div` with a `data-subview` attribute:

	<script type='text/template' id="MyItemViewTemplate">
		<h1>This is my item view template</h1>

		<div data-subview="mySubview"></div>
	</script>

Now in MyItemView.js:

```javascript
MyItemViewClass = Backbone.View.extend( {
	initialize : function() {
		// Add backbone.subview functionality to this view.
		Backbone.Subviews.add( this );
	},

	subviewCreators : {
		"mySubview" : function() {
			var options = {};

			// Do any logic required to create initialization options,
			// then instantiate and return the new subview object.
			return new MySubviewClass( options );
		}
	},

	render : function( data ) {
		// `render` funciton is just like normal.. nothing new here.
		var templateFunction = _.template( $( "#MyItemViewTemplate" ).html() );
		this.$el.html( templateFunction( data ) );

		// after we are done rendering, our subviews will automatically be rendered in order
	},

	onSubviewsRendered : function() {
		// This method (if it exists) is called after subviews are finished rendering.
		// Anytime after subviews are rendered, you can find the subviews in the `subviews` hash

		this.listenTo( this.subviews.mySubview, "highlighted", this._mySubview_onHighlighted );
	},

	...
} );
```

## Usage

To insert a subview, put a placeholder element like this `<div data-subview="[subviewName]"></div>` in the appropriate place in the parent view's template. This placeholder `div` will be completely replaced with the subview's DOM element.

Then include an entry for the subview in the `subviewCreators` hash. The key of each entry in this hash is a subview's name, and the value is a function that should create and return the new subview object. The subview creator function gets the placeholder element (jQuery wrapped) as a paraemter.

After the parent view's `render` function is finished, the subviews will automatically be created and rendered (in the order their placeholder `div`s appear inside the parent view). Once all subviews have been created and rendered, the parent view's `onSubviewsRendered` method is called (if one exists).

When a parent view is re-rendered, its subviews will be re-rendered (i.e. their `render` function will be called). By default the original subview objects will by reused in order to preserve subview state. To force the subview objects to be recreated instead of reused, call `parentView.removeSubviews()` before re-rendering the parent.

A parent view will automatically remove all its subviews when its `remove` method is called.

To have more than one subview created from the same subview creator, set `data-subview-id` on each placeholder to a distinct values. This allows your templates to generate multiple placeholders. E.g:

``` handlebars
{{each list}}
<div data-subview="itemView" data-subview-id="this.id"></div>
{{/each }}
```

The value of `data-subview` (along with any other attributes on the placeholder) is available to the subview creator function via the placeholder parameter. E.g.:

``` javascript
        subviewCreators: {
            "itemView": function (placeholder) {
                var itemId = placeholder.attr('data-subview-id'),
                    item = this.collection.get(itemId);
                return new ItemView({
                    model: item,
                });
            },
        }
``` 

## Template Helpers

To further simplify the syntax for inserting subviews in your templates, add a global template helper to your template language of choice. For example, with [underscore.js](https://github.com/documentcloud/underscore) templates, the [underscore-template-helpers](https://github.com/rotundasoftware/underscore-template-helpers) mixin can be used to support this syntax:

	<script type='text/template' id="MyItemViewTemplate">
		<h1>This is my item view template</h1>

		<%= subview( "mySubview" ) %>
	</script>

## Change log

#### v0.6 (1/10/14)
* Renamed `_onSubviewsRendered` to `onSubviewsRendered`. (Old name depreciated but still works for now.)
* Added `view.removeSubviews()` method.

