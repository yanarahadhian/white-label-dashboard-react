import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Icon, message, Tooltip, Spin, Row, Col } from "antd";
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import { FormMode, LogUser } from '../actions';
import axios from "axios";
import { config } from "../config";
import { readFilterData } from '../middleware/read_filter'
import { downloadCSV } from '../middleware/export'

class UsersList extends Component {
	constructor(props) {
		super(props)

		this.state = {
			user_rights: (this.props.user.rights) ? this.props.user.rights : '',
			isAuthorized: false,
			create: false,
			read: false,
			update: false,
			delete: false,
			collapsed: false,
			profileCollapsed: true,
			totalDataSize : 0,
			data: [],
			size : 5,
			page : 1,
			columnFilter: false,
			filterObj : {},
			sortName : undefined,
			sortOrder : undefined,
			isLoading : false,
			area: '',
			network: '',
			api_url: config().api_url,
			selectedRow: {},
			config: { headers: {'token': localStorage.getItem('token')} }
		}

		this.handleSelectRow = this.handleSelectRow.bind(this)
		this.handleDeleteRow = this.handleDeleteRow.bind(this)
		this.handleDeleteButton = this.handleDeleteButton.bind(this)
		this.fetchData = this.fetchData.bind(this)
		this.exportData = this.exportData.bind(this)
		this.onSortChange = this.onSortChange.bind(this)
	}

	onSortChange(sortName, sortOrder) {

		this.setState({
			sortName,
			sortOrder,
			page : 1
		}, () => {
			this.fetchData(this.state.page, this.state.size, this.state.sortName, this.state.sortOrder)
		})

	}

	fetchData(page, size, sortName, sortOrder, filterObj) {

		let { api_url, config } = this.state

		this.setState({ isLoading : true })

		let role_level = this.props.user.role_level
		let user_role = parseInt(this.props.user.role, 10)
		let user_network = this.props.user.network
		let url = api_url + '/api/users/?page=' + page

		// URL QUERY MANAGEMENT
		if (size) {
			url += `&size=${ size }`
		}

		if (sortName) {
			url += `&orderName=${ sortName }`

			if (sortOrder) {
				url += `&orderBy=${ sortOrder }`
			} else {
				url += `&orderBy=ASC`
			}
		} else {
			url += `&orderName=name&orderBy=ASC`
		}

		// Get data only from network if user_network exists
		if (user_network && user_network !== 0) {
			url += `&network_id=${ user_network }`
		}

		// Get data only from the lower level of role except role agent & loper
		url += `&level_exception=3`

		// Get all data at all role level only if higher role order user
		if (user_role !== 1) {
			url += `&role_level=${ role_level }`
		}

		// Filter Management
		if (filterObj !== undefined && filterObj !== {} ) {
			let filterUrl = readFilterData(filterObj)
			url += filterUrl
		}

		console.log(url)

		axios.get(url, config)
		.then((response) => {
			if (response.data.ResponseCode === "200") {
				console.log(response.data)
				this.setState({
					data: response.data.ResponseData,
					totalDataSize: response.data.ResponseTotalResult,
					isLoading: false
				})

			} else {
				this.setState({
					data : [],
					isLoading : false
				}, () => {
					message.error(response.data.ResponseDesc)
				})
			}

			this.setState({
				isLoading: false
			})
		}, (err) => {
			console.error(err)
		})

	}

	componentWillMount() {

		let { page, size, sortName, sortOrder } = this.state 

		//check if user have access to this page
		let rights = this.state.user_rights
		let page_url = this.props.location.pathname

		for (let item in rights) {
			if (rights[item].page_url === page_url) {
				if (rights[item].create === 1 || rights[item].read === 1 || rights[item].update === 1 || rights[item].delete === 1 || rights[item].approve === 1){
					this.setState({
					isAuthorized: true,
					create: (rights[item].create === 1) ? true : false,
					read: (rights[item].read === 1) ? true : false,
					update: (rights[item].update === 1) ? true : false,
					delete: (rights[item].delete === 1) ? true : false
					})
					
					this.fetchData(page, size, sortName, sortOrder)
				}
			}
		}

	}

	onFilterChange(filterObj) {

		let { page, size, sortName, sortOrder } = this.state

		if (Object.keys(filterObj).length === 0 && filterObj.constructor === Object) {
		  this.setState({
				columnFilter: false,
				filterObj: {}
				},()=> {
					this.fetchData(page, size, sortName, sortOrder)
		  })
		} else {
		  this.setState({
				columnFilter: true,
				filterObj: filterObj
				}, () => {
					this.fetchData(1, size, sortName, sortOrder, this.state.filterObj)
			})
		}

	}

	exportData() {
		let { api_url, config, sortName, sortOrder, columnFilter, filterObj } = this.state
		
		let role_level = this.props.user.role_level
		let user_network = this.props.user.network
		let user_role = parseInt(this.props.user.role, 10)
		let url = api_url + '/api/users/?page=all'
		let exportAll = false

		if (sortName) {
			url += `&orderName=${ sortName }`

			if (sortOrder) {
				url += `&orderBy=${ sortOrder }`
			} else {
				url += `&orderBy=ASC`
			}
		} else {
			url += `&orderName=name&orderBy=ASC`
		}

		// Get data only from network if user_network exists
		if (user_network && user_network !== 0) {
			url += `&network_id=${ user_network }`
		}

		// Get data only from the lower level of role except role agent & loper
		url += `&level_exception=3`

		// Get all data at all role level only if higher role order user
		if (user_role !== 1) {
			url += `&role_level=${ role_level }`
		}
			
		if (columnFilter && filterObj !== undefined && filterObj !== {}) {
			// Filter Management
			let filterUrl = readFilterData(filterObj)
			url += filterUrl

			exportAll = true
		} else {
			exportAll = window.confirm("Do you really want to export all data ?")
		}

		if (exportAll) {

			console.log('Export data request : ', url)

			axios.get(url, config)
			.then((response) => {
				if (response.data.ResponseCode === "200") {
					downloadCSV(response.data.ResponseData, 'users')
				} else {
					message.error(response.data.ResponseDesc)
				}
				
				this.setState({ isLoading: false })
			}, (err) => {
				console.error(err)
			})
		}
	}

	handleSelectRow(row) {
		const { selectedRow } = this.state
		let replaceRow = {}

		if (row.constructor === Object && Object.keys(row).length > 0) {
			if (row.id && row.id !== selectedRow.id) {
				replaceRow = row
			}

			this.setState({ selectedRow: replaceRow })
		}
	}

	handleDeleteButton() {
		let isSelectedRowEmpty = this.state.selectedRow.username === undefined

		if (isSelectedRowEmpty) {
			return true
		} else {
			return false
		}
	}

	handleDeleteRow() {
		let { api_url, config, selectedRow, page, size, sortName, sortOrder, filterObj } = this.state
		// let id = selectedRow.id
		// let url = api_url + '/api/users/?id=' + id
		let username = selectedRow.username
		let url = api_url + '/api/users/?username=' + username

		let remove = window.confirm("Do you want to delete this data ?");
		
		if (remove) {
			this.setState({ isLoading: true })

			axios.delete(url, config)
			.then((response) => {
				console.log('response : ', response.data)

				if (response.data.ResponseCode === "500") {
					message.error(response.data.ResponseDesc.sqlMessage);
				} else {
					message.success(response.data.ResponseDesc);
					this.fetchData(page, size, sortName, sortOrder, filterObj)

					this.setState({ selectedRow: {} })
				}

				this.setState({ isLoading: false })

			}, (err) => {
				message.error(err.data.ResponseDesc);
				this.setState({ isLoading: false })
				return false
			})
		}
	}

	handleSizePerPageChange(sizePerPage) {
		this.setState({
			page : 1,
			size : sizePerPage
		}, () => {
			this.fetchData(1, sizePerPage)
		})
	}

	onPageChange(currentPage, sizePerPage) {
		this.setState({
			page : currentPage,
			size : sizePerPage
		})

		this.fetchData(currentPage, sizePerPage, this.state.sortName, this.state.sortOrder, this.state.filterObj)
	}

	buttonFormatter(cell, row){
		return <div>
				<a onClick={()=>this.viewRow(row)} ><Tooltip title="View"><Icon type="search" /></Tooltip></a> 
				<a onClick={()=>this.editRow(row)} style={{ marginLeft: '10px'}}><Tooltip title="Edit"><Icon type="edit" /></Tooltip></a>
				</div>;
	}

	addRow(){
		let dispatch = this.props
		dispatch.FormMode('add')
		this.props.history.push({
			pathname: '/users/new'
		})
	}

	editRow(row){
		let dispatch = this.props
		dispatch.FormMode('edit')
		this.props.history.push({
			pathname: `/users/edit/${row.id}`
		})
	}

	viewRow(row){
		let dispatch = this.props
		dispatch.FormMode('view')
		this.props.history.push({
		  pathname: `/users/view/${row.id}`
		})
	  }

	render() {
		const { isAuthorized } = this.state

		const selectRow = {
			mode		: "radio",
			onSelect	: this.handleSelectRow,
			clickToSelect : true
		}

		if (isAuthorized) {
			return (
				<React.Fragment>
					<Row type="flex" justify="end" style={{ marginBottom : '30px' }}>
						<Col>
							<Button className='base_button primary' onClick={this.exportData} >
								Export CSV
							</Button>
							
							{
								(this.state.create) ? <Button className='base_button primary' onClick={()=>this.addRow()} >Add Users</Button> : ''
							}

							{
								(this.state.delete) ? 
									(
										<Button className={ (Object.keys(this.state.selectedRow).length > 0) ? ('base_button delete') : ('button_disabled delete_disabled') }
												onClick={()=>this.handleDeleteRow()} 
												disabled={ this.handleDeleteButton() }
										> Delete </Button>
									) : ('')
							}
						</Col>
					</Row>
				
					<BootstrapTable 
					data={this.state.data} 
					striped={true} 
					hover={true}
					remote={true}
					condensed 
					pagination 
					fetchInfo={ { dataTotalSize: this.state.totalDataSize } }
					selectRow={ selectRow } 
					options={{ 
					sizePerPageList: [ {
						text: '5', value: 5
					}, {
						text: '10', value: 10
					}, {
						text: '15', value: 15
					} ],
					sizePerPage: this.state.size,
					onSizePerPageList : this.handleSizePerPageChange.bind(this),
					onPageChange: this.onPageChange.bind(this),
					page : this.state.page,
					noDataText: (this.state.isLoading) ? <Spin/> : 'No Data Found',
					onFilterChange: this.onFilterChange.bind(this),
					onSortChange : this.onSortChange,
					sortName : this.state.sortName,
					sortOrder : this.state.sortOrder
					}} >
						<TableHeaderColumn dataField="username" isKey={true} dataAlign="center" width='115px' dataSort={true} filter={ { type: 'TextFilter', placeholder: 'Type a value' } }>Username</TableHeaderColumn>
						<TableHeaderColumn dataField="name" dataAlign="center" width='150px' filter={ { type: 'TextFilter', placeholder: 'Type a value' } }>Name</TableHeaderColumn>
						<TableHeaderColumn dataField="email" dataAlign="center" width='150px' filter={ { type: 'TextFilter', placeholder: 'Type a value' } }>Email</TableHeaderColumn>
						<TableHeaderColumn dataField="phone_number" dataAlign="center" width='125px' filter={ { type: 'TextFilter', placeholder: 'Type a value' } }>Phone Number</TableHeaderColumn>
						<TableHeaderColumn dataField="networkName" dataAlign="center" width='100px' filter={ { type: 'TextFilter', placeholder: 'Type a value' } }>Network</TableHeaderColumn>
						<TableHeaderColumn dataField="areaName" dataAlign="center" width='100px' filter={ { type: 'TextFilter', placeholder: 'Type a value' } }>Area</TableHeaderColumn>
						<TableHeaderColumn dataField="roleName" dataAlign="center" width='90px' filter={ { type: 'TextFilter', placeholder: 'Type a value' } }>Role</TableHeaderColumn>
						<TableHeaderColumn dataField="status" dataAlign="center" width='90px' filter={ { type: 'TextFilter', placeholder: 'Type a value' } }>Status</TableHeaderColumn>
						<TableHeaderColumn dataField="button" dataAlign="center" dataFormat={this.buttonFormatter.bind(this)} width='80px'>Actions</TableHeaderColumn>
					</BootstrapTable>
				</React.Fragment>
			)
		} else {
			return ('You are not authorized to access this page')
		}
	}
}

function mapStateToProps(state) {
	const { user, mode } = state;
	return {
		user,
		mode
	}
}

export default withRouter(connect(mapStateToProps, { LogUser, FormMode })(UsersList));
