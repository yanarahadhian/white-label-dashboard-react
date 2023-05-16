import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Input, Form, message } from "antd";
import { FormMode, LogUser } from '../actions';
import axios from "axios";
import { config } from "../config";
const FormItem = Form.Item;

class ProfileForm extends Component {
  constructor(props){
    super(props)

    this.state = {
      username: '',
      name: '',
      email: '',
      phone_number: '',
      area: '',
      password: '',
      confirm_password: '',
      status: '',
      disabled: (this.props.mode === "edit") ? true : false,
      api_url: config().api_url,
      config: { headers: {'token': localStorage.getItem('token')}}
    }
  }

  validateForm() {
    return this.state.name.length > 0 && this.state.password.length > 0 && this.state.confirm_password.length > 0;
  }

  componentWillMount() {
    const { api_url, config } = this.state

    let username = this.props.match.params.username
    
    if (username) {
        let url = api_url + '/api/users/?username=' + username
        
        axios.get(url, config)
        .then((response) => {
          console.log('Profile : ', response.data)

			if (response.data.ResponseCode === '200' && response.data.ResponseData.length === 1) {
				this.setState({
					username : response.data.ResponseData[0].username,
					name : response.data.ResponseData[0].name,
					phone_number : response.data.ResponseData[0].phone_number
				})
			} else {
				if (response.data.status === '401') {
					message.error('Login Authentication Expired. Please Login Again!')
				} else {
					let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : ""
					message.error(msg)
				}
			}

        }, (err) => {
          console.error(err)
        })  
      } 
  }

  async handleSubmit (e){
    e.preventDefault()
    
    this.setState({ isLoading: true })

    const { password, confirm_password, api_url, config } = this.state;
    const url = api_url + '/api/users/change_password'
    
    if (password !== confirm_password) {
      message.error("Password doesn't match")
      return false
    } else {
      let data = {
        username: this.state.username,
        password: this.state.password
      }

      try {
        axios.post(url, data, config)
        .then((response) => {
          if (response.data.ResponseCode === '200') {
            message.success(response.data.ResponseDesc)
            setTimeout(() => {
              localStorage.removeItem('token')
              localStorage.removeItem('state')
              window.location.replace('/login')
            }, 2000)
          } else {
            if (response.data.status === '401') {
              this.setState({ isAuthorized : false }, () => {
                message.error('Login Authentication Expired. Please Login Again!')
              })
            } else {
              let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : "Change Password Failed"
              message.error(msg)
            }
          }
        })
        .catch((err) => {
          console.log('Change password error : ', err)
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
        sm: { span: 4 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 8 },
      },
    };

      return (
        <Form className="form_view" onSubmit={this.handleSubmit.bind(this)}>
                <FormItem {...formItemLayout} label="Name">
                    <Input placeholder="Name" value={this.state.name} 
                      onChange={e => this.setState({ name: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Phone Number">
                    <Input placeholder="Phone Number" pattern="[0-9]*" value={this.state.phone_number} disabled={true}
                      onChange={e => this.setState({ phone_number: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Password">
                    <Input type="password" placeholder="Password" value={this.state.password} 
                      onChange={e => this.setState({ password: e.target.value })}
                    />
                </FormItem>
                <FormItem {...formItemLayout} label="Confirm Password">
                    <Input type="password" placeholder="Confirm Password" value={this.state.confirm_password} 
                      onChange={e => this.setState({ confirm_password: e.target.value })}
                    />
                </FormItem>
                
                
                <div style={{ marginTop: '30px' }}>
                  <Button
					className='base_button primary'
                    type="default" 
                    onClick={()=>this.props.history.push({
                      pathname: '/',
                      state: { page_id: this.state.page_id }
                    })}
                  >
                    Close
                  </Button>
				  <Button 
					className={ (this.validateForm()) ? ('base_button primary') : ('button_disabled') }
                    type="primary" 
                    htmlType="submit" 
                    disabled={!this.validateForm()}
                    style={{ marginLeft: '5px' }}
                  >
                    Save
                  </Button>
                </div>
          </Form>
      )
  }
}

function mapStateToProps(state) {
    const { user, mode } = state;
    return {
        user,
        mode
    }
}

export default withRouter(connect(mapStateToProps, { LogUser, FormMode })(ProfileForm));
