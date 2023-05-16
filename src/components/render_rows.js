import React from 'react';
import { Checkbox } from "antd";

class RenderRows extends React.Component {

	render() {
		var rows = []
		var pages = this.props.pages
		var roles = this.props.roles
		var menu_id = 0

		for (var i = 0; i < pages.length; i++) {

			//loop through the pages
			var columns = []
			if(typeof roles[i] !== 'undefined'){
				//if rights for this role is found, then load rights from database
				if(roles[i].create === 1){
					columns.push(<td><Checkbox key={pages[i].page_id+'_create'} name={pages[i].page_id+'_create'} defaultChecked={true} value={pages[i].page_id+'_create'} onChange={(e) => this.props.changeMethod(e)} /></td>)
				} else{
					columns.push(<td><Checkbox key={pages[i].page_id+'_create'} name={pages[i].page_id+'_create'} value={pages[i].page_id+'_create'} onChange={(e) => this.props.changeMethod(e)} /></td>)
				}
				
				if(roles[i].read === 1){
					columns.push(<td><Checkbox key={pages[i].page_id+'_read'} name={pages[i].page_id+'_read'} defaultChecked={true} value={pages[i].page_id+'_read'} onChange={(e) => this.props.changeMethod(e)} /></td>)
				} else{
					columns.push(<td><Checkbox key={pages[i].page_id+'_read'} name={pages[i].page_id+'_read'} value={pages[i].page_id+'_read'} onChange={(e) => this.props.changeMethod(e)} /></td>)
				}
							
				if(roles[i].update === 1){
					columns.push(<td><Checkbox key={pages[i].page_id+'_update'} name={pages[i].page_id+'_update'} defaultChecked={true} value={pages[i].page_id+'_update'} onChange={(e) => this.props.changeMethod(e)} /></td>)
				} else{
					columns.push(<td><Checkbox key={pages[i].page_id+'_update'} name={pages[i].page_id+'_update'} value={pages[i].page_id+'_update'} onChange={(e) => this.props.changeMethod(e)} /></td>)
				}
							
				if(roles[i].delete === 1){
					columns.push(<td><Checkbox key={pages[i].page_id+'_delete'} name={pages[i].page_id+'_delete'} defaultChecked={true} value={pages[i].page_id+'_delete'} onChange={(e) => this.props.changeMethod(e)} /></td>)
				} else{
					columns.push(<td><Checkbox key={pages[i].page_id+'_delete'} name={pages[i].page_id+'_delete'} value={pages[i].page_id+'_delete'} onChange={(e) => this.props.changeMethod(e)} /></td>)
				}

				if(roles[i].approve === 1){
					columns.push(<td><Checkbox key={pages[i].page_id+'_approve'} name={pages[i].page_id+'_approve'} defaultChecked={true} value={pages[i].page_id+'_approve'} onChange={(e) => this.props.changeMethod(e)} /></td>)
				} else{
					columns.push(<td><Checkbox key={pages[i].page_id+'_approve'} name={pages[i].page_id+'_approve'} value={pages[i].page_id+'_approve'} onChange={(e) => this.props.changeMethod(e)} /></td>)
				}
			}
			else{
				//if rights for this role is NOT found, then render normal checkboxes
				columns.push(<td><Checkbox key={pages[i].page_id+'_create'} name={pages[i].page_id+'_create'} value={pages[i].page_id+'_create'} onChange={(e) => this.props.changeMethod(e)} /></td>)
				columns.push(<td><Checkbox key={pages[i].page_id+'_read'} name={pages[i].page_id+'_read'} value={pages[i].page_id+'_read'} onChange={(e) => this.props.changeMethod(e)} /></td>)
				columns.push(<td><Checkbox key={pages[i].page_id+'_update'} name={pages[i].page_id+'_update'} value={pages[i].page_id+'_update'} onChange={(e) => this.props.changeMethod(e)} /></td>)
				columns.push(<td><Checkbox key={pages[i].page_id+'_delete'} name={pages[i].page_id+'_delete'} value={pages[i].page_id+'_delete'} onChange={(e) => this.props.changeMethod(e)} /></td>)
				columns.push(<td><Checkbox key={pages[i].page_id+'_approve'} name={pages[i].page_id+'_approve'} value={pages[i].page_id+'_approve'} onChange={(e) => this.props.changeMethod(e)} /></td>)
			}

			// Create gaps if menu_id change

			if (i < pages.length - 1) {
				if (menu_id !== pages[i].menu_id) {
					rows.push(<tr><td className="left" colSpan="6">{ pages[i].menu_name }</td></tr>)
				}
			}

			rows.push(<tr><td className="left">{pages[i].page_name}</td>{columns}</tr>)
			menu_id = pages[i].menu_id
		}

		return (<tbody>{rows}</tbody>)
	}
}

export default RenderRows;