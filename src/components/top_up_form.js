import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Input, Form, message, Row, Col, Select, Divider, Upload, Icon, Modal, Tooltip, Popover } from "antd";
import { FormMode, LogUser } from '../actions';
import axios from "axios";
import { config } from "../config";
import moment from 'moment'
const FormItem = Form.Item;
const Option = Select.Option;

class TopUpForm extends Component {
  constructor(props){
    super(props)

    this.state = {
      isAuthorized: false,
      id: '',
      user_id: '',
      agen_lopper_biller: '',
      name: '',
      phone_number: '',
      account_id: '',
      product_id: '',
      payment_type: '',
      amount: '',
      bank_destination: '',
      bank_account: '',
      bank_source: '',
      bank_account_name: '',
      request_status: '',
      request_date: '',
      created_by: '',
      created_at: '',
      updated_by: '',
      updated_at: '',
      approved_by: '',
      approved_at: '',
      rejected_by: '',
      rejected_at: '',
      deleted_at: '',
      returnPage: false,
      saved: false,
			disabled: (this.props.location.pathname.includes("view")) ? true : false,
			hidden: (this.props.location.pathname.includes("new")) ? true : false,
			api_url: config().api_url,
      config: { headers: {'token': localStorage.getItem('token')}},
      AccountNameList: [],
      network: (this.props.user.network !== 0) ? (this.props.user.network) : (''),
      network_name: '',
      networkList: {},
      transferUploadFile : '',
      transferUploading : false,
      appTransfer : '',
      appTransferTitle : 'No File Uploaded',
      maxUploadSize : 1000000,
      previewAssetVisible : false,
      previewUrl : '',
      asset_url: config().asset_url.aws
    }

    this.handleNetwork = this.handleNetwork.bind(this)
    this.handleAccountNameList = this.handleAccountNameList.bind(this)

    // --- Upload Asset ---
    this.handlePreview = this.handlePreview.bind(this)
    this.handlePreviewClose = this.handlePreviewClose.bind(this)
    this.handleUploadAsset = this.handleUploadAsset.bind(this)
    this.handleUploadTransfer = this.handleUploadTransfer.bind(this)
    this.validateFile = this.validateFile.bind(this)
    this.resetAsset = this.resetAsset.bind(this)

	}
	
	validateForm() {
		return this.state.agen_lopper_biller === "" || this.state.name === "" || this.state.payment_type === "" || this.state.amount === "" 
		||  this.state.bank_destination === "" ||  this.state.bank_account === "" ||  this.state.bank_source === "" ||  this.state.bank_account_name === "";
  }

  componentWillMount() {
    let rights = this.props.user.rights
    let page_url = this.props.location.pathname
    let authorize = false

    for (let item in rights) {
      let isInclude = page_url.includes(rights[item].page_url)
      
      if (isInclude) {
        let isModeAdd = page_url.includes("/new")
        let isModeView = page_url.includes("/view")

        if (isModeView && rights[item].read === 1) {
          authorize = true
        } else if (isModeAdd && rights[item].create === 1) {
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
      let id = this.props.match.params.id
      
      if (id) {
        let url = api_url + '/api/topup_wallet/?id=' + id

        axios.get(url, config)
          .then((response) => {
            console.log('Topup Wallet User Response : ', response.data)
            if (response.data.ResponseCode === "200") {
              this.setState({
                id: response.data.ResponseData[0].id,
                user_id: response.data.ResponseData[0].user_id,
                agen_lopper_biller: response.data.ResponseData[0].agen_lopper_biller,
                name: response.data.ResponseData[0].name,
                phone_number: response.data.ResponseData[0].phone_number,
                account_id: response.data.ResponseData[0].account_id,
                product_id: response.data.ResponseData[0].product_id,
                payment_type: response.data.ResponseData[0].payment_type,
                amount: response.data.ResponseData[0].amount,
                bank_destination: response.data.ResponseData[0].bank_destination,
                bank_account: response.data.ResponseData[0].bank_account,
                bank_source: response.data.ResponseData[0].bank_source,
                bank_account_name: response.data.ResponseData[0].bank_account_name,
                appTransfer: response.data.ResponseData[0].transfer_receipt,
                appTransferTitle: (response.data.ResponseData[0].transfer_receipt) ? (this.assetFormatter(response.data.ResponseData[0].transfer_receipt)) : ('No File Uploaded'),
                request_status: response.data.ResponseData[0].request_status,
                request_date: response.data.ResponseData[0].request_date,
                created_by: response.data.ResponseData[0].created_by,
                created_at: response.data.ResponseData[0].created_at,
                updated_by: response.data.ResponseData[0].updated_by,
                updated_at: response.data.ResponseData[0].updated_at,
                approved_by: response.data.ResponseData[0].approved_by,
                approved_at: response.data.ResponseData[0].approved_at,
                rejected_by: response.data.ResponseData[0].rejected_by,
                rejected_at: response.data.ResponseData[0].rejected_at,
                deleted_at: response.data.ResponseData[0].deleted_at
              })

            }else{
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
            
              
          }, (err) => {
            console.error(err)
          })

          // GET NETWORK NAME
          let network = this.state.network
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
          })
      }else{
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
    }
  }

  async handleSubmit (e){
    e.preventDefault();
    this.setState({ isLoading: true })

    if(this.validateForm() === true){
      message.error("Please fill all required fields")
      return false
    } else {
      let { api_url, config, returnPage } = this.state
      let url = api_url + '/api/topup_wallet/'
      let data = {
        user_id: this.state.user_id,
        name: this.state.name,
        agen_lopper_biller: this.state.agen_lopper_biller.toUpperCase(),
        phone_number: this.state.phone_number,
        account_id: this.state.account_id,
        payment_type: this.state.payment_type,
        amount: this.state.amount,
        bank_destination: this.state.bank_destination,
        bank_account: this.state.bank_account,
        bank_source: this.state.bank_source,
        bank_account_name: this.state.bank_account_name,
        transfer_receipt: this.state.appTransfer,
        created_by: this.props.user.username
      }

      try {
        axios.post(url, data, config)
        .then((response) => {
            if(response.data.ResponseCode==="200"){
              message.success(response.data.ResponseDesc)
              if(returnPage){
                this.props.history.push({pathname: '/top_up'})    
              }
              
            }else {

              if (response.data.status === '401') {
                  message.error('Login Authentication Expired. Please Login Again!')
                
              } else {
                let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : ""
                message.error(msg)
                
                this.setState({ isLoading: false, saved: true })
              }
            }
            
        }, (err) => {
          message.error(err.data.ResponseDesc)
          this.setState({ isLoading: false })
        })
      } catch (e) {
          message.error(e.data.ResponseDesc)
          this.setState({ isLoading: false })
      }
    }
  }
  
  handleAccountNameList(){
    let { api_url, config, network, agen_lopper_biller } = this.state
    if (network === '' || agen_lopper_biller === '' ) {
      message.info('Select Network and Account Type value to get the Name list')
    } else {

      let url = api_url + '/api/wallet/?page=all&size=0&agent_loper_biller=' + agen_lopper_biller + '&network=' + network
      axios.get(url, config)
      .then((response) => {
        if(response.data.ResponseCode==="500"){
            message.error(response.data.ResponseDesc)
            this.setState({
              AccountNameList: []
            })
          }
          else{
            this.setState({
              AccountNameList: response.data.ResponseData
            })
          }
          this.setState({ isLoading: false })
      })
    }
  }

  handleChangeAccountType(e){
    this.setState({ 
      agen_lopper_biller: e 
    }, () => {
      this.handleAccountNameList()
    })
  }

  handleClickName(e){
    this.setState({
      name: e.name,
      user_id: e.user_id,
      account_id: e.account_id,
      phone_number: e.username
    })
  }

  handleNetwork(e, key){
    let { api_url, config } = this.state
    let network = key.key

    axios.get(api_url + '/api/network/?id='+ network, config)
    .then((response) => {
      this.setState({
        network: response.data.ResponseData[0].id,
        network_name: response.data.ResponseData[0].network
      }, () => {
        this.handleAccountNameList()
      })
    })
  }

  handleBankAccount(e){
    let bank_account = (e.target.validity.valid) ? e.target.value : this.state.BankAccount;
    this.setState({
      bank_account: bank_account
    })
  }

  handleAmount(e){
    let amount = (e.target.validity.valid) ? e.target.value : this.state.Amount;
    this.setState({
      amount: amount
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
          appTransfer : (type === 'appTransfer') ? ('') : (state.appTransfer),
          appTransferTitle : (type === 'appTransfer') ? ('No File Uploaded') : ((state.appTransfer) ? (this.assetFormatter(state.appTransfer)) : ('No File Uploaded')),
          transferUploadFile : (type === 'appTransfer') ? ('') : (state.transferUploadFile)
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
              transferUploading: false
            }, () => {
              message.error('Upload Failed!')
            })
          }
        }
      })
      .catch((error) => {
        this.setState({
          transferUploading: false
        }, () => {
          message.error('Upload Failed!')
          console.log(error)
          reject(error)
        })
      })
    })
  }

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

  async handleUploadTransfer(event) {
    event.preventDefault()

    const formData = new FormData()

    if (this.state.transferUploadFile) {
      await formData.append('file', this.state.transferUploadFile)
      this.setState({ transferUploading : true })

      let response = await this.handleUploadAsset(formData)

      this.setState({
        appTransfer : response.data.ResponseData.Location,
        transferUploading : false
      }, () => {
        message.success('Upload Transfer Reciept Image successful. Save to create impact.')
      })
    } else {
      message.error('No Image File Choosen!')
    }
  }

  render() {

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 12 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 12 },
			},
    };

    var AccountNameList = this.state.AccountNameList
    var networks = this.state.networkList

    // ------ Assets Props -----
    
    const tooltip = config().asset_url.tooltip
    const { isAuthorized, transferUploadFile, transferUploading } = this.state
    const transferPopover = ( <span> Upload image of Transfer Receipt </span> )
    const uploadProps = { multiple : false, showUploadList : false }

    const uploadTransferProps = {
      ...uploadProps,
      beforeUpload : async (file) => {

        let validate = await this.validateFile(file)

        if (validate) {
          this.setState(state => ({ 
            transferUploadFile: file,
            appTransferTitle : file.name
          }))
        }
      },
      transferUploadFile
    }
    let requestDate = moment(this.state.request_date, "YYYY-MM-DD HH:mm:ss").format("DD/MM/YYYY HH:mm:ss")
    let createAt = moment(this.state.created_at, "YYYY-MM-DD HH:mm:ss").format("DD/MM/YYYY HH:mm:ss")
    let updatedAt = moment(this.state.updated_at, "YYYY-MM-DD HH:mm:ss").format("DD/MM/YYYY HH:mm:ss")
    let approvedAt = moment(this.state.approved_at, "YYYY-MM-DD HH:mm:ss").format("DD/MM/YYYY HH:mm:ss")
    let rejectedAt = moment(this.state.rejected_at, "YYYY-MM-DD HH:mm:ss").format("DD/MM/YYYY HH:mm:ss")
    let deletedAt = moment(this.state.deleted_at, "YYYY-MM-DD HH:mm:ss").format("DD/MM/YYYY HH:mm:ss")

    if(isAuthorized){
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
                      pathname : '/top_up'
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
                      pathname : '/top_up'
                    })
                  } }
                  >
                  Back
                </Button>
              </Col>

              <Col>
                <Button 
                  className='base_button primary'
                  type="primary" 
                  htmlType="submit" 
                  disabled={this.validateForm()}
                  style={{ marginLeft: '5px' }}
                  onClick={ () => this.setState({ returnPage : true }) }
                  >
                  Save & Back
                </Button>
              </Col>

              <Col>
                <Button 
                  className='base_button primary'
                  type="primary" 
                  htmlType="submit" 
                  disabled={this.validateForm()}
                  style={{ marginLeft: '5px' }}
                >
                  Save
                </Button>
              </Col>
            </Row>
          )}
          
          <Row gutter={12}>
              <Col span={8} style={{ padding: "0 0 0 6px" }}>
                <FormItem {...formItemLayout} label="Network" required={true}>
                    <Select showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0} 
                    placeholder="Network" value={this.state.network_name} defaultValue={this.state.network_name}
                    disabled={( this.props.user.network === 0 && this.props.mode === "add") ? false : true}
                      onChange={this.handleNetwork}
                    >
                    {
                      Object.keys(networks).map((item) => {
                        return (<Option key={networks[item].id} value={networks[item].network}>{networks[item].network}</Option>)
                      })
                    }
                    </Select>
                </FormItem>
                <FormItem {...formItemLayout} label="Account Type" required={true}>
                   <Select placeholder="Account Type" value={this.state.agen_lopper_biller}
                      onChange={this.handleChangeAccountType.bind(this)}
                      disabled={this.state.disabled}
                    >
                      <Option key="1" value="Agent">Agent</Option>
                      <Option key="2" value="Biller">Biller</Option>
                      <Option key="3" value="Lopper">Lopper</Option>
                    </Select>
                </FormItem>
                <FormItem {...formItemLayout} label="Name" required={true}>
                    <Select placeholder="Name" value={this.state.name}
                      disabled={this.state.disabled}
                    >
                    {
                      Object.keys(AccountNameList).map((item) => {
                        return (<Option key={AccountNameList[item].id} onClick={this.handleClickName.bind(this, AccountNameList[item])}>{AccountNameList[item].name}</Option>)
                      })
                    }
                    </Select>
                </FormItem>
  							<div hidden={this.state.hidden}>
  								<FormItem {...formItemLayout} label="Phone Number" required={true}>
  										<Input placeholder="Phone Number" value={this.state.phone_number} disabled={this.state.disabled}
  											onChange={e => this.setState({ phone_number: e.target.value })}
  										/>
  								</FormItem>
  							</div>
  							<div hidden={this.state.hidden}>
  								<FormItem {...formItemLayout} label="Account ID" required={true}>
  										<Input placeholder="Account ID" value={this.state.account_id} disabled={this.state.disabled}
  											onChange={e => this.setState({ account_id: e.target.value })}
  										/>
  								</FormItem>
  							</div>
  							<div hidden={this.state.hidden}>
  								<FormItem {...formItemLayout} label="Product ID" required={true}>
  										<Input placeholder="Product ID" value={this.state.product_id} disabled={this.state.disabled}
  											onChange={e => this.setState({ product_id: e.target.value })}
  										/>
  								</FormItem>
  							</div>
  							<FormItem {...formItemLayout} label="Payment Type" required={true}>
                    <Select placeholder="Payment Type" value={this.state.payment_type}
                      onChange={e => this.setState({ payment_type: e })}
                      disabled={this.state.disabled}
                    >
                      <Option key="1" value="Transfer">Transfer</Option>
                      <Option key="2" value="Cash">Cash</Option>
                    </Select>
                </FormItem>
                <FormItem {...formItemLayout} label="Amount" required={true}>
                    <Input placeholder="Amount" pattern="[0-9]*" value={this.state.amount} disabled={this.state.disabled}
                      onChange={this.handleAmount.bind(this)}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Bank Destination" required={true}>
                    <Input placeholder="Bank Destination" value={this.state.bank_destination} disabled={this.state.disabled}
                      onChange={e => this.setState({ bank_destination: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Bank Account" required={true}>
  									<Input placeholder="Bank Account" pattern="[0-9]*" value={this.state.bank_account} disabled={this.state.disabled}
                      onChange={this.handleBankAccount.bind(this)}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Bank Source" required={true}>
                    <Input placeholder="Bank Source" value={this.state.bank_source} disabled={this.state.disabled}
                  		onChange={e => this.setState({ bank_source: e.target.value })}
                    />
                </FormItem>
  							<FormItem {...formItemLayout} label="Bank Account Name" required={true}>
  									<Input placeholder="Bank Account Name" value={this.state.bank_account_name} disabled={this.state.disabled}
                      onChange={e => this.setState({ bank_account_name: e.target.value })}
                    />
                </FormItem>
              </Col>
              <Col span={8} style={{ padding: "0 0 0 6px" }}>
  							<div hidden={this.state.hidden}>
  								<FormItem {...formItemLayout} label="Request Status">
  										<Input placeholder="Request Status" value={this.state.request_status} disabled={this.state.disabled}
  											onChange={e => this.setState({ request_status: e.target.value })}
  										/>
  								</FormItem>
  							</div>
  							<div hidden={this.state.hidden}>
  								<FormItem {...formItemLayout} label="Request Date">
  										<Input placeholder="Request Date" value={requestDate} disabled={this.state.disabled}
  											onChange={e => this.setState({ request_date: e.target.value })}
  										/>
  								</FormItem>
  							</div>
  							<div hidden={this.state.hidden}>
  								<FormItem {...formItemLayout} label="Created By">
  										<Input placeholder="Created By" value={this.state.created_by} disabled={this.state.disabled}
  											onChange={e => this.setState({ created_by: e.target.value })}
  										/>
  								</FormItem>
  							</div>
  							<div hidden={this.state.hidden}>
  								<FormItem {...formItemLayout} label="Created At">
  										<Input placeholder="Created At" value={createAt} disabled={this.state.disabled}
  											onChange={e => this.setState({ created_at: e.target.value })}
  										/>
  								</FormItem>
  							</div>
  							<div hidden={this.state.hidden}>
  								<FormItem {...formItemLayout} label="Updated By">
  										<Input placeholder="Updated By" value={this.state.updated_by} disabled={this.state.disabled}
  											onChange={e => this.setState({ updated_by: e.target.value })}
  										/>
  								</FormItem>
  							</div>
  							<div hidden={this.state.hidden}>
  								<FormItem {...formItemLayout} label="Updated At">
  										<Input placeholder="Updated At" value={updatedAt} disabled={this.state.disabled}
  											onChange={e => this.setState({ updated_at: e.target.value })}
  										/>
  								</FormItem>
  							</div>
  							<div hidden={this.state.hidden}>
  								<FormItem {...formItemLayout} label="Approved By">
  										<Input placeholder="Approved By" value={this.state.approved_by} disabled={this.state.disabled}
  											onChange={e => this.setState({ approved_by: e.target.value })}
  										/>
  								</FormItem>
  							</div>
  							<div hidden={this.state.hidden}>
  								<FormItem {...formItemLayout} label="Approved At">
  										<Input placeholder="Approved At" value={approvedAt} disabled={this.state.disabled}
  											onChange={e => this.setState({ approved_at: e.target.value })}
  										/>
  								</FormItem>
  							</div>
  							<div hidden={this.state.hidden}>
  								<FormItem {...formItemLayout} label="Rejected By">
  										<Input placeholder="Rejected By" value={this.state.rejected_by} disabled={this.state.disabled}
  											onChange={e => this.setState({ rejected_by: e.target.value })}
  										/>
  								</FormItem>
  							</div>
  							<div hidden={this.state.hidden}>
  								<FormItem {...formItemLayout} label="Rejected At">
  										<Input placeholder="Rejected At" value={rejectedAt} disabled={this.state.disabled}
  											onChange={e => this.setState({ rejected_at: e.target.value })}
  										/>
  								</FormItem>
  							</div>
  							<div hidden={this.state.hidden}>
  								<FormItem {...formItemLayout} label="Deleted At">
  										<Input placeholder="Deleted At" value={deletedAt} disabled={this.state.disabled}
  											onChange={e => this.setState({ deleted_at: e.target.value })}
  										/>
  								</FormItem>
  							</div>
              </Col>
            </Row>

            <Divider />

          <Row gutter={12}>
            <Col span={8} style={{ padding: "0 0 0 6px" }}>
              <h4>Upload Transfer Receipt</h4>
            </Col>
          </Row>
          
          <Row gutter={12} >
            {/* Avatar Container */}
            <Row type="flex" justify="space-around" align="middle" className="Rectangle">
              
              <Col span={4} className="ml-25"> <span> Transfer Receipt </span> </Col>
              
              <Col span={2}><Popover content={ transferPopover } ><img className="icon-tooltip" src={ tooltip } alt="i" /></Popover> </Col>
              
              <Col span={4} />
  
              <Col span={4} className="center">
                { (this.state.appTransfer) ? (
                    <Button 
                      onClick={ () => this.handlePreview(this.state.appTransfer) }
                      className='choose_button primary'
                      >
                      Preview
                    </Button>
                ) : (
                  (this.state.transferUploadFile) ? (
                    <Button
                      className='choose_button primary'
                      disabled={false}
                      onClick={ this.handleUploadTransfer }
                    >
                      { (transferUploading) ? ('Uploading') : ('Upload') }
                    </Button>
                  ) : (
                    <Upload {...uploadTransferProps}>
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
                  (this.state.appTransfer) ? (
                    <Row span={24} type="flex" justify="space-between" align="middle">
                      <Col span={6} className="center"> <img className="network-asset-avatar" src={ this.state.appTransfer } alt=""></img> </Col>
                      <Col span={18}> <span> { this.state.appTransferTitle } </span>  </Col>
                    </Row>
                  ) : (
                    <span> { this.state.appTransferTitle } </span> 
                  )
                }
              </Col>
  
              <Col span={2} className="center">
                {
                  (this.props.mode !== "view") ? (
                    <a className="icon-a" onClick={ () => this.resetAsset({ asset_url : this.state.appTransfer, type : 'appTransfer'  }) }><Tooltip title="Delete File"><Icon type="delete" theme="filled" style={{ fontSize: '23px', marginTop : '5px' }} /></Tooltip></a>
                  ) : ''
                }
              </Col>
            
            </Row>
            {/* End of Avatar Container */}
          </Row>

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

export default withRouter(connect(mapStateToProps, { LogUser, FormMode })(TopUpForm));
