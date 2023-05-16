import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Input, Form, message, Row, Col, Select, Divider } from "antd";
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import { FormMode, LogUser } from '../actions';
import axios from "axios";
import { config } from "../config";
import moment from 'moment'
const FormItem = Form.Item;
const Option = Select.Option;

class HelpForm extends Component {
  constructor(props){
    super(props)

    this.state = {
      isAuthorized: false,
      id: '',
      user: '',
      network: '',
      city: '',
      position: '',
      devicetoken: '',
			hardware_id: '',
			tanggal: '',
      gmt: '',
      title: '',
      questions: '',
			status: '',
			note:'',
			user_id: '',
			user_name: '',
      created_at: '',
      updated_at: '',
			deleted_at: '',
			dataDetails: [],
      returnPage: false,
      disabled: (this.props.location.pathname.includes("view")) ? true : false,
      api_url: config().api_url,
      config: { headers: {'token': localStorage.getItem('token')}},
    }
	}
	
	validateForm() {
    return this.state.status === "" || this.state.note === "" ;
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
				let url = api_url + '/api/help/' + id
        axios.get(url, config)
          .then((response) => {
              this.setState({
                id: response.data.ResponseData.id,
                user: response.data.ResponseData.user,
                network: response.data.ResponseData.network,
                city: response.data.ResponseData.city,
                position: response.data.ResponseData.position,
                devicetoken: response.data.ResponseData.devicetoken,
								hardware_id: response.data.ResponseData.hardware_id,
								tanggal: response.data.ResponseData.tanggal,
								gmt: response.data.ResponseData.gmt,
								title: response.data.ResponseData.judul,
								questions: response.data.ResponseData.questions,
								status: response.data.ResponseData.status,
                created_at: response.data.ResponseData.created_at,
                updated_at: response.data.ResponseData.updated_at,
								deleted_at: response.data.ResponseData.deleted_at,
								user_id: response.data.ResponseData.user_id,
								user_name: response.data.ResponseData.user_name,
								dataDetails: response.data.ResponseData.Details,
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
      let url = api_url + '/api/help/'
      let data = {
        id: this.state.id,
				status: this.state.status,
				note: this.state.note,
				user_id: this.state.user_id,
				user_name: this.state.user_name,
      }

      try {
        axios.put(url, data, config)
        .then((response) => {
            if(response.data.ResponseCode==="200"){
              message.success(response.data.ResponseDesc)
              if(returnPage){
                this.props.history.push({pathname: '/help'})    
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
		
		let tanggal = moment(this.state.created_at, "YYYY-MM-DD HH:mm:ss").format("DD/MM/YYYY HH:mm:ss")

		let helpForm;
		if (this.props.mode !== "view") {
			helpForm = <Col span={8} style={{ padding: "0 0 0 6px" }}>
					<FormItem {...formItemLayout} label="Status">
						<Select showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
							placeholder="Status" value={this.state.status} 
							onChange={e => this.setState({ status: e })} 
						>
							<Option key="1" value="OPEN">OPEN</Option>
							<Option key="2" value="ONPROGRESS">ONPROGRESS</Option>
							<Option key="3" value="CLOSE">CLOSE</Option>
						</Select>
				</FormItem>
				<FormItem {...formItemLayout} label="Description">
						<Input placeholder="Description" value={this.state.note} disabled={this.state.disabled}
							onChange={e => this.setState({ note: e.target.value })}
						/>
				</FormItem>
			</Col>
		}else{
			helpForm = <Col span={8} style={{ padding: "0 0 0 6px" }}>
				<FormItem {...formItemLayout} label="Username">
						<Input placeholder="Username" pattern="[0-9]*" value={this.state.user} disabled={this.state.disabled}
							onChange={e => this.setState({ user: e.target.value })}
						/>
				</FormItem>
				<FormItem {...formItemLayout} label="Network">
						<Input placeholder="Network" value={this.state.network} disabled={this.state.disabled}
							onChange={e => this.setState({ network: e.target.value })}
						/>
				</FormItem>
				<FormItem {...formItemLayout} label="City">
						<Input placeholder="City" value={this.state.city} disabled={this.state.disabled}
							onChange={e => this.setState({ city: e.target.value })}
						/>
				</FormItem>
				<FormItem {...formItemLayout} label="Position">
						<Input placeholder="Position" value={this.state.position} disabled={this.state.disabled}
							onChange={e => this.setState({ position: e.target.value })}
						/>
				</FormItem>
				<FormItem {...formItemLayout} label="Device Token">
						<Input placeholder="Device Token" value={this.state.devicetoken} disabled={this.state.disabled}
							onChange={e => this.setState({ devicetoken: e.target.value })}
						/>
				</FormItem>
				<FormItem {...formItemLayout} label="Hardware ID">
						<Input placeholder="Hardware ID" value={this.state.hardware_id} disabled={this.state.disabled}
							onChange={e => this.setState({ hardware_id: e.target.value })}
						/>
				</FormItem>
				<FormItem {...formItemLayout} label="Date">
						<Input placeholder="Date" value={tanggal} disabled={this.state.disabled}
							onChange={e => this.setState({ tanggal: e.target.value })}
						/>
				</FormItem>
				<FormItem {...formItemLayout} label="GMT">
						<Input placeholder="GMT" value={this.state.gmt} disabled={this.state.disabled}
							onChange={e => this.setState({ gmt: e.target.value })}
						/>
				</FormItem>
				<FormItem {...formItemLayout} label="Title">
						<Input placeholder="Title" value={this.state.title} disabled={this.state.disabled}
							onChange={e => this.setState({ title: e.target.value })}
						/>
				</FormItem>
				<FormItem {...formItemLayout} label="Questions">
						<Input placeholder="Questions" value={this.state.questions} disabled={this.state.disabled}
							onChange={e => this.setState({ questions: e.target.value })}
						/>
				</FormItem>
			</Col>
		}

		let tableDetails;
		if (this.props.mode !== "view") {
			tableDetails = ''
		}else{
			tableDetails = <div>
				<Divider />
				<Row gutter={12}>
					<Col span={8} style={{ padding: "0 0 0 6px" }}>
						<h4>List of Status</h4>
					</Col>
				</Row>

				<BootstrapTable data={this.state.dataDetails}>
					<TableHeaderColumn dataField="status" dataAlign="center" width='100px' >Status</TableHeaderColumn>
					<TableHeaderColumn dataField="created_at" dataAlign="center" width='100px' dataFormat = {this._dateFormat.bind(this)}>Date of Updated Status</TableHeaderColumn>
					<TableHeaderColumn dataField="note" isKey dataAlign="center" width='100px' >Description</TableHeaderColumn>
				</BootstrapTable>
			</div>
		}

		if(this.state.isAuthorized){
			return (
				<div>
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
												pathname : '/help'
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
												pathname : '/help'
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
							{helpForm}
						</Row>
					</Form>

					{tableDetails}

				</div>
				
			);

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

export default withRouter(connect(mapStateToProps, { LogUser, FormMode })(HelpForm));
