/*
 * Backbone.Subviews, v1.1.0
 * Copyright (c)2013-2017 Rotunda Software, LLC.
 * Distributed under MIT license
 * http://github.com/rotundasoftware/backbone.subviews
*/
( function( root, factory ) {
	// UMD wrapper
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
	Backbone.Subviews = {};

	Backbone.Subviews.add = function( view ) {
		var overriddenViewMethods = {
			render : view.render,
			remove : view.remove
		};

		// ****************** Overridden Backbone.View methods ****************** 

		view.render = function( options ) {
			var args = Array.prototype.slice.call( arguments );

			_prerender.call( this );
			var returnValue = overriddenViewMethods.render.apply( this, args );
			_postrender.call( this, args );

			return returnValue;
		};

		view.remove = function() {
			this.removeSubviews();
			return overriddenViewMethods.remove.call( this );
		};

		// ****************** Additional public methods ****************** 

		view.removeSubviews = function() {
			// Removes all subviews and cleans up references in this.subviews.
			var _this = this;

			if( this.subviews ) {
				_.each( this.subviews, function( thisSubview, thisSubviewName ) {
					thisSubview.remove();
					delete _this.subviews[ thisSubviewName ];
				} );
			}
		};

		// ****************** Additional private methods ****************** 

		view._createSubview = function( subviewName, placeHolderDiv ) {
			// Return a new subview instance given a subview name and its placeHolderDiv.
			// Implemented as instance method so that this behavior may be customized / overridden.
			var subviewCreator = this.subviewCreators[ subviewName ];
			if( _.isUndefined( subviewCreator ) ) throw new Error( "Can not find subview creator for subview named: " + subviewName );

			return subviewCreator.apply( this );
		};
	};

	// ****************** Private utility functions ****************** 

	function _prerender() {
		if( ! this.subviews ) this.subviews = {};

		// Detach each of our subviews that we have already created during previous
		// renders from the DOM, so that they do not loose their DOM events when
		// we re-render the contents of this view's DOM element.
		_.each( this.subviews, function( thisSubview ) {
			thisSubview.$el.detach();
		} );
	}

	function _postrender( renderArguments ) {
		var _this = this;
		this.subviewCreators = this.subviewCreators || {};

		// Support subviewCreators as both objects and functions.
		if( _.isFunction( this.subviewCreators ) ) this.subviewCreators = this.subviewCreators();
		
		this.$( "[data-subview]" ).each( function() {
			var thisPlaceHolderDiv = $( this );
			var subviewName = thisPlaceHolderDiv.attr( "data-subview" );
			var newSubview;

			if( _.isUndefined( _this.subviews[ subviewName ] ) ) {
				newSubview = _this._createSubview( subviewName, thisPlaceHolderDiv );
				
				if( newSubview === null ) {
					// subview creators can return null to indicate that the subview should not be created
					thisPlaceHolderDiv.remove();
					return; 
				}

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

		if( _.isFunction( this.onSubviewsCreated ) ) this.onSubviewsCreated.call( this );
		if( _.isFunction( this._onSubviewsCreated ) ) this._onSubviewsCreated.call( this );

		// Now that all subviews have been created, render them one at a time, in the
		// order they occur in the DOM.
		_.each( this.subviews, function( thisSubview ) {
			thisSubview.render.apply( thisSubview, renderArguments );
		} );

		// Call this.onSubviewsRendered after everything is done (hook for application defined logic)
		if( _.isFunction( this.onSubviewsRendered ) ) this.onSubviewsRendered.call( this );
		if( _.isFunction( this._onSubviewsRendered ) ) this._onSubviewsRendered.call( this );
	}

	return Backbone.Subviews;
} ) );
