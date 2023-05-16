import React, { Component } from "react";
import { Button, Icon, Checkbox, Input, Form, message } from "antd";
// import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { LogUser } from '../actions';
import jwt from 'jsonwebtoken'
import axios from "axios";
import "../App.css";
import "../templates/login.css";
import { config } from "../config";
import { changeNetworkPreferences } from '../middleware/network'

const FormItem = Form.Item;

class Login extends Component {
	constructor(props) {
		super(props);

		this.state = {
			username: "",
			password: "",
			isLoading: false,
			disableLoginButton : false,
			api_url: config().api_url,
			storeCredential: false
		};

		this.handleSubmit = this.handleSubmit.bind(this);
		this.Login = this.Login.bind(this);
		this.validateForm = this.validateForm.bind(this);
		this.setCredentialsToCookie = this.setCredentialsToCookie.bind(this);
		this.findTokenOnCookie = this.findTokenOnCookie.bind(this);
		this.handleRememberMe = this.handleRememberMe.bind(this);
	}

	componentDidMount(){
		const token = localStorage.getItem('token')

		if (token !== null) {
			this.props.history.push('/')
		}

		let cookieToken = this.findTokenOnCookie();
		let isCookieToken = cookieToken !== '';

		if (isCookieToken) {
			let cookie = jwt.decode(cookieToken, { complete: true })

			this.setState({
				username: cookie.payload.username,
				password: cookie.payload.pw
			})
		}
	}

	setCredentialsToCookie(username, password) {
		// set expiration time for cookie for one day
		let newDate = new Date();
		newDate.setTime(newDate.getTime() + (1 * 24 * 60 * 60 * 1000));
		let dateExpiration = "expires=" + newDate.toUTCString();

		let hashedCredentials = jwt.sign({
			username : username,
			pw: password
		}, 'aganjpx')

		let cookie = `token=${hashedCredentials};${dateExpiration};path=/`
	
		window.document.cookie = cookie;
	}

	findTokenOnCookie() {
		let fieldName = 'token=';
		let decodedCookie = decodeURIComponent(window.document.cookie).split(';');

		for(let i = 0; i < decodedCookie.length; i++) {
			let c = decodedCookie[i].trim();
			if (c.indexOf(fieldName) === 0) {
				let token = c.substring(fieldName.length, c.length);
				return token;
			}
		}

		return ''
	}

	handleRememberMe() {
		let status = false

		if (this.state.storeCredential === false) {
			status = true
		}

		this.setState({
			storeCredential: status
		})
	}

	Login(username, password) {
		let { api_url } = this.state
		let dispatch = this.props

		// HTTP Request Management
		let axiosConfig = {
			method : 'POST',
			url : api_url + '/api/auth/login',
			data : {
				username 		: username,
				password 		: password
			}
		}

		return new Promise( function (resolve, reject) {
			axios(axiosConfig)
			.then((res) => {
				if (res.data.ResponseCode === "200") {
					// console.log('login res : ', res.data.ResponseData)
					let arr = {
						token: res.data.ResponseData.token_id,
						name: res.data.ResponseData.data.name,
						username: res.data.ResponseData.data.username,
						role: res.data.ResponseData.data.role,
						role_level: res.data.ResponseData.data.role_level,
						rights: res.data.ResponseData.data.rights,
						token_exp: res.data.ResponseData.token_exp,
						network: parseInt(res.data.ResponseData.data.network, 10),
						network_name: res.data.ResponseData.data.network_name,
						favicon: res.data.ResponseData.data.favicon,
						url_website: res.data.ResponseData.data.url_website,
						sender_email: res.data.ResponseData.data.sender_email,
						dashboard_logo: res.data.ResponseData.data.dashboard_logo
					}

					localStorage.setItem('token', arr.token)
					dispatch.LogUser(arr)

					resolve(res)
				} else {
					console.log(res)
					reject(res.data.ResponseDesc)
				}
			}).catch((err) => {
				console.log(err)
				reject(err)
			})
		})
	}

	async handleSubmit (e) {
		e.preventDefault()		
		this.setState({ isLoading: true })
		let validate = await this.validateForm()

		if (validate) {
			try {
				await this.Login(this.state.username, this.state.password);
				
				if (this.state.storeCredential) {
					this.setCredentialsToCookie(this.state.username, this.state.password);
				}
				
				this.props.history.push('/')
				changeNetworkPreferences({ title : this.props.user.network_name, favicon : this.props.user.favicon })
			} catch (e) {
				console.log(e)
				message.error(e)
			}
		}
	}

	validateForm() {
		let validate = false
		let { username, password} = this.state
		let regExp = RegExp(/[!@#$%^&*()_+/;,-.?":{\\~`}[|<\]\s>]/) // regex to test if given value contains space and special characters

		if (username.length <= 0) {
			message.error("Username can not be empty")
		} else if (password.length <=0) {
			message.error("Password can not be empty")
		} else if (regExp.test(username)) {
			message.error("Username can not contains space and special characters")
		} else {
			validate = true
		}

		return validate
	}

	render() {
		return (
		<div className="Login-page">
			<div className="Login-form">

				<div className="centered">
					<img className="main-logo" src="logo_agan.png" alt=""/>
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
						<Input	defaultValue={ this.state.password } 
								size="large"
								prefix={<Icon type="lock" 
								style={{ color: 'rgba(0,0,0,.25)' }} />} 
								type="password" 
								placeholder="Password" 
								onChange={ e => this.setState({ password: e.target.value }) }
						/>
					</FormItem>

					<FormItem>
						<Checkbox onChange={ this.handleRememberMe }>Remember me</Checkbox>
						<a className="login-form-forgot" href="/forgot_password">Forgot password</a>
					</FormItem>

					<FormItem>
						<div className="centered">
							<Button 
								type="primary"
								htmlType="submit" 
								className="login_button"
								>
								LOGIN
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

export default connect(mapStateToProps, { LogUser })(Login);
