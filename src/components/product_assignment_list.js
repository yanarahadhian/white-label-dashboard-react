import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Icon, message, Tooltip, Spin, Row, Col } from "antd";
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import { LogUser, FormMode } from '../actions';
import axios from "axios";
import moment from "moment";
import { config } from "../config";
import { readFilterData } from '../middleware/read_filter';
import { downloadCSV } from '../middleware/export'

class ProductAssignmentList extends Component {
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
      selectedData: [],
      config: { headers: {'token': localStorage.getItem('token')}},
      api_url: config().api_url,
    }

    this.viewRow = this.viewRow.bind(this)
    this.exportData = this.exportData.bind(this)
    this.onSortChange = this.onSortChange.bind(this)
    this.onRowSelect = this.onRowSelect.bind(this);
    this.onSelectAll = this.onSelectAll.bind(this);
  }

  onSortChange(sortName, sortOrder) {
    let { size, filterObj } = this.state
    this.setState({
      sortName,
      sortOrder,
      page : 1
    }, () => {
      this.fetchData(1, size, sortName, sortOrder, filterObj)
    })
  }

  fetchData(page, size, sortName, sortOrder, filterObj) {
    this.setState({ isLoading : true })
    
    let { api_url, config } = this.state
    let url = api_url + '/api/product_assignment/?page=' + page + '&size=' + size

    // Sort management
    if (sortName) {
			url += `&orderName=${ sortName }`

			if (sortOrder) {
				url += `&orderBy=${ sortOrder }`
			} else {
				url += `&orderBy=ASC`
			}
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

  componentWillMount() {
    let { size, sortName, sortOrder, filterObj } = this.state

    var rights = this.state.user_rights
    var page_url = this.props.match.url
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
          })
          this.fetchData(1, size, sortName, sortOrder, filterObj)
        }
      }
    }
  }

  onPageChange(currentPage, sizePerPage) {
    let { sortName, sortOrder, filterObj } = this.state

    this.setState({
      page: currentPage,
      size: sizePerPage
    }, () => {
      this.fetchData(currentPage, sizePerPage, sortName, sortOrder, filterObj)
    })
  }

  onFilterChange(filterObj) {
    let { page, size, sortName, sortOrder } = this.state

    if (Object.keys(filterObj).length === 0 && filterObj.constructor === Object) {
      this.setState({
        columnFilter: false,
        filterObj: {}
      }, () => {
        this.fetchData(page, size, sortName, sortOrder)
      })
    } else {
      this.setState({
        columnFilter: true,
        filterObj: filterObj
      }, () => {
        this.fetchData(1, size, sortName, sortOrder, filterObj)
      })
    }
  }

  exportData() {
    let { columnFilter, api_url, config, page, size, sortName, sortOrder, filterObj } = this.state

    let url = api_url + '/api/product_assignment/?page=all'
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
          downloadCSV(response.data.ResponseData, 'product_assignment')
          this.fetchData(page, size, sortName, sortOrder, filterObj)

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
    var edit = (this.state.update) ? <a onClick={()=>this.editRow(row)} style={{ marginLeft: '5px'}}><Tooltip title="Edit"><Icon type="edit" /></Tooltip></a> : ' ';
    var read = (this.state.read) ? <a onClick={()=>this.viewRow(row)} style={{ marginLeft: '5px'}}><Tooltip title="View"><Icon type="search" /></Tooltip></a> : ' ';

		return <div>{edit} {read}</div>
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

  addRow(){
    let dispatch = this.props
    dispatch.FormMode('add')
    this.props.history.push({
      pathname: '/product_assignment/new'
    })
  }
	
	viewRow(row){
    let dispatch = this.props
    dispatch.FormMode('view')
    this.props.history.push({
      pathname: `/product_assignment/view/${row.id}`
    })
	}
	
	editRow(row){
    let dispatch = this.props
    dispatch.FormMode('edit')
    this.props.history.push({
      pathname: `/product_assignment/edit/${row.id}`
    })
  }

  enumFormatter(cell, row, enumObject) {
    return enumObject[cell];
  }

  onRowSelect(row, isSelected) {
    if (isSelected === true) {
        this.state.selectedData.push(row)
    } else {
      let param = this.state.selectedData

      for (let i = 0; i < param.length; i++) {
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
      for(let i = 0; i < rows.length; i++) {
        param.push(rows[i])
      }
    } else {
      this.setState({
        selectedData : []
      })
    }
  }

  bulkDelete(){
    let { selectedData, api_url, config, page, size, sortName, sortOrder, filterObj } = this.state
    var remove = window.confirm("Do you want to delete this data ?");
    if (remove) {
      if (selectedData.length !== 0) {
        for(let i=0; i<selectedData.length; i++){
          let url = api_url+'/api/product_assignment/?id=' + selectedData[i].id
          axios.delete(url, config)
          .then((response) => {
            if (response.data.ResponseCode === '200') {
              message.success("Your data has been successfully deleted");
              this.fetchData(page, size, sortName, sortOrder, filterObj)
              this.setState({
                selectedData: []
              })

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
      } else {
        alert("Please select any row..!");
      }
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

    const shemeType = {
      0: 'Fee Based',
      1: 'Subscription',
    };

    if (isAuthorized) {
      return (
        <React.Fragment>
          <Row type="flex" justify="end" style={{ marginBottom: '30px' }}>
            <Col>
              <Button className='base_button primary' onClick={this.exportData} >
                  Export CSV
              </Button>
              {
                (this.state.delete) ? <Button className="base_button delete" type="danger" onClick={()=>this.bulkDelete()}>Delete</Button> : ''
              }
              {
                (this.state.create) ? <Button className='base_button primary' onClick={()=>this.addRow()} >Add Record</Button> : ''
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
            selectRow={ selectRowProp } 
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
              <TableHeaderColumn dataField="network" dataAlign="center" width='150px' export={true} dataSort={ true } filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Network</TableHeaderColumn>
              <TableHeaderColumn dataField="agent_name" dataAlign="center" width='150px' export={true} dataSort={ true } filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Agent</TableHeaderColumn>
              <TableHeaderColumn dataField="template" dataAlign="center" width='150px' export={true} dataSort={ true } filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Template</TableHeaderColumn>
              <TableHeaderColumn dataField='scheme' dataAlign="center" width='150px' export={true} dataSort={ true } dataFormat={ this.enumFormatter.bind(this) } formatExtraData={ shemeType } filter={ { type: 'SelectFilter', options: shemeType } }>Scheme</TableHeaderColumn>
              <TableHeaderColumn dataField="button" dataFormat={this.buttonFormatter.bind(this)} dataAlign="center" width='100px'>Actions</TableHeaderColumn>
              
          </BootstrapTable>
        </React.Fragment>
      )
    } else {
      return ('You are not authorized to access this page')
    }
  }
}

function mapStateToProps(state) {
    const { user } = state;
    return {
        user
    }
}

export default withRouter(connect(mapStateToProps, { LogUser, FormMode })(ProductAssignmentList));
