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

/* Texxt wih typpoos. Its making sense, don't it? */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, btoa, atob */

define(function (require, exports, module) {
    'use strict';

    // Brackets modules
    var EditorManager   = brackets.getModule("editor/EditorManager");
    var CommandManager  = brackets.getModule("command/CommandManager");
    var Menus           = brackets.getModule("command/Menus");
    var StringUtils     = brackets.getModule("utils/StringUtils");
    
    var spellCheck       = require("AtD");


    var CHECK_SPELLING = "check_spelling";

    var _getActiveSelection = function () {
        return EditorManager.getFocusedEditor().getSelectedText();
    };

    var _replaceActiveSelection = function (text) {
        EditorManager.getFocusedEditor()._codeMirror.replaceSelection(text);
    };
    
    var resultHandler = [];
    resultHandler.ready = function (count) {
        console.log("ready called: count " + count);
    };
    
    resultHandler.success = function (count) {
        console.log("success called: count " + count);
    };

    var _check_spelling = function () {
        var s = _getActiveSelection();
        if (s !== undefined && s !== "") {
            spellCheck.AtD.check(s, resultHandler);
        } else {
            var placeholder = 1;
            // TODO 
        }
    };

    var buildMenu = function (m) {
        m.addMenuDivider();
        m.addMenuItem(CHECK_SPELLING);
    };

    CommandManager.register("Check Spelling", CHECK_SPELLING, _check_spelling);


    var menu = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);
    buildMenu(menu);

    var contextMenu = Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU);
    buildMenu(contextMenu);
});