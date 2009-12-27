PICBOX V2.0 README
===================
(c) Ben Kay 2009

Based on Slimbox 1.7
(c) Christophe Beyls 2007-2009 <http://www.digitalia.be>

Included files:

example.html		A simple example page demonstrating how to use Picbox with the default configuration.
example.jpg		An example image used on the example page.
README.txt		The file you are reading.
css/*			The Picbox stylesheet and its associated images. You can edit them to customize Picbox appearance.
js/picbox.js		The minified version of Picbox, plus the editable autoloading code using default options.
src/picbox.js		The Picbox source. Contains many comments and is not suitable for production use (needs to be minified first).
extra/*			Some extra scripts that you can add to the autoload code block inside picbox.js to add special functionality.


To use picbox.js, you must have a current copy of jQuery running on your site. The easiest way to do this is to add
<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.3/jquery.min.js"></script>
to your <head>.

When deploying picbox.js, you MUST always preserve the copyright notice at the beginning of the file.

If you are a developer and want to edit the provided Picbox source code, it is strongly recommended to minify the script using either the
"YUI Compressor" by Julien Lecomte, or Google Closure before distribution. It will strip spaces and comments and shrink the variable names
in order to obtain the smallest file size.

For more information, please read the documentation on the official project page. (http://bunnyfire.co.uk/projects/picbox/)


Enjoy!
