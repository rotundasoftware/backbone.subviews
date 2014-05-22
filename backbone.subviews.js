/*
 * Backbone.Subviews, v0.7
 * Copyright (c)2013-2014 Rotunda Software, LLC.
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

	function _postrender() {
		var _this = this;
		this.subviewCreators = this.subviewCreators || {};

		// Support subviewCreators as both objects and functions.
		this.subviewCreators = _.result( this, "subviewCreators" );

		this.$( "[data-subview]" ).each( function() {
			var thisPlaceHolderDiv = $( this );
			var subviewName = thisPlaceHolderDiv.attr( "data-subview" );
			var newSubview;

			if( _.isUndefined( _this.subviews[ subviewName ] ) ) {
				// if the subview is not yet defined, then create it now using
				// the registered creator method in this.subviewCreators.

				var subviewCreator = _this.subviewCreators[ subviewName ];
				if( _.isUndefined( subviewCreator ) ) throw new Error( "Can not find subview creator for subview named: " + subviewName );

				// If 'id' and 'class' is defined on placeholder pass to creator function
				var options = {};
				var placeHolderId = thisPlaceHolderDiv.attr("id");
				var placeHolderClassName = thisPlaceHolderDiv.attr("class");
				if( _.isString( placeHolderId )) options.id = placeHolderId;
				if( _.isString( placeHolderClassName )) options.className = placeHolderClassName;

				newSubview = subviewCreator.call( _this, options );
				if( newSubview === null ) return;	// subview creators can return null to indicate that the subview should not be created

				_this.subviews[ subviewName ] = newSubview;
			}
			else {
				// If the subview is already defined, then use the existing subview instead
				// of creating a new one. This allows us to re-render a parent view without
				// loosing any dynamic state data on the existing subview objects. To force
				// re-initialization of subviews, call view._removeSubviews before re-rendering.

				newSubview = _this.subviews[ subviewName ];
			}

			thisPlaceHolderDiv.replaceWith( newSubview.$el );
		} );

		// Now that all subviews have been created, render them one at a time, in the
		// order they occur in the DOM.
		_.each( this.subviews, function( thisSubview ) {
			thisSubview.render();
		} );

		// Call this.onSubviewsRendered after everything is done (hook for application defined logic)
		if( _.isFunction( this.onSubviewsRendered ) ) this.onSubviewsRendered.call( this );
		if( _.isFunction( this._onSubviewsRendered ) ) this._onSubviewsRendered.call( this ); // depreciated. backwards compatibility for versions < 0.6.
	}

	return Backbone.Subviews;
} ) );