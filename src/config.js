export function config(){
	const config = {
		'api_url': "http://localhost:3002",
		// 'api_url': "http://159.65.139.151:3002",
		'app_port': "3001",
		'asset_url' : {
			// aws bucket dev
			// 'aws' : "https://jpx-whitelabel-dev.s3.ap-southeast-1amazonaws.com/assets/",
			// aws bucket production & stagging
			'aws' 					: "https://jpx-whitelabel.s3.ap-southeast-1.amazonaws.com/assets/",
			// assets
			'favicon' 				: 'https://jpx-whitelabel.s3.ap-southeast-1.amazonaws.com/assets/favicon.ico',
			'icon_burger' 			: 'https://jpx-whitelabel.s3.ap-southeast-1.amazonaws.com/assets/icon_burger.png',
			'dashboard_logo' 		: 'https://jpx-whitelabel.s3.ap-southeast-1.amazonaws.com/assets/logo_agan.png',
			'tooltip' 				: 'https://jpx-whitelabel.s3.ap-southeast-1.amazonaws.com/assets/tooltip.png',
			'wave' 					: 'https://jpx-whitelabel.s3.ap-southeast-1.amazonaws.com/assets/wave.png'
		}
	}

	return config
}

// module.exports = {
// 	'api_url_aws': (process.env.MODE === "mode_production") ? "http://52.76.236.85:3007" : "http://13.228.156.226:3007",
// 	'api_url_do': (process.env.MODE === "mode_production") ? "http://128.199.127.112:3007" : "http://159.65.139.151:3007"
// 	'api_url': (process.env.PLATFORM === "DO") ? api_url_do : api_url_aws
// 	'app_port': "3007",
// 	'mode_production': 'mode_production',
// 	'mode_test': 'mode_test',
// }