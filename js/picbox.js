/*
	Picbox v2.0
	(c) 2009 Ben Kay <http://bunnyfire.co.uk>

	Based on code from Slimbox v1.7 - The ultimate lightweight Lightbox clone
	(c) 2007-2009 Christophe Beyls <http://www.digitalia.be>
	MIT-style license.
*/
(function($) {
	
	var win = $(window), options, images, activeImage = -1, activeURL, prevImage, nextImage, ie6 = ((window.XMLHttpRequest == undefined) && (ActiveXObject != undefined)), browserIsCrap, middleX, middleY, imageX, imageY, currentSize, initialSize, imageDrag, timer,
	
	// Preload images
	preload = {}, preloadPrev = new Image(), preloadNext = new Image(),
	
	// DOM elements
	overlay, closeBtn, image, prevLink, nextLink, bottomContainer, caption, number,
	
	// Effects
	fxOverlay, fxResize;
	
	/*
		Initialization
	*/
	
	$(document).ready(function() {
		$(document.body).append(
			$([
				overlay = $('<div id="pbOverlay" />').click(close).append(
					closeBtn = $('<div id="pbCloseBtn" />')[0]
				)[0],
				image = $('<img id="pbImage" />').dblclick(doubleClick)[0],
				bottomContainer = $('<div id="pbBottomContainer" />')[0]
			]).css("display", "none")
		);
		
		bottom = $('<div id="pbBottom" />').appendTo(bottomContainer).append(
			caption = $('<div id="pbCaption" />')[0],
			$('<div id="pbNav" />').append(
				prevLink = $('<a id="pbPrevLink" href="#">Prev</a>').click(previous)[0],
				zoomBtn  = $('<a id="pbZoomBtn" href="#">Full Size</a>').click(doubleClick)[0],
				nextLink = $('<a id="pbNextLink" href="#">Next</a>').click(next)[0]
			),
			number = $('<div id="pbNumber" />')[0],
			$('<div style="clear: both;" />')
		);
		
		browserIsCrap = ie6 || (overlay.currentStyle && (overlay.currentStyle.position != "fixed"));
		if (browserIsCrap) {
			$([overlay, closeBtn, image, bottomContainer]).css("position", "absolute");
			$([prevLink, nextLink]).css({
				"background-image": "none",
				"text-indent": 0
			});
		}
		
		$(image).jqDrag(function() {
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
			overlayFadeDuration: 100,		// Duration of the overlay fade-in and fade-out animations (in milliseconds)
			animateResize: true,			// Whether to animate image resizes
			resizeDuration: 300,			// Duration of each of the image resize animations (in milliseconds)
			resizeEasing: "swing",			// swing uses the jQuery default easing)
			counterText: "Image {x} of {y}",	// Translate or change as you wish, or set it to false to disable counter text for image groups
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
		$(overlay).css("opacity", 0).fadeTo(options.overlayFadeDuration, options.overlayOpacity);

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
		var scroll = {x: win.scrollLeft(), y: win.scrollTop()}, size = {x: win.width(), y: win.height()};
		middleX = size.x / 2;
		middleY = size.y / 2;

		if (browserIsCrap) {
			middleX = middleX + scroll.x;
			middleY = middleY + scroll.y;
			$(overlay).css({left: scroll.x, top: scroll.y, width: size.x, height: size.y});
		}

		$(image).css({top: Math.max(0, middleY), left: Math.max(0, middleX), width: 1, height: 1});
	}
	
	function setup(open) {
		$.each(["object", ie6 ? "select" : "embed"], function(i, val) {
			$(val).each(function() {
				if (open) this.data("vis", this.style.visibility);
				this.style.visibility = open ? "hidden" : this.data("vis");
			});
		});

		overlay.style.display = open ? "" : "none";
		
		clearTimeout(timer);

		var fn = open ? "bind" : "unbind";
		$(document)[fn]("keydown", keyDown);
		$(document)[fn]("mousewheel", scrollZoom);
		$(document)[fn]("mousemove", function() {
			clearTimeout(timer);
			$(bottom).fadeIn();
			timer = setTimeout(function(){$(bottom).fadeOut()}, 3000);
		});
		
	}
	
	function keyDown(event) {
		var code = event.keyCode;
		// Prevent default keyboard action (like navigating inside the page)
		return $.inArray(code, options.closeKeys) >= 0 ? close()
			: $.inArray(code, options.nextKeys) >= 0 ? next()
			: $.inArray(code, options.previousKeys) >= 0 ? previous()
			: false;
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
			if (prevImage >= 0) {preloadPrev.src = images[prevImage][0]; $(prevLink).removeClass("greyed");}
			if (nextImage >= 0) {preloadNext.src = images[nextImage][0]; $(nextLink).removeClass("greyed");}

			$(bottomContainer).css("display", "");

			preload = new Image();
			preload.onload = function(){showImage(noAnim);};
			preload.src = activeURL;
		}

		return false;
	}
	
	function showImage(noAnim) {
		resetImageCenter();

		var mw = win.width(), mh = win.height(), size = 1;
		if ((preload.width > mw) || (preload.height > mh)) size = Math.min(mw/preload.width, mh/preload.height);
		currentSize = initialSize = size;

		resizeImage(size, noAnim);

		$(image).attr("src", activeURL);
		$(image).css("display", "");
		overlay.className = "";
	}
	
	function resizeImage(to, noAnim, chain) {

		var amount = to/currentSize;
		imageX = middleX - (middleX - imageX)*amount;
		imageY = middleY - (middleY - imageY)*amount;

		currentSize = to;

		var width = preload.width * to,
			height = preload.height * to,
			left = imageX - (width / 2),
			top = imageY - (height / 2);
		
		var dur = options.animateResize ? noAnim ? 0 : options.resizeDuration : 0;
		$(image).animate({width: width, height: height, top: top, left: left}, {queue:false, duration: dur, easing: options.resizeEasing, complete: chain});
		return false;
	}

	function resetImageCenter() {
		imageX = middleX;
		imageY = middleY;
	}

	function scrollZoom(e, delta) {
		$(zoomBtn).addClass("zoomed");
		return zoomImage(delta);
	}
	
	function zoomImage(amount) {
		var to = currentSize + amount*(currentSize/10);
		return resizeImage(to);
	}

	function doubleClick() {
		if (currentSize == initialSize && Math.abs((imageX - middleX) + (imageY - middleY)) < 2) {
			$(zoomBtn).addClass("zoomed");
			resizeImage(1);
		} else {
			$(zoomBtn).removeClass("zoomed");
			resetImageCenter();
			resizeImage(initialSize);
		}
	}

	function stop() {
		preload.onload = function(){};
		preload.src = preloadPrev.src = preloadNext.src = activeURL;
		$(image).stop();
		$([prevLink, nextLink]).addClass("greyed");
		$(zoomBtn).removeClass("zoomed");
	}

	function close() {
		if (activeImage >= 0) {
			stop();
			activeImage = prevImage = nextImage = -1;
			$(bottomContainer).hide();
			resizeImage(0, false, function() {$(image).hide()});
			$(overlay).stop().fadeOut(options.overlayFadeDuration, setup);
		}

		return false;
	}
})(jQuery);

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

(function($){
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

/*!
 * jqDnR - Minimalistic Drag'n'Resize for jQuery.
 * Slightly modified to allow for a callback function
 *
 * Copyright (c) 2007 Brice Burgess <bhb@iceburg.net>, http://www.iceburg.net
 * Licensed under the MIT License:
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * $Version: 2007.08.19 +r2
 */

(function($){
$.fn.jqDrag=function(c,h){return i(this,h,'d',c);};
$.fn.jqResize=function(c,h){return i(this,h,'r',c);};
$.jqDnR={dnr:{},e:0,
drag:function(v){
 if(M.k == 'd')E.css({left:M.X+v.pageX-M.pX,top:M.Y+v.pageY-M.pY});
 else E.css({width:Math.max(v.pageX-M.pX+M.W,0),height:Math.max(v.pageY-M.pY+M.H,0)});
  return false;},
stop:function(c){$().unbind('mousemove',J.drag).unbind('mouseup');c&&c();}
};
var J=$.jqDnR,M=J.dnr,E=J.e,
i=function(e,h,k,c){return e.each(function(){h=(h)?$(h,e):e;
 h.bind('mousedown',{e:e,k:k},function(v){var d=v.data,p={};E=d.e;
 // attempt utilization of dimensions plugin to fix IE issues
 if(E.css('position') != 'relative'){try{E.position(p);}catch(e){}}
 M={X:p.left||f('left')||0,Y:p.top||f('top')||0,W:f('width')||E[0].scrollWidth||0,H:f('height')||E[0].scrollHeight||0,pX:v.pageX,pY:v.pageY,k:d.k,o:E.css('opacity')};
 $().mousemove($.jqDnR.drag).mouseup(function(){$.jqDnR.stop(c)});
 return false;
 });
});},
f=function(k){return parseInt(E.css(k))||false;};
})(jQuery);