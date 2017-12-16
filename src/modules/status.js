
const __ = require('iterate-js');
const moment = require('moment');
const logger = require('../logger.js');

module.exports = function(client) {
    var STATE = __.enum({
        READY: 0,
        PLAYING: 1,
        PAUSED: 2
    });

    client.clock = new __.lib.StopWatch({
        onTick: (time) => {
            if(client.online) {
                var track = client.queue.first,
                    title = '',
                    currentTime = 0,
                    totalTime = 0;

                if(track && track.dispatcher) {
                    var time = track.dispatcher.time / 1000,
                        format = 'mm:ss',
                        end = moment(track.length, 'HH:mm:ss');

                    if(end.hours() > 0)
                        form = 'HH:' + form;

                    title = track.title;
                    currentTime = moment('00:00:00', 'HH:mm:ss').add(time, 's').format(format);
                    totalTime = end.format(format);
                }
                
                if(client.queue.count > 0 && client.queue.first.playing) {
                    if(client.queue.first.paused)
                        client.state = STATE.PAUSED;
                    else
                        client.state = STATE.PLAYING;
                } else
                    client.state = STATE.READY;

                var text = __.switch(client.state, {
                    [STATE.READY]: `Ready: ${client.queue.count} in queue.`,
                    [STATE.PLAYING]: `${currentTime}/${totalTime}`,
                    [STATE.PAUSED]: `Paused: ${title} - ${currentTime} / ${totalTime}`
                });

                if(__.prop(client.client, 'user.presence.game.name') != text) {
                    logger.log(`Status: ${text}`);
                    client.client.user.setGame(text);
                }
            }
        },
        tickRate: 10000
    });
};
