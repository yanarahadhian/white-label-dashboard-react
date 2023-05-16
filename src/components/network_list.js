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

class NetworkList extends Component {
  constructor(props){
    super(props)

    this.state = {
      user_rights: (this.props.user.rights) ? this.props.user.rights : '',
      page_id: (props.location.state) ? (props.location.state.page_id) ? props.location.state.page_id : '' : '',
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
      sortName : '',
      sortOrder : '',
      columnFilter: false,
      filterObj: {},
      isLoading: false,
      selectedRow: {},
      config: { headers: {'token': localStorage.getItem('token')}},
      pagepath : this.props.location.pathname
    }

    this.handleDeleteRow = this.handleDeleteRow.bind(this)
    this.handleDeleteButton = this.handleDeleteButton.bind(this)
    this.handleRowSelect = this.handleRowSelect.bind(this)
    this.exportData = this.exportData.bind(this)
  }

  componentWillMount() {
    //check if user have access to this page
    const rights = this.props.user.rights
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
      if(rights[item].page_url === page_url) {
        if ( rights[item].create === 1 || rights[item].read === 1 || rights[item].update === 1 || rights[item].delete === 1 || rights[item].approve === 1) {
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
    this.setState({ isLoading : true, data : [], totalDataSize : 0 })

    const { api_url, config } = this.state
    let url = api_url + '/api/network/?page=' + page + '&size=' + size

    if (sortName) {
      url += `&orderName=${ sortName }`

      if (sortOrder) {
        url += `&orderBy=${ sortOrder }`
      } else {
        url += `&orderBy=ASC`
      }
    } else {
      url += `&orderName=network&orderBy=ASC`
    }

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
          isLoading : false,
          data : response.data.ResponseData,
          totalDataSize : response.data.ResponseTotalResult
        })
      } else {
        if (response.data.status === '401') {
          this.setState({
            isLoading : false,
            isAuthorized : false
          }, () => {
            message.error('Login Authentication Expired. Please Login Again!')
          })
        } else {
          this.setState({ isLoading : false }, () => {
            let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : "Fetching Failed"
            message.error(msg)
          })
        }
      }
    })
    .catch((err) => {
      this.setState({ isLoading : false })
      console.error(err)
    })
  }

  dispatchTableStates() {
    const { page, size, sortName, sortOrder, filterObj, pagepath } = this.state
    const table_states = { page, size, sortName, sortOrder, filterObj, pagepath }

    this.props.SetTableStates(table_states)
  }

  assignFilter() {
    const { filterObj } = this.state

    if (Object.keys(filterObj).length > 0) {
      
      if (filterObj.network) {
        this.refs.networkCol.applyFilter(filterObj.network.value)
      }

      if (filterObj.sender_name) {
        this.refs.senderCol.applyFilter(filterObj.sender_name.value)
      }
    }
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

  exportData() {
    let { api_url, sortName, sortOrder, filterObj, columnFilter, config } = this.state
    
    let url = api_url + '/api/network/?page=all&size=0'
    let exportData = false

    if (sortName) {
      url += `&orderName=${ sortName }`

      if (sortOrder) {
        url += `&orderBy=${ sortOrder }`
      } else {
        url += `&orderBy=ASC`
      }
    } else {
      url += `&orderName=network&orderBy=ASC`
    }

    if (columnFilter && filterObj !== undefined && filterObj !== {}) {
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
          downloadCSV(response.data.ResponseData, 'networks')
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
      })
      .catch((err) => {
        console.log(err)
      })
    }
  }

  createCustomButtonGroup(){
    return (
      <div className='button_group'>
        <Button className='base_button primary' onClick={this.exportData} >
            Export CSV
        </Button>
        {
          (this.state.create) ? <Button className='base_button primary' onClick={()=>this.addRow()} >Add Network</Button> : ''
        }
        {
          (this.state.delete) ? <Button className="base_button delete" onClick={()=>this.handleDeleteRow()} disabled={ this.handleDeleteButton() }>Delete</Button> : ''
        }
      </div>
    );
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
    let remove = window.confirm("Do you want to delete this data ?")

    // generate delete request url
    let url = api_url + '/api/network/?id=' + selectedRow.id
    
    if (remove) {
      axios.delete(url, config)
      .then((response) => {
        console.log(response.data)

        if (response.data.ResponseCode === "200") {
          this.setState({ selectedRow : {} }, () => {
            message.success(response.data.ResponseDesc)
            this.fetchData()
          })
        } else {
          message.error(response.data.ResponseDesc)
        }
      }, (err) => {
        message.error(err.data.ResponseDesc)
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
    var edit = (this.state.update) ? <a onClick={()=>this.editRow(row)} ><Tooltip title="Edit"><Icon type="edit" /></Tooltip></a> : ' '
    var view = (this.state.read) ? <a onClick={()=>this.viewRow(row)} style={{ marginLeft: '20px'}}><Tooltip title="View"><Icon type="search" /></Tooltip></a> : ' '
    return (
        <div>{edit} { view }</div>
      )
  }

  addRow(){
    let dispatch = this.props
    dispatch.FormMode('add')
    this.props.history.push({
      pathname: '/network/new',
      state: { page_id: this.state.page_id, isAuthorized: this.state.create }
    })
  }

  editRow(row){
    let dispatch = this.props
    dispatch.FormMode('edit')
    this.props.history.push({
      pathname: `/network/edit/${row.id}`,
      state: { page_id: this.state.page_id, isAuthorized: this.state.update }
    })
  }

  viewRow(row) {
    let dispatch = this.props
    dispatch.FormMode('view')
    this.props.history.push({
      pathname: `/network/view/${row.id}`
    })
  }

  handleRowSelect(row) {
    const { selectedRow } = this.state
    let replaceRow = {}

    if (row.constructor === Object && Object.keys(row).length > 0) {
      if (row.id && row.id !== selectedRow.id) {
        replaceRow = row
      }

      this.setState({ selectedRow: replaceRow }, () => console.log(this.state.selectedRow))
    }
  }
  
  render() {
    const selectRow = {
      mode : "radio",
      onSelect : this.handleRowSelect,
      clickToSelect : true
    }

    if (this.state.isAuthorized) {
      return (
        <React.Fragment>
          <Row type="flex" justify="end" style={{ marginBottom : '30px' }}>
            <Col>
              <Button className='base_button primary' onClick={this.exportData} >
                Export CSV
              </Button>
              {
                (this.state.create) ? <Button className='base_button primary' onClick={()=>this.addRow()} >Add Network</Button> : ''
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
              sortName : this.state.sortName,
              sortOrder : this.state.sortOrder,
              onSortChange : this.onSortChange.bind(this)
            }} >
              <TableHeaderColumn dataField="id" width='100px' isKey={true} hidden={true} export={true} >ID</TableHeaderColumn>
              <TableHeaderColumn ref='networkCol' dataField="network" dataAlign='center' width='250px' dataSort={true} filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Network</TableHeaderColumn>
              <TableHeaderColumn ref='senderCol' dataField="sender_name" dataAlign='center' width='250px' dataSort={true} filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Sender ID</TableHeaderColumn>
              <TableHeaderColumn dataField="created_at" hidden={true} export={true}>Created At</TableHeaderColumn>
              <TableHeaderColumn dataField="updated_at" hidden={true} export={true}>Updated At</TableHeaderColumn>
              <TableHeaderColumn dataField="deleted_at" hidden={true} export={true}>Deleted At</TableHeaderColumn>
              <TableHeaderColumn dataField="button" dataAlign='center' dataFormat={this.buttonFormatter.bind(this)} width='100px'>Actions</TableHeaderColumn>
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

export default withRouter(connect(mapStateToProps, { LogUser, FormMode, SetTableStates })(NetworkList));
