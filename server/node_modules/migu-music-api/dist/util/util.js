"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBatchSong = exports.getId = exports.changeUrlQuery = exports.getQueryFromUrl = void 0;
const _request_1 = __importDefault(require("./request.js"));
function getQueryFromUrl(key, search) {
    try {
        const sArr = search.split('?');
        let s = '';
        if (sArr.length > 1) {
            s = sArr[1];
        }
        else {
            return key ? undefined : {};
        }
        const querys = s.split('&');
        const result = {};
        querys.forEach((item) => {
            const temp = item.split('=');
            result[temp[0]] = decodeURIComponent(temp[1]);
        });
        return key ? result[key] : result;
    }
    catch (err) {
        // 除去search为空等异常
        return key ? '' : {};
    }
}
exports.getQueryFromUrl = getQueryFromUrl;
function changeUrlQuery(obj, baseUrl = '') {
    const query = getQueryFromUrl(null, baseUrl);
    let url = baseUrl.split('?')[0];
    const newQuery = Object.assign(Object.assign({}, query), obj);
    let queryArr = [];
    Object.keys(newQuery).forEach((key) => {
        if (newQuery[key] !== undefined && newQuery[key] !== '') {
            queryArr.push(`${key}=${encodeURIComponent(newQuery[key])}`);
        }
    });
    return `${url}?${queryArr.join('&')}`.replace(/\?$/, '');
}
exports.changeUrlQuery = changeUrlQuery;
function getId(url = '/') {
    return url.match(/\/([^\/]+)$/)[1];
}
exports.getId = getId;
async function getBatchSong(cids = []) {
    const songs = await (0, _request_1.default)(`https://music.migu.cn/v3/api/music/audioPlayer/songs?type=1&copyrightId=${cids.join(',')}`).catch(() => ({ items: [] }));
    return (songs.items || []).map(({ copyrightId, length = '00:00:00', songName, singers = [], albums = [], mvList = [], songId }) => ({
        id: songId,
        cid: copyrightId,
        name: songName,
        artists: singers.map(({ artistId, artistName }) => ({ id: artistId, name: artistName })),
        album: albums[0] ? { id: albums[0].albumId, name: albums[0].albumId } : undefined,
        duration: (length || '00:00:00').split(':').reduce((t, v, i) => t + Number(v) * Math.pow(60, 2 - i), 0),
        mvId: mvList[0] ? mvList[0].mvId : undefined,
        mvCid: mvList[0] ? mvList[0].copyrightId : undefined,
    }));
}
exports.getBatchSong = getBatchSong;
