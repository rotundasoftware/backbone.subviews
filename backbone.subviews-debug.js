/*
 * Backbone.Subviews, v0.6
 * Copyright (c)2013-2014 Rotunda Software, LLC.
 * Distributed under MIT license
 * http://github.com/rotundasoftware/backbone.subviews
 *
 * This debug version provides logging in the console to aid in debugging problems
 * when rendering deeply nested subview structures. console.group is used to log a
 * recursively generated tree structure. (Works best with Chrome.) To turn off logging
 * temporarily, just set the private "debugMode" variable to false.
*/
(function( Backbone, _ ) {
	var debugMode = true;

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
			this.removeSubviews();
			return overriddenViewMethods.remove.call( this );
		};

		// ****************** Additional public methods ****************** 

		view.removeSubviews = function() {
			// Removes all subviews and cleans up references in this.subviews.

			if( this.subviews ) {
				_.each( this.subviews, function( thisSubview ) {
					thisSubview.remove();
				} );

				delete this.subviews;
			}
		};

		// ****************** Private Utility Functions ****************** 

		function _prerender() {
			if( debugMode ) {
				console.group( "Rendering view" );
				console.log( this );
			}
	
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
			
		// Support subviewCreators as both objects and functions.
		this.subviewCreators = _.result( this, "subviewCreators" );
		
			this.$( "div[data-subview]" ).each( function() {
				var thisPlaceHolderDiv = $( this );
				var subviewName = thisPlaceHolderDiv.attr( "data-subview" );
				var subviewId = thisPlaceHolderDiv.attr( "data-subview-id" ) || subviewName;
				var newSubview;

				if( _.isUndefined( _this.subviews[ subviewId ] ) ) {
					// if the subview is not yet defined, then create it now using
					// the registered creator method in this.subviewCreators

					var subviewCreator = _this.subviewCreators[ subviewName ];
					if( _.isUndefined( subviewCreator ) ) throw new Error( "Can not find subview creator for subview named: " + subviewName );

					if( debugMode ) console.log( "Creating subview " + subviewName );
					newSubview = subviewCreator.apply( _this, [thisPlaceHolderDiv] );
					if( newSubview === null ) return;	// subview creators can return null to indicate that the subview should not be created

					_this.subviews[ subviewId ] = newSubview;
				}
				else {
					// if the subview is already defined, then use the existing subview instead
					// of creating a new one. This allows us to re-render a parent view without
					// loosing any dynamic state data on the existing subview objects.

					newSubview = _this.subviews[ subviewId ];
				}

				thisPlaceHolderDiv.replaceWith( newSubview.$el );
			} );

			// now that all subviews have been created, render them one at a time, in the
			// order they occur in the DOM.
			_.each( this.subviews, function( thisSubview, subviewName, subviewId ) {
				if( debugMode ) console.group( "Rendering subview " + subviewName + " " + subviewId );
				thisSubview.render();
				if( debugMode ) console.groupEnd();
			} );

			// call this.onSubviewsRendered after everything is done (hook for application defined logic)
			if( _.isFunction( this.onSubviewsRendered ) ) this.onSubviewsRendered.call( this );
			if( _.isFunction( this._onSubviewsRendered ) ) this._onSubviewsRendered.call( this ); // depreciated. backwards compatibility for versions < 0.6.

			if( debugMode ) console.groupEnd(); // "Rendering view"
		}
	};
} )( Backbone, _ );
