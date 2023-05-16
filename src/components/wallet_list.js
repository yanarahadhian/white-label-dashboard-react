import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Icon, message, Tooltip, Spin, Row, Col } from "antd";
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import { LogUser, FormMode, SetTableStates } from '../actions';
import axios from "axios";
import moment from "moment";
import { config } from "../config";
import { readFilterData } from '../middleware/read_filter';
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
      api_url: config().api_url,
      limit: 5,
      offset: 1,
      columnFilter: false,
      filterObj: {},
      isLoading: false,
      sortName: undefined,
      sortOrder: undefined,
      config: { headers: {'token': localStorage.getItem('token')}},
      networkAgan : (this.props.user.network === 0) ? (true) : (false),
      pagepath : this.props.location.pathname
    }

    this.viewRow = this.viewRow.bind(this)
		this.onSortChange = this.onSortChange.bind(this)
    this.exportData = this.exportData.bind(this)
  }

  componentWillMount() {
    const rights = this.state.user_rights
    const page_url = this.props.location.pathname
    const table_states = this.props.table_states
    let offset, limit, sortName, sortOrder, filterObj = null

    // receive table_states if previous page is still in the same page circle
    if (table_states.pagepath === page_url) {
      offset = table_states.offset
      limit = table_states.limit
      sortName = table_states.sortName
      sortOrder = table_states.sortOrder
      filterObj = table_states.filterObj
    } else {
      this.props.SetTableStates({})
    }

    for (let item in rights) {
      let isInclude = page_url.includes(rights[item].page_url)

      if (isInclude) {
        if (rights[item].create === 1 || rights[item].read === 1 || rights[item].update === 1 || rights[item].delete === 1 || rights[item].approve === 1) {
          this.setState({
            isAuthorized: true,
            create: (rights[item].create===1) ? true : false,
            read: (rights[item].read===1) ? true : false,
            update: (rights[item].update===1) ? true : false,
            delete: (rights[item].delete===1) ? true : false,
            offset : (offset) ? (offset) : (this.state.offset),
            limit : (limit) ? (limit) : (this.state.limit),
            sortName : (sortName) ? (sortName) : (this.state.sortName),
            sortOrder : (sortOrder) ? (sortOrder) : (this.state.sortOrder),
            filterObj : (filterObj) ? (filterObj) : (this.state.filterObj),
          }, async () => {
            if (Object.keys(table_states).length > 0) {
              await this.assignFilter()
              await this.fetchData(offset, limit, sortName, sortOrder, filterObj)
            } else {
              this.fetchData()
            }
          })
        }
      }
    }
  }

  fetchData(page = this.state.offset, size = this.state.limit, sortName = this.state.sortName, sortOrder = this.state.sortOrder, filterObj = this.state.filterObj) {
    this.setState({ isLoading : true })
    
    let { api_url, config } = this.state
    let user_network = this.props.user.network
    let url = api_url + '/api/wallet/?page=' + page + '&size=' + size

    // Sort management
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

    // Filter Management
		if (filterObj !== undefined && filterObj !== {} ) {
      let filterUrl = readFilterData(filterObj)
			url += filterUrl
    }
    
    // Get data only from network if user_network exists
    if (user_network && user_network !== 0) {
      url += `&network=${ user_network }`
    }

    console.log(url)

    axios.get(url, config)
    .then((response) => {
      console.log(response.data)

      if (response.data.ResponseCode === '200') {
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
          totalDataSize : 0 })
      }
    }, (err) => {
      this.setState({ isLoading : false })
      console.error(err)
    })
  }

  assignFilter() {
    const { filterObj } = this.state

    if (Object.keys(filterObj).length > 0) {
      
      if (filterObj.name) {
        this.refs.nameCol.applyFilter(filterObj.name.value)
      }
      
      if (filterObj.account_id) {
        this.refs.accountIdCol.applyFilter(filterObj.account_id.value)
      }

      if (filterObj.agent_loper_biller) {
        this.refs.accountTypeCol.applyFilter(filterObj.agent_loper_biller.value)
      }

      if (filterObj.efective_balance) {
        this.refs.efectiveBalanceCol.applyFilter(filterObj.efective_balance.value)
      }

      if (filterObj.efective_point) {
        this.refs.efectivePointCol.applyFilter(filterObj.efective_point.value)
      }

      if (filterObj.network_name) {
        this.refs.networkCol.applyFilter(filterObj.network_name.value)
      }

      if (filterObj.batas_limit) {
        this.refs.limitCol.applyFilter(filterObj.batas_limit.value)
      }

      if (filterObj.enable_disable) {
        this.refs.statusCol.applyFilter(filterObj.enable_disable.value)
      }
    }
  }

  dispatchTableStates() {
    const { offset, limit, sortName, sortOrder, filterObj, pagepath } = this.state
    const table_states = { offset, limit, sortName, sortOrder, filterObj, pagepath }

    this.props.SetTableStates(table_states)
  }

  onPageChange(page, sizePerPage) {
    this.setState({
      offset: page,
      limit: sizePerPage
    }, () => {
      this.dispatchTableStates()
      this.fetchData()
    })
  }

  onSortChange(sortName, sortOrder) {
    this.setState({
      offset : 1,
      sortName,
      sortOrder,
    }, () => {
      this.dispatchTableStates()
      this.fetchData()
    })
  }

  onFilterChange(filterObj) {
    // if filterObj on onFilterChange() compared to filterObj on table_states returns true, set offset on state to 1 and the current state on vice versa
    // differentiate conditions when component first loaded with table_state on redux, with onFilterChange after component rendered
    const table_states = this.props.table_states
    const isFilterTableStatesActive = table_states.filterObj && table_states.filterObj.constructor === Object && Object.keys(table_states.filterObj).length > 0
    const isFilterTableStatesChanged = table_states.filterObj === filterObj

    const isFilterActive = filterObj.constructor === Object && Object.keys(filterObj).length > 0
    
    this.setState({
      offset : (isFilterTableStatesActive) ? (isFilterTableStatesChanged === true) ? (1) : (this.state.offset) : (1),
      columnFilter : (isFilterActive) ? (true) : (false),
      filterObj : (isFilterActive) ? (filterObj) : ({})
    }, () => {
      this.dispatchTableStates()
      this.fetchData()
    })
	}
	
	exportData() {
    let { columnFilter, api_url, config, offset, limit, sortName, sortOrder, filterObj } = this.state

    let user_network = this.props.user.network
    let url = api_url + '/api/wallet/?page=all'
    let exportData = false

    // Sort management
    if (sortName) {
			url += `&orderName=${ sortName }`

			if (sortOrder) {
				url += `&orderBy=${ sortOrder }`
			} else {
				url += `&orderBy=ASC`
			}
    }

    // Get data only from network if user_network exists
    if (user_network && user_network !== 0) {
      url += `&network=${ user_network }`
    }

    if (columnFilter && filterObj !== undefined && filterObj !== {}) {
        // Filter Management
        let filterUrl = readFilterData(filterObj)
        url += filterUrl

        exportData = true
    } else {
      exportData = window.confirm("Do you really want to export all data ?")
    }

    if (exportData) {
      
      console.log(url)
      
      axios.get(url, config)
      .then((response) => {
        console.log(response.data)
        if (response.data.ResponseCode === '200') {

          downloadCSV(response.data.ResponseData, 'wallet')
          this.fetchData(offset, limit, sortName, sortOrder, filterObj)

        } else {
          if (response.data.status === '401') {
            this.setState({
              isAuthorized : false,
              data : [],
              totalDataSize : 0
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

	buttonFormatter(cell, row){
    var edit = (this.state.update) ? <a onClick={()=>this.editRow(row)} ><Tooltip title="Edit"><Icon type="edit" /></Tooltip></a> : ' ';
    var view = (this.state.read) ? <a onClick={()=>this.viewRow(row)} style={{ marginLeft: '10px'}}><Tooltip title="View"><Icon type="search" /></Tooltip></a> : ' ';

		return <div>{edit} {view}</div> 
	}

  _dateFormat(cell, row){ return cell ? moment(cell, "YYYY-MM-DD HH:mm:ss").format("DD/MM/YYYY HH:mm:ss") : ""; }

  handleSizePerPageChange(sizePerPage) {
    // When changing the size per page always navigating to the first page
    let { sortName, sortOrder, filterObj } = this.state

    this.setState({
      offset : 1,
      limit : sizePerPage
    }, () => {
      this.fetchData(1, sizePerPage, sortName, sortOrder, filterObj)
    })
	}
	
	viewRow(row){
    let dispatch = this.props
    dispatch.FormMode('view')
    this.props.history.push({
      pathname: `/wallet/view/${row.user_id}`
    })
	}
	
	editRow(row){
    let dispatch = this.props
    dispatch.FormMode('edit')
    this.props.history.push({
      pathname: `/wallet/edit/${row.user_id}`
    })
	}
	
  render() {
    if (this.state.isAuthorized) {
      return (
        <React.Fragment>
          <Row type="flex" justify="end" style={{ marginBottom : '30px' }}>
              <Col>
                <Button 
                  className='base_button primary'
                  type="primary" 
                  htmlType="submit" 
                  style={{ marginLeft: '5px' }}
                  onClick={ this.exportData }
                  >
                  Export CSV
                </Button>
              </Col>
            </Row>

          <BootstrapTable 
            data={this.state.data} 
            striped={true} 
            hover={true} 
            remote={true} 
            fetchInfo={ { dataTotalSize: this.state.totalDataSize } } 
            condensed 
            pagination
            options={ { 
              sizePerPageList: [ {
                  text: '5', value: 5
                }, {
                  text: '10', value: 10
                }, {
                  text: '15', value: 15
                } ],
              sizePerPage: this.state.limit,
              onSizePerPageList: this.handleSizePerPageChange.bind(this),
              onPageChange: this.onPageChange.bind(this),
              page: this.state.offset,
              onFilterChange: this.onFilterChange.bind(this),
              noDataText: (this.state.isLoading) ? <Spin/> : 'No Data Found',
              sortName: this.state.sortName,
              sortOrder: this.state.sortOrder,
              onSortChange: this.onSortChange
          }} >
            <TableHeaderColumn dataField='id' isKey={true} hidden={true}>ID</TableHeaderColumn>
            <TableHeaderColumn dataField='user_id' hidden={true}>ID</TableHeaderColumn>
            <TableHeaderColumn ref='nameCol' dataField="name" dataAlign="center" width='125px' export={true} dataSort={ true } filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Name</TableHeaderColumn>
            <TableHeaderColumn ref='accountIdCol' dataField='account_id' dataAlign="center" width='100px' export={true} dataSort={ true } filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Account</TableHeaderColumn>
            <TableHeaderColumn ref='accountTypeCol' dataField='agent_loper_biller' dataAlign="center" width='90px' export={true} dataSort={ true } filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Account Type</TableHeaderColumn>
            <TableHeaderColumn dataField='type' hidden={true} export={true}>Transaction Type</TableHeaderColumn>
            <TableHeaderColumn ref='efectiveBalanceCol' dataField='efective_balance' dataAlign="center" width='100px' export={true} dataSort={ true } filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Effective Balance</TableHeaderColumn>
            <TableHeaderColumn dataField='temporary_balance' hidden={true} export={true}>Temporary Balance</TableHeaderColumn>
            <TableHeaderColumn ref='efectivePointCol' dataField='efective_point' dataAlign="center" width='100px' export={true} dataSort={ true } filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Effective Point</TableHeaderColumn>
            <TableHeaderColumn dataField='temporary_point' hidden={true} export={true}>Temporary Point</TableHeaderColumn>
            <TableHeaderColumn ref='networkCol' dataField='network_name' hidden={ !this.state.networkAgan } export={ !this.state.networkAgan } dataSort={ true } dataAlign="center" width='100px' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Network</TableHeaderColumn>
            <TableHeaderColumn ref='limitCol' dataField='batas_limit' dataAlign="center" width='90px' export={true} dataSort={ true } filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Balance Limit</TableHeaderColumn>
            <TableHeaderColumn dataField='description' hidden={true} export={true}>Description</TableHeaderColumn>
            <TableHeaderColumn dataField='value_data' hidden={true} export={true}>Value Data</TableHeaderColumn>
            <TableHeaderColumn ref='statusCol' dataField='enable_disable' dataAlign="center" width='75px' export={true} dataSort={ true } filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Status</TableHeaderColumn>
            <TableHeaderColumn dataField='note' hidden={true} export={true}>Note</TableHeaderColumn>
            <TableHeaderColumn dataField="button" dataFormat={this.buttonFormatter.bind(this)} width='75px' dataAlign="center">Actions</TableHeaderColumn> 
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

export default withRouter(connect(mapStateToProps, { LogUser, FormMode, SetTableStates })(WalletList))
