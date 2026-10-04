const fs = require('node:fs');

function getDate(){
    const currentDate = new Date()
    return currentDate.toString();
};

function appendToFile (content) {
    const text = content + `\n`;
    fs.appendFile('./text.txt', text, err => {
        if (err) {
            console.error(err);
        } else {
            console.log("Content got updated to the file");
        }
    })
};

function readFile (filename, callback) {
    fs.readFile(`./${filename}`, 'utf8', (err, data) => {
        if (err) {
            return callback(err, null)
        }
        callback(null, data);
    });
}

module.exports = {getDate, appendToFile, readFile};

//content = "Bonjour je m'appelle Etienne";
//appendToFile(content);

// console.log(getDate());