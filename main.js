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

/* Texxt wih typpos  makes  sene? thesdf B  
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, btoa, atob */

define(function (require, exports, module) {
    'use strict';


    // Brackets modules
    var CodeHintManager = brackets.getModule("editor/CodeHintManager"),
        EditorManager   = brackets.getModule("editor/EditorManager"),
        CommandManager  = brackets.getModule("command/CommandManager"),
        Menus           = brackets.getModule("command/Menus"),
        StringUtils     = brackets.getModule("utils/StringUtils"),
        TokenUtils      = brackets.getModule("utils/TokenUtils"),        
        spellCheck      = require("AtD");
    


    var CHECK_SPELLING = "check_spelling";
    var activeSelection = "";
    var atdResult;
    

    
    // -----------------------------------------
    // Code Mirror integration
    // -----------------------------------------
    var _getActiveSelection = function () {
        return EditorManager.getFocusedEditor().getSelectedText();
    };

    var _replaceActiveSelection = function (text) {
        EditorManager.getFocusedEditor()._codeMirror.replaceSelection(text);
    };
    
    // -----------------------------------------
    // AtD result handler
    // -----------------------------------------    
    var resultHandler = [];
    resultHandler.ready = function (count) {
        console.log("ready called: count " + count);
    };
    
    resultHandler.success = function (count) {
        console.log("success called: count " + count);
    };
    
    resultHandler.markMyWords = function (results) {
        atdResult = results;
        var errors = results.errors;
        console.log("markMyWords called");
        // 1. tokenize text to check, 
        // 2. walk words in text to check
        // 3. highlight words. 

        // TODO
        // 4. add class that enables suggestion drop down
        // see HTMLCodeHints / CodeHintManager


        var editor = EditorManager.getCurrentFullEditor();
        var cm = editor._codeMirror;
        // tokenize
        var words = activeSelection.split(/\W/);
        var text = editor.document.getText();
        // walk words / tokens
        for (var i=0; i<words.length; i++) {            
            var word = words[i];
            if(word != undefined && word !== ""){    
                
                var pos = text.indexOf(word);
                

                var current  = errors['__' + word];
                if (current != undefined && current.pretoks != undefined) {   
                    console.log("marking word " + word);
                    console.log("   at pos is " + pos);
                    var cmPos = cm.posFromIndex(pos);
                    // highlight
                    cm.markText(cmPos, {line:cmPos.line, ch:cmPos.ch+word.length}, "underline AtD_hints_available");
                    editor.setCursorPos(cmPos.line, cmPos.ch+word.length - 1);
                }

                // temp call - CodeHintManager.showHint should be called by an event.
    // TODO: register event handler to show suggestions
    // look at event.target for the marker span the user clicked, or you can call a CM API to find out what ch/line offset the event's cursor pos lies at
    // [18:15] <@pflynn> yep.  I'm not sure what the best way is to map from the span back to the appropriate text offset, but there might be a CM API for that

    
                // immediately pop up the attribute value hint.
                CodeHintManager.showHint(editor);                    

            }
        }
        
        
    };
    
    // -----------------------------------------
    // initiate spell check
    // -----------------------------------------  
    var _check_spelling = function () {
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
     * hint getQueryInfo() will be called. getQueryInfo()examines
     * the state of the editor and returns a search query object with a filter string if hints 
     * can be provided. search() will then be called  to create a 
     * list of hints for the search query. When the user chooses a hint handleSelect() is called
     * so that the hint provider can insert the hint into the editor.
     *
     * @param {Object.< getQueryInfo: function(editor, cursor),
     *                  search: function(string),
     *                  handleSelect: function(string, Editor, cursor, closeHints),
     *                  shouldShowHintsOnKey: function(string)>}
     *
     * Parameter Details:
     * - getQueryInfo - examines cursor location of editor and returns an object representing
     *      the search query to be used for hinting. queryStr is a required property of the search object
     *      and a client may provide other properties on the object to carry more context about the query.
     * - search - takes a query object and returns an array of hint strings based on the queryStr property
     *      of the query object.
     * - handleSelect - takes a completion string and inserts it into the editor near the cursor
     *      position
     * - shouldShowHintsOnKey - inspects the char code and returns true if it wants to show code hints on that key.
     */
    function SpellingHints() {}

    /**
     * Get the spelling hints for a given word
     * @param {Object.<queryStr: string, ...} query -- a query object with a required property queryStr 
     *     that will be used to filter out code hints
     * @return {Array.<string>}
     */    
    SpellingHints.prototype.search = function (query) {
//        var result = $.map(atdResult.suggestions, function (value, key) {
//            // filter atdResult against word
//            // create map, suggestions to word by using query.queryStr
//        }).sort(); // TODO rank results
        var i,
            returnObject = [];
        for (i = 0; i < atdResult.suggestions.length; i++) {
            var suggestion = atdResult.suggestions[i];
            debugger
            
            if(query.queryStr.match(suggestion.matcher)){
                var j;
                for (j = 0; j < suggestion.suggestions.length; j++) {
                    debugger  
                    returnObject.push(suggestion.suggestions[j]);    
                }
            }
            
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

        // TODO figure out how to create a query object to find hints for a 
        // given word
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
        var savedCursor= cursor;
        var boundaries= findWordBoundariesForCursor(editor, cursor);

        if (boundaries.start.ch !== boundaries.end.ch) {
            editor.document.replaceRange(completion, boundaries.start, boundaries.end);
        } else {
            editor.document.replaceRange(completion, boundaries.start);
        }

    };
    
    function findWordBoundariesForCursor(editor, cursor){
        var start = {line: -1, ch: -1},
            end = {line: -1, ch: -1},
            cm = editor._codeMirror,
            token, keepSearchingForWordStart = true,
            keepSearchingForWordEnd = true,
            prevToken;

        
        end.line = start.line = cursor.line;
        start.ch = cursor.ch; 
        end.ch = start.ch + 1;
        token = cm.getRange(start, end);
        
        while(keepSearchingForWordStart){
            var match = token.match(/[\s$,\.\=\!]\S/);
            if(match){
                start.ch = start.ch + 1;
                keepSearchingForWordStart = false;                
            }else{
                start.ch = start.ch - 1;
            }
            prevToken = token;
            token = cm.getRange(start, end);
            if(prevToken.valueOf() === token.valueOf()){
                keepSearchingForWordStart = false;  
            }    
        }
        while(keepSearchingForWordEnd){
            var match = token.match(/\S[\s$,\.\=\!]/);
            if(match){
                end.ch = end.ch - 1;
                keepSearchingForWordEnd = false;
            }else{
                end.ch = end.ch + 1;
            }
            prevToken = token;
            token = cm.getRange(start, end);   
            if(prevToken.valueOf() === token.valueOf()){
                keepSearchingForWordEnd = false; 
            }
        }  
        return {start: start, end: end}
    }

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
    
});