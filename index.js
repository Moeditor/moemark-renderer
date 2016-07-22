/*
 *  This file is part of moemark-renderer.
 *
 *  Copyright (c) 2016 Menci <huanghaorui301@gmail.com>
 *
 *  moemark-renderer is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  moemark-renderer is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with moemark-renderer. If not, see <http://www.gnu.org/licenses/>.
 */

const MoeMark = require('moemark');
const highlightjs = require('highlight.js');
const katex = require('katex');

MoeMark.setOptions({
    lineNumber: false,
    math: true,
    highlight: function(code, lang) {
        try {
            if (!lang || lang == '') res = highlightjs.highlightAuto(code).value;
            else res = highlightjs.highlight(lang, code).value;
        } catch(e) {
            res = code;
        }
        return res;
    },
    mathRenderer: function(str, display) {
        try {
            return katex.renderToString(str, { displayMode: display });
        } catch(e) {
            return '<div style="display: inline-block; border: 1px solid #000; "><strong>' + e.toString() + '</strong></div>';
        }
    }
});

module.exports = function(s) {
    return MoeMark(s);
};
