var Accessory, Service, Characteristic;
var http = require("http");
var util = require("util");

var communicationError = new Error('Can not communicate with FHC.')
var log = console.log;


module.exports = function(homebridge) {
	log("homebridge API version: " + homebridge.version);

	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	Accessory = homebridge.platformAccessory;

	homebridge.registerPlatform("homebridge-fhc", "FHC", FHCPlatform, false);
}

function FHCPlatform(_log, config, api){
	// auth info
	log = _log;
	this.host = config.host || 'http://127.0.0.1';
	this.apikey = config.apikey;

	log("Booting Platform");

	if (api) {
		// Save the API object as plugin needs to register new accessory via this object.
		this.api = api;

		// Listen to event "didFinishLaunching", this means homebridge already finished loading cached accessories
		// Platform Plugin should only register new accessory self doesn't exist in homebridge after this event.
		// Or start discover new accessories
		this.api.on('didFinishLaunching', function() {
			log("Plugin - DidFinishLaunching");
		}.bind(this));
	}
}

FHCPlatform.prototype = {
	CallFHCAPI: function(path, callback) {
		var self = this;
		var url = self.host + path + '&webapi_apikey=' + self.apikey;

		http.get(url, function(res){
		var body = '';
		res.setEncoding('utf8');

		res.on('data', function(chunk){
			body += chunk;
		});

		res.on('end', function(res){
			res = JSON.parse(body);
			log("RES" , res);
			if ( res.result == "ok" ){
				callback(res);
			}
			else{
				callback(null);
			}
		});
		}).on('error', function(e){
			log("ERROR " , url , e.message); //エラー時
			callback(null)
		});
	},
	_fetchState: function(elec, callback){
		this.CallFHCAPI('/api/elec/getactionlist?elec=' + encodeURIComponent(elec), function(res){
			callback(res);
		});
	},
	_callService: function(elec, action, callback){
		this.CallFHCAPI('/api/elec/action?elec=' + encodeURIComponent(elec) + '&action=' + encodeURIComponent(action), function(res){
			callback(res);
		});
	},
	accessories: function(callback) {
		log("Fetching devices...");

		var self = this;
		var foundAccessories = [];

		this.CallFHCAPI('/api/elec/getlist?a=0', function(res){
			if (!res) {
				callback(foundAccessories);
				return;
			}
			
			var done=0;
			for(var i in res.list)
			{
				var elec = res.list[i];
				self._makeAccessory(elec,function(accessory,skipCount){
					if (!skipCount) {
						done++;
					}
					if (accessory) {
						foundAccessories.push(accessory);
					}
					if(done>=res.list.length){
						log("Fetching %d devices.",foundAccessories.length);
						callback(foundAccessories)
					}
				});
			}
		});
	},
	_findStrings: function(need,arr){
		for(var i in arr)
		{
			if ( arr[i].indexOf(need) >= 0 )
			{
				return i;
			}
		}
		return -1;
	},
	_makeAccessory: function(elec,callback){
		var self = this;
		this.CallFHCAPI('/api/elec/getactionlist?elec=' + encodeURIComponent(elec), function(res){
			if (!res)
			{
				callback(null);
				return ;
			}
			
			var turn_on  = "つける";
			var turn_off = "けす";
			if (elec == "エアコン" 
				&& self._findStrings("暖房",res.list) >= 0
				&& self._findStrings("つける",res.list) < 0 )
			{
				if ( self._findStrings("冷房普通",res.list) >= 0) {
					turn_on  = "冷房普通";
				}
				else {
					turn_on  = "つける";
				}
				var accessory = new FHCAccessory("エアコン",turn_on,turn_off,self);
				callback(accessory,true);

				if ( self._findStrings("暖房普通",res.list) >= 0) {
					turn_on  = "暖房普通";
				}
				else {
					turn_on  = "つける";
				}
				var accessory = new FHCAccessory("暖房",turn_on,turn_off,self);
				callback(accessory);
				return ;
			}

			var accessory = new FHCAccessory(elec,turn_on,turn_off,self);
			callback(accessory);
		});
	}
}
module.exports.platform = FHCPlatform;


function FHCAccessory(elec,turn_on,turn_off,client){
	// device info
	this.name = elec;
	this.turn_on = turn_on;
	this.turn_off = turn_off;
	this.client = client;
}

FHCAccessory.prototype = {
	identify: function(callback){
		log("identifying: " + this.name);
		callback();
	},
	_fetchState: function(elec, callback){
		this.client.CallFHCAPI('/api/elec/getactionlist?elec=' + encodeURIComponent(elec), function(res){
			callback(res);
		});
	},
	_callService: function(elec, action, callback){
		this.client.CallFHCAPI('/api/elec/action?elec=' + encodeURIComponent(elec) + '&action=' + encodeURIComponent(action), function(res){
			callback(res);
		});
	},
	_callServiceByString: function(elec,str, callback){
		this.client.CallFHCAPI('/api/recong/firebystring?str=' + encodeURIComponent(str), function(res){
			callback(res);
		});
	},

	_getPowerState: function(callback){
		log("fetching power state for: " + this.name);
		var self = this;

		this._fetchState(this.name, function(data){
			if (data) {
				powerState = data.status == self.turn_on;
				callback(null, powerState);
			}else{
				callback(communicationError);
			}
		}.bind(this));
	},
	_setPowerState: function(powerOn, callback) {
		var self = this;

		if (powerOn) {
			log("Setting power state on the '"+this.name+"' to on");

			this._callService(this.name, self.turn_on, function(data){
				if (data) {
					log("Successfully set power state on the '"+self.name+"' to on");
					callback();
					return ;
				}
				callback(communicationError);
			}.bind(this));
		}else{
			log("Setting power state on the '"+this.name+"' to off");

			this._callService(this.name, self.turn_off, function(data){
				if (data) {
					log("Successfully set power state on the '"+self.name+"' to off");
					callback();
					return ;
				}
				callback(communicationError);
			}.bind(this));
		}
	},

	getServices: function() {
		log("getServices: " + this.name);
		var model = "";
		var statusService = null;
		var informationService = new Service.AccessoryInformation();

		switch(this.name)
		{
		case '照明':
			statusService = new Service.Lightbulb();
			model = "Light";
			break;
		case 'エアコン':
//			statusService = new Service.Thermostat();
			statusService = new Service.Switch();
			model = "Thermostat";
			break;
		case '暖房':
//			statusService = new Service.Thermostat();
			statusService = new Service.Switch();
			model = "Thermostat";
			break;
		case 'テレビ':
			statusService = new Service.Switch();
			model = "TV";
			break;
		case 'カーテン':
			statusService = new Service.Switch();
			model = "curtain";
			break;
		case '空気清浄機':
			statusService = new Service.Switch();
			model = "Air cleaner";
			break;
		case 'コンポーザ':
			statusService = new Service.Switch();
			model = "Composer";
			break;
		case 'ゲーム機':
			statusService = new Service.Switch();
			model = "TV";
			break;
		case '扇風機':
//			statusService = new Service.Fan();
			statusService = new Service.Switch();
			model = "Fan";
			break;
		case '衛星放送':
			statusService = new Service.Switch();
			model = "broadcast tuner";
			break;
		case 'ディスプレイ':
			statusService = new Service.Switch();
			model = "Display";
			break;
		case 'レコーダ':
			statusService = new Service.Switch();
			model = "Recoder";
			break;
		case 'ドア':
			statusService = new Service.Door();
			model = "Door";
			break;
		case 'パソコン':
			statusService = new Service.Switch();
			model = "PC";
			break;
		case 'プロジェクタ':
			statusService = new Service.Switch();
			model = "Fan";
			break;
		case 'ファン':
//			statusService = new Service.Fan();
			statusService = new Service.Switch();
			model = "Fan";
			break;
		case '窓':
			statusService = new Service.Window();
			model = "Window";
			break;
		default:
			statusService = new Service.Fan();
			model = this.name;
			break;
		}

		informationService
		.setCharacteristic(Characteristic.Manufacturer, "FHC")
		.setCharacteristic(Characteristic.Name, this.name)
		.setCharacteristic(Characteristic.Model, model)
		.setCharacteristic(Characteristic.SerialNumber, "xxx");

		statusService
		.getCharacteristic(Characteristic.On)
		.on('get', this._getPowerState.bind(this))
		.on('set', this._setPowerState.bind(this));

		return [informationService, statusService];
	}

}


