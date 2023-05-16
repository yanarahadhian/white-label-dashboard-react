import React from "react";
import { config } from "../config";

class PageLogo extends React.Component {

	render() {

		var base_url = (typeof window !== 'undefined') ? window.location.protocol + '//' + window.location.host : "localhost:" + config.app_port

		return (
			<div style={{ display: this.props.collapsed === true ? 'none' : 'block', padding: '10px' }}>
	        	<a href={base_url} target="_blank">
	            	<img className="img-circle" src="logo_final.png" width="200" height="auto" alt=""/>
	            </a>
	        </div>
		)
	}
}

export default PageLogo;