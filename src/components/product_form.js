import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Input, Form, message, Row, Col, Select, DatePicker } from "antd";
import { FormMode, LogUser } from '../actions';
import axios from "axios";
import moment from "moment";
import { config } from "../config";
import TextArea from 'antd/lib/input/TextArea';
import NumberFormat from 'react-number-format';
const FormItem = Form.Item;
const Option = Select.Option;

class ProductForm extends Component {
  constructor(props){
    super(props)

    this.state = {
      isAuthorized: false,
      id: '',
      template: '',
      scheme: '',
      product_type: '',
      product_type_id: '',
      sku: '',
      product_name: '',
      operator: '',
      created_at: '',
      start_date_time: '',
      end_date_time: '',
      biller_host_id: '',
      biller_name: '',
      harga_biller: '0',
      fee_jpx: '0',
      fee_agent: '0',
      fee_loper: '0',
      selling_price: '0',
      max_admin: '0',
      point_agent: '0',
      point_loper: '0',
      description: '',
      status: 'ENABLE',
      user_create: (props.user.name) ? (props.user.name) : '',
      productTypeList: {},
      billerList: {},
      returnPage: false,
      disabled: (this.props.location.pathname.includes("view")) ? true : false,
      api_url: config().api_url,
      config: { headers: {'token': localStorage.getItem('token')}},
    }
    this.handleSellingPrice = this.handleSellingPrice.bind(this)
  }

  validateForm() {
    return this.state.template === "" || this.state.scheme === "" || this.state.product_type_id === "" || this.state.sku === "" || this.state.product_name === "" || this.state.operator === "" || this.state.biller_name === "" || this.state.start_date_time === "" ||  this.state.end_date_time === "" ;
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
        let url = api_url + '/api/recent_product/?id=' + id
        axios.get(url, config)
          .then((response) => {
              this.setState({
                id: response.data.ResponseData[0].id,
                template: response.data.ResponseData[0].template,
                scheme: (response.data.ResponseData[0].scheme === 0) ? "Fee Based" : "Subscription",
                product_type_id: response.data.ResponseData[0].product_type_id,
                product_type: response.data.ResponseData[0].product_type,
                sku: response.data.ResponseData[0].sku,
                product_name: response.data.ResponseData[0].product_name,
                operator: response.data.ResponseData[0].operator,
                created_at: response.data.ResponseData[0].created_at,
                start_date_time: response.data.ResponseData[0].start_date_time,
                end_date_time: response.data.ResponseData[0].end_date_time,
                biller_host_id: response.data.ResponseData[0].biller_host_id,
                biller_name: response.data.ResponseData[0].biller_name,
                harga_biller: response.data.ResponseData[0].harga_biller,
                fee_jpx: response.data.ResponseData[0].fee_jpx,
                fee_agent: response.data.ResponseData[0].fee_agent,
                fee_loper: response.data.ResponseData[0].fee_loper,
                selling_price: response.data.ResponseData[0].harga_biller + response.data.ResponseData[0].fee_jpx + response.data.ResponseData[0].fee_agent + response.data.ResponseData[0].fee_loper,
                max_admin: response.data.ResponseData[0].max_admin,
                point_agent: response.data.ResponseData[0].point_agent,
                point_loper: response.data.ResponseData[0].point_loper,
                description: response.data.ResponseData[0].description,
                status: response.data.ResponseData[0].status,
              })
          }, (err) => {
            console.error(err)
          })
      }

      // === PRODUCT TYPE LIST ===
        axios.get(api_url+'/api/recent_product/listProductType', config)
          .then((response) => {
              this.setState({
                productTypeList: response.data.ResponseData
              })
          }, (err) => {
            console.error(err)
          })
  
      // === BILLER LIST ===
        axios.get(api_url+'/api/biller/', config)
          .then((response) => {
              this.setState({
                billerList: response.data.ResponseData
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
      let url = api_url + '/api/recent_product/'
      let data = {
        id: this.state.id,
        template: this.state.template,
        scheme: this.state.scheme,
        sku: this.state.sku,
        product_type_id: this.state.product_type_id,
        product_name: this.state.product_name,
        operator: this.state.operator,
        biller_host_id: this.state.biller_host_id,
        start_date_time: this.state.start_date_time,
        end_date_time: this.state.end_date_time,
        harga_biller: this.state.harga_biller,
        fee_jpx: this.state.fee_jpx,
        fee_agent: this.state.fee_agent,
        fee_loper: this.state.fee_loper,
        selling_price: this.state.selling_price,
        max_admin: this.state.max_admin,
        point_loper: this.state.point_loper,
        point_agent: this.state.point_agent,
        description: this.state.description,
        user_create: this.state.user_create,
        status: this.state.status,
      }

      if (this.props.match.params.id) {
        try {
          axios.put(url, data, config)
          .then((response) => {
              if(response.data.ResponseCode==="200"){
                message.success(response.data.ResponseDesc)
                if(returnPage){
                  this.props.history.push({pathname: '/product'})    
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
                  this.props.history.push({pathname: '/product'})    
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

  handleHargaBiller(e, values){
    this.setState({
      harga_biller: values.value
    }, () => {
      this.handleSellingPrice()
    })
  }

  handleFeeJPX(e, values){
    this.setState({
      fee_jpx: values.value
    }, () => {
      this.handleSellingPrice()
    })
  }

  handleFeeAgent(e, values){
    this.setState({
      fee_agent: values.value
    }, () => {
      this.handleSellingPrice()
    })
  }

  handleFeeLoper(e, values){
    this.setState({
      fee_loper: values.value
    }, () => {
      this.handleSellingPrice()
    })
  }

  handleMaxAdmin(e){
    let max_admin = (e.target.validity.valid) ? e.target.value : this.state.max_admin;
    this.setState({
      max_admin: max_admin
    })
  }

  handlePointLoper(e){
    let point_loper = (e.target.validity.valid) ? e.target.value : this.state.point_loper;
    this.setState({
      point_loper: point_loper
    })
  }

  handlePointAgent(e){
    let point_agent = (e.target.validity.valid) ? e.target.value : this.state.point_agent;
    this.setState({
      point_agent: point_agent
    })
  }

  handleEndDate(e){
    var date = moment(e).add('years', 1)
    this.setState({
      start_date_time: e,
      end_date_time: date
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
      biller_name: e
    })
  }

  handleSellingPrice() {
    let { harga_biller, fee_jpx, fee_agent, fee_loper } = this.state

    let sellingPrice = parseInt(harga_biller, 10) + parseInt(fee_jpx, 10) + parseInt(fee_agent, 10) + parseInt(fee_loper, 10)
    
    this.setState({
      selling_price: sellingPrice
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

    var billers = this.state.billerList
    var productTypes = this.state.productTypeList

    const NumberFormatStyle = {
      width: '100%',
      border: '1px solid #d9d9d9',
      lineHeight: '2',
      borderRadius: '4px',
      padding: '4px 11px'
    };

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
                      pathname : '/product'
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
                      pathname : '/product'
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
                <FormItem {...formItemLayout} label="Template" required={true}>
                    <Input placeholder="Template" value={this.state.template} disabled={this.state.disabled}
                      onChange={e => this.setState({ template: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Scheme" required={true}>
                    <Select placeholder="Scheme" value={this.state.scheme} disabled={this.state.disabled}
                      onChange={e => this.setState({ scheme: e })}
                      defaultValue={this.state.scheme}
                    >
                      <Option key="1" value="0">Fee Based</Option>
                      <Option key="2" value="1">Subscription</Option>
                    </Select>
                </FormItem>
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
                <FormItem {...formItemLayout} label="SKU" required={true}>
                    <Input placeholder="SKU" value={this.state.sku} disabled={this.state.disabled}
                      onChange={e => this.setState({ sku: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Name" required={true}>
                    <Input placeholder="Name" value={this.state.product_name} disabled={this.state.disabled}
                      onChange={e => this.setState({ product_name: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Operator" required={true}>
                    <Input placeholder="Operator" value={this.state.operator} disabled={this.state.disabled}
                      onChange={e => this.setState({ operator: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Start Date Time" required={true}>
                    <DatePicker
                      format="DD-MM-YYYY"
                      onChange={this.handleEndDate.bind(this)}
                      value={(this.props.mode !== "add") ? moment(this.state.start_date_time) :  this.state.start_date_time}
											placeholder="Start Date Time"
											disabled={this.state.disabled}
											/>
                </FormItem>
                <FormItem {...formItemLayout} label="End Date Time" required={true}>
                    <DatePicker
                      format="DD-MM-YYYY"
                      onChange={e => this.setState({ end_date_time: e })}
                      value={(this.props.mode !== "add") ? moment(this.state.end_date_time) :  this.state.end_date_time}
											placeholder="End Date Time" 
											disabled={this.state.disabled}
											/>
								</FormItem>
                <FormItem {...formItemLayout} label="Host" required={true}>
                    <Select placeholder="Host" value={this.state.biller_name} disabled={this.state.disabled}
                      onChange={this.handleBiller.bind(this)}
                    >
                    {
                      Object.keys(billers).map((item) => {
                        return (<Option key={billers[item].id} value={billers[item].name}>{billers[item].name}</Option>)
                      })
                    }
                    </Select>
                </FormItem>
                <FormItem {...formItemLayout} label="Biller Cost">
                    <NumberFormat style={NumberFormatStyle} thousandSeparator={'.'} decimalSeparator={','} prefix={'Rp'}
                      value={this.state.harga_biller}
                      disabled={this.state.disabled}
                      onValueChange={this.handleHargaBiller.bind(this, this.state.harga_biller)}
                     />
                </FormItem>
              </Col>
              <Col span={8} style={{ padding: "0 0 0 6px" }}>
                <FormItem {...formItemLayout} label="Margin 0">
                    <NumberFormat style={NumberFormatStyle} thousandSeparator={'.'} decimalSeparator={','} prefix={'Rp'}
                      value={this.state.fee_jpx}
                      disabled={this.state.disabled}
                      onValueChange={this.handleFeeJPX.bind(this, this.state.fee_jpx)}
                     />
                </FormItem>
                <FormItem {...formItemLayout} label="Margin 1">
                    <NumberFormat style={NumberFormatStyle} thousandSeparator={'.'} decimalSeparator={','} prefix={'Rp'}
                      value={this.state.fee_agent}
                      disabled={this.state.disabled}
                      onValueChange={this.handleFeeAgent.bind(this, this.state.fee_agent)}
                     />
                </FormItem>
                <FormItem {...formItemLayout} label="Margin 2">
                    <NumberFormat style={NumberFormatStyle} thousandSeparator={'.'} decimalSeparator={','} prefix={'Rp'}
                      value={this.state.fee_loper}
                      disabled={this.state.disabled}
                      onValueChange={this.handleFeeLoper.bind(this, this.state.fee_loper)}
                     />
                </FormItem>
                <FormItem {...formItemLayout} label="Selling Price">
                    <NumberFormat style={NumberFormatStyle} thousandSeparator={'.'} decimalSeparator={','} prefix={'Rp'}
                      value={this.state.selling_price}
                      disabled={true}
                     />
                </FormItem>
                <FormItem {...formItemLayout} label="Max Admin">
                    <Input pattern="[0-9]*"
                      value={this.state.max_admin}
                      disabled={this.state.disabled}
                      onChange={this.handleMaxAdmin.bind(this)}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Point Loper">
                    <Input pattern="[0-9]*"
                      value={this.state.point_loper}
                      disabled={this.state.disabled}
                      onChange={this.handlePointLoper.bind(this)}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Point Agent">
                    <Input pattern="[0-9]*"
                      value={this.state.point_agent}
                      disabled={this.state.disabled}
                      onChange={this.handlePointAgent.bind(this)}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Description">
                    <TextArea placeholder="Description" value={this.state.description} disabled={this.state.disabled}
                      onChange={(e) => this.setState({ description : e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Status">
                    <Select placeholder="Status" value={this.state.status} disabled={this.state.disabled}
                      onChange={e => this.setState({ status: e })}
                      defaultValue={this.state.status}
                    >
                      <Option key="1" value="ENABLE">ENABLE</Option>
                      <Option key="2" value="DISABLE">DISABLE</Option>
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

export default withRouter(connect(mapStateToProps, { LogUser, FormMode })(ProductForm));
