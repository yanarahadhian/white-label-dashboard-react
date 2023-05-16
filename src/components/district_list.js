import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Icon, message, Tooltip, Spin, Row, Col } from "antd";
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import { FormMode, LogUser, SetTableStates } from '../actions';
import axios from "axios";
import { config } from "../config";
import { readFilterData } from '../middleware/read_filter';
import { downloadCSV } from '../middleware/export'
// import fileDownload from 'js-file-download';
// import ReactFileReader from 'react-file-reader'

class DistrictList extends Component {
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
      config: { headers: {'token': localStorage.getItem('token')}},
      provinceList : [],
      areaList : [],
      dataAreaDistrict : {},
      pagepath : this.props.location.pathname
    }

    this.handleDeleteRow = this.handleDeleteRow.bind(this)
    this.handleDeleteButton = this.handleDeleteButton.bind(this)
    this.handleRowSelect = this.handleRowSelect.bind(this)
    this.exportData = this.exportData.bind(this)
    /* this.validateFile = this.validateFile.bind(this)
    this.fetchProvinces = this.fetchProvinces.bind(this)
    this.fetchAreas = this.fetchAreas.bind(this)
    this.readFiles = this.readFiles.bind(this)
    this.readMosques = this.readMosques.bind(this)
    this.handleFiles = this.handleFiles.bind(this)
    this.handleMosques = this.handleMosques.bind(this)
    this.handleUpload = this.handleUpload.bind(this) */
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
              this.fetchData(page, size, filterObj)
            } else {
              this.fetchData()
            }
          })

          // this.fetchProvinces()
          // this.fetchAreas()
        }
      }
    }
  }

  fetchData(pageNumber = this.state.page, pageSize = this.state.size, filterObj = this.state.filterObj) {
    this.setState({ isLoading: true })

    let { api_url, config } = this.state
    let url = api_url + '/api/district/?page=' + pageNumber + '&size=' + pageSize + '&orderName=id&orderBy=DESC'

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
          data : response.data.ResponseData,
          totalDataSize : response.data.ResponseTotalResult
        }, () => {
          return response.data
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

        this.setState({ isLoading : false, data : [], totalDataSize : 0 })
      }
    })
    .catch((err) => {
      this.setState({ isLoading : false, data : [], totalDataSize : 0 })
      console.log(err)
    })
  }

  assignFilter() {
    const { filterObj } = this.state

    if (Object.keys(filterObj).length > 0) {

      if (filterObj.province_name) {
        this.refs.provinceCol.applyFilter(filterObj.province_name.value)
      }

      if (filterObj.area) {
        this.refs.areaCol.applyFilter(filterObj.area.value)
      }

      if (filterObj.district_name) {
        this.refs.districtCol.applyFilter(filterObj.district_name.value)
      }      
    }
  }

  dispatchTableStates() {
    const { page, size, filterObj, pagepath } = this.state
    const table_states = { page, size, filterObj, pagepath }

    this.props.SetTableStates(table_states)
  }

  /* fetchProvinces() {
    let { api_url, config } = this.state
    let url = api_url + '/api/province?page=all'

    axios.get(url, config)
    .then((response) => {
        console.log('Provinces : ', response.data)

        this.setState({
            provinceList : response.data.ResponseData
        })
    })
    .catch((err) => {
        console.log(err)
    })
  }

  fetchAreas() {
    let { api_url, config } = this.state
    let url = api_url + '/api/area?page=all'

    axios.get(url, config)
    .then((response) => {
        console.log('Areas : ', response.data)

        this.setState({
            areaList : response.data.ResponseData
        })
    })
    .catch((err) => {
        console.log(err)
    })
  } */

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

    let url = api_url + '/api/district/?page=all&orderName=id&orderBy=DESC'
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
          downloadCSV(response.data.ResponseData, 'district')
        } else {
          if (response.data.status === '401') {
            this.setState({ isAuthorized : false, data : [], totalDataSize : 0 })
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

  /* downloadMosques(mosques) {
    let result = 'masjid_province,masjid_area,masjid_district,masjid_nama,masjid_id,masjid_tipologi,masjid_alamat\n'
    let lineDelimiter = '\n'

    if (!mosques) {
      return null
    }

    for (let item in mosques) {
      result = result + mosques[item] + lineDelimiter
    }

    fileDownload(result, 'mosques.csv')
  }

  readFiles(files) {

    let reader = new window.FileReader()

    reader.onload = (e) => {
        let fileData = reader.result
        this.handleFiles(fileData)
    }

    reader.readAsText(files.fileList[0])
  }

  readMosques(files) {

    let reader = new window.FileReader()

    reader.onload = (e) => {
      let fileData = reader.result
      this.handleMosques(fileData)
    }

    reader.readAsText(files.fileList[0])
  }

  validateFile(dataAttributes) {
    let attributes = dataAttributes.split(',')
    return attributes[0] === "provinces" && attributes[1] === "areas" && attributes[2] === "districts"
  }

  async handleMosques(fileData) {
    
    let { api_url, config } = this.state
    let url = api_url + '/api/district/?page=all&orderName=id&orderBy=ASC'
    let districtList = []
    let registrant = this.props.user.username

    axios.get(url, config)
    .then((response) => {
      if (response.data.ResponseCode === '200') {
        districtList = response.data.ResponseData

        districtList.map((district) =>  district.concatValue = (`${district.province_name} ${district.area} ${district.district_name}`).toLowerCase() )

        let result = []
        let splittedFileData = fileData.split(/\r\n|\n|\r/)
        let attributes = splittedFileData[0].split(',')
        let unmatchDistrict = []

        if (attributes[0] === "masjid_province" && attributes[1] === "masjid_area" && attributes[2] === "masjid_district" && attributes[3] === "masjid_nama" && attributes[4] === "masjid_id" && attributes[5] === "masjid_tipologi" && attributes[6] === "masjid_alamat") {
          let dataValue = splittedFileData.slice(1)

          dataValue.forEach((item) => {
            let field = item.split(",")
            let fieldConcateValue = (`${field[0]} ${field[1]} ${field[2]}`).toLowerCase()
            let fieldMasjid = field[3]
            let fieldIdMasjid = field[4]
            let fieldTipologi = field[5]
            let fieldAlamat = field[6]

            // Comparing province, area, and district value on mosques file with master on database.
            // If valid then the mosque row will assigned to that district_id
            let validMosqueProvinceAreaDistrict = districtList.some((district) => district.concatValue === fieldConcateValue)

            let districtIndex, districtId = null

            if (validMosqueProvinceAreaDistrict) {

              districtIndex = districtList.map((district) => district.concatValue).indexOf(fieldConcateValue)
              districtId = districtList[districtIndex].id
              
              result.push({ district_id : districtId , mosque_name : fieldMasjid, mosque_alamat : fieldAlamat, mosque_id : fieldIdMasjid, mosque_tipologi : fieldTipologi , registrant : registrant })

            } else {
                unmatchDistrict.push(item)
            }
          })
          
          console.log({ totalRows : dataValue.length, insertData : result.length, failedData : unmatchDistrict.length })
          this.downloadMosques(unmatchDistrict)

          // REQUEST ADD BULK
          let url = api_url + '/api/mosque/bulk'
          
          axios.post(url, { mosques : result }, config)
          .then((resBulkMosque) => {
            console.log(resBulkMosque)
          })
          .catch((errBulkMosque) => {
            console.log(errBulkMosque)
          })

        } else {
          message.error("File must contains data with label (masjid_kecamatan, masjid_nama, masjid_alamat) in the right order. ")
        }

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
    })
    .catch((err) => {
      console.log(err)
      message.info("Failed to fetch District List")
    })
  }

  handleFiles(fileData) {
    let { provinceList, areaList } = this.state

    let result = { provinces : [] }
    let splittedFileData = fileData.split(/\r\n|\n|\r/)
    let validate = this.validateFile(splittedFileData[0])
    
    if (validate) {
        let dataValue = splittedFileData.slice(1)
        let provinces = []
        let areas = []

        dataValue.forEach((item) => {
            let field = item.split(",")
            let fieldProvinces = field[0]
            let fieldAreas = field[1]
            let fieldDistricts = field[2]

            let provinceNameExists = provinceList.some(item => item.province_name === fieldProvinces)
            let areaNameExists = areaList.some(item => item.area === fieldAreas)

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
            let selectedProvince = result.provinces[result.provinces.length - 1]
            
            if (areaNameExists && fieldAreas && selectedProvince.areas.includes(fieldAreas) === false && provinceNameExists && areas.includes(fieldAreas) === false) {
              let areaIndex = areaList.map((areaDetails) => { return areaDetails.area }).indexOf(fieldAreas)
              let areaId = areaList[areaIndex].id
              
              areas.push(fieldAreas)
              
              selectedProvince.areas.push({ name : fieldAreas, id : areaId, districts : [] })
            }


            let newAreaIndex = selectedProvince.areas.map((areaDetails) => { return areaDetails.name }).indexOf(fieldAreas)

            let selectedArea = selectedProvince.areas[newAreaIndex]
            // console.log('\n\n  ---> SelectedArea : ', newAreaIndex, selectedArea)
            // console.log('----> District : ', fieldDistricts)

            if (newAreaIndex !== -1 && selectedArea.districts.includes(fieldDistricts) === false && fieldDistricts && areaNameExists) {
                selectedArea.districts.push(fieldDistricts)
            }
        })

        this.setState({
            dataAreaDistrict : result
        }, () => {
            console.log(this.state.dataAreaDistrict)
        })
    } else {
      this.setState({
        dataAreaDistrict : {}
      }, () => {
        message.error("File must contains data with label (provinces,areas) in the right order. ")
      })
    }
  }

  handleUpload() {
    let { api_url, config, dataAreaDistrict } = this.state
    let url = api_url + '/api/district/bulk'
    let payload = { areas : dataAreaDistrict }
    
    axios.post(url, payload, config)
    .then((response) => {
      console.log(response)

      if (response.data.ResponseCode === '200') {
        this.setState({ dataAreaDistrict : {} })
        message.success("Import District Successful")
        this.fetchData(1, this.state.size)
      } else {
        if (response.data.status === '401') {
          this.setState({
            isAuthorized : false,
            dataAreaDistrict : {}
          }, () => {
            message.error('Login Authentication Expired. Please Login Again!')
          })
        } else {
          this.setState({ dataAreaDistrict : {} })
          let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : ""
          console.log(msg)
          message.error(msg)
        }

      }
    })
    .catch((err) => {
      console.log(err)
      this.setState({ dataAreaDistrict : {} })
    })
  } */

  handleSizePerPageChange(sizePerPage) {
		this.setState({
      page : 1,
      size : sizePerPage
		}, () => {
      this.dispatchTableStates()
			this.fetchData()
		})
	}

  handleDeleteRow() {
    let { api_url, config, selectedRow, page, size, filterObj } = this.state
    let url = api_url + '/api/district/?id=' + selectedRow.id

    let remove = window.confirm("Do you want to delete this data ?");

    if (remove) {
      axios.delete(url, config)
      .then((response) => {
        console.log(response.data)

        if (response.data.ResponseCode === '200') {
          this.setState({ selectedRow : {} }, () => {
            message.success(response.data.ResponseDesc)
            this.fetchData(page, size, filterObj)
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
		return <div>
				<a onClick={()=>this.viewRow(row)} ><Tooltip title="View"><Icon type="search" /></Tooltip></a> 
				<a onClick={()=>this.editRow(row)} style={{ marginLeft: '20px'}}><Tooltip title="Edit"><Icon type="edit" /></Tooltip></a>
				</div>;
	}

  addRow(){
    let dispatch = this.props
    dispatch.FormMode('add')
    this.props.history.push({
      pathname: '/district/new'
    })
  }

  editRow(row){
    let dispatch = this.props
    dispatch.FormMode('edit')
    this.props.history.push({
      pathname: `/district/edit/${row.id}`
    })
  }

  viewRow(row){
    let dispatch = this.props
    dispatch.FormMode('view')
    this.props.history.push({
      pathname: `/district/view/${row.id}`
    })
  }

  handleRowSelect(row) {
    const { selectedRow } = this.state
    let replaceRow = {}

    if (row.constructor === Object && Object.keys(row).length > 0) {
      if (row.id && row.id !== selectedRow.id) {
        replaceRow = row
      }

      this.setState({ selectedRow: replaceRow }, () => console.log(this.state.selectedRow) )
    }
  }
  
  render() {
    const { isAuthorized } = this.state

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
              {/* <ReactFileReader handleFiles={ this.readMosques } fileTypes={[".csv"]} base64={true}>
                <Button className="base_button primary">
                  Import Mosques
                </Button>
              </ReactFileReader> */}
              {/* {
                (Object.keys(dataAreaDistrict).length === 0 && dataAreaDistrict.constructor === Object) ? (
                  <ReactFileReader handleFiles={ this.readFiles } fileTypes={[".csv"]} base64={true}>
                    <Button className="base_button primary" >
                      Import Districts
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
                (this.state.create) ? <Button className='base_button primary' onClick={()=>this.addRow()} >Add District</Button> : ''
              }
              {
                (this.state.delete) ? 
                  (
                    <Button className={ (this.handleDeleteButton()) ? ('button_disabled delete_disabled') : ('base_button delete') } 
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
            }} >
              <TableHeaderColumn dataField="id" width='100px' isKey={true} hidden={true} export={true} >ID</TableHeaderColumn>
              <TableHeaderColumn ref='provinceCol' dataField="province_name" width='100px' dataAlign="center" filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>Province</TableHeaderColumn>
              <TableHeaderColumn ref='areaCol' dataField="area" width='150px' dataAlign="center" filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>City</TableHeaderColumn>
              <TableHeaderColumn ref='districtCol' dataField="district_name" width='100' dataAlign="center" filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } }>District</TableHeaderColumn>
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

export default withRouter(connect(mapStateToProps, { LogUser, FormMode, SetTableStates })(DistrictList))
