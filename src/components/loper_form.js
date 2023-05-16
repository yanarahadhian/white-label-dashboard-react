import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Input, Form, message, Row, Col, Select, Divider, Upload, Icon, Modal, Tooltip, Popover } from "antd";
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import { FormMode, LogUser } from '../actions';
import moment from "moment";
import axios from "axios";
import { config } from "../config";
const FormItem = Form.Item;
const Option = Select.Option;

class LoperForm extends Component {
  constructor(props){
    super(props)

    this.state = {
      isAuthorized: false,
      username: '',
      name: '',
      email: '',
      phone_number: '',
      alamat: '',
      noktp: '',
      npwp: '',
      siup: '',
      rekening_bank: '',
      nama_bank: '',
      bankList: {},
      network: (this.props.user.network !== 0) ? (this.props.user.network) : (''),
      network_name: '',
      networkList: {},
      province_id: '',
      province_name: '',
      provinceList: {},
      area_id: '',
      area: '',
      areaList: {},
      district_id: '',
      district_name: '',
      districtList: {},
      upline: '',
      upline_name: '',
      uplineList: {},
      role: 4,
      profile_img: '',
      status: 'inactive',
      status_transaction: 'inactive',
      maxUploadSize : 1000000,
      previewAssetVisible : false,
      previewUrl : '',
      profileUploadFile : '',
      profileUploading : false,
      appProfile : '',
      appProfileTitle : 'No File Uploaded',
      returnPage : false,
      buttonDisabled : false,
      dataVa: [],
      disabled: (this.props.location.pathname.includes("edit")) ? true : false,
      api_url: config().api_url,
      config: { headers: {'token': localStorage.getItem('token')}},
      asset_url: config().asset_url.aws
    }

    this.handleNetwork = this.handleNetwork.bind(this)
    this.handleProvince = this.handleProvince.bind(this)
    this.handleArea = this.handleArea.bind(this)
    this.handleUplineList = this.handleUplineList.bind(this)
    this.handleUpline = this.handleUpline.bind(this)

    // --- Upload Asset ---
    this.handlePreview = this.handlePreview.bind(this)
    this.handlePreviewClose = this.handlePreviewClose.bind(this)
    this.handleUploadAsset = this.handleUploadAsset.bind(this)
    this.handleUploadProfile = this.handleUploadProfile.bind(this)
    this.validateFile = this.validateFile.bind(this)
    this.resetAsset = this.resetAsset.bind(this)

    // --- Create VA --- 
    this.handleCreateVA = this.handleCreateVA.bind(this)
  }

  validateForm() {
    const { username, name, email, phone_number, network, province_id, area_id, upline } = this.state
    const mailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    const mailValidate = email.constructor === Object && mailRegex.test(email.value)
    const nameValidate = name.constructor === Object && name.value

    if (username && email && phone_number && network && province_id && area_id && upline && mailValidate && nameValidate) {
      return true
    } else {
      return false
    }
  }

  componentWillMount() {
    let rights = this.props.user.rights
    let page_url = this.props.match.url
    let authorize = false

    for (let item in rights) {
      let isInclude = page_url.includes(rights[item].page_url)
      
      if (isInclude) {
        let isModeAdd = page_url.includes("/new")
        let isModeUpdate = page_url.includes("/edit")

        if (isModeAdd && rights[item].create === 1) {
          authorize = true
        } else if (isModeUpdate && rights[item].update === 1) {
          authorize = true
        }

        this.setState({
          isAuthorized: authorize
        })
      }
    } 
  }

  componentDidMount() {
    let { isAuthorized, api_url, config } = this.state

    if (isAuthorized) {
      let userId = this.props.match.params.id

      if (userId) {
        let url = api_url + '/api/users/?id=' + userId

        axios.get(url, config)
        .then((response) => {
            console.log('Get User : ', response.data)

            this.setState({
              username: response.data.ResponseData[0].username,
              name: { value : response.data.ResponseData[0].name },
              phone_number: response.data.ResponseData[0].phone_number,
              alamat: response.data.ResponseData[0].alamat,
              email: { value : response.data.ResponseData[0].email },
              area_id: response.data.ResponseData[0].area,
              district_id: response.data.ResponseData[0].district_id,
              appProfile: response.data.ResponseData[0].profile_img,
              appProfileTitle : (response.data.ResponseData[0].profile_img) ? (this.assetFormatter(response.data.ResponseData[0].profile_img)) : ('No File Uploaded'),
              noktp: response.data.ResponseData[0].noktp,
              npwp: response.data.ResponseData[0].npwp,
              siup: response.data.ResponseData[0].siup,
              status: response.data.ResponseData[0].status,
              nama_bank: response.data.ResponseData[0].nama_bank,
              rekening_bank: response.data.ResponseData[0].rekening_bank,
              network: response.data.ResponseData[0].network,
              role : response.data.ResponseData[0].role,
              upline : response.data.ResponseData[0].upline,
              status_transaction: (response.data.ResponseData[0].status_transaction) ? response.data.ResponseData[0].status_transaction : 'inactive'
            }, () => {
              let area_id = response.data.ResponseData[0].area
              
              axios.get(api_url + '/api/area/?id='+ area_id, config)
              .then((response) => {
                  this.setState({
                    area: response.data.ResponseData[0].area,
                    province_id: response.data.ResponseData[0].province_id
                  }, () => {
                    let province_id = response.data.ResponseData[0].province_id

                    axios.get(this.state.api_url+'/api/province/?id='+ province_id, config)
                    .then((response) => {
                        this.setState({
                          province_name: response.data.ResponseData[0].province_name
                        }, () => {
                          let url = api_url + '/api/district/?province_id=' + province_id + '&area_id=' + area_id
                          axios.get(url, config)
                          .then((response) => {
                            if (response.data.ResponseCode === '200') {
                                this.setState({ districtList: response.data.ResponseData })
                            } else {
                              message.error(response.data.ResponseDesc)
                            }
                          }, (err) => {
                            console.error(err)
                          }) 
                        })
                    }, (err) => {
                      console.error(err)
                    }) 
                  })
              }, (err) => {
                console.error(err)
              })

              //GET UPLINE VALUE
              let userId = response.data.ResponseData[0].upline
              axios.get(api_url + '/api/users/?id=' + userId, config)
              .then((response) => {
                if (response.data.ResponseCode === "200") {
                  this.setState({
                    upline_name: response.data.ResponseData[0].name
                  })
                }
              })

              // GET VA
              let user_id = response.data.ResponseData[0].username
              axios.get(this.state.api_url+'/api/va/?user_id='+ user_id, config)
              .then((response) => {
                  this.setState({
                    dataVa: response.data.ResponseData
                  })
              }, (err) => {
                console.error(err)
              })
              
              // GET UPLINES LIST
               this.handleUplineList()
              
              // GET DISTRICT
              let district_id = response.data.ResponseData[0].district_id
              axios.get(api_url + '/api/district/?id=' + district_id, config)
              .then((response) => {
                if (response.data.ResponseCode === "200") {
                  this.setState({
                    district_name : response.data.ResponseData[0].district_name
                  })
                }else {
                  this.setState({
                    district_name : ''
                  })
                }
                
              }, (err) => {
                console.error(err)
              })

              // GET NETWORK NAME
              let network = response.data.ResponseData[0].network
              axios.get(api_url + '/api/network/?id=' + network, config)
              .then((response) => {
                if (response.data.ResponseCode === "200") {
                  this.setState({
                    network_name : response.data.ResponseData[0].network
                  })
                }else {
                  this.setState({
                    network_name : ''
                  })
                }
                
              }, (err) => {
                console.error(err)
              })
              
            })
        }, (err) => {
          console.error(err)
        })  
      }else{
        // GET NETWORK VALUE

        if (this.props.user.network !== 0){
          axios.get(this.state.api_url+'/api/network/?id=' + this.state.network , config)
          .then((response) => {
              this.setState({
                network_name: response.data.ResponseData[0].network,
              })
          }, (err) => {
            console.error(err)
          }) 
        }

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
                  upline: 0,
                  upline_name: 'None'
                })
              }
            })
          }, (err) => {
            console.error(err)
          })
        }

      }

      // GET NETWORK LIST
      axios.get(this.state.api_url+'/api/network/?page=all&size=0', config)
        .then((response) => {
            this.setState({
              networkList: response.data.ResponseData
            })
        }, (err) => {
          console.error(err)
        })

      // GET PROVINCE LIST
      axios.get(api_url + '/api/province/?page=all&size=0', config)
        .then((response) => {
            this.setState({
              provinceList: response.data.ResponseData
            })
        }, (err) => {
          console.error(err)
        })

      // GET AREAS LIST
      axios.get(api_url + '/api/area/?page=all&size=0', config)
        .then((response) => {
            this.setState({
              areaList: response.data.ResponseData
            })
        }, (err) => {
          console.error(err)
        })

      // GET BANK LIST
      axios.get(api_url + '/api/bank', config)
      .then((response) => {
        this.setState({
          bankList : response.data.ResponseData
        })
      }, (err) => {
        console.error(err)
      })
      
    }
  }

  async handleSubmit (e) {
    e.preventDefault()

    let validate = await this.validateForm()

    if (validate) {
      this.setState({ buttonDisabled : true })
      
      let { api_url, config, returnPage } = this.state
      let url = api_url + '/api/users/agent_loper'

      let payload = {
        username: this.state.username,
        name: this.state.name.value,
        phone_number: this.state.phone_number,
        alamat: this.state.alamat,
        email: this.state.email.value,
        area: this.state.area_id,
        district_id: this.state.district_id,
        profile_img: this.state.appProfile,
        noktp: this.state.noktp,
        npwp: this.state.npwp,
        siup: this.state.siup,
        status: this.state.status,
        nama_bank: this.state.nama_bank,
        rekening_bank: this.state.rekening_bank,
        network: this.state.network,
        role : this.state.role,
        upline: this.state.upline,
        status_transaction: this.state.status_transaction
      }
      
      try {
        if (this.props.match.params.id) {
          // EDIT LOPER USER

          axios.put(url, payload, config)
          .then((response) => {
            console.log('Edit Loper Response : ', response.data)
            
            if (response.data.ResponseCode === "200") {
              message.success(response.data.ResponseDesc)
              
              if (returnPage) {
                this.props.history.push({ pathname: '/loper_account' })
              }
            } else { 
              if (response.data.status === '401') {
                this.setState({
                  isAuthorized : false,
                  buttonDisabled : true
                }, () => {
                  message.error('Login Authentication Expired. Please Login Again!')
                })
              } else {
                let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : ""
                message.error(msg)

                this.setState({ buttonDisabled : false })
              }
            }
          }, (err) => {
            console.log(err)
            message.error(err.data.ResponseDesc)
            this.setState({ buttonDisabled : false })
          })  
        } else {
          // CREATE NEW LOPER

          axios.post(url, payload, config)
          .then((response) => {
            console.log('Add New Loper Response : ', response.data)
            
            if (response.data.ResponseCode === "200") {
              message.success(response.data.ResponseDesc)

              if (returnPage) {
                this.props.history.push({ pathname: '/loper_account' })
              }
            } else {
              if (response.data.status === '401') {
                this.setState({ buttonDisabled : true }, () => {
                  message.error('Login Authentication Expired. Please Login Again!')
                })
              } else if (response.data.ResponseCode === '501') {
                message.success('Create Loper Success')
                message.error(response.data.ResponseDesc)

                this.props.history.push({ pathname : '/loper_account' })
              } else {
                let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : ""
                message.error(msg)
                
                this.setState({ buttonDisabled : false })
              }
            }
          })
          .catch((err) => {
            console.log(err)
            message.error(err.data.ResponseDesc)

            this.setState({ buttonDisabled : false })
          })
        }
      } catch (e) {
        console.log(e)
        message.error(e.data.ResponseDesc)

        this.setState({ buttonDisabled : false })
      }
    } else {
      message.error("Please fill all required fields")
      return false
    }
  }

  handleNetwork(e, key){
    let { api_url, config, uplineList } = this.state
    let network = key.key

    axios.get(api_url + '/api/network/?id='+ network, config)
    .then((response) => {
      this.setState({
        network: response.data.ResponseData[0].id,
        network_name: response.data.ResponseData[0].network
      }, () => {
        this.handleUplineList()

        if (response.data.ResponseData[0].upline !== null){
          let upline = response.data.ResponseData[0].upline
          axios.get(api_url + '/api/users/?id=' + upline, config)
          .then((response) => {
            if (response.data.ResponseCode === "200") {
              const dataUpline = [];
              if (response.data.ResponseData[0]) {
                dataUpline.push(response.data.ResponseData[0])
              }
              if (uplineList.length > 0) {
                uplineList.forEach(element => {
                  dataUpline.push(element)
                });
              }
              
              
              this.setState({ uplineList: dataUpline })
              
            }
          })

        }
      })
    })
  }

  handleArea(e, key){
    this.setState({
      area_id: key.key,
      area: e,
      district_name : '',
      district_id : '',
      districtList : [],
      upline : '',
      upline_name : '',
      uplineList : []
    }, () => {
      this.handleUplineList()
    })

    let { api_url, config, province_id } = this.state
    let url = api_url + '/api/district/?page=all&province_id=' + province_id + '&area_id=' + key.key

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

  handleDistrict(e, key){
    this.setState({
      upline: '',
      district_id: key.key,
      district_name: e
    }, () => {
      this.handleUplineList()
    })
  }

  handleProvince(e, key){
    this.setState({
      province_name : e,
      province_id: key.key,
      area : '',
      area_id : '',
      district_name : '',
      district_id : '',
      districtList : [],
      upline : '',
      upline_name : '',
      uplineList : []
    })
    
    let { api_url, config } = this.state
    let url = api_url + '/api/area/?page=all&province_id=' + key.key

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
        axios.get(url, config)
        .then((response) => {
            if (response.data.ResponseCode === '200') {
                this.setState({ uplineList: response.data.ResponseData })
            } else {
              this.setState({ uplineList: [] }, () => {
                message.info('No Upline List on selected values. Choose (None) to create Master Loper.')
              }) 
            }
        })
        .catch((err) => {
            console.log(err)
        })
    }
  }

  handleUsername(e){
    let value = (e.target.validity.valid) ? e.target.value : this.state.username;
    this.setState({
      phone_number : value,
      username: value
    })
  }

  handleEmail(e){
    this.setState({
      email : {
        ...validateMail(e.target.value),
        value : e.target.value
      }
    })
  }

  handlePhoneNo(e){
    let value = (e.target.validity.valid) ? e.target.value : this.state.phone_number;
    if (this.props.mode === "edit"){
      this.setState({
        phone_number: value
      })
    }else{
      this.setState({
        username : value,
        phone_number: value
      })
    }
    
  }

  handleNoKTP(e){
    let noktp = (e.target.validity.valid) ? e.target.value : this.state.noktp;
    this.setState({
      noktp: noktp
    })
  }

  handleNPWP(e){
    let npwp = (e.target.validity.valid) ? e.target.value : this.state.npwp;
    this.setState({
      npwp: npwp
    })
  }

  handleRekeningBank(e){
    let rekening_bank = (e.target.validity.valid) ? e.target.value : this.state.rekening_bank;
    this.setState({
      rekening_bank: rekening_bank
    })
  }

  handleUpline(e, key){    
    this.setState({
      upline: key.key,
      upline_name: e
    })
  }

  
  // Upload Assets

  resetAsset(asset) {
    let { asset_url, type } = asset
    let { api_url, config, disabled } = this.state
    let url = api_url + '/api/asset/?asset_url=' + asset_url

    if (!disabled) {
      // request to url & retrieve response
      axios.delete(url, config)
        .then((response) => { console.log(response) })
        .catch((err) => { console.error(err) })

      this.setState(function(state) {
        return {
          appProfile : (type === 'appProfile') ? ('') : (state.appProfile),
          appProfileTitle : (type === 'appProfile') ? ('No File Uploaded') : ((state.appProfile) ? (this.assetFormatter(state.appProfile)) : ('No File Uploaded')),
          profileUploadFile : (type === 'appProfile') ? ('') : (state.profileUploadFile)
        }
      })
    }
  }

  handleUploadAsset(formData) {
    let { api_url } = this.state

    const url = api_url + '/api/asset/upload'

    return new Promise((resolve, reject) => {
      axios.post(url, formData, { headers : { 'Content-Type': 'multipart/form-data', 'token' : this.state.config.headers.token } })
      .then((response) => {
        if (response.data.ResponseCode === "200") {
          resolve(response)
        } else {
          if (response.data.status === '401') {
            this.setState({ isAuthorized : false }, () => {
              message.error('Login Authentication Expired. Please Login Again!')
            })
          } else {
            this.setState({
              profileUploading: false
            }, () => {
              message.error('Upload Failed!')
            })
          }
        }
      })
      .catch((error) => {
        this.setState({
          profileUploading: false
        }, () => {
          message.error('Upload Failed!')
          console.log(error)
          reject(error)
        })
      })
    })
  }

  // Function to retrieve the asset url and returns the filename 
  assetFormatter(asset) {

    let flag = "-"
    let startIndex = asset.lastIndexOf(flag) + 1
    let fileName = asset.slice(startIndex)

    return fileName
  }

  handlePreview(assetUrl) {
    this.setState({
      previewUrl : assetUrl,
      previewAssetVisible : true
    })
  }

  handlePreviewClose() {
    this.setState({ previewAssetVisible : false })
  }

  validateFile(file) {
    let { maxUploadSize } = this.state
    let validate = false
    let pngType = file.name.includes("png")
    let jpgType = file.name.includes("jpg")
    let jpegType = file.name.includes("jpeg")

    if (pngType || jpgType || jpegType) {
      validate = true
    } else {
      message.info("File type is invalid. Only PNG/ JPEG/ JPG types are allowed")
      validate = false
      return validate
    }

    if (file.size > maxUploadSize) {
      message.info("File size is over limit. Max upload size 1 Mb (Megabytes)")
      validate = false
    } else if (file.name.includes("-")) {
      message.info("File name can not contain special character dash (-)")
      validate = false
    } else {
      validate = true
    }

    return validate
  }

  async handleUploadProfile(event) {
    event.preventDefault()

    const formData = new FormData()

    if (this.state.profileUploadFile) {
      await formData.append('file', this.state.profileUploadFile)
      this.setState({ profileUploading : true })

      let response = await this.handleUploadAsset(formData)

      this.setState({
        appProfile : response.data.ResponseData.Location,
        profileUploading : false
      }, () => {
        message.success('Upload Profile Image successful. Save to create impact.')
      })
    } else {
      message.error('No Image File Choosen!')
    }
  }

  // CREATE VA

  handleCreateVA() {
    let { api_url, config } = this.state
    let url = api_url + '/api/va/'

    this.setState({ isLoading: true })

    let payload = {
      Username: this.state.username,
      BillingType: 'o',
      TrxAmount: '0'
    }

    axios.post(url, payload, config)
    .then((response) => {
        if (response.data.ResponseCode === '200' || response.data.ResponseCode === 0) {
          message.success(response.data.ResponseDesc)
          
        } else {
          message.error(response.data.ResponseDesc)
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
        }
  
        this.setState({ isLoading: false })
    }, (err) => {
      console.error(err)
      message.error(err.data.ResponseDesc)
      this.setState({ isLoading: false })
      return false
    })
  }
  
  _dateFormat(field){ return moment(field, "YYYY-MM-DD HH:mm:ss").format("DD/MM/YYYY HH:mm:ss") }

  render() {
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 10 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 12 },
      },
    }

    var uplines = this.state.uplineList
    var provinces = this.state.provinceList
    var areas = this.state.areaList
    var districts = this.state.districtList
    var networks = this.state.networkList
    var banks = this.state.bankList

    // ------ Assets Props -----
    
    const tooltip = config().asset_url.tooltip
    const { isAuthorized, profileUploadFile, profileUploading } = this.state
    const profilePopover = ( <span> Profile image for Avatar User </span> )
    const uploadProps = { multiple : false, showUploadList : false }

    const uploadProfileProps = {
      ...uploadProps,
      beforeUpload : async (file) => {

        let validate = await this.validateFile(file)

        if (validate) {
          this.setState(state => ({ 
            profileUploadFile: file,
            appProfileTitle : file.name
          }))
        }
      },
      profileUploadFile
    }

    let header;

    if (this.props.mode === "edit") {
      header = <Row gutter={12}>
      <Col span={8} style={{ padding: "0 0 0 6px" }}>
        <h4>Virtual Account</h4>
      </Col>
    </Row>
    } else {
      header = '';
    }

    const dataVa = this.state.dataVa
    let vaTabel;
    if (typeof dataVa !== 'undefined' && dataVa.length > 0) {
      vaTabel = <Col>
        <BootstrapTable data={this.state.dataVa}>
          <TableHeaderColumn dataField="status" dataAlign="center" width='100px'>Status</TableHeaderColumn>
          <TableHeaderColumn dataField="virtual_account_id" dataAlign="center" width='100px' >Account Number</TableHeaderColumn>
          <TableHeaderColumn dataField="bank" isKey dataAlign="center" width='100px' >Bank</TableHeaderColumn>
          <TableHeaderColumn dataField="created_at" dataAlign="center" width='100px' dataFormat = {this._dateFormat.bind(this)}>Created At</TableHeaderColumn>
          <TableHeaderColumn dataField="expired_at" dataAlign="center" width='150px' dataFormat = {this._dateFormat.bind(this)}>Expired At</TableHeaderColumn>
        </BootstrapTable>
      </Col>
    } else {
      vaTabel = <Button 
      className='base_button primary'
      type="primary"
      style={{ marginLeft: '5px' }}
      onClick={()=>this.handleCreateVA()}>
      Generate VA
    </Button>
    }

    if(isAuthorized){
      return (
        <Form className="form_view" onSubmit={this.handleSubmit.bind(this)}>    
          <Row type="flex" justify="end" style={{ marginBottom : '45px' }}>
            <Col>
              <Button 
                className='base_button primary'
                type="primary" 
                htmlType="submit" 
                style={{ marginLeft: '5px' }}
                onClick={ () => {
                  this.props.history.push({
                    pathname : '/loper_account'
                  })
                } }
                >
                Back
              </Button>
            </Col>

            <Col>
              <Button 
                className={ (this.validateForm()) ? ('base_button primary') : ('button_disabled') }
                type="primary" 
                htmlType="submit" 
                disabled={ !this.validateForm() }
                style={{ marginLeft: '5px' }}
                onClick={ () => this.setState({ returnPage : true }) }
                >
                Save & Back
              </Button>
            </Col>

            <Col>
              <Button 
                className={ (this.validateForm()) ? ('base_button primary') : ('button_disabled') }
                type="primary" 
                htmlType="submit" 
                disabled={ !this.validateForm() }
                style={{ marginLeft: '5px' }}
              >
                Save
              </Button>
            </Col>
          </Row>
          
          <Row gutter={12}>
              <Col span={8} style={{ padding: "0 0 0 6px" }}>
                <FormItem {...formItemLayout} label="Username" required={true}>
                    <Input pattern="[0-9]*" placeholder="Username" value={this.state.username} disabled={this.state.disabled}
                      onChange={this.handleUsername.bind(this)}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Name" required={true} help={ this.state.name.errorMsg } validateStatus={ this.state.name.validateStatus } >
                    <Input placeholder="Name" value={ this.state.name.value } 
                      onChange={e => this.setState({ name: { ...validateAllString(e.target.value), value : e.target.value } })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Email" required={true} help={ this.state.email.errorMsg } validateStatus={ this.state.email.validateStatus } >
                    <Input placeholder="Email" value={ this.state.email.value } disabled={this.state.disabled}
                      onChange={ this.handleEmail.bind(this) }
                      />
                </FormItem>
                <FormItem {...formItemLayout} label="Phone Number" required={true}>
                    <Input pattern="[0-9]*" placeholder="Phone Number" value={this.state.phone_number} 
                      onChange={this.handlePhoneNo.bind(this)}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Address">
                    <Input placeholder="Address" value={this.state.alamat} 
                      onChange={e => this.setState({ alamat: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Province" required={true}>
                    <Select showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                      placeholder="Province" value={this.state.province_name} defaultValue={this.state.province_name}
                      onChange={this.handleProvince.bind(this)}
                    >
                    {
                      Object.keys(provinces).map((item) => {
                        return (<Option key={provinces[item].id} value={provinces[item].province_name}>{provinces[item].province_name}</Option>)
                      })
                    }
                    </Select>
                </FormItem>
                <FormItem {...formItemLayout} label="City" required={true}>
                    <Select showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                      placeholder="City" value={this.state.area} defaultValue={this.state.area}
                      onChange={this.handleArea.bind(this)}
                    >
                    {
                      Object.keys(areas).map((item) => {
                        return (<Option key={areas[item].id} value={areas[item].area}>{areas[item].area}</Option>)
                      })
                    }
                    </Select>
                </FormItem>
                <FormItem {...formItemLayout} label="District">
                    <Select showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                      placeholder="District" value={this.state.district_name} defaultValue={this.state.district_name}
                      onChange={this.handleDistrict.bind(this)}
                    >
                    {
                      Object.keys(districts).map((item) => {
                        return (<Option key={districts[item].id} value={districts[item].district_name}>{districts[item].district_name}</Option>)
                      })
                    }
                    </Select>
                </FormItem>
              </Col>

              <Col span={8} style={{ padding: "0 0 0 6px" }}>
                <FormItem {...formItemLayout} label="No KTP">
                    <Input pattern="[0-9]*" placeholder="No KTP" value={this.state.noktp}
                    // onChange={e => this.setState({ noktp: e.target.value })}
                      onChange={this.handleNoKTP.bind(this)}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="NPWP">
                    <Input pattern="[0-9]*" placeholder="NPWP" value={this.state.npwp} 
                      onChange={this.handleNPWP.bind(this)}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="SIUP">
                    <Input placeholder="SIUP" value={this.state.siup}
                      onChange={e => this.setState({ siup: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Status">
                    <Select showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                      placeholder="Status" value={this.state.status} 
                      onChange={e => this.setState({ status: e })}
                      disabled={(this.props.mode === "edit") ? false : true}
                      defaultValue={this.state.status} 
                    >
                      <Option key="1" value="active">Active</Option>
                      <Option key="2" value="inactive">Inactive</Option>
                    </Select>
                </FormItem>
              </Col>
          </Row>
          
          <Divider />

          <Row gutter={12}>
            <Col span={8} style={{ padding: "0 0 0 6px" }}>
              <h4>Upload Avatar</h4>
            </Col>
          </Row>
          
          <Row gutter={12} >
            {/* Avatar Container */}
            <Row type="flex" justify="space-around" align="middle" className="Rectangle">
              
              <Col span={4} className="ml-25"> <span> Profile Image </span> </Col>
              
              <Col span={2}><Popover content={ profilePopover } ><img className="icon-tooltip" src={ tooltip } alt="i" /></Popover> </Col>
              
              <Col span={4} />
  
              <Col span={4} className="center">
                { (this.state.appProfile) ? (
                    <Button 
                      onClick={ () => this.handlePreview(this.state.appProfile) }
                      className='choose_button primary'
                      >
                      Preview
                    </Button>
                ) : (
                  (this.state.profileUploadFile) ? (
                    <Button
                      className='choose_button primary'
                      disabled={false}
                      onClick={ this.handleUploadProfile }
                    >
                      { (profileUploading) ? ('Uploading') : ('Upload') }
                    </Button>
                  ) : (
                    <Upload {...uploadProfileProps}>
                      <Button 
                        className="choose_button primary"
                        disabled={this.state.disabled}
                      >
                        <Icon type="upload" /> Select File
                      </Button>
                    </Upload>
                  )
                )}
  
                <Modal 
                  visible={ this.state.previewAssetVisible } 
                  footer={null} 
                  onCancel={ this.handlePreviewClose }
                >
                  <img alt="No File" style={{ width: '100%' }} src={ this.state.previewUrl } ></img>
                </Modal>
              </Col>
              
              <Col span={6} className="center">
                {
                  (this.state.appProfile) ? (
                    <Row span={24} type="flex" justify="space-between" align="middle">
                      <Col span={6} className="center"> <img className="network-asset-avatar" src={ this.state.appProfile } alt=""></img> </Col>
                      <Col span={18}> <span> { this.state.appProfileTitle } </span>  </Col>
                    </Row>
                  ) : (
                    <span> { this.state.appProfileTitle } </span> 
                  )
                }
              </Col>
  
              <Col span={2} className="center"> <a className="icon-a" onClick={ () => this.resetAsset({ asset_url : this.state.appProfile, type : 'appProfile'  }) }><Tooltip title="Delete File"><Icon type="delete" theme="filled" style={{ fontSize: '23px', marginTop : '5px' }} /></Tooltip></a>  </Col>
            
            </Row>
            {/* End of Avatar Container */}
          </Row>
          <Divider />

          <Row gutter={12}>
            <Col span={8} style={{ padding: "0 0 0 6px" }}>
              <h4>Network</h4>
            </Col>
          </Row>

          <Row gutter={12} >
            <Col span={8} style={{ padding: "0 0 0 6px" }}>
              <FormItem {...formItemLayout} label="Network" required={true}>
                  <Select showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0} 
                  placeholder="Network" value={this.state.network_name} defaultValue={this.state.network_name}
                  disabled={( this.props.user.network === 0) ? false : true}
                    onChange={this.handleNetwork}
                  >
                  {
                    Object.keys(networks).map((item) => {
                      return (<Option key={networks[item].id} value={networks[item].network}>{networks[item].network}</Option>)
                    })
                  }
                  </Select>
              </FormItem>
              
              <FormItem {...formItemLayout} label="Upline" required={true}>
                  <Select showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                    placeholder="Upline" value={this.state.upline_name} defaultValue={this.state.upline_name}
                    onChange={this.handleUpline}
                  >
                    <Option key="0">None</Option>
                  {
                    Object.keys(uplines).map((item) => {
                      return (<Option key={uplines[item].id} value={uplines[item].name}>{uplines[item].name}</Option>)
                    })
                  }
                  </Select>
              </FormItem>
              
            </Col>
            <Col span={8} style={{ padding: "0 0 0 6px" }}>
                <FormItem {...formItemLayout} label="Status Transaksi">
                    <Select showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                      placeholder="Status Transaksi" value={this.state.status_transaction} 
                      onChange={e => this.setState({ status_transaction: e })} 
                    >
                      <Option key="1" value="active">Active</Option>
                      <Option key="2" value="inactive">Inactive</Option>
                    </Select>
                </FormItem>
            </Col>
          </Row>
          
          <Divider />

          <Row gutter={12}>
            <Col span={8} style={{ padding: "0 0 0 6px" }}>
              <h4>Branchless Banking</h4>
            </Col>
          </Row>

          <Row gutter={12} >
            <Col span={8} style={{ padding: "0 0 0 6px" }}>
              <FormItem {...formItemLayout} label="Nama Bank">
                  <Select showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                    placeholder="Nama Bank" value={this.state.nama_bank} defaultValue={this.state.nama_bank}
                    onChange={e => this.setState({ nama_bank: e })}
                  >  
                    {
                      Object.keys(banks).map((item) => {
                        return (<Option key={banks[item].id} value={banks[item].name}>{banks[item].name}</Option>)
                      })
                    }
                    </Select>
                </FormItem>
                <FormItem {...formItemLayout} label="No. Rekening Bank">
                    <Input pattern="[0-9]*" placeholder="Rekening Bank" value={this.state.rekening_bank} 
                      onChange={this.handleRekeningBank.bind(this)}
                    />
                </FormItem>
            </Col>
          </Row>
          <Divider />
          {header}
          { (this.props.mode === "edit") ? (
            
            <Row gutter={12}>
              {vaTabel}
            </Row>

          )  : (
            <Row type="flex" justify="end" style={{ marginBottom : '45px' }}>
              
            </Row>
          )}
        </Form>
        
        
      )
    }
    else{
      return ('You are not authorized to access this page')
    }
  }
}

function validateAllString(characters) {
  // Validate if given characters contains numeric, symbols and special characters 
  const reg = RegExp(/[0-9!@#$%^&*()-='_+/;,.?":{\\~`}[|<\]>]/)
  const isContains = reg.test(characters)

  if (isContains) {
    return {
      validateStatus: 'error',
      errorMsg: 'Alphabetic characters only'
    }
  } else {
    return {
      validateStatus: 'success',
      errorMsg: null
    }
  }
}

function validateMail(characters) {
  // Validate if given characters contains numeric, symbols and special characters 
  const reg = RegExp(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
  const isMailFormatCorrect = reg.test(characters)

  if (isMailFormatCorrect) {
    return {
      validateStatus: 'success',
      errorMsg: null
    }
  } else {
    return {
      validateStatus: 'error',
      errorMsg: 'Incorrect email format'
    }
  }
}

function mapStateToProps(state) {
    const { user, mode } = state

    return { user, mode }
}

export default withRouter(connect(mapStateToProps, { LogUser, FormMode })(LoperForm))
