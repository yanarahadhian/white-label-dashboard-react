import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Icon, message, Tooltip, Spin, Row, Col } from "antd";
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import { LogUser, FormMode, SetTableStates } from '../actions';
import axios from "axios";
import moment from "moment";
import { config } from "../config";
import { readFilterData } from '../middleware/read_filter'

class VirtualAccountList extends Component {
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
      sortName: undefined,
      sortOrder: undefined,
      selectedData: [],
      config: { headers: {'token': localStorage.getItem('token')}},
      networkAgan : (this.props.user.network === 0) ? (true) : (false),
      pagepath : this.props.location.pathname
    }

    this.onSortChange = this.onSortChange.bind(this);
    this.onRowSelect = this.onRowSelect.bind(this);
    this.onSelectAll = this.onSelectAll.bind(this);
  }

  componentWillMount(){
    //check if user have access to this page
    const rights = this.state.user_rights
    const page_url = this.props.location.pathname
    const table_states = this.props.table_states
    let page, size, sortName, sortOrder, filterObj = null

    console.log("Load params : ", { network : this.props.user.network, typeOfNetwork : typeof this.props.user.network, isNetworkAgan : this.state.networkAgan })

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
            page : (page) ? (page) : (this.state.page),
            size : (size) ? (size) : (this.state.size),
            sortName : (sortName) ? (sortName) : (this.state.sortName),
            sortOrder : (sortOrder) ? (sortOrder) : (this.state.sortOrder),
            filterObj : (filterObj) ? (filterObj) : (this.state.filterObj),
          }, async () => {
            if (Object.keys(table_states).length > 0) {
              await this.assignFilter()
              await this.fetchData(page, size, sortName, sortOrder, filterObj)
              // this.loadData(this.state.page,this.state.size,this.state.sortName,this.state.sortOrder)
            } else {
              this.fetchData()
              // this.loadData(this.state.page,this.state.size,this.state.sortName,this.state.sortOrder)
            }
          })
        }
      }
    }
  }

  fetchData(page = this.state.page, size = this.state.size, sortName = this.state.sortName, sortOrder = this.state.sortOrder, filterObj = this.state.filterObj) {
    this.setState({ isLoading: true, data: [], totalDataSize : 0 })
    
    let { api_url, config, networkAgan } = this.state
    let user_network = this.props.user.network
    let url = api_url + '/api/va/?page=' + page + '&size=' + size

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

    // Network Management
    if (user_network && !networkAgan) {
      url += `&network=${ user_network }`
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
          isLoading: false,
          data: response.data.ResponseData,
          totalDataSize: response.data.ResponseTotalResult
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

  loadData(page, size, sortName, sortOrder) {
    let { api_url, config, networkAgan } = this.state
    let user_network = this.props.user.network
    let url = api_url + '/api/va/'

    this.setState({ isLoading: true, data: [] })

    // Page Size & Sort Management
    if (page !== undefined && size === undefined && sortName === undefined && sortOrder === undefined) {
      url = url + '?page=' + page + '&size=5&orderName=name&orderBy=asc'
    } else if (page !== undefined && size !== undefined && sortName === undefined && sortOrder === undefined) {
      url = url + '?page=' + page + '&size=' + size + '&orderName=name&orderBy=asc'
    } else if (page !== undefined && size !== undefined && sortName !== undefined && sortOrder !== undefined) {
      url = url + '?page=' + page + '&size=' + size + '&orderName=' + sortName + '&orderBy=' + sortOrder
    } else if(page !== undefined && size !== undefined) {
      url = url + '?page=' + page + '&size=' + size
    }

    if (user_network && !networkAgan) {
      url += `&network=${ user_network }`
    }

    console.log('Request : ', url)

    axios.get(url, config)
    .then((response) => {
      if (response.data.ResponseCode === "200") {
        this.setState({
          data: response.data.ResponseData,
          totalDataSize: response.data.ResponseTotalResult,
          isLoading: false
        }, () => {
          console.log(response)
          return this.state.data
        })
      } else {
        
        if (response.data.ResponseCode === '500' && response.data.ResponseDesc.sqlMessage) {
          message.error(response.data.ResponseDesc.sqlMessage)
        } else {
          message.error(response.data.ResponseDesc)
        }

        this.setState({
          data: [],
          totalDataSize: 0,
          isLoading: false
        }, () => {
          console.log(response)
          return this.state.data
        })
      }
    }, (err) => {
      this.setState({
        data: [],
        totalDataSize: 0,
        isLoading: false
      }, () => {
        console.error(err)
      })
    }) 
  }

  searchData(page, size, sortName, sortOrder, filterObj) {
    let { api_url, config, networkAgan } = this.state
    let user_network = this.props.user.network
    let url = api_url + '/api/va/'

    this.setState({ isLoading: true, data: [] })

   // Page Size & Sort Management
    if (page !== undefined && size === undefined && sortName === undefined && sortOrder === undefined) {
      url = url + '?page=' + page + '&size=5&orderName=name&orderBy=asc'
    } else if (page !== undefined && size !== undefined && sortName === undefined && sortOrder === undefined) {
      url = url + '?page=' + page + '&size=' + size + '&orderName=name&orderBy=asc'
    } else if (page !== undefined && size !== undefined && sortName !== undefined && sortOrder !== undefined) {
      url = url + '?page=' + page + '&size=' + size + '&orderName=' + sortName + '&orderBy=' + sortOrder
    } else if(page !== undefined && size !== undefined) {
      url = url + '?page=' + page + '&size=' + size
    }

    // Filter Management
    if (filterObj !== {}) {
      let filterUrl = readFilterData(filterObj)
      url += filterUrl
    }

    // Network Management
    if (user_network && !networkAgan) {
      url += `&network=${ user_network }`
    }

    console.log('Request : ', url)

    axios.get(url, config)
    .then((response) => {
      if (response.data.ResponseCode === "200") {
        this.setState({
          data: response.data.ResponseData,
          totalDataSize: response.data.ResponseTotalResult,
          isLoading: false
        }, () => {
          console.log(response)
          return this.state.data
        })
      } else {
        
        if (response.data.ResponseDesc.sqlMessage) {
          message.error(response.data.ResponseDesc.sqlMessage)
        } else {
          message.error(response.data.ResponseDesc)
        }

        this.setState({
          data: [],
          totalDataSize: 0,
          isLoading: false
        }, () => {
          console.log(response)
          return this.state.data
        })
      }
    }, (err) => {
      this.setState({
        data: [],
        totalDataSize: 0,
        isLoading: false
      }, () => {
        console.error(err)
      })
    }) 
  }

  assignFilter() {
    const { filterObj } = this.state
    
    if (Object.keys(filterObj).length > 0) {

      if (filterObj.virtual_account_id) {
        this.refs.virtualAccountCol.applyFilter(filterObj.virtual_account_id.value)
      }
      
      if (filterObj.name) {
        this.refs.nameCol.applyFilter(filterObj.name.value)
      }

      if (filterObj.status) {
        this.refs.statusCol.applyFilter(filterObj.status.value)
      }

      if (filterObj.created_at) {
        let newDate = new Date(filterObj.created_at.value.date)
        this.refs.createdDateCol.applyFilter({ date : newDate, comparator : filterObj.created_at.value.comparator })
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

  _dateFormat(cell, row){ return cell ? moment(cell, "YYYY-MM-DD HH:mm:ss").format("DD/MM/YYYY HH:mm:ss") : ""; }

  handleSizePerPageChange(sizePerPage) {
    this.setState({
      page : 1,
      size : sizePerPage
    }, () => {
      this.fetchData()
    })

  }

  buttonFormatter(cell, row){

    var update_status = (row.status.toLowerCase() !== "open") ? <a onClick={()=>this.updateStatus(row)} style={{ marginLeft: '5px'}}><Tooltip title="Activate / Deactivate"><Icon type="reload" /></Tooltip></a> : ""
    var view = <a onClick={()=>this.viewRow(row)} style={{ marginLeft: '10px'}}>View</a>
    var button_group = (this.state.isLoading) ? <Spin /> : <div>{update_status} {view}</div>

    return <div>{button_group}</div>;
  }

  updateStatus(row){
    this.setState({ isLoading: true })

    let status = (row.status.toLowerCase() !== "actived") ? "1" : "2"    
    let data = {
      Username: row.user_id,
      CustomerName: row.name,
      CustomerEmail: '',
      CustomerPhone: '',
      VirtualAccount: row.virtual_account_id,
      ExpiredDate: moment(row.created_at).add(2, 'y'),
      Description: '',
      VirtualAccountStatus: status
    }
    
    axios.put(this.state.api_url+'/api/va/edit/', data)
      .then((response) => {
          if(response.data.ResponseCode==="99"){
            message.error(response.data.ResponseDesc);
          } else {
            message.success(response.data.ResponseDesc);
            this.fetchData()
            // this.loadData(this.state.page,this.state.size)
          }
          console.log(response)
          this.setState({ isLoading: false })
      }, (err) => {
        message.error(err.data.ResponseDesc);
        console.error(err)
        this.setState({ isLoading: false })
        return false
      })
  }

  viewRow(row){
    let dispatch = this.props
    dispatch.FormMode('view')
    this.props.history.push({
      pathname: `/virtual_account/view/${row.id}`
    })
  }

  bulkStatus(){
    let params = this.state.selectedData
    if (params.length !== 0) {
      if (params.every(this.isSameAnswer) === true ) {
        for(let i=0; i<params.length; i++){
          let status = (params[i].status !== "ACTIVED") ? "1" : "2"
          let data = {
            Username: params[i].user_id, 
            VirtualAccountStatus: status
          }
          
          axios.put(this.state.api_url+'/api/va/edit/', data)
          .then((response) => {
              if(response.data.ResponseCode==="99"){
                message.error(response.data.ResponseDesc.sqlMessage);
              } else {
                message.success(response.data.ResponseDesc);
                this.fetchData()
                // this.loadData(this.state.page,this.state.size)
              }
              console.log(response)
          }, (err) => {
            message.error(err.data.ResponseDesc);
            console.error(err)
            return false
          })
        }
      } else {
        alert("Make sure all have same Status..!");
      }
    } else {
      alert("Please select any row..!");
    }
    
  }

  isSameAnswer(el,index,arr) {
    if (index === 0){
        return true;
    }
    else {
        return (el.status === arr[index - 1].status);
    }
}

  onRowSelect(row, isSelected) {
    if (isSelected === true) {
        this.state.selectedData.push(row)
    } else {
      let param = this.state.selectedData
      for(let i = 0; i < param.length; i++) {
        if (row.id === param[i].id) {
          let index = param.indexOf(param[i])
          param.splice(index, 1)
        }
      }
    }
  }

  onSelectAll(isSelected, rows) {
    let param = this.state.selectedData
    if (isSelected === true) {
      for(let i = 0; i < rows.length; i++){
        param.push(rows[i])
      }
    } else {
      this.setState({
        selectedData : []
      })
    }
  }

  render() {
    const { isAuthorized } = this.state

    const selectRowProp = {
      mode: 'checkbox',
      clickToSelect: true,
      onSelect: this.onRowSelect,
      onSelectAll: this.onSelectAll
    };

    if (isAuthorized) {
      return (
        <React.Fragment>
          <Row type="flex" justify="end" style={{ marginBottom : '30px' }}>
            <Col>
              <Button className='base_button primary' onClick={()=>this.bulkStatus()} >
                Bulk Activate
              </Button>

              <Button className='base_button primary' onClick={()=>this.bulkStatus()} >
                Bulk Deactivate
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
            selectRow={ selectRowProp } 
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
                <TableHeaderColumn dataField='id' isKey={true} hidden={true}>ID</TableHeaderColumn>
                <TableHeaderColumn dataField='user_id' hidden={true}>User ID</TableHeaderColumn>
                <TableHeaderColumn ref='virtualAccountCol' dataField="virtual_account_id" dataAlign="center" width='100px' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Account Number</TableHeaderColumn>
                <TableHeaderColumn ref='nameCol' dataField="name" dataAlign="center" width='100px' dataSort={ true } filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Name</TableHeaderColumn>
                <TableHeaderColumn ref='statusCol' dataField="status" dataAlign="center" width='65px' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Status</TableHeaderColumn>
                <TableHeaderColumn ref='createdDateCol' dataField="created_at" dataAlign="center" dataSort={ true } width='100px' dataFormat = {this._dateFormat.bind(this)} filter={ { type: 'DateFilter' } }>Created At</TableHeaderColumn>
                <TableHeaderColumn dataField="expired_at" dataAlign="center" width='100px' dataFormat = {this._dateFormat.bind(this)}>Expired At</TableHeaderColumn>
                <TableHeaderColumn dataField="button" dataAlign="center" dataFormat={this.buttonFormatter.bind(this)} width='50px'>Actions</TableHeaderColumn>
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

export default withRouter(connect(mapStateToProps, { LogUser, FormMode, SetTableStates })(VirtualAccountList));
