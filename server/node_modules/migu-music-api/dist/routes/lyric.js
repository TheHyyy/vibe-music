"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _request_1 = __importDefault(require("../util/request.js"));
const Router = {
    async ['/']({ query }) {
        const { cid } = query;
        if (!cid) {
            return {
                result: 500,
                errMsg: 'cid呢小老弟',
            };
        }
        const result = await (0, _request_1.default)(`http://music.migu.cn/v3/api/music/audioPlayer/getLyric?copyrightId=${cid}`);
        if (result.msg === '成功') {
            return {
                result: 100,
                data: result.lyric,
            };
        }
        return {
            result: 200,
            errMsg: result.msg || '',
        };
    },
};
exports.default = Router;
