const USER_MESSAGES = Object.freeze({
    message : `Hello %1, What a beautiful day. Server current date and time is`
})

class String_message {
    constructor() {
        this.userMessage = `Hello %1, What a beautiful day. Server current date and time is`;
    };

    getMessage(name) {
        return this.userMessage.replace('%1', name);
    }
}

//const text = new String_message();
//console.log(text.getMessage("Etienne"));

module.exports = {USER_MESSAGES};
module.exports = {String_message};
