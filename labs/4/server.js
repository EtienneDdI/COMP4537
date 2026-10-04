const Utils = require("./modules/utils.js");
const lang = require('./lang/en/en.js')
const http = require("http");

class Server {
    constructor(port) {
        this.port = port,
        this.utils = new Utils.Utils(),
        this.regex = /^\/COMP4537\/labs\/4\/readFile\/([a-zA-Z]+\.txt)$/
    }

    StartServer () {
        http.createServer((req, res) => this.RequestHandler(req, res)).listen(this.port)
    }

    RequestHandler (req, res) {
        const url = new URL(req.url, `https://${req.headers.host}`);

        if (url.pathname == "/COMP4537/labs/4/getDate/") {
            return this.ServerGetDate(url, res);
        } else if (url.pathname == "/COMP4537/labs/4/writeFile/") {
            return this.ServerWriteFile(url, res);
        } else if (this.regex.test(url.pathname)) {
            return this.ServerReadFile(url, res);
        } else {
            res.writeHead(404, { "Content-Type": "text/html" });
            res.end("404 : Error not found");
            return;
        }
    }

    ServerGetDate (url, res) {
        if (url.searchParams.get("name")){
            const name = url.searchParams.get("name");

            const text = new lang.String_message();
            const message = text.getMessage(name);

            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(`<p style="color:blue">${message} ${this.utils.getDate()}</p>`);
            return;
        } else {
            const name = "Anonymous";

            const text = new lang.String_message();
            const message = text.getMessage(name);

            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(`<p style="color:blue">${message} ${Utils.getDate()}</p>`);
            return;
        }
    }

    ServerWriteFile (url, res) {
        const text = url.searchParams.get("text");

        console.log(text);

        this.utils.appendToFile(text);

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("200 : Text written in the file");
        return;
    }

    ServerReadFile (url, res) {
        const filename = url.pathname.replace("/COMP4537/labs/4/readFile/", "");
        
        this.utils.readFile(filename, (err, content) => {
            if (err) {
                res.writeHead(404, { "Content-Type": "text/html" });
                return res.end(`404: ${filename} not found`);
            }
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end(content);
        });
        return;
    }
}

// http.createServer((req, res) => {

//     const url = new URL(req.url, `https://${req.headers.host}`);

//     const regex = /^\/COMP4537\/labs\/4\/readFile\/([a-zA-Z]+\.txt)$/;

//     if (url.pathname == "/COMP4537/labs/4/getDate/") {

//         if (url.searchParams.get("name")){
//             const name = url.searchParams.get("name");

//             const text = new lang.String_message();
//             const message = text.getMessage(name);

//             res.writeHead(200, { "Content-Type": "text/html" });
//             res.end(`<p style="color:blue">${message} ${Utils.getDate()}</p>`);
//             return;
//         } else {
//             const name = "Anonymous";

//             const text = new lang.String_message();
//             const message = text.getMessage(name);

//             res.writeHead(200, { "Content-Type": "text/html" });
//             res.end(`<p style="color:blue">${message} ${Utils.getDate()}</p>`);
//             return;
//         }
        

//     } else if (url.pathname == "/COMP4537/labs/4/writeFile/") {

//         const text = url.searchParams.get("text");

//         console.log(text);

//         Utils.appendToFile(text);

//         res.writeHead(200, { "Content-Type": "text/html" });
//         res.end("200 : Text written in the file");
//         return;

//     } else if (regex.test(url.pathname)) {

//         const filename = url.pathname.replace("/COMP4537/labs/4/readFile/", "");
        
//         Utils.readFile(filename, (err, content) => {
//             if (err) {
//                 res.writeHead(404, { "Content-Type": "text/html" });
//                 return res.end(`404: ${filename} not found`);
//             }
//             res.writeHead(200, { "Content-Type": "text/plain" });
//             res.end(content);
//         });
//         return;

//     } else {
//         res.writeHead(404, { "Content-Type": "text/html" });
//         res.end("404 : Error not found");
//         return;
//     }
// }).listen(PORT);

// http://localhost:3000/?name=Etienne

//console.log(`${lang.USER_MESSAGES['message']} ${Utils.getDate()}`)

//console.log(lang.USER_MESSAGES['message'], Utils.getDate())

const PORT = process.env.PORT || 3000;
const server = new Server(PORT);
server.StartServer();