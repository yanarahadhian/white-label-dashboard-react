import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Icon, message, Tooltip, Spin, Row, Col } from "antd";
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import { LogUser, FormMode, SetTableStates } from '../actions';
import axios from "axios";
import { config } from "../config";
import { readFilterData } from '../middleware/read_filter';
import { downloadCSV } from '../middleware/export'

class CustomerList extends Component {
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
      size: 5,
      page: 1,
      columnFilter: false,
      filterObj: {},
      sortName: undefined,
      sortOrder: undefined,
      isLoading: false,
      selectedRow: {},
      config: { headers: {'token': localStorage.getItem('token')}},
      networkAgan : (this.props.user.network === 0) ? (true) : (false),
      api_url: config().api_url,
      pagepath : this.props.location.pathname
    }

    this.viewRow = this.viewRow.bind(this)
    this.handleDeleteRow = this.handleDeleteRow.bind(this)
    this.handleDeleteButton = this.handleDeleteButton.bind(this)
    this.handleRowSelect = this.handleRowSelect.bind(this)
    this.exportData = this.exportData.bind(this)
    this.onSortChange = this.onSortChange.bind(this)
  }
  
  componentWillMount() {
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
            create: (rights[item].create===1) ? true : false,
            read: (rights[item].read===1) ? true : false,
            update: (rights[item].update===1) ? true : false,
            delete: (rights[item].delete===1) ? true : false,
            page : (page) ? (page) : (this.state.page),
            size : (size) ? (size) : (this.state.size),
            sortName : (sortName) ? (sortName) : (this.state.sortName),
            sortOrder : (sortOrder) ? (sortOrder) : (this.state.sortOrder),
            filterObj : (filterObj) ? (filterObj) : (this.state.filterObj)
          }, async () => {
            if (Object.keys(table_states).length > 0) {
              await this.assignFilter()
              this.fetchData(page, size, sortName, sortOrder, filterObj)
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
    let url = api_url + '/api/customer/?page=' + page + '&size=' + size

    // Sort management
    if (sortName) {
			url += `&orderName=${ sortName }`

			if (sortOrder) {
				url += `&orderBy=${ sortOrder }`
			} else {
				url += `&orderBy=ASC`
			}
		} else {
      url += `&orderName=namacustomer&orderBy=ASC`
    }

    // Get data only from network if user_network exists
    if (user_network && user_network !== 0) {
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

      if (filterObj.customer_id) {
        this.refs.customerCol.applyFilter(filterObj.customer_id.value)
      }
      
      if (filterObj.namacustomer) {
        this.refs.nameCol.applyFilter(filterObj.namacustomer.value)
      }

      if (filterObj.phone_number) {
        this.refs.phoneCol.applyFilter(filterObj.phone_number.value)
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
      this.fetchData()
      this.dispatchTableStates()
    })
  }

  exportData() {
    let { columnFilter, api_url, config, sortName, sortOrder, filterObj } = this.state

    let user_network = this.props.user.network
    let url = api_url + '/api/customer/?page=all'
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
        if (response.data.ResponseCode === '200') {

          console.log(response.data.ResponseData)
          downloadCSV(response.data.ResponseData, 'customer')
          this.fetchData()

        } else {
          if (response.data.status === '401') {
            // if login auth exipre, set data to empty and show message of auth expiration
            this.setState({ data : [], totalDataSize : 0 })
            message.error('Login Authentication Expired. Please Login Again!')
          } else {
            message.error((response.data.ResponseDesc.sqlMessage) ? ('Database Error!') : (response.data.ResponseDesc) )
          }
        }
      }, (err) => {
        console.error(err)
      })
    }
  }

	buttonFormatter(cell, row){
    var edit = (this.state.update) ? <a onClick={()=>this.editRow(row)} ><Tooltip title="Edit"><Icon type="edit" /></Tooltip></a> : ' ';
    var read = (this.state.read) ? <a onClick={()=>this.viewRow(row)} style={{ marginLeft: '15px'}}><Tooltip title="View"><Icon type="search" /></Tooltip></a> : ' ';

		return <div>{edit} {read}</div>
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

    let id = selectedRow.id
    let url = api_url + '/api/customer/?id=' + id
    
    let remove = window.confirm("Do you want to delete this data ?");
    
    if (remove) {
      this.setState({ isLoading: true })

      console.log('remove : ', url)

      axios.delete(url, config)
      .then((response) => {
				console.log('response : ', response.data)

				if (response.data.ResponseCode === "500") {
					message.error(response.data.ResponseDesc.sqlMessage);
				} else {
          message.success(response.data.ResponseDesc);
          this.fetchData()
          
          this.setState({ 
            selectedRow: {} 
          })
				}

        this.setState({ isLoading: false })

			}, (err) => {
				message.error(err.data.ResponseDesc);
				this.setState({ isLoading: false })
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
	
	viewRow(row){
    let dispatch = this.props
    dispatch.FormMode('view')
    this.props.history.push({
      pathname: `/customer/view/${row.id}`
    })
	}
	
	editRow(row){
    let dispatch = this.props
    dispatch.FormMode('edit')
    this.props.history.push({
      pathname: `/customer/edit/${row.id}`
    })
  }

  handleRowSelect(row) {
    const { selectedRow } = this.state
    let replaceRow = {}

    if (row.constructor === Object && Object.keys(row).length > 0) {
      if (row.id && row.id !== selectedRow.id) {
        replaceRow = row
      }

      this.setState({ selectedRow : replaceRow }, () => {
        console.log(this.state.selectedRow)
      })
    }
  }
	
  render() {
    const { isAuthorized } = this.state

    const selectRow = {
      mode      : "radio",
      onSelect  : this.handleRowSelect,
      clickToSelect : true
    }

    if (isAuthorized) {
      return (
        <React.Fragment>
          <Row type="flex" justify="end" style={{ marginBottom: '30px' }}>
            <Col>
              <Button className='base_button primary' onClick={this.exportData} >
                  Export CSV
              </Button>
              {
                (this.state.delete) ? 
                  (
                    <Button className={ (Object.keys(this.state.selectedRow).length > 0 ) ? ('base_button delete') : ('button_disabled delete_disabled')

                            }
                            type="danger" 
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
              <TableHeaderColumn ref="customerCol" dataField="customer_id" dataAlign="center" width='100px' export={true} dataSort={ true } filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Customer ID</TableHeaderColumn>
              <TableHeaderColumn ref="nameCol" dataField="namacustomer" dataAlign="center" width='150px' export={true} dataSort={ true } filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Customer Name</TableHeaderColumn>
              <TableHeaderColumn ref="phoneCol" dataField='phone_number' dataAlign="center" width='100px' export={true} dataSort={ true } filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Phone Number</TableHeaderColumn>
              <TableHeaderColumn dataField="button" dataFormat={this.buttonFormatter.bind(this)} dataAlign="center" width='50px'>Actions</TableHeaderColumn>
              
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

export default withRouter(connect(mapStateToProps, { LogUser, FormMode, SetTableStates })(CustomerList));
