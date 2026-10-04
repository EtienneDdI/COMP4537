const fs = require('node:fs');

class Utils {
    getDate(){
        const currentDate = new Date()
        return currentDate.toString();
    };

    appendToFile (content) {
        const text = content + `\n`;
        fs.appendFile('./text.txt', text, err => {
            if (err) {
                console.error(err);
            } else {
                console.log("Content got updated to the file");
            }
        })
    };

    readFile (filename, callback) {
        fs.readFile(`./${filename}`, 'utf8', (err, data) => {
            if (err) {
                return callback(err, null)
            }
            callback(null, data);
        });
    }
}
module.exports = {Utils};

//content = "Bonjour je m'appelle Etienne";
//appendToFile(content);

// console.log(getDate());