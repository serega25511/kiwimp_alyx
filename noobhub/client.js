/**
 * NoobHub Client Library
 *
 */

const net = require('net');
const fs = require('fs');

const VERBOSE = true;

function _log() {
if (VERBOSE) console.log.apply(console, arguments);
}

const configloc = "./config.json"
const configDef = fs.existsSync(configloc) ? JSON.parse(fs.readFileSync(configloc)) : {};

const Noobhub = function (config) {
const self = this;

this.socket = null;
this.buffer = new Buffer.alloc(1024 * 16);
this.buffer.len = 0;
this.messageCallback = null;
this.errorCallback = null;
this.subscribedCallback = null;

this.config = configDef;

for (let prop in config) {
	if (self.config.hasOwnProperty(prop)) {
	self.config[prop] = config[prop];
	}
}

self.subscribe = function (config) {
	for (let prop in config) {
	if (self.config.hasOwnProperty(prop)) {
		self.config[prop] = config[prop];
	}
	}

	self.messageCallback = config.callback || self.messageCallback;
	self.errorCallback = config.errorCallback || self.errorCallback;
	self.subscribedCallback =
	config.subscribedCallback || self.subscribedCallback;
	self.socket = net.createConnection(self.config.port, self.config.server);
	self.socket.setNoDelay(true);
	self.socket._isConnected = false;

	self.socket.on('connect', () => {
	_log(`connected to ${self.config.server}:${self.config.port}`);
	self.socket.write(
		'__SUBSCRIBE__' + config.channel + '__ENDSUBSCRIBE__',
		function () {
		self.socket._isConnected = true;

		if (typeof self.subscribedCallback === 'function') {
			self.subscribedCallback(self.socket);
		}

		self.socket.on('data', self._handleIncomingMessage);
		}
	);
	});

	self.socket.on('error', (err) => {
	_log('err0r:::', err);

	if (typeof self.errorCallback === 'function') {
		return self.errorCallback(err);
	} else {
		return;
	}
	});
}; //  end of self.subscribe()

self.publish = function (message, cb) {
	if (!self.socket._isConnected) {
	return false;
	}

	if (typeof message !== 'string') {
	message = JSON.stringify(message);
	}

	this.socket.write('__JSON__START__' + message + '__JSON__END__', cb);
};

self.unsubscribe = function () {
	if (self.socket._isConnected) {
	self.socket.end('Take care NoobHub...');
	self.socket._isConnected = false;
	}
};

self._handleIncomingMessage = (data) => {
	self.buffer.len += data.copy(self.buffer, self.buffer.len);
	let start;
	let end;
	let str = self.buffer.slice(0, self.buffer.len).toString();

	if (
	(start = str.indexOf('__JSON__START__')) !== -1 &&
	(end = str.indexOf('__JSON__END__')) !== -1
	) {
	var json = str.substr(start + 15, end - (start + 15));
	str = str.substr(end + 13); // cut the message and remove the precedant part of the buffer since it can't be processed
	self.buffer.len = self.buffer.write(str, 0);
	// alyx modified code because for some reason this is a problem?
	if(json.includes("__JSON__START__") || json.includes("__JSON__END__")) {
		// TODO: Either fix this entirely or once timeout is working without issue, remove the server owner bit.
		//if(json.includes("pong")) console.log("[noobhub-client] The server ping response malformed, please try again. If you are the server owner and the user has authenticated despite this, try restarting the server.");
		//console.log("json error");
		json = "{}";
	}
	try {
		json = JSON.parse(json);
	} catch(e) {
		// Do nothing because this is a lost message.
	}
	// end modified code
	if (typeof self.messageCallback === 'function') {
		self.messageCallback(json);
	}
	}
};
};

exports.new = function (args = {}) {
return new Noobhub(args);
};