const __ = require('iterate-js');
const logger = require('../logger.js');

module.exports = function(client) {
    client.speakers = [];

    var parseMsg = (msg) => {
        msg.meta = msg.content.split(' ');
        var x = msg.meta.slice();
        msg.cmd = x.shift().replace(client.config.command.symbol, '');
        msg.details = x.join(' ');
        return msg;
    };

    var hasCommand = (content) => content.substring(0, client.config.command.symbol.length) == client.config.command.symbol;

    __.all({
        message: msg => {
            if(client.config.discord.log && msg.author.id != client.client.user.id && hasCommand(msg.content))
                logger.log('{0}{1}{2} : {3}'.format(
                    msg.guild ? '{0} '.format(msg.guild.name) : '', 
                    msg.channel.name ? '#{0} @ '.format(msg.channel.name) : 'PM @ ', 
                    msg.author.username, 
                    msg.content
                ));
            if(msg.content && hasCommand(msg.content)) {
                try {
                    var data = parseMsg(msg),
                        cmd = client.commands[data.cmd];
                    if(__.is.function(cmd))
                        cmd(data);
                } catch(e) {
                    logger.error(e);
                }
            }
            try {
                client.manager.clean();
            } catch(e) {
                logger.error(e);
            }
        },

        ready: () => {
            client.clock.start();
            if(client.online)
                logger.log('Reconnected.');
            else
                logger.log('Rhythm Bot Online.');
            client.online = true;
            client.manager.clean();
        },

        reconnecting: () => {
            logger.log('Reconnecting...');
        },

        disconnect: () => {
            client.clock.stop();
            client.online = false;
            logger.log('Disconnected.');
        },

        error: error => {
            logger.error(error);
        },

        guildMemberUpdate: (old, member) => {
            if(member.user.username == client.client.user.username && member.mute) {
                member.setMute(false);
                logger.log('Bot muted....unmuteing');
            }
        },

        guildMemberSpeaking: (member, isSpeaking) => {
            if(isSpeaking)
                client.speakers.push(member.id);
            else {
                var idx = client.speakers.indexOf(member.id);
                if(idx > -1)
                    client.speakers.splice(idx, 1);
            }

            if(client.config.auto.deafen) {
                var track = client.queue.first;
                if(track && track.dispatcher) {
                    if(client.speakers.length > 0)
                        track.dispatcher.setVolume(0.5);
                    else
                        track.dispatcher.setVolume(client.config.stream.volume);
                }
            }
        }

    }, (func, name) => { client.client.on(name, func); });
};
