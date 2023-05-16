import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Input, Form, Row, Col } from "antd";
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import { FormMode, LogUser } from '../actions';
import axios from "axios";
import moment from "moment";
import { config } from "../config";
const FormItem = Form.Item;


class VirtualAccountForm extends Component {
  constructor(props){
    super(props)

    this.state = {
		id: this.props.match.params.id,
		isAuthorized: false,
		data: [],
		virtual_account_id: '',
		name: '',
		status: '',
		created_at: '',
		disabled: true,
		api_url: config().api_url,
		config: { headers: {'token': localStorage.getItem('token')}}
    }
  }

  componentWillMount() {
    let rights = this.props.user.rights
    let page_url = this.props.location.pathname

    let authorize = false

    for (let item in rights) {
      let isInclude = page_url.includes(rights[item].page_url)

      if (isInclude) {
        
        let isModeRead = page_url.includes("/view")

        
				if (isModeRead && rights[item].read === 1) {
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
      let VaId = this.state.id

      if (VaId) {
        let url = api_url + '/api/va/' + VaId

        axios.get(url, config)
        .then((response) => {
            console.log('Get Virtual Account : ', response.data)

            this.setState({
              virtual_account_id: response.data.ResponseData.virtual_account_id,
              name: response.data.ResponseData.name,
							status: response.data.ResponseData.status,
							created_at: response.data.ResponseData.created_at,
              data: response.data.ResponseData.Activities
            })
        }, (err) => {
          console.error(err)
        })  
      }
    }
	}

  _dateFormat(field){ return moment(field, "YYYY-MM-DD HH:mm:ss").format("DD/MM/YYYY HH:mm:ss") }
  
  render() {
		const { isAuthorized, created_at } = this.state
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 12 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 12 }
      }
		}
		
		let createAt = moment(created_at, "YYYY-MM-DD HH:mm:ss").format("DD/MM/YYYY HH:mm:ss")

    if (isAuthorized) {
    	return (
			<div>
				<Form className="form_view">
					<Row type='flex' justify='end' style={{ marginBottom : '45px' }} >
						<Col>
							<Button 
								className="base_button primary"
								type="default" 
								onClick={()=>this.props.history.push({
									pathname: '/virtual_account'
								})}
							>
								Back
							</Button>
						</Col>
					</Row>

					<Row gutter={12}>
							<Col span={8} style={{ padding: "0 0 0 6px" }}>
								<FormItem {...formItemLayout} label="Account Number">
										<Input placeholder="Account Number" value={this.state.virtual_account_id} disabled={this.state.disabled}
											onChange={e => this.setState({ virtual_account_id: e.target.value })}
										/>
								</FormItem>
								<FormItem {...formItemLayout} label="Name">
										<Input placeholder="Name" value={this.state.name} disabled={this.state.disabled}
											onChange={e => this.setState({ name: e.target.value })}
										/>
								</FormItem>
								<FormItem {...formItemLayout} label="Status">
										<Input placeholder="Status" value={this.state.status} disabled={this.state.disabled}
											onChange={e => this.setState({ status: e.target.value })}
										/>
								</FormItem>
								<FormItem {...formItemLayout} label="Created At">
										<Input placeholder="Created At" value={createAt} disabled={this.state.disabled}
											onChange={e => this.setState({ created_at: e.target.value })}
										/>
								</FormItem>
							</Col>
						</Row>
				</Form>

				<h4 style={{marginTop: "50px"}}>Transactions</h4>

				<BootstrapTable data={this.state.data}>
					<TableHeaderColumn dataField="created_at" dataAlign="center" width='100px' dataFormat = {this._dateFormat.bind(this)}>Date Time</TableHeaderColumn>
					<TableHeaderColumn dataField="payment_amount" dataAlign="center" width='100px' >Amount (Rp)</TableHeaderColumn>
					<TableHeaderColumn dataField="invoice_id" isKey dataAlign="center" width='100px' >Invoice ID</TableHeaderColumn>
					<TableHeaderColumn dataField="va_status" dataAlign="center" width='100px' >Status</TableHeaderColumn>
					<TableHeaderColumn dataField="description" dataAlign="center" width='150px' >Notes</TableHeaderColumn>
				</BootstrapTable>
			</div>
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

export default withRouter(connect(mapStateToProps, { LogUser, FormMode })(VirtualAccountForm))
