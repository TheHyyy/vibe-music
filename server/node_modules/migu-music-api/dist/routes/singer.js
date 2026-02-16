"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio_1 = __importDefault(require("cheerio"));
const _request_1 = __importDefault(require("../util/request.js"));
const _util_1 = require("../util/index.js");
const Router = {
    async ['/desc']({ query }) {
        const { id } = query;
        if (!id) {
            return {
                result: 500,
                errMsg: 'id ?'
            };
        }
        const result = await (0, _request_1.default)(`http://music.migu.cn/v3/music/artist/${id}`, { dataType: 'raw' });
        const $ = cheerio_1.default.load(result);
        const name = $('.artist-info .artist-name a').text();
        const picUrl = $('.artist-info .artist-avatar img').attr('src');
        const desc = $('#J_ArtistIntro .content').text();
        return {
            result: 100,
            data: {
                name,
                picUrl,
                id,
                desc,
            },
        };
    },
    async ['/songs']({ query }) {
        const { id, pageno, pageNo } = query;
        let page = pageNo || pageno || 1;
        if (!id) {
            return {
                result: 500,
                errMsg: 'id ?'
            };
        }
        const result = await (0, _request_1.default)(`http://music.migu.cn/v3/music/artist/${id}/song?page=${page}`, { dataType: 'raw' });
        const $ = cheerio_1.default.load(result);
        const list = [];
        $('.songlist-body .J_CopySong').each((i, o) => {
            const $song = (0, cheerio_1.default)(o);
            const artists = [];
            $song.find('.J_SongSingers a').each((i, o) => {
                artists.push({
                    id: (0, _util_1.getId)((0, cheerio_1.default)(o).attr('href')),
                    name: (0, cheerio_1.default)(o).text()
                });
            });
            const $album = $song.find('.song-belongs a').first();
            const album = {
                id: (0, _util_1.getId)($album.attr('href')),
                name: $album.text(),
            };
            list.push({
                id: $song.attr('data-mid'),
                cid: $song.attr('data-cid'),
                name: $song.find('.song-name-txt').text(),
                artists,
                album,
            });
        });
        const pageList = [1];
        $('.views-pagination .pagination-item').each((i, p) => {
            const $page = (0, cheerio_1.default)(p).text();
            pageList.push(Number($page || 0));
        });
        return {
            result: 100,
            data: {
                list,
                totalPage: Math.max(...pageList),
            }
        };
    },
    async ['/albums']({ query }) {
        const { id, pageNo = 1, pageno = pageNo } = query;
        if (!id) {
            return {
                result: 500,
                errMsg: 'id ?'
            };
        }
        const result = await (0, _request_1.default)(`http://music.migu.cn/v3/music/artist/${id}/album?page=${pageno}`, { dataType: 'raw' });
        const $ = cheerio_1.default.load(result);
        const list = [];
        $('.artist-album-list li').each((i, o) => {
            const $album = (0, cheerio_1.default)(o);
            const artists = [];
            $album.find('.album-singers a').each((i, o) => {
                artists.push({
                    id: (0, _util_1.getId)((0, cheerio_1.default)(o).attr('href')),
                    name: (0, cheerio_1.default)(o).text()
                });
            });
            list.push({
                id: (0, _util_1.getId)($album.find('.thumb-link').attr('href')),
                picUrl: $album.find('img.thumb-img').attr('data-original'),
                name: $album.find('.album-name').text(),
                artists,
            });
        });
        const pageList = [1];
        $('.views-pagination .pagination-item').each((i, p) => {
            const $page = (0, cheerio_1.default)(p).text();
            pageList.push(Number($page || 0));
        });
        return {
            result: 100,
            data: { list, totalPage: Math.max(...pageList) },
        };
    },
};
exports.default = Router;
