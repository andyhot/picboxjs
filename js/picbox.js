/*!
	Picbox v2.1
	(c) 2010 Ben Kay <http://bunnyfire.co.uk>

	Based on code from Slimbox v1.7 - The ultimate lightweight Lightbox clone
	(c) 2007-2009 Christophe Beyls <http://www.digitalia.be>
	
	Uses jQuery-mousewheel Version: 3.0.2
	(c) 2009 Brandon Aaron <http://brandonaaron.net>
	
	MIT-style license.
*/

(function($) {
	
	var win = $(window), options, images, activeImage = -1, activeURL, prevImage, nextImage, middleX, middleY, imageX, imageY, currentSize, initialSize, imageDrag, timer,
	
	// Preload images
	preload = {}, preloadPrev = new Image(), preloadNext = new Image(),
	
	// DOM elements
	container, overlay, closeBtn, image, prevBtn, nextBtn, bottom, caption, number, moo,
	
	// Effects
	fxOverlay, fxResize;
	
	/*
		Initialization
	*/
	
	$(document).ready(function() {
		$(document.body).append(container = $('<div id="pbContainer" />').css("display", "none")[0])
		$(container).append(
			$([
				overlay = $('<div id="pbOverlay" />').click(close).css("opacity", 0).append(
					closeBtn = $('<div id="pbCloseBtn" />')[0]
				)[0],
				image = $('<img id="pbImage" />').dblclick(doubleClick)[0],
				bottom = $('<div id="pbBottom" />').append([
					caption = $('<div id="pbCaption" />')[0],
					$('<div id="pbNav" />').append([
						prevBtn = $('<a id="pbPrevBtn" href="#" />').click(previous)[0],
						zoomBtn  = $('<a id="pbZoomBtn" href="#" />').click(doubleClick)[0],
						nextBtn = $('<a id="pbNextBtn" href="#" />').click(next)[0]
					])[0],
					number = $('<div id="pbNumber" />')[0]
				])[0]
			])
		);
		
		$(image).makeDraggable(function() {
			var i = $(image), pos = i.position();
			imageX = (pos.left - win.scrollLeft()) + i.width() / 2;
			imageY = (pos.top - win.scrollTop()) + i.height() / 2;
			$(zoomBtn).addClass("zoomed");
		});
	});
	
	$.picbox = function(_images, startImage, _options) {
		options = $.extend({
			loop: false,				// Allows to navigate between first and last images
			overlayOpacity: 0.8,			// 1 is opaque, 0 is completely transparent (change the color in the CSS file)
			overlayFadeDuration: 200,		// Duration of the overlay fade-in and fade-out animations (in milliseconds)
			resizeDuration: 300,			// Duration of each of the image resize animations (in milliseconds)
			resizeEasing: "swing",			// swing uses the jQuery default easing
			controlsFadeDelay: 2000,		// Time delay before controls fade when not moving the mouse (in milliseconds)
			counterText: false,				// Counter text. Use {x} for current image and {y} for total e.g. Image {x} of {y}
			hideFlash: true,				// Hides flash elements on the page when picbox is activated. NOTE: flash elements must have wmode parameter set to "opaque" or "transparent" if this is set to false
			closeKeys: [27, 88, 67],		// Array of keycodes to close Picbox, default: Esc (27), 'x' (88), 'c' (67)
			previousKeys: [37, 80],			// Array of keycodes to navigate to the previous image, default: Left arrow (37), 'p' (80)
			nextKeys: [39, 78]			// Array of keycodes to navigate to the next image, default: Right arrow (39), 'n' (78)
		}, _options || {});


		// The function is called for a single image, with URL and Title as first two arguments
		if (typeof _images == "string") {
			_images = [[_images, startImage]];
			startImage = 0;
		}
		
		position();
		setup(1);
		$(overlay).fadeTo(options.overlayFadeDuration, options.overlayOpacity);

		images = _images;
		options.loop = options.loop && (images.length > 1);
		return changeImage(startImage);
	}

	$.fn.picbox = function(_options, linkMapper, linksFilter) {
		linkMapper = linkMapper || function(el) {
			return [el.href, el.title];
		};

		linksFilter = linksFilter || function() {
			return true;
		};

		var links = this;
		
		$(links).unbind("click").click(function() {
			var link = this, linksMapped = [];
			// Build the list of images that will be displayed
			filteredLinks = $.grep(links, function(el) {
				return linksFilter.call(link, el);
			});
			
			// Can't use $.map() as it flattens array
			for (var i = 0; i < filteredLinks.length; i++)
				linksMapped[i] = linkMapper(filteredLinks[i]);
			return $.picbox(linksMapped, $.inArray(this, filteredLinks), _options);
		});

		return links;
	}
	
	/*
		Internal functions
	*/
	
	function position() {
		middleX = win.width() / 2;
		middleY = win.height() / 2;

		$(image).css({top: middleY, left: middleX, width: '1px', height: '1px'});
	}
	
	function setup(open) {
 		if (options.hideFlash) {
			$.each(["object", "embed"], function(i, val) {
				$(val).each(function() {
					if (open) $(this).data("vis", this.style.visibility);
					this.style.visibility = open ? "hidden" : $(this).data("vis");
				});
			});
		}

		container.style.display = open ? "" : "none";
		
		var fn = open ? "bind" : "unbind";
		$()[fn]("keydown", keyDown);
		$()[fn]("mousewheel", scrollZoom);
		$()[fn]("mousemove", mouseMove);
		
	}
	
	function keyDown(event) {
		var code = event.keyCode;
		// Prevent default keyboard action (like navigating inside the page)
		return $.inArray(code, options.closeKeys) >= 0 ? close()
			: $.inArray(code, options.nextKeys) >= 0 ? next()
			: $.inArray(code, options.previousKeys) >= 0 ? previous()
			: false;
	}
	
	function mouseMove() {
		clearTimeout(timer);
		$(bottom).fadeIn();
		timer = setTimeout(function(){$(bottom).fadeOut()}, options.controlsFadeDelay);
	}
	
	function previous() {
		return changeImage(prevImage, true);
	}

	function next() {
		return changeImage(nextImage, true);
	}
	
	function changeImage(imageIndex, noAnim) {

		if (imageIndex >= 0) {
			activeImage = imageIndex;
			activeURL = images[imageIndex][0];
			prevImage = (activeImage || (options.loop ? images.length : 0)) - 1;
			nextImage = ((activeImage + 1) % images.length) || (options.loop ? 0 : -1);

			stop();
			overlay.className = "pbLoading";
			$(image).css("display", "none");

			$(caption).html(images[activeImage][1] || "");
			$(number).html((((images.length > 1) && options.counterText) || "").replace(/{x}/, activeImage + 1).replace(/{y}/, images.length));
			if (prevImage >= 0) {preloadPrev.src = images[prevImage][0]; $(prevBtn).removeClass("greyed");}
			if (nextImage >= 0) {preloadNext.src = images[nextImage][0]; $(nextBtn).removeClass("greyed");}

			$(bottom).css("display", "");

			preload = new Image();
			preload.onload = function(){showImage(noAnim);};
			preload.src = activeURL;
		}

		return false;
	}
	
	function showImage(noAnim) {
		resetImageCenter();

		var mw = win.width(), mh = win.height(), size = 1;
		if ((preload.width > mw) || (preload.height > mh)) size = Math.min(mw / preload.width, mh / preload.height);
		currentSize = initialSize = size;

		resizeImage(size, noAnim);

		$(image).attr("src", activeURL);
		$(image).css("display", "");
		overlay.className = "";
	}
	
	function resizeImage(to, noAnim, fn) {

		var amount = to / currentSize;
		imageX = middleX - (middleX - imageX) * amount;
		imageY = middleY - (middleY - imageY) * amount;

		currentSize = to;
		
		var	width = preload.width * to,
			height = preload.height * to,
			// round these as some browsers don't like very small css values
			left = imageX - (width / 2) >> 0,
			top = imageY - (height / 2) >> 0;
		
		
		var dur = noAnim ? 0 : options.resizeDuration;
		$(image).animate({width: width, height: height, top: top, left: left}, {queue:false, duration: dur, easing: options.resizeEasing, complete: fn});
		return false;
	}

	function resetImageCenter() {
		imageX = middleX;
		imageY = middleY;
	}

	function scrollZoom(e, delta) {
		$(zoomBtn).addClass("zoomed");
		var to = currentSize + delta * currentSize / 10;
		return resizeImage(to);
	}

	function doubleClick() {
		if (currentSize == initialSize && Math.abs((imageX - middleX) + (imageY - middleY)) < 2) {
			$(zoomBtn).addClass("zoomed");
			return resizeImage(1);
		} else {
			$(zoomBtn).removeClass("zoomed");
			resetImageCenter();
			return resizeImage(initialSize);
		}
	}

	function stop() {
		preload.onload = function(){};
		preload.src = preloadPrev.src = preloadNext.src = activeURL;
		$(image).stop();
		$([prevBtn, nextBtn]).addClass("greyed");
		$(zoomBtn).removeClass("zoomed");
	}

	function close() {
		if (activeImage >= 0) {
			stop();
			activeImage = prevImage = nextImage = -1;
			resizeImage(0, false, setup);
			$(overlay).stop().fadeTo(options.overlayFadeDuration, 0);
		}

		return false;
	}
	
	// Drag handler
	
	$.fn.makeDraggable = function(callback) {
		return $.draggable(this, callback);
	}

	$.draggable = function(el, callback) {
		var offset;
		el.mousedown(function(e) {
			var elPos = el.offset();
			offset = {x: e.screenX - elPos.left, y: e.screenY - elPos.top};
			$(document).mousemove(drag).mouseup(stop);
			return false;
		});
		
		function drag(e) {
			el.css({left: e.screenX - offset.x, top: e.screenY - offset.y});
			return false;
		}
		
		function stop() {
			$(document).unbind('mousemove', drag).unbind('mouseup');
			callback&&callback()
		}
		
		return false;
	}


/*! Copyright (c) 2009 Brandon Aaron (http://brandonaaron.net)
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 *
 * Version: 3.0.2
 * 
 * Requires: 1.2.2+
 */

var types = ['DOMMouseScroll', 'mousewheel'];

$.event.special.mousewheel = {
	setup: function() {
		if ( this.addEventListener )
			for ( var i=types.length; i; )
				this.addEventListener( types[--i], handler, false );
		else
			this.onmousewheel = handler;
	},
	
	teardown: function() {
		if ( this.removeEventListener )
			for ( var i=types.length; i; )
				this.removeEventListener( types[--i], handler, false );
		else
			this.onmousewheel = null;
	}
};

$.fn.extend({
	mousewheel: function(fn) {
		return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
	},
	
	unmousewheel: function(fn) {
		return this.unbind("mousewheel", fn);
	}
});


function handler(event) {
	var args = [].slice.call( arguments, 1 ), delta = 0, returnValue = true;
	
	event = $.event.fix(event || window.event);
	event.type = "mousewheel";
	
	if ( event.wheelDelta ) delta = event.wheelDelta/120;
	if ( event.detail     ) delta = -event.detail/3;
	
	// Add events and delta to the front of the arguments
	args.unshift(event, delta);

	return $.event.handle.apply(this, args);
}

})(jQuery);