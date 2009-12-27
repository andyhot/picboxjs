PICBOX V1.0.1 README
===================
(c) Ben Kay 2009

Based on Slimbox 1.7
(c) Christophe Beyls 2007-2009 <http://www.digitalia.be>

Included files:

example.html		A simple example page demonstrating how to use Picbox with the default configuration.
example.jpg		An example image used on the example page.
README.txt		The file you are reading.
css/*			The Picbox stylesheet and its associated images. You can edit them to customize Picbox appearance.
js/mootools.js		The minified version of mootools v1.2.2 including only the modules required by Picbox.
js/picbox.js		The minified version of Picbox, plus the editable autoloading code using default options.
src/picbox.js		The Picbox source. Contains many comments and is not suitable for production use (needs to be minified first).
extra/*			Some extra scripts that you can add to the autoload code block inside picbox.js to add special functionality.


You can use the provided mootools.js and picbox.js scripts "as is", or you can use a custom mootools build
downloaded from the official mootools website and/or edit the autoloading code inside picbox.js.

You need to download a new mootools version if your web page scripts require additional mootools modules,
or if you want to use a different version of mootools.

Here are the mootools core modules required by this version of Picbox:
- Native: all
- Class: all
- Element: all
- Utilities: DomReady
- Fx: all

Picbox also requires the following module from mootools more:
- Drag

When deploying picbox.js, you MUST always preserve the copyright notice at the beginning of the file.

If you are a developer and want to edit the provided Picbox source code, it is strongly recommended to minify the script using "YUI Compressor"
by Julien Lecomte before distribution. It will strip spaces and comments and shrink the variable names in order to obtain the smallest file size.

For more information, please read the documentation on the official project page. (http://bunnyfire.co.uk/projects/picbox/)


Enjoy!
