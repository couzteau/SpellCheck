/*
 * Copyright (c) 2013 Jochen Hagenstroem. All rights reserved.
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

/*  texxt inlude  wih typos d makes  sense? tea is four  exclusive members only? */
/*jslint vars: true, plusplus: true, devel: true, nomen: true,  regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, btoa, atob, CodeMirror */


/* select language from the env or detect language */

define(function (require, exports, module) {
    'use strict';


    // Brackets modules
    var CodeHintManager = brackets.getModule("editor/CodeHintManager"),
        EditorManager = brackets.getModule("editor/EditorManager"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        CommandManager = brackets.getModule("command/CommandManager"),
        Menus = brackets.getModule("command/Menus"),
        StringUtils = brackets.getModule("utils/StringUtils"),
        TokenUtils = brackets.getModule("utils/TokenUtils"),
        spellCheck = require("AtD");



    var CHECK_SPELLING = "check_spelling",
        CHECK_SPELLING_DE = "check_spelling_de",
        CHECK_SPELLING_FR = "check_spelling_fr",
        CHECK_SPELLING_ES = "check_spelling_es",
        CHECK_SPELLING_PT = "check_spelling_pt",
        CLEAR_SPELLCHECK_MARKERS = "clear_spellcheck_makers";

    var textToCheck = "",
        atdResult,
        targetEditor,
        selectionBoundary,
        textMarkers = [],
        wordErrorMap = [],
        lang = "en",
        hasHints = false,
        resultHandler = [],
        validSelection;

    // -----------------------------------------
    // Code Mirror integration
    // -----------------------------------------
    var _getText = function () {
        var returnText = null,
            ed = EditorManager.getFocusedEditor();
        
        if (ed) {
            returnText = EditorManager.getFocusedEditor().getSelectedText();
            if (!returnText) {
                returnText = ed.document.getText();
            }
        }
        
        return returnText;
    };

    // Maintain backwards compatibity with CodeMirror 2
    function markText(cm, start, end, className) {
        if (CodeMirror.version) {
            // CM3 call
            return cm.markText(start, end, {className: className});
        } else {
            // CM2 call
            return cm.markText(start, end, className);
        }
    }

    function findWordBoundariesForCursor(editor, cursor, currentErr) {
        // [\s$,\.\=\!-_#]

        // Try to use Editor.selectWordAt? - doesn't work as expected.
        // var w = editor.selectWordAt(cursor);
        var start = { line: -1, ch: -1 },
            end = { line: -1, ch: -1 },
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
            match = token.match(/[\s,\.\=\!#\?\-%&\*\+]\w/);
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
                start.ch = start.ch + 1;
            }
        }
        match = null;
        while (keepSearchingForWordEnd) {
            if (currentErr === undefined) {
                match = token.match(/\w[\s,\.\=\!#\?\-%&\*\+]/);
            } else {
                var key;
                for (key in currentErr.pretoks) {
                    if (currentErr.pretoks.hasOwnProperty(key)) {
                        var i;
                        for (i = 0; i < currentErr.pretoks[key].length; i++) {
                            match = token.match(currentErr.pretoks[key][i].regexp);
                            if (match) {
                                break;
                            }
                        }
                    }
                }
                if (!match && currentErr.defaults !== undefined) {
                    var j;
                    for (j = 0; j < currentErr.defaults.length; j++) {
                        match = token.match(currentErr.defaults[j].regexp);
                        if (match) {
                            break;
                        }
                    }
                }
            }
            if (match) {
                if (currentErr === undefined) {
                    end.ch = end.ch - 1;
                }
                keepSearchingForWordEnd = false;
            } else {
                end.ch = end.ch + 1;
            }
            prevToken = token;
            token = cm.getRange(start, end);
            if (prevToken.valueOf() === token.valueOf()) {
                keepSearchingForWordEnd = false;
                // todo return invalid boundary if no good boundary was found                
            }
        }

        return {
            start: start,
            end: end
        };
    }
    
    var _clearSpellcheck;
    
    // -----------------------------------------
    // initiate spell check
    // -----------------------------------------  
    var _check_spelling = function () {
        if (lang === "en") {
            spellCheck.AtD.rpc = 'http://service.afterthedeadline.com';
        }
        if (lang === "de") {
            spellCheck.AtD.rpc = 'http://de.service.afterthedeadline.com';
        }
        if (lang === "fr") {
            spellCheck.AtD.rpc = 'http://fr.service.afterthedeadline.com';
        }
        if (lang === "es") {
            spellCheck.AtD.rpc = 'http://es.service.afterthedeadline.com';
        }
        if (lang === "pt") {
            spellCheck.AtD.rpc = 'http://pt.service.afterthedeadline.com';
        }

        atdResult = null;

        selectionBoundary = [];
        wordErrorMap = [];

        _clearSpellcheck();
        
        textMarkers = [];
        textToCheck = _getText();
        if (textToCheck) {
            spellCheck.AtD.check(textToCheck, resultHandler);
        }
        
        lang = "en";
    };

    var _check_spelling_de = function () {
        lang = "de";
        _check_spelling();
    };
    var _check_spelling_fr = function () {
        lang = "fr";
        _check_spelling();
    };
    var _check_spelling_es = function () {
        lang = "es";
        _check_spelling();
    };
    var _check_spelling_pt = function () {
        lang = "pt";
        _check_spelling();
    };
    _clearSpellcheck = function () {
        var i;
        for (i = 0; i < textMarkers.length; i++) {
            if (textMarkers[i] !== undefined) {
                textMarkers[i].clear();
            }
        }
        textMarkers = [];
    };

    // -----------------------------------------
    // brackets menu item
    // ----------------------------------------- 
    var buildMenu = function (m) {
        m.addMenuDivider();
        m.addMenuItem(CHECK_SPELLING);
        //=====================================================
        // uncomment or comment below to add or switch language
        //=====================================================
        m.addMenuItem(CHECK_SPELLING_DE); // German
        m.addMenuItem(CHECK_SPELLING_FR); // French
        m.addMenuItem(CHECK_SPELLING_ES); // Spanish
        m.addMenuItem(CHECK_SPELLING_PT); // Portugese
        m.addMenuItem(CLEAR_SPELLCHECK_MARKERS); // Clear markers
    };

    CommandManager.register("Check Spelling - English", CHECK_SPELLING, _check_spelling);

    CommandManager.register("Check Spelling - Deutsch", CHECK_SPELLING_DE, _check_spelling_de);

    CommandManager.register("Check Spelling - Français", CHECK_SPELLING_FR, _check_spelling_fr);

    CommandManager.register("Check Spelling - Español", CHECK_SPELLING_ES, _check_spelling_es);

    CommandManager.register("Check Spelling - Português", CHECK_SPELLING_PT, _check_spelling_pt);
    
    CommandManager.register("Clear markers", CLEAR_SPELLCHECK_MARKERS, _clearSpellcheck);


    var menu = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);
    buildMenu(menu);

    var contextMenu = Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU);
    buildMenu(contextMenu);

    // -----------------------------------------
    // AtD result handler
    // -----------------------------------------    

    resultHandler.ready = function (count) {
        //console.log("ready called: count " + count);
    };

    resultHandler.success = function (count) {
        //console.log("success called: count " + count);
    };
    
    function selectionEmpty(selection) {

        return (selection.start.line === selection.end.line &&
               selection.start.ch === selection.end.ch);
    }

    resultHandler.markMyWords = function (results) {
        atdResult = results;
        var suggestionsMap = [];
        // build map from suggestions
        var i;
        for (i = 0; i < atdResult.suggestions.length; i++) {
            var string = atdResult.suggestions[i].string;
            suggestionsMap[string] = atdResult.suggestions[i];
        }

        targetEditor = EditorManager.getCurrentFullEditor();
        var cm = targetEditor._codeMirror;
        var text = targetEditor.document.getText();


        selectionBoundary = targetEditor.getSelection();
        
        var selStart,
            selEnd;
        
        if (!selectionEmpty(selectionBoundary)) {
            validSelection = true;
            selStart = targetEditor.indexFromPos(selectionBoundary.start);
            selEnd = targetEditor.indexFromPos(selectionBoundary.end);
        } else {
            var ed = EditorManager.getFocusedEditor();
            
            validSelection = false;
            selStart = 0;
            selEnd = ed.document.getText().length - 1;
        }
        
        var wordCursor = [];
        i = 0;
        // todo mark repeat words correctly
        var errorWord;
        if (atdResult.count > 0) {
            hasHints = true;
        }

        for (errorWord in atdResult.errors) {
            if (atdResult.errors.hasOwnProperty(errorWord)) {
                var markMore = true;
                // todo update currentCurser in loop
                while (markMore) {
                    var error = atdResult.errors[errorWord];
                    var wrongWord = true,
                        boundaries,
                        token,
                        index,
                        pWord = "",
                        pToken = "",
                        doMark = true;
                    var word = errorWord.replace('__', '');
                    console.log(word);
                    var currentCursor = wordCursor[word];
                    if (currentCursor === undefined) {
                        currentCursor = selStart - 1;
                    }
                    index = text.indexOf(word, currentCursor + 1);
                    if (index > 0) {
                        boundaries = findWordBoundariesForCursor(targetEditor, cm.posFromIndex(index));
                        token = cm.getRange(boundaries.start, boundaries.end);

                        while (wrongWord) {
                            index = text.indexOf(word, currentCursor + 1);
                            var x = selEnd;
                            if (index < 0 || index > selEnd) {
                                markMore = false;
                                doMark = false;
                                wrongWord = false;
                            }
                            if (index > 0 && index < selEnd) {
                                boundaries = findWordBoundariesForCursor(targetEditor, cm.posFromIndex(index));
                                token = cm.getRange(boundaries.start, boundaries.end);
                                if (pToken === token && pWord === word) {
                                    wrongWord = false;
                                    wordCursor[word] = index;
                                    doMark = false;
                                    //console.log("bailing, cannot find the right word boundary to mark for word " + word);
                                }
                                if (token === word) {
                                    wrongWord = false;
                                    wordCursor[word] = index;
                                } else {
                                    pToken = token;
                                    pWord = word;
                                }
                                currentCursor++;
                            } else {
                                wrongWord = false;
                                //console.log("bailing, cannot find the word boundary to mark for word " + word);
                            }
                        }
                        if (markMore && doMark) {

                            var cmPos = cm.posFromIndex(index);
                            // highlight
                            boundaries = findWordBoundariesForCursor(targetEditor, cmPos, error);
                            token = cm.getRange(boundaries.start, boundaries.end);
                            var wordTest = token.split(/\b/);
                            //console.log("token test, token " + token + ", subtokens " + wordTest.length);
                            if (wordTest.length < 5) {
                                wordErrorMap[word] = error;
                                textMarkers[i] = markText(cm, boundaries.start, {
                                    line: boundaries.start.line,
                                    ch: boundaries.start.ch + token.length
                                }, "underline AtD_hints_available");
                                i++;
                                targetEditor.setCursorPos(cmPos.line, cmPos.ch + token.length - 1);
                            }
                        }
                    } else {
                        //console.log(" cannot find more instances of  " + word);  
                        markMore = false;
                    }

                }
            }
        }
    };



    // -----------------------------------------
    // Hint Provider for CodeHintmanager
    // -----------------------------------------
    /**
     * Registers as HintProvider as an object that is able to provide code hints. 
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
        if (query.queryStr !== "") {
            for (i = 0; i < atdResult.suggestions.length; i++) {
                var suggestion = atdResult.suggestions[i];

                if (query.queryStr.match(suggestion.matcher) || suggestion.string.indexOf(query.queryStr) !== -1) {
                    var j;
                    for (j = 0; j < suggestion.suggestions.length; j++) {
                        // TODO check if suggestion is available already
                        if (!suggestionsAdded[suggestion.suggestions[j]]) {
                            returnObject.push(suggestion.suggestions[j]);
                        }
                        suggestionsAdded[suggestion.suggestions[j]] = true;

                    }
                }
            }
            var currentErr = atdResult.errors['__' + query.queryStr];
            if (currentErr !== undefined && currentErr.pretoks && returnObject.length === 0) {
                returnObject.push("No suggestions available");
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
        
        if (validSelection) {
            if (cm.indexFromPos(selectionBoundary.start) <= cm.indexFromPos(boundaries.start) &&
                    cm.indexFromPos(selectionBoundary.end) >= cm.indexFromPos(boundaries.end) - 1) {
            // only return query if word at cursor is in selection
            // else make placebo query
                token = cm.getRange(boundaries.start, boundaries.end);
            } else {
                token = "";
            }
        } else {
            token = cm.getRange(boundaries.start, boundaries.end);
        }

        return {
            queryStr: token
        };
    };

    // -----------------------------------------
    // Register SpellCheck with CodeHintManager
    // -----------------------------------------
    var spellingHints = new SpellingHints();
    CodeHintManager.registerHintProvider(spellingHints, ["all"], 0);

    /**
     * Determines whether HTML tag hints are available in the current editor
     * context.
     * 
     * @param {Editor} editor 
     * A non-null editor object for the active window.
     *
     * @param {String} implicitChar 
     * Either null, if the hinting request was explicit, or a single character
     * that represents the last insertion and that indicates an implicit
     * hinting request.
     *
     * @return {Boolean} 
     * Determines whether the current provider is able to provide hints for
     * the given editor context and, in case implicitChar is non- null,
     * whether it is appropriate to do so.
     */
    SpellingHints.prototype.hasHints = function (editor, implicitChar) {
        return (hasHints && editor === targetEditor);
    };

    SpellingHints.prototype.getHints = function (implicitChar) {
        var token = spellingHints.getQueryInfo(targetEditor, targetEditor.getCursorPos());

        var result = spellingHints.search(token);

        return {
            hints: result,
            match: ".*",
            selectInitial: false
        };
    };

    /**
     * Inserts a given HTML tag hint into the current editor context. 
     * 
     * @param {String} hint 
     * The hint to be inserted into the editor context.
     * 
     * @return {Boolean} 
     * Indicates whether the manager should follow hint insertion with an
     * additional explicit hint request.
     */
    SpellingHints.prototype.insertHint = function (completion) {
        var boundaries = findWordBoundariesForCursor(targetEditor, targetEditor.getCursorPos());
        var cm = targetEditor._codeMirror;
        var word = cm.getRange(boundaries.start, boundaries.end);
        var error = wordErrorMap[word];
        if (error !== undefined) {
            boundaries = findWordBoundariesForCursor(targetEditor, cm.getCursor(), error);
        }
        if (boundaries.start.ch !== boundaries.end.ch) {
            targetEditor.document.replaceRange(completion, boundaries.start, boundaries.end);
        } else {
            targetEditor.document.replaceRange(completion, boundaries.start);
        }

        return false;
    };
    


    // -----------------------------------------
    // Init
    // -----------------------------------------
    function init() {
        ExtensionUtils.loadStyleSheet(module, "styles.css");

        targetEditor = EditorManager.getCurrentFullEditor();
        atdResult = null;
        textMarkers = [];
        selectionBoundary = [];
        wordErrorMap = [];
    }

    init();

});