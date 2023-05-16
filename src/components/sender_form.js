import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Input, Form, message, Row, Col } from "antd";
import { FormMode, LogUser } from '../actions';
import axios from "axios";
import { config } from "../config";
const FormItem = Form.Item;

class SenderForm extends Component {
  constructor(props){
    super(props)

    this.state = {
      isAuthorized: false,
      id: this.props.match.params.id,
      sender: '',
      description: '',
      disabled: (this.props.location.pathname.includes("view")) ? true : false,
      api_url: config().api_url,
      config: { headers: {'token': localStorage.getItem('token')}}
    }
  }

  validateForm() {
    return this.state.sender === "";
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
    let url = api_url + '/api/senders/?id=' + id

    if (isAuthorized) {
      if (id) {
        axios.get(url, config)
        .then((response) => {
          this.setState({
            sender: response.data.ResponseData[0].sender,
            description: response.data.ResponseData[0].description,
          })
        }, (err) => {
          console.error(err)
        })
      }
    }
  }

  async handleSubmit (e){
    e.preventDefault();
    this.setState({
        isLoading: true,
    })

    if(this.validateForm()===true){
      message.error("Please fill required fields")
      return false
    }
    else{
      let { api_url } = this.state
      let url = api_url + '/api/senders/'

      let data = {
        id: this.state.id,
        sender: this.state.sender,
        description: this.state.description,
      }
      
      try {

        if(this.props.match.params.id){
          axios.put(url,data,this.state.config)
          .then((response) => {
              if(response.data.ResponseCode==="500"){
                let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : ""
                message.error(msg)
              }
              else{
                message.success(response.data.ResponseDesc)

                this.props.history.push({
                  pathname: '/sender',
                  state: { page_id: this.state.page_id }
                })
              }
              
          }, (err) => {
            message.error(err.data.ResponseDesc)
            this.setState({ isLoading: false })
          })
        }
        else{
          axios.post(url,data,this.state.config)
          .then((response) => {
              if(response.data.ResponseCode==="500"){
                let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : ""
                message.error(msg)
              }
              else{
                message.success(response.data.ResponseDesc)

                this.props.history.push({
                  pathname: '/sender',
                  state: { page_id: this.state.page_id }
                })
              }
              
          }, (err) => {
            message.error(err.data.ResponseDesc)
            this.setState({ isLoading: false })
          })
        }
        
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
        sm: { span: 10 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 12 },
      },
    }

    if(this.state.isAuthorized){
      return (
        <Form className="form_view" onSubmit={this.handleSubmit.bind(this)}>
          <Row gutter={12}>
              <Col span={8} style={{ padding: "0 0 0 6px" }}>
                <FormItem {...formItemLayout} label="Sender" required={true}>
                    <Input placeholder="Sender" value={this.state.sender} disabled={this.state.disabled}
                      onChange={e => this.setState({ sender: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Description">
                    <Input placeholder="Description" value={this.state.description} disabled={this.state.disabled}
                      onChange={e => this.setState({ description: e.target.value })}
                    />
                </FormItem>
              </Col>
          </Row>
                <div style={{ marginTop: '30px' }}>
                  <Button 
                    type="default" 
                    onClick={()=>this.props.history.push({
                      pathname: '/sender'
                    })}
                  >
                    Back
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    disabled={this.state.disabled}
                    style={{ marginLeft: '5px' }}
                  >
                    Save
                  </Button>
                </div>
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

export default withRouter(connect(mapStateToProps, { LogUser, FormMode })(SenderForm));
