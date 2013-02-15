SpellCheck
=============

Spell checker extension for the Adobe Brackets Web Editor.

_Note: Now compatible with brackets build >== 0.18.x  /sprint 18_ 

Adobe Brackets:
https://github.com/adobe/brackets

## Features
* integrates the powerful online spell checker After The Deadline, http://afterthedeadline.com/

## Installation

- Launch Brackets ( >== 0.18.x), choose _Show Extensions Folder_ from the _Help_ menu.
- Place SpellCheck in the Extensions folder, i.e. on Mac _/Users/jh/Library/Application Support/Brackets/extensions/user/_ directory.
- Reload brackets.


## Usage

- Select text and then select the command _Check Spelling - English_ from the _Edit_ menu, or by right clicking and selecting the command from the context menu. This will hi-lite any words in the selection that have spelling hints available.
- Navigate cursor to a hi-lited word and hit CTRL-space to open the hint list dropdown.
- select suggestion from dropdown to apply

To enable more languages (i.e. German, French, Spanish or Portuguese) uncomment lines in main.js, lines 129-132, i.e. to enable German
    _m.addMenuItem(CHECK_SPELLING_DE);_
##Releases
### Feb 15, 2013
0.5.4 - Update text high lighting for compatibility with code mirror 2 and 3. Brackets 0.20 / Sprint 20 switches to CM3. Since Edge Code is still on CM2 backwards compatibilty is maintained. 

### Jan 29, 2013
0.5.3 - Implemented API changes in CodeHintManager introduced in Brackes 0.18 / Sprint 18. Change is not backwards compatible. Moving forward only buils >= 0.18.x are supported.

### Nov 15, 2012
0.5.2 - Usability improvements: Fixed bugs around text selection, text marking, capitalization, containing a text to be hinted.


### Nov 7, 2012
0.5.1 - Usability improvements: Fixed bugs around text selection, text marking, capitalization, containing a text to be hinted.
0.5.0 - Spell checking is now functioning, project is barely out of the woods, still aplha quality - uses after the dead line web service: http://afterthedeadline.com/

Created by Jochen Hagenstroem  
https://github.com/couzteau/SpellCheck  
couzteau@bitfaeule.net 


Copyright (c) 2012 Jochen Hagenstroem. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the "Software"), 
to deal in the Software without restriction, including without limitation 
the rights to use, copy, modify, merge, publish, distribute, sublicense, 
and/or sell copies of the Software, and to permit persons to whom the 
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.
  
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
DEALINGS IN THE SOFTWARE.
