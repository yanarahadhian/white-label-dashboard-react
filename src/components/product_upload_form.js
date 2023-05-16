import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Input, Form, Row, Col, message, Select, Divider, Checkbox, Upload, Icon, Tooltip, Popover } from "antd";
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import { FormMode, LogUser } from '../actions';
import axios from "axios";
import { config } from "../config";
import moment from 'moment'
const FormItem = Form.Item;
const Option = Select.Option;

class ProductUploadForm extends Component {
  constructor(props){
    super(props)

    this.state = {
      isAuthorized: false,
      id: '',
      product_type_id: '',
      product_type: '',
      biller_host_id: '',
      biller_host: '',
      user_id: [],
      filename: '',
      file_url: '',
      created_by: this.props.user.name,
      created_at: '',
      network: '',
      area: '',
			agent: [],
			productTypeList: {},
      billerList: {},
			networkList: {},
			provinceList: {},
			areaList: {},
			districtList: {},
			agentList: [],
      dataLog: [],
      maxUploadSize : 1000000,
      productUploadFile : '',
      productUploading : false,
      appProduct : '',
      appProductTitle : 'No File Uploaded',
      uploadData: [],
      totRow: '',
      totUpRow: '',
      errRow: '',
			style: (this.props.location.pathname.includes("view")) ? 'block' : 'none',
      returnPage: false,
      disabled: (this.props.location.pathname.includes("view")) ? true : false,
      api_url: config().api_url,
      config: { headers: {'token': localStorage.getItem('token')}},
      asset_url: config().asset_url.aws
		}
		
		this.handleNetwork = this.handleNetwork.bind(this)
    this.handleProvince = this.handleProvince.bind(this)
    this.handleArea = this.handleArea.bind(this)
		this.handleAgentList = this.handleAgentList.bind(this)
		this.handleAgent = this.handleAgent.bind(this)
    this.handleCheckbox = this.handleCheckbox.bind(this)
    this.handleSubmitUploadData = this.handleSubmitUploadData.bind(this)
    this.loadProductUploadLog = this.loadProductUploadLog.bind(this)

    // --- Upload File ---
    this.handleUploadFile = this.handleUploadFile.bind(this)
    this.handleUploadProduct = this.handleUploadProduct.bind(this)
    this.validateFile = this.validateFile.bind(this)
    this.resetAsset = this.resetAsset.bind(this)
	}
	
	validateForm() {
    return this.state.product_type_id === "" || this.state.biller_host_id === "" || this.state.appProduct === "";
  }

  componentWillMount() {
    let rights = this.props.user.rights
    let page_url = this.props.match.url
    let authorize = false

    for (let item in rights) {
      let isInclude = page_url.includes(rights[item].page_url)
      
      if (isInclude) {
        let isModeAdd = page_url.includes("/new")
				let isModeRead = page_url.includes("/view")

        if (isModeAdd && rights[item].create === 1) {
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

    if (isAuthorized) {
      let id = this.props.match.params.id

      if (id) {
				let url = api_url + '/api/recent_product_upload/?id=' + id
				
        axios.get(url, config)
          .then((response) => {
              this.setState({
                id: response.data.ResponseData[0].id,
                product_type_id: response.data.ResponseData[0].product_type_id,
                product_type: response.data.ResponseData[0].product_type,
                biller_host_id: response.data.ResponseData[0].biller_host_id,
                biller_host: response.data.ResponseData[0].biller_host,
                user_id: response.data.ResponseData[0].user_id,
                filename: response.data.ResponseData[0].filename,
                file_url: response.data.ResponseData[0].file_url,
                created_by: response.data.ResponseData[0].created_by,
                created_at: response.data.ResponseData[0].created_at,
                network: response.data.ResponseData[0].network,
                area: response.data.ResponseData[0].area,
                agent: response.data.ResponseData[0].agent,
              })
          }, (err) => {
            console.error(err)
					})
					
          // PRODUCT UPLOAD LOGS

            let producLogUrl = api_url + `/api/recent_product_upload_log/`+ id
            this.loadProductUploadLog(producLogUrl)       

			}
			
			// PRODUCT TYPE LIST
			axios.get(api_url+'/api/recent_product/listProductType', config)
			.then((response) => {
					this.setState({
						productTypeList: response.data.ResponseData
					})
			}, (err) => {
				console.error(err)
			})

			// BILLER LIST
			axios.get(api_url+'/api/biller/', config)
				.then((response) => {
						this.setState({
							billerList: response.data.ResponseData
						})
				}, (err) => {
					console.error(err)
				})

			// GET NETWORK LIST
				axios.get(api_url+'/api/network/?page=all&size=0', config)
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

    }
  }

  loadProductUploadLog(producLogUrl){
    let { config } = this.state
    axios.get(producLogUrl, config)
      .then((response) => {
          if (response.data.ResponseCode === "200") {
            this.setState({
              dataLog : response.data.ResponseData
            })
          }else{
            this.setState({
              dataLog : []
            })
          }
          
      }, (err) => {
          console.log(err)
      })
  }

  async handleSubmit (e){
    e.preventDefault();
    this.setState({ isLoading: true })

    if(this.validateForm() === true){
      message.error("Please fill all required fields")
      return false
    } else {
      let { api_url, config, user_id } = this.state

      const formData = new FormData();
      formData.append('file', this.state.productUploadFile)

      try {
        axios.post(api_url+'/api/recent_product_upload/validationCsv', formData, { headers : { 'Content-Type': 'multipart/form-data', 'token' : this.state.config.headers.token } })
        .then((response) => {
          if(response.data.ResponseCode==="500"){
            message.error(response.data.ResponseDesc)
            this.setState({
              uploadData: {}
            })
          } else {
            this.setState({
              uploadData: response.data.ResponseData,
              totRow: response.data.ResponseDesc[0],
              totUpRow: response.data.ResponseDesc[1],
              errRow: response.data.ResponseDesc[2],
            })

            var confirm = window.confirm("There are "+this.state.totRow+" rows in the uploaded file. "+this.state.totUpRow+" rows to be upload and Invalid in rows ["+this.state.errRow+"]. Continue to import?");
            if (confirm) {
              
              // Import Product From File CSV and Assignment Product

              this.state.uploadData.forEach(element => {
                let dataProduct = {
                  product_type_id: this.state.product_type_id,
                  biller_host_id: this.state.biller_host_id,
                  user_create: this.state.created_by,
                  status: 'ENABLE',
                  template: element.template,
                  scheme: element.scheme,
                  sku: element.sku,
                  product_name: element.product_name,
                  operator: element.operator,
                  start_date_time: element.start_date_time,
                  end_date_time: element.end_date_time,
                  harga_biller: element.harga_biller,
                  fee_jpx: element.fee_jpx,
                  fee_agent: element.fee_agent,
                  fee_loper: element.fee_loper,
                  selling_price: element.selling_price,
                  max_admin: element.max_admin,
                  point_loper: element.point_loper,
                  point_agent:  element.point_agent,
                  description: element.description
                }

                const products = () => {
                  return new Promise((resolve, reject) => {
                    let productUrl = api_url + '/api/recent_product/'
                    axios.post(productUrl, dataProduct, config)
                    .then((response) => {
                      if (response.data.ResponseCode === "200") {
                        resolve(response.data.ResponseData)
                      } else {
                        if (response.data.status === '401') {
                          this.setState({ isAuthorized : false }, () => {
                            message.error('Login Authentication Expired. Please Login Again!')
                          })
                        }else{
                          let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : ""
                          message.error(msg)
                        }
                      }
                    })
                    .catch((error) => {
                      console.log(error)
                      reject(error)
                    })
                  })
                }

                products().then(productId => {
                  if (user_id) {
                    user_id.forEach(element => {
                      let assigmentUrl = api_url + '/api/product_assignment/'
                      let assignmentData = {
                        user_id: element.key,
                        product_id: productId.insertId
                      }
                      
                      axios.post(assigmentUrl, assignmentData, config)
                      .then((response) => {
                        if (response.data.ResponseCode === "200") {
                          message.success("Import products and assignment product success!");
                        } else {
                          if (response.data.status === '401') {
                            this.setState({ isAuthorized : false }, () => {
                              message.error('Login Authentication Expired. Please Login Again!')
                            })
                          }
                        }
                      }, (err) => {
                        console.error(err)
                      }) 
                    })
                  }
                })

              })

              // Create Upload data and Upload logs

              if (user_id.length > 0){
                user_id.forEach(element => {
                  let data = {
                    product_type_id: this.state.product_type_id,
                    biller_host_id: this.state.biller_host_id,
                    user_id: element.key,
                    filename: this.state.appProductTitle,
                    file_url: this.state.appProduct,
                    status: 'DONE',
                    created_by: this.state.created_by
                  }
                  this.handleSubmitUploadData(data)
                });
              }else{
                let data = {
                  product_type_id: this.state.product_type_id,
                  biller_host_id: this.state.biller_host_id,
                  filename: this.state.appProductTitle,
                  file_url: this.state.appProduct,
                  status: 'DONE',
                  created_by: this.state.created_by
                }
                this.handleSubmitUploadData(data)
              }
            }
          }
        })
      } catch (e) {
          message.error(e.data.ResponseDesc)
          this.setState({ isLoading: false })
      }
    }
  }
  
  handleSubmitUploadData(data){
    let { api_url, config, uploadData } = this.state
    let url = api_url + '/api/recent_product_upload/'
     
    const pmIds = () => {
      return new Promise((resolve, reject) => {
        axios.post(url, data, config)
        .then((response) => {
          if (response.data.ResponseCode === "200") {
            resolve(response.data.ResponseData)
          } else {
            if (response.data.status === '401') {
              this.setState({ isAuthorized : false }, () => {
                message.error('Login Authentication Expired. Please Login Again!')
              })
            }
          }
        })
        .catch((error) => {
          console.log(error)
          reject(error)
        })
      })
    }

    pmIds().then(dataId => {
      let logUrl = api_url + '/api/recent_product_upload_log/'
      uploadData.forEach(element => {
        let dataUpload = {
          product_model_upload_id: dataId.insertId,
          template: element.template,
          scheme: element.scheme,
          sku: element.sku,
          product_name: element.product_name,
          operator: element.operator,
          start_date_time: element.start_date_time,
          end_date_time: element.end_date_time,
          harga_biller: element.harga_biller,
          fee_jpx: element.fee_jpx,
          fee_agent: element.fee_agent,
          fee_loper: element.fee_loper,
          selling_price: element.selling_price,
          max_admin: element.max_admin,
          point_loper: element.point_loper,
          point_agent:  element.point_agent,
          description: element.description
        }
        
        axios.post(logUrl, dataUpload, config)
          .then((response) => {
            if (response.data.ResponseCode === "200") {
              message.success("Upload products success!");
            } else {
              if (response.data.status === '401') {
                this.setState({ isAuthorized : false }, () => {
                  message.error('Login Authentication Expired. Please Login Again!')
                })
              }
            }
          }, (err) => {
            console.error(err)
          })
      });
    })
  }

	handleProductType(e, key){
    this.setState({
      product_type_id: key.key,
      product_type: e
    })
	}
	
	handleBiller(e, key){
    this.setState({
      biller_host_id: key.key,
      biller_host: e
    })
	}
	
	handleNetwork(e, key){
		this.setState({
			network: e,
			network_id: key.key

		}, () => {
			let { api_url, config } = this.state

			axios.get(api_url+'/api/network/?id=' + key.key, config)
				.then((response) => {
					let userId = response.data.ResponseData[0].upline
					if( userId !== null ){
						axios.get(api_url + '/api/users/?id=' + userId, config)
						.then((response) => {
							if (response.data.ResponseCode === "200") {
								this.setState({
									agentList: response.data.ResponseData
								})
							}
						})
					}else{
						this.setState({ agentList: [] })
					}
				}, (err) => {
					console.error(err)
				})

			this.handleAgentList()
		})
  }
	
	handleProvince(e, key){
    this.setState({
			province: e,
			province_id: key.key
    })
    
    let { api_url, config } = this.state
    let url = api_url + '/api/area/?province_id=' + key.key

    axios.get(url, config)
      .then((response) => {

          if (response.data.ResponseCode === '200') {
              this.setState({ areaList: response.data.ResponseData })
          } else {
						message.error(response.data.ResponseDesc)
						this.setState({ areaList: [] })
          }
      })
      .catch((err) => {
          console.log(err)
      })

    
	}

	handleArea(e, key){
    this.setState({
      area_id: key.key,
			area: e,
    }, () => {
      this.handleAgentList()
    })

    let { api_url, config, province_id } = this.state
    let url = api_url + '/api/district/?province_id=' + province_id + '&area_id=' + key.key

    axios.get(url, config)
      .then((response) => {
        if (response.data.ResponseCode === '200') {
            this.setState({ districtList: response.data.ResponseData })
        } else {
					message.error(response.data.ResponseDesc)
					this.setState({ districtList: [] })
        }
      })
      .catch((err) => {
          console.log(err)
      })

	}
	
	handleDistrict(e, key){
    this.setState({
      district_id: key.key,
			district: e
    }, () => {
      this.handleAgentList()
    })
	}
	
	handleAgentList() {
		let { api_url, config, network_id, area_id, district_id } = this.state
    if (network_id === '' || area_id === '' ) {
      message.info('Select Network and Area value to get the Agent list')
    } else {
        let url = ''
        if (district_id) {
            url = api_url + '/api/users/uplines?area=' + area_id + '&network=' + network_id  + '&district_id=' + district_id  
        } else{
            url = api_url + '/api/users/uplines?area=' + area_id + '&network=' + network_id
				}

        let dataAgent = [];
        axios.get(url, config)
        .then((response) => {
            if (response.data.ResponseCode === '200') {

                if (this.state.agentList[0]) {
									dataAgent.push(this.state.agentList[0])
                }
                
                response.data.ResponseData.forEach(element => {
									dataAgent.push(element)
								});
								
                this.setState({ agentList: dataAgent })
            } else {
								axios.get(api_url+'/api/network/?id=' + network_id, config)
								.then((response) => {
									let userId = response.data.ResponseData[0].upline
									if( userId !== null ){
										axios.get(api_url + '/api/users/?id=' + userId, config)
										.then((response) => {
											if (response.data.ResponseCode === "200") {
												this.setState({
													agentList: response.data.ResponseData
												})
											}
										})
									}else{
										this.setState({ agentList: [] }, () => {
											message.info('No Agent List on selected values!')
										})
									}
								}, (err) => {
									console.error(err)
								})
                
            }
        })
        .catch((err) => {
            console.log(err)
        })
    }
	}

	handleAgent(e, key){
    this.setState({
			user_id: key,
			agent: e
    })
	}

	_dateFormat(field){ return moment(field, "YYYY-MM-DD HH:mm:ss").format("DD/MM/YYYY HH:mm:ss") }

	handleCheckbox(e) {
		if (e.target.checked === true){
			this.setState({
				style: 'block',
			})
		}else{
			this.setState({
				style: 'none',
			})
		}
		
  }

  // Upload Files

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
          appProduct : (type === 'appProduct') ? ('') : (state.appProduct),
          appProductTitle : (type === 'appProduct') ? ('No File Uploaded') : ((state.appProduct) ? (this.assetFormatter(state.appProduct)) : ('No File Uploaded')),
          productUploadFile : (type === 'appProduct') ? ('') : (state.productUploadFile)
        }
      })
    }
  }

  handleUploadFile(formData) {
    let { api_url } = this.state

    const url = api_url + '/api/asset/uploadFileCsv'

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
              productUploading: false
            }, () => {
              message.error('Upload Failed!')
            })
          }
        }
      })
      .catch((error) => {
        this.setState({
          productUploading: false
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

  validateFile(file) {
    let { maxUploadSize } = this.state
    let validate = false
    let csvType = file.name.includes("csv")

    if (csvType) {
      validate = true
    } else {
      message.info("File type is invalid. Only CSV types are allowed")
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

  async handleUploadProduct(event) {
    event.preventDefault()

    const formData = new FormData()

    if (this.state.productUploadFile) {
      await formData.append('file', this.state.productUploadFile)
      this.setState({ productUploading : true })
      let response = await this.handleUploadFile(formData)

      this.setState({
        appProduct : response.data.ResponseData.Location,
        productUploading : false
      }, () => {
        message.success('Upload File Product successful. Save to create impact.')
      })
    } else {
      message.error('No File File Choosen!')
    }
  }

  buttonFormatter(cell, row){
    var del = <a onClick={()=>this.deleteRow(row)} style={{ marginLeft: '5px'}}><Tooltip title="Delete"><Icon type="delete" /></Tooltip></a>;

		return <div>{del}</div>
  }

  deleteRow(row) {
    let { id, api_url, config } = this.state
    
    var remove = window.confirm("Do you want to delete this data ?");
    if(remove){
      let url = api_url + '/api/recent_product_upload_log/?id=' + row.id 
      axios.delete(url, config)
        .then((response) => {
            if(response.data.ResponseCode==="500"){
              message.error(response.data.ResponseDesc.sqlMessage);
            } else {
              message.success(response.data.ResponseDesc);
              let producLogUrl = api_url + `/api/recent_product_upload_log/`+ id
              this.loadProductUploadLog(producLogUrl)
            }
        }, (err) => {
          message.error(err.data.ResponseDesc);
          console.error(err)
          return false
        })
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

		var billers = this.state.billerList
		var productTypes = this.state.productTypeList
		var provinces = this.state.provinceList
    var areas = this.state.areaList
    var districts = this.state.districtList
		var networks = this.state.networkList
    var agents = this.state.agentList
    
    // ------ Assets Props -----
    
    const tooltip = config().asset_url.tooltip
    const { isAuthorized, productUploadFile, productUploading } = this.state
    const productPopover = ( <span> Upload File Products (Only CSV file) </span> )
    const uploadProps = { multiple : false, showUploadList : false }

    const uploadProductProps = {
      ...uploadProps,
      beforeUpload : async (file) => {

        let validate = await this.validateFile(file)

        if (validate) {
          this.setState(state => ({ 
            productUploadFile: file,
            appProductTitle : file.name
          }))
        }
      },
      productUploadFile
    }

		let detailField;

    if (this.props.mode === "view") {
      detailField = <Col span={8} style={{ padding: "0 0 0 6px" }}>
			<FormItem {...formItemLayout} label="Filename">
					<Input placeholder="Filename" value={this.state.filename} disabled={this.state.disabled}
						onChange={e => this.setState({ filename: e.target.value })}
					/>
			</FormItem>
			<FormItem {...formItemLayout} label="Created By">
					<Input placeholder="Created By" value={this.state.created_by} disabled={this.state.disabled}
						onChange={e => this.setState({ created_by: e.target.value })}
					/>
			</FormItem>
			<FormItem {...formItemLayout} label="Uploaded At">
					<Input placeholder="Uploaded At" value={this.state.created_at} disabled={this.state.disabled}
						onChange={e => this.setState({ created_at: e.target.value })}
					/>
			</FormItem>
		</Col>
    } else {
      detailField = '';
		}

		let header;

    if (this.props.mode === "view") {
      header = <Row gutter={12}>
      <Col span={8} style={{ padding: "0 0 0 6px" }}>
        <h4>Product Upload Logs</h4>
      </Col>
    </Row>
    } else {
      header = <Row gutter={12}>
      <Col span={8} style={{ padding: "0 0 0 6px" }}>
        <h4>Upload Products</h4>
      </Col>
    </Row>
    }
    
		
		const dataLog = this.state.dataLog
		let details;
		if (this.props.mode === "view") {
      details = <Col>
        <BootstrapTable data={dataLog}>
					<TableHeaderColumn dataField='id' isKey={true} hidden></TableHeaderColumn>
					<TableHeaderColumn dataField='template' dataAlign='center' width='100px' > Template </TableHeaderColumn>
					<TableHeaderColumn dataField='scheme' dataAlign='center' width='100px' > Scheme </TableHeaderColumn>
					<TableHeaderColumn dataField='sku' dataAlign='center' width='100px' > SKU </TableHeaderColumn>
					<TableHeaderColumn dataField='product_name' dataAlign='center' width='150px' > Product Name </TableHeaderColumn>
					<TableHeaderColumn dataField='operator' dataAlign='center' width='125px' > Operator </TableHeaderColumn>
					<TableHeaderColumn dataField='start_date_time' dataFormat={ this._dateFormat.bind(this) } dataAlign='center' width='175px' > Start Date </TableHeaderColumn>
					<TableHeaderColumn dataField='end_date_time' dataFormat={ this._dateFormat.bind(this) } dataAlign='center' width='175px' > End Date </TableHeaderColumn>
					<TableHeaderColumn dataField='harga_biller' dataAlign='center' width='100px' > Harga Biller </TableHeaderColumn>
					<TableHeaderColumn dataField='fee_jpx' dataAlign='center' width='100px' > Fee JPX </TableHeaderColumn>
					<TableHeaderColumn dataField='fee_agent' dataAlign='center' width='100px' > Fee Agent </TableHeaderColumn>
					<TableHeaderColumn dataField='fee_loper' dataAlign='center' width='100px' > Fee Loper </TableHeaderColumn>
					<TableHeaderColumn dataField='selling_price' dataAlign='center' width='100px' > Selling Price </TableHeaderColumn>
					<TableHeaderColumn dataField='max_admin' dataAlign='center' width='100px' > Max Admin </TableHeaderColumn>
					<TableHeaderColumn dataField='point_loper' dataAlign='center' width='100px' > Point Loper </TableHeaderColumn>
					<TableHeaderColumn dataField='point_agent' dataAlign='center' width='100px' > Point Agent </TableHeaderColumn>
					<TableHeaderColumn dataField='description' dataAlign='center' width='350px' > Description </TableHeaderColumn>
          <TableHeaderColumn dataField="button" dataFormat={this.buttonFormatter.bind(this)} dataAlign="center" width='100px'>Actions</TableHeaderColumn>
        </BootstrapTable>
      </Col>
    } else {
      details = <Row gutter={12} >
      {/* Upload Container */}
      <Row type="flex" justify="space-around" align="middle" className="Rectangle">
        
        <Col span={4} className="ml-25"> <span> Upload Products </span> </Col>
        
        <Col span={2}><Popover content={ productPopover } ><img className="icon-tooltip" src={ tooltip } alt="i" /></Popover> </Col>
        
        <Col span={4} />

        <Col span={4} className="center">
          { (this.state.appProduct) ? (
              ''
          ) : (
            (this.state.productUploadFile) ? (
              <Button
                className='choose_button primary'
                disabled={false}
                onClick={ this.handleUploadProduct }
              >
                { (productUploading) ? ('Uploading') : ('Upload') }
              </Button>
            ) : (
              <Upload {...uploadProductProps}>
                <Button 
                  className="choose_button primary"
                  disabled={this.state.disabled}
                >
                  <Icon type="upload" /> Select File
                </Button>
              </Upload>
            )
          )}

        </Col>
        
        <Col span={6} className="center">
          <Row span={24} type="flex" justify="space-between" align="middle">
            <Col span={18}> <span> { this.state.appProductTitle } </span>  </Col>
          </Row>
        </Col>

        <Col span={2} className="center"> <a className="icon-a" onClick={ () => this.resetAsset({ asset_url : this.state.appProduct, type : 'appProduct'  }) }><Tooltip title="Delete File"><Icon type="delete" theme="filled" style={{ fontSize: '23px', marginTop : '5px' }} /></Tooltip></a>  </Col>
      
      </Row>
      {/* End of Upload Container */}
    </Row>
		}
		
		let checkBox;
		if (this.props.mode === "add") {
			checkBox = <Row gutter={12}>
			<Col span={8} style={{ margin: "15px 0px 15px 235px" }}>
				<Checkbox onChange={this.handleCheckbox}>Select Agent</Checkbox>
			</Col>
		</Row>
		}else{
			checkBox = '';
		}
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
                        pathname : '/recent_product_uploads'
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
                        pathname : '/recent_product_uploads'
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
                <FormItem {...formItemLayout} label="Type" required={true}>
                      <Select placeholder="Type" value={this.state.product_type} disabled={this.state.disabled}
                        onChange={this.handleProductType.bind(this)}
                      >
                      {
                        Object.keys(productTypes).map((item) => {
                          return (<Option key={productTypes[item].id} value={productTypes[item].product_type}>{productTypes[item].product_type}</Option>)
                        })
                      }
                      </Select>
                </FormItem>
                <FormItem {...formItemLayout} label="Host" required={true}>
                    <Select placeholder="Host" value={this.state.biller_host} disabled={this.state.disabled}
                      onChange={this.handleBiller.bind(this)}
                    >
                    {
                      Object.keys(billers).map((item) => {
                        return (<Option key={billers[item].id} value={billers[item].name}>{billers[item].name}</Option>)
                      })
                    }
                    </Select>
                </FormItem>

                {checkBox}

                <FormItem {...formItemLayout} label="Network" style={{ display: this.state.style }}>
                      <Select showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0} 
                      placeholder="Network" value={this.state.network} defaultValue={this.state.network}
                      onChange={this.handleNetwork}
                      disabled={this.state.disabled}
                      >
                      {
                        Object.keys(networks).map((item) => {
                          return (<Option key={networks[item].id} value={networks[item].network}>{networks[item].network}</Option>)
                        })
                      }
                      </Select>
                  </FormItem>
                  <FormItem {...formItemLayout} label="Province" style={{ display: this.state.style }}>
                      <Select showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                        placeholder="Province" value={this.state.province} defaultValue={this.state.province}
                        onChange={this.handleProvince.bind(this)}
                        disabled={this.state.disabled}
                      >
                      {
                        Object.keys(provinces).map((item) => {
                          return (<Option key={provinces[item].id} >{provinces[item].province_name}</Option>)
                        })
                      }
                      </Select>
                  </FormItem>
                  <FormItem {...formItemLayout} label="City" style={{ display: this.state.style }}>
                      <Select showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                        placeholder="City" value={this.state.area} defaultValue={this.state.area}
                        onChange={this.handleArea.bind(this)}
                        disabled={this.state.disabled}
                      >
                      {
                        Object.keys(areas).map((item) => {
                          return (<Option key={areas[item].id} >{areas[item].area}</Option>)
                        })
                      }
                      </Select>
                  </FormItem>
                  <FormItem {...formItemLayout} label="District" style={{ display: this.state.style }}>
                      <Select showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                        placeholder="District" value={this.state.district} defaultValue={this.state.district}
                        onChange={this.handleDistrict.bind(this)}
                        disabled={this.state.disabled}
                      >
                      {
                        Object.keys(districts).map((item) => {
                          return (<Option key={districts[item].id} >{districts[item].district_name}</Option>)
                        })
                      }
                      </Select>
                  </FormItem>
                  <FormItem {...formItemLayout} label="Agent" style={{ display: this.state.style }}>
                      <Select showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                        mode="multiple"
                        placeholder="Agent" value={(this.state.agent !== null) ? this.state.agent : ''}
                        onChange={this.handleAgent.bind(this)}
                        disabled={this.state.disabled}
                      >
                      {
                        Object.keys(agents).map((item) => {
                          return (<Option key={agents[item].id} value={agents[item].name}>{agents[item].name}</Option>)
                        })
                      }
                      </Select>
                  </FormItem>
                
              </Col>
              {detailField}
            </Row>

            <Divider />
            
            {header}

            <Row gutter={12}>
                {details}
            </Row>
            
          </Form>
      );
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

export default withRouter(connect(mapStateToProps, { LogUser, FormMode })(ProductUploadForm));
