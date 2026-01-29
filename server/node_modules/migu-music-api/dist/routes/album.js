"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _request_1 = __importDefault(require("../util/request.js"));
const cheerio_1 = __importDefault(require("cheerio"));
const _util_1 = require("../util/index.js");
const Router = {
    async ['/']({ query }) {
        const { id } = query;
        if (!id) {
            return {
                result: 500,
                errMsg: 'id ?'
            };
        }
        const result = await (0, _request_1.default)(`http://music.migu.cn/v3/music/album/${id}`, {
            dataType: 'raw',
        });
        const $ = cheerio_1.default.load(result);
        const desc = $('.content .intro').text();
        const name = $('.content .title').text();
        const publishTime = $('.content .pub-date').text().replace(/[^\d|-]/g, '');
        const picUrl = $('.mad-album-info .thumb-img').attr('src');
        const songList = [];
        const artists = [];
        const company = $('.pub-company').text().replace(/^发行公司：/, '');
        $('.singer-name a').each((i, o) => {
            artists.push({
                id: (0, _util_1.getId)((0, cheerio_1.default)(o).attr('href')),
                name: (0, cheerio_1.default)(o).text()
            });
        });
        $('.songlist-body .J_CopySong').each((i, o) => {
            const ar = [];
            const $song = (0, cheerio_1.default)(o);
            $song.find('.song-singers a').each((i, o) => {
                ar.push({
                    id: (0, _util_1.getId)((0, cheerio_1.default)(o).attr('href')),
                    name: (0, cheerio_1.default)(o).text()
                });
            });
            songList.push({
                name: $song.find('.song-name-txt').text(),
                id: $song.attr('data-mid'),
                cid: $song.attr('data-cid'),
                artists: ar,
                album: {
                    name,
                    id,
                }
            });
        });
        const data = {
            name,
            id,
            artists,
            company,
            publishTime,
            picUrl,
            desc,
            songList,
        };
        return {
            result: 100,
            data,
        };
    },
    async ['/songs']({ query }) {
        const { id } = query;
        if (!id) {
            return {
                result: 500,
                errMsg: 'id ？'
            };
        }
        const result = await (0, _request_1.default)(`http://m.music.migu.cn/migu/remoting/cms_album_song_list_tag?albumId=${id}&pageSize=100`);
        const data = result.result.results.map(({ picM, listenUrl, singerId, singerName, songId, songName, mvCopyrightId, copyrightId }) => ({
            picUrl: picM,
            url: listenUrl,
            id: songId,
            cid: copyrightId,
            mvCid: mvCopyrightId,
            name: songName,
            artists: singerId.map((id, i) => ({
                id,
                name: singerName[i],
            }))
        }));
        return {
            result: 100,
            data,
        };
    },
};
exports.default = Router;
