import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Input, Form, message, Row, Col, Select } from "antd";
import { FormMode, LogUser } from '../actions';
import axios from "axios";
import { config } from "../config";
const FormItem = Form.Item;
const Option = Select.Option;

class AreaForm extends Component {
  constructor(props){
    super(props)

    this.state = {
      id: (this.props.match.params.area) ? this.props.match.params.area : '',
      isAuthorized: false,
      province_id: '',
      area: '',
      note: '',
      provinceList : [],
      returnPage : false,
      disabled: (this.props.location.pathname.includes("edit")) ? true : false,
      api_url: config().api_url,
      config: { headers: {'token': localStorage.getItem('token')}}
    }
  }

  validateForm() {
    return this.state.province_id !== '' && this.state.area.length > 0 ;
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

        if (isModeAdd && rights[item].create === 1) {
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
    let { api_url, config, isAuthorized } = this.state
    
    if (isAuthorized) {
      let areaId = this.props.match.params.area

      if (areaId) {
        let url = api_url + '/api/area/?id=' + areaId

        axios.get(url, config)
        .then((response) => {
          console.log(response.data)

          if (response.data.ResponseCode === '200') {
            let note = (response.data.ResponseData[0].note) ? (response.data.ResponseData[0].note) : ('')
  
            this.setState({
              province_id: response.data.ResponseData[0].province_id,
              area: response.data.ResponseData[0].area,
              note
            })
          } else {
            if (response.data.status === '401') {
              // if login auth exipre, set data to empty and show message of auth expiration
              this.setState({ disabled : true, isAuthorized : false }, () => {
                message.error('Login Authentication Expired. Please Login Again!')
                this.props.signOutUser()
              })
            } else {
              message.error((response.data.ResponseDesc.sqlMessage) ? ('Database Error!') : (response.data.ResponseDesc) )
            }
          }
        }, (err) => {
          console.error(err)
        })  
      }

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

  async handleSubmit (e) {
    e.preventDefault()

    let { api_url, config, id, returnPage } = this.state
    let areaId = id

    let payload = {
      id: this.state.id,
      province_id: this.state.province_id,
      area: this.state.area,
      note: this.state.note
    }
    
    let axiosConfig = {
      method : (areaId) ? ('PUT') : ('POST'),
      url : api_url + '/api/area/',
      data : payload,
      headers : config.headers
    }
    
    try {
      axios(axiosConfig)
      .then((response) => {
        console.log(response.data)

        if (response.data.ResponseCode === "200") {
          message.success(response.data.ResponseDesc)

          if (returnPage) {
            this.props.history.push({ pathname: '/city' })
          }
          
        } else {
          if (response.data.status === '401') {
            // if login auth exipre, set data to empty and show message of auth expiration
            this.setState({ disabled : true, isAuthorized : false }, () => {
              message.error('Login Authentication Expired. Please Login Again!')
            })
          } else {
            let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : "Update Failed"
            console.log(msg)
            message.error(msg)
          }
        }
      }, (err) => {
        message.error(err.data.ResponseDesc)
      })
    } catch (e) {
        message.error(e.data.ResponseDesc)
    }
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

    if (this.state.isAuthorized) {
      return (
        <Form className="form_view" onSubmit={this.handleSubmit.bind(this)}>
          
          <Row type="flex" justify="end" style={{ marginBottom : '45px' }}>
            <Col>
              <Button 
                className='base_button primary'
                type="primary" 
                htmlType="submit" 
                style={{ marginLeft: '5px' }}
                onClick={ () => {
                  this.props.history.push({
                    pathname : '/city'
                  })
                } }
                >
                Back
              </Button>
            </Col>

            <Col>
              <Button 
                className={ (this.validateForm()) ? ('base_button primary') : ('button_disabled') }
                type="primary" 
                htmlType="submit" 
                disabled={!this.validateForm()}
                style={{ marginLeft: '5px' }}
                onClick={ () => this.setState({ returnPage : true }) }
                >
                Save & Back
              </Button>
            </Col>

            <Col>
              <Button 
                className={ (this.validateForm()) ? ('base_button primary') : ('button_disabled') }
                type="primary" 
                htmlType="submit" 
                disabled={!this.validateForm()}
                style={{ marginLeft: '5px' }}
              >
                Save
              </Button>
            </Col>
          </Row>
          
          <Row gutter={12}>
              <Col span={8} style={{ padding: "0 0 0 6px" }}>
                    <Input type="hidden" placeholder="ID" value={this.state.id} disabled={this.state.disabled}
                      onChange={e => this.setState({ id: e.target.value })}
                    />
                <FormItem {...formItemLayout} label="Province" required={true}>
                  <Select showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0} 
                  placeholder="Province" value={this.state.province_id} defaultValue={this.state.province_id}
                  onChange={e => this.setState({ province_id: e })}
                  >
                  {
                    Object.keys(provinces).map((item) => {
                      return (<Option key={provinces[item].id} value={provinces[item].id}>{provinces[item].province_name}</Option>)
                    })
                  }
                  </Select>
              </FormItem>
                <FormItem {...formItemLayout} label="City" required={true}>
                    <Input placeholder="City" value={this.state.area} 
                      onChange={e => this.setState({ area: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Description">
                    <Input placeholder="Description" value={this.state.note} 
                      onChange={e => this.setState({ note: e.target.value })}
                    />
                </FormItem>
              </Col>
          </Row>
                {/* <div style={{ marginTop: '30px' }}>
                  <Button 
                    type="default" 
                    onClick={()=>this.props.history.push({
                      pathname: '/city'
                    })}
                  >
                    Back
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    disabled={!this.validateForm()}
                    style={{ marginLeft: '5px' }}
                  >
                    Save
                  </Button>
                </div> */}
          </Form>
      )
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

export default withRouter(connect(mapStateToProps, { LogUser, FormMode })(AreaForm));
