/*
	With the following code, Picbox will activate itself automatically on all links pointing to images,
	or more specifically all links having URLs ending with: ".jpg" or ".png" or ".gif".
	As a result, you will not need to set the rel="lightbox" attribute on any link to activate Picbox.
	Furthermore, all image links contained in the same block or paragraph (having the same parent element)
	will automatically be grouped together in a gallery, so you will not need to specify groups either.
	Images that are alone in their block or paragraph will be displayed individually.

	Replace the default autoload code block with this one.
*/

Picbox.scanPage = function() {
	$$(document.links).filter(function(el) {
		return el.href && el.href.test(/\.(jpg|png|gif)$/i);
	}).picbox({}, null, function(el) {
		return (this == el) || (this.parentNode && (this.parentNode == el.parentNode));
	});
};
if (!/android|iphone|ipod|series60|symbian|windows ce|blackberry/i.test(navigator.userAgent)) {
	window.addEvent("domready", Picbox.scanPage);
}