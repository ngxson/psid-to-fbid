const _ = require('lodash');
const request = require('request');
const ERR_NO_PAGE_TOKEN = "Cannot find page_token, make sure that you've use init(page_id, access_token, options)";

class PsidToFbid {
	/**
	 * Constructor
	 *
	 * @param {String} page_id The array to iterate over.
	 * @param {String} [options.page_token] Page's token (optional). If it is included, you won't have to use fetchPageToken().
	 * @param {Boolean} [options.cache_enable] Enable cache? Default is true.
	 */
	constructor(page_id, options) {
		this.initState();
		this.state.page_id = page_id;
		if (options)
			_.merge(this.state, options);
    }
    
    /**
	 * Fetch and save page_token
	 *
	 * @param {String} access_token Android or iOS access_token.
	 * @returns {Promise} Returns Promise resolve(page_token) if success.
	 */
    fetchPageToken(access_token) {
        var self = this;
        return new Promise((resolve, reject) => {
			request({
				url: 'https://graph.facebook.com/me/accounts',
				qs: {
					access_token: access_token
				},
				method: 'GET'
			}, function(error, response, body) {
				if (error) {
					console.error("Cannot find page. Please check your page_id and access_token");
					console.error("Make sure you are using Android or iOS access_token, read guide here: https://github.com/ngxson/psid-to-fbid#getstarted");
					console.error(error);
					reject();
				} else {
					var data = JSON.parse(body);
					data.data.forEach(page => {
						if (page.id == page_id) {
							self.state.page_token = page.access_token;
						}
					});
					if (self.state.page_token) {
						resolve(self.state.page_token);
					} else {
						console.error("Cannot find page. Please check your page_id and access_token");
						console.error("Make sure you are using Android or iOS access_token, read guide here: https://github.com/ngxson/psid-to-fbid#getstarted");
						reject();
					}
				}
			})
		})
    }

	initState() {
		this.state = {
			page_id: null,
			page_token: null,
			cache_enable: true,
			cache: {}
		}
	}

	/**
	 * Get fbid from messaging_event of webhook
	 * This does NOT work with postback from buttons / Get Started button
	 *
	 * @param {Object} messaging_event messaging_event from webhook.
	 * @returns {Promise} Returns Promise resolve(fbid), with fbid = null if there's an error.
	 */
	getFromWebhookEvent(messaging_event) {
		var self = this;
		return new Promise((resolve, reject) => {
			if (!messaging_event.sender) {
				console.error("Invalid messaging_event object");
				return reject();
			} else if (!self.state.page_token) {
				console.error(ERR_NO_PAGE_TOKEN);
				return resolve(null);
			} else if (!messaging_event.message || !messaging_event.message.mid) {
				return resolve(null);
			}
			var mid = messaging_event.message.mid,
				psid = messaging_event.sender.id;

			if (self.state.cache_enable && self.state.cache[psid]) {
				return resolve(self.state.cache[psid]);
			}

			self.getFromMid(mid, psid).then((fbid) => {
				resolve(fbid);
			}).catch(() => {
				reject();
			})
		})
	}

	/**
	 * Get fbid from mid (message_id)
	 *
	 * @param {String} mid message_id.
	 * @param {String} psid Optional, user's psid.
	 * @returns {Promise} Returns Promise resolve(fbid), with fbid = null if there's an error.
	 */
	getFromMid(mid, psid) {
		var self = this;
		return new Promise((resolve, reject) => {
			if (!self.state.page_token) {
				console.error(ERR_NO_PAGE_TOKEN);
				return resolve(null);
			} else if (!mid) {
				return resolve(null);
			}

			if (psid && self.state.cache_enable && self.state.cache[psid]) {
				return resolve(self.state.cache[psid]);
			}

			if (!mid.startsWith('m_')) {
				mid = 'm_' + mid;
			}

			request({
				url: 'https://graph.facebook.com/' + mid,
				qs: {
					access_token: self.state.page_token,
					fields: "from,to"
				},
				method: 'GET'
			}, function(error, response, body) {
				if (error) {
					console.error(error);
					resolve(null);
				} else {
					var res = JSON.parse(body);
					if (res.error) {
						console.error("getFromMid " + mid + " ERR: " + res);
						resolve(null);

					} else if (res["from"].id != self.state.page_id) {
						if (self.state.cache_enable) {
							self.state.cache[psid] = res["from"].id;
						}
						resolve(res["from"].id);

					} else if (res.to.data[0].id != self.state.page_id) {
						if (self.state.cache_enable) {
							self.state.cache[psid] = res.to.data[0].id;
						}
						resolve(res.to.data[0].id);

					} else {
						console.error("getFromMid " + mid + " ERR: " + res);
						resolve(null);
					}
				}
			})
		})
	}
}

module.exports = PsidToFbid
