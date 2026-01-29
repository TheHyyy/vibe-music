"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Router = {
    async ['/']({ res }) {
        res.render('index', { title: '咪咕 音乐 api', content: '<a href="http://jsososo.gihub.io/MiguMusicApi">查看文档</a>' });
        return true;
    }
};
exports.default = Router;
