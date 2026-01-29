"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _request_1 = __importDefault(require("../util/request.js"));
const _util_1 = require("../util/index.js");
const cheerio_1 = __importDefault(require("cheerio"));
const Router = {
    async ['/']({ query }) {
        var _a;
        const { id } = query;
        const playListRes = await (0, _request_1.default)(`http://m.music.migu.cn/migu/remoting/query_playlist_by_id_tag?onLine=1&queryChannel=0&createUserId=migu&contentCountMin=5&playListId=${id}`);
        const listInfo = (_a = playListRes === null || playListRes === void 0 ? void 0 : playListRes.rsp) === null || _a === void 0 ? void 0 : _a.playList[0];
        if (!listInfo) {
            return {
                result: 200,
                errMsg: playListRes.info || '服务异常',
            };
        }
        const { playListName: name, createName, createUserId, playCount, contentCount, image: picUrl, summary: desc, createTime, updateTime, tagLists, playListType } = listInfo;
        const baseInfo = {
            name,
            id,
            picUrl,
            playCount,
            trackCount: contentCount,
            desc,
            creator: {
                id: createUserId,
                name: createName || '',
            },
            createTime,
            updateTime,
            tagLists,
            list: [],
        };
        const cids = [];
        let pageNo = 1;
        while ((pageNo - 1) * 20 < contentCount) {
            const listPage = await (0, _request_1.default)(`https://music.migu.cn/v3/music/playlist/${id}?page=${pageNo}`, {
                dataType: 'raw',
            });
            const $ = cheerio_1.default.load(listPage);
            $('.row.J_CopySong').each((i, v) => cids.push((0, cheerio_1.default)(v).attr('data-cid')));
            pageNo += 1;
        }
        // const { contentList = []} = await request.send(`http://m.music.migu.cn/migu/remoting/playlistcontents_query_tag?playListType=${playListType}&playListId=${id}&contentCount=${contentCount}`)
        baseInfo.list = await (0, _util_1.getBatchSong)(cids);
        return {
            result: 100,
            data: baseInfo,
        };
        // for (let i in res.contentList) {
        //   const { songId } = contentList[i];
        //   const s = await require('./song')['/']({ req: { query: { id: songId }}}, request).catch(() => null);
        //   console.log(s);
        //   s && baseInfo.list.push(s);
        // }
        // Promise.all(contentList.map(({ songId }) => (
        //
        // ))).then((resArr) => {
        //   baseInfo.list = resArr.map(({ data }) => data).filter((o) => Boolean(o));
        //   return res.send({
        //     result: 100,
        //     data: baseInfo,
        //   })
        // })
    },
};
exports.default = Router;
