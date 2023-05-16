import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Icon, message, Tooltip, Spin, Row, Col } from "antd";
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import { FormMode, LogUser, SetTableStates } from '../actions';
import axios from "axios";
import { config } from "../config";
import { readFilterData } from '../middleware/read_filter';
// import ReactFileReader from 'react-file-reader'
import { downloadCSV } from '../middleware/export'

class AreaList extends Component {
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
      size: 10,
      page: 1,
      columnFilter: false,
      filterObj: {},
      isLoading: false,
      selectedRow: {},
      provinceList : [],
      dataProvinceArea : {},
      config: { headers: {'token': localStorage.getItem('token')}},
      pagepath : this.props.location.pathname
    }

    this.handleDeleteRow = this.handleDeleteRow.bind(this)
    this.handleDeleteButton = this.handleDeleteButton.bind(this)
    this.handleRowSelect = this.handleRowSelect.bind(this)
    this.exportData = this.exportData.bind(this)
    this.validateFile = this.validateFile.bind(this)
    this.readFiles = this.readFiles.bind(this)
    this.handleFiles = this.handleFiles.bind(this)
    this.handleUpload = this.handleUpload.bind(this)
  }

  componentWillMount() {
    //check if user have access to this page
    const rights = this.state.user_rights
    const page_url = this.props.location.pathname
    const table_states = this.props.table_states
    let page, size, filterObj = null

    // receive table_states if previous page is still in the same page circle
    if (table_states.pagepath === page_url) {
      page = table_states.page
      size = table_states.size
      filterObj = table_states.filterObj
    } else {
      // reset table_states in store to default value
      this.props.SetTableStates({})
    }

    for (let item in rights) {
      if (rights[item].page_url === page_url) {
        if (rights[item].create === 1 || rights[item].read === 1 || rights[item].update === 1 || rights[item].delete === 1 || rights[item].approve === 1){
          this.setState({
            isAuthorized: true,
            create: (rights[item].create === 1) ? true : false,
            read: (rights[item].read === 1) ? true : false,
            update: (rights[item].update === 1) ? true : false,
            delete: (rights[item].delete === 1) ? true : false,
            page : (page) ? (page) : (this.state.page),
            size : (size) ? (size) : (this.state.size),
            filterObj : (filterObj) ? (filterObj) : (this.state.filterObj)
          }, async () => {
            if (Object.keys(table_states).length > 0) {
              await this.assignFilter()
              await this.fetchData(page, size, filterObj)
              // this.fetchProvinces()
            } else {
              this.fetchData()
              // this.fetchProvinces()
            }
          })
        }
      }
    }
  }

  fetchData(pageNumber = this.state.page, pageSize = this.state.size, filterObj = this.state.filterObj) {
    this.setState({ isLoading: true })

    let { api_url, config } = this.state
    let url = api_url + '/api/area/?page=' + pageNumber + '&size=' + pageSize + '&orderName=province_id&orderBy=ASC'

    // Filter Management
		if (filterObj && filterObj !== undefined && filterObj !== {} ) {
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
            isAuthorized : false,
          }, () => {
            message.error('Login Authentication Expired. Please Login Again!')
          })
        } else {
          let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : "Fetching Failed"
          message.error(msg)
        }

        this.setState({ isLoading : false, data : [], totalDataSize : 0 })
      }
    })
    .catch((err) => {
      this.setState({ isLoading : false })
      console.log(err)
    })
  }

  // fetchProvinces() {
  //   let { api_url, config } = this.state
  //   let url = api_url + '/api/province?page=all'

  //   axios.get(url, config)
  //   .then((response) => {
  //       console.log('Provinces : ', response.data)

  //       this.setState({
  //           provinceList : response.data.ResponseData
  //       })
  //   })
  //   .catch((err) => {
  //       console.log(err)
  //   })
  // }

  assignFilter() {
    const { filterObj } = this.state

    if (Object.keys(filterObj).length > 0) {

      if (filterObj.province_name) {
        this.refs.provinceCol.applyFilter(filterObj.province_name.value)
      }

      if (filterObj.area) {
        this.refs.areaCol.applyFilter(filterObj.area.value)
      }

      if (filterObj.note) {
        this.refs.noteCol.applyFilter(filterObj.note.value)
      }
    }
  }

  dispatchTableStates() {
    const { page, size, filterObj, pagepath } = this.state
    const table_states = { page, size, filterObj, pagepath }

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
    let { api_url, config, columnFilter, filterObj} = this.state

    let url = api_url + '/api/area/?page=all&orderName=area'
    let exportData = false

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
          
          // this.downloadCSV(response.data.ResponseData)
          downloadCSV(response.data.ResponseData, 'city')
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

  readFiles(files) {

    let reader = new window.FileReader()

    reader.onload = (e) => {
        let fileData = reader.result
        this.handleFiles(fileData)
    }

    reader.readAsText(files.fileList[0])
  }

  validateFile(dataAttributes) {
    let attributes = dataAttributes.split(',')
    return attributes[0] === "provinces" && attributes[1] === "areas"
  }

  handleFiles(fileData) {
    let { provinceList } = this.state

    let result = { provinces : [] }
    let splittedFileData = fileData.split(/\r\n|\n|\r/)
    let validate = this.validateFile(splittedFileData[0])
    
    if (validate) {
        let dataValue = splittedFileData.slice(1)
        let provinces = []

        dataValue.forEach((item) => {
            let field = item.split(",")
            let fieldProvinces = field[0]
            let fieldAreas = field[1]
            let provinceNameExists = provinceList.some(item => item.province_name === fieldProvinces)

            // Assign Province, only exist province, province name that already stored on database and no duplicate entry of province will be executed
            if (fieldProvinces && provinces.includes(fieldProvinces) === false && provinceNameExists) {
                // Get the id of province
                let provinceIndex = provinceList.map((provinceDetails) => { return provinceDetails.province_name }).indexOf(fieldProvinces)
                let provinceId = provinceList[provinceIndex].id
                
                // Reduce the duplicates
                provinces.push(fieldProvinces)
                
                // Push province data for post request payload
                result.provinces.push({ name : fieldProvinces, id : provinceId ,areas : [] })
                
            }

            // Assign areas into current Province
            let selectedProvince = result.provinces[result.provinces.length-1]
            
            if (fieldAreas && selectedProvince.areas.includes(fieldAreas) === false && provinceNameExists) {
                selectedProvince.areas.push(fieldAreas)
            }
        })

        this.setState({
            dataProvinceArea : result
        }, () => {
            console.log(this.state)
        })
    } else {
      this.setState({
        dataProvinceArea : {}
      }, () => {
        message.error("File must contains data with label (provinces,areas) in the right order. ")
      })
    }
  }

  handleUpload() {
    let { api_url, config, dataProvinceArea } = this.state
    let url = api_url + '/api/area/bulk'
    let payload = { areas : dataProvinceArea }
    
    axios.post(url, payload, config)
    .then((response) => {
      console.log(response.data)

      if (response.data.ResponseCode === '200') {
        message.success("Import Area Successful")
        this.fetchData()
      } else {
        if (response.data.status === '401') {
          this.setState({
            isAuthorized : false
          }, () => {
            message.error('Login Authentication Expired. Please Login Again!')
          })
        } else {
          let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : ""
          message.error(msg)
        }

        this.setState({ dataProvinceArea : {} })
      }
    })
    .catch((err) => {
      console.log(err)
      this.setState({ dataProvinceArea : {} })
    })
  }

  importData() {
    this.setState({
      dataProvinceArea : { Province : 'a'}
    })
  }

  handleSizePerPageChange(sizePerPage) {
    // When changing the size per page always navigating to the first page

    this.setState({
      page : 1,
      size : sizePerPage
    }, () => {
      this.fetchData()
    })

  }

  handleDeleteRow() {
    let { api_url, config, selectedRow } = this.state
    let url = api_url + '/api/area/?id=' + selectedRow.id

    let remove = window.confirm("Do you want to delete this data ?");

    if (remove) {
      axios.delete(url, config)
      .then((response) => {
        console.log(response.data)

        if (response.data.ResponseCode === '200') {
          this.setState({ selectedRow : {}}, () => {
            message.success(response.data.ResponseDesc)
            this.fetchData()
          })
        } else {
          if (response.data.status === '401') {
            // if login auth exipre, set data to empty and show message of auth expiration
            this.setState({ 
              data : [],
              totalDataSize : 0,
              isAuthorized : false,
              disabled : false }, () => {
                message.error('Login Authentication Expired. Please Login Again!')
            })
          } else {
            message.error((response.data.ResponseDesc.sqlMessage) ? ('Database Error!') : (response.data.ResponseDesc) )
          }
        }
      }, (err) => {
        console.error(err)
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
    var edit = (this.state.update) ? <a onClick={()=>this.editRow(row)} style={{ marginLeft: '5px'}}><Tooltip title="Edit"><Icon type="edit" /></Tooltip></a> : ' '
    return <div>{edit}</div>;
  }

  addRow(){
    let dispatch = this.props
    dispatch.FormMode('add')
    this.props.history.push({
      pathname: '/city/new'
    })
  }

  editRow(row){
    let dispatch = this.props
    dispatch.FormMode('edit')
    this.props.history.push({
      pathname: `/city/edit/${row.id}`
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
    const { isAuthorized, data, page, size, totalDataSize, isLoading } = this.state
    const selectRow = {
      mode : "radio",
      onSelect : this.handleRowSelect,
      clickToSelect : true
    }

    if (isAuthorized) {
      return (
        <React.Fragment>
          <Row type="flex" justify="end" style={{ marginBottom : '30px' }}>
            <Col>
              {/* {
                (Object.keys(dataProvinceArea).length === 0 && dataProvinceArea.constructor === Object) ? (
                  <ReactFileReader handleFiles={ this.readFiles } fileTypes={[".csv"]} base64={true}>
                    <Button className="base_button primary" >
                      Import CSV
                    </Button>
                  </ReactFileReader>
                ) : (
                  <Button className="base_button primary" onClick={ this.handleUpload }>
                    Execute
                  </Button>
                )
              } */}
              <Button className='base_button primary' onClick={this.exportData} >
                  Export CSV
              </Button>
              {
                (this.state.create) ? <Button className='base_button primary' onClick={()=>this.addRow()} >Add City</Button> : ''
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
            data={data} striped={true} hover={true} remote={true} fetchInfo={ { dataTotalSize: totalDataSize } } condensed pagination
            selectRow={ selectRow } 
            options={{ 
              sizePerPageList: [ {
                text: '5', value: 5
              }, {
                text: '10', value: 10
              }, {
                text: '15', value: 15
              }],
              sizePerPage: size,
              onSizePerPageList: this.handleSizePerPageChange.bind(this),
              onPageChange: this.onPageChange.bind(this),
              page: page,
              onFilterChange: this.onFilterChange.bind(this),
              noDataText: (isLoading) ? <Spin/> : 'No Data Found'
            }} >
              <TableHeaderColumn dataField="id" width='100px' isKey={true} hidden={true} export={true} >ID</TableHeaderColumn>
              <TableHeaderColumn ref='provinceCol' dataField="province_name" width='100px' dataAlign="center" filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Province</TableHeaderColumn>
              <TableHeaderColumn ref='areaCol' dataField="area" width='150px' dataAlign="center" filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>City</TableHeaderColumn>
              <TableHeaderColumn ref='noteCol' dataField="note" width='100px' dataAlign="center" filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Note</TableHeaderColumn>
              <TableHeaderColumn dataField="created_at" hidden={true} export={true}>Created At</TableHeaderColumn>
              <TableHeaderColumn dataField="updated_at" hidden={true} export={true}>Updated At</TableHeaderColumn>
              <TableHeaderColumn dataField="deleted_at" hidden={true} export={true}>Deleted At</TableHeaderColumn>
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
    const { user, mode, table_states } = state
    
    return { user, mode, table_states }
}

export default withRouter(connect(mapStateToProps, { LogUser, FormMode, SetTableStates })(AreaList))
