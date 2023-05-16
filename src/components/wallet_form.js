import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Input, Form, Row, Col, Select, message } from "antd";
import { FormMode, LogUser } from '../actions';
import axios from "axios";
import { config } from "../config";
const FormItem = Form.Item;
const Option = Select.Option;

class WalletForm extends Component {
  constructor(props){
    super(props)

    this.state = {
      isAuthorized: false,
      userID: '',
      wallet_id: '',
      name: '',
      account_id: '',
      agent_loper_biller: '',
      type: '',
      efective_balance: '',
      temporary_balance: '',
      efective_point: '',
      temporary_point: '',
      batas_limit: '',
      description: '',
      value_data: '',
      enable_disable: '',
      note: '',
      disabled: (this.props.location.pathname.includes("view")) ? true : false,
      api_url: config().api_url,
      config: { headers: {'token': localStorage.getItem('token')}}
    }
  }

  validateForm() {
    return this.state.efective_balance.toString().length > 0 && this.state.temporary_balance.toString().length > 0 && this.state.efective_point.toString().length > 0 && this.state.temporary_point.toString().length > 0 &&  this.state.batas_limit.toString().length > 0 &&  this.state.description.length > 0 &&  this.state.value_data.length > 0 &&  this.state.note.length > 0;
  }

  componentWillMount() {
    let rights = this.props.user.rights
    let page_url = this.props.match.url
  
    for (let item in rights) {
      let isInclude = page_url.includes(rights[item].page_url)
      
      if (isInclude) {
        if (rights[item].create === 1 || rights[item.update === 1]) {
          this.setState({
            isAuthorized: true
          })
        }
      }
    }
  }

  componentDidMount() {
    let { isAuthorized, api_url, config } = this.state
    
    if (isAuthorized) {
      let user_id = this.props.match.params.user_id
      
      if (user_id) {
        let url = api_url + '/api/wallet/?user_id=' + user_id
        console.log(url)

        axios.get(url, config)
          .then((response) => {
            console.log('Wallet User Response : ', response.data)

              this.setState({
                userID: response.data.ResponseData[0].user_id,
                wallet_id: response.data.ResponseData[0].id,
                name: response.data.ResponseData[0].name,
                account_id: response.data.ResponseData[0].account_id,
                agent_loper_biller: response.data.ResponseData[0].agent_loper_biller,
                type: response.data.ResponseData[0].type,
                efective_balance: response.data.ResponseData[0].efective_balance,
                temporary_balance: response.data.ResponseData[0].temporary_balance,
                efective_point: response.data.ResponseData[0].efective_point,
                temporary_point: response.data.ResponseData[0].temporary_point,
                batas_limit: response.data.ResponseData[0].batas_limit,
                description: response.data.ResponseData[0].description,
                value_data: response.data.ResponseData[0].value_data,
                enable_disable: response.data.ResponseData[0].enable_disable,
                note: response.data.ResponseData[0].note
              })
          }, (err) => {
            console.error(err)
          })
      }
    }
  }

  async handleSubmit (e) {
    let { api_url, config } = this.state
    e.preventDefault();

    let url = api_url + '/api/wallet/'

    let data = {
      id : this.state.wallet_id,
      type: this.state.type,
      efective_balance: this.state.efective_balance,
      temporary_balance: this.state.temporary_balance,
      efective_point: this.state.efective_point,
      temporary_point: this.state.temporary_point,
      batas_limit: this.state.batas_limit,
      description: this.state.description,
      value_data: this.state.value_data,
      enable_disable: this.state.enable_disable,
      note: this.state.note,
    }
    
    console.log(url, data)

    try {
      axios.put(url, data, config)
      .then((response) => {
        console.log(response.data)

        if (response.data.ResponseCode === "200") {
          message.success(response.data.ResponseDesc)
          this.props.history.push({
            pathname: '/wallet'
          })
        } else {
          if (response.data.status === '401') {
            message.error('Login Authentication Expired. Please Login Again!')
          } else {
            message.error((response.data.ResponseDesc.sqlMessage) ? ('Database Error!') : (response.data.ResponseDesc) )
          }
        }

        this.setState({ isLoading: false })
      }, (err) => {
        console.log(err)
        message.error(err.data.ResponseDesc)
        this.setState({ isLoading: false })
      })
    } catch (e) {
      console.log(e)
      message.error(e.data.ResponseDesc)
      this.setState({ isLoading: false })
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

    if(this.state.isAuthorized){
      return (
        <Form className="form_view" onSubmit={this.handleSubmit.bind(this)}>
          <Row type="flex" justify="end" style={{ marginBottom : "45px" }}>
            <Col>
              <Button
                className='base_button primary'
                type="default" 
                onClick={()=>this.props.history.push({
                  pathname: '/wallet',
                })}
              >
                Back
              </Button>
            </Col>

            <Col>
              <Button 
                className='base_button primary'
                type="primary" 
                htmlType="submit" 
                hidden={(this.props.mode !== "edit") ? true : false}
                style={{ marginLeft: '5px' }}
              >
                Save
              </Button>
            </Col>

          </Row>

          <Row gutter={12}>
              <Col span={8} style={{ padding: "0 0 0 6px" }}>
                <FormItem {...formItemLayout} label="Name">
                    <Input placeholder="Name" value={this.state.name} disabled={true}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Account">
                    <Input placeholder="Account" value={this.state.account_id} disabled={true}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Account Type">
                    <Input placeholder="Account" value={this.state.agent_loper_biller} disabled={true}
                    />                 
                </FormItem>
                <FormItem {...formItemLayout} label="Transaction Type">
                    <Select placeholder="Transaction Type" value={this.state.type} 
                      onChange={e => this.setState({ type: e })}
                      disabled={(this.props.mode !== "edit") ? true : false}
                      defaultValue={this.state.type} 
                    >
                      <Option key="1" value="K">K</Option>
                      <Option key="2" value="D">D</Option>
                    </Select>
                </FormItem>
                <FormItem {...formItemLayout} label="Effective Balance">
                    <Input placeholder="Effective Balance" value={this.state.efective_balance} disabled={this.state.disabled}
                      onChange={e => this.setState({ efective_balance: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Temporary Balance">
                    <Input placeholder="Temporary Balance" value={this.state.temporary_balance} disabled={this.state.disabled}
                      onChange={e => this.setState({ temporary_balance: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Effective Point">
                    <Input placeholder="Effective Point" value={this.state.efective_point} disabled={this.state.disabled}
                      onChange={e => this.setState({ efective_point: e.target.value })}
                    />
                </FormItem>
              </Col>
              <Col span={8} style={{ padding: "0 0 0 6px" }}>
                <FormItem {...formItemLayout} label="Temporary Point">
                    <Input placeholder="Temporary Point" value={this.state.temporary_point} disabled={this.state.disabled}
                      onChange={e => this.setState({ temporary_point: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Balance Limit">
                    <Input placeholder="Balance Limit" value={this.state.batas_limit} disabled={this.state.disabled}
                      onChange={e => this.setState({ batas_limit: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Description">
                    <Input placeholder="Description" value={this.state.description} disabled={this.state.disabled}
                      onChange={e => this.setState({ description: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Value Data">
                    <Input placeholder="Value Data" value={this.state.value_data} disabled={this.state.disabled}
                      onChange={e => this.setState({ value_data: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Status">
                    <Select placeholder="Status" value={this.state.enable_disable} 
                      onChange={e => this.setState({ enable_disable: e }, () => { console.log(this.state.enable_disable) })}
                      disabled={(this.props.mode !== "edit") ? true : false}
                      defaultValue={this.state.enable_disable} 
                    >
                      <Option key="1" value="ENABLE">ENABLE</Option>
                      <Option key="2" value="DISABLE">DISABLE</Option>
                    </Select>
                </FormItem>
                <FormItem {...formItemLayout} label="Note">
                    <Input placeholder="Note" value={this.state.note} disabled={this.state.disabled}
                      onChange={e => this.setState({ note: e.target.value })}
                    />
                </FormItem>
              </Col>
            </Row>
          </Form>
      )
    }
    else {
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

export default withRouter(connect(mapStateToProps, { LogUser, FormMode })(WalletForm));
