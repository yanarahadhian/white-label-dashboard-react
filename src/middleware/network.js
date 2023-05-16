import { config } from "../config";

function changeTabTitle(title) {
	if (title) {
		document.title = title
	}
}

function changeFavicon(faviconUrl) {
    let link = document.querySelector("link[rel*='icon']") || document.createElement('link')

	let defaultUrl = config().asset_url.favicon

	link.type = 'image/x-icon'
	link.rel = 'shortcut icon'
	
	if (faviconUrl) {
		link.href = faviconUrl
	} else {
		link.href = defaultUrl
	}

	document.getElementsByTagName('head')[0].appendChild(link);
}

export function changeNetworkPreferences(networkAttributes) {
	changeTabTitle(networkAttributes.title)
	changeFavicon(networkAttributes.favicon)
}