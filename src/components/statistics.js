import React, { Component } from 'react';
import { withRouter, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { Icon, Layout, Menu, Dropdown, Row, Col, Breadcrumb } from "antd";
import { LogUser } from '../actions';
import moment from 'moment'
import PageMenu from './page_menu';
import StatisticsDetails from './statistics_details';
import '../templates/dashboard.css'
import '../App.css'
import { config } from "../config";
import { changeNetworkPreferences } from '../middleware/network'
const { Header, Sider, Content } = Layout;

class Statistics extends Component {
    constructor(props) {
        super(props)
        
        this.state = {
            user_rights : (this.props.user.rights) ? this.props.user.rights : '',
            collapsed : false,
            profileCollapsed : true
        }

        this.toggle = this.toggle.bind(this)
		this.toggleProfile = this.toggleProfile.bind(this)
    }

    signOutUser() {
		localStorage.removeItem('token')
		localStorage.removeItem('state')
		window.location.replace('/login')
	}

	toggle() {
		this.setState({
			collapsed : ! this.state.collapsed
		})
	}

	toggleProfile() {
		this.setState({
			profileCollapsed: !this.state.profileCollapsed
		})
	}

	componentWillMount() {
		const token = localStorage.getItem('token')
		const token_exp = this.props.user.token_exp

		if (token === null || token === undefined || moment().isAfter(moment(token_exp).format("YYYY-MM-DD HH:mm:ss"))) {
			this.signOutUser()
		} else {
			changeNetworkPreferences({ title : this.props.user.network_name, favicon : this.props.user.favicon })
		}
	}

	componentDidMount() {
		// this.startCountDown()
	}

    render () {
        let dashboardLogo = (this.props.user.dashboard_logo) ? (this.props.user.dashboard_logo) : (config().asset_url.dashboard_logo)
		let iconBurger = config().asset_url.icon_burger

		const userMenu = (
			<Menu>
				<Menu.Item key="1" onClick={this.signOutUser}>Logout</Menu.Item>
				<Menu.Item key="2"><Link to={"/my_profile/" + this.props.user.username}>My Profile</Link></Menu.Item>
			</Menu>
        )
        
        return (
			<Layout>
				<Header className='header'>
					<Row type="flex" justify="space-between" align="middle">
						<Col xs={12} sm={4}>
							<img className="menu-trigger" src={ iconBurger } onClick={ this.toggle } alt=""></img>
							<img className="logo-home" src={ dashboardLogo } alt="Agan"></img>
						</Col>

						<Col sm={12} className='header-breadcrumb'>
							<Breadcrumb separator=">">
								<Breadcrumb.Item>Home</Breadcrumb.Item>
								<Breadcrumb.Item>Agent Management</Breadcrumb.Item>
								<Breadcrumb.Item>User Statistics</Breadcrumb.Item>
							</Breadcrumb>
						</Col>

						<Col xs={12} sm={8}>
							<Dropdown overlay={userMenu} trigger={['click']}>
								<a className="ant-dropdown-link" style={{ float: 'right', textDecoration: 'none' }}>
									<span className="user_name"><Icon type="user" /> {this.props.user.name}</span> <Icon type="down" />
								</a>
							</Dropdown>
						</Col>
					</Row>
				</Header>

				<Layout>
					<Sider trigger={ null } collapsible collapsed={ this.state.collapsed } width={ 230 }>
						<PageMenu rights={ this.state.user_rights } />
					</Sider>

					<Content style={{ height: 750 ,padding: 24, background: '#ffffff' }}>
						<StatisticsDetails />
					</Content>
				</Layout>
			</Layout>
		)
    }
}

function mapStateToProps(state) {
    const { user } = state

    return { user }
}

export default withRouter(connect(mapStateToProps, { LogUser })(Statistics))