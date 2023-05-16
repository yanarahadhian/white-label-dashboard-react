import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Input, Form, message, Row, Col, Select, Divider, Upload, Icon, Modal, Tooltip, Popover } from "antd";
import { FormMode, LogUser } from '../actions';
import axios from "axios";
import { config } from "../config";
const FormItem = Form.Item;
const Option = Select.Option;

class UsersForm extends Component {
  constructor(props){
    super(props)

    this.state = {
      isAuthorized: false,
      username: '',
      name: '',
      email: '',
      phone_number: '',
      alamat : '',
      status: 'Inactive',
      province_id: '',
      province_name: '',
      provinceList: {},
      area_id: '',
      area: '',
      areaList: {},
      district_id: '',
      district_name: '',
      districtList: {},
      network: (this.props.user.network !== 0) ? (this.props.user.network.toString()) : (''),
      networkName : '',
      networkList: [],
      role: '',
      roleName : '',
      roleList: {},
      profile_img: '',
      disabled: (this.props.location.pathname.includes("view")) ? true : false,
      mandatoryDisabled : (this.props.location.pathname.includes("new")) ? false : true,
      statusDisabled : (this.props.location.pathname.includes("edit")) ? false : true,
      buttonDisabled : false,
      api_url: config().api_url,
      config: { headers: {'token': localStorage.getItem('token')}},
      maxUploadSize: 1000000,
      previewAssetVisible: false,
      previewUrl: '',
      profileUploadFile: '',
      profileUploading: false,
      appProfile: '',
      appProfileTitle: 'No File Uploaded',
    }

    this.fetchRoles = this.fetchRoles.bind(this)
    this.validateForm = this.validateForm.bind(this)
    this.handleProvince = this.handleProvince.bind(this)
    this.handleArea = this.handleArea.bind(this)

    // --- Upload Asset ---
    this.handlePreview = this.handlePreview.bind(this)
    this.handlePreviewClose = this.handlePreviewClose.bind(this)
    this.handleUploadAsset = this.handleUploadAsset.bind(this)
    this.handleUploadProfile = this.handleUploadProfile.bind(this)
    this.validateFile = this.validateFile.bind(this)
    this.resetAsset = this.resetAsset.bind(this)

  }

  validateForm() {
    return this.state.username.length > 0 && this.state.email.length > 0 && this.state.phone_number.length > 0 && this.state.role.length > 0 && this.state.area.length > 0 && this.state.network.length > 0;
  }

  componentWillMount(){
    let rights = this.props.user.rights
    let page_url = this.props.location.pathname

    let authorize = false

    for (let item in rights) {
      let isInclude = page_url.includes(rights[item].page_url)

      if (isInclude) {
        let isModeAdd = page_url.includes("/new")
        let isModeUpdate = page_url.includes("/edit")
        let isModeRead = page_url.includes("/view")

        if (isModeAdd && rights[item].create === 1) {
          authorize = true
        } else if (isModeUpdate && rights[item].update === 1) {
          authorize = true
        } else if (isModeRead && rights[item].read === 1) {
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
    let id = this.props.match.params.id
    let url = api_url + '/api/users/?id=' + id

    if (isAuthorized) {
      if (id) {
        axios.get(url, config)
        .then((response) => {
          console.log('User details : ', response.data)
          this.setState({
            username: response.data.ResponseData[0].username,
            name: response.data.ResponseData[0].name,
            email: response.data.ResponseData[0].email,
            phone_number: response.data.ResponseData[0].phone_number,
            alamat : response.data.ResponseData[0].alamat,
            status: response.data.ResponseData[0].status.toLowerCase(),
            area: response.data.ResponseData[0].area.toString(),
            district_id: response.data.ResponseData[0].district_id,
            areaName : response.data.ResponseData[0].areaName,
            network : response.data.ResponseData[0].network.toString(),
            networkName : response.data.ResponseData[0].networkName,
            role: response.data.ResponseData[0].role.toString(),
            roleName : response.data.ResponseData[0].roleName,
            appProfile : response.data.ResponseData[0].profile_img,
            appProfileTitle : (response.data.ResponseData[0].profile_img) ? (this.assetFormatter(response.data.ResponseData[0].profile_img)) : ('No File Uploaded'),
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

          })
        }, (err) => {
          console.error(err)
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

      // GET AREAS LIST
      axios.get(api_url + '/api/area/?page=all&size=0', config)
        .then((response) => {
            this.setState({
              areaList: response.data.ResponseData
            })
        }, (err) => {
          console.error(err)
        })

      // GET ROLE LIST - only get all role list if level 0 or network = 0, else get role higher than the level 
      this.fetchRoles()  

      // GET NETWORK LIST
      axios.get(this.state.api_url+'/api/network/?page=all&size=0', this.state.config)
        .then((response) => {
            this.setState({
              networkList: response.data.ResponseData
            })
        }, (err) => {
          console.error(err)
        })  
    }
  }

  fetchRoles() {
    let { api_url, config } = this.state

    let roleRequestUrl = api_url + '/api/role/?page=all&size=0&level_exception=3'
    let userLevel = Number(this.props.user.role_level)
    let userRole = Number(this.props.user.role)

    if (userLevel !== 0 ) {
      roleRequestUrl += `&level=${ userLevel }`
    } else if (userLevel === 0) {
      if (userRole === 1) {
        roleRequestUrl += '&role_exception=1'
      }
    }

    console.log('roleRequestUrl : ', roleRequestUrl)
    axios.get(roleRequestUrl, config)
    .then((response) => {
        console.log('Get roles response : ', response.data)
        if (response.data.ResponseCode === '200') {
          this.setState({
            roleList: response.data.ResponseData
          })
        }
    }, (err) => {
      console.error(err)
    })
  }

  handleUsername(e){
    let value = (e.target.validity.valid) ? e.target.value : this.state.username;
    this.setState({
      phone_number : value,
      username: value
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

  handleArea(e, key){
    this.setState({
      area_id: key.key,
      area: e
    })

    let { api_url, config, province_id } = this.state
    let url = api_url + '/api/district/?province_id=' + province_id + '&area_id=' + key.key + '&page=all'

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
      district_id: key.key,
      district_name: e
    })
  }

  handleProvince(e, key){
    this.setState({
      province_name : e,
      province_id: key.key
    })
    
    let { api_url, config } = this.state
    let url = api_url + '/api/area/?province_id=' + key.key + '&page=all'

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

  handleRole(e, key){
    this.setState({
      role: key.key,
      roleName: e
    })
  }

  formValidate() {
    let { username, email, phone_number, area, role, network, status } = this.state

    let mandatoryValidate = username !== '' && email !== '' && phone_number !== '' && area !== '' && role !== '' && network !== '' && status !== ''
    
    if (mandatoryValidate) {
      let mailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      let usernameRegex = /\s/
  
      let mailValidate = mailRegex.test(email) === true
      let usernameValidate = usernameRegex.test(username) === false
  
      if (mailValidate && usernameValidate) {
        return true
      } else {
        if (!mailValidate) {
          message.error('Please match the email format!') }
  
        if (!usernameValidate) {
          message.error('Please match the username format!') }
      }
    } else {
      message.error('Please fill all required fields!')
    }
    
    return false
  }

  async handleSubmit (e) {
    e.preventDefault()

    let formValidate = await this.formValidate()

    if (formValidate) {
      this.setState({ buttonDisabled : true })
      
      let { api_url, config } = this.state
      let url = api_url + '/api/users/'
      
      let payload = {
        username: this.state.username,
        name: this.state.name,
        phone_number: this.state.phone_number,
        alamat: this.state.alamat,
        email: this.state.email,
        area: this.state.area_id,
        district_id: this.state.district_id,
        profile_img: this.state.appProfile,
        status: this.state.status,
        network: this.state.network,
        role: this.state.role
      }
      
      try {
        if (this.props.match.params.id) {
          // EDIT USER
          axios.put(url, payload, config)
          .then((response) => {
            console.log('Edit User Response : ', response.data)
            
            if (response.data.ResponseCode === "200") {
              message.success(response.data.ResponseDesc)
              
              this.props.history.push({
                pathname: '/users'
              })
            } else {
              if (response.data.status === '401') {
                this.setState({ isAuthorized : false, buttonDisabled : true }, () => {
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
          // CREATE NEW USER

          console.log('Payload create new user : ', payload)

          axios.post(url, payload, config)
          .then((response) => {
            console.log('Add New User Response : ', response.data)
            
            if (response.data.ResponseCode === "200") {
              message.success(response.data.ResponseDesc)
              
              this.props.history.push({
                pathname: '/users',
                state: { page_id: this.state.page_id }
              })
            } else {
              if (response.data.status === '401') {
                this.setState({ buttonDisabled : true }, () => {
                  message.error('Login Authentication Expired. Please Login Again!')
                })
              } else {
                let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : ""
                message.error(msg)

                this.setState({ buttonDisabled : false })
              }
            }  
          }, (err) => {
            message.error(err.data.ResponseDesc)
            this.setState({ buttonDisabled: false })
          })
        }
        
      } catch (e) {
          message.error(e.data.ResponseDesc)
          this.setState({ buttonDisabled: false })
      }
    }
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
    };

    var provinces = this.state.provinceList
    var areas = this.state.areaList
    var districts = this.state.districtList
    var roles = this.state.roleList
    var networks = this.state.networkList

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

    if (isAuthorized) {
      return (
        <Form className="form_view" onSubmit={this.handleSubmit.bind(this)}>
          { (this.state.disabled) ? (
            <Row type="flex" justify="end" style={{ marginBottom : '30px' }}>
              <Col>
                <Button 
                  className='base_button primary'
                  type="primary" 
                  htmlType="submit" 
                  style={{ marginLeft: '5px' }}
                  onClick={ () => {
                    this.props.history.push({
                      pathname : '/users'
                    })
                  } }
                  >
                  Back
                </Button>
              </Col>
            </Row>
          )  : (
            <Row type="flex" justify="end" style={{ marginBottom : '45px' }}>
              <Col>
                <Button 
                  className='base_button primary'
                  type="primary" 
                  htmlType="submit" 
                  style={{ marginLeft: '5px' }}
                  onClick={ () => {
                    this.props.history.push({
                      pathname : '/users'
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
                  disabled={!this.validateForm()}
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
                  disabled={!this.validateForm()}
                  style={{ marginLeft: '5px' }}
                >
                  Save
                </Button>
              </Col>
            </Row>
          )}

          <Row gutter={12}>
            <Col span={18} style={{ padding: "0 0 0 6px" }}>
                <FormItem {...formItemLayout} label="Username" required={true}>
                    <Input pattern="[0-9]*" placeholder="Username" value={this.state.username} disabled={this.state.mandatoryDisabled}
                      onChange={this.handleUsername.bind(this)}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Name">
                    <Input placeholder="Name" value={this.state.name} disabled={this.state.disabled}
                      onChange={e => this.setState({ name: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Email" required>
                    <Input placeholder="example@mail.com" value={this.state.email} disabled={this.state.mandatoryDisabled}
                      onChange={e => this.setState({ email: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Phone Number" required>
                  <Tooltip placement="right" title={'Accepted input format : number'}>
                    <Input pattern="[0-9]*" placeholder="Assign active phone number" value={this.state.phone_number} disabled={this.state.mandatoryDisabled}
                      onChange={this.handlePhoneNo.bind(this)}
                    />
                  </Tooltip>
                </FormItem>
                <FormItem {...formItemLayout} label="Address">
                    <Input placeholder="Address" value={this.state.alamat} disabled={this.state.disabled}
                      onChange={e => this.setState({ alamat: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Province" required={true}>
                    <Select showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                      placeholder="Province" value={this.state.province_name} defaultValue={this.state.province_name} disabled={this.state.disabled}
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
                      placeholder="City" value={this.state.area} defaultValue={this.state.area} disabled={this.state.disabled}
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
                      placeholder="District" value={this.state.district_name} defaultValue={this.state.district_name} disabled={this.state.disabled}
                      onChange={this.handleDistrict.bind(this)}
                    >
                    {
                      Object.keys(districts).map((item) => {
                        return (<Option key={districts[item].id} value={districts[item].district_name}>{districts[item].district_name}</Option>)
                      })
                    }
                    </Select>
                </FormItem>
                <FormItem {...formItemLayout} label="Role" required>
                    <Select placeholder="Role" value={this.state.roleName} defaultValue={this.state.roleName} disabled={this.state.disabled}
                      onChange={this.handleRole.bind(this)}
                    >
                    {
                      Object.keys(roles).map((item) => {
                        return (<Option key={roles[item].id} value={roles[item].name}>{roles[item].name}</Option>)
                      })
                    }
                    </Select>
                </FormItem>
                <FormItem {...formItemLayout} label="Network" required>
                    <Select placeholder="Network" value={this.state.network} defaultValue={this.state.network} 
                    disabled={ (this.props.user.network === 0) ? (this.state.disabled === true) ? true : false : true }
                      onChange={e => this.setState({ network: e })}
                    >
                      <Option key="0">Agan</Option>
                    {
                      Object.keys(networks).map((item) => {
                        return (<Option key={networks[item].id}>{networks[item].network}</Option>)
                      })
                    }
                    </Select>
                </FormItem>
                <FormItem {...formItemLayout} label="Status" required>
                    <Select placeholder="Status" value={this.state.status} disabled={this.state.statusDisabled}
                      onChange={e => this.setState({ status: e })}
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
                
                
                {/* <div style={{ marginTop: '30px' }}>
                  <Button 
                    className='base_button primary'
                    type="primary"
                    onClick={()=>this.props.history.push({
                      pathname: '/users',
                      state: { page_id: this.state.page_id }
                    })}
                  >
                    Back
                  </Button>
                  {
                    (!this.state.disabled) ? (
                      <Button 
                        className='base_button primary'
                        type="primary" 
                        htmlType="submit" 
                        disabled={ this.state.buttonDisabled }
                        style={{ marginLeft: '5px' }}
                      >
                        Save
                      </Button>
                    ) : ('')
                  }
                </div> */}
          </Form>
      )
    } else {
      return ('You are not authorized to access this page')
    }
  }
}

function mapStateToProps(state) {
    const { user, mode } = state;
    return {
        user,
        mode
    }
}

export default withRouter(connect(mapStateToProps, { LogUser, FormMode })(UsersForm));
