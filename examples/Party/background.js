var extensionId = 'agnaejlkbiiggajjmnpmeheigkflbnoo'; //Chrome
if (typeof browser !== 'undefined' && typeof chrome !== 'undefined') {
	extensionId = '{57081fef-67b4-482f-bcb0-69296e63ec4f}'; //Firefox
}

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
	if (request.action == 'presence') {
		//Pass request to content script.
		chrome.tabs.sendMessage(request.tab, { action: 'presence', info: request.info }, (response) => {
			sendResponse(response);
		});
	} else if (request.action == 'join') {
		//Game launch request.
		chrome.tabs.create({ url: 'https://www.twitch.tv' + request.secret }, (tab) => {});
	} else if (request.action == 'joinRequest') {
		chrome.tabs.sendMessage(
			request.tab,
			{ action: 'joinRequest', user: request.user },
			(response) => {
				sendResponse(response);
			},
		);
	}
	return true;
});

//Register party listener. Needed for reacting to invitations
chrome.runtime.sendMessage(
	extensionId,
	{ action: 'party', clientId: '611467991938367518' },
	(response) => {
		console.log('Party registred', response);
	},
);
