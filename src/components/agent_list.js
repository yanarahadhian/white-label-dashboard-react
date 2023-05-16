import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Icon, message, Tooltip, Spin, Row, Col } from "antd";
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import { FormMode, LogUser, SetTableStates } from '../actions';
import axios from "axios";
import { config } from "../config";
import { readFilterData } from '../middleware/read_filter'
import { downloadCSV } from '../middleware/export'

class AgentList extends Component {
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
      size: 5,
      page: 1,
      columnFilter: false,
      filterObj: {},
      sortName: undefined,
      sortOrder: undefined,
      isLoading: false,
      selectedRow: {},
      pageRole : 3,
      config: { headers: {'token': localStorage.getItem('token')}},
      networkAgan : (this.props.user.network === 0) ? (true) : (false),
      pagepath : this.props.location.pathname
    }

    this.handleDeleteRow = this.handleDeleteRow.bind(this)
    this.handleDeleteButton = this.handleDeleteButton.bind(this)
    this.handleRowSelect = this.handleRowSelect.bind(this)
    this.exportData = this.exportData.bind(this)
    this.importFile = this.importFile.bind(this)
    this.onSortChange = this.onSortChange.bind(this)
  }

  componentWillMount(){
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

    console.log("Load params : ", { network : this.props.user.network, typeOfNetwork : typeof this.props.user.network, isNetworkAgan : this.state.networkAgan })

    for (let item in rights) {
      if (rights[item].page_url === page_url) {
        if (rights[item].create===1 || rights[item].read===1 || rights[item].update===1 || rights[item].delete===1 || rights[item].approve===1) {
          this.setState({
            isAuthorized: true,
            create: (rights[item].create===1) ? true : false,
            read: (rights[item].read===1) ? true : false,
            update: (rights[item].update===1) ? true : false,
            delete: (rights[item].delete===1) ? true : false,
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

    const { api_url, config, pageRole, networkAgan } = this.state
    const user_network = this.props.user.network
    let url = api_url + '/api/users?role=' + pageRole + '&page=' + page + '&size=' + size

    // Sort Management
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
    if (filterObj && filterObj !== {}) {
      let filterUrl = readFilterData(filterObj)
      url += filterUrl
    }

    // Network Management
    if (user_network && !networkAgan) {
      url += `&network_id=${ user_network }`
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
    })
    .catch((err) => {
      this.setState({ isLoading : false })
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

      if (filterObj.email) {
        this.refs.emailCol.applyFilter(filterObj.email.value)
      }

      if (filterObj.phone_number) {
        this.refs.phoneCol.applyFilter(filterObj.phone_number.value)
      }

      if (filterObj.networkName) {
        this.refs.networkCol.applyFilter(filterObj.networkName.value)
      }

      if (filterObj.areaName) {
        this.refs.areaCol.applyFilter(filterObj.areaName.value)
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

  onPageChange(page, sizePerPage) {
    this.setState({
      page: page,
      size: sizePerPage
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

  importFile() {
    this.props.history.push({
      pathname: '/agent_account/bulk'
    })
  }

  exportData() {
    let { api_url, config,  pageRole, columnFilter, sortName, sortOrder, filterObj, networkAgan } = this.state

    let user_network = this.props.user.network
    let url = api_url + '/api/users?page=all&role=' + pageRole
    let exportAll = false

    // SORT MANAGEMENT
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
    if (user_network && !networkAgan) {
			url += `&network_id=${ user_network }`
    }

    if (columnFilter && filterObj !== undefined && filterObj !== {} ) {
      // Filter Management

      let filterUrl = readFilterData(filterObj)
      url += filterUrl
      exportAll = true

    } else { 
      exportAll = window.confirm("Do you really want to export all data ?");
    }

    if (exportAll) {

      console.log('Export data request : ', url)
      
      axios.get(url, config)
      .then((response) => {
        if (response.data.ResponseCode === "200") {
          downloadCSV(response.data.ResponseData, 'agent')
        } else {
          message.error(response.data.ResponseDesc)
        }
      }, (err) => {
        console.error(err)
      })
    }
  }

  handleSizePerPageChange(sizePerPage) {
    this.setState({
      page : 1,
      size : sizePerPage
    }, () => {
      this.fetchData()
    })
  }

  handleDeleteRow() {
    let { api_url, config, selectedRow } = this.state

    let username = selectedRow.username
    let url = api_url + '/api/users/?username=' + username
    
    let remove = window.confirm("Do you want to delete this data ?");
    
    if (remove) {
      axios.delete(url, config)
      .then((response) => {
				console.log('response : ', response.data)

				if (response.data.ResponseCode === "500") {
					message.error(response.data.ResponseDesc.sqlMessage);
				} else {
          this.setState({ selectedRow: {} })
          
          message.success(response.data.ResponseDesc);
          this.fetchData()
				}
			}, (err) => {
				message.error(err.data.ResponseDesc);
				return false
			})
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

  /* handleCreateVA(row) {
    let { api_url, config } = this.state
    let url = api_url + '/api/va/'

    this.setState({ isLoading: true })

    let payload = {
      Username: row.username,
      BillingType: 'o',
      TrxAmount: '0'
    }

    axios.post(url, payload, config)
    .then((response) => {
        console.log(response)

        if (response.data.ResponseCode === '200' || response.data.ResponseCode === 0) {
          message.success(response.data.ResponseDesc)
          this.fetchData()
        } else {
          if (response.data.status === '401') {
            this.setState({
              data : [],
              isAuthorized : false
            }, () => {
              message.error('Login Authentication Expired. Please Login Again!')
            })
          } else {
            let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : ""
            message.error(msg)
          }
        }
  
        this.setState({ isLoading: false })
    }, (err) => {
      console.error(err)
      message.error(err.data.ResponseDesc)
      this.setState({ isLoading: false })
      return false
    })
  } */

  buttonFormatter(cell, row) {
    var reload = <a onClick={()=>this.updateStatus(row)} style={{ marginLeft: '5px'}}><Tooltip title="Enable / Disable"><Icon type="reload" /></Tooltip></a>;
    var edit = (this.state.update) ? <a onClick={()=>this.editRow(row)} style={{ marginLeft: '5px'}}><Tooltip title="Edit"><Icon type="edit" /></Tooltip></a> : ' ';
    var reset_password = <a onClick={()=>this.resetPassword(row)} style={{ marginLeft: '5px'}}><Tooltip title="Reset Password"><Icon type="key" /></Tooltip></a>;
    var button_group = (this.state.isLoading) ? <Spin /> : <div>{reload} {edit} {reset_password}</div>

    return <div>{button_group}</div>
  }

  addRow(){
    let dispatch = this.props
    dispatch.FormMode('add')
    
    this.props.history.push({
      pathname: '/agent_account/new'
    })
  }

  editRow(row){
    let dispatch = this.props
    dispatch.FormMode('edit')

    this.props.history.push({
      pathname: `/agent_account/edit/${row.id}`
    })
  }

  updateStatus(row){
    this.setState({ isLoading: true })

    axios.post(this.state.api_url+'/api/agent/update_status', row)
      .then((response) => {
        console.log(response.data)
          if(response.data.ResponseCode==="99"){
            message.error(response.data.ResponseDesc.sqlMessage);
          } else {
            message.success(response.data.ResponseDesc);
            this.fetchData()
          }
          this.setState({ isLoading: false })
      }, (err) => {
        message.error(err.data.ResponseDesc);
        console.error(err)
        this.setState({ isLoading: false })
        return false
      })
  }

  resetPassword(row){
    axios.post(this.state.api_url+'/api/users/reset_password', row, this.state.config)
      .then((response) => {
          console.log(response.data)

          if (response.data.ResponseCode === '200') {
            message.success(response.data.ResponseDesc)
          } else {
            if (response.data.status === '401') {
              this.setState({ isAuthorized : false }, () => {
                message.error('Login Authentication Expired. Please Login Again!')
              })
            } else {
              let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : ""
              message.error(msg)
            }
          }
      }, (err) => {
        console.error(err)
        message.error(err.data.ResponseDesc);
        return false
      })
  }

  handleRowSelect(row) {
    const { selectedRow } = this.state
    let replaceRow = {}

    if (row.constructor === Object && Object.keys(row).length > 0) {
      if (row.id && row.id !== selectedRow.id) {
        replaceRow = row
      }
    }

    this.setState({ selectedRow: replaceRow })
  }
  
  render() {
    const { isAuthorized, data, totalDataSize } = this.state

    const selectRow = {
      mode      : "radio",
      onSelect  : this.handleRowSelect,
      clickToSelect : true
    }

    if (isAuthorized) {
      return (
        <React.Fragment>
          <Row type="flex" justify="end" style={{ marginBottom : '50px' }}>
            <Col>
              <Button className='base_button primary'  type="primary" onClick={this.exportData} >
                Export CSV
              </Button>
              
              <Button className='base_button primary'   type="primary" onClick={ this.importFile }>
                Import CSV
              </Button>
              
              {
                (this.state.create) ? <Button className='base_button primary' type="primary" onClick={()=>this.addRow()}>Add Agent</Button> : ''
              }
              
              {
                (this.state.delete) ? 
                  (
                    <Button className={ (Object.keys(this.state.selectedRow).length > 0) ? ('base_button delete') : ('button_disabled delete_disabled')  }
                            type="danger" 
                            onClick={()=>this.handleDeleteRow()} 
                            disabled={ this.handleDeleteButton() } 
                    > Delete </Button>
                  ) : ('')
              }
            </Col>
          </Row>
        
          <BootstrapTable 
            data={ data } 
            striped={true} 
            hover={true} 
            remote={true} 
            fetchInfo={ { dataTotalSize: totalDataSize } } 
            condensed 
            pagination
            selectRow={ selectRow } 
            options={{ 
              sizePerPageList: [ {
                  text: '5', value: 5
                }, {
                  text: '10', value: 10
                }, {
                  text: '15', value: 15
                }],
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
              <TableHeaderColumn ref="usernameCol" dataField="username" isKey={true} dataAlign="center" width='75px' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Username</TableHeaderColumn>
              <TableHeaderColumn ref="nameCol" dataField="name" dataAlign="center" width='100px' dataSort={true} filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Name</TableHeaderColumn>
              <TableHeaderColumn ref="emailCol" dataField="email" dataAlign="center" hidden={true} width='125px' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Email</TableHeaderColumn>
              <TableHeaderColumn ref="phoneCol" dataField="phone_number" dataAlign="center" width='75px' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Phone Number</TableHeaderColumn>
              <TableHeaderColumn ref="networkCol" dataField="networkName" hidden={ !this.state.networkAgan } dataAlign="center" width='75px' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' }}> Network </TableHeaderColumn>
              <TableHeaderColumn ref="areaCol" dataField="areaName" dataAlign="center" width='100px' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Area</TableHeaderColumn>
              <TableHeaderColumn ref="statusCol" dataField="status" dataAlign="center" width='45px' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Status</TableHeaderColumn>
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
    const { user, mode, table_states } = state
    
    return { user, mode, table_states }
}

export default withRouter(connect(mapStateToProps, { LogUser, FormMode, SetTableStates })(AgentList))
