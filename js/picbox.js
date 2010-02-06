/*!
	Picbox v1.1
	(c) 2010 Ben Kay <http://bunnyfire.co.uk>

	Based on code from Slimbox v1.7 - The ultimate lightweight Lightbox clone
	(c) 2007-2009 Christophe Beyls <http://www.digitalia.be>
	MIT-style license.
*/

Picbox = (function($) {

	// Global variables, accessible to Picbox only
	var win = window, ie6 = Browser.Engine.trident4, browserIsCrap, options, images, activeImage = -1, activeURL,  prevImage, nextImage, middleX, middleY, imageX, imageY, currentSize, initialSize, imageDrag, timer, fitsOnScreen,

	// Preload images
	preload = {}, preloadPrev = new Image(), preloadNext = new Image(),

	// DOM elements
	overlay, closeBtn, image, prevBtn, nextBtn, bottom, caption, number,

	// Effects
	fxOverlay, fxResize,

	// CSS classes
	zoomed = "pbzoomed", greyed = "pbgreyed";

	/*
		Initialization
	*/

	win.addEvent("domready", function() {
		// Append the Picbox HTML code at the bottom of the document
		$(document.body).adopt(
			$$(
				overlay = new Element("div", {id: "pbOverlay", events: {click: close}}).adopt(
					closeBtn = new Element("div", {id: "pbCloseBtn"})
				),
				image = new Element("img", {id: "pbImage", events: {dblclick: doubleClick}}),
				bottom = new Element("div", {id: "pbBottom", events: {mouseover: function(){preventFade(1);}, mouseout: preventFade}}).adopt(
					caption = new Element("div", {id: "pbCaption"}),
					number = new Element("div", {id: "pbNumber"}),
					new Element("div", {id: "pbNav"}).adopt(
						prevBtn = new Element("a", {id: "pbPrevBtn", href: "#", events: {click: previous}}),
						zoomBtn = new Element("a", {id: "pbZoomBtn", href: "#", events: {click: doubleClick}}),
						nextBtn = new Element("a", {id: "pbNextBtn", href: "#", events: {click: next}})
					)
				)
			).setStyle("display", "none")
		);

		browserIsCrap = ie6 || (overlay.currentStyle && (overlay.currentStyle.position != "fixed"));
		if (browserIsCrap) {
			$$(overlay, closeBtn, image, bottom).setStyle("position", "absolute");
		}
		
 		image.tinyDrag(function(){
			// Getting position relative to overlay as it
			// returns posn relative to top of document in ie7/8 otherwise
			var relative = Browser.Engine.trident5 ? overlay : undefined;
			var pos = image.getPosition(relative);
			imageX = pos.x + image.offsetWidth/2;
			imageY = pos.y + image.offsetHeight/2;
			$(zoomBtn).addClass(zoomed);
		});
 	});


	/*
		Internal functions
	*/

	function position() {
		var scroll = win.getScroll(), size = win.getSize();
		middleX = win.getWidth() / 2;
		middleY = win.getHeight() / 2;

		if (browserIsCrap) {
			middleX = middleX + scroll.x;
			middleY = middleY + scroll.y;
			overlay.setStyles({left: scroll.x, top: scroll.y, width: size.x, height: size.y});
		}

		image.setStyles({top: Math.max(0, middleY), left: Math.max(0, middleX), width: 1, height: 1});
	}

	function setup(open) {
		if (options.hideFlash) {
			["object", "embed"].forEach(function(tag) {
				Array.forEach(document.getElementsByTagName(tag), function(el) {
					if (open) el._picbox = el.style.visibility;
					el.style.visibility = open ? "hidden" : el._picbox;
				});
			});
		}
		
		overlay.style.display = "";

		var fn = open ? "addEvent" : "removeEvent";
		document[fn]("keydown", keyDown);
		document[fn]("mousewheel", scrollZoom);
		document[fn]("mousemove", mouseMove);
	}

	function keyDown(event) {
		var code = event.code;
		// Prevent default keyboard action (like navigating inside the page)
		return options.closeKeys.contains(code) ? close()
			: options.nextKeys.contains(code) ? next()
			: options.previousKeys.contains(code) ? previous()
			: false;
	}
	
	function mouseMove() {
		clearTimeout(timer);
		bottom.fade("in");
		timer = setTimeout(function(){bottom.fade("out")}, options.controlsFadeDelay);
	}
	
	function preventFade(over) {
		var fn = 1 == over ? "removeEvent" : "addEvent";
		document[fn]("mousemove", mouseMove);
		clearTimeout(timer);
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
			image.setStyle("display", "none");

			caption.set("html", images[activeImage][1] || "");
			number.set("html", (((images.length > 1) && options.counterText) || "").replace(/{x}/, activeImage + 1).replace(/{y}/, images.length));
			if (prevImage >= 0) {preloadPrev.src = images[prevImage][0]; prevBtn.removeClass(greyed);}
			if (nextImage >= 0) {preloadNext.src = images[nextImage][0]; nextBtn.removeClass(greyed);}

			bottom.setStyle("display", "");

			preload = new Image();
			preload.onload = function(){showImage(noAnim);};
			preload.src = activeURL;
		}

		return false;
	}

	function showImage(noAnim) {
		resetImageCenter();

		var mw = win.getWidth() - options.margins, mh = win.getHeight() - options.margins, size = 1;
		if ((preload.width > mw) || (preload.height > mh)) {
			size = Math.min(mw/preload.width, mh/preload.height);
			zoomBtn.removeClass(greyed);
			fitsOnScreen = false;
		} else {
			zoomBtn.addClass(greyed);
			fitsOnScreen = true;
		}
		
		currentSize = initialSize = size;

		resizeImage(size, noAnim);

		image.set("src", activeURL);
		image.setStyle("display", "");
		overlay.className = "";
	}

	function resizeImage(to, noAnim, c) {

		var amount = to / currentSize;
		imageX = middleX - (middleX - imageX) * amount;
		imageY = middleY - (middleY - imageY) * amount;

		currentSize = to;

		var width = preload.width * to,
			height = preload.height * to,
			left = imageX - (width / 2),
			top = imageY - (height / 2);

		var fn = noAnim ? "set" : "start", chain = (0 == to) ? function(){image.setStyle("display", "none")}:$empty;
		fxResize[fn]({width: width, height: height, top: top, left: left}).chain(chain);
		
		return false;
	}

	function resetImageCenter() {
		imageX = middleX;
		imageY = middleY;
	}

	function scrollZoom(e) {
		var to = currentSize + e.wheel * (currentSize / 10);
		return resizeImage(to);
	}

	function doubleClick() {
		if (currentSize == initialSize && Math.abs(imageX - middleX + imageY - middleY) < 2 && !fitsOnScreen) {
			zoomBtn.addClass(zoomed);
			return resizeImage(1);
		} else {
			zoomBtn.removeClass(zoomed);
			resetImageCenter();
			return resizeImage(initialSize);
		}
	}

	function stop() {
		preload.onload = $empty;
		preload.src = preloadPrev.src = preloadNext.src = activeURL;
		fxResize.cancel();
		$$(prevBtn, nextBtn).addClass(greyed);
		zoomBtn.removeClass(zoomed);
	}

	function close() {
		if (activeImage >= 0) {
			stop();
			activeImage = prevImage = nextImage = -1;
			resizeImage(0);
			setup();
			bottom.setStyle("display", "none");
			fxOverlay.cancel().chain(function(){overlay.setStyle("display", "none");}).start(0);
		}

		return false;
	}


	/*
		API
	*/

	Element.implement({
		picbox: function(_options, linkMapper) {
			// The processing of a single element is similar to the processing of a collection with a single element
			$$(this).picbox(_options, linkMapper);

			return this;
		}
	});

	Elements.implement({
		/*
			options:	Optional options object, see Picbox.open()
			linkMapper:	Optional function taking a link DOM element and an index as arguments and returning an array containing 2 elements:
					the image URL and the image caption (may contain HTML)
			linksFilter:	Optional function taking a link DOM element and an index as arguments and returning true if the element is part of
					the image collection that will be shown on click, false if not. "this" refers to the element that was clicked.
					This function must always return true when the DOM element argument is "this".
		*/
		picbox: function(_options, linkMapper, linksFilter) {
			linkMapper = linkMapper || function(el) {
				return [el.href, el.title];
			};

			linksFilter = linksFilter || function() {
				return true;
			};

			var links = this;

			links.removeEvents("click").addEvent("click", function() {
				// Build the list of images that will be displayed
				var filteredLinks = links.filter(linksFilter, this);
				return Picbox.open(filteredLinks.map(linkMapper), filteredLinks.indexOf(this), _options);
			});

			return links;
		}
	});

	return {
		open: function(_images, startImage, _options) {
			options = $extend({
				loop: false,					// Allows to navigate between first and last images
				overlayOpacity: 0.8,			// 1 is opaque, 0 is completely transparent (change the color in the CSS file)
				overlayFadeDuration: 200,		// Duration of the overlay fade-in and fade-out animations (in milliseconds)
				resizeDuration: 300,			// Duration of each of the image resize animations (in milliseconds)
				resizeEasing: Fx.Transitions.Sine.easeOut,		// false uses the mootools default transition)
				controlsFadeDelay: 2000,		// Time delay before controls fade when not moving the mouse (in milliseconds)
				counterText: false,				// Counter text. Use {x} for current image and {y} for total e.g. Image {x} of {y}
				hideFlash: true,				// Hides flash elements on the page when picbox is activated. NOTE: flash elements must have wmode parameter set to "opaque" or "transparent" if this is set to false
				closeKeys: [27, 88, 67],		// Array of keycodes to close Picbox, default: Esc (27), 'x' (88), 'c' (67)
				previousKeys: [37, 80],			// Array of keycodes to navigate to the previous image, default: Left arrow (37), 'p' (80)
				nextKeys: [39, 78],				// Array of keycodes to navigate to the next image, default: Right arrow (39), 'n' (78)]
				margins: 0						// Margin between the image and the sides of the window (in pixels)
			}, _options || {});

			// Setup effects
			fxOverlay = new Fx.Tween(overlay, {property: "opacity", duration: options.overlayFadeDuration});
			fxResize = new Fx.Morph(image, $extend({duration: options.resizeDuration, link: "cancel"}, options.resizeTransition ? {transition: options.resizeTransition} : {}));
			
			// The function is called for a single image, with URL and Title as first two arguments
			if (typeof _images == "string") {
				_images = [[_images, startImage]];
				startImage = 0;
			}

			fxOverlay.set(0).start(options.overlayOpacity);
			position();
			setup(1);

			images = _images;
			options.loop = options.loop && (images.length > 1);
			return changeImage(startImage);
		}
	};
	
})(document.id);

(function($) {
	// Drag handler

	Element.implement({
		
		tinyDrag: function(callback) {
			var offset, mouse, moved, target = this;
			this.addEvent("mousedown", function(e) {
				var elPos = this.getPosition();
				moved = false;
				mouse = {x: e.page.x, y: e.page.y};
				offset = {x: mouse.x - elPos.x, y: mouse.y - elPos.y};
				document.addEvent("mousemove", drag).addEvent("mouseup", stop);
				return false;
			});
			
			function drag(e) {
				var x = e.page.x, y = e.page.y;
				if (moved) {
					target.setStyles({left: x - offset.x, top: y - offset.y});
				} else {
					if (Math.abs(x - mouse.x) > 1 || Math.abs(y - mouse.y) > 1)
						moved = true
				}
				return false;
			}
			
			function stop() {
				$(document).removeEvent("mousemove", drag).removeEvent("mouseup");
				moved&&callback&&callback()
			}
			
			return this;
		}
	});
})(document.id);