"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _request_1 = __importDefault(require("../util/request.js"));
const Router = {
    async ['/playlist']({ query }) {
        var _a;
        const { pageNo = 1, type = 1 } = query;
        let pageSize = 10;
        const typeMap = {
            2: 15127272,
            1: 15127315, // 推荐
        };
        const result = await (0, _request_1.default)(`http://m.music.migu.cn/migu/remoting/playlist_bycolumnid_tag?playListType=2&type=1&columnId=${typeMap[type]}&tagId=&startIndex=${(pageNo - 1) * pageSize}`);
        const list = result.retMsg.playlist.map(({ summary, image, createName, playCount, contentCount, createUserId, playListName, playListId }) => ({
            name: playListName,
            id: playListId,
            picUrl: image,
            playCount: playCount,
            songCount: Number(contentCount),
            creator: {
                name: createName,
                id: createUserId,
            },
            intro: summary,
        }));
        return {
            result: 100,
            data: {
                list,
                total: (_a = result.retMsg) === null || _a === void 0 ? void 0 : _a.countSize,
            }
        };
    }
};
exports.default = Router;
