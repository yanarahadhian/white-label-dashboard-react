import React from "react";
import { Route, Switch, withRouter, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { LogUser } from '../actions';
import { Button, Icon, Checkbox, Dropdown, Layout, Menu } from "antd";
const { Header, Sider, Content } = Layout;
const SubMenu = Menu.SubMenu;

class PageSider extends React.Component {
  constructor(props){
    super(props)

    this.state = {
      collapsed: false
    };

    this.toggle = this.toggle.bind(this);
  }

  toggle(){
    this.setState({
      collapsed: !this.state.collapsed,
    });
  }
  
  render() {
    return (
      <Sider
          trigger={null}
          collapsible
          collapsed={this.state.collapsed}
        >
          <div style={{ display: this.state.collapsed === true ? 'none' : 'block', padding: '10px' }}>
            <a href="http://localhost:3000" target="_blank">
              <img className="img-circle" src="logo_final.png" width="180" height="auto"/>
            </a>
          </div>
          <Menu theme="light" mode="inline" defaultSelectedKeys={['1']}>
            <Menu.Item key="1">
              <Icon type="dashboard" />
              <span>Dashboard</span>
            </Menu.Item>
            <SubMenu
              key="sub1"
              title={<span><Icon type="copy" /><span>Reports</span></span>}
            >
              <Menu.Item key="2"><Link to="/transaction"><Icon type="credit-card" />Transaction Logs</Link></Menu.Item>
              <Menu.Item key="3"><Icon type="wallet" />Wallet Logs</Menu.Item>
            </SubMenu>
            <SubMenu
              key="sub2"
              title={<span><Icon type="tool" /><span>Setting</span></span>}
            >
              <Menu.Item key="4"><Icon type="user" />Users</Menu.Item>
            </SubMenu>
          </Menu>
        </Sider>
    );
  }
}

function mapStateToProps(state) {
    const { user } = state;
    return {
        user
    }
}

export default withRouter(connect(mapStateToProps, { LogUser })(PageSider));