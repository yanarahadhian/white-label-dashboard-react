import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Button, Input, Form, Row, Col, message } from 'antd'
import axios from 'axios'
import { config } from '../config'
import moment from 'moment'
const FormItem = Form.Item
const { TextArea } = Input

class BillerHostForm extends Component {
    constructor(props) {
        super(props)
        
        this.state = {
            billerHostId : undefined,
            account_id : '',
            name : '',
            topup_code : '',
            host_name : '',
            host_ip : '',
            description : '',
            created_at : '',
            updated_at : '',
            deleted_at : '',
            isAuthorized : false,
            api_url : config().api_url,
            returnPage : false,
            config : { headers : { 'token' : localStorage.getItem('token') } },
            viewMode : (this.props.location.pathname.includes('view')) ? (true) : (false),
            addMode : (this.props.location.pathname.includes('new') ? (true) : (false))
        }

        this.fetchData = this.fetchData.bind(this)
    }

    componentWillMount() {
        const rights = this.props.user.rights
        const pathname = this.props.location.pathname
        const page_url = pathname.slice(0, pathname.indexOf('/', 1))

        let authorize = false
        let viewMode = false
        let addMode = false
        let billerHostId = this.props.match.params.biller_host_id

        for (let item in rights) {
            if (rights[item].page_url === page_url) {
                const isModeAdd = pathname.includes('/new')
                const isModeView = pathname.includes('/view')
                const isModeEdit = pathname.includes('/edit')

                if (isModeAdd && rights[item].create === 1) {
                    authorize = true
                    addMode = true
                } else if (isModeView && rights[item].read === 1) {
                    authorize = true
                    viewMode = true
                } else if (isModeEdit && rights[item].update === 1) {
                    authorize = true
                }

                this.setState({
                    billerHostId : billerHostId,
                    isAuthorized : authorize, 
                    viewMode : viewMode,
                    addMode : addMode
                })
            }
        }
    }

    componentDidMount() {
        const { isAuthorized, addMode } = this.state

        if (isAuthorized && !addMode) {
            this.fetchData()
        }
    }

    fetchData(billerHostId = this.state.billerHostId) {
        const { api_url, config } = this.state

        if (billerHostId) {
            let url = api_url + '/api/biller/?id=' + billerHostId

            axios.get(url, config)
            .then((response) => {
                console.log(response.data)

                if (response.data.ResponseCode === '200') {
                    this.setState({
                        account_id : response.data.ResponseData[0].account_id,
                        name : response.data.ResponseData[0].name,
                        topup_code : response.data.ResponseData[0].topup_code,
                        host_name : response.data.ResponseData[0].host_name,
                        host_ip : response.data.ResponseData[0].host_ip,
                        description : response.data.ResponseData[0].description,
                        created_at : response.data.ResponseData[0].created_at,
                        updated_at : response.data.ResponseData[0].updated_at,
                        deleted_at : response.data.ResponseData[0].deleted_at
                    })
                }
            })
            .catch((err) => {
                console.log(err)
            })
        }
    }

    validateForm() {
        const { account_id, name, host_name, host_ip } = this.state

         if ( account_id && name && host_name && host_ip) {
             return true
         } else {
             return false
         }
    }

    handleSubmit(e) {
        e.preventDefault()

        const { api_url, config, billerHostId, account_id, name, topup_code, host_ip, host_name, description, addMode, returnPage } = this.state

        let data = {
            id : billerHostId,
            account_id, name,
            topup_code, description,
            host_ip, host_name
        }

        let axiosConfig = {
            method : (addMode) ? ('POST') : ('PUT'),
            url : api_url + '/api/biller',
            data : data,
            headers : config.headers
        }

        console.log({data, axiosConfig})

        try {
            axios(axiosConfig)
            .then((response) => {
                console.log(response.data)

                if (response.data.ResponseCode === '200') {
                    message.success(response.data.ResponseDesc)

                    if (returnPage) {
                        this.props.history.push({ pathname : '/biller_host' })
                    }
                } else {
                    if (response.data.status === '401') {
                        this.setState({
                            isAuthorized : false,
                        }, () => {
                            message.error('Login Authentication Expired. Please Login Again!')
                        })
                    } else {
                        let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : ""
                        message.error(msg)
                    }
                }
            })
            .catch((err) => {
                console.log(err)
            })

        } catch (e) {
            console.log(e)
        }
    }

    onBack() {
        this.props.history.push({ 
            pathname : '/biller_host'
        })
    }

    render() {
        const { isAuthorized } = this.state

        const formItemLayout = {
            labelCol : {
                xs : { span : 24 },
                sm : { span : 6 }
            },
            wrapperCol : {
                xs : { span : 24 },
                sm : { span : 12 }
            }
        }
        
        if (isAuthorized) {
            return (
                <React.Fragment>
                    <Form className='form_view' onSubmit={ this.handleSubmit.bind(this) } >
                        <Row type='flex' justify='end' style={{ marginBottom : '30px' }} >
                            <Col>
                                {
                                    (this.state.viewMode) ? (
                                        <Button
                                            className='base_button primary'
                                            onClick={
                                                () => this.props.history.push({ pathname : '/biller_host' })
                                            }
                                        >
                                            Back
                                        </Button>
                                    ) : (
                                        <React.Fragment>
                                            <Button
                                                className='base_button primary'
                                                onClick={
                                                    () => this.onBack()
                                                }
                                                >
                                                Back
                                            </Button>

                                            <Button
                                                className={ (this.validateForm()) ? ('base_button primary') : ('button_disabled') }
                                                htmlType='submit'
                                                onClick={ () => this.onBack() }
                                                disabled={ !this.validateForm() }
                                                >
                                                Save & Back
                                            </Button>

                                            <Button
                                                className={ (this.validateForm()) ? ('base_button primary') : ('button_disabled') }
                                                htmlType='submit'
                                                disabled={ !this.validateForm() }
                                                >
                                                Save
                                            </Button>
                                        </React.Fragment>
                                    )
                                }
                            </Col>
                        </Row>

                        <Row>
                            <Col span={ 16 } style={{ padding : '0 0 0 6px' }}>
                                <FormItem {...formItemLayout} label='Account ID' required>
                                    <Input value={ this.state.account_id } onChange={ (e) => this.setState({ account_id : e.target.value }) } placeholder='Type Account ID ...' disabled={ (this.state.viewMode || !this.state.addMode) ? (true) : (false) } />
                                </FormItem>
                                
                                <FormItem {...formItemLayout} label='Biller Name' required>
                                    <Input value={ this.state.name } onChange={ (e) => this.setState({ name : e.target.value }) } placeholder='Type Biller Name ...' disabled={ (this.state.viewMode) } />
                                </FormItem>
                                
                                <FormItem {...formItemLayout} label='Host Name' required>
                                    <Input value={ this.state.host_name } onChange={ (e) => this.setState({ host_name : e.target.value }) } placeholder='Type Host Name ...' disabled={ (this.state.viewMode) } />
                                </FormItem>
                                
                                <FormItem {...formItemLayout} label='Host IP' required>
                                    <Input value={ this.state.host_ip } onChange={ (e) => this.setState({ host_ip : e.target.value }) } placeholder='Type Host IP Address ...' disabled={ (this.state.viewMode) } />
                                </FormItem>

                                <FormItem {...formItemLayout} label='Topup Code' >
                                    <Input value={ this.state.topup_code } onChange={ (e) => this.setState({ topup_code : e.target.value }) } placeholder='Type Topup Code ...' disabled={ (this.state.viewMode) } />
                                </FormItem>

                                <FormItem {...formItemLayout} label='Description' style={{ margin : '5px 0 10px 0' }}>
                                    <TextArea rows={ 4 } value={ this.state.description } onChange={ (e) => this.setState({ description : e.target.value }) } placeholder='Type Description ...' disabled={ (this.state.viewMode) } />
                                </FormItem>
                                
                                {
                                    (!this.state.addMode) ? (
                                        <React.Fragment>
                                            <FormItem {...formItemLayout} label='Date Created'>
                                                <Input value={ (this.state.created_at) ? (moment(this.state.created_at, "YYYY-MM-DD HH:mm:ss").format("LLLL")) : ('') } disabled />
                                            </FormItem>
                                            
                                            <FormItem {...formItemLayout} label='Date Updated'>
                                                <Input value={ (this.state.updated_at) ? (moment(this.state.updated_at, "YYYY-MM-DD HH:mm:ss").format("LLLL")) : ('') } disabled />
                                            </FormItem>
                                        </React.Fragment>
                                    ) : ('')
                                }

                                
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

export default withRouter(connect(mapStateToProps, null)(BillerHostForm))