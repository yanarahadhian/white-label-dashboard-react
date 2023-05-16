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

class WalletList extends Component {
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
					filterObj : (filterObj) ? (filterObj) : (this.state.filterObj),
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

		this.setState({ isLoading : true, data : []})

		let user_network = this.props.user.network
    
		let url = api_url + '/api/wallet_log/?page=' + page

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
			url += `&orderName=transaction_date&orderBy=DESC`
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
			this.setState({ isLoading: false })
			console.error(err)
		})

	}

	assignFilter() {
		const { filterObj } = this.state

		if (Object.keys(filterObj).length > 0) {

			if (filterObj.user_id) {
				this.refs.userIdCol.applyFilter(filterObj.user_id.value)
			}
			
			if (filterObj.userName) {
				this.refs.userNameCol.applyFilter(filterObj.userName.value)
			}

			if (filterObj.owner) {
				this.refs.ownerNameCol.applyFilter(filterObj.owner.value)
			}

			if (filterObj.transaction_date) {
				let newDate = new Date(filterObj.transaction_date.value.date)
        this.refs.transactionDateCol.applyFilter({ date : newDate, comparator : filterObj.transaction_date.value.comparator })
			}

			if (filterObj.invoice_id) {
				this.refs.invoiceIdCol.applyFilter(filterObj.invoice_id.value)
			}

			if (filterObj.source_account_id) {
				this.refs.sourceAccountCol.applyFilter(filterObj.source_account_id.value)
			}

			if (filterObj.dest_account_id) {
				this.refs.destinationAccountCol.applyFilter(filterObj.dest_account_id.value)
			}

			if (filterObj.product) {
				this.refs.productNameCol.applyFilter(filterObj.product.value)
			}

			if (filterObj.sku) {
				this.refs.skuCol.applyFilter(filterObj.sku.value)
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

	exportData() {
		let { api_url, config, sortName, sortOrder, columnFilter, filterObj } = this.state
		
		let user_network = this.props.user.network
		let url = api_url + '/api/wallet_log/?page=all'
		let exportAll = false

		if (sortName) {
			url += `&orderName=${ sortName }`

			if (sortOrder) {
				url += `&orderBy=${ sortOrder }`
			} else {
				url += `&orderBy=ASC`
			}
		} else {
			url += `&orderName=transaction_date&orderBy=DESC`
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
					downloadCSV(response.data.ResponseData, 'wallet-logs')
				} else {
					if (response.data.status === '401') {
						this.setState({
							isAuthorized : false
						}, () => {
							message.error('Login Authentication Expired. Please Login Again!')
						})
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
		  pathname: `/wallet_logs/view/${row.id}`
		})
	}
  
  render() {
		const { isAuthorized } = this.state

    if (isAuthorized) {
      return (
				<React.Fragment>
					<Row type="flex" justify="end" style={{ marginBottom : '30px' }}>
            <Col>  
							<Button className='base_button primary' onClick={this.exportData} >
								Export CSV
							</Button>
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
							<TableHeaderColumn ref='userIdCol' dataField="user_id" isKey={true} dataAlign="center" width='125px' dataSort={true} filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>User ID</TableHeaderColumn>
							<TableHeaderColumn ref='userNameCol' dataField='userName' dataAlign="center" width='125px' dataSort={true} filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Name</TableHeaderColumn>
							<TableHeaderColumn ref='ownerNameCol' dataField="owner" dataAlign="center" width='100px' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Owner</TableHeaderColumn>
							<TableHeaderColumn ref='transactionDateCol' dataField="transaction_date" dataAlign="center" dataSort={true} width='300px' dataFormat = {this._dateFormat.bind(this)}  filter={ { type: 'DateFilter' } }>Transaction Date</TableHeaderColumn>
							<TableHeaderColumn ref='invoiceIdCol' dataField="invoice_id" dataAlign="center" width='300px' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Invoice ID</TableHeaderColumn>
							<TableHeaderColumn ref='sourceAccountCol' dataField="source_account_id" dataAlign="center" width='150px' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Source Account ID</TableHeaderColumn>
							<TableHeaderColumn ref='destinationAccountCol' dataField="dest_account_id" dataAlign="center" width='150px' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Dest Account ID</TableHeaderColumn>
							<TableHeaderColumn dataField="currency" dataAlign="center" width='100px'>Currency</TableHeaderColumn>
							<TableHeaderColumn dataField="amount" dataAlign="center" width='100px' dataFormat={ (value) => formatNumber(value) } >Amount</TableHeaderColumn>
							<TableHeaderColumn dataField="type_trans" dataAlign="center" width='100px'>Type Trans</TableHeaderColumn>
							<TableHeaderColumn dataField="type" dataAlign="center" width='100px' >Type</TableHeaderColumn>
							<TableHeaderColumn ref='productNameCol' dataField="product" dataAlign="center" width='200px' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Product</TableHeaderColumn>
							<TableHeaderColumn ref='skuCol' dataField="sku" dataAlign="center" dataSort={true} width='200px' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>SKU</TableHeaderColumn>
							<TableHeaderColumn dataField='description' hidden={true} export={true}>Description</TableHeaderColumn>
							<TableHeaderColumn dataField='created_at' hidden={true} dataFormat = {this._dateFormat.bind(this)} export={true}>Created At</TableHeaderColumn>
							<TableHeaderColumn dataField='updated_at' hidden={true} dataFormat = {this._dateFormat.bind(this)} export={true}>Updated At</TableHeaderColumn>
							<TableHeaderColumn dataField='deleted_at' hidden={true} dataFormat = {this._dateFormat.bind(this)} export={true}>Deleted At</TableHeaderColumn>
							<TableHeaderColumn dataField="button" dataAlign="center" width='75px' dataFormat={this.buttonFormatter.bind(this)}>Actions</TableHeaderColumn>
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

function formatNumber(value) {
	value += '';
	const list = value.split('.');
	const prefix = list[0].charAt(0) === '-' ? '-' : '';
	let num = prefix ? list[0].slice(1) : list[0];
	let result = '';
	while (num.length > 3) {
		result = `,${num.slice(-3)}${result}`;
		num = num.slice(0, num.length - 3);
	}
	if (num) {
		result = num + result;
	}
	return `${prefix}${result}${list[1] ? `.${list[1]}` : ''}`;
}

export default withRouter(connect(mapStateToProps, { LogUser, FormMode, SetTableStates })(WalletList))
