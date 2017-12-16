const readline = require('readline');

module.exports = function(client) {

    var commands = {

        say: function(reader, input) {
            var parts = input.replace('say', '').trim().split('@'),
                guild = parts.shift(),
                channel = parts.shift(),
                text = parts.join('@');
            
            var targetguild = client.client.guilds.find(g => g.name.contains(guild));
            if(targetguild) {
                var targetchannel = targetguild.channels.find(c => c.name.contains(channel));
                if(targetchannel)
                    targetchannel.sendMessage(text);
            }
        },

        exit: function(reader) {
            client.disconnect()
                .then(() => {
                    reader.close();
                });
        }

    };

    client.console = {
        listen: function() {
            var rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rl.on('line', input => {
                var parts = input.split(' '),
                    cmd = parts[0];
                if(commands[cmd])
                    commands[cmd](rl, input);
            });
        }
    };
};
