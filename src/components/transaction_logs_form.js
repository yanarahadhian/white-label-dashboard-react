import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Input, Form, Row, Col } from "antd";
import { FormMode, LogUser } from '../actions';
import axios from "axios";
import moment from "moment";
import { config } from "../config";
const FormItem = Form.Item;

class TransactionForm extends Component {
  constructor(props){
    super(props)

    this.state = {
      isAuthorized: false,
      user_id_seller: '',
      network_name: '',
      seller_name: '',
      agent_id: '',
      agent_name: '',
      invoice_id: '',
      type_trans: '',
      area: '',
      time_user: '',
      product_id: '',
      product: '',
      sku: '',
      customer_number: '',
      customer_name: '',
      billing_id: '',
      billing_name: '',
      billing_denom: '',
      price: '',
      harga_jual: '',
      fee_jpx: '',
      fee_agent: '',
      fee_loper: '',
      point: '',
      balance_before: '',
      balance_after: '',
      debet_kredit: '',
      biller_host: '',
      response_host: '',
      response_host_note: '',
      response_mobile: '',
      response_mobile_note: '',
      status: '',
      note_request: '',
      note_response: '',
      request_time: '',
      response_time: '',
      t_taken: '',
      created_at: '',
      updated_at: '',
      deleted_at: '',
      approve_id: '',
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
    let url = api_url + '/api/transaction_log/?id=' + id

    if (isAuthorized) {
      if (id) {
        axios.get(url, config)
        .then((response) => {
          console.log(response)
          this.setState({
            user_id_seller: response.data.ResponseData[0].user_id_seller,
            network_name: response.data.ResponseData[0].network_name,
            seller_name: response.data.ResponseData[0].seller_name,
            agent_id: response.data.ResponseData[0].agent_id,
            agent_name: response.data.ResponseData[0].agent_name,
            invoice_id: response.data.ResponseData[0].invoice_id,
            type_trans: response.data.ResponseData[0].type_trans,
            area: response.data.ResponseData[0].area,
            time_user: response.data.ResponseData[0].time_user,
            product_id: response.data.ResponseData[0].product_id,
            product: response.data.ResponseData[0].product,
            sku: response.data.ResponseData[0].sku,
            customer_number: response.data.ResponseData[0].customer_number,
            customer_name: response.data.ResponseData[0].customer_name,
            billing_id: response.data.ResponseData[0].billing_id,
            billing_name: response.data.ResponseData[0].billing_name,
            billing_denom: response.data.ResponseData[0].billing_denom,
            price: response.data.ResponseData[0].price,
            harga_jual: response.data.ResponseData[0].harga_jual,
            fee_jpx: response.data.ResponseData[0].fee_jpx,
            fee_agent: response.data.ResponseData[0].fee_agent,
            fee_loper: response.data.ResponseData[0].fee_loper,
            point: response.data.ResponseData[0].point,
            balance_before: response.data.ResponseData[0].balance_before,
            balance_after: response.data.ResponseData[0].balance_after,
            debet_kredit: response.data.ResponseData[0].debet_kredit,
            biller_host: response.data.ResponseData[0].biller_host,
            response_host: response.data.ResponseData[0].response_host,
            response_host_note: response.data.ResponseData[0].response_host_note,
            response_mobile: response.data.ResponseData[0].response_mobile,
            response_mobile_note: response.data.ResponseData[0].response_mobile_note,
            status: response.data.ResponseData[0].status,
            note_request: response.data.ResponseData[0].note_request,
            note_response: response.data.ResponseData[0].note_response,
            request_time: response.data.ResponseData[0].request_time,
            response_time: response.data.ResponseData[0].response_time,
            t_taken: response.data.ResponseData[0].t_taken,
            created_at: response.data.ResponseData[0].created_at,
            updated_at: response.data.ResponseData[0].updated_at,
            deleted_at: response.data.ResponseData[0].deleted_at,
            approve_id: response.data.ResponseData[0].approve_id
          })
        }, (err) => {
          console.error(err)
        })
      }
    }
  }

  _dateFormat(field) {

    let parseDate = moment(field, "YYYY-MM-DD HH:mm:ss").format("lll")

    return (parseDate !== 'Invalid date') ? (parseDate) : (field)
  }
  
  render() {
    const { isAuthorized } = this.state

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 12 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 12 },
      }
    }

    if (isAuthorized) {
      return (
        <Form className="form_view" onSubmit={this.handleSubmit}>
          <Row type='flex' justify='end' style={{ marginBottom: '30px' }}>
            <Col>
              <Button 
                className='base_button primary'
                type='primary'
                htmlType='submit'
                onClick={()=>this.props.history.push({ pathname: '/transaction_logs' })}
              >
                Back
              </Button>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={7} style={{ padding: "0 0 0 0px" }}>
              <FormItem {...formItemLayout} label="User ID Seller">
                  <Input placeholder="User ID Seller" value={this.state.user_id_seller} disabled={this.state.disabled}
                    onChange={e => this.setState({ user_id_seller: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Network">
                  <Input placeholder="Network" value={this.state.network_name} disabled={this.state.disabled}
                    onChange={e => this.setState({ network_name: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Name">
                  <Input placeholder="Name" value={this.state.seller_name} disabled={this.state.disabled}
                    onChange={e => this.setState({ seller_name: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Agent ID">
                  <Input placeholder="Agent ID" value={this.state.agent_id} disabled={this.state.disabled}
                    onChange={e => this.setState({ agent_id: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Agent Name">
                  <Input placeholder="Agent Name" value={this.state.agent_name} disabled={this.state.disabled}
                    onChange={e => this.setState({ agent_name: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Invoice ID">
                  <Input placeholder="Invoice ID" value={this.state.invoice_id} disabled={this.state.disabled}
                    onChange={e => this.setState({ invoice_id: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Type Trans">
                  <Input placeholder="Type Trans" value={this.state.type_trans} disabled={this.state.disabled}
                    onChange={e => this.setState({ type_trans: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Area">
                  <Input placeholder="Area" value={this.state.area} disabled={this.state.disabled}
                    onChange={e => this.setState({ area: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Time User">
                  <Input placeholder="Time User" value={this._dateFormat(this.state.time_user)} disabled={this.state.disabled}
                    onChange={e => this.setState({ time_user: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Product ID">
                  <Input placeholder="Product ID" value={this.state.product_id} disabled={this.state.disabled}
                    onChange={e => this.setState({ product_id: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Product">
                  <Input placeholder="Product" value={this.state.product} disabled={this.state.disabled}
                    onChange={e => this.setState({ product: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="SKU">
                  <Input placeholder="SKU" value={this.state.sku} disabled={this.state.disabled}
                    onChange={e => this.setState({ sku: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Customer Number">
                  <Input placeholder="Customer Number" value={this.state.customer_number} disabled={this.state.disabled}
                    onChange={e => this.setState({ customer_number: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Customer Name">
                  <Input placeholder="Customer Name" value={this.state.customer_name} disabled={this.state.disabled}
                    onChange={e => this.setState({ customer_name: e.target.value })}
                  />
              </FormItem>
            </Col>

            <Col span={7} style={{ padding: "0 0 0 6px" }}>
              <FormItem {...formItemLayout} label="Billing ID">
                  <Input placeholder="Billing ID" value={this.state.billing_id} disabled={this.state.disabled}
                    onChange={e => this.setState({ billing_id: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Billing Name">
                  <Input placeholder="Billing Name" value={this.state.billing_name} disabled={this.state.disabled}
                    onChange={e => this.setState({ billing_name: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Billing Denom">
                  <Input placeholder="Billing Denom" value={this.state.billing_denom} disabled={this.state.disabled}
                    onChange={e => this.setState({ billing_denom: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Price">
                  <Input placeholder="Price" value={this.state.price} disabled={this.state.disabled}
                    onChange={e => this.setState({ price: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Harga Jual">
                  <Input placeholder="Harga Jual" value={this.state.harga_jual} disabled={this.state.disabled}
                    onChange={e => this.setState({ harga_jual: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Fee JPX">
                  <Input placeholder="Fee JPX" value={this.state.fee_jpx} disabled={this.state.disabled}
                    onChange={e => this.setState({ fee_jpx: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Fee Agent">
                  <Input placeholder="Fee Agent" value={this.state.fee_agent} disabled={this.state.disabled}
                    onChange={e => this.setState({ fee_agent: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Fee Loper">
                  <Input placeholder="Fee Loper" value={this.state.fee_loper} disabled={this.state.disabled}
                    onChange={e => this.setState({ fee_loper: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Point">
                  <Input placeholder="Point" value={this.state.point} disabled={this.state.disabled}
                    onChange={e => this.setState({ point: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Balance Before">
                  <Input placeholder="Balance Before" value={this.state.balance_before} disabled={this.state.disabled}
                    onChange={e => this.setState({ balance_before: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Balance After">
                  <Input placeholder="Balance After" value={this.state.balance_after} disabled={this.state.disabled}
                    onChange={e => this.setState({ balance_after: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Debet Kredit">
                  <Input placeholder="Debet Kredit" value={this.state.debet_kredit} disabled={this.state.disabled}
                    onChange={e => this.setState({ debet_kredit: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Biller Host">
                  <Input placeholder="Biller Host" value={this.state.biller_host} disabled={this.state.disabled}
                    onChange={e => this.setState({ biller_host: e.target.value })}
                  />
              </FormItem>
            </Col>

            <Col span={7} style={{ padding: "0 0 0 6px" }}>
              <FormItem {...formItemLayout} label="Response Host">
                  <Input placeholder="Response Hosy" value={this.state.response_host} disabled={this.state.disabled}
                    onChange={e => this.setState({ response_host: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Response Host Note">
                  <Input placeholder="Response Host Note" value={this.state.response_host_note} disabled={this.state.disabled}
                    onChange={e => this.setState({ response_host_note: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Response Mobile">
                  <Input placeholder="Response Mobile" value={this.state.response_mobile} disabled={this.state.disabled}
                    onChange={e => this.setState({ response_mobile: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Response Mobile Note">
                  <Input placeholder="Response Mobile Note" value={this.state.response_mobile_note} disabled={this.state.disabled}
                    onChange={e => this.setState({ response_mobile_note: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Status">
                  <Input placeholder="Status" value={this.state.status} disabled={this.state.disabled}
                    onChange={e => this.setState({ status: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Note Request">
                  <Input placeholder="Note Request" value={this.state.note_request} disabled={this.state.disabled}
                    onChange={e => this.setState({ note_request: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Note Response">
                  <Input placeholder="Note Response" value={this.state.note_response} disabled={this.state.disabled}
                    onChange={e => this.setState({ note_response: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Request Time">
                  <Input placeholder="Request Time" value={this._dateFormat(this.state.request_time)} disabled={this.state.disabled}
                    onChange={e => this.setState({ request_time: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="Response Time">
                  <Input placeholder="Response Time" value={this._dateFormat(this.state.response_time)} disabled={this.state.disabled}
                    onChange={e => this.setState({ response_time: e.target.value })}
                  />
              </FormItem>
              <FormItem {...formItemLayout} label="T Taken">
                  <Input placeholder="T Taken" value={this.state.t_taken} disabled={this.state.disabled}
                    onChange={e => this.setState({ t_taken: e.target.value })}
                  />
              </FormItem>
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
              <FormItem {...formItemLayout} label="Approve ID">
                  <Input placeholder="Approve ID" value={this.state.approve_id} disabled={this.state.disabled}
                    onChange={e => this.setState({ approve_id: e.target.value })}
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

export default withRouter(connect(mapStateToProps, { LogUser, FormMode })(TransactionForm))
