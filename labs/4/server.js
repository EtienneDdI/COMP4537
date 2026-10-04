const utils = require('./modules/utils.js')
const lang = require('./lang/en/en.js')
const http = require("http");

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {

    const url = new URL(req.url, `https://${req.headers.host}`);

    const regex = /^\/COMP4537\/labs\/4\/readFile\/([a-zA-Z]+\.txt)$/;

    if (url.pathname == "/COMP4537/labs/4/getDate/") {

        if (url.searchParams.get("name")){
            const name = url.searchParams.get("name");

            const text = new lang.String_message();
            const message = text.getMessage(name);

            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(`<p style="color:blue">${message} ${utils.getDate()}</p>`);
            return;
        } else {
            const name = "Anonymous";

            const text = new lang.String_message();
            const message = text.getMessage(name);

            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(`<p style="color:blue">${message} ${utils.getDate()}</p>`);
            return;
        }
        

    } else if (url.pathname == "/COMP4537/labs/4/writeFile/") {

        const text = url.searchParams.get("text");

        console.log(text);

        utils.appendToFile(text);

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("Text bien injecte");
        return;

    } else if (regex.test(url.pathname)) {

        const filename = url.pathname.replace("/COMP4537/labs/4/readFile/", "");
        
        utils.readFile(filename, (err, content) => {
            if (err) {
                res.writeHead(404, { "Content-Type": "text/html" });
                return res.end(`404: ${filename} not found`);
            }
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(content);
        });
        return;

    } else {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end("404 : Error not found");
        return;
    }
}).listen(PORT);

// http://localhost:3000/?name=Etienne

//console.log(`${lang.USER_MESSAGES['message']} ${utils.getDate()}`)
//console.log(lang.USER_MESSAGES['message'], utils.getDate())
