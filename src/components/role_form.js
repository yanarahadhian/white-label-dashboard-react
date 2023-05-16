import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Input, Form, message, Row, Col, Select } from "antd";
import { FormMode, LogUser } from '../actions';
import axios from "axios";
import { config } from "../config";
const FormItem = Form.Item;
const Option = Select.Option;

class RoleForm extends Component {
  constructor(props){
    super(props)

    this.state = {
      id: '',
      isAuthorized: false,
      oldName : '',
      name: '',
      description: '',
      level: undefined,
      return: false,
      disabled: this.props.location.pathname.includes("edit") ? true : false,
      api_url: config().api_url,
      config: { headers: {'token': localStorage.getItem('token')}},
      viewMode : this.props.location.pathname.includes("view")
    }
  }

  validateForm() {
    let isViewMode = this.props.location.pathname.includes("view")

    if (isViewMode) {
      return false
    } else if (this.state.name.length > 0 && this.state.level !== '') {
      return true
    }
  }

  componentWillMount() {
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
          id: this.props.match.params.role,
          isAuthorized: authorize
        })
      }
    }
  }

  componentDidMount() {
    if (this.state.isAuthorized) {
      if (this.props.match.params.role) {
        axios.get(this.state.api_url+'/api/role/?id='+this.props.match.params.role,this.state.config)
        .then((response) => {
            this.setState({
              oldName: response.data.ResponseData[0].name,
              name: response.data.ResponseData[0].name,
              description: response.data.ResponseData[0].description,
              level: response.data.ResponseData[0].level.toString()
            })
        }, (err) => {
          console.error(err)
        })  
      }
    }
  }

  async handleSubmit (e) {
    e.preventDefault();
    
    this.setState({
        isLoading: true,
    })

    let { api_url, config, id, name, oldName, description, level } = this.state
    let roleID = this.props.match.params.role

    let payload = { oldName, name, description, level }

    let axiosConfig = {
      url : api_url + '/api/role/',
      data : payload,
      headers : config.headers
    }

    if (roleID) {
      axiosConfig.url += `?id=${id}`
      axiosConfig.method = 'PUT'
    } else {
      axiosConfig.method = 'POST'
    }

    try {
      axios(axiosConfig)
      .then((response) => {
        if (response.data.ResponseCode === '500') {
          let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : ""
          message.error(msg)
        } else if (response.data.ResponseCode === '200') {
          message.success(response.data.ResponseDesc)
          
          if (this.state.return) {
            this.props.history.push({
              pathname: '/role',
              state: { page_id: this.state.page_id }
            })
          }
        } else {
          message.error(response.data.ResponseDesc)
          this.setState({ isLoading: false })  
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
  
  render() {
    const { isAuthorized, viewMode } = this.state
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 10 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 14 },
      }
    }

    if (isAuthorized) {
      return (
        <Form className="form_view" onSubmit={this.handleSubmit.bind(this)}>
          <Row type='flex' justify='end' style={{ marginBottom : '30px' }}>
            <Col>
              <Button
                className="base_button primary"
                type="default" 
                onClick={()=>this.props.history.push({
                  pathname: '/role'
                })}
              >
                Back
              </Button>
              
              {
                (!viewMode) && (
                  <React.Fragment>
                    <Button 
                      className={ (this.validateForm()) ? ("base_button primary") : ("button_disabled") }
                      type="default" 
                      htmlType="submit" 
                      disabled={!this.validateForm()}
                      style={{ marginLeft: '5px' }}
                      >
                      Save
                    </Button>

                    <Button 
                      className={ (this.validateForm()) ? ("base_button primary") : ("button_disabled") }
                      type="primary" 
                      htmlType="submit" 
                      disabled={!this.validateForm()}
                      style={{ marginLeft: '5px' }}
                      onClick={()=>this.setState({ return: true })}
                      >
                      Save & Back
                    </Button>
                  </React.Fragment>
                )
              }
            </Col>

          </Row>

          <Row gutter={12}>
              <Col span={8} style={{ padding: "0 0 0 6px" }}>
                    <Input type="hidden" placeholder="ID" value={this.state.id} 
                      onChange={e => this.setState({ id: e.target.value })}
                    />
                <FormItem {...formItemLayout} label="Name">
                    <Input placeholder="Type role name .." value={this.state.name} disabled={ this.props.location.pathname.includes("view") ? true : false }
                      onChange={e => this.setState({ name: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Description">
                    <Input placeholder="Type role description .." value={this.state.description} disabled={ this.props.location.pathname.includes("view") ? true : false }
                      onChange={e => this.setState({ description: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Level">
                    <Select showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                      placeholder="Select role level .." value={this.state.level} disabled={ (viewMode) ? (true) : (false) }
                      onChange={e => this.setState({ level: e })}
                    >
                      <Option key="0" value="0">Super Admin</Option>
                      <Option key="1" value="1">Super User</Option>
                      <Option key="2" value="2">Admin</Option>
                      <Option key="3" value="3">Agent</Option>
                    </Select>
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

export default withRouter(connect(mapStateToProps, { LogUser, FormMode })(RoleForm))
