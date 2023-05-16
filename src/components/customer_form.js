import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Input, Form, Row, Col, message, Divider } from "antd";
import { FormMode, LogUser } from '../actions';
import axios from "axios";
import { config } from "../config";
import moment from 'moment'
const FormItem = Form.Item;

class CustomerForm extends Component {
  constructor(props){
    super(props)

    this.state = {
      isAuthorized: false,
      id: '',
      customer_id: '',
      namacustomer: '',
      id_pel: '',
      product: '',
      operator: '',
      phone_number: '',
      created_at: '',
      updated_at: '',
      deleted_at: '',
      returnPage: false,
      disabled: (this.props.location.pathname.includes("view")) ? true : false,
      api_url: config().api_url,
      config: { headers: {'token': localStorage.getItem('token')}},
    }
	}
	
	validateForm() {
    return this.state.customer_id === "" || this.state.namacustomer === "" || this.state.id_pel === "" || this.state.product === "" ||  this.state.operator === "" || this.state.phone_number === "";
  }

  componentWillMount(){
    let rights = this.props.user.rights
    let page_url = this.props.location.pathname

    let authorize = false

    for (let item in rights) {
      let isInclude = page_url.includes(rights[item].page_url)

      if (isInclude) {
        let isModeView = page_url.includes("/view")
        let isModeUpdate = page_url.includes("/edit")

        if (isModeView && rights[item].read === 1) {
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
      let id = this.props.match.params.id

      if (id) {
        let url = api_url + '/api/customer/?id=' + id
        axios.get(url, config)
          .then((response) => {
              this.setState({
                id: response.data.ResponseData[0].id,
                customer_id: response.data.ResponseData[0].customer_id,
                namacustomer: response.data.ResponseData[0].namacustomer,
                id_pel: response.data.ResponseData[0].id_pel,
                product: response.data.ResponseData[0].product,
                operator: response.data.ResponseData[0].operator,
                phone_number: response.data.ResponseData[0].phone_number,
                created_at: response.data.ResponseData[0].created_at,
                updated_at: response.data.ResponseData[0].updated_at,
                deleted_at: response.data.ResponseData[0].deleted_at
              })
          }, (err) => {
            console.error(err)
          })
      }
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
      let url = api_url + '/api/customer/'
      let data = {
        id: this.state.id,
        customer_id: this.state.customer_id,
        namacustomer: this.state.namacustomer,
        id_pel: this.state.id_pel,
        product: this.state.product,
        operator: this.state.operator,
        phone_number: this.state.phone_number,
      }

      try {
        axios.put(url, data, config)
        .then((response) => {
            if(response.data.ResponseCode==="200"){
              message.success(response.data.ResponseDesc)
              if(returnPage){
                this.props.history.push({pathname: '/customer'})    
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
                      pathname : '/customer'
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
                      pathname : '/customer'
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
              <FormItem {...formItemLayout} label="Customer ID">
                  <Input placeholder="Customer ID" pattern="[0-9]*" value={this.state.customer_id} disabled={this.state.disabled}
                    onChange={e => this.setState({ customer_id: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Customer Name">
                  <Input placeholder="Customer Name" value={this.state.namacustomer} disabled={this.state.disabled}
                    onChange={e => this.setState({ namacustomer: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Phone Number">
                  <Input placeholder="Phone Numbe" pattern="[0-9]*" value={this.state.phone_number} disabled={this.state.disabled}
                    onChange={e => this.setState({ phone_number: e.target.value })}
                  />
              </FormItem>
            </Col>
          </Row>

          <Divider />

          <Row gutter={12}>
            <Col span={8} style={{ padding: "0 0 0 6px" }}>
              <h4>Produk Langganan</h4>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={8} style={{ padding: "0 0 0 6px" }}>
              <FormItem {...formItemLayout} label="Product Type">
									<Input placeholder="Product Type" value={this.state.product} disabled={this.state.disabled}
                    onChange={e => this.setState({ product: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Operator">
                  <Input placeholder="Operator" value={this.state.operator} disabled={this.state.disabled}
                    onChange={e => this.setState({ operator: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="ID Pelanggan">
                  <Input placeholder="ID Pelanggan" pattern="[0-9]*" value={this.state.id_pel} disabled={this.state.disabled}
                    onChange={e => this.setState({ id_pel: e.target.value })}
                  />
              </FormItem>
            </Col>
            <Col span={8} style={{ padding: "0 0 0 6px" }}>
              <FormItem {...formItemLayout} label="Created At">
                  <Input value={ (this.state.created_at) ? (moment(this.state.created_at, "YYYY-MM-DD HH:mm:ss").format("DD/MM/YYYY, hh:mm:ss")) : ('') } disabled />
              </FormItem>
              <FormItem {...formItemLayout} label="Updated At">
                  <Input value={ (this.state.updated_at) ? (moment(this.state.updated_at, "YYYY-MM-DD HH:mm:ss").format("DD/MM/YYYY, hh:mm:ss")) : ('') } disabled />
              </FormItem>
            </Col>
          </Row>
        </Form>
    );
  }
}

function mapStateToProps(state) {
    const { user, mode } = state;
    return {
        user,
        mode
    }
}

export default withRouter(connect(mapStateToProps, { LogUser, FormMode })(CustomerForm));
