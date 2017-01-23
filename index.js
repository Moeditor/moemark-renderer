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
const mj = require('mathjax-node');

let defaultCache = {
    data: {},
    get(key) {
        return this.data[key];
    },
    set(key, val) {
        this.data[key] = val;
    }
};

function escapeHTML(s) {
  // Code from http://stackoverflow.com/questions/5251520/how-do-i-escape-some-html-in-javascript/5251551
  return s.replace(/[^0-9A-Za-z ]/g, (c) => {
    return "&#" + c.charCodeAt(0) + ";";
  });
}

let config = {
  highlight: (code, lang, cb) => {
    try {
        if (!lang || lang == '') cb(highlightjs.highlightAuto(code).value);
        else cb(highlightjs.highlight(lang, code).value);
    } catch(e) {
        cb(escapeHTML(code));
    }
  }
};

function render(s, options, cb) {
	if (!cb) cb = options, options = {};
	if (!s.trim()) return cb('');

    let mathCnt = 0, mathPending = 0, maths = new Array(), hlCnt = 0, hlPending = 0, hls = new Array(), res, callback, ss, cache = render.cache, cacheOption = render.cacheOption, finished = false;
    if (cacheOption.result) {
        let x = cache.get('RES_' + s);
        if (x !== undefined) return cb(x);
    }

    MoeMark.setOptions(Object.assign({
        lineNumber: false,
        math: true,
        highlight: function(code, lang) {
            if (cacheOption.highlight) {
                let x = cache.get('H_' + lang + '_' + code);
                if (x !== undefined) return x;
            }
            let id = hlCnt;
            hlCnt++, hlPending++;
            config.highlight(code, lang, res => {
                hls[id] = res;
                if (cacheOption.highlight) cache.set('H_' + lang + '_' + code, res);
                if (!--hlPending) finish();
            });
            return '<span id="hl-' + id + '"></span>';
        },
        mathRenderer: function(str, display) {
            if (cacheOption.math) {
                let x = cache.get('M_' + display + '_' + str);
                if (x !== undefined) return x;
            }
            try {
                let res = katex.renderToString(str, { displayMode: display });
                if (cacheOption.math) cache.set('M_' + display + '_' + str, res);
                return res;
            } catch (e) {
                // console.log(e);
                const id = mathCnt;
                mathCnt++, mathPending++;
                mj.typeset({
                    math: str,
                    format: display ? 'TeX' : 'inline-TeX',
                    svg: true,
                    width: 0
                }, function (data) {
                    if (data.errors) maths[id] = '<p><div style="display: inline-block; border: 1px solid #000; "><strong>' + data.errors.toString() + '</strong></div></p>';
                    else if (display) maths[id] = '<p style="text-align: center; ">' + data.svg + '</p>';
                    else maths[id] = data.svg;
                    if (cacheOption.math) cache.set('M_' + display + '_' + str, maths[id]);
                    if (!--mathPending) finish();
                });

                return '<span id="math-' + id + '"></span>';
            }
        }
    }, options));

    function finish() {
        if (finished || !res || mathPending || hlPending) return;
        finished = true;
        if (maths.length || hls.length) {
            let x = require('jsdom').jsdom().createElement('div');
            x.innerHTML = res;
            for (let i = 0; i < maths.length; i++) {
              x.querySelector('#math-' + i).outerHTML = maths[i];
            }
            for (let i = 0; i < hls.length; i++) {
              x.querySelector('#hl-' + i).outerHTML = hls[i];
            }
            res = x.innerHTML;
        }
        if (cacheOption.result) cache.set('RES_' + s, res);
        cb(res);
    }

    try {
        res = MoeMark(s);
        if (mathPending == 0 && hlPending == 0) {
            finish();
        }
    } catch(e) {
        cb(e);
    }
};

render.moemark = MoeMark;
render.cache = defaultCache;
render.cacheOption = {
    highlight: true,
    math: true,
    result: false
};
render.config = config;

module.exports = render;
