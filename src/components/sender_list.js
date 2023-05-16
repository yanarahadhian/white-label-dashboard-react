import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Icon, message, Tooltip, Spin } from "antd";
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import { FormMode, LogUser } from '../actions';
import axios from "axios";
import moment from "moment";
import { config } from "../config";
import fileDownload from 'js-file-download';
import { readFilterData } from '../middleware/read_filter'

class SenderList extends Component {
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
        isLoading: false,
        sortName : undefined,
        sortOrder : undefined,
        selectedData: [],
        api_url: config().api_url,
        config: { headers: {'token': localStorage.getItem('token')} }
    }

        this.onRowSelect = this.onRowSelect.bind(this);
        this.onSelectAll = this.onSelectAll.bind(this);
        this.exportData = this.exportData.bind(this)
        this.onSortChange = this.onSortChange.bind(this)
        this.bulkDelete = this.bulkDelete.bind(this)
    }

    onSortChange(sortName, sortOrder) {

		this.setState({
			sortName,
			sortOrder,
			page : 1
		}, () => {
			this.fetchData(this.state.page, this.state.size, this.state.sortName, this.state.sortOrder)
		})

	}

	fetchData(page, size, sortName, sortOrder, filterObj) {

		let { api_url, config } = this.state

		this.setState({ isLoading : true })

		let url = api_url + '/api/senders/?page=' + page

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
			url += `&orderName=sender&orderBy=ASC`
		}

		// Filter Management
        if (filterObj !== undefined && filterObj !== {} ) {
            let filterUrl = readFilterData(filterObj)
            url += filterUrl
        }

		console.log(url)

		axios.get(url, config)
		.then((response) => {
			if (response.data.ResponseCode === "200") {
				this.setState({
					data: response.data.ResponseData,
					totalDataSize: response.data.ResponseTotalResult,
					isLoading: false
				})

			} else {
				this.setState({
					data : [],
					isLoading : false
				}, () => {
					message.error(response.data.ResponseDesc)
				})
			}

			this.setState({
				isLoading: false
			})
		}, (err) => {
			console.error(err)
		})

    }
    
    componentWillMount() {

		let { page, size, sortName, sortOrder } = this.state 

		//check if user have access to this page
		let rights = this.state.user_rights
		let page_url = this.props.location.pathname

		for (let item in rights) {
			if (rights[item].page_url === page_url) {
				if (rights[item].create === 1 || rights[item].read === 1 || rights[item].update === 1 || rights[item].delete === 1 || rights[item].approve === 1){
					this.setState({
					isAuthorized: true,
					create: (rights[item].create === 1) ? true : false,
					read: (rights[item].read === 1) ? true : false,
					update: (rights[item].update === 1) ? true : false,
					delete: (rights[item].delete === 1) ? true : false
					})
					
					this.fetchData(page, size, sortName, sortOrder)
				}
			}
		}

	}

	onFilterChange(filterObj) {

		let { page, size, sortName, sortOrder } = this.state

		if (Object.keys(filterObj).length === 0 && filterObj.constructor === Object) {
		  this.setState({
				columnFilter: false,
				filterObj: {}
				},()=> {
					this.fetchData(page, size, sortName, sortOrder)
		  })
		} else {
		  this.setState({
				columnFilter: true,
				filterObj: filterObj
				}, () => {
					this.fetchData(page, size, sortName, sortOrder, this.state.filterObj)
			})
		}

	}

	exportData() {
		let { api_url, config, sortName, sortOrder, columnFilter, filterObj } = this.state
		
		let url = api_url + '/api/senders/?page=all'
		let exportAll = false

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
				if (response.data.ResponseCode === "200") {
					this.downloadCSV(response.data.ResponseData)
				} else {
					message.error(response.data.ResponseDesc)
				}
				
				this.setState({ isLoading: false })
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
	
		fileDownload(result, 'senders.csv')
    }
    

    createCustomButtonGroup() {
		return (
		  <div className='button_group'>
			<Button className='base_button primary' onClick={this.exportData} >
				Export CSV
			</Button>
			{
			  (this.state.create) ? <Button className='base_button primary' onClick={()=>this.addRow()} >Add Record</Button> : ''
			}
			{
			  (this.state.delete) ? <Button className="base_button delete" onClick={()=>this.bulkDelete()} >Delete</Button> : ''
			}
		  </div>
		);
	}


    onPageChange(currentPage, sizePerPage) {
		this.setState({
			page : currentPage,
			size : sizePerPage
		})

		this.fetchData(currentPage, sizePerPage, this.state.sortName, this.state.sortOrder, this.state.filterObj)
	}


    bulkDelete(){
        
        let { api_url, config, page, size, sortName, sortOrder } = this.state
        let params = this.state.selectedData
        
        var remove = window.confirm("Do you want to delete this data ?");
        if (remove) {
            if (params.length !== 0) {
                for(let i=0; i<params.length; i++){

                    let url = api_url + '/api/senders/?id=' + params[i].id
                    
                    axios.delete(url, config)
                    .then((response) => {
                        
                        if(response.data.ResponseCode==="500"){
                            message.error(response.data.ResponseDesc);
                        } else {
                            message.success(response.data.ResponseDesc);
                            this.fetchData(page, size, sortName, sortOrder)
                            
                            this.setState({
                                selectedData: []
                            })
                        }
                        console.log(response)
                    }, (err) => {
                        message.error(err.data.ResponseDesc);
                        console.error(err)
                        return false
                    })
                }
            } else {
                alert("Please select any row..!");
            }
        }
    }

    _dateFormat(cell, row){ return cell ? moment(cell, "YYYY-MM-DD HH:mm:ss").format("DD/MM/YYYY HH:mm:ss") : ""; }

    handleSizePerPageChange(sizePerPage) {
      this.setState({
        page : 1,
        size : sizePerPage
      }, () => {
          this.fetchData(1, sizePerPage)
      })
    }
  
    buttonFormatter(cell, row){
        return <div>
                <a onClick={()=>this.viewRow(row)} style={{ marginLeft: '5px'}}><Tooltip title="View"><Icon type="search" /></Tooltip></a> 
                <a onClick={()=>this.editRow(row)} style={{ marginLeft: '5px'}}><Tooltip title="Edit"><Icon type="edit" /></Tooltip></a>
                </div>;
    }
  
    viewRow(row){
        let dispatch = this.props
        dispatch.FormMode('view')
        this.props.history.push({
        pathname: `/sender/view/${row.id}`
        })
    }
	
    editRow(row){
        let dispatch = this.props
        dispatch.FormMode('edit')
        this.props.history.push({
        pathname: `/sender/edit/${row.id}`
        })
    }

    addRow(){
        let dispatch = this.props
        dispatch.FormMode('add')
        this.props.history.push({
        pathname: '/sender/new',
        })
    }
  
    onRowSelect(row, isSelected){
        if (isSelected === true) {
            this.state.selectedData.push(row)
        } else {
        let param = this.state.selectedData
        for(let i=0; i<param.length; i++){
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
        for(let i=0; i<rows.length; i++){
            param.push(rows[i])
        }
        } else {
        this.setState({
            selectedData : []
        })
        }
    }

  render() {
    const selectRowProp = {
      mode: 'checkbox',
      clickToSelect: true,
      onSelect: this.onRowSelect,
      onSelectAll: this.onSelectAll
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
              btnGroup: this.createCustomButtonGroup.bind(this),
              noDataText: (this.state.isLoading) ? <Spin/> : 'No Data Found',
              sortName: this.state.sortName,
              sortOrder: this.state.sortOrder,
              onSortChange: this.onSortChange
              }} >
                <TableHeaderColumn dataField="id" width='100px' isKey={true} hidden={true} export={true} >ID</TableHeaderColumn>
                <TableHeaderColumn dataField="sender" dataAlign="center" width='100px' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Sender</TableHeaderColumn>
                <TableHeaderColumn dataField="description" dataAlign="center" width='200px'>Description</TableHeaderColumn>
                <TableHeaderColumn dataField='created_at' dataAlign="center" width='100px' export={true} dataSort={true} dataFormat = {this._dateFormat.bind(this)}>Created At</TableHeaderColumn>
                <TableHeaderColumn dataField="updated_at" hidden={true} export={true}>Updated At</TableHeaderColumn>
                <TableHeaderColumn dataField="deleted_at" hidden={true} export={true}>Deleted At</TableHeaderColumn>
                <TableHeaderColumn dataField="button" dataFormat={this.buttonFormatter.bind(this)} width='80px'>Actions</TableHeaderColumn>
            </BootstrapTable>
      )
    }
    else{
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

export default withRouter(connect(mapStateToProps, { LogUser, FormMode })(SenderList));
