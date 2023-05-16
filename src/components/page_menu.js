import React from 'react';
import { Link } from 'react-router-dom';
import { Icon, Menu } from "antd";
const SubMenu = Menu.SubMenu;

class PageMenu extends React.Component {
  
  render() {
    var rights = this.props.rights
    var menus = []
    var displayMenus = []

    //eliminate redundant menus for looping
    for (let i = 0; i < rights.length; i++) {
      var menu = rights[i].menu_id
      if (menus.indexOf(menu) === -1) {
        menus.push(menu)
      }
    }

    //loop through all menus
    for(let i = 0; i < menus.length; i++) {
      let menu_name = ""
      let menu_icon = ""
      var pages = []

      for(let j = 0; j < rights.length; j++) {

        if (rights[j].menu_id === menus[i]) {
          menu_name = rights[j].display_name
          menu_icon = rights[j].icon_class

          pages.push(<Menu.Item key={ rights[j].page_id }><Link to={{ pathname: rights[j].page_url, state: { page_id: rights[j].page_id, rights: rights}}} ><Icon type={rights[j].class_icon} />{rights[j].page_name}</Link></Menu.Item>)       
        }
      }

      displayMenus.push(<SubMenu key={"sub"+i} title={<span><Icon type={menu_icon} /><span>{menu_name}</span></span>}>{pages}</SubMenu>)
    }  

    return (
      <Menu theme="light" mode="inline" defaultSelectedKeys={['1']}>
        <Menu.Item key="1" style={{ marginTop : '10px' }}>
          <Link to="/">
            <Icon type="dashboard" />
              <span>Dashboard</span>
          </Link>
        </Menu.Item>
        
        { displayMenus }
      </Menu>
    )
  }
}

export default PageMenu