const __ = require('iterate-js');
const fs = require('fs');
const jsonfile = require('jsonfile');

const playlistPath = '/playlists';

module.exports = function(client) {
    client.playlist = {
        path: function(name) {
            return '{0}/{1}/{2}.json'.format(client.dir, playlistPath, name);
        },
        dir: '{0}/{1}'.format(client.dir, playlistPath),
        save: function(name, list) {
            var list = __.map(list ? list : client.queue.queue, x => {
                var temp = {};
                __.all(x, (value, key) => { 
                    if(key != 'dispatcher' && key != 'playing' && key != 'requestor')
                        temp[key] = value; 
                });
                return temp;
            });
            jsonfile.writeFileSync(client.playlist.path(name), { queue: list });
        },
        load: function(name) {
            client.queue.queue = (jsonfile.readFileSync(client.playlist.path(name)) || { queue: [] }).queue;
        },
        list: function() {
            var playlists = [];
            fs.readdirSync(client.playlist.dir).forEach(file => {
                var fileparts = file.split('/'),
                    filename = fileparts[fileparts.length - 1].replace('.json', '');
                
                playlists.push(filename);
            });
            return playlists;
        },
        delete: function(name) {
            fs.unlinkSync(client.playlist.path(name));
        }
    };
};
