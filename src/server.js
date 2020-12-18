const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs').promises; // 获取promise方法
const { createReadStream, createWriteStream } = require('fs');
const chalk = require('chalk');

const mime = require('mime');
const ejs = require('ejs');

class Server {
    constructor(options) {
        this.port = options.port;
        this.directory = options.directory;
        this.cache = options.cache;
    }
    async handleRequest(req, res) {
        let { pathname } = url.parse(req.url);
        pathname = decodeURIComponent(pathname); // decode 解码
        // 列出所有的文件夹
        let requestUrl = path.join(this.directory, pathname); // 路径带/的不要用resolve会回到根路径
        try {
            const statObj = await fs.stat(requestUrl); // 如果路径不存在会报错
            if (statObj.isDirectory()) {
                // 目录 文件目录 ls -al
                let dirs = await fs.readdir(requestUrl);

                let content = await ejs.renderFile(path.resolve(__dirname, 'template.html'), {
                    dirs: dirs.map(dir => ({
                        name: dir,
                        pathname: path.join(pathname, dir)
                    }))
                });

                res.setHeader('Content-Type', 'text/html;charset=utf-8');
                res.end(content);
            } else {
                // 文件 读取文件
                this.sendFile(requestUrl, req, res, statObj)
            }
        } catch (e) {
            console.log(e)
            this.sendError(e, req, res);
        }
    }
    sendError(err, req, res) {
        res.statusCode = 404;
        res.end('Not Found')
    }
    sendFile(filePath, req, res, stat) {
        // 怎么返回文件？
        res.setHeader('Content-Type', `${mime.getType(filePath)};charset=utf-8`)
        createReadStream(filePath).pipe(res); // res.end / res.write
    }
    start() {
        // async + awai
        // http.createServer(()=>this.handleRequest())
        const server = http.createServer(this.handleRequest.bind(this));
        server.listen(this.port, () => {
            console.log(`${chalk.yellow('Starting up http-server, serving')}`);
            console.log(`  http://127.0.0.1:${chalk.green(this.port)}`)
        });
    }
}
module.exports = Server;