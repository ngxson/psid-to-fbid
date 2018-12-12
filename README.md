### Mapping PSID to FBID

This package allows you to match page-specific id (psid) with user's real id (id starts with 1000...) from webhook events.

**Requirement:** You must have **admin** or **editor** role on that page.

<a name="getstarted"></a>
---------------------------------------
### Getting started

This package uses **Android** or **iOS access_token**. To get it, follow these instructions:

* Login to your facebook account on a browser (on PC)
* Go to your profile page (https://facebook.com/profile.php)
* View HTML source code (Ctrl+U in Chrome)
* Press Ctrl+F to find on that page
* Type in the search box `EAAA`
* Get the access_token which starts with `EAAA`...

---------------------------------------
### How to use

```
npm install psid-to-fbid --save
```

For example you have a page with id = `182794865548469`, and your Android token is `EAAAAUaZA8jlABAIv...`

Firstly, you must setup the package like this:

```js
const PsidToFbid = require('psid-to-fbid');
const psidToFbid = new PsidToFbid("182794865548469",
        "EAAAAUaZA8jlABAIv...")
.then(() => {
    console.log("Setup complete");
}).catch(() => {
    console.log("Setup failed");
})
```

After that, you can use these functions:
* [`getFromWebhookEvent(messaging_event)`](#getFromWebhookEvent)
* [`getFromMid(mid, psid)`](#getFromMid)

---------------------------------------
<a name="getFromWebhookEvent"></a>
### getFromWebhookEvent(messaging_event)

Get fbid from messaging_event of webhook

This **does NOT work** with postback from buttons / Get Started button (but works with quick replies)

__Arguments__

* `@param {Object} messaging_event` messaging_event from webhook.
* `@returns {Promise}` Returns Promise resolve(fbid), with fbid = null if there's an error.

__Example__

```js
app.post('/webhook/', function (req, res) {
	let messaging_events = req.body.entry[0].messaging;
	for (let i = 0; i < messaging_events.length; i++) {
		let event = req.body.entry[0].messaging[i];
		let psid = event.sender.id;
		psidToFbid.getFromWebhookEvent(event).then(fbid => {
		    console.log("Got psid = "+psid+", fbid = "+fbid);
		})
	}
	res.sendStatus(200);
})
```

---------------------------------------
<a name="getFromMid"></a>
### getFromMid(mid, psid)

Get fbid from mid (message_id)

For example, each time you send a message via `/me/messages` endpoint, you receive an object which contains `message_id`. The `message_id` can then be passed into getFromMid to get fbid of the receiver.

__Arguments__

 * `@param {String} mid` message_id.
 * `@param {String} psid` Optional, user's psid. Used for cache feature.
 * `@returns {Promise}` Returns Promise resolve(fbid), with fbid = null if there's an error.

__Example__

```js
request({
	url: 'https://graph.facebook.com/v2.6/me/messages',
	qs: {access_token:token},
	method: 'POST',
	json: {
		recipient: {id:psid},
		message: messageData,
	}
}, function(error, response, body) {
	if (!error && !response.body.error && response.body.message_id) {
	    var mid = response.body.message_id;
		psidToFbid.getFromMid(mid, psid).then(fbid => {
		    console.log("Got psid = "+psid+", fbid = "+fbid);
		})
	}
})
```

---------------------------------------
### Author
* ngxson (Nui Nguyen)
* Email: contact at ngxson dot com
* My website: https://ngxson.com