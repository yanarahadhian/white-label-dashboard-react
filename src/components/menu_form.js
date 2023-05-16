import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Button, Input, Form, Row, Col, Select, message } from 'antd'
import axios from 'axios'
import { config } from '../config'
const FormItem = Form.Item
const Option = Select.Option

class MenuForm extends Component {
    constructor(props) {
        super(props)

        this.state = {
            isAuthorized : true,
            menu_id : '',
            menu_name : '',
            page_id : '',
            page_name : '',
            page_order : '',
            page_url : '',
            class_icon : '',
            hide : 0,
            menuList : [],
            api_url : config().api_url,
            config : { headers : { token : localStorage.getItem('token') } },
            viewMode : (this.props.location.pathname.includes('view')) ? (true) : (false),
            addMode : (this.props.location.pathname.includes('new') ? (true) : (false)),
            updateMode : (this.props.location.pathname.includes('edit') ? (true) : (false))
        }
    }

    componentWillMount() {
        const { viewMode, addMode, updateMode } = this.state
        const rights = this.props.user.rights
        const pathname = this.props.location.pathname
        const page_url = pathname.slice(0, pathname.indexOf('/', 1))
        let authorize = false

        for (let item in rights) {
            if (rights[item].page_url === page_url) {
                if (viewMode && rights[item].read === 1) {
                    authorize = true
                } else if (addMode && rights[item].create) {
                    authorize = true
                } else if (updateMode && rights[item].update) {
                    authorize = true
                }
                console.log('authorize : ', authorize)
                this.setState({ isAuthorized : authorize })
            }
        }
    }

    componentDidMount() {
        const { isAuthorized } = this.state
        const page_id = this.props.match.params.page_id

        if (isAuthorized) {
            if (page_id) {
                this.fetchPageDetails(page_id)
            }

            this.fetchMenus()
        }
    }

    fetchPageDetails(page_id) {
        const { api_url, config } = this.state

        let url = api_url + '/api/menu/page_list?page_id=' + page_id

        axios.get(url, config)
        .then((response) => {
            console.log('Page Details : ', response.data)

            if (response.data.ResponseCode === '200') {
                this.setState({
                    menu_id : (response.data.ResponseData[0].menu_id).toString(),
                    menu_name : response.data.ResponseData[0].menu_name,
                    page_id : response.data.ResponseData[0].page_id,
                    page_name : response.data.ResponseData[0].page_name,
                    page_order : response.data.ResponseData[0].page_order,
                    page_url : response.data.ResponseData[0].page_url,
                    class_icon : response.data.ResponseData[0].class_icon,
                    hide : response.data.ResponseData[0].hide
                })
            }
        })
        .catch((err) => {
            console.log(err)
        })
    }

    fetchMenus() {
        const { api_url, config } = this.state

        let url = api_url + '/api/menu?page=all&orderName=menu_id'

        axios.get(url, config)
        .then((response) => {
            if (response.data.ResponseCode === '200') {
                this.setState({
                    menuList : response.data.ResponseData
                })
            }
        })
        .catch((err) => {
            console.log(err)
        })
    }

    handleSubmit(e) {
        e.preventDefault()

        const { api_url, config, addMode, menu_id, page_id, page_name, page_order, page_url, class_icon, hide } = this.state

        let data = { 
            page_id : (addMode) ? (undefined) : (page_id), page_name, menu_id, page_order, page_url, class_icon, hide }

        let axiosConfig = {
            method : (addMode) ? ('POST') : ('PUT'),
            url : api_url + '/api/menu/page',
            data : data,
            headers : config.headers
        }

        axios(axiosConfig)
        .then((response) => {
            console.log(response.data)

            if (response.data.ResponseCode === '200') {
                message.success(response.data.ResponseDesc)

                this.props.history.push({ pathname : '/menu' })
            } else {
                if (response.data.status === '401') {
                    // if login auth exipre show auth expiration message
                    this.setState({ isAuthorized : false }, () => {
                        message.error('Login Authentication Expired. Please Login Again!')
                        this.props.signOutUser()
                    })
                } else {
                    let messageError = (response.data.ResponseDesc.sqlMessage) ? (response.data.ResponseDesc.sqlMessage) : (response.data.ResponseDesc[0].message) ? (response.data.ResponseDesc[0].message) : (response.data.ResponseDesc)

                    message.error(messageError)
                }
            }
        })
        .catch((err) => {
            console.log(err)
        })
    }
    
    render() { 
        const { isAuthorized, menuList, viewMode } = this.state

        const formItemLayout = {
            labelCol: {
                xs: { span: 24 },
                sm: { span: 10 }
            },
            wrapperCol: {
                xs: { span: 24 },
                sm: { span: 14 }
            }
        }

        if (isAuthorized) {
            return (
                <React.Fragment>
                    <Form className='form_view' onSubmit={ this.handleSubmit.bind(this) }>
                        <Row type='flex' justify='end' style={{ marginBottom : '45px' }}>
                            <Col>
                                <Button
                                    className='base_button primary'
                                    type='primary'
                                    onClick={ () => {
                                        this.props.history.push({ pathname : '/menu' })
                                    } }
                                >
                                    Back
                                </Button>
                            </Col>

                            {
                                (viewMode) ? ('') : (
                                    <Col>
                                        <Button
                                            className='base_button primary'
                                            type='primary'
                                            htmlType='submit'
                                        >
                                            Save & Back
                                        </Button>
                                    </Col>
                                )
                            }
                        </Row>

                        <Row gutter={ 12 }>
                            <Col span={ 8 } style={{ padding : '0 0 0 6px' }}>
                                <FormItem {...formItemLayout} label='Page Name' required>
                                    <Input
                                        placeholder='Type page name ..'
                                        value={ this.state.page_name }
                                        onChange={ (e) => this.setState({ page_name : e.target.value }) }
                                        disabled={ viewMode }
                                    />
                                </FormItem>
                                
                                <FormItem {...formItemLayout} label='Page URL' required>
                                    <Input
                                        placeholder='Type page url name ..'
                                        value={ this.state.page_url }
                                        onChange={ (e) => this.setState({ page_url : e.target.value }) }
                                        disabled={ viewMode }
                                    />
                                </FormItem>
                                
                                <FormItem {...formItemLayout} label='Menu Parent' required>
                                    <Select
                                        showSearch
                                        optionFilterProp='children'
                                        filterOption={ (input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0 }
                                        placeholder='Select parent menu ..'
                                        value={ this.state.menu_id }
                                        defaultValue={ this.state.menu_id }
                                        onChange={ (e) => { this.setState({ menu_id : e }) } }
                                        disabled={ viewMode }
                                    >
                                    {
                                        Object.keys(menuList).map((item) => {
                                            return (
                                                <Option 
                                                    key={ menuList[item].menu_id }
                                                    disabled={ (menuList[item].menu_id === 1) ? (true) : (false) }
                                                >
                                                    { menuList[item].display_name }
                                                </Option>
                                            )
                                        })
                                    }
                                    </Select>
                                </FormItem>

                                <FormItem {...formItemLayout} label='Page Order' required>
                                    <Input
                                        placeholder='Type page order number ..'
                                        value={ this.state.page_order }
                                        onChange={ (e) => this.setState({ page_order : e.target.value }) }
                                        disabled={ viewMode }
                                    />
                                </FormItem>

                                <FormItem {...formItemLayout} label='Icon' required>
                                    <Input
                                        placeholder='Type page class icon ..'
                                        value={ this.state.class_icon }
                                        onChange={ (e) => this.setState({ class_icon : e.target.value }) }
                                        disabled={ viewMode }
                                    />
                                </FormItem>

                                <FormItem {...formItemLayout} label='Hide' required>
                                    <Select
                                        showSearch
                                        optionFilterProp='children'
                                        filterOption={ (input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0 }
                                        placeholder='Select hide ..'
                                        value={ this.state.hide }
                                        defaultValue={ this.state.hide }
                                        onChange={ (e) => { this.setState({ hide : e }) } }
                                        disabled={ viewMode }
                                    >
                                                <Option key='1' value={ 0 } >False</Option>
                                                <Option key='2' value={ 1 } >True</Option>
                                    </Select>
                                </FormItem>
                            </Col>
                        </Row>
                    </Form>
                </React.Fragment>
            )
        } else {
            return ('You are not authorized to access this page')
        }
    }
}

function mapStateToProps(state) {
    const { user } = state

    return { user }
}

export default withRouter(connect(mapStateToProps, null)(MenuForm))