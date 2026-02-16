"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const allRoutes = require('./routes');
const miguApi = async (api, query = {}) => {
    return new Promise((resolve, reject) => {
        const truePath = api.replace(/^\/|\/$/g, '').split('/');
        const baseFunc = truePath.shift();
        const func = truePath.join('/') || '';
        const res = {
            redirect: (url) => url,
        };
        if (!allRoutes[baseFunc] || !allRoutes[baseFunc].default[`/${func}`]) {
            return reject({ message: 'wrong path' });
        }
        allRoutes[baseFunc].default[`/${func}`]({ query, res })
            .then((res) => {
            if (typeof res === 'object') {
                if (res.result === 100) {
                    resolve(res.data);
                }
                else {
                    throw ({ message: res.errMsg || '' });
                }
            }
            resolve(res);
        })
            .catch((err) => {
            reject({ message: err.message });
        });
    });
};
exports.default = miguApi;
