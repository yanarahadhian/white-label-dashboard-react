import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Input, Form, Row, Col } from "antd";
import { FormMode, LogUser } from '../actions';
import axios from "axios";
import moment from "moment";
import { config } from "../config";
const FormItem = Form.Item;

class WalletForm extends Component {
  constructor(props){
    super(props)

    this.state = {
      isAuthorized: false,
      user_id: '',
      owner: '',
      transaction_date: '',
      source_account_id: '',
      dest_account_id: '',
      amount: '',
      type: '',
      product: '',
      sku: '',
      type_trans: '',
      currency: '',
      invoice_id: '',
      description: '',
      created_at: '',
      updated_at: '',
      deleted_at: '',
      disabled: (this.props.mode === "view") ? true : false,
      api_url: config().api_url,
      config: { headers: {'token': localStorage.getItem('token')}}
    }
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
    let url = api_url + '/api/wallet_log/?id=' + id

    if (isAuthorized) {
      if (id) {
        axios.get(url, config)
        .then((response) => {
          this.setState({
            user_id: response.data.ResponseData[0].user_id,
            owner: response.data.ResponseData[0].owner,
            transaction_date: response.data.ResponseData[0].transaction_date,
            source_account_id: response.data.ResponseData[0].source_account_id,
            dest_account_id: response.data.ResponseData[0].dest_account_id,
            amount: response.data.ResponseData[0].amount,
            type: response.data.ResponseData[0].type,
            time_user: response.data.ResponseData[0].time_user,
            product: response.data.ResponseData[0].product,
            sku: response.data.ResponseData[0].sku,
            type_trans: response.data.ResponseData[0].type_trans,
            currency: response.data.ResponseData[0].currency,
            invoice_id: response.data.ResponseData[0].invoice_id,
            description: response.data.ResponseData[0].description,
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

  _dateFormat(field){ return moment(field, "YYYY-MM-DD HH:mm:ss").format("DD/MM/YYYY HH:mm:ss") }
  
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
        <Form className="form_view" onSubmit={this.handleSubmit}>
          <Row type="flex" justify="end" style={{ marginBottom : "45px" }}>
            <Col>
              <Button 
                className="base_button primary"
                type="default" 
                onClick={()=>this.props.history.push({
                  pathname: '/wallet_logs',
                  state: { page_id: this.state.page_id }
                })}
              >
                Back
              </Button>
            </Col>
          </Row>
          
          <Row gutter={12}>
              <Col span={8} style={{ padding: "0 0 0 6px" }}>
                <FormItem {...formItemLayout} label="User ID">
                    <Input placeholder="User ID" value={this.state.user_id} disabled={this.state.disabled}
                      onChange={e => this.setState({ user_id: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Owner">
                    <Input placeholder="Owner" value={this.state.owner} disabled={this.state.disabled}
                      onChange={e => this.setState({ owner: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Transaction Date">
                    <Input placeholder="Transaction Date" value={this._dateFormat(this.state.transaction_date)} disabled={this.state.disabled}
                      onChange={e => this.setState({ transaction_date: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Source Account ID">
                    <Input placeholder="Source Account ID" value={this.state.source_account_id} disabled={this.state.disabled}
                      onChange={e => this.setState({ source_account_id: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Dest Account ID">
                    <Input placeholder="Dest Account ID" value={this.state.dest_account_id} disabled={this.state.disabled}
                      onChange={e => this.setState({ dest_account_id: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Amount">
                    <Input placeholder="Amount" value={this.state.amount} disabled={this.state.disabled}
                      onChange={e => this.setState({ amount: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Type">
                    <Input placeholder="Type" value={this.state.type} disabled={this.state.disabled}
                      onChange={e => this.setState({ type: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Product">
                    <Input placeholder="Product" value={this.state.product} disabled={this.state.disabled}
                      onChange={e => this.setState({ product: e.target.value })}
                    />
                </FormItem>
              </Col>
              <Col span={8} style={{ padding: "0 0 0 6px" }}>
                <FormItem {...formItemLayout} label="Created At">
                    <Input placeholder="Created At" value={this._dateFormat(this.state.created_at)} disabled={this.state.disabled}
                      onChange={e => this.setState({ created_at: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Updated At">
                    <Input placeholder="Updated At" value={this._dateFormat(this.state.updated_at)} disabled={this.state.disabled}
                      onChange={e => this.setState({ updated_at: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Deleted At">
                    <Input placeholder="Deleted At" value={this._dateFormat(this.state.deleted_at)} disabled={this.state.disabled}
                      onChange={e => this.setState({ deleted_at: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="SKU">
                    <Input placeholder="SKU" value={this.state.sku} disabled={this.state.disabled}
                      onChange={e => this.setState({ sku: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Type Trans">
                    <Input placeholder="Type Trans" value={this.state.type_trans} disabled={this.state.disabled}
                      onChange={e => this.setState({ type_trans: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Currency">
                    <Input placeholder="Currency" value={this.state.currency} disabled={this.state.disabled}
                      onChange={e => this.setState({ currency: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Invoice ID">
                    <Input placeholder="Invoice ID" value={this.state.invoice_id} disabled={this.state.disabled}
                      onChange={e => this.setState({ invoice_id: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Description">
                    <Input placeholder="Description" value={this.state.description} disabled={this.state.disabled}
                      onChange={e => this.setState({ description: e.target.value })}
                    />
                </FormItem>
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
    const { user, mode } = state
    
    return { user, mode }
}

export default withRouter(connect(mapStateToProps, { LogUser, FormMode })(WalletForm))
