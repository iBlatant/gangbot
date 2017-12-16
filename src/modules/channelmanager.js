
const __ = require('iterate-js');
const moment = require('moment');
const logger = require('../logger.js');

module.exports = function(client) {
    client.manager = {

        cleaning: {},

        sequentialDelete: function(msgs, cb) {
            var msg = msgs.shift();
            if(msg) {
                msg.delete()
                    .then(() => { client.manager.sequentialDelete(msgs, cb); })
                    .catch(error => logger.error(error));
            } else if(cb)
                cb();
        },

        cleanChannel: function(config) {
            var cfg = __.options({ name: '', limit: null }, config),
                channel = client.client.channels.find('name', cfg.name);
            if(channel && channel.type == 'text' && !client.manager.cleaning[cfg.name]) {
                client.manager.cleaning[cfg.name] = true;
                channel.fetchMessages({ limit: 100 })
                    .then(() => {
                        var msgs = __.sort(channel.messages.array(), { key: v => v.createdTimestamp, dir: 'desc' });
                        
                        __.all(msgs.slice(), (msg, idx) => {
                            if(idx < cfg.limit) {
                                var i = msgs.indexOf(msg);
                                if(i > -1)
                                    msgs.splice(i, 1);
                            }
                        });
                        
                        if(msgs.length > 0) {
                            client.manager.sequentialDelete(msgs, () => {
                                client.manager.cleaning[cfg.name] = false;
                                client.manager.cleanChannel(config);
                            });
                        } else
                            client.manager.cleaning[cfg.name] = false;
                    })
                    .catch(error => {
                        client.manager.cleaning[cfg.name] = false;
                    });
            }
        },

        clean: function() {
            __.all(client.config.discord.manage.channels, cfg => {
                client.manager.cleanChannel(cfg);
            });
        }

    };
};
