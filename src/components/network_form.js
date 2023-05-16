import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Input, Form, message, Row, Col, Divider, Select, Tooltip, Icon, Modal, Popover, Upload, Switch, BackTop } from "antd";
import { FormMode, LogUser } from '../actions';
import axios from "axios";
import { config } from "../config";
import '../templates/network.css'
import { SketchPicker } from 'react-color'
import reactCSS from 'reactcss'
const FormItem = Form.Item;
const Option = Select.Option;

class NetworkForm extends Component {
  constructor(props){
    super(props)

    this.state = {
      id: (this.props.match.params.network) ? this.props.match.params.network : '',
      isAuthorized: false,
      network: '',
      sender_id: '',
      senderList : {},
      call_center : '',
      sender_email : '',
      privacy_policy : '',
      minimum_balance : '',
      subscriptionDisable : false,
      subscriptionModelList : {},
      subscription_model_id : '',
      subscriptionModel : {},
      displayAppColorPicker : false,
      appColor : '#1559a7',
      displayFontColorPicker : false,
      fontColor : '#f7f7f7',
      appSplashScreen : '',
      appSplashScreenTitle : 'No File Uploaded',
      appLogo : '',
      appLogoTitle : 'No File Uploaded',
      appBanner : '',
      appBannerTitle : 'No File Uploaded',
      dashboardFavicon : '',
      dashboardFaviconTitle : 'No File Uploaded',
      dashboardLogo : '',
      dashboardLogoTitle : 'No File Uploaded',
      previewAssetVisible : false,
      previewUrl : '',
      maxUploadSize : 1000000,
      splashScreenUploadFile : '',
      splashScreenUploading : false,
      logoUploadFile : '',
      logoUploading : false,
      bannerUploadFile : '',
      bannerUploading : false,
      dashboardLogoUploadFile : '',
      dashboardLogoUploading : false,
      dashboardFaviconUploadFile : '',
      dashboardFaviconUploading : false,
      returnPage : false,
      disabled: (this.props.location.pathname.includes("view")) ? true : false,
      api_url: config().api_url,
      config: { headers: {'token': localStorage.getItem('token')}},
      asset_url: config().asset_url.aws
    }

    this.fetchSenderList = this.fetchSenderList.bind(this)
    this.fetchSubscriptionModels = this.fetchSubscriptionModels.bind(this)
    this.validateFile = this.validateFile.bind(this)
    
    // --- App Color ---
    this.handleAppColorClick = this.handleAppColorClick.bind(this)
    this.handleAppColorChange = this.handleAppColorChange.bind(this)
    this.handleAppColorClose = this.handleAppColorClose.bind(this)
    this.handleFontColorClick = this.handleFontColorClick.bind(this)
    this.handleFontColorChange = this.handleFontColorChange.bind(this)
    this.handleFontColorClose = this.handleFontColorClose.bind(this)
    this.resetColor = this.resetColor.bind(this)
    this.handleCopyClipboard = this.handleCopyClipboard.bind(this)
    
    // --- Upload Asset ---
    this.handlePreview = this.handlePreview.bind(this)
    this.handlePreviewClose = this.handlePreviewClose.bind(this)
    this.handleUploadAsset = this.handleUploadAsset.bind(this)
    this.handleUploadSplashScreen = this.handleUploadSplashScreen.bind(this)
    this.handleUploadLogo = this.handleUploadLogo.bind(this)
    this.handleUploadBanner = this.handleUploadBanner.bind(this)
    this.handleUploadDashboardLogo = this.handleUploadDashboardLogo.bind(this)
    this.handleUploadDashboardFavicon = this.handleUploadDashboardFavicon.bind(this)
    this.assetFormatter = this.assetFormatter.bind(this)
    this.resetAsset = this.resetAsset.bind(this)
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
        let isModeUpdate = page_url.includes("/edit")
        
        if (isModeAdd && rights[item].create === 1) {
          authorize = true
        } else if (isModeUpdate && rights[item].update === 1) {
          authorize = true
        } else if (isModeView && rights[item].read === 1) {
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

    let networkID = this.props.match.params.network 
    let url = api_url + '/api/network?id=' + networkID

    if (isAuthorized) {
      this.fetchSenderList()
      this.fetchSubscriptionModels()
      
      if (networkID) {
        axios.get(url, config)
        .then((response) => {
            console.log('Network data : ', response.data)
            
            if (response.data.ResponseCode === "200") {
              this.setState({
                network: response.data.ResponseData[0].network,
                sender_id: response.data.ResponseData[0].sender_id,
                call_center : response.data.ResponseData[0].call_center,
                sender_email : response.data.ResponseData[0].sender_email,
                privacy_policy : response.data.ResponseData[0].url_website,
                appColor : (response.data.ResponseData[0].themes_color) ? (response.data.ResponseData[0].themes_color) : ('#1559a7'),
                fontColor : (response.data.ResponseData[0].header_font_color) ? (response.data.ResponseData[0].header_font_color) : ('#f7f7f7'),
                appLogo : response.data.ResponseData[0].logo,
                appBanner : response.data.ResponseData[0].banner,
                appSplashScreen : response.data.ResponseData[0].splash_screen,
                dashboardLogo : response.data.ResponseData[0].dashboard_logo,
                dashboardFavicon : response.data.ResponseData[0].favicon,
                appLogoTitle : (response.data.ResponseData[0].logo) ? (this.assetFormatter(response.data.ResponseData[0].logo)) : ('No File Uploaded'),
                appBannerTitle : (response.data.ResponseData[0].banner) ? (this.assetFormatter(response.data.ResponseData[0].banner)) : ('No File Uploaded'),
                appSplashScreenTitle : (response.data.ResponseData[0].splash_screen) ? (this.assetFormatter(response.data.ResponseData[0].splash_screen)) : ('No File Uploaded'),
                dashboardLogoTitle : (response.data.ResponseData[0].dashboard_logo) ? (this.assetFormatter(response.data.ResponseData[0].dashboard_logo)) : ('No File Uploaded'),
                dashboardFaviconTitle : (response.data.ResponseData[0].favicon) ? (this.assetFormatter(response.data.ResponseData[0].favicon)) : ('No File Uploaded'),
                minimum_balance : response.data.ResponseData[0].minimum_balance,
                subscription_model_id : (response.data.ResponseData[0].subscription_model_id) ? ((response.data.ResponseData[0].subscription_model_id).toString()) : ('')
              })

              let subscriptionModelId = response.data.ResponseData[0].subscription_model_id

              if (subscriptionModelId) {
                axios.get(api_url + '/api/subscription/?id=' + subscriptionModelId, config)
                .then((response) => {
                  if (response.data.ResponseCode === '200') {
                    if (response.data.ResponseData.length === 1) {
                      this.setState({
                        subscriptionDisable : true,
                        subscriptionModel : response.data.ResponseData[0]
                      })
                    }
                  }
                })
                .catch((err) => {
                  console.log(err)
                })
              }
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
            }
            }, (err) => {
          console.error(err)
        })  
      }
    }
  }

  // Font Color Picker

  handleFontColorClick() {
    this.setState({ displayFontColorPicker : !this.state.displayFontColorPicker })
  }

  handleFontColorClose() {
    this.setState({ displayFontColorPicker : false })
  }

  handleFontColorChange(color) {
    this.setState({ fontColor : color.hex })
  }

  // App Color Picker

  handleAppColorClick() {
    this.setState({
      displayAppColorPicker : !this.state.displayAppColorPicker
    })
  }

  handleAppColorClose() {
    this.setState({ displayAppColorPicker : false })
  }

  handleAppColorChange(color) {
    this.setState({ appColor : color.hex })
  }

  handleCallCenter(e) {
    let value = (e.target.validity.valid) ? (e.target.value) : this.state.call_center
    this.setState({ call_center : value })
  }

  validateForm() {
    return this.state.network.length > 0 && this.state.sender_id.length > 0;
  }

  //   -----   Fetch List   -----   

  fetchSubscriptionModels() {
    let { api_url, config } = this.state

    let url = api_url + '/api/subscription/?page=all'

    axios.get(url, config)
    .then((response) => {
      console.log('Subscription Models : ', response)

      if (response.data.ResponseCode === '200') {
        this.setState({
          subscriptionModelList : response.data.ResponseData
        })
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
      }
    })
    .catch((err) => {
      console.log(err)
    })
  }

  fetchSenderList() {
    let { api_url, config } = this.state
    let url = api_url + '/api/senders/?page=all'

    axios.get(url, config)
    .then((response) => {
      console.log('Senders : ', response)

      if (response.data.ResponseCode === '200') {
        this.setState({
          senderList : response.data.ResponseData
        })
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
      }
    })
    .catch((err) => {
      console.log(err)
    })
  }

  async handleSubscriptionModel(e) {
    let { subscriptionModelList } = this.state
    let val = (e).toString()

    for (let item in subscriptionModelList) {
      if (subscriptionModelList[item].id === parseInt(e, 10)) {
        this.setState({ 
          subscriptionDisable : true,
          subscriptionModel : subscriptionModelList[item],
          subscription_model_id : val
        })
      }
    }
  }

  async handleSubmit (e){
    e.preventDefault()
  
    let { api_url, id, network, sender_id, config, 
          sender_email, privacy_policy, appColor, 
          fontColor, appSplashScreen, appLogo, appBanner, 
          dashboardLogo, dashboardFavicon, returnPage, minimum_balance,
          subscription_model_id, call_center } = this.state

    let networkID = this.props.match.params.network

    let payload = {
      id: id,
      network_name : network,
      sender_id : (sender_id) ? (sender_id) : ('AGAN'),
      call_center : (call_center) ? (call_center) : (null),
      sender_email : (sender_email) ? (sender_email) : ('do-not-reply@jpx.id'),
      url_website : (privacy_policy) ? (privacy_policy) : ('https://agan.id'),
      themes_color : (appColor) ? (appColor) : ('#1559a7'),
      header_font_color : (fontColor) ? (fontColor) : ('#f7f7f7'),
      logo : (appLogo) ? (appLogo) : (null),
      banner : (appBanner) ? (appBanner) : (null),
      splash_screen : (appSplashScreen) ? (appSplashScreen) : (null),
      dashboard_logo : (dashboardLogo) ? (dashboardLogo) : (null),
      favicon : (dashboardFavicon) ? (dashboardFavicon) : (null),
      minimum_balance : (minimum_balance) ? (minimum_balance) : (0),
      subscription_model_id : (subscription_model_id) ? (subscription_model_id) : (null),
    }

    let axiosConfig = {
      url : api_url + '/api/network?id=' + id,
      data : payload,
      headers : config.headers
    }

    if (networkID) {
      axiosConfig.method = 'PUT'
    } else {
      axiosConfig.method = 'POST'
    }
    
    console.log('Request Submit : ', axiosConfig)

    try {
      axios(axiosConfig)
      .then((response) => {
        console.log(response.data)
        if (response.data.ResponseCode === "200") {
          message.success(response.data.ResponseDesc)

          if (returnPage) {
            this.props.history.push({ pathname: '/network' })
          }
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

            this.setState({ buttonDisabled : false })
          }
        }
      }, (err) => {
        throw new Error(err)
      })
    } catch (e) {
        console.log(e)
        message.error(e.data.ResponseDesc)
    }
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

  // Copy the value (color) to clipboard 
  handleCopyClipboard(value) {
    let copyDummy = document.createElement("input")
    
    document.body.appendChild(copyDummy)

    copyDummy.setAttribute("id", "copy_value")

    document.getElementById("copy_value").value = value

    copyDummy.select()

    document.execCommand("copy")

    document.body.removeChild(copyDummy)

    message.success(`Color Value ${ value } Copied`)
  }

  resetColor(colorType) {
    if (!this.state.disabled) {
      this.setState(function(state) {
        return {
          appColor : (colorType === 'appColor') ? ('#ffffff') : (state.appColor),
          fontColor : (colorType === 'fontColor') ? ('#000000') : (state.fontColor)
        }
      }, () => {
        message.success('Color Deleted')
      })
    }
  }

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
          appSplashScreen : (type === 'appSplashScreen') ? ('') : (state.appSplashScreen),
          appSplashScreenTitle : (type === 'appSplashScreen') ? ('No File Uploaded') : ((state.appSplashScreen) ? (this.assetFormatter(state.appSplashScreen)) : ('No File Uploaded')),
          splashScreenUploadFile : (type === 'appSplashScreen') ? ('') : (state.splashScreenUploadFile),
          appLogo : (type === 'appLogo') ? ('') : (state.appLogo),
          appLogoTitle : (type === 'appLogo') ? ('No File Uploaded') : ((state.appLogo) ? (this.assetFormatter(state.appLogo)) : ('No File Uploaded')),
          logoUploadFile : (type === 'appLogo') ? ('') : (state.logoUploadFile),
          appBanner : (type === 'appBanner') ? ('') : (state.appBanner),
          appBannerTitle : (type === 'appBanner') ? ('No File Uploaded') : ((state.appBanner) ? (this.assetFormatter(state.appBanner)) : ('No File Uploaded')),
          bannerUploadFile : (type === 'appBanner') ? ('') : (state.bannerUploadFile),
          dashboardLogo : (type === 'dashLogo') ? ('') : (state.dashboardLogo),
          dashboardLogoTitle : (type === 'dashLogo') ? ('No File Uploaded') : ((state.dashboardLogo) ? (this.assetFormatter(state.dashboardLogo)) : ('No File Uploaded')),
          dashboardLogoUploadFile : (type === 'dashLogo') ? ('') : (state.dashboardLogoUploadFile),
          dashboardFavicon : (type === 'dashFavicon') ? ('') : (state.dashboardFavicon),
          dashboardFaviconTitle : (type === 'dashFavicon') ? ('No File Uploaded') : ((state.dashboardFavicon) ? (this.assetFormatter(state.dashboardFavicon)) : ('No File Uploaded')),
          dashboardFaviconUploadFile : (type === 'dashFavicon') ? ('') : (state.dashboardFaviconUploadFile)
        }
      })
    }
  }

  validateFile(file) {
    let { maxUploadSize } = this.state
    let validate = false
    let pngType = file.name.includes("png")
    let jpgType = file.name.includes("jpg")
    let jpegType = file.name.includes("jpeg")
    let icoType = file.name.includes("ico")

    if (pngType || jpgType || jpegType || icoType) {
      validate = true
    } else {
      message.info("File type is invalid. Only PNG/ JPEG/ JPG/ ICO types are allowed")
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

  async handleUploadSplashScreen(event) {
    event.preventDefault()

    const formData = new FormData()

    if (this.state.splashScreenUploadFile) {
      await formData.append('file', this.state.splashScreenUploadFile)
      this.setState({ splashScreenUploading : true })

      let response = await this.handleUploadAsset(formData)
      
      this.setState({
        appSplashScreen : response.data.ResponseData.Location,
        splashScreenUploading : false
      }, () => {
        message.success('Upload asset Splash Screen successful. Save Network to create impact.')
      })
    } else {
      message.error('No Splash Screen File Choosen!')
    }
  }

  async handleUploadLogo(event) {
    event.preventDefault()

    const formData = new FormData()

    if (this.state.logoUploadFile) {
      await formData.append('file', this.state.logoUploadFile)
      this.setState({ logoUploading : true })

      let response = await this.handleUploadAsset(formData)

      this.setState({
        appLogo : response.data.ResponseData.Location,
        logoUploading : false
      }, () => {
        message.success('Upload asset Logo successful. Save Network to create impact.')
      })
    } else {
      message.error('No Logo File Choosen!')
    }
  }

  async handleUploadBanner(event) {
    event.preventDefault()

    const formData = new FormData()

    if (this.state.bannerUploadFile) {
      await formData.append('file', this.state.bannerUploadFile)
      this.setState({ bannerUploading : true})

      let response = await this.handleUploadAsset(formData)

      this.setState({
        appBanner : response.data.ResponseData.Location,
        bannerUploading : false
      }, () => {
        message.success('Upload asset Banner successful. Save Network to create impact.')
      })
    } else {
      message.error('No Banner File Choosen!')
    }
  }

  async handleUploadDashboardLogo(event) {
    event.preventDefault()

    const formData = new FormData()

    if (this.state.dashboardLogoUploadFile) {
      await formData.append('file', this.state.dashboardLogoUploadFile)

      this.setState({ dashboardLogoUploading : true })

      let response = await this.handleUploadAsset(formData)

      this.setState({
        dashboardLogo : response.data.ResponseData.Location,
        dashboardLogoUploading : false
      }, () => {
        message.success('Upload asset Dashboard Logo successful. Save Network to create impact.')
      })
    } else {
      message.error('No Dashboard Logo File Choosen!')
    }
  }

  async handleUploadDashboardFavicon(event) {
    event.preventDefault()

    const formData = new FormData()

    if (this.state.dashboardFaviconUploadFile) {
      await formData.append('file', this.state.dashboardFaviconUploadFile)

      this.setState({ dashboardFaviconUploading : true })

      let response = await this.handleUploadAsset(formData)

      this.setState({
        dashboardFavicon : response.data.ResponseData.Location,
        dashboardLogoUploading : false
      }, () => {
        message.success('Upload asset Dashboard Favicon successful. Save Network to create impact.')
      })
    } else {
      message.err('No Dashboard Favicon File Choosen!')
    }
  }

  handleUploadAsset(formData) {
    let { api_url } = this.state

    const url = api_url + '/api/asset/upload'

    return new Promise((resolve, reject) => {
      axios.post(url, formData, { headers : { 'Content-Type': 'multipart/form-data', 'token' : this.state.config.headers.token } })
      .then((response) => {
        console.log(response.data)
  
        if (response.data.ResponseCode === "200") {
          resolve(response)
        } else {
          if (response.data.status === '401') {
            this.setState({ isAuthorized : false }, () => {
              message.error('Login Authentication Expired. Please Login Again!')
            })
          } else {
            this.setState({
              bannerUploading : false,
              logoUploading: false,
              splashScreenUploading : false,
              dashboardLogoUploading : false,
              dashboardFaviconUploading : false
            }, () => {
              message.error('Upload Failed!')
              console.log(response.data.ResponseDesc)
            })
          }
        }
      })
      .catch((error) => {
        this.setState({
          bannerUploading : false,
          logoUploading: false,
          splashScreenUploading : false,
          dashboardLogoUploading : false,
          dashboardFaviconUploading : false
        }, () => {
          message.error('Upload Failed!')
          console.log(error)
          reject(error)
        })
      })
    })
  }

  handleSubscriptionUncheck(checked) {
    this.setState({ 
      subscriptionDisable : checked,
      subscription_model_id : '',
      subscriptionModel : {}
    })
  }
  
  render() {
    
    const { isAuthorized, splashScreenUploadFile, splashScreenUploading, logoUploadFile, logoUploading, bannerUploadFile, bannerUploading, senderList, dashboardLogoUploadFile, dashboardLogoUploading, dashboardFaviconUploadFile, dashboardFaviconUploading, subscriptionModelList } = this.state

    // ----- List -----

    const senders = senderList
    const subscriptionModels = subscriptionModelList
    
    // ------ Assets Props -----
    
    const tooltip = config().asset_url.tooltip

    const uploadProps = { multiple : false, showUploadList : false }

    const uploadSplashScreenProps = {
      ...uploadProps,
      beforeUpload: async (file) => {

        let validate = await this.validateFile(file)

        if (validate) {
          this.setState(state => ({ 
            splashScreenUploadFile: file,
            appSplashScreenTitle : file.name
          }))
        }
      },
      splashScreenUploadFile
    }

    const uploadLogoProps = {
      ...uploadProps,
      beforeUpload : async (file) => {

        let validate = await this.validateFile(file)

        if (validate) {
          this.setState(state => ({ 
            logoUploadFile: file,
            appLogoTitle : file.name
          }))
        }
      },
      logoUploadFile
    }

    const uploadBannerProps = {
      ...uploadProps,
      beforeUpload : async (file) => {
        
        let validate = await this.validateFile(file)

        if (validate) {
          this.setState(state => ({ 
            bannerUploadFile: file,
            appBannerTitle : file.name
          }))
        }
      },
      bannerUploadFile
    }

    const uploadDashLogoProps = {
      ...uploadProps,
      beforeUpload : async (file) => {
        let validate = await this.validateFile(file)

        if (validate) {
          this.setState(state => ({
            dashboardLogoUploadFile : file,
            dashboardLogoTitle : file.name
          }))
        }
      },
      dashboardLogoUploadFile
    }

    const uploadDashFaviconProps = {
      ...uploadProps,
      beforeUpload : async (file) => {
        console.log('favicon file : ', file)

        let validate = await this.validateFile(file)

        if (validate) {
          let iconTypeValidate = file.name.includes('.ico')

          if (iconTypeValidate) {
            this.setState(state => ({
              dashboardFaviconUploadFile : file,
              dashboardFaviconTitle : file.name
            }))
          } else {
            message.error('Accepted file format for Favicon is image-icon (.ico)')
          }
        }
      },
      dashboardFaviconUploadFile
    }

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 10 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 12 },
      }
    }

    const appStyles = reactCSS({
      'default': {
        color: {
          width: '15px',
          height: '15px',
          background: `${ this.state.appColor }`
        },
        swatch: {
          padding: '2px',
          background: '#fff',
          borderRadius: '1px',
          boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
          display: 'inline-block',
        },
        popover: {
          position: 'absolute',
          zIndex: '3',
        },
        cover: {
          position: 'fixed',
          top: '0px',
          right: '0px',
          bottom: '0px',
          left: '0px',
        }
      }
    })

    const fontStyles = { ...appStyles, color : { ...appStyles.color, background : `${ this.state.fontColor }` } }

    const appThemeColorPopover = ( <span> This color will be displayed as Mobile Application theme color </span> )
    const appFontColorPopover = ( <span> This color will be displayed in header font in Mobile Application </span> )
    const appSplashScreenPopover = ( <span> Asset will be displayed in Splash Screen in Mobile Application </span> )
    const appLogoPopover = ( <span> Asset will be displayed in Mobile Application </span> )
    const appBannerPopover = ( <span> Asset will be displayed in Beranda Page in Mobile Application </span> )
    const dashboardFaviconPopover = ( <span> Asset will be displayed in Favicon Browser Tab in Website Dashboard </span> )
    const dashboardLogoPopover = ( <span> Asset will be displayed in Website Dashboard Home Page  </span> )
    
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
                      pathname : '/network'
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
                  disabled={!this.validateForm()}
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
                  disabled={!this.validateForm()}
                  style={{ marginLeft: '5px' }}
                >
                  Save
                </Button>
              </Col>
            </Row>
          )}

          <Row gutter={12}>
            <Col span={8} style={{ padding: "0 0 0 6px" }}>
              <FormItem>
                <Input type="hidden" placeholder="ID" value={this.state.id} disabled={this.state.disabled}
                  onChange={e => this.setState({ id: e.target.value })}
                />
              </FormItem>

              <FormItem {...formItemLayout} label="Network" required>
                <Input placeholder="Network name" value={this.state.network} 
                  onChange={e => this.setState({ network: e.target.value })}
                  disabled={this.state.disabled}
                />
              </FormItem>

              <FormItem {...formItemLayout} label="Sender ID" required>
                <Select showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                  placeholder="Sender SMS"
                  value={ this.state.sender_id}
                  defaultValue={ this.state.sender_id }
                  onChange={ e => this.setState({ sender_id : e }) }
                  disabled={this.state.disabled}
                >
                  {
                    Object.keys(senders).map((item) => {
                      return (<Option key={ senders[item].id }>{ senders[item].sender }</Option>)
                    })
                  }
                </Select>
              </FormItem>

              <FormItem {...formItemLayout} label="Status">
                <Select showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                  placeholder="Status"
                  defaultValue="Active"
                  disabled={true}
                >
                  <Option key="1" value="active" >Active</Option>
                  <Option key="2" value="inactive" >Inactive</Option>
                </Select>
              </FormItem>

            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={8} style={{ padding: "0 0 0 6px" }}>
              
              <FormItem {...formItemLayout} label="Call Center Number">
                <Input pattern="[0-9]*" placeholder="Call Center Number" value={this.state.call_center} 
                  onChange={ this.handleCallCenter.bind(this) }
                  disabled={this.state.disabled}
                />
              </FormItem>

              <FormItem {...formItemLayout} label="Sender Email">
                <Input placeholder="Sender Email" value={this.state.sender_email} 
                  onChange={e => this.setState({ sender_email: e.target.value })}
                  disabled={this.state.disabled}
                />
              </FormItem>
              
              <FormItem {...formItemLayout} label="Privacy Policy">
                <Input placeholder="Privacy Policy Url" value={this.state.privacy_policy} 
                  onChange={e => this.setState({ privacy_policy: e.target.value })}
                  disabled={this.state.disabled}
                />
              </FormItem>
            </Col>
          </Row>

          <Divider />

          <Row gutter={12}>
            <Col span={8} style={{ padding: "0 0 0 6px" }}>
              <h4>Theme Color</h4>
            </Col>
          </Row>

          <Row gutter={12} >
            
            {/* App Color Container */}
            <Row type="flex" justify="space-around" align="middle" className="Rectangle">
              
              <Col span={4} className="ml-25"> <span> App </span> </Col>
              
              <Col span={2}><Popover content={ appThemeColorPopover } ><img className="icon-tooltip" src={ tooltip } alt="i" /></Popover> </Col>
              
              <Col span={4} />

              <Col span={4} className="center"> 
                  <Button 
                    onClick={ this.handleAppColorClick }
                    className='choose_button primary'
                    disabled={this.state.disabled}
                  >
                    Choose
                  </Button>
              </Col>
              
              <Col span={6} className="center">
                
                <Row span={24} type="flex" justify="space-between" align="middle">
          
                  <Col span={8}> <span> { this.state.appColor } </span> </Col>

                  <Col span={8} style={{ marginTop: '5px' }}>

                    <div style={ appStyles.swatch } >
                  
                      <div style={ appStyles.color } />

                      { (this.state.displayAppColorPicker) ? (
                          <div style={ appStyles.popover }>
                            <div style={ appStyles.cover } onClick={ this.handleAppColorClose } />
                            <SketchPicker color={ this.state.appColor } onChange={ this.handleAppColorChange }/>
                          </div>
                        ) : (null) 
                      }

                    </div>

                  </Col>
                  
                  <Col span={8}> <a className="icon-a" onClick={ () => this.handleCopyClipboard(this.state.appColor) }><Tooltip title="Copy "><Icon type="copy" theme="filled" style={{ fontSize: '23px', marginTop : '5px' }}/></Tooltip></a> </Col>

                </Row>

              </Col>

              <Col span={2} className="center"> <a className="icon-a" onClick={ () => this.resetColor('appColor') } ><Tooltip title="Delete File"><Icon type="delete" theme="filled" style={{ fontSize: '23px', marginTop : '5px' }} /></Tooltip></a> </Col>
            
            </Row>
            {/* End of App Color Container */}

            {/* Font Color Container */}
            <Row type="flex" justify="space-around" align="middle" className="Rectangle">
              
              <Col span={4} className="ml-25"> <span> Header Font </span> </Col>
              
              <Col span={2}><Popover content={ appFontColorPopover } ><img className="icon-tooltip" src={ tooltip } alt="i" /></Popover> </Col>

              <Col span={4} />

              <Col span={4} className="center"> 
                <Button 
                  onClick={ this.handleFontColorClick }
                  className='choose_button primary'
                  disabled={this.state.disabled}
                >
                  Choose
                </Button>
              </Col>
              
              <Col span={6} className="center">
                
                <Row span={24} type="flex" justify="space-between" align="middle">
          
                  <Col span={8}> <span> { this.state.fontColor } </span> </Col>

                  <Col span={8} style={{ marginTop: '5px' }}>

                    <div style={ fontStyles.swatch } >
                  
                      <div style={ fontStyles.color } />

                      { (this.state.displayFontColorPicker) ? (
                          <div style={ fontStyles.popover }>
                            <div style={ fontStyles.cover } onClick={ this.handleFontColorClose } />
                            <SketchPicker color={ this.state.fontColor } onChange={ this.handleFontColorChange }/>
                          </div>
                        ) : (null) 
                      }

                    </div>

                  </Col>
                  
                  <Col span={8}> <a className="icon-a" onClick={ () => this.handleCopyClipboard(this.state.fontColor) }><Tooltip title="Copy "><Icon type="copy" theme="filled" style={{ fontSize: '23px', marginTop : '5px' }}/></Tooltip></a> </Col>

                </Row>

              </Col>

              <Col span={2} className="center"> <a className="icon-a" onClick={ () => this.resetColor('fontColor') }><Tooltip title="Delete File"><Icon type="delete" theme="filled" style={{ fontSize: '23px', marginTop : '5px' }} /></Tooltip></a> </Col>
            
            </Row>
            {/* End of Font Color Container */}

            <h4>Mobile Application Asset</h4>

            {/* Splash Screen Container */}
            <Row type="flex" justify="space-around" align="middle" className="Rectangle">
              
              <Col span={4} className="ml-25"> <span> Splash Screen </span> </Col>
              
              <Col span={2}><Popover content={ appSplashScreenPopover } ><img className="icon-tooltip" src={ tooltip } alt="i" /></Popover> </Col>
              
              <Col span={4} />

              <Col span={4} className="center">
                { (this.state.appSplashScreen) ? (
                    <Button 
                      onClick={ () => this.handlePreview(this.state.appSplashScreen) }
                      className='choose_button primary'
                      >
                      Preview
                    </Button>
                ) : (
                  (this.state.splashScreenUploadFile) ? (
                    <Button
                      className='choose_button green'
                      disabled={false}
                      onClick={ this.handleUploadSplashScreen }
                    >
                      { (splashScreenUploading) ? ('Uploading') : ('Upload') }
                    </Button>
                  ) : (
                    <Upload {...uploadSplashScreenProps}>
                      <Button 
                        className="choose_button red"
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
                  (this.state.appSplashScreen) ? (
                    <Row span={24} type="flex" justify="space-between" align="middle">
                      <Col span={6} className="center"> <img className="network-asset-avatar" src={ this.state.appSplashScreen } alt=""></img> </Col>
                      <Col span={18}> <span> { this.state.appSplashScreenTitle } </span>  </Col>
                    </Row>
                  ) : (
                    <span> { this.state.appSplashScreenTitle } </span> 
                  )
                }
              </Col>

              <Col span={2} className="center"> <a className="icon-a" onClick={ () => this.resetAsset({ asset_url : this.state.appSplashScreen, type : 'appSplashScreen'  }) }><Tooltip title="Delete File"><Icon type="delete" theme="filled" style={{ fontSize: '23px', marginTop : '5px' }} /></Tooltip></a>  </Col>

            </Row>
            {/* End of Splash Screen Container */}

            {/* Logo Container */}
            <Row type="flex" justify="space-around" align="middle" className="Rectangle">
              
              <Col span={4} className="ml-25"> <span> Logo </span> </Col>
              
              <Col span={2}><Popover content={ appLogoPopover } ><img className="icon-tooltip" src={ tooltip } alt="i" /></Popover> </Col>
              
              <Col span={4} />

              <Col span={4} className="center">
                { (this.state.appLogo) ? (
                    <Button 
                      onClick={ () => this.handlePreview(this.state.appLogo) }
                      className='choose_button primary'
                      >
                      Preview
                    </Button>
                ) : (
                  (this.state.logoUploadFile) ? (
                    <Button
                      className='choose_button green'
                      disabled={false}
                      onClick={ this.handleUploadLogo }
                    >
                      { (logoUploading) ? ('Uploading') : ('Upload') }
                    </Button>
                  ) : (
                    <Upload {...uploadLogoProps}>
                      <Button 
                        className="choose_button red"
                        disabled={this.state.disabled}
                      >
                        <Icon type="upload" /> Select File
                      </Button>
                    </Upload>
                  )
                )}
              </Col>
              
              <Col span={6} className="center">
               {
                  (this.state.appLogo) ? (
                    <Row span={24} type="flex" justify="space-between" align="middle">
                      <Col span={6} className="center"> <img className="network-asset-avatar" src={ this.state.appLogo } alt=""></img> </Col>
                      <Col span={18}> <span> { this.state.appLogoTitle } </span>  </Col>
                    </Row>
                  ) : (
                    <span> { this.state.appLogoTitle } </span> 
                  )
                }
              </Col>

              <Col span={2} className="center"> <a className="icon-a" onClick={ () => this.resetAsset({ asset_url : this.state.appLogo, type : 'appLogo'  }) }><Tooltip title="Delete File"><Icon type="delete" theme="filled" style={{ fontSize: '23px', marginTop : '5px' }} /></Tooltip></a>  </Col>
            
            </Row>
            {/* End of Logo Container */}

            {/* Banner Container */}
            <Row type="flex" justify="space-around" align="middle" className="Rectangle">
              
              <Col span={4} className="ml-25"> <span> Banner </span> </Col>
              
              <Col span={2}><Popover content={ appBannerPopover } ><img className="icon-tooltip" src={ tooltip } alt="i" /></Popover> </Col>
              
              <Col span={4} />

              <Col span={4} className="center">
                { (this.state.appBanner) ? (
                    <Button 
                      onClick={ () => this.handlePreview(this.state.appBanner) }
                      className='choose_button primary'
                      >
                      Preview
                    </Button>
                ) : (
                  (this.state.bannerUploadFile) ? (
                    <Button
                      className='choose_button green'
                      disabled={false}
                      onClick={ this.handleUploadBanner }
                    >
                      { (bannerUploading) ? ('Uploading') : ('Upload') }
                    </Button>
                  ) : (
                    <Upload {...uploadBannerProps}>
                      <Button 
                        className="choose_button red"
                        disabled={this.state.disabled}
                      >
                        <Icon type="upload" /> Select File
                      </Button>
                    </Upload>
                  )
                )}
              </Col>
              
              <Col span={6} className="center">
              {
                  (this.state.appBanner) ? (
                    <Row span={24} type="flex" justify="space-around" align="middle">
                      <Col span={6} className="center"> <img className="network-asset-avatar" src={ this.state.appBanner } alt=""></img> </Col>
                      <Col span={18}> <span> { this.state.appBannerTitle } </span>  </Col>
                    </Row>
                  ) : (
                    <span> { this.state.appBannerTitle } </span> 
                  )
                }
              </Col>

              <Col span={2} className="center"> <a className="icon-a" onClick={ () => this.resetAsset({ asset_url : this.state.appBanner, type : 'appBanner'  }) }><Tooltip title="Delete File"><Icon type="delete" theme="filled" style={{ fontSize: '23px', marginTop : '5px' }} /></Tooltip></a>  </Col>
            
            </Row>
            {/* End of Banner Container */}

            <h4>Dashboard Application Asset</h4>

            {/* Dashboard Logo Container */}
            <Row type="flex" justify="space-around" align="middle" className="Rectangle">
              
              <Col span={4} className="ml-25"> <span> Logo </span> </Col>
              
              <Col span={2}><Popover content={ dashboardLogoPopover } ><img className="icon-tooltip" src={ tooltip } alt="i" /></Popover> </Col>
              
              <Col span={4} />

              <Col span={4} className="center">
                { (this.state.dashboardLogo) ? (
                    <Button 
                      onClick={ () => this.handlePreview(this.state.dashboardLogo) }
                      className='choose_button primary'
                      >
                      Preview
                    </Button>
                ) : (
                  (this.state.dashboardLogoUploadFile) ? (
                    <Button
                      className='choose_button green'
                      disabled={false}
                      onClick={ this.handleUploadDashboardLogo }
                    >
                      { (dashboardLogoUploading) ? ('Uploading') : ('Upload') }
                    </Button>
                  ) : (
                    <Upload {...uploadDashLogoProps}>
                      <Button 
                        className="choose_button red"
                        disabled={this.state.disabled}
                      >
                        <Icon type="upload" /> Select File
                      </Button>
                    </Upload>
                  )
                )}
              </Col>
              
              <Col span={6} className="center">
              {
                  (this.state.dashboardLogo) ? (
                    <Row span={24} type="flex" justify="space-around" align="middle">
                      <Col span={6} className="center"> <img className="network-asset-avatar" src={ this.state.dashboardLogo } alt=""></img> </Col>
                      <Col span={18}> <span> { this.state.dashboardLogoTitle } </span>  </Col>
                    </Row>
                  ) : (
                    <span> { this.state.dashboardLogoTitle } </span> 
                  )
                }
              </Col>

              <Col span={2} className="center"> <a className="icon-a" onClick={ () => this.resetAsset({ asset_url : this.state.dashboardLogo, type : 'dashLogo'  }) }><Tooltip title="Delete File"><Icon type="delete" theme="filled" style={{ fontSize: '23px', marginTop : '5px' }} /></Tooltip></a>  </Col>
            
            </Row>
            {/* End of Dashboard Logo Container */}

            {/* Dashboard Favicon Container */}
            <Row type="flex" justify="space-around" align="middle" className="Rectangle">
              
              <Col span={4} className="ml-25"> <span> Favicon </span> </Col>
              
              <Col span={2}><Popover content={ dashboardFaviconPopover } ><img className="icon-tooltip" src={ tooltip } alt="i" /></Popover> </Col>
              
              <Col span={4} />

              <Col span={4} className="center">
                { (this.state.dashboardFavicon) ? (
                    <Button 
                      onClick={ () => this.handlePreview(this.state.dashboardFavicon) }
                      className='choose_button primary'
                      >
                      Preview
                    </Button>
                ) : (
                  (this.state.dashboardFaviconUploadFile) ? (
                    <Button
                      className='choose_button green'
                      disabled={false}
                      onClick={ this.handleUploadDashboardFavicon }
                    >
                      { (dashboardFaviconUploading) ? ('Uploading') : ('Upload') }
                    </Button>
                  ) : (
                    <Upload {...uploadDashFaviconProps}>
                      <Button 
                        className="choose_button red"
                        disabled={this.state.disabled}
                      >
                        <Icon type="upload" /> Select File
                      </Button>
                    </Upload>
                  )
                )}
              </Col>
              
              <Col span={6} className="center">
              {
                  (this.state.dashboardFavicon) ? (
                    <Row span={24} type="flex" justify="space-around" align="middle">
                      <Col span={6} className="center"> <img className="network-asset-avatar" src={ this.state.dashboardFavicon } alt=""></img> </Col>
                      <Col span={18}> <span> { this.state.dashboardFaviconTitle } </span>  </Col>
                    </Row>
                  ) : (
                    <span> { this.state.dashboardFaviconTitle } </span> 
                  )
                }
              </Col>

              <Col span={2} className="center"> <a className="icon-a" onClick={ () => this.resetAsset({ asset_url : this.state.dashboardFavicon, type : 'dashFavicon' }) }><Tooltip title="Delete File"><Icon type="delete" theme="filled" style={{ fontSize: '23px', marginTop : '5px' }} /></Tooltip></a>  </Col>
            
            </Row>
            {/* End of Dashboard Logo Container */}

          </Row>
          
          <Divider />

          <Row gutter={12}>
            <Col span={3} style={{ padding: "0 0 0 6px" }}>
              <h4>Subscription</h4>
            </Col>
            <Col span={8}>
                <Switch disabled={this.state.disabled} checked={ this.state.subscriptionDisable } onChange={ this.handleSubscriptionUncheck.bind(this) } />
            </Col>
          </Row>

          <Row gutter={12} style={{ marginTop : '15px' }}>
            <Col span={8} style={{ padding: "0 0 0 6px" }}>

              <FormItem {...formItemLayout} label="Minimum Balance">
                <Input disabled={this.state.disabled} placeholder="Rp" value={ this.state.minimum_balance }
                  addonBefore="Rp" onChange={ e => this.setState({ minimum_balance : e.target.value }) }
                />
              </FormItem>
              
              <FormItem { ...formItemLayout } label="Subscription Type" required={ this.state.subscriptionDisable }>
                <Select showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                  disabled={ (this.state.disabled) ? (this.state.disabled) : (!this.state.subscriptionDisable) }
                  placeholder="Subscription Type"
                  value={ this.state.subscription_model_id }
                  defaultValue={ this.state.subscription_model_id }
                  onChange={ this.handleSubscriptionModel.bind(this) }
                >
                {
                  Object.keys(subscriptionModels).map((item) => {
                    return ( <Option key={ subscriptionModels[item].id } > { subscriptionModels[item].name } </Option> )
                  })
                }
                </Select>
              </FormItem>

              <FormItem {...formItemLayout} label="Periode">
                <Input disabled={true} placeholder="Periode" value={ this.state.subscriptionModel.periode }
                />
              </FormItem>

              <FormItem {...formItemLayout} label="Role">
                <Input disabled={true} placeholder="Role" value={ this.state.subscriptionModel.role }
                />
              </FormItem>
              
            </Col>

            <Col span={8} style={{ padding: "0 0 0 6px" }}>
              <FormItem {...formItemLayout} label="Subscription Fee">
                <Input disabled={true} placeholder="Rp" value={ this.state.subscriptionModel.price }
                />
              </FormItem>
              
              <FormItem {...formItemLayout} label="Agan Fee">
                <Input disabled={true} placeholder="Rp" value={ this.state.subscriptionModel.jpx_fee }
                />
              </FormItem>
              
              <FormItem {...formItemLayout} label="Network Fee">
                <Input disabled={true} placeholder="Rp" value={ this.state.subscriptionModel.network_fee }
                />
              </FormItem>
              
              <FormItem {...formItemLayout} label="Agent Fee">
                <Input disabled={true} placeholder="Rp" value={ this.state.subscriptionModel.agent_fee }
                />
              </FormItem>
              
              <FormItem {...formItemLayout} label="Upline Fee">
                <Input disabled={true} placeholder="Rp" value={ this.state.subscriptionModel.upline_fee }
                />
              </FormItem>

              <BackTop />
            </Col>
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

export default withRouter(connect(mapStateToProps, { LogUser, FormMode })(NetworkForm));
