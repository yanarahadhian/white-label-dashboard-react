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
import { SetTableStates } from '../actions'

class RoleList extends Component {
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
      isLoading: false,
      selectedRow: {},
      sortName: undefined,
      sortOrder: undefined,
      config: { headers: {'token': localStorage.getItem('token')}},
      pagepath : this.props.location.pathname
    }

    this.handleDeleteRow = this.handleDeleteRow.bind(this)
    this.handleDeleteButton = this.handleDeleteButton.bind(this)
    this.handleRowSelect = this.handleRowSelect.bind(this)
    this.exportData = this.exportData.bind(this)
    this.onSortChange = this.onSortChange.bind(this)
  }

  componentWillMount() {
    //check if user have access to this page
    const rights = this.state.user_rights
    const page_url = this.props.location.pathname
    const table_states = this.props.table_states
    let page, size, sortName, sortOrder, filterObj = null

    // receive table_state if previous page is still in the same page circle
    if (table_states.pagepath === page_url) {
      page = table_states.page
      size = table_states.size
      sortName = table_states.sortName
      sortOrder = table_states.sortOrder
      filterObj = table_states.filterObj
  } else {
      // reset table_state in store to default value
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
    this.setState({ isLoading : true })

    const { api_url, config } = this.state
    let url = api_url + '/api/role/?page=' + page + '&size=' + size

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
    if (filterObj && filterObj !== {}) {
      let filterUrl = readFilterData(filterObj)
      url += filterUrl
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
              isLoading : false,
              isAuthorized : false,
              data : []
          }, () => {
              message.error('Login Authentication Expired. Please Login Again!')
          })
        } else {
          this.setState({ isLoading: false, data : [] })
          
          let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : "Fetch Role Data Failed"
          message.error(msg)
        }
      }
    }, (err) => {
      console.error(err)
      this.setState({ isLoading: false })
    })
  }

  assignFilter() {
    const { filterObj } = this.state

    if (Object.keys(filterObj).length > 0) {

      if (filterObj.name) {
        this.refs.nameCol.applyFilter(filterObj.name.value)
      }

      if (filterObj.description) {
        this.refs.descriptionCol.applyFilter(filterObj.description.value)
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

  exportData() {
    let { api_url, config, sortName, sortOrder, columnFilter, filterObj } = this.state

    let url = api_url + '/api/role/?page=all&size=0'
    let exportData = false

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

    if (columnFilter && filterObj !== undefined && filterObj !== {}) {
      let filterUrl = readFilterData(filterObj)
      url += filterUrl

      exportData = true
    } else {
      exportData = window.confirm("Do you really want to export all data ?")
    }

    if (exportData) {
      axios.get(url, config)
      .then((response) => {
        console.log(response.data)
        
        if (response.data.ResponseCode === '200') {
          downloadCSV(response.data.ResponseData, 'roles')
        } else {
          if (response.data.status === '401') {
            this.setState({ isAuthorized : false, data : [] }, () => {
              message.error('Login Authentication Expired. Please Login Again!')
            })
          } else {
            let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : ""
            message.error(msg)
          }
        }
      })
      .catch((err) => {
        console.log(err)
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
    let { selectedRow, api_url, config } = this.state
    let remove = window.confirm("Do you want to delete this data ?");

    let axiosConfig = {
      url : api_url + '/api/role/?id=' + selectedRow.id,
      headers : config.headers,
      method : 'DELETE'
    }

    if (remove) {
      axios(axiosConfig)
      .then((response) => {
        console.log(response)
        
        if (response.data.ResponseCode === "200") {
          this.setState({ selectedRow : {} }, () => {
            message.success(response.data.ResponseDesc)
            this.fetchData()
          })
        } else {
          message.error(response.data.ResponseDesc)
        }

      }, (err) => {
        message.error(err.data.ResponseDesc);
        console.error(err)
        return false
      })  
    }
  }

  handleDeleteButton() {
    let isSelectedRowEmpty = this.state.selectedRow.id === undefined
    
    if (isSelectedRowEmpty) {
      return true
    } else {
      return false
    }
  }

  buttonFormatter(cell, row){
    return (
      <div>
        <a onClick={()=>this.accessRow(row)}>
          <Tooltip title="Manage Rights"><Icon type="appstore-o" /></Tooltip>
        </a> 
        <a onClick={()=>this.viewRow(row)} style={{ marginLeft: '15px'}}>
          <Tooltip title="View"><Icon type="search" /></Tooltip></a> 
        <a onClick={()=>this.editRow(row)} style={{ marginLeft: '15px'}}>
          <Tooltip title="Edit"><Icon type="edit" /></Tooltip>
        </a>
      </div>
      )
  }

  addRow(){
    let dispatch = this.props
    
    dispatch.FormMode('add')
    
    this.dispatchTableStates()
    this.props.history.push({
      pathname: '/role/new'
    })
  }

  editRow(row) {
    let dispatch = this.props
    
    dispatch.FormMode('edit')
    
    this.dispatchTableStates()
    this.props.history.push({
      pathname: `/role/edit/${row.id}`
    })
  }

  viewRow(row) {
    this.dispatchTableStates()
    this.props.history.push({
      pathname: `/role/view/${row.id}`
    })
  }

  accessRow(row) {
    this.dispatchTableStates()
    this.props.history.push({
      pathname: `/role/change_rights/${row.id}`
    })
  }

  handleRowSelect(row) {
    const { selectedRow } = this.state
    let replaceRow = {}

    if (row.constructor === Object && Object.keys(row).length > 0) {
      if (row.id && row.id !== selectedRow.id) {
        replaceRow = row
      }

      this.setState({ selectedRow: replaceRow })
    }
  }
  
  render() {
    const { isAuthorized } = this.state

    const selectRow = {
      mode: "radio",
      clickToSelect: true,
      onSelect: this.handleRowSelect
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
                (this.state.create) ? <Button className='base_button primary'  onClick={()=>this.addRow()} >Add Role</Button> : ''
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
            fetchInfo={ { dataTotalSize: this.state.totalDataSize } } 
            condensed 
            height={ this.state.tableHeight }
            pagination
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
              onSizePerPageList: this.handleSizePerPageChange.bind(this),
              onPageChange: this.onPageChange.bind(this),
              page: this.state.page,
              onFilterChange: this.onFilterChange.bind(this),
              noDataText: (this.state.isLoading) ? <Spin/> : 'No Data Found',
              sortName: this.state.sortName,
              sortOrder: this.state.sortOrder,
              onSortChange: this.onSortChange
            }} 
          >
              <TableHeaderColumn dataField="id" width='100px' isKey={true} hidden={true} export={true} >ID</TableHeaderColumn>
              <TableHeaderColumn ref="nameCol" dataField="name" width='100px' dataAlign='center' dataSort={ true } filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Name</TableHeaderColumn>
              <TableHeaderColumn ref="descriptionCol" dataField="description" width='150px' dataAlign='center' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Description</TableHeaderColumn>
              <TableHeaderColumn dataField="created_at" hidden={true} export={true}>Created At</TableHeaderColumn>
              <TableHeaderColumn dataField="updated_at" hidden={true} export={true}>Updated At</TableHeaderColumn>
              <TableHeaderColumn dataField="deleted_at" hidden={true} export={true}>Deleted At</TableHeaderColumn>
              <TableHeaderColumn dataField="button" dataAlign='center' dataFormat={this.buttonFormatter.bind(this)} width='50px'>Actions</TableHeaderColumn>
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

export default withRouter(connect(mapStateToProps, { LogUser, FormMode, SetTableStates })(RoleList))
