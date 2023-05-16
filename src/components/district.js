import React, { Component } from 'react';
import { Route, Switch, withRouter, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { Icon, Layout, Menu, Dropdown, Breadcrumb, Row, Col } from "antd";
import { LogUser } from '../actions';
import moment from "moment";
import { config } from "../config";
import DistrictForm from './district_form';
import DistrictList from './district_list';
import PageMenu from './page_menu';
import { changeNetworkPreferences } from '../middleware/network'
const { Header, Sider, Content } = Layout;

class Districts extends Component {
  constructor(props) {
    super(props)

    this.state = {
      user_rights: (this.props.user.rights) ? this.props.user.rights : '',
      collapsed: false,
      profileCollapsed: true,
      data: [],
      api_url: config().api_url
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
      collapsed: !this.state.collapsed
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
  
  render() {
    let dashboardLogo = (this.props.user.dashboard_logo) ? (this.props.user.dashboard_logo) : (config().asset_url.dashboard_logo)
    let iconBurger = config().asset_url.icon_burger

    const userMenu = (
        <Menu>
          <Menu.Item key="1" onClick={ this.signOutUser }>Logout</Menu.Item>
          <Menu.Item key="2"><Link to={ "/my_profile/" + this.props.user.username }>My Profile</Link></Menu.Item>
        </Menu>
    )
    
    return (
      <Layout>
				<Header style={{ background: 'rgba(255, 255, 255, 0.7)', paddingLeft: '30px' , textAlign: 'left' }} >
          <Row type="flex" justify="space-between" align="middle">
            <Col span={ 4 }>
              <img className="menu-trigger" src={ iconBurger } onClick={ this.toggle } alt=""></img>
              <img className="logo-home" src={ dashboardLogo } alt="Agan"></img>
            </Col>

            <Col span={ 10 }>
              <Breadcrumb separator=">">
                <Breadcrumb.Item>Home</Breadcrumb.Item>
                <Breadcrumb.Item>Area Management</Breadcrumb.Item>
                <Breadcrumb.Item>District</Breadcrumb.Item>
              </Breadcrumb>
            </Col>

            <Col span={ 8 }>
              <Dropdown overlay={userMenu} trigger={['click']}>
                <a className="ant-dropdown-link" style={{ float: 'right', marginRight: '20px', textDecoration: 'none' }}>
                  <span className="user_name"><Icon type="user" /> { this.props.user.name }</span> <Icon type="down" />
                </a>
              </Dropdown>
            </Col>
          </Row>
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

					<Content style={{ height: 750 ,padding: 24, background: '#ffffff' }}>

              <Switch>
                <Route exact path={ this.props.match.path } component={ DistrictList } />
                <Route path={ this.props.match.path + "/new" } component={ DistrictForm } />
                <Route path={ this.props.match.path + "/view/:id" } component={ DistrictForm } />
                <Route path={ this.props.match.path + "/edit/:id" } component={ DistrictForm } />
             </Switch>

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

export default withRouter(connect(mapStateToProps, { LogUser })(Districts))
