// AUTOLOAD CODE BLOCK (MAY BE CHANGED OR REMOVED)
Picbox.scanPage = function() {
	$$(document.links).filter(function(el) {
		return el.rel && el.rel.test(/^lightbox/i);
	}).picbox({/* Put custom options here */}, null, function(el) {
		return (this == el) || ((this.rel.length > 8) && (this.rel == el.rel));
	});
};
window.addEvent("domready", Picbox.scanPage);