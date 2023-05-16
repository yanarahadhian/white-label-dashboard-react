import React, { Component } from "react";
import { Button, Icon, Input, Form, message } from "antd";
import { connect } from 'react-redux';
import { LogUser } from '../actions';
import axios from "axios";
import "../App.css";
import "../templates/login.css";
import { config } from "../config";

const FormItem = Form.Item;

class ForgotPassword extends Component {
	constructor(props) {
		super(props);

		this.state = {
			username: "",
			isLoading: false,
			disableLoginButton : false,
			api_url: config().api_url
		};

		this.handleSubmit = this.handleSubmit.bind(this);
		this.validateForm = this.validateForm.bind(this);
	}

	async handleSubmit (e) {
        e.preventDefault();
        
        this.setState({
            isLoading: true,
        })
    
        let { api_url } = this.state
        
        let axiosConfig = {
            method : 'POST',
            url : api_url + '/api/users/reset_password',
            data : {
				username: this.state.username
			}
        }
        
        try {
          axios(axiosConfig)
          .then((response) => {
            if (response.data.ResponseCode === '500') {
                let msg = 'This account not found. Contact Administrator for more details'
                message.error(msg)
            } else if (response.data.ResponseCode === '200') {
                let msg = 'Your password already reset, please check your email and Login use new password!'
                message.success(msg)
              
                this.props.history.push({
                    pathname: '/login',
                })
              
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

	validateForm() {
		return this.state.username.length > 0 ;
	}

	render() {
		return (
		<div className="Login-page">
			<div className="forgotPassword-form">

				<div className="centered">
					<img className="main-logo" src="logo-agan.png" alt=""/>
				</div>

				<Form onSubmit={this.handleSubmit} className="login-form">
					<FormItem>
						<Input	defaultValue={ this.state.username } 
								size="large"
								prefix={<Icon type="user" 
								style={{ color: 'rgba(0,0,0,.25)' }} />} 
								placeholder="Username"
								onChange={ e => this.setState({ username: e.target.value }) }
						/>
					</FormItem>

					<FormItem>
						<div className="centered">
							<Button 
								type="primary"
								htmlType="submit" 
								style={{ width: '280px', height: '48px', borderRadius: '100px', backgroundColor: '#009de1', color: '#ffffff', fontFamily: 'Lato', fontSize: '17px', fontWeight: 'bold', lineHeight: 0.61 }}
								disabled={ !this.validateForm() }
								>
								SUBMIT
							</Button>
						</div>
					</FormItem>
				</Form>
			</div>

			<div>
				<img className="wave" src="https://s3-ap-southeast-1.amazonaws.com/jpx-whitelabel-api/assets/wave.png" alt=""/>
			</div>
		</div>
		);
	}
}

function mapStateToProps(state) {
	const { user } = state;
	return {
		user
	}
}

export default connect(mapStateToProps, { LogUser })(ForgotPassword);
