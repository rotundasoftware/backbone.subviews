/*!
 * Backbone.Subviews, v0.5
 * Copyright (c)2013 Rotunda Software, LLC.
 * Distributed under MIT license
 * http://github.com/rotundasoftware/backbone.subviews
*/
(function( Backbone, _ ) {
	var debugMode = false;

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
			if( this.subviews )
			{
				_.each( this.subviews, function( thisSubview ) {
					thisSubview.remove();
				} );

				this.subviews = {};
			}

			return overriddenViewMethods.remove.call( this );
		};

		// ****************** Private Utility Functions ****************** 

		function _prerender() {
			if( debugMode )
			{
				console.group( "Rendering view" );
				console.log( this );
			}
	
			if( ! this.subviews ) this.subviews = {};

			_.each( this.subviews, function( thisSubview, subviewName ) {
				thisSubview.$el.detach();
			} );
		}

		function _postrender() {
			var _this = this;
			
			this.$( "div[data-subview]" ).each( function() {
				var thisPlaceHolderDiv = $( this );
				var subviewName = thisPlaceHolderDiv.attr( "data-subview" );
				var newSubview;

				// if the subview is already defined, then use the existing subview instead
				// of creating a new one. This allows us to re-render a parent view without
				// loosing any dynamic state data on the existing subview objects.
				if( _.isUndefined( _this.subviews[ subviewName ] ) )
				{
					var subviewCreator = _this.subviewCreators[ subviewName ];

					if( _.isUndefined( subviewCreator ) ) throw "Can not find subview creator for subview named: " + subviewName;

					if( debugMode ) console.log( "Creating subview " + subviewName );
					newSubview = subviewCreator.apply( _this );

					_this.subviews[ subviewName ] = newSubview;
				}
				else newSubview = _this.subviews[ subviewName ];

				thisPlaceHolderDiv.replaceWith( newSubview.$el );
			} );

			_.each( this.subviews, function( thisSubview, subviewName ) {
				if( debugMode ) console.group( "Rendering subview " + subviewName );
				thisSubview.render();
				if( debugMode ) console.groupEnd();
			} );

			if( _.isFunction( this._onSubviewsRendered ) ) this._onSubviewsRendered.call( this );

			if( debugMode ) console.groupEnd(); // "Rendering view"
		}
	};
} )( Backbone, _ );