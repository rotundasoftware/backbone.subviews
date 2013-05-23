/*
 * Backbone.Subviews, v0.5.1
 * Copyright (c)2013 Rotunda Software, LLC.
 * Distributed under MIT license
 * http://github.com/rotundasoftware/backbone.subviews
*/
(function( Backbone, _ ) {
	Backbone.Subviews = {};

	Backbone.Subviews.add = function( view ) {
		var overriddenViewMethods = {
			render : view.render,
			remove : view.remove
		};

		// ****************** Overridden Backbone.View functions ****************** 

		view.render = function() {
			var args = Array.prototype.slice.call( arguments );

			_prerender.call( this );
			var returnValue = overriddenViewMethods.render.apply( this, args );
			_postrender.call( this );

			return returnValue;
		};

		view.remove = function() {
			if( this.subviews ) {
				_.each( this.subviews, function( thisSubview ) {
					thisSubview.remove();
				} );

				delete this.subviews;
			}

			return overriddenViewMethods.remove.call( this );
		};

		// ****************** Private Utility Functions ****************** 

		function _prerender() {
			if( ! this.subviews ) this.subviews = {};

			// detach each of our subviews that we have already created during previous
			// renders from the DOM, so that they do not loose their DOM events when
			// we re-render the contents of this view's DOM element.
			_.each( this.subviews, function( thisSubview ) {
				thisSubview.$el.detach();
			} );
		}

		function _postrender() {
			var _this = this;
			this.subviewCreators = this.subviewCreators || {};
			
			this.$( "div[data-subview]" ).each( function() {
				var thisPlaceHolderDiv = $( this );
				var subviewName = thisPlaceHolderDiv.attr( "data-subview" );
				var newSubview;

				if( _.isUndefined( _this.subviews[ subviewName ] ) ) {
					// if the subview is not yet defined, then create it now using
					// the registered creator method in this.subviewCreators

					var subviewCreator = _this.subviewCreators[ subviewName ];
					if( _.isUndefined( subviewCreator ) ) throw new Error( "Can not find subview creator for subview named: " + subviewName );

					newSubview = subviewCreator.apply( _this );
					_this.subviews[ subviewName ] = newSubview;
				}
				else {
					// if the subview is already defined, then use the existing subview instead
					// of creating a new one. This allows us to re-render a parent view without
					// loosing any dynamic state data on the existing subview objects.

					newSubview = _this.subviews[ subviewName ];
				}

				thisPlaceHolderDiv.replaceWith( newSubview.$el );
			} );

			// now that all subviews have been created, render them one at a time, in the
			// order they occur in the DOM.
			_.each( this.subviews, function( thisSubview ) {
				thisSubview.render();
			} );

			// call this._onSubviewsRendered after everything is done (hook for application defined logic)
			if( _.isFunction( this._onSubviewsRendered ) ) this._onSubviewsRendered.call( this );
		}
	};
} )( Backbone, _ );