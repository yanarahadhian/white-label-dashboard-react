import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Icon, message, Tooltip, Spin } from "antd";
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import { LogUser, FormMode } from '../actions';
import axios from "axios";
import moment from "moment";
import { config } from "../config";
import fileDownload from 'js-file-download';
import { readFilterData } from '../middleware/read_filter';

class HelpList extends Component {
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
      tableHeight : '244px',
      tableHeightList : { 5 : '244px', 10 : '415px', 15 : '573px', 'all' : '573px' },
      api_url: config().api_url,
    }

    this.viewRow = this.viewRow.bind(this)
    this.handleDeleteRow = this.handleDeleteRow.bind(this)
    this.handleDeleteButton = this.handleDeleteButton.bind(this)
    this.handleRowSelect = this.handleRowSelect.bind(this)
    this.exportData = this.exportData.bind(this)
    this.onSortChange = this.onSortChange.bind(this)
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
    let user_network = this.props.user.network
    let url = api_url + '/api/help/?page=' + page + '&size=' + size

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
        if (response.data.ResponseCode === '200') {

          this.downloadCSV(response.data.ResponseData)
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

  downloadCSV(data) {
    var result, ctr, keys, columnDelimiter, lineDelimiter;

    if (data == null || !data.length) {
      return null;
    }

    columnDelimiter = ',';
    lineDelimiter = '\n';

    keys = Object.keys(data[0]);

    result = '';
    result += keys.join(columnDelimiter);
    result += lineDelimiter;

    data.forEach(function(item) {
      ctr = 0;
      keys.forEach(function(key) {
        if (ctr > 0) result += columnDelimiter;
        result += item[key];
        ctr++;
      });
      result += lineDelimiter;
    });

    fileDownload(result, 'Topup_Wallet.csv')
  }

  createCustomButtonGroup() {
    return (
			<div className='button_group'>
				<Button className='base_button primary' onClick={this.exportData} >
						Export CSV
				</Button>
        {
          (this.state.delete) ? <Button className="base_button delete" type="danger" onClick={()=>this.handleDeleteRow()} disabled={ this.handleDeleteButton() } >Delete</Button> : ''
        }
			</div>
    )
  }

	buttonFormatter(cell, row){
    var edit = (this.state.update) ? <a onClick={()=>this.editRow(row)} style={{ marginLeft: '5px'}}><Tooltip title="Edit"><Icon type="edit" /></Tooltip></a> : ' ';
    var read = (this.state.read) ? <a onClick={()=>this.viewRow(row)} style={{ marginLeft: '5px'}}><Tooltip title="View"><Icon type="search" /></Tooltip></a> : ' ';

		return <div>{edit} {read}</div>
  }
    
  _dateFormat(cell, row){ return cell ? moment(cell, "YYYY-MM-DD HH:mm:ss").format("DD/MM/YYYY HH:mm:ss") : ""; }

  handleSizePerPageChange(sizePerPage) {
    // When changing the size per page always navigating to the first page
    let { tableHeight, tableHeightList, sortName, sortOrder, filterObj } = this.state
    let setHeight = tableHeight

    Object.keys(tableHeightList).forEach((key) => {
      if (sizePerPage === Number(key)) {
        setHeight = tableHeightList[key]
      } else if (sizePerPage !== 5 && sizePerPage !== 10 && sizePerPage !== 15) {
        setHeight = tableHeightList.all
      }
    })

    this.setState({
      tableHeight: setHeight
    }, () => {
      this.fetchData(1, sizePerPage, sortName, sortOrder, filterObj)
    })
  }
  
  handleDeleteRow() {
    let { api_url, config, selectedRow, page, size, sortName, sortOrder, filterObj } = this.state

    let id = selectedRow.id
    let url = api_url + '/api/help/?id=' + id
    
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
          this.fetchData(page, size, sortName, sortOrder, filterObj)
          
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
      pathname: `/help/view/${row.id}`
    })
	}
	
	editRow(row){
    let dispatch = this.props
    dispatch.FormMode('edit')
    this.props.history.push({
      pathname: `/help/edit/${row.id}`
    })
  }

  handleRowSelect(row){
    this.setState({
      selectedRow: row
    })
  }
	
  render() {
    const selectRow = {
      mode: "radio",
      onSelect: this.handleRowSelect
    };

    if(this.state.isAuthorized){
      return (
          <BootstrapTable 
            data={this.state.data} 
            striped={true} 
            hover={true} 
            remote={true} 
            fetchInfo={ { dataTotalSize: this.state.totalDataSize } } 
            condensed 
            exportCSV 
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
                }, {
                  text: 'All', value : this.state.totalDataSize
              }],
              sizePerPage: this.state.size,
              onSizePerPageList: this.handleSizePerPageChange.bind(this),
              onPageChange: this.onPageChange.bind(this),
              page: this.state.page,
              onFilterChange: this.onFilterChange.bind(this),
              btnGroup: this.createCustomButtonGroup.bind(this),
              noDataText: (this.state.isLoading) ? <Spin/> : 'No Data Found',
              sortName: this.state.sortName,
              sortOrder: this.state.sortOrder,
              onSortChange: this.onSortChange
            }} >
              <TableHeaderColumn dataField='id' isKey={true} hidden={true}>ID</TableHeaderColumn>
              <TableHeaderColumn dataField="user" dataAlign="center" width='100px' dataSort={ true } filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Username</TableHeaderColumn>
              <TableHeaderColumn dataField="network" dataAlign="center" width='100px' dataSort={ true } filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Network</TableHeaderColumn>
              <TableHeaderColumn dataField='city' dataAlign="center" width='100px' dataSort={ true } filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>City</TableHeaderColumn>
              <TableHeaderColumn dataField='position' dataAlign="center" width='100px' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Position</TableHeaderColumn>
              <TableHeaderColumn dataField='devicetoken' dataAlign="center" width='100px' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Device Token</TableHeaderColumn>
              <TableHeaderColumn dataField='hardware_id' dataAlign="center" width='100px' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Hardware ID</TableHeaderColumn>
							<TableHeaderColumn dataField='created_at' width='170px' export={true} dataSort={ true } dataFormat = {this._dateFormat.bind(this)} filter={ { type: 'DateFilter' } }>Date</TableHeaderColumn>
							<TableHeaderColumn dataField='gmt' width='170px' export={true} dataSort={ true } filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>GMT</TableHeaderColumn>
              <TableHeaderColumn dataField='judul' dataAlign="center" width='100px' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Title</TableHeaderColumn>
              <TableHeaderColumn dataField='questions' dataAlign="center" width='100px' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Questions</TableHeaderColumn>
              <TableHeaderColumn dataField='status' dataAlign="center" width='100px' dataSort={ true } filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Status</TableHeaderColumn>
              <TableHeaderColumn dataField="button" dataFormat={this.buttonFormatter.bind(this)} width='100px'>Actions</TableHeaderColumn>
              
          </BootstrapTable>
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

export default withRouter(connect(mapStateToProps, { LogUser, FormMode })(HelpList));
