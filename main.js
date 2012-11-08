/*
 * Copyright (c) 2012 Jochen Hagenstroem. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

/* texxt inlude  wih typos  makes  sense? teh is fro.  inluded? Tuesday. include A Barr */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, btoa, atob */

define(function (require, exports, module) {
    'use strict';


    // Brackets modules
    var CodeHintManager = brackets.getModule("editor/CodeHintManager"),
        EditorManager   = brackets.getModule("editor/EditorManager"),
        ExtensionUtils  = brackets.getModule("utils/ExtensionUtils"),
        CommandManager  = brackets.getModule("command/CommandManager"),
        Menus           = brackets.getModule("command/Menus"),
        StringUtils     = brackets.getModule("utils/StringUtils"),
        TokenUtils      = brackets.getModule("utils/TokenUtils"),
        spellCheck      = require("AtD");
    


    var CHECK_SPELLING = "check_spelling";
    var activeSelection = "";
    var atdResult;
    var editorForHinting;
    

    
    // -----------------------------------------
    // Code Mirror integration
    // -----------------------------------------
    var _getActiveSelection = function () {
        return EditorManager.getFocusedEditor().getSelectedText();
    };

    var _replaceActiveSelection = function (text) {
        EditorManager.getFocusedEditor()._codeMirror.replaceSelection(text);
    };
    
    function findWordBoundariesForCursor(editor, cursor) {
        // [\s$,\.\=\!-_#]
        
        // Try to use Editor.selectWordAt? - doesn't work as expected.
        // var w = editor.selectWordAt(cursor);
        var start = {line: -1, ch: -1},
            end = {line: -1, ch: -1},
            cm = editor._codeMirror,
            token,
            keepSearchingForWordStart = true,
            keepSearchingForWordEnd = true,
            prevToken,
            match;

        
        end.line = start.line = cursor.line;
        start.ch = cursor.ch;
        end.ch = start.ch + 1;
        token = cm.getRange(start, end);
        
        while (keepSearchingForWordStart) {
            match = token.match(/[\s,\.\=\!-#\?%&\*]\w/);
            if (match) {
                start.ch = start.ch + 1;
                keepSearchingForWordStart = false;
            } else {
                start.ch = start.ch - 1;
            }
            prevToken = token;
            token = cm.getRange(start, end);
            if (prevToken.valueOf() === token.valueOf()) {
                keepSearchingForWordStart = false;
            }
        }
        while (keepSearchingForWordEnd) {
            match = token.match(/\w[\s,\.\=\!-#\?%&\*]/);
            if (match) {
                end.ch = end.ch - 1;
                keepSearchingForWordEnd = false;
            } else {
                end.ch = end.ch + 1;
            }
            prevToken = token;
            token = cm.getRange(start, end);
            if (prevToken.valueOf() === token.valueOf()) {
                keepSearchingForWordEnd = false;
            }
        }
        return {start: start, end: end};
    }
    
    // -----------------------------------------
    // AtD result handler
    // -----------------------------------------    
    var resultHandler = [];
    resultHandler.ready = function (count) {
        //console.log("ready called: count " + count);
    };
    
    resultHandler.success = function (count) {
        //console.log("success called: count " + count);
    };
    
    resultHandler.markMyWords = function (results) {
        atdResult = results;
        //console.log("markMyWords called");

        editorForHinting = EditorManager.getCurrentFullEditor();
        var cm = editorForHinting._codeMirror;
        // tokenize
        var words = activeSelection.split(/\W/);
        var text = editorForHinting.document.getText();
        // walk words / tokens
        var i;
        var wordCursor = [];
        for (i = 0; i < words.length; i++) {
            var word = words[i];
            if (word !== undefined && word !== "") {
                var currentCursor = wordCursor[word];
                if (currentCursor === undefined) {
                    currentCursor = 0;
                }
                var pos = text.indexOf(word, currentCursor + 1);

                var current  = atdResult.errors['__' + word];
                if (current !== undefined && current.pretoks !== undefined) {
                    wordCursor[word] = pos;
//                    console.log("marking word " + word);
//                    console.log("   at pos is " + pos);
                    var cmPos = cm.posFromIndex(pos);
                    // highlight
                    cm.markText(cmPos, {line: cmPos.line, ch: cmPos.ch + word.length}, "underline AtD_hints_available");
                    editorForHinting.setCursorPos(cmPos.line, cmPos.ch + word.length - 1);
                }
            }
        }


        $(editorForHinting.getScrollerElement()).on('click', function (event) {
            event.stopPropagation();
            CodeHintManager.showHint(editorForHinting);
        });
    };
    
    // -----------------------------------------
    // initiate spell check
    // -----------------------------------------  
    var _check_spelling = function () {
        atdResult = null;
        activeSelection = _getActiveSelection();
        if (activeSelection !== undefined && activeSelection !== "") {
            spellCheck.AtD.check(activeSelection, resultHandler);
        } else {
            var placeholder = 1;
            // TODO check entire document, really? TBD
        }
    };

    // -----------------------------------------
    // brackets menu item
    // ----------------------------------------- 
    var buildMenu = function (m) {
        m.addMenuDivider();
        m.addMenuItem(CHECK_SPELLING);
    };
    
    CommandManager.register("Check Spelling", CHECK_SPELLING, _check_spelling);


    var menu = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);
    buildMenu(menu);

    var contextMenu = Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU);
    buildMenu(contextMenu);
    
    // -----------------------------------------
    // Hint Provider for CodeHintmanager
    // -----------------------------------------
    /**
     * Registers as HintProvider as an object that is able to provide code hints. 
     * When the user requests a spelling
     * hint getQueryInfo() will be called. getQueryInfo() returns a search query 
     * object with a filter string if hints can be provided. 
     * search() will then be called  to create a 
     * list of hints for the search query. When the user chooses a hint handleSelect() is called
     * so that the hint provider can insert the hint into the editor.
     *
     */
    function SpellingHints() {}

    /**
     * Get the spelling hints for a given word
     * @param {Object.<queryStr: string, ...} query -- a query object with a required property queryStr 
     *     that will be used to filter out code hints
     * @return {Array.<string>}
     */
    SpellingHints.prototype.search = function (query) {

        var i,
            returnObject = [],
            suggestionsAdded = [];
        for (i = 0; i < atdResult.suggestions.length; i++) {
            var suggestion = atdResult.suggestions[i];
            
            if (query.queryStr.match(suggestion.matcher)) {
                var j;
                for (j = 0; j < suggestion.suggestions.length; j++) {
                    // TODO check if suggestion is available already
                    if(!suggestionsAdded[suggestion.suggestions[j]]) {
                        returnObject.push(suggestion.suggestions[j]);
                    }    
                    suggestionsAdded[suggestion.suggestions[j]] = true;

                }
            }
        }
        var current  = atdResult.errors['__' + query.queryStr];
        if (current !== undefined && current.pretoks && returnObject.length === 0) {
            returnObject.push("No suggestions available");
        }
        return returnObject;
    };
    
    /**
     * Figures out the text to use for the hint list query based on the text
     * around the cursor
     * Query is the text from the start of a tag to the current cursor position
     * @param {Editor} editor
     * @param {Cursor} current cursor location
     * @return {Object.<queryStr: string, ...} search query results will be filtered by.
     *      Return empty queryStr string to indicate code hinting should not filter and show all results.
     *      Return null in queryStr to indicate NO hints can be provided.
     */
    SpellingHints.prototype.getQueryInfo = function (editor, cursor) {
        var boundaries = findWordBoundariesForCursor(editor, cursor),
            cm = editor._codeMirror,
            token;
        token = cm.getRange(boundaries.start, boundaries.end);
        var query = {queryStr: token};


        return query;
    };
    
    /**
     * Enters the code completion text into the editor
     * @param {string} completion - text to insert into current code editor
     * @param {Editor} editor
     * @param {Cursor} current cursor location
     * @param {boolean} closeHints - true to close hints, or false to continue hinting
     */
    SpellingHints.prototype.handleSelect = function (completion, editor, cursor, closeHints) {
        var savedCursor = cursor;
        var boundaries = findWordBoundariesForCursor(editor, cursor);

        if (boundaries.start.ch !== boundaries.end.ch) {
            editor.document.replaceRange(completion, boundaries.start, boundaries.end);
        } else {
            editor.document.replaceRange(completion, boundaries.start);
        }

    };

    
    /**
     * Check whether to show hints on a specific key.
     * @param {string} key -- the character for the key user just presses.
     * @return {boolean} return true/false to indicate whether hinting should be triggered by this key.
     */
    SpellingHints.prototype.shouldShowHintsOnKey = function (key) {
        return false;
    };

    var spellingHints = new SpellingHints();
    CodeHintManager.registerHintProvider(spellingHints);
    
    // -----------------------------------------
    // Init
    // -----------------------------------------
    function init() {
        ExtensionUtils.loadStyleSheet(module, "styles.css");
    }
    
    init();
    
});