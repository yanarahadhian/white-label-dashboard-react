import React, { Component } from 'react';
import { withRouter, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { Icon, Layout, Menu, Dropdown } from "antd";
import moment from 'moment';
import PageLogo from './page_logo';
import PageMenu from './page_menu';
import { LogUser } from '../actions';
const { Header, Sider, Content } = Layout;
// import PageHeader from './header';

class PageContainer extends Component {
  constructor(props){
    super(props)

    this.state = {
      user_rights: (this.props.user.rights) ? this.props.user.rights : '',
      collapsed: false,
      profileCollapsed: true,
    };

    this.toggle = this.toggle.bind(this);
    this.toggleProfile = this.toggleProfile.bind(this);
  }

  signOutUser(){
    localStorage.removeItem('token')
    localStorage.removeItem('state')
    window.location.replace('/login')
  }

  toggle(){
    this.setState({
      collapsed: !this.state.collapsed,
    });
  }

  toggleProfile(){
    this.setState({
      profileCollapsed: !this.state.profileCollapsed,
    });
  }

  componentWillMount(){
    const token = localStorage.getItem('token');
    const token_exp = this.props.user.token_exp;

    if(token === null || token === undefined || moment().isAfter(moment(token_exp).format("YYYY-MM-DD HH:mm:ss"))){
      this.signOutUser()
    }
    
  }
  
  render() {
    console.log(this.props)
    const userMenu = (
        <Menu>
          <Menu.Item key="1" onClick={this.signOutUser}>Logout</Menu.Item>
          <Menu.Item key="2"><Link to={"/my_profile/" + this.props.user.username}>My Profile</Link></Menu.Item>
        </Menu>
    )

    return (
      <Layout>
        <Sider
          trigger={null}
          collapsible
          collapsed={this.state.collapsed}
          width={230}
        >
          <PageLogo collapsed={this.state.collapsed} />
          <PageMenu rights={this.state.user_rights} />
        </Sider>
        <Layout>
          <Header style={{ background: '#fff', paddingLeft: '30px' , textAlign: 'left', cursor: 'pointer' }}>
            <Icon
              className="trigger"
              type={this.state.collapsed ? 'menu-unfold' : 'menu-fold'}
              onClick={this.toggle}
            />
            <Dropdown overlay={userMenu} trigger={['click']}>
              <a className="ant-dropdown-link" style={{ float: 'right', marginRight: '20px', textDecoration: 'none' }}>
                <span className="user_name"><Icon type="user" /> {this.props.user.name}</span> <Icon type="down" />
              </a>
            </Dropdown>
            
          </Header>
          <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}>
            {this.props.children}
          </Content>
        </Layout>
      </Layout>
    );
  }
}

function mapStateToProps(state) {
    const { user } = state;
    return {
        user
    }
}

export default withRouter(connect(mapStateToProps, { LogUser })(PageContainer));
