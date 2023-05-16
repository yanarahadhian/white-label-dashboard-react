import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Icon, message, Tooltip, Spin, Row, Col } from "antd";
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import { FormMode, LogUser, SetTableStates } from '../actions';
import axios from "axios";
import moment from "moment";
import { config } from "../config";
import { readFilterData } from '../middleware/read_filter'
import { downloadCSV } from '../middleware/export'

class TransactionList extends Component {
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

    this.viewRow = this.viewRow.bind(this)
    this.exportData = this.exportData.bind(this)
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
		let { api_url, config } = this.state

		this.setState({ isLoading : true })

		let user_network = this.props.user.network
    
		let url = api_url + '/api/transaction_log/?page=' + page

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
			url += `&orderName=request_time&orderBy=DESC`
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
					totalDataSize : 0
				})
			}
		}, (err) => {
			this.setState({ isLoading: false })
			console.error(err)
		})
	}

	assignFilter() {
		const { filterObj } = this.state

		if (Object.keys(filterObj).length > 0) {

			if (filterObj.seller_name) {
				this.refs.sellerNameCol.applyFilter(filterObj.seller_name.value)
			}
			
			if (filterObj.network_name) {
				this.refs.networkNameCol.applyFilter(filterObj.network_name.value)
			}
			
			if (filterObj.request_time) {
				let newDate = new Date(filterObj.request_time.value.date)
        this.refs.requestTimeCol.applyFilter({ date : newDate, comparator : filterObj.request_time.value.comparator })
			}
			
			if (filterObj.invoice_id) {
				this.refs.invoiceIdCol.applyFilter(filterObj.invoice_id.value)
			}
			
			if (filterObj.type_trans) {
				this.refs.typeTransCol.applyFilter(filterObj.type_trans.value)
			}
			
			if (filterObj.product) {
				this.refs.productNameCol.applyFilter(filterObj.product.value)
			}
			
			if (filterObj.customer_number) {
				this.refs.customerNumberCol.applyFilter(filterObj.customer_number.value)
			}
			
			if (filterObj.billing_id) {
				this.refs.billingIdCol.applyFilter(filterObj.billing_id.value)
			}
			
			if (filterObj.status) {
				this.refs.statusCol.applyFilter(filterObj.status.value)
			}
		}
	}

	dispatchTableStates() {
		const { page, size, sortName, sortOrder, filterObj, pagepath } = this.state
    const table_states = { page, size, sortName, sortOrder, filterObj, pagepath }

    this.props.SetTableStates(table_states)
	}

	onSortChange(sortName, sortOrder) {
		this.setState({
			page : 1,
			sortName,
			sortOrder
		}, () => {
			this.dispatchTableStates()
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

	onPageChange(page, sizePerPage) {
		this.setState({
			page : page,
			size : sizePerPage
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

	exportData() {
		let { api_url, config, sortName, sortOrder, columnFilter, filterObj } = this.state
		
		let user_network = this.props.user.network
		let url = api_url + '/api/transaction_log/?page=all'
		let exportAll = false

		if (sortName) {
			url += `&orderName=${ sortName }`

			if (sortOrder) {
				url += `&orderBy=${ sortOrder }`
			} else {
				url += `&orderBy=ASC`
			}
		} else {
			url += `&orderName=request_time&orderBy=DESC`
		}

		// Get data only from network if user_network exists
		if (user_network && user_network !== 0) {
			url += `&network=${ user_network }`
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
				console.log(response.data)
				if (response.data.ResponseCode === "200") {
					downloadCSV(response.data.ResponseData, 'transactions')
				} else {
					if (response.data.status === '401') {
            message.error('Login Authentication Expired. Please Login Again!')
					} else {
						let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : ""
						message.error(msg)
					}
				}
			}, (err) => {
				console.error(err)
			})
		}
	}

	_dateFormat(cell, row){ return cell ? moment(cell, "YYYY-MM-DD HH:mm:ss").format("LLLL") : ""; }

	buttonFormatter(cell, row){
		return (	
			<div>
				<a onClick={()=>this.viewRow(row)} style={{ marginLeft: '5px'}}><Tooltip title="View"><Icon type="search" /></Tooltip></a>
			</div>
		)
	}

	viewRow(row) {
		let dispatch = this.props
		dispatch.FormMode('view')
		this.props.history.push({
		  pathname: `/transaction_logs/view/${row.id}`
		})
	}
  
  render() {
		const { isAuthorized } = this.state

    if (isAuthorized) {
      return (
				<React.Fragment>
					<Row type="flex" justify="end" style={{ marginBottom : '30px' }}>
            <Col>  
							<Button className='base_button primary' onClick={ this.exportData } >
								Export CSV
							</Button>
            </Col>
          </Row>
				
					<BootstrapTable 
						data={ this.state.data } 
						striped={ true } 
						hover={ true }
						remote={ true }
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
						<TableHeaderColumn dataField='id' hidden={true} export={true}>ID</TableHeaderColumn>
						<TableHeaderColumn dataField='user_id_seller' hidden={true} export={true}>User ID Seller</TableHeaderColumn>
						<TableHeaderColumn ref='sellerNameCol' dataField="seller_name" isKey={true} dataAlign="center" width='175px' dataSort={true} filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Name</TableHeaderColumn>
						<TableHeaderColumn ref='networkNameCol' dataField="network_name" dataAlign="center" width='175px' dataSort={true} filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Network</TableHeaderColumn>
						<TableHeaderColumn dataField='agent_id' hidden={true} export={true}>Agent ID</TableHeaderColumn>
						<TableHeaderColumn dataField='agent_name' hidden={true} export={true}>Agent Name</TableHeaderColumn>
						<TableHeaderColumn ref='requestTimeCol' dataField="request_time" dataAlign="center" dataSort={true} width='300px' dataFormat = {this._dateFormat.bind(this)} filter={ { type: 'DateFilter' } }>Request Time</TableHeaderColumn>
						<TableHeaderColumn dataField='response_time' hidden={true} dataFormat = {this._dateFormat.bind(this)} export={true}>Response Time</TableHeaderColumn>
						<TableHeaderColumn dataField='t_taken' hidden={true} export={true}>T Taken</TableHeaderColumn>
						<TableHeaderColumn ref='invoiceIdCol' dataField="invoice_id" dataAlign="center" width='400px' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Invoice</TableHeaderColumn>
						<TableHeaderColumn ref='typeTransCol' dataField="type_trans" dataAlign="center" width='100px' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Type Trans</TableHeaderColumn>
						<TableHeaderColumn dataField='area' hidden={true} export={true}>Area</TableHeaderColumn>
						<TableHeaderColumn dataField='time_user' hidden={true} dataFormat = {this._dateFormat.bind(this)} export={true}>Time User</TableHeaderColumn>
						<TableHeaderColumn dataField='product_id' hidden={true} export={true}>Product ID</TableHeaderColumn>
						<TableHeaderColumn ref='productNameCol' dataField="product" dataAlign="center" width='150px' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Product</TableHeaderColumn>
						<TableHeaderColumn dataField='sku' hidden={true} export={true}>SKU</TableHeaderColumn>
						<TableHeaderColumn dataField="price" dataAlign="center" width='125px'>Price</TableHeaderColumn>
						<TableHeaderColumn dataField='harga_jual' hidden={true} export={true}>Harga Jual</TableHeaderColumn>
						<TableHeaderColumn dataField='fee_jpx' hidden={true} export={true}>Fee JPX</TableHeaderColumn>
						<TableHeaderColumn dataField='fee_agent' hidden={true} export={true}>Fee Agent</TableHeaderColumn>
						<TableHeaderColumn dataField='fee_loper' hidden={true} export={true}>Fee Loper</TableHeaderColumn>
						<TableHeaderColumn dataField="point" dataAlign="center" width='125px'>Point</TableHeaderColumn>
						<TableHeaderColumn dataField='debit_kredit' hidden={true} export={true}>Debit Kredit</TableHeaderColumn>
						<TableHeaderColumn dataField='biller_host' hidden={true} export={true}>Biller Host</TableHeaderColumn>
						<TableHeaderColumn dataField='response_host' hidden={true} export={true}>Response Host</TableHeaderColumn>
						<TableHeaderColumn dataField='response_host_note' hidden={true} export={true}>Response Host Note</TableHeaderColumn>
						<TableHeaderColumn dataField='response_mobile' hidden={true} export={true}>Response Mobile</TableHeaderColumn>
						<TableHeaderColumn dataField='response_mobile_note' hidden={true} export={true}>Response Mobile Note</TableHeaderColumn>
						<TableHeaderColumn dataField="balance_before" dataAlign="center" width='150px'>Balance Before</TableHeaderColumn>
						<TableHeaderColumn dataField="balance_after" dataAlign="center" width='150px'>Balance After</TableHeaderColumn>
						<TableHeaderColumn ref='customerNumberCol' dataField="customer_number" dataAlign="center" width='200px' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Customer Number</TableHeaderColumn>
						<TableHeaderColumn dataField='customer_name' hidden={true} export={true}>Customer Name</TableHeaderColumn>
						<TableHeaderColumn ref='billingIdCol' dataField="billing_id" dataAlign="center" width='200px' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Billing ID</TableHeaderColumn>
						<TableHeaderColumn dataField='billing_name' hidden={true} export={true}>Billing Name</TableHeaderColumn>
						<TableHeaderColumn dataField='billing_denom' hidden={true} export={true}>Billing Denom</TableHeaderColumn>
						<TableHeaderColumn ref='statusCol' dataField="status" dataAlign="center" dataSort={true} width='115px' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Status</TableHeaderColumn>
						<TableHeaderColumn dataField='note_request' hidden={true} export={true}>Note Request</TableHeaderColumn>
						<TableHeaderColumn dataField='note_response' hidden={true} export={true}>Note Response</TableHeaderColumn>
						<TableHeaderColumn dataField='created_at' hidden={true} dataFormat = {this._dateFormat.bind(this)} export={true}>Created At</TableHeaderColumn>
						<TableHeaderColumn dataField='updated_at' hidden={true} dataFormat = {this._dateFormat.bind(this)} export={true}>Updated At</TableHeaderColumn>
						<TableHeaderColumn dataField='deleted_at' hidden={true} dataFormat = {this._dateFormat.bind(this)} export={true}>Deleted At</TableHeaderColumn>
						<TableHeaderColumn dataField='approve_id' hidden={true} export={true}>Approve ID</TableHeaderColumn>
						<TableHeaderColumn dataField="button" dataAlign="center" width='100px' dataFormat={this.buttonFormatter.bind(this)}>Actions</TableHeaderColumn>
					</BootstrapTable>
				</React.Fragment>
      )
    } else {
      return ('You are not authorized to access this page')
    }
  }
}

function mapStateToProps(state) {
		const { user, table_states } = state
		
    return { user, table_states }
}

export default withRouter(connect(mapStateToProps, { LogUser, FormMode, SetTableStates })(TransactionList))
