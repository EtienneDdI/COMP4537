const utils = require('./modules/utils.js')
const lang = require('./lang/en/en.js')
const http = require("http");

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {

    const url = new URL(req.url, `https://${req.headers.host}`);

    if (url.pathname !== "/COMP4537/labs/4/getDate/") {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end("Error not found")
    } else {

    const name = url.searchParams.get("name");

    const text = new lang.String_message();
    const message = text.getMessage(name);
    //console.log(message);

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<p style="color:blue">${message} ${utils.getDate()}</p>`);
    }
}).listen(PORT);

// http://localhost:3000/?name=Etienne

//console.log(`${lang.USER_MESSAGES['message']} ${utils.getDate()}`)
//console.log(lang.USER_MESSAGES['message'], utils.getDate())
