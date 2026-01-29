"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const search_1 = __importDefault(require("./search"));
const _util_1 = require("../util/index.js");
const Router = {
    async ['/']({ query }) {
        const { cid } = query;
        if (!cid) {
            return {
                result: 500,
                errMsg: 'cid ?',
            };
        }
        let song = (await (0, _util_1.getBatchSong)([cid]))[0];
        song = await _util_1.songSaver.query(cid, song);
        return {
            result: 100,
            data: song,
        };
    },
    async ['/url']({ query, res }) {
        const { cid, flac = '0', isRedirect = '0' } = query;
        if (!cid) {
            return {
                result: 500,
                errMsg: 'cid ?',
            };
        }
        const info = await _util_1.songSaver.query(cid);
        let url = info[128] || '';
        if (flac / 1) {
            url = info.flac || url;
        }
        if (isRedirect / 1) {
            res.redirect(url);
            return true;
        }
        return {
            result: 100,
            data: url,
        };
    },
    async ['/find']({ query, res }) {
        var _a;
        const { keyword, duration = 0, noMatch = '' } = query;
        if (!keyword) {
            return {
                result: 500,
                errMsg: '搜啥呢？',
            };
        }
        const noMatchArr = noMatch.split(',');
        const songRes = await search_1.default['/']({ query: { keyword }, res }).catch(() => ({}));
        // @ts-ignore
        const songList = ((_a = songRes === null || songRes === void 0 ? void 0 : songRes.data) === null || _a === void 0 ? void 0 : _a.list) || [];
        let s;
        console.log(songRes);
        if (songList.length) {
            if (Number(duration)) {
                const cids = songList
                    .splice(0, noMatch.length + 5)
                    .filter(({ cid }) => !noMatchArr.includes(cid))
                    .map(({ cid }) => cid);
                const list = await (0, _util_1.getBatchSong)(cids);
                console.log(list);
                s = list.find(({ duration: d }) => d <= (Number(duration) + 3) && d >= (duration - 3));
            }
            else {
                console.log('====', songList);
                s = songList[0];
            }
        }
        s && s.cid && (s = await _util_1.songSaver.query(s.cid, s));
        return {
            result: 100,
            data: s,
        };
    },
};
exports.default = Router;
