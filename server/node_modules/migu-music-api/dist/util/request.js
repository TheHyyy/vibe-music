"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const axios_1 = __importDefault(require("axios"));
const xml2js = __importStar(require("xml2js"));
const util_1 = require("./util");
const request = async (options, opts = {}) => {
    try {
        if (typeof options === 'string') {
            options = { url: options };
        }
        options.method = options.method || 'get';
        const { url, data, method } = options;
        const { dataType } = opts;
        if (method === 'get') {
            options.url = (0, util_1.changeUrlQuery)(data, url);
            delete options.data;
        }
        // const cookieObj: object = (Number(query.ownCookie) ? cookies : userCookie) || {};
        options.headers = options.headers || {};
        options.headers.referer = options.headers.referer || 'http://m.music.migu.cn/v3';
        options.xsrfCookieName = 'XSRF-TOKEN';
        options.withCredentials = true;
        // options.headers.Cookie = Object.keys(cookieObj).map((k: string): string => `${k}=${cookieObj[k]}`).join('; ');
        //@ts-ignore
        const res = await (0, axios_1.default)(options);
        if (dataType === 'xml') {
            return handleXml(res.data);
        }
        if (dataType === 'raw') {
            return res.data;
        }
        if (typeof res.data === 'string') {
            res.data = res.data.replace(/callback\(|MusicJsonCallback\(|jsonCallback\(|\)$/g, '');
            return JSON.parse(res.data);
        }
        return res.data;
    }
    catch (err) {
        if (err.message === 'Request failed with status code 503') {
            console.log('retry');
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(request(options, opts));
                }, 300);
            });
        }
        return {};
    }
};
exports.default = request;
function handleXml(data) {
    return new Promise((resolve, reject) => {
        const handleObj = (obj) => {
            Object.keys(obj).forEach((k) => {
                const v = obj[k];
                if ((typeof v).toLowerCase() === 'object' && v instanceof Array && v.length === 1) {
                    obj[k] = v[0];
                }
                if ((typeof obj[k]).toLowerCase() === 'object') {
                    handleObj(obj[k]);
                }
            });
        };
        xml2js.parseString(data, (err, result) => {
            handleObj(result);
            resolve(result);
        });
    });
}
