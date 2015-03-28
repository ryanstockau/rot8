/*

Rot8 jQuery Plugin by Ryan Stock

www.github.com/ryanstockau/rot8

www.ryanstock.com.au

*/

 
 ;(function ( $, window, document, undefined ) {
	 
	// Plugin Constructor
	
  	var Rot8 = function( elem, options ){
		var self = this;
		self.elem = elem;
		self.$elem = $(elem);
		self.options = options;
		
		// Allow options to be presented via HTML data-plugin-options attribute, eg:
		// <div class='item' data-plugin-options='{"message":"Goodbye World!"}'></div>
		self.metadata = self.$elem.data( 'plugin-options' );
    };
	
	
	// Helpers
	
	var getMaxOuterHeight = function( $of ) {
		return Math.max.apply(null, $of.map(function() {
			return $(this).outerHeight();
		}).get());
	}
	
	var getMaxOuterWidth = function( $of ) {
		return Math.max.apply(null, $of.map(function() {
			return $(this).outerWidth();
		}).get());
	}
	
	var getMaxHeight = function( $of ) {
		return Math.max.apply(null, $of.map(function() {
			return $(this).height();
		}).get());
	}
	
	var getMaxWidth = function( $of ) {
		return Math.max.apply(null, $of.map(function() {
			return $(this).width();
		}).get());
	}
	
	var getMaxRadiusFromWidthAndHeight = function( width, height ) {
		return Math.sqrt( width * width + height * height );
	}
	
	
	// Plugin Prototype
	
	Rot8.prototype = {
		
		defaults: {
			containerClass : '.rot8-container',
			contentClass : '.rot8-content',
			panelClass : '.rot8-panel',
			direction : 'cw',
			resetDelay : 500,
			duration : 2000,
			delay : 0,
			segments : 2,
			responsiveHeight : true,
			heightRetainerHtml : '<div class="rot8-height-retainer"></div>'		
		},
		
		init: function() {
			
			var self = this;
			
			// Add a data reference to this object
			self.$elem.data('rot8', self);
			
			// Set combined config
			self.config = $.extend({}, self.defaults, self.options, self.metadata);
			
			// Todo: needed?
			self.panel_length = 360 / self.config.segments;
			
			// The $container is the element that rotates
			self.$container = self.$elem.find(self.config.containerClass);			
			//	self.$content = self.$container.find(self.config.contentClass);	
			
			// Create a height retainer to ensure the $container doesn't collapse
			self.$height_retainer = $(self.config.heightRetainerHtml);
			self.$elem.prepend( self.$height_retainer );
			
			// 
			self._refreshElements();			
			
			// Set initial primary/secondary panels based on their positions in the DOM
			self._setPrimaryPanel( self.$panels.eq(0) );
			self._setSecondaryPanel( self.$panels.eq(1) );
			
			// Extend $container out to ensure its edges don't get shown when we rotate
			self._resetContainerDimensions();
			
			// When we resize the screen, reset dimensions
			self._registerResizeHandler();			
			
			return self;
		},	
		
		
		// Main API
		
		// Add a panel to the $container
		addPanel : function( content, position ) {
			var self = this;
			self.$container.append(content);
			self._refreshElements();
			self._resetContainerDimensions();
		},
		
		// Rotate to a given panel element
		animateToPanel : function( $panel, options ) {
			var self = this;		
			self._setSecondaryPanel( $panel );
			return self._animateToSecondary( options );	
		},
		
		// Rotate the $container and display the next panel
		next : function( options ) {
			var self = this;
			var $next = self.$primary_panel.next();
			if ( ! $next.length ) {
				$next = self.$panels.not(self.$primary_panel).first();
			}
			if ( ! $next.length ) {
				return false;
			}
			return self.animateToPanel( $next );
		},		
		
		getContainer : function() {
			var self = this;
			return self.$container;
		},
		
		getContent : function() {
			var self = this;
			return self.$content;
		},
		
		
		// Methods
		
		// Rotate the $container 180° to display the $secondary_panel where the $primary_panel was.
		_animateToSecondary : function( options ) {
			var self = this;
			var config = $.extend(
				{},
				self.config,
				options
			);
			var animation_config = {
				duration: config.duration
			};
			var rotation_config = {
				direction: config.direction
			};
			
			var $animation_target = self.$container;
			var $parent = self.$elem;
			
			if ( typeof $animation_target.animateRotation !== 'function' ) {
				return $.error('animateRotation extension has not been loaded');	
			}
			
			// because secondary is always next after current/primary, just animate one panel length
			var angle = self.panel_length;			
			
			var $deferred = $.Deferred();
			var runAnimation = function() {
				$parent.addClass('rot8-animating');
				$parent.removeClass('rot8-delaying');
				
				var animation = $animation_target.animateRotation(angle, animation_config, rotation_config);
				animation.promise().done( function() {
					self._resyncPanels();
					self._resetContainerDimensions();
					$parent.removeClass('rot8-animating rot8-running');
					$deferred.resolve();
				});
			}
			$parent.addClass('rot8-running');
			if ( config.delay > 0 ) {
				$parent.addClass('rot8-delaying');
				setTimeout( runAnimation, config.delay );
			} else {
				runAnimation();	
			}
			return $deferred.promise();
			
		},
		
		_registerResizeHandler : function() {			
			var resize_timeout = null;	
			$(window).resize(function() {
				if ( resize_timeout ) {
					clearInterval(resize_timeout);	
				}
				resize_timeout = setTimeout( function() {
					resize_timeout = null;
					self._resetContainerDimensions();
				}, this.config.resetDelay );
			});
		},
		
		_resetContainerDimensions : function() {
			var self = this;
			self._resetRetainerHeight();
			
			self.panel_width = self.$elem.outerWidth();			
			self.panel_height = self.$primary_panel.find(self.config.contentClass).outerHeight();
			
			var max_width = getMaxOuterWidth( self.$contents );
			var max_height = getMaxOuterHeight( self.$contents );
			var max_radius = getMaxRadiusFromWidthAndHeight( max_width, max_height );
			
			self.$container.width( max_radius * 2 );
			self.$container.height( max_radius * 2 );
			self.$container.css('left', '50%');
			self.$container.css('margin-left', (-(max_radius)) + 'px');
			
			self.$container.css('top', ( self.panel_height - (max_radius) ) + 'px');
			
			self.$contents.css('width',self.panel_width);
			self.$contents.css('margin-left',-self.panel_width/2);
		},	
		
		_refreshElements : function() {
			var self = this;
			
			// Find all panels
			self.$panels = self.$container.find(self.config.panelClass);
			self.$contents = self.$container.find(self.config.contentClass);
			
			// Hide all panels not in use
			self.$panels.not('.primary, .secondary').addClass('hidden');
		},
		
		// Ensure the $container doesn't collapse by setting the retainer to the same height as the current panel.
		_resetRetainerHeight : function() {
			var self = this;
			var height = this.$primary_panel.find(self.config.contentClass).outerHeight();
			
			self.$height_retainer.height( height );		
		},
		
		_resetRotation : function() {
			var self = this;
			var $container = self.$container;
			var animation = $container.animateRotation(0, {duration:0} );
			return animation.promise();
		},
		
		// If we've rotated 180°, rotate again and switch the panels around so there's no visual difference.
		_resyncPanels : function() {
			var self = this;
			self._switchPanels();
			self._resetRotation();			
		},
		
		// Set a panel to the primary. Used when we resync the rotation.
		_setPrimaryPanel : function( $panel ) {
			var self = this;
			if ( self.$primary_panel ) {
				self.$primary_panel.removeClass('primary').addClass('hidden');
			}
			self.$primary_panel = $panel;
			if ( $panel.is( self.$secondary_panel ) ) {
				self.$secondary_panel = null;	
			}
			//self._resetRetainerHeight();
			self.$primary_panel.removeClass('hidden secondary').addClass('primary');				
		},
		
		// Set a panel to the primary. Used when we resync the rotation.
		_setSecondaryPanel : function( $panel ) {
			var self = this;
			if ( self.$secondary_panel ) {
				self.$secondary_panel.removeClass('secondary').addClass('hidden');
			}
			if ( $panel.is( self.$primary_panel ) ) {
				self.$primary_panel = null;	
			}
			self.$secondary_panel = $panel;
			self.$secondary_panel.removeClass('hidden primary').addClass('secondary');				
		},
		
		_switchPanels : function() {
			var self = this;
			var $primary = self.$primary_panel;
			var $secondary = self.$secondary_panel;
			
			self._setPrimaryPanel( $secondary );
			self._setSecondaryPanel( $primary );
		},
		
		
	}
	
	Rot8.defaults = Rot8.prototype.defaults;
	
	
	// Create plugin
	
	$.fn.rot8 = function(options) {
		return this.each(function() {
			new Rot8(this, options).init();
		});
	};
	
})( jQuery, window , document );