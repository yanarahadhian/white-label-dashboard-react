import React from "react";
import { Route, Switch, withRouter, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { LogUser } from '../actions';
import { Button, Icon, Checkbox, Dropdown, Layout, Menu } from "antd";
const { Header, Sider, Content } = Layout;

class PageHeader extends React.Component {
  constructor(props){
  	super(props)

  	this.state = {
      collapsed: false,
      profileCollapsed: true,
    };

    this.toggle = this.toggle.bind(this);
    this.toggleProfile = this.toggleProfile.bind(this);
  }

  signOutUser(){
    localStorage.removeItem('token')
    window.location.reload()
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
  
  render() {
    const userMenu = (
        <Menu>
          <Menu.Item key="1" onClick={this.signOutUser}>Logout</Menu.Item>
          <Menu.Item key="2"><Link to={"/my_profile/" + this.props.user.username}>My Profile</Link></Menu.Item>
        </Menu>
    )
    return (
      <Header style={{ background: '#fff', paddingLeft: '30px' , textAlign: 'left', cursor: 'pointer' }}>
        <Icon
            className="trigger"
              type={this.state.collapsed ? 'menu-unfold' : 'menu-fold'}
              onClick={this.toggle}
            />
            <Dropdown overlay={userMenu} trigger={['click']}>
              <a className="ant-dropdown-link" href="#" style={{ float: 'right', marginRight: '20px', textDecoration: 'none' }}>
                <span className="user_name"><Icon type="user" /> {this.props.user.Username}</span> <Icon type="down" />
              </a>
            </Dropdown>
            
          </Header>
    );
  }
}

function mapStateToProps(state) {
    const { user } = state;
    return {
        user
    }
}

export default withRouter(connect(mapStateToProps, { LogUser })(PageHeader));
