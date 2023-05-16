import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, message } from "antd";
import { FormMode, LogUser } from '../actions';
import RenderRows from './render_rows';
import axios from "axios";
import { config } from "../config";

class RoleRights extends Component {
  constructor(props){
    super(props)

    this.state = {
      id: (this.props.match.params.role) ? this.props.match.params.role : '',
      isAuthorized: (props.location.state) ? (props.location.state.isAuthorized) ? props.location.state.isAuthorized : false : false,
      page_id: (props.location.state) ? (props.location.state.page_id) ? props.location.state.page_id : '' : '',
      api_url: config().api_url,
      pageList: {},
      rightList: {},
      roleRights: {},
      return: false,
      isLoading: false,
      checked: [],
      config: { headers: {'token': localStorage.getItem('token')}}
    }

    this.handleSubmit = this.handleSubmit.bind(this)
    this.onCheck = this.onCheck.bind(this)
  }

  componentWillMount() {
    let rights = this.props.user.rights
    let page_url = this.props.location.pathname

    let authorize = false

    for (let item in rights) {
      let isInclude = page_url.includes(rights[item].page_url)

      if (isInclude) {
        let isModeUpdate = page_url.includes("/change_rights")

        if (isModeUpdate && rights[item].update === 1) {
          authorize = true
        }

        this.setState({
          isAuthorized: authorize
        }, () => {
          this.processRights()
        })
      }
    }
  }

  getPageList(){
    var url = this.state.api_url
    var config = this.state.config
    return new Promise(function (resolve, reject){
      axios.get(url+'/api/menu/page_list/?page=all&size=0&orderBy=menu_id,page_order&hide=0', config)
      .then((response) => {
        resolve(response.data.ResponseData)
      }, (err) => {
        reject(err)
      })
    });
  }

  getRightList(){
    var url = this.state.api_url
    var id = this.state.id
    var config = this.state.config
    return new Promise(function (resolve, reject){
      axios.get(url+'/api/role/role_rights/'+id, config)
      .then((response) => {
        resolve(response.data.ResponseData)
      }, (err) => {
        reject(err)
      })
    });  
  } 

  async processRights(){
    //process the data before use
    const pages = await this.getPageList()
    const rights = await this.getRightList()
    var found = false
    var keys = []
    var checked = []

    //loop to find and map role rights with the associated page
    for (let item in pages) {
      // for(let key in rights) {
        for (let data in rights) {      
          found = (rights[data].menu_id === pages[item].page_id) ? true : false
          if (found === true){
            keys[item] = rights[data]
            break
          }
        // }               
      }
    }

    //load checked role rights into array
    for(let data in keys){
      //need to add identifier to each corresponding checkboxes
      if(keys[data].create === 1){
        checked.push(keys[data].menu_id+'_create')
      }
      
      if(keys[data].read === 1){
        checked.push(keys[data].menu_id+'_read')
      }
      
      if(keys[data].update === 1){
        checked.push(keys[data].menu_id+'_update')
      }
      
      if(keys[data].delete === 1){
        checked.push(keys[data].menu_id+'_delete')
      }

      if(keys[data].approve === 1){
        checked.push(keys[data].menu_id+'_approve')
      }
    }

    await this.setState({
      pageList: pages,
      rightList: rights,
      roleRights: keys,
      checked: checked
    })
  }

  async handleSubmit (e) {
    let { api_url, config, id, checked} = this.state

    e.preventDefault();

    var boxChecked = checked
    var menu = ""
    var arr = []
    var pages = []

    //modify array structure for easier backend process
    for (let i = 0; i < boxChecked.length; i++) {
        menu = boxChecked[i].split('_')[0]
        
        if (pages.indexOf(menu) === -1) {
            pages.push(menu)
        }
    }  

    for (let i = 0; i < pages.length; i++) {
        var pointer = pages[i]
        var create = 0
        var read = 0
        var update = 0
        var del = 0
        var approve = 0
        arr[i] = []

        for (var j = 0; j < boxChecked.length; j++) {
            var left = boxChecked[j].split('_')[0].toString()
            var right = boxChecked[j].split('_')[1].toString()

            if (pointer === left) {
                
              if (right === 'create') {
                create = 1
              }

              if (right === 'read') {
                read = 1
              }
              
              if (right === 'update') {
                update = 1
              }
              
              if (right === 'delete') {
                del = 1
              }
              
              if (right === 'approve') {
                approve = 1
              }
            }
        }

        arr[i].push(id, pointer, create, read, update, del, approve)
        // arr[i]["group_id"] = id
        // arr[i]["menu_id"] = pointer
        // arr[i]["create"] = create
        // arr[i]["read"] = read
        // arr[i]["update"] = update
        // arr[i]["delete"] = del
        // arr[i]["approve"] = approve

    }

    let url = api_url+'/api/role/update_rights'
    let rightsPayload = {
      id, checked: arr
    }

    try {
      axios.put(url, rightsPayload, config)
      .then((response) => {
        if (response.data.ResponseCode === "500") {
          message.error(response.data.ResponseDesc.sqlMessage)
        } else {
          message.success(response.data.ResponseDesc)
          
          if (this.state.return === true) {
            this.props.history.push({
              pathname: '/role'
            })
          }
        }

        this.setState({ isLoading: false })
      }, (err) => {
        message.error(err.data.ResponseDesc)
        this.setState({ isLoading: false })
      })
    } catch (e) {
      message.error(e.data.ResponseDesc)
      this.setState({ isLoading: false })
    }    
  }

  onCheck(e) {
    if(e.target.checked === true){
      //on check, add the right to the state array
      var checked = e.target.name
      this.setState({
        checked: this.state.checked.concat(checked)
      })
    }
    else{
      //on uncheck,  remove the right from state array
      var arr = [...this.state.checked]
      var index = arr.indexOf(e.target.name)
      arr.splice(index,1)
      this.setState({
        checked: arr
      })
    }
  }
  
  render() {
    
    // const formItemLayout = {
    //   labelCol: {
    //     xs: { span: 24 },
    //     sm: { span: 10 },
    //   },
    //   wrapperCol: {
    //     xs: { span: 24 },
    //     sm: { span: 12 },
    //   },
    // }

    var pages = this.state.pageList
    var roles = this.state.roleRights

    if(this.state.isAuthorized){
      return (
        <form className="form_view" onSubmit={this.handleSubmit}>
          <table className="table table-striped table-bordered centered">
            <thead>
              <tr>
                <td>Name</td>
                <td>Create</td>
                <td>View</td>
                <td>Update</td>
                <td>Delete</td>
                <td>Approve</td>
              </tr>
            </thead>
            <RenderRows pages={pages} roles={roles} changeMethod={this.onCheck} /> 
          </table>
                <div style={{ marginTop: '30px' }}>
                  <Button 
                    type="default" 
                    onClick={()=>this.props.history.push({
                      pathname: '/role'
                    })}
                  >
                    Back
                  </Button>
                  <Button 
                    type="default" 
                    htmlType="submit" 
                    style={{ marginLeft: '5px' }}
                  >
                    Save
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    style={{ marginLeft: '5px' }}
                    onClick={()=>this.setState({ return: true })}
                  >
                    Save & Back
                  </Button>
                </div>
          </form>
      )
    } else {
      return ('You are not authorized to access this page')
    }
    
  }
}

function mapStateToProps(state) {
    const { user, mode } = state;
    return {
        user,
        mode
    }
}

export default withRouter(connect(mapStateToProps, { LogUser, FormMode })(RoleRights));
