import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Form, Select, Icon, message, Row, Col } from "antd";
import axios from "axios";
import { config } from "../config";
import { readCSV } from '../middleware/read_file';
import ReactFileReader from 'react-file-reader';
import alert from 'sweetalert2'
const FormItem = Form.Item;
const Option = Select.Option;

class ImportFile extends Component {
    constructor(props) {
        super(props)
        
        this.state = {
            api_url: config().api_url,
            upload_url : '',
            isAuthorized: false,
            create: false,
            network: '',
            networkList: [],
            province_id: '',
            province_name: '',
            provinceList: {},
            area_id: '',
            area: '',
            areaList: [],
            district_id: '',
            district_name: '',
            districtList: {},
            upline: '',
            upline_name: '',
            uplineList: {},
            roleId : '',
            roleName : '',
            dataImport: {},
            disableUpload : true,
            disableNetworkSelect : true,
            uploadStatus: 'No File Choosen',
            parentUrl: '',
            config: { headers: {'token': localStorage.getItem('token')}}
        }

        this.handleUpload = this.handleUpload.bind(this)
        this.handleArea = this.handleArea.bind(this)
        this.handleNetwork = this.handleNetwork.bind(this)
        this.handleUplineList = this.handleUplineList.bind(this)
        this.importData = this.importData.bind(this)
        this.validateForm = this.validateForm.bind(this)
        this.goBack = this.goBack.bind(this)
        this.handleProvince = this.handleProvince.bind(this)
        this.handleUpline = this.handleUpline.bind(this)
    }

    componentWillMount() {
        let rights = this.props.user.rights
        let page_url = this.props.match.url

        for (let item in rights) {
            let isInclude = page_url.includes(rights[item].page_url)
            
            if (isInclude) {
                if (rights[item].create === 1 || rights[item].read === 1 || rights[item].update === 1 || rights[item].approve === 1) {
                    this.setState({
                        isAuthorized: true,
                        create: true,
                        parentUrl: rights[item].page_url
                    })
                }
            }
        }
    }

    componentDidMount() {
        let { api_url, config} = this.state

        let page_url = this.props.match.url
        let role, roleName = ''
        let networkList = []
        let areaList = []

        if (page_url === '/loper_account/bulk') {
            role = 4
            roleName = 'Loper'
        } else if (page_url === '/agent_account/bulk') {
            role = 3
            roleName = 'Agent'
        } else {
            alert('unknown request')
            this.props.history.push({
                pathname: `/`
            })
        }

        this.setState({
            role: role,
            roleName: roleName
        })

        if (this.state.isAuthorized) {
            // GET NETWORK LIST
            let networkAdministrator = this.props.user.network
            // let networkAdministrator = 1

            axios.get(api_url + '/api/network/?page=all&size=0', config)
                .then((response) => {
                    networkList = response.data.ResponseData
                    this.setState({
                        networkList: networkList
                    })
                })
                .catch((err) => {
                    console.log(err)
                })

            if (networkAdministrator === 0) {
                this.setState({
                    disableNetworkSelect : false
                })
            } else {
                this.setState({
                    disableNetworkSelect : true,
                    network : networkAdministrator.toString()
                })
            }

            // GET PROVINCE LIST
            axios.get(api_url + '/api/province/?page=all&size=0', config)
            .then((response) => {
                this.setState({
                    provinceList: response.data.ResponseData
                })
            }, (err) => {
                console.error(err)
            })
            
            // GET AREA LIST
            axios.get(api_url + '/api/area/?page=all&size=0', config)
            .then((response) => {
                areaList = response.data.ResponseData
                this.setState({
                    areaList: areaList
                })
            })
            .catch((err) => {
                console.log(err)
            })

            // GET UPLINE VALUE
            if (this.props.user.network !== 0) {
                axios.get(this.state.api_url+'/api/network/?id=' + this.state.network , config)
                .then((response) => {
                let userId = response.data.ResponseData[0].upline
                axios.get(api_url + '/api/users/?id=' + userId, config)
                .then((response) => {
                    if (response.data.ResponseCode === "200") {
                    this.setState({
                        uplineList: response.data.ResponseData,
                    })
                    }
                })
                }, (err) => {
                console.error(err)
                })
            }

        }
    }

    handleNetwork(e) {
        this.setState({ network : e }, () => {
            this.handleUplineList()
        })
    }

    handleArea(e, key){
        this.setState({
          area_id: key.key,
          area: e
        }, () => {
          this.handleUplineList()
        })
    
        let { api_url, config, province_id } = this.state
        let url = api_url + '/api/district/?page=all&size=0&province_id=' + province_id + '&area_id=' + key.key
    
        axios.get(url, config)
          .then((response) => {
            if (response.data.ResponseCode === '200') {
                this.setState({ districtList: response.data.ResponseData })
            } else {
              message.error(response.data.ResponseDesc)
            }
          })
          .catch((err) => {
              console.log(err)
          })
    }

    handleProvince(e, key){
        this.setState({
          province_name : e,
          province_id: key.key
        })
        
        let { api_url, config } = this.state
        let url = api_url + '/api/area/?page=all&size=0&province_id=' + key.key
    
        axios.get(url, config)
          .then((response) => {
    
              if (response.data.ResponseCode === '200') {
                  this.setState({ areaList: response.data.ResponseData })
              } else {
                message.error(response.data.ResponseDesc)
              }
          })
          .catch((err) => {
              console.log(err)
          })
    
        
    }

    handleDistrict(e, key){
        this.setState({
          upline: '',
          district_id: key.key,
          district_name: e
        }, () => {
          this.handleUplineList()
        })
    }

    handleUplineList() {
        let { api_url, config, network, area_id, district_id } = this.state
        if (network === '' || area_id === '' ) {
          message.info('Select Network and Area value to get the Upline list')
        } else {
            let url = ''
            if (district_id) {
                url = api_url + '/api/users/uplines?area=' + area_id + '&network=' + network  + '&district_id=' + district_id  
            } else{
                url = api_url + '/api/users/uplines?area=' + area_id + '&network=' + network
            }
            let dataUpline = [];
            axios.get(url, config)
            .then((response) => {
                if (response.data.ResponseCode === '200') {
                    
                    if (this.state.uplineList[0]) {
                        dataUpline.push(this.state.uplineList[0])
                    }
                    
                    response.data.ResponseData.forEach(element => {
                        dataUpline.push(element)
                    });
                    
                    this.setState({ uplineList: dataUpline })
                } else {
                    if (this.state.uplineList[0]) {
                        dataUpline.push(this.state.uplineList[0])
                        this.setState({ uplineList: dataUpline })
                    }else{
                        this.setState({ uplineList: [] }, () => {
                            message.info('No Upline List on selected values. Choose (None) to create Master Agent.')
                        })
                    }
                    
                }
            })
            .catch((err) => {
                console.log(err)
            })
        }
    }

    handleUpline(e, key){    
        this.setState({
          upline: key.key,
          upline_name: e
        })
      }

    validateForm() {
        return this.state.network === "" || this.state.area === "" || this.state.upline === "" || this.state.dataImport.data === undefined
    }

    handleUpload() {
        let formFulfillValidate = this.validateForm() === true

        if (formFulfillValidate) {
            alert({
                type: 'error',
                title: 'Please fill all the options & the import file'
            })
        } else {
            axios.post(this.state.api_url + '/api/users/bulk_insert', this.state.dataImport)
            .then((response) => {
                if (response.data.ResponseCode === '22') {
                    alert({
                        title: 'Duplicate Username Found',
                        text: response.data.ResponseData,
                        type: 'warning',
                        confirmButtonText: 'Close'
                    })
                } else if (response.data.ResponseCode === '00') {
                    alert('Success', 'Import File Successfull', 'success')
                    
                    this.setState({
                        uploadStatus: 'No File Choosen',
                        network: '',
                        area: '',
                        upline: ''
                    }, function () {
                        this.goBack()
                    })
                }
            })
            .catch((err) => {
                console.log(err)
                alert('Import File Failed', 'error')
            })
        }
    }

    importData(files) {
        let reader = new window.FileReader()
        let bulkInsertData
        let network = this.state.network
        let area = this.state.area_id
        let district_id = this.state.district_id
        let upline = this.state.upline

        reader.onload = (e) => {
            bulkInsertData = readCSV(reader.result)

            if (bulkInsertData.error === true) {
                alert('Data error', 'Field username, noktp, npwp, dan rekening_bank wajib diisi dan hanya dengan ANGKA!', 'error')
                console.log('field validation error : ', bulkInsertData)
            } else {
                bulkInsertData.network = network
                bulkInsertData.area = area
                bulkInsertData.district_id = district_id
                bulkInsertData.upline = upline
                bulkInsertData.role = this.state.role

                this.setState({
                    dataImport : bulkInsertData,
                    uploadStatus: files.fileList[0].name,
                    disableUpload: false
                }, function () {
                    console.log('Data to be imported : ', this.state.dataImport)
                })
            }
        }
        
        reader.readAsText(files.fileList[0])
    }

    goBack() {
        this.props.history.push({
            pathname: this.state.parentUrl
        })
    }

    render() {
        const formItemLayout = {
            labelCol: {
              xs: { span: 24 },
              sm: { span: 4 },
            },
            wrapperCol: {
              xs: { span: 24 },
              sm: { span: 8 },
            },
        }

        let networkList = this.state.networkList
        let areaList = this.state.areaList
        let uplineList = this.state.uplineList
        var provinces = this.state.provinceList
        var districts = this.state.districtList

        if (this.state.isAuthorized) {
            return (
                <React.Fragment>
                    <Row type="flex" justify="end" style={{ marginBottom : "30px" }}>
                        <Col>
                            <Button 
                                className='base_button primary'
                                onClick={ this.goBack }
                            >
                                Back
                            </Button>
                        </Col>
                    </Row>

                    <Row>
                        <Col>
                            <Form onSubmit={ this.handleSubmit }>
                                <FormItem { ...formItemLayout } label="Role">
                                    <Select  showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                                            placeholder="Role" 
                                            value={ this.state.roleName } 
                                            defaultValue={ this.state.roleName } 
                                            disabled
                                    >
                                    </Select>
                                </FormItem>

                                <FormItem { ...formItemLayout } label="Network">
                                    <Select  showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                                            placeholder="Network" 
                                            value={ this.state.network } 
                                            defaultValue={ this.state.network }
                                            disabled={ this.state.disableNetworkSelect }
                                            onChange={ this.handleNetwork }
                                    >

                                    {
                                        Object.keys(networkList).map((item) => {
                                            return (
                                                <Option key={ networkList[item].id }>
                                                    { networkList[item].network }
                                                </Option>
                                            )
                                        })
                                    }

                                    </Select>
                                </FormItem>

                                <FormItem { ...formItemLayout } label="Province">
                                    <Select showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                                            placeholder="Province" 
                                            value={ this.state.province_name } 
                                            defaultValue={ this.state.province_name }
                                            onChange={this.handleProvince.bind(this)}
                                    >

                                    {
                                        Object.keys(provinces).map((item) => {
                                            return (
                                                <Option key={ provinces[item].id } value={provinces[item].province_name}>
                                                    { provinces[item].province_name }
                                                </Option>
                                            )
                                        })
                                    }

                                    </Select>
                                </FormItem>

                                <FormItem { ...formItemLayout } label="City">
                                    <Select showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                                            placeholder="City" 
                                            value={ this.state.area } 
                                            defaultValue={ this.state.area }
                                            onChange={this.handleArea.bind(this)}
                                    >

                                    {
                                        Object.keys(areaList).map((item) => {
                                            return (
                                                <Option key={ areaList[item].id } value={areaList[item].area}>
                                                    { areaList[item].area }
                                                </Option>
                                            )
                                        })
                                    }

                                    </Select>
                                </FormItem>

                                <FormItem { ...formItemLayout } label="District">
                                    <Select  showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                                            placeholder="District" 
                                            value={ this.state.district_name } 
                                            defaultValue={ this.state.district_name }
                                            onChange={this.handleDistrict.bind(this)}
                                    >

                                    {
                                        Object.keys(districts).map((item) => {
                                            return (
                                                <Option key={ districts[item].id } value={districts[item].district_name}>
                                                    { districts[item].district_name }
                                                </Option>
                                            )
                                        })
                                    }

                                    </Select>
                                </FormItem>

                                <FormItem { ...formItemLayout } label="Upline">
                                    <Select  showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                                            placeholder="Upline" 
                                            value={ this.state.upline_name } 
                                            defaultValue={ this.state.upline_name }
                                            onChange={this.handleUpline}
                                    >
                                    <Option key="0">None</Option>
                                    {
                                        Object.keys(uplineList).map((item) => {
                                            return (
                                                <Option key={ uplineList[item].id } value={uplineList[item].name}>
                                                    { uplineList[item].name }
                                                </Option>
                                            )
                                        })
                                    }

                                    </Select>
                                </FormItem>
                                
                                <div>
                                    <p style={{ marginLeft: '25%' }}> { this.state.uploadStatus } </p>
                                    <ReactFileReader handleFiles={ this.importData } fileTypes={[".csv"]} base64={true}>
                                        <Button type="secondary" style={{ marginLeft: '25%', marginBottom: '10px', width: '100px'}}>
                                                Open File
                                        </Button>
                                    </ReactFileReader>
                                    <Button disabled={ this.state.disableUpload } onClick={ this.handleUpload } type="primary" style={{ marginTop: '10px',marginLeft: '25%', marginBottom: '5px', width: '100px'}}>
                                        <Icon type="upload" />
                                            Upload
                                    </Button>
                                </div>
                            </Form>

                        </Col>
                    </Row>
                </React.Fragment>
            )
        } else {
            return (
                'You are not authorized to access this page'
            )
        }
    }
}

function mapStateToProps(state) {
    const { user, mode } = state

    return {
        user,
        mode
    }
}

export default withRouter(connect(mapStateToProps, null)(ImportFile))