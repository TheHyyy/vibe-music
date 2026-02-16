"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _request_1 = __importDefault(require("../util/request.js"));
const Router = {
    async ['/']({ query }) {
        query.type = query.type || 'song';
        if (!query.keyword) {
            return {
                result: 500,
                errMsg: '搜啥呢？',
            };
        }
        const { keyword, pageno = 1, pageNo = pageno, pageSize = 20 } = query;
        const typeMap = {
            song: 2,
            singer: 1,
            album: 4,
            playlist: 6,
            mv: 5,
            lyric: 7,
        };
        const result = await (0, _request_1.default)({
            url: 'https://m.music.migu.cn/migu/remoting/scr_search_tag',
            data: {
                keyword,
                pgc: pageNo,
                rows: pageSize,
                type: typeMap[query.type],
            },
        });
        if (!result) {
            return {
                result: 100,
                data: {
                    list: [],
                    total: 0,
                },
            };
        }
        let data;
        switch (query.type) {
            case 'lyric':
            case 'song':
                data = (result.musics || []).map(({ songName, singerId, singerName, albumName, albumId, mp3, cover, id, copyrightId, mvId, mcCopyrightId }) => {
                    const singerIds = singerId.replace(/\s/g, '').split(',');
                    const singerNames = singerName.replace(/\s/g, '').split(',');
                    const artists = singerIds.map((id, i) => ({ id, name: singerNames[i] }));
                    return {
                        name: songName,
                        id,
                        cid: copyrightId,
                        mvId,
                        mvCid: mcCopyrightId,
                        url: mp3,
                        album: {
                            picUrl: cover,
                            name: albumName,
                            id: albumId,
                        },
                        artists,
                    };
                });
                break;
            case 'singer':
                data = result.artists.map(({ title, id, songNum, albumNum, artistPicM }) => ({
                    name: title,
                    id,
                    picUrl: artistPicM,
                    songCount: songNum,
                    albumCount: albumNum,
                }));
                break;
            case 'album':
                data = result.albums.map(({ albumPicM, singer, songNum, id, publishDate, title }) => ({
                    name: title,
                    id,
                    artists: singer,
                    songCount: songNum,
                    publishTime: publishDate,
                    picUrl: albumPicM,
                }));
                break;
            case 'playlist':
                data = result.songLists.map(({ name, img, id, playNum, musicNum, userName, userId, intro }) => ({
                    name,
                    id,
                    picUrl: img,
                    playCount: playNum,
                    songCount: musicNum,
                    intro,
                    creator: {
                        name: userName,
                        id: userId,
                    }
                }));
                break;
            case 'mv':
                data = result.mv.map(({ songName, id, mvCopyrightId, mvId, copyrightId, albumName, albumId, singerName, singerId }) => {
                    const singerIds = singerId.replace(/\s/g, '').split(',');
                    const singerNames = singerName.replace(/\s/g, '').split(',');
                    const artists = singerIds.map((id, i) => ({ id, name: singerNames[i] }));
                    return {
                        name: songName,
                        id,
                        mvId,
                        cid: copyrightId,
                        mvCid: mvCopyrightId,
                        album: {
                            name: albumName,
                            id: albumId,
                        },
                        artists,
                    };
                });
                break;
        }
        return {
            result: 100,
            data: {
                list: data,
                total: result.pgt,
            },
        };
    },
};
exports.default = Router;
