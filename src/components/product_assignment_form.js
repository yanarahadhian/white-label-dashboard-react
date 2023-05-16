import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Form, message, Row, Col, Select } from "antd";
import { FormMode, LogUser } from '../actions';
import axios from "axios";
import { config } from "../config";
const FormItem = Form.Item;
const Option = Select.Option;

class ProductAssignmentForm extends Component {
  constructor(props){
    super(props)

    this.state = {
      isAuthorized: false,
			id: '',
			agent_id: '',
			agent_name: '',
			product_id: '',
      template: '',
      scheme: '',
			network: '',
			network_id: '',
			province: '',
			province_id: '',
			area: '',
			area_id: '',
			district: '',
			district_id: '',
			templateList: {},
			networkList: {},
			provinceList: {},
			areaList: {},
			districtList: {},
			agentList: {},
      returnPage: false,
      disabled: (this.props.location.pathname.includes("view")) ? true : false,
      api_url: config().api_url,
			config: { headers: {'token': localStorage.getItem('token')}},
			networkAgan : (this.props.user.network !== 0) ? (this.props.user.network) : (''),
		}
		this.handleNetwork = this.handleNetwork.bind(this)
    this.handleProvince = this.handleProvince.bind(this)
    this.handleArea = this.handleArea.bind(this)
		this.handleAgentList = this.handleAgentList.bind(this)
		this.handleScheme = this.handleScheme.bind(this)
		this.handleTemplate = this.handleTemplate.bind(this)
		this.handleAgent = this.handleAgent.bind(this)
  }

  validateForm() {
    return this.state.product_id === "" || this.state.scheme === "" || this.state.network === "" || this.state.area === "" || this.state.province === "" || this.state.agent_id === "";
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
    
    if (isAuthorized) {
      let id = this.props.match.params.id
      
      if (id) {
        let url = api_url + '/api/product_assignment/?id=' + id
        axios.get(url, config)
          .then((response) => {
              this.setState({
								id: response.data.ResponseData[0].id,
								agent_id: response.data.ResponseData[0].user_id,
								product_id: response.data.ResponseData[0].product_id,
								agent_name: response.data.ResponseData[0].agent_name,
								network_id: response.data.ResponseData[0].network_id,
								area_id: response.data.ResponseData[0].area_id,
								district_id: response.data.ResponseData[0].district_id,
								network: response.data.ResponseData[0].network,
                template: response.data.ResponseData[0].template,
								scheme: (response.data.ResponseData[0].scheme === 0) ? "Fee Based" : "Subscription"
              }, () => {

								// GET AREA AND PROVINCE
								let area_id = response.data.ResponseData[0].area_id
              
								axios.get(api_url + '/api/area/?id='+ area_id, config)
								.then((response) => {
										this.setState({
											area: response.data.ResponseData[0].area,
											province_id: response.data.ResponseData[0].province_id
										}, () => {
											let province_id = response.data.ResponseData[0].province_id
											
											axios.get(api_url + '/api/area/?province_id=' + province_id, config)
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
			
											axios.get(api_url+'/api/province/?id='+ province_id, config)
											.then((response) => {
													this.setState({
														province: response.data.ResponseData[0].province_name
													}, () => {
														let url = api_url + '/api/district/?province_id=' + province_id + '&area_id=' + area_id
														axios.get(url, config)
														.then((response) => {
															if (response.data.ResponseCode === '200') {
																	this.setState({ districtList: response.data.ResponseData })
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
											district: response.data.ResponseData[0].district_name
										})
									}else {
										this.setState({
											district: ''
										})
									}
									
								}, (err) => {
									console.error(err)
								})

								// GET TEMPLATE PRODUCT LIST
								let url = api_url + '/api/recent_product/?page=all&size=0&scheme=' + response.data.ResponseData[0].scheme
								axios.get(url, config)
									.then((response) => {
										if (response.data.ResponseCode === '200') {
											this.setState({ templateList: response.data.ResponseData })
										}
								}).catch((err) => {
									console.log(err)
								})

								// GET AGENT LIST
								this.handleAgentList()

								// GET DEFAULT UPLINE NETWORK
								let network = response.data.ResponseData[0].network_id
								axios.get(api_url + '/api/network/?id=' + network, config)
								.then((response) => {
									if (response.data.ResponseCode === "200") {
										let userId = response.data.ResponseData[0].upline
										axios.get(api_url + '/api/users/?id=' + userId, config)
										.then((response) => {
											if (response.data.ResponseCode === "200") {
												const dataAgent = [];
												if (response.data.ResponseData[0]) {
													dataAgent.push(response.data.ResponseData[0])
												}
												
												this.state.agentList.forEach(element => {
													dataAgent.push(element)
												});
												
												this.setState({ agentList: dataAgent })
												
											}
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

  async handleSubmit (e){
    e.preventDefault();
    this.setState({ isLoading: true })

    if(this.validateForm() === true){
      message.error("Please fill all required fields")
      return false
    } else {
      let { api_url, config, returnPage } = this.state
      let url = api_url + '/api/product_assignment/'
      let data = {
        id: this.state.id,
        user_id: this.state.agent_id,
        product_id: this.state.product_id,
      }

      if (this.props.match.params.id) {
        try {
          axios.put(url, data, config)
          .then((response) => {
              if(response.data.ResponseCode==="200"){
                message.success(response.data.ResponseDesc)
                if(returnPage){
                  this.props.history.push({pathname: '/product_assignment'})    
                }
                
              }else {
  
                if (response.data.status === '401') {
                    message.error('Login Authentication Expired. Please Login Again!')
                  
                } else {
                  let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : ""
                  message.error(msg)
                  
                  this.setState({ isLoading: false })
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
      }else{
        try {
          axios.post(url, data, config)
          .then((response) => {
              if(response.data.ResponseCode==="200"){
                message.success(response.data.ResponseDesc)
                if(returnPage){
                  this.props.history.push({pathname: '/product_assignment'})    
                }
                
              }else {
  
                if (response.data.status === '401') {
                    message.error('Login Authentication Expired. Please Login Again!')
                  
                } else {
                  let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : ""
                  message.error(msg)
                  
                  this.setState({ isLoading: false })
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
	}

	handleNetwork(e, key){
		this.setState({
			network: e,
			network_id: key.key,
			agent_id: '',
			agent_name: '',
			province: '',
			province_id: '',
			area: '',
			area_id: '',
			district: '',
			district_id: '',
			areaList: {},
			districtList: {},

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
			province_id: key.key,
			agent_id: '',
			agent_name: '',
			area: '',
			area_id: '',
			district: '',
			district_id: '',
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
			agent_id: '',
			agent_name: '',
			district: '',
			district_id: '',
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
			district: e,
			agent_id: '',
			agent_name: '',
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
	
	handleScheme(e){
    this.setState({
			scheme: e,
			product_id: '',
			template: ''
    }, () => {
			let { api_url, config, scheme } = this.state
			let url = api_url + '/api/recent_product/?page=all&size=0&scheme=' + scheme
			axios.get(url, config)
				.then((response) => {
					if (response.data.ResponseCode === '200') {
						this.setState({ templateList: response.data.ResponseData })
					}
			}).catch((err) => {
				console.log(err)
			})
		})
	}

	handleTemplate(e, key){
    this.setState({
			product_id: key.key,
			template: e
    })
	}

	handleAgent(e, key){
    this.setState({
			agent_id: key.key,
			agent_name: e
    })
	}
  
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

    var provinces = this.state.provinceList
    var areas = this.state.areaList
    var districts = this.state.districtList
		var networks = this.state.networkList
		var templates = this.state.templateList
		var agents = this.state.agentList

    if(this.state.isAuthorized){
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
                      pathname : '/product_assignment'
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
                      pathname : '/product_assignment'
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
								<FormItem {...formItemLayout} label="Province" required={true}>
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
								<FormItem {...formItemLayout} label="City" required={true}>
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
                <FormItem {...formItemLayout} label="District" >
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
								<FormItem {...formItemLayout} label="Agent" required={true}>
                    <Select showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                      placeholder="Agent" value={this.state.agent_name} defaultValue={this.state.agent_name}
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
								<FormItem {...formItemLayout} label="Scheme" required={true}>
                    <Select placeholder="Scheme" value={this.state.scheme} disabled={this.state.disabled}
											onChange={this.handleScheme.bind(this)}
                      defaultValue={this.state.scheme}
                    >
                      <Option key="1" value="0">Fee Based</Option>
                      <Option key="2" value="1">Subscription</Option>
                    </Select>
                </FormItem>
								<FormItem {...formItemLayout} label="Template" required={true}>
                    <Select showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                      placeholder="Template" value={this.state.template} defaultValue={this.state.template}
											onChange={this.handleTemplate.bind(this)}
											disabled={this.state.disabled}
                    >
                    {
                      Object.keys(templates).map((item) => {
                        return (<Option key={templates[item].id} >{templates[item].template}</Option>)
                      })
                    }
                    </Select>
                </FormItem>


                
              </Col>
						</Row>
        </Form>
      )
    }
    else{
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

export default withRouter(connect(mapStateToProps, { LogUser, FormMode })(ProductAssignmentForm));
