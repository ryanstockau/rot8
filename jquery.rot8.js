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
			segments : 2,
			containerClass : '.rot8-container',
			contentClass : '.rot8-content',
			panelClass : '.rot8-panel',
			direction : 'cw',
			duration : 2000,
			delay : 0,
			retainHeight : true			
		},
		
		init: function() {
			
			var self = this;
			self.$elem.data('rot8', self);
			
			self.config = $.extend({}, self.defaults, self.options, self.metadata);
			
			self.$container = self.$elem.find(self.config.containerClass);			
		//	self.$content = self.$container.find(self.config.contentClass);	
			
			
			self.$height_retainer = $('<div class="rot8-height-retainer"></div>');
			self.$elem.prepend( self.$height_retainer );
			
			self.refreshElements();
			
			
			// Set initial primary/secondary panels based on their positions in the DOM
			self.setPrimaryPanel( self.$panels.eq(0) );
			self.setSecondaryPanel( self.$panels.eq(1) );
			
			// Todo: needed?
			self.panel_length = 360 / self.config.segments;
			
			//self.panel_max_height = getMaxHeight( this.$panels );
			
			self.resetDimensions();
			
			
			
			var resize_timeout = null;
			
			// Handlers
			$(window).resize(function() {
				if ( resize_timeout ) {
					clearInterval(resize_timeout);	
				}
				resize_timeout = setTimeout( function() {
					resize_timeout = null;
					self.resetDimensions();
				}, 500 );
			});
			
			return self;
		},	
		
		setPrimaryPanel : function( $panel ) {
			var self = this;
			if ( self.$primary_panel ) {
				self.$primary_panel.removeClass('primary').addClass('hidden');
			}
			self.$primary_panel = $panel;
			if ( $panel.is( self.$secondary_panel ) ) {
				self.$secondary_panel = null;	
			}
			//self.resetRetainerHeight();
			self.$primary_panel.removeClass('hidden secondary').addClass('primary');				
		},
		
		setSecondaryPanel : function( $panel ) {
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
		
		next : function( options ) {
			var self = this;
			var $next = self.$primary_panel.next();
			if ( ! $next.length ) {
				$next = self.$panels.not(self.$primary_panel).first();
			}
			self.setSecondaryPanel( $next );
			return self.animateToSecondary( options );	
		},
		
		animateToSecondary : function( options ) {
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
				direction:config.direction
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
				
				var animation = $animation_target.animateRotation(angle, animation_config, rotation_config );
				animation.promise().done( function() {
					self.resetPanels();
					self.resetDimensions();
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
		
		switchPanels : function() {
			var self = this;
			var $primary = self.$primary_panel;
			var $secondary = self.$secondary_panel;
			
			self.setPrimaryPanel( $secondary );
			self.setSecondaryPanel( $primary );
		},
		
		resetDimensions : function() {
			var self = this;
			self.resetRetainerHeight();
			
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
		
		refreshElements : function() {
			var self = this;
			
			// Find all panels
			self.$panels = self.$container.find(self.config.panelClass);
			self.$contents = self.$container.find(self.config.contentClass);
			
			// Hide all panels not in use
			self.$panels.not('.primary, .secondary').addClass('hidden');
		},
		
		resetRotation : function() {
			var self = this;
			var $container = self.$container;
			var animation = $container.animateRotation(0, {duration:0} );
			return animation.promise();
		},
		
		resetPanels : function() {
			var self = this;
			self.switchPanels();
			self.resetRotation();			
		},
		
		resetRetainerHeight : function() {
			var self = this;
			var height = this.$primary_panel.find(self.config.contentClass).outerHeight();
			
			self.$height_retainer.height( height );		
		},
		
		addPanel : function( content ) {
			var self = this;
			self.$container.append(content);
			self.refreshElements();
		},
		
		getContainer : function() {
			var self = this;
			return self.$container;
		},
		
		getContent : function() {
			var self = this;
			return self.$content;
		}
		
	}
	
	Rot8.defaults = Rot8.prototype.defaults;
	
	
	// Create plugin
	
	$.fn.rot8 = function(options) {
		return this.each(function() {
			new Rot8(this, options).init();
		});
	};
	
})( jQuery, window , document );