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

class TopUpList extends Component {
  constructor(props){
    super(props)

    this.state = {
      user_rights: (this.props.user.rights) ? this.props.user.rights : '',
      isAuthorized: false,
      create: false,
      read: false,
      update: false,
      delete: false,
      approve: false,
      data: [],
      totalDataSize: 0,
      api_url: config().api_url,
      size: 5,
      page: 1,
      columnFilter: false,
      filterObj: {},
      isLoading: false,
      sortName: undefined,
      sortOrder: undefined,
      config: { headers: {'token': localStorage.getItem('token')}},
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
    let page, size, sortName, sortOrder, filterObj = null
    
    console.log('table states on will mount : ', table_states)

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
        if (rights[item].create === 1 || rights[item].read === 1 || rights[item].update === 1 || rights[item].delete === 1 || rights[item].approve === 1) {
          this.setState({
            isAuthorized: true,
            create: (rights[item].create === 1) ? true : false,
            read: (rights[item].read === 1) ? true : false,
            update: (rights[item].update === 1) ? true : false,
            delete: (rights[item].delete === 1) ? true : false,
            approve: (rights[item].approve === 1) ? true : false,
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
    this.setState({ isLoading : true })
    
    let { api_url, config } = this.state
    let user_network = this.props.user.network
    let url = api_url + '/api/topup_wallet/?page=' + page + '&size=' + size

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
      url += `&network_id=${ user_network }`
    }

    // Filter Management
		if (filterObj && filterObj !== {}) {
      let filterUrl = readFilterData(filterObj)
      url += filterUrl
    }

    console.log(url)

    axios.get(url, config)
    .then((response) => {
      if (response.data.ResponseCode === '200') {
        this.setState({
          data: response.data.ResponseData,
          totalDataSize: response.data.ResponseTotalResult,
          isLoading: false
        }, () => {
          console.log(this.state.data)
        })
      } else {
        if (response.data.status === '401') {
          message.error('Login Authentication Expired. Please Login Again!')
        } else {
          message.error((response.data.ResponseDesc.sqlMessage) ? ('Database Error!') : (response.data.ResponseDesc) )
        }

        this.setState({
          data : [],
          totalDataSize : 0,
          isLoading : false
        }, () => {
          console.log(response.data)
        })
      }
    }, (err) => {
      console.error(err)
    })
  }

  assignFilter() {
    const { filterObj } = this.state

    if (Object.keys(filterObj).length > 0) {

      if (filterObj.username) {
        this.refs.usernameCol.applyFilter(filterObj.username.value)
      }
      
      if (filterObj.name) {
        this.refs.nameCol.applyFilter(filterObj.name.value)
      }
        
      if (filterObj.network) {
        this.refs.networkCol.applyFilter(filterObj.network.value)
      }

      if (filterObj.agen_lopper_biller) {
        this.refs.accountTypeCol.applyFilter(filterObj.agen_lopper_biller.value)
      }

      if (filterObj.payment_type) {
        this.refs.paymentTypeCol.applyFilter(filterObj.payment_type.value)
      }

      if (filterObj.amount) {
        this.refs.amountCol.applyFilter(filterObj.amount.value)
      }

      if (filterObj.request_status) {
        this.refs.requestStatusCol.applyFilter(filterObj.request_status.value)
      }

      if (filterObj.request_date) {
        let newDate = new Date(filterObj.request_date.value.date)
        this.refs.requestDateCol.applyFilter({ date : newDate, comparator : filterObj.request_date.value.comparator })
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
      page: page,
      size: sizePerPage
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
    let { columnFilter, api_url, config, page, size, sortName, sortOrder, filterObj } = this.state

    let user_network = this.props.user.network
    let url = api_url + '/api/topup_wallet/?page=all'
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
      url += `&network_id=${ user_network }`
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
          
          downloadCSV(response.data.ResponseData, 'topup')
          this.fetchData(page, size, sortName, sortOrder, filterObj)

        } else {
          if (response.data.status === '401') {
            message.error('Login Authentication Expired. Please Login Again!')
          } else {
            message.error((response.data.ResponseDesc.sqlMessage) ? ('Database Error!') : (response.data.ResponseDesc) )
          }

          this.setState({ data : [], totalDataSize : 0 })
        }
      }, (err) => {
        console.error(err)
      })
    }
  }

	buttonFormatter(cell, row){
    let taken_action = (row.request_status === "Approved" || row.request_status === "Rejected") ? true : false
    
    var view = (this.state.read) ? <a onClick={()=>this.viewRow(row)} style={{ marginLeft: '5px'}}><Tooltip title="View"><Icon type="search" /></Tooltip></a> : ' ';
    var approve = (taken_action) ? '' : (this.state.approve) ? <a onClick={()=>this.updateStatus(row,"Approved")} style={{ marginLeft: '5px'}}><Tooltip title="Approve"><Icon type="check-circle" /></Tooltip></a> : '';
    var reject = (taken_action) ? '' : (this.state.approve) ? <a onClick={()=>this.updateStatus(row,"Rejected")} style={{ marginLeft: '5px'}}><Tooltip title="Reject"><Icon type="close-circle" /></Tooltip></a> : '';
    
    return <div>{view} {approve} {reject}</div>
	}

  _dateFormat(cell, row){ return cell ? moment(cell, "YYYY-MM-DD HH:mm:ss").format("DD/MM/YYYY HH:mm:ss") : ""; }

  handleSizePerPageChange(sizePerPage) {
    // When changing the size per page always navigating to the first page
    let { sortName, sortOrder, filterObj } = this.state

    this.setState({
      page : 1,
      size : sizePerPage
    }, () => {
      this.fetchData(1, sizePerPage, sortName, sortOrder, filterObj)
    })
	}
  
  viewRow(row){
    let dispatch = this.props
    dispatch.FormMode('view')
    this.props.history.push({
      pathname: `/top_up/view/${row.id}`
    })
	}
	
	addRow(){
    let dispatch = this.props
    dispatch.FormMode('add')
    this.props.history.push({
      pathname: '/top_up/new',
    })
  }
  
  updateStatus(row,action){
    let { size, sortName, sortOrder, filterObj } = this.state
    
    let data = {
      id: row.id,
      request_status: action,
      request_by: this.props.user.username,
      request_at: moment().format("YYYY-MM-DD HH:mm:ss"),
    }
    axios.put(this.state.api_url+'/api/topup_wallet/', data, this.state.config)
      .then((response) => {
          if(response.data.ResponseCode==="500"){
            message.error(response.data.ResponseDesc.error);
          } else {
            message.success(response.data.ResponseDesc);
            this.fetchData(1, size, sortName, sortOrder, filterObj)
          }
          console.log(response)
      }, (err) => {
        message.error(err.data.ResponseDesc);
        console.error(err)
        return false
      })
  }

  imageFormatter(cell, row){
    return <img width="40" height="auto" src={row.transfer_receipt} alt=""/>
  }

  render() {
    const { isAuthorized, create } = this.state

    if (isAuthorized) {
      return (
        <React.Fragment>
          <Row type="flex" justify="end" style={{ marginBottom : "30px" }}>
            <Col>
              <Button className='base_button primary' onClick={this.exportData} >
                  Export CSV
              </Button>
              {
                (create) ? <Button className='base_button primary' onClick={()=>this.addRow()} >Add Record</Button> : ''
              }
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
            options={{ 
              sizePerPageList: [ {
                  text: '5', value: 5
                }, {
                  text: '10', value: 10
                }, {
                  text: '15', value: 15
                } ],
              sizePerPage: this.state.size,
              onSizePerPageList: this.handleSizePerPageChange.bind(this),
              onPageChange: this.onPageChange.bind(this),
              page: this.state.page,
              onFilterChange: this.onFilterChange.bind(this),
              noDataText: (this.state.isLoading) ? <Spin/> : 'No Data Found',
              sortName: this.state.sortName,
              sortOrder: this.state.sortOrder,
              onSortChange: this.onSortChange
            }} >
                <TableHeaderColumn dataField='id' isKey={true} hidden={true}>ID</TableHeaderColumn>
                <TableHeaderColumn ref='usernameCol' dataField="username" dataAlign="center" width='125px' export={true} dataSort={ true } filter={ { type: 'TextFilter', placeholder: 'Please enter a value', condition : 'eq' } }>Username</TableHeaderColumn>
                <TableHeaderColumn ref='nameCol' dataField="name" dataAlign="center" width='125px' export={true} dataSort={ true } filter={ { type: 'TextFilter', placeholder: 'Please enter a value', condition : 'eq' } }>Name</TableHeaderColumn>
                <TableHeaderColumn ref='networkCol' dataField="network" dataAlign="center" width='115px' export={true} dataSort={ true } filter={ { type: 'TextFilter', placeholder: 'Please enter a value', condition : 'eq' } }>Network</TableHeaderColumn>
                <TableHeaderColumn ref='accountTypeCol' dataField="agen_lopper_biller" dataAlign="center" width='115px' export={true} dataSort={ true } filter={ { type: 'TextFilter', placeholder: 'Please enter a value', condition : 'eq' } }>Account Type</TableHeaderColumn>
                <TableHeaderColumn ref='paymentTypeCol' dataField='payment_type' dataAlign="center" width='115px' export={true} dataSort={ true } filter={ { type: 'TextFilter', placeholder: 'Please enter a value', condition : 'eq' } }>Payment Type</TableHeaderColumn>
                <TableHeaderColumn ref='amountCol' dataField='amount' dataAlign="center" width='100px' export={true} dataSort={ true } filter={ { type: 'TextFilter', placeholder: 'Please enter a value', condition : 'eq' } }>Amount</TableHeaderColumn>
                <TableHeaderColumn dataField="transfer_receipt" dataAlign="center" width='125px' hidden={true} export={true} dataFormat={this.imageFormatter}>Receipt</TableHeaderColumn>
                <TableHeaderColumn ref='requestStatusCol' dataField='request_status' dataAlign="center" width='100px' export={true} dataSort={ true } filter={ { type: 'TextFilter', placeholder: 'Please enter a value', condition : 'eq' } }>Status</TableHeaderColumn>
                <TableHeaderColumn ref='requestDateCol' dataField='request_date' dataAlign="center" width='170px' export={true} dataSort={ true } dataFormat = {this._dateFormat.bind(this)} filter={ { type: 'DateFilter' } }>Request Date</TableHeaderColumn>
                <TableHeaderColumn dataField="button" dataFormat={this.buttonFormatter.bind(this)} dataAlign="center" width='75px'>Actions</TableHeaderColumn>   
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

export default withRouter(connect(mapStateToProps, { LogUser, FormMode, SetTableStates })(TopUpList));
