var spawn = require('child_process').spawn,
   util = require('util'),
   events = require('events'),
   Module = function() {
      events.EventEmitter.call(this);

      this.update = function() {
         var ls = spawn('cat', ['/proc/cpuinfo']),
            self = this;
         ls.stdout.on('data', function(data) {

            var result = {};
            var all = [];
            var cpuid;
            var i = 0;
            data.toString().split('\n').forEach(function(line) {

               line = line.replace(/\t/g, '');

               var parts = line.split(':');
               if (parts.length === 2) {
                  result[parts[0].replace(/\s/g, '_')] = parts[1].trim().split(' ', 1)[0];
               }

               if (parts[0].replace(/\s/g, '_') === 'Serial') {
                  cpuid = parts[1].trim().split(' ', 1)[0];
               }

               if (line.length < 1) {
                  all.push(result);
                  result = {};
               }

               i = i + 1;
            });
            all.pop();


            self.emit('update', cpuid);
         });

         ls.stderr.on('data', function(data) {
            console.log('stderr: ' + data);
         });
      }

      return this;
   }

util.inherits(Module, events.EventEmitter);

module.exports = new Module();
