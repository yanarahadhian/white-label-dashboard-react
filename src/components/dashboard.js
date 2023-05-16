import React, { Component } from 'react';
import { withRouter, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { Icon, Layout, Menu, Dropdown } from "antd";
import { LogUser } from '../actions';
import moment from 'moment'
import PageMenu from './page_menu';
import '../templates/dashboard.css'
import '../App.css'
import { config } from "../config";
import DashboardStatistic from './dashboard_statistic'
import DashboardTransactions from './dashboard_transactions'
import DashboardPPOB from './dashboard_ppob_growth'
import DashboardBB from './dashboard_bb'
import DashboardTableBest from './dashboard_table_best'
import { changeNetworkPreferences } from '../middleware/network'
const { Header, Sider, Content } = Layout;
// import PageLogo from './page_logo';
// import PageHeader from './header';

class Dashboard extends Component {
	constructor(props) {
		super(props)

		this.state = {
			time : 100,
			minutes : '00',
			hours : '00',
			days : '00',
			user_rights : (this.props.user.rights) ? this.props.user.rights : '',
			collapsed : false,
			profileCollapsed : true
		}
		
		// eslint-disable-next-line
		this.secondsRemaining
		// eslint-disable-next-line
		this.intervalHandle

		this.toggle = this.toggle.bind(this)
		this.toggleProfile = this.toggleProfile.bind(this)
		this.startCountDown = this.startCountDown.bind(this)
		this.tick = this.tick.bind(this)
	}

	tick() {
		// this.secondsRemaining--
		this.setState({
			minutes : this.secondsRemaining
		})
	}

	startCountDown() {
		// this.intervalHandle = setInterval(this.tick, 1000)
		
		let time = this.state.time
		
		this.secondsRemaining = time
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

	render() {
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
				<Header style={{ background: 'rgba(255, 255, 255, 0.7)', paddingLeft: '30px' , textAlign: 'left', cursor: 'pointer' }}>

					<img className="menu-trigger" src={ iconBurger } onClick={ this.toggle } alt=""></img>

					<img className="logo-home" src={ dashboardLogo } alt="Agan"></img>

					<Dropdown overlay={userMenu} trigger={['click']}>
						<a className="ant-dropdown-link" style={{ float: 'right', marginRight: '20px', textDecoration: 'none' }}>
							<span className="user_name"><Icon type="user" /> {this.props.user.name}</span> <Icon type="down" />
						</a>
					</Dropdown>
				</Header>

				<Layout>
					<Sider
						trigger={ null }
						collapsible
						collapsed={ this.state.collapsed }
						width={ 230 }
						>

						<PageMenu rights={ this.state.user_rights } />
					</Sider>

					<Content style={{ height: 750 ,padding: 24, background: '#f0f2f4' }}>
						
						<DashboardStatistic />
						<DashboardTransactions />
						<DashboardPPOB />
						<DashboardBB />
						<DashboardTableBest />

					</Content>
				</Layout>
			</Layout>
		)
	}
}

function mapStateToProps(state) {
    const { user } = state
	
	return {
        user
    }
}

export default withRouter(connect (mapStateToProps, { LogUser }) (Dashboard))
