/*
 * Copyright (c) 2012 Jochen Hagenstroem. All rights reserved.
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, window */

define(function (require, exports, module) {
    'use strict';
/*
 * AtDCore.js -     writing check with After the Deadline for Adobe brackets
 * Author      : Jochen Hagenstroem
 * License     : LGPL or MIT License (take your pick)
 * Project     :  http://www.afterthedeadline.com/development.slp
 * Contact     : raffi@automattic.com
 *
 * Derived from 
 *
 * jquery.atd.js -  writing check with After the Deadline
 * Author      : Raphael Mudge, Automattic Inc.
 * License     : LGPL or MIT License (take your pick)
 * Project     :  http://www.afterthedeadline.com/development.slp
 * Contact     : raffi@automattic.com
 *
 * Derived from: 
 *
 * jquery.spellchecker.js - a simple jQuery Spell Checker
 * Copyright (c) 2008 Richard Willis
 * MIT license  : http://www.opensource.org/licenses/mit-license.php
 * Project      : http://jquery-spellchecker.googlecode.com
 * Contact      : willis.rh@gmail.com
 */
    var atDCore       = require("AtDCore");

    var AtD =
        {
            rpc : 'http://service.afterthedeadline.com', /* see the proxy.php that came with the AtD/TinyMCE plugin */
            rpc_css : 'http://www.polishmywriting.com/atd-jquery/server/proxycss.php?data=', /* you may use this, but be nice! */
            rpc_css_lang : 'en',
            api_key : 'bracketsSpellCheck',
            i18n : {},
            listener : {}
        };
    
    AtD.getLang = function (key, defaultk) {
        if (AtD.i18n[key] === undefined) {
            return defaultk;
        }
        return AtD.i18n[key];
    };
    
    AtD.addI18n = function (localizations) {
        AtD.i18n = localizations;
        AtD.core.addI18n(localizations);
    };
    
    AtD.setIgnoreStrings = function (string) {
        AtD.core.setIgnoreStrings(string);
    };
    
    AtD.showTypes = function (string) {
        AtD.core.showTypes(string);
    };
    

    
    /* check a div for any incorrectly spelled words */
    AtD.check = function (text, callback_f) {
        /* checks if a global var for click stats exists and increments it if it does... */
//        if (typeof AtD_proofread_click_count !== "undefined") {
//            AtD_proofread_click_count = AtD_proofread_click_count + 1;
//        }
    
        AtD.callback_f = callback_f; /* remember the callback for later */
    
        text     = encodeURIComponent(text); /* re-escaping % is not necessary here. don't do it */
    
        $.ajax({
            type : "POST",
            url : AtD.rpc + '/checkDocument',
            data : 'key=' + AtD.api_key + '&data=' + text,
            format : 'raw',
            dataType : "xml",
    
            error : function (XHR, status, error) {
                if (AtD.callback_f !== undefined && AtD.callback_f.error !== undefined) {
                    AtD.callback_f.error(status + ": " + error);
                }
            },
        
            success : function (data) {
                /* apparently IE likes to return XML as plain text-- work around from:
                   http://docs.jquery.com/Specifying_the_Data_Type_for_AJAX_Requests */
    
                var xml;
                if (typeof data === "string") {
                    xml = new ActiveXObject("Microsoft.XMLDOM");
                    xml.async = false;
                    xml.loadXML(data);
                } else {
                    xml = data;
                }
    
                if (AtD.core.hasErrorMessage(xml)) {
                    if (AtD.callback_f !== undefined && AtD.callback_f.error !== undefined) {
                        AtD.callback_f.error(AtD.core.getErrorMessage(xml));
                    }
                    return;
                }
    
                /* on with the task of processing and highlighting errors */
                var results = AtD.core.processXML(xml);
                if (AtD.callback_f !== undefined && AtD.callback_f.markMyWords !== undefined) {
                    AtD.callback_f.markMyWords(results);
                }
                if (AtD.callback_f !== undefined && AtD.callback_f.ready !== undefined) {
                    AtD.callback_f.ready(results.count);
                }
                if (results.count === 0 && AtD.callback_f !== undefined && AtD.callback_f.success !== undefined) {
                    AtD.callback_f.success(results.count);
                }
                AtD.counter = results.count;
                AtD.count   = results.count;
            }
        });
    };
        

    
    /*
     * Set prototypes used by AtD Core UI 
     */
    AtD.initCoreModule = function () {
        var core = new AtDCore();
    
        core.hasClass = function (node, className) {
            return $(node).hasClass(className);
        };
    
        core.map = $.map;
    
        core.contents = function (node) {
            return $(node).contents();
        };
    
        core.replaceWith = function (old_node, new_node) {
            return $(old_node).replaceWith(new_node);
        };
    
        core.findSpans = function (parent) {
            return $.makeArray(parent.find('span'));
        };
    
        core.create = function (node_html, isTextNode) {
            return $('<span class="mceItemHidden">' + node_html + '</span>');
        };
    
        core.remove = function (node) {
            return $(node).remove();
        };
    
        core.removeParent = function (node) {
            /* unwrap exists in jQuery 1.4+ only. Thankfully because replaceWith as-used here won't work in 1.4 */
            if ($(node).unwrap) {
                return $(node).contents().unwrap();
            } else {
                return $(node).replaceWith($(node).html());
            }
        };
    
        core.getAttrib = function (node, name) {
            return $(node).attr(name);
        };
    
        return core;
    };
    
    AtD.core = AtD.initCoreModule();

    module.exports.AtD = AtD;
   
});