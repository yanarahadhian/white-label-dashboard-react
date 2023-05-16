import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Input, Form, message, Row, Col, Select } from "antd";
import { FormMode, LogUser } from '../actions';
import axios from "axios";
import { config } from "../config";
const FormItem = Form.Item;
const Option = Select.Option;

class DistrictForm extends Component {
  constructor(props){
    super(props)

    this.state = {
      id: '',
      isAuthorized: false,
      district_name : '',
      province_id: '',
      area_id: '',
      area: '',
      province_name: '',
      provinceList: [],
      cityList: [],
      return: false,
      disabled: this.props.location.pathname.includes("edit") ? true : false,
      api_url: config().api_url,
      config: { headers: {'token': localStorage.getItem('token')}},
      viewMode : this.props.location.pathname.includes("view")
    }
    this.handleProvince = this.handleProvince.bind(this)
    this.handleArea = this.handleArea.bind(this)
  }

  validateForm() {
    let isViewMode = this.props.location.pathname.includes("view")

    if (isViewMode) {
      return false
    } else if (this.state.district_name.length > 0 && this.state.province_id !== '' && this.state.area_id !== '') {
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
          id: this.props.match.params.area,
          isAuthorized: authorize
        })
      }
    }
  }

  componentDidMount() {
    let { api_url, config, isAuthorized } = this.state
    console.log('props : ', this.props)
    if (isAuthorized) {
      let id = this.props.match.params.id

      if (id) {
        let url = api_url + '/api/district/?id=' + id

        axios.get(url, config)
        .then((response) => {
          console.log(response.data)

          if (response.data.ResponseCode === '200') {
            
  
            this.setState({
              id: response.data.ResponseData[0].id,
              district_name: response.data.ResponseData[0].district_name,
              area_id: response.data.ResponseData[0].area_id,
              province_id: response.data.ResponseData[0].province_id,
              area: response.data.ResponseData[0].area,
              province_name: response.data.ResponseData[0].province_name,
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

    let { api_url, config } = this.state

    let data = {
      id: this.state.id,
      district_name: this.state.district_name,
      province_id: this.state.province_id,
      area_id: this.state.area_id
    }

    let axiosConfig = {
      method : (this.state.id) ? ('PUT') : ('POST'),
      url : api_url + '/api/district/',
      data : data,
      headers : config.headers
    }
    
    try {
      axios(axiosConfig)
      .then((response) => {
        console.log(response.data)

        if (response.data.ResponseCode === "200") {
          message.success(response.data.ResponseDesc)
          
          this.props.history.push({
            pathname: '/district'
          })
        } else {
          if (response.data.status === '401') {
            // if login auth exipre, set data to empty and show message of auth expiration
            this.setState({ disabled : true, isAuthorized : false }, () => {
              message.error('Login Authentication Expired. Please Login Again!')
            })
          } else {
            let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : "Update Failed"
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

  handleProvince(e, key) {
    this.setState({
      province_name: e,
      province_id: key.key
    }, () => {
      this.fetchArea()
    })
  }

  fetchArea() {
    const { api_url, province_id, config } = this.state

    axios.get(api_url + '/api/area/?province_id=' + province_id, config)
    .then((response) => {
      console.log('Area List : ', response.data)
      
        this.setState({
          cityList: response.data.ResponseData
        })
    }, (err) => {
      console.error(err)
    })
  }

  handleArea(e, key) {
    this.setState({
      area: e,
      area_id: key.key
    })
  }
  
  render() {
    const { isAuthorized, viewMode } = this.state

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 8 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 12 },
      },
    }
    var provinces = this.state.provinceList
    var cities = this.state.cityList

    if (isAuthorized) {
      return (
        <Form className="form_view" onSubmit={this.handleSubmit.bind(this)}>
          
          <Row type='flex' justify='end' style={{ marginBottom : '30px' }}>
            <Col>
              <Button 
                className='base_button primary'
                type="default" 
                onClick={()=>this.props.history.push({
                  pathname: '/district'
                })}
              >
                Back
              </Button>
              
              {
                (!viewMode) && (
                  <Button 
                    className={ (this.validateForm()) ? ('base_button primary') : ('button_disabled') }
                    type="primary" 
                    htmlType="submit" 
                    disabled={!this.validateForm()}
                    style={{ marginLeft: '5px' }}
                  >
                    Save
                  </Button>
                )
              }
            </Col>
          </Row>

          <Row gutter={12}>
              <Col span={12} style={{ padding: "0 0 0 6px" }}>
                <FormItem {...formItemLayout} label="Province" required>
                    <Select 
                      showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                      placeholder="Province" 
                      value={this.state.province_name} 
                      disabled={ this.props.location.pathname.includes("view") ? true : false }
                      onChange={this.handleProvince.bind(this)}
                    >
                    {
                      Object.keys(provinces).map((item) => {
                        return (<Option key={provinces[item].id} value={provinces[item].province_name}>{provinces[item].province_name}</Option>)
                      })
                    }
                    </Select>
                </FormItem>
                <FormItem {...formItemLayout} label="City" required>
                    <Select 
                      showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                      placeholder="City" 
                      value={this.state.area} 
                      disabled={ this.props.location.pathname.includes("view") ? true : false }
                      onChange={this.handleArea.bind(this)}
                    >
                    {
                      Object.keys(cities).map((item) => {
                        return (<Option key={cities[item].id} value={cities[item].area}>{cities[item].area}</Option>)
                      })
                    }
                    </Select>
                </FormItem>
                <FormItem {...formItemLayout} label="District" required>
                    <Input placeholder="District" value={this.state.district_name} disabled={ this.props.location.pathname.includes("view") ? true : false }
                      onChange={e => this.setState({ district_name: e.target.value })}
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
    const { user, mode } = state;
    return {
        user,
        mode
    }
}

export default withRouter(connect(mapStateToProps, { LogUser, FormMode })(DistrictForm));
