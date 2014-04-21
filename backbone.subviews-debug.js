/*
 * Backbone.Subviews, v0.7
 * Copyright (c)2013-2014 Rotunda Software, LLC.
 * Distributed under MIT license
 * http://github.com/rotundasoftware/backbone.subviews
 *
 * This debug version provides logging in the console to aid in debugging problems
 * when rendering deeply nested subview structures. console.group is used to log a
 * recursively generated tree structure. (Works best with Chrome.) To turn off logging
 * temporarily, just set the private "debugMode" variable to false.
*/

( function( root, factory ) {
	// Deal with various environments.
	// Backbone.Subviews requires backbone, underscore, and possibly jquery.
	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( [ 'underscore', 'backbone', 'jquery' ], factory );
	} else if ( typeof exports !== 'undefined' ) {
		// Node/CommonJS
		module.exports = factory( require('underscore' ), require( 'backbone' ), require( 'backbone' ).$ );
	} else {
		// Browser globals
		factory( root._, root.Backbone, ( root.jQuery || root.Zepto || root.$ ) );
	}

}( this, function( _, Backbone, $ ) {
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

		// ****************** Additional private methods ****************** 

		view._createSubview = function( subviewName, placeHolderDiv ) {
			// find the registered creator method in this.subviewCreators.
			var subviewCreator = this.subviewCreators[ subviewName ];
			if( _.isUndefined( subviewCreator ) ) throw new Error( "Can not find subview creator for subview named: " + subviewName );

			return subviewCreator.apply( this );
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
			
			this.$( "[data-subview]" ).each( function() {
				var thisPlaceHolderDiv = $( this );
				var subviewName = thisPlaceHolderDiv.attr( "data-subview" );
				var newSubview;

				if( _.isUndefined( _this.subviews[ subviewName ] ) ) {
					newSubview = _this._createSubview( subviewName, thisPlaceHolderDiv );
					if( newSubview === null ) return;  // subview creators can return null to indicate that the subview should not be created
					_this.subviews[ subviewName ] = newSubview;
				}
				else {
					// If the subview is already defined, then use the existing subview instead
					// of creating a new one. This allows us to re-render a parent view without
					// loosing any dynamic state data on the existing subview objects. To force
					// re-initialization of subviews, call view.removeSubviews before re-rendering.

					newSubview = _this.subviews[ subviewName ];
				}

				thisPlaceHolderDiv.replaceWith( newSubview.$el );
			} );

			// now that all subviews have been created, render them one at a time, in the
			// order they occur in the DOM.
			_.each( this.subviews, function( thisSubview, subviewName ) {
				if( debugMode ) console.group( "Rendering subview " + subviewName );
				thisSubview.render();
				if( debugMode ) console.groupEnd();
			} );

			// call this.onSubviewsRendered after everything is done (hook for application defined logic)
			if( _.isFunction( this.onSubviewsRendered ) ) this.onSubviewsRendered.call( this );
			if( _.isFunction( this._onSubviewsRendered ) ) this._onSubviewsRendered.call( this ); // depreciated. backwards compatibility for versions < 0.6.

			if( debugMode ) console.groupEnd(); // "Rendering view"
		}
	};

	return Backbone.Subviews;
} ) );