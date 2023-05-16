import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { message, Spin } from "antd";
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import { FormMode, LogUser, SetTableStates } from '../actions';
import axios from "axios";
import moment from "moment";
import { config } from "../config";
import { readFilterData } from '../middleware/read_filter'

class VirtualAccountLogsList extends Component {
	constructor(props){
		super(props)

		this.state = {
			user_rights: (this.props.user.rights) ? this.props.user.rights : '',
			isAuthorized: false,
			create: false,
			read: false,
			update: false,
			delete: false,
			data: [],
			totalDataSize: 0,
			size: 15,
			page: 1,
			columnFilter: false,
			filterObj: {},
			sortName : undefined,
			sortOrder : undefined,
			isLoading: false,
			api_url: config().api_url,
			config: { headers: {'token': localStorage.getItem('token')} },
			pagepath : this.props.location.pathname
		}

		this.fetchData = this.fetchData.bind(this)
		this.onSortChange = this.onSortChange.bind(this)
	}

	componentWillMount() {
		//check if user have access to this page
		const rights = this.state.user_rights
		const page_url = this.props.location.pathname
		const table_states = this.props.table_states
		let page, size, sortName, sortOrder, filterObj = null

		// receive table_states if previous page is still in the same page circle
		if (table_states.pagepath === page_url) {
			page = table_states.page
			size = table_states.size
			sortName = table_states.sortName
			sortOrder = table_states.sortOrder
			filterObj = table_states.filterObj
		} else {
			// reset table_states in store to default value
			this.props.SetTableStates({})
		}

		for (let item in rights) {
			if (rights[item].page_url === page_url) {
				if (rights[item].create === 1 || rights[item].read === 1 || rights[item].update === 1 || rights[item].delete === 1 || rights[item].approve === 1){
					this.setState({
					isAuthorized: true,
					create: (rights[item].create === 1) ? true : false,
					read: (rights[item].read === 1) ? true : false,
					update: (rights[item].update === 1) ? true : false,
					delete: (rights[item].delete === 1) ? true : false,
					page : (page) ? (page) : (this.state.page),
					size : (size) ? (size) : (this.state.size),
					sortName : (sortName) ? (sortName) : (this.state.sortName),
					sortOrder : (sortOrder) ? (sortOrder) : (this.state.sortOrder),
					filterObj : (filterObj) ? (filterObj) : (this.state.filterObj)
					}, async () => {
						if (Object.keys(table_states).length > 0) {
							await this.assignFilter()
							await this.fetchData(page, size, sortName, sortOrder, filterObj)
						} else {
							this.fetchData()
						}
					})
				}
			}
		}
	}

	fetchData(page = this.state.page, size = this.state.size, sortName = this.state.sortName, sortOrder = this.state.sortOrder, filterObj = this.state.filterObj) {
		this.setState({ isLoading : true, data : [] })
		
		let { api_url, config } = this.state
        let user_network = this.props.user.network
    
		let url = api_url + '/api/va_log/?page=' + page

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
			url += `&orderName=user_name&orderBy=ASC`
		}

		// Get data only from network if user_network exists
		if (user_network && user_network !== 0) {
			url += `&network=${ user_network }`
		}

		// Filter Management
		if (filterObj && filterObj !== undefined && filterObj !== {} ) {
			let filterUrl = readFilterData(filterObj)
			url += filterUrl
		}

		console.log(url)

		axios.get(url, config)
		.then((response) => {
			console.log(response.data)

			if (response.data.ResponseCode === "200") {
				this.setState({
					data: response.data.ResponseData,
					totalDataSize: response.data.ResponseTotalResult,
					isLoading: false
				})
			} else {
				if (response.data.status === '401') {
					this.setState({
						isAuthorized : false
					}, () => {
					message.error('Login Authentication Expired. Please Login Again!')
					})
				} else {
					let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : "Fetching Failed"
					message.error(msg)
				}

				this.setState({ 
					isLoading : false,
					data : [],
					totalDataSize : 0 }
				)
			}
		}, (err) => {
			this.setState({ isLoading : false })
			console.error(err)
		})
	}

	assignFilter() {
		const { filterObj } = this.state

		if (Object.keys(filterObj).length > 0) {

			if (filterObj.invoice_id) {
				this.refs.invoiceIdCol.applyFilter(filterObj.invoice_id.value)
			}

			if (filterObj.virtual_account_id) {
				this.refs.virtualAccountCol.applyFilter(filterObj.virtual_account_id.value)
			}

			if (filterObj.user_name) {
				this.refs.userNameCol.applyFilter(filterObj.user_name.value)
			}

			if (filterObj.payment_amount) {
				this.refs.paymentAmountCol.applyFilter(filterObj.payment_amount.value)
			}

			if (filterObj.va_status) {
				this.refs.statusCol.applyFilter(filterObj.va_status.value)
			}

			if (filterObj.created_at) {
				let newDate = new Date(filterObj.created_at.value.date)
				this.refs.createdTimeCol.applyFilter({ date : newDate, comparator : filterObj.created_at.value.comparator })		
			}
		}
	}

	dispatchTableStates() {
		const { page, size, sortName, sortOrder, filterObj, pagepath } = this.state
		const table_states = { page, size, sortName, sortOrder, filterObj, pagepath }

		this.props.SetTableStates(table_states)
	}
	
	onPageChange(page, sizePerPage) {
		this.setState({
			page : page,
			size : sizePerPage
		}, () => {
			this.dispatchTableStates()
			this.fetchData()
		})
	}

	onSortChange(sortName, sortOrder) {
		this.setState({
			page : 1,
			sortName,
			sortOrder,
		}, () => {
			this.dispatchTableStates()
			this.fetchData()
		})
	}

	handleSizePerPageChange(sizePerPage) {
		this.setState({
			page : 1,
			size : sizePerPage
		}, () => {
			this.fetchData()
		})
	}

	onFilterChange(filterObj) {
		// if filterObj on onFilterChange() compared to filterObj on table_states returns true, set page on state to 1 and the current state on vice versa
		// differentiate conditions when component first loaded with table_state on redux, with onFilterChange after component rendered
		const table_states = this.props.table_states
		const isFilterTableStatesActive = table_states.filterObj && table_states.filterObj.constructor === Object && Object.keys(table_states.filterObj).length > 0
		const isFilterTableStatesChanged = table_states.filterObj === filterObj
		
		const isFilterActive = filterObj.constructor === Object && Object.keys(filterObj).length > 0

		this.setState({
			page : (isFilterTableStatesActive) ? (isFilterTableStatesChanged === true) ? (1) : (this.state.page) : (1),
			columnFilter : (isFilterActive) ? (true) : (false),
			filterObj : (isFilterActive) ? (filterObj) : ({})
		}, () => {
			this.dispatchTableStates()
			this.fetchData()
		})
	}

	_dateFormat(cell, row){ return cell ? moment(cell, "YYYY-MM-DD HH:mm:ss").format("DD/MM/YYYY HH:mm:ss") : ""; }

	render() {
		return (
			<BootstrapTable data={this.state.data} 
				striped={true} 
				hover={true}
				remote={true}
				condensed 
				pagination 
				fetchInfo={ { dataTotalSize: this.state.totalDataSize } }
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
					<TableHeaderColumn dataField='id' isKey={true} hidden={true}>ID</TableHeaderColumn>
					<TableHeaderColumn ref='invoiceIdCol' dataField="invoice_id" dataAlign="center" width='100px' dataSort={ true } filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Invoice ID</TableHeaderColumn>
					<TableHeaderColumn ref='virtualAccountCol' dataField="virtual_account_id" dataAlign="center" width='100px' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Account Number</TableHeaderColumn>
					<TableHeaderColumn ref='userNameCol' dataField="user_name" dataAlign="center" width='150px'  dataSort={ true } filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Name</TableHeaderColumn>
					<TableHeaderColumn ref='paymentAmountCol' dataField="payment_amount" dataAlign="center" width='100px' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>amount</TableHeaderColumn>
					<TableHeaderColumn ref='statusCol' dataField="va_status" dataAlign="center" width='100px' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Status</TableHeaderColumn>
					<TableHeaderColumn ref='createdTimeCol' dataField="created_at" dataAlign="center" width='125px' dataSort={ true } dataFormat = {this._dateFormat.bind(this)} filter={ { type: 'DateFilter' } }>Created At</TableHeaderColumn>
			</BootstrapTable>
		)
	}
}

function mapStateToProps(state) {
    const { user, table_states } = state

    return { user, table_states }
}

export default withRouter(connect(mapStateToProps, { LogUser, FormMode, SetTableStates })(VirtualAccountLogsList));
