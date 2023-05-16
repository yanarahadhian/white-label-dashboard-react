import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { config } from '../config'
import { Button, Input, Select, Form, Divider, Row, Col, message } from 'antd'
import NumberFormat from 'react-number-format';
import axios from 'axios'
const FormItem = Form.Item
const { TextArea } = Input
const { Option } = Select

class SubscriptionForm extends Component {
    constructor(props) {
        super(props)

        this.state = {
            id : (this.props.match.params.id) ? (this.props.match.params.id) : (null),
            name : '',
            description : '',
            status : 1,
            price : 0,
            periode : '',
            role : '',
            jpx_fee : 0,
            network_fee : 0,
            agent_fee : 0,
            upline_fee : 0,
            isAuthorized : true,
            viewMode : (this.props.location.pathname.includes("view")) ? true : false,
            createMode : (this.props.location.pathname.includes("new")) ? true : false,
            api_url : config().api_url,
            config : { headers : { 'token' : localStorage.getItem('token') } },
            buttonDisabled : false,
            buttonSaveClicked : false,
            returnPage : false
        }
    }

    componentWillMount() {
        const rights = this.props.user.rights
        const pathname = this.props.location.pathname
        const page_url = pathname.slice(0, pathname.indexOf('/', 1))

        for (let item in rights) {
            if (rights[item].page_url === page_url) {
                if (rights[item].read === 1) {
                    this.setState({ isAuthorized : true })
                }
            }
        }
    }

    componentDidMount() {
        const { isAuthorized, api_url, config, createMode } = this.state

        const subscriptionId = this.props.match.params.id
        let url = api_url + '/api/subscription/?id=' + subscriptionId

        if (isAuthorized) {
            if (!createMode && subscriptionId) {
                axios.get(url, config)
                .then((response) => {
                    if (response.data.ResponseCode === '200') {
                        this.setState({
                            name : response.data.ResponseData[0].name,
                            description : response.data.ResponseData[0].description,
                            status : response.data.ResponseData[0].status,
                            price : response.data.ResponseData[0].price,
                            periode : response.data.ResponseData[0].periode,
                            role : response.data.ResponseData[0].role,
                            jpx_fee : response.data.ResponseData[0].jpx_fee,
                            network_fee : response.data.ResponseData[0].network_fee,
                            agent_fee : response.data.ResponseData[0].agent_fee,
                            upline_fee : response.data.ResponseData[0].upline_fee
                        })
                    }
                })
                .catch((err) => {
                    console.log(err)
                })
            }
        }
    }

    handleAganFee(e) {
        console.log(e)

        const { network_fee, upline_fee, agent_fee } = this.state
        let jpx_fee = (e.floatValue) ? (e.floatValue) : (0)
        let price = jpx_fee + network_fee + upline_fee + agent_fee

        this.setState({
            jpx_fee, price
        })

        console.log('jpx_fee : ', formatNumber(jpx_fee))
    }

    handleNetworkFee(e) {
        const { jpx_fee, upline_fee, agent_fee } = this.state
        let network_fee = (e.floatValue) ? (e.floatValue) : (0)
        let price = jpx_fee + network_fee + upline_fee + agent_fee

        this.setState({
            network_fee, price
        })
    }

    handleUplineFee(e) {
        const { jpx_fee, network_fee, agent_fee } = this.state
        let upline_fee = (e.floatValue) ? (e.floatValue) : (0)
        let price = jpx_fee + network_fee + upline_fee + agent_fee

        this.setState({
            upline_fee, price
        })
    }

    handleAgentFee(e) {
        const { network_fee, upline_fee, jpx_fee } = this.state
        let agent_fee = (e.floatValue) ? (e.floatValue) : (0)
        let price = jpx_fee + network_fee + upline_fee + agent_fee

        this.setState({
            agent_fee, price
        })
    }

    validateForm() {
        const { name, status, periode, role } = this.state
        let validate = false

        if (name.length <= 0) {
            message.info('Field Name must not be empty')
        } else if (!status) {
            message.info('Field Status must be selected to one option')
        } else if (periode.length <= 0) {
            message.info('Field Deduction Period must be selected to one option')
        } else if (role.length <= 0) {
            message.info('Field Apply Role must be selected to one option')
        } else {
            validate = true
        }

        return validate
        // return this.state.name.length > 0 && this.state.status && this.state.periode.length > 0 && this.state.role.length > 0
    }

    async handleSubmit(e) {
        e.preventDefault()

        const { api_url, config, id, name, description, role, periode, status, price, jpx_fee, network_fee, agent_fee, upline_fee, returnPage } = this.state
        let validate = await this.validateForm()

        if (validate) {
            let payload = {
                id, name, description, status, role, periode,
                price, jpx_fee, network_fee, agent_fee, upline_fee
            }
    
            let axiosConfig = {
                url : api_url + '/api/subscription/?id=' + id,
                data : payload,
                headers : config.headers,
            }
    
            if (id) {
                axiosConfig.method = 'PUT'
            } else {
                axiosConfig.method = 'POST'
            }
            
            console.log('Request Submit : ', axiosConfig)
            
            try {
                axios(axiosConfig)
                .then((response) => {
                    console.log(response.data)
    
                    if (response.data.ResponseCode === '200') {
                        message.success(response.data.ResponseDesc)
    
                        if (returnPage) {
                            this.props.history.push('/subscription')
                        }
                    } else {
                        if (response.data.status === '401') {
                            this.setState({
                                isAuthorized : false
                            }, () => {
                                message.error('Login Authentication Expired. Please Login Again!')
                            })
                        } else {
                            let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : ""
                            message.error(msg)
    
                            // this.setState({ buttonDisabled : false })
                        }
                    }
                })
                .catch((err) => {
                    throw new Error(err)
                })
            } catch (e) {
                console.log(e)
            }
        }
    }

    render() {
        const { isAuthorized, viewMode, createMode } = this.state

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

        const NumberFormatStyle = {
            width: '100%',
            border: '1px solid #d9d9d9',
            lineHeight: '2',
            borderRadius: '4px',
            padding: '4px 11px'
          }

        if (isAuthorized) {

            return (
                <React.Fragment>
                    <Form onSubmit={ this.handleSubmit.bind(this) }>
                        <Row type='flex' justify='end' style={{ marginBottom: '45px' }}>
                            <Col>
                                <Button
                                    className='base_button primary'
                                    type='primary'
                                    htmlType='submit'
                                    onClick={ () => this.props.history.push({ pathname : '/subscription' })}
                                >
                                    Back
                                </Button>
                            </Col>

                            <Col>
                                { (viewMode) ? ('') : (
                                    <Button
                                        className='base_button primary'
                                        disabled={ (this.state.buttonSaveClicked) ? (true) : (false) }
                                        type='primary'
                                        htmlType='submit'
                                        onClick={ () => this.setState({ returnPage : true }) }
                                    >
                                        Save & Back
                                    </Button>
                                )}
                            </Col>

                            <Col>
                                { (createMode || viewMode) ? ('') : (
                                    <Button
                                        className='base_button primary'
                                        type='primary'
                                        htmlType='submit'
                                        style={{ marginLeft : '5px' }}
                                        onClick={ () => this.setState({ buttonSaveClicked : true }) }
                                    >
                                        Save
                                    </Button>
                                ) }
                            </Col>
                        </Row>

                        <Row>
                            <Col span={ 12 } style={{ padding : '0 0 0 6px' }}>
                                <FormItem { ...formItemLayout } label='Name' required>
                                    <Input placeholder='Type subscription model name .. ' value={ this.state.name }
                                        onChange={ e => this.setState({ name : e.target.value }) } disabled={ viewMode } >
                                    </Input>
                                </FormItem>

                                <FormItem { ...formItemLayout } label='Description'>
                                    <TextArea placeholder='Type description ..' value={ this.state.description }
                                        onChange={ e => this.setState({ description : e.target.value }) } disabled={ viewMode } >
                                    </TextArea>
                                </FormItem>

                                <FormItem { ...formItemLayout } label='Status' required>
                                    <Select showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                                        placeholder='Select status ..'
                                        value={ this.state.status }
                                        defaultValue={ this.state.status }
                                        onChange={ e => this.setState({ status : e }) }
                                        disabled={ viewMode }
                                    >
                                        <Option key='1' value={1}>Active</Option>
                                        <Option key='2' value={0}>Inactive</Option>
                                    </Select>
                                </FormItem>
                            </Col>
                        </Row>

                        <Divider />

                        <Row>
                            <Col span={ 8 } style={{ padding : '0 0 0 6px' }}>
                                <h4>Fee Model</h4>
                            </Col>
                        </Row>

                        <Row>
                            <Col span={ 12 } style={{ padding : '0 0 0 6px' }}>
                                <FormItem { ...formItemLayout } label='Deduction Period' required>
                                    <Select showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                                        placeholder='Select deduction period ..'
                                        value={ this.state.periode }
                                        defaultValue={ this.state.periode }
                                        onChange={ e => this.setState({ periode : e }) }
                                        disabled={ viewMode }
                                    >
                                        <Option key='1' value='Daily'>Daily</Option>
                                        <Option key='2' value='Weekly'>Weekly</Option>
                                        <Option key='3' value='Monthly'>Monthly</Option>
                                    </Select>
                                </FormItem>

                                <FormItem { ...formItemLayout } label='Apply Role' required>
                                    <Select showSearch optionFilterProp="children" filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                                        placeholder='Select role to apply ..'
                                        value={ this.state.role }
                                        defaultValue={ this.state.role }
                                        onChange={ e => this.setState({ role : e }) }
                                        disabled={ viewMode }
                                    >
                                        <Option key='1' value='Upline'>Upline</Option>
                                        <Option key='2' value='Agent'>Agent</Option>
                                        <Option key='3' value='Downline'>Downline</Option>
                                    </Select>
                                </FormItem>
                            </Col>
                        </Row>

                        <Row>
                            <Col span={ 12 } style={{ padding : '10px 0 0 6px' }}>
                                <FormItem { ...formItemLayout } label='AGAN Fee'>
                                    <NumberFormat thousandSeparator={ true } prefix={'Rp '} style={{ ...NumberFormatStyle }}
                                        value={ this.state.jpx_fee } onValueChange={ (e) => this.handleAganFee(e) }  disabled={ viewMode } />
                                </FormItem>
                                
                                <FormItem { ...formItemLayout } label='Network Fee'>
                                    <NumberFormat thousandSeparator={ true } prefix={'Rp '} style={{ ...NumberFormatStyle }}
                                        value={ this.state.network_fee } onValueChange={ (e) => this.handleNetworkFee(e) }  disabled={ viewMode } />
                                </FormItem>
                                
                                <FormItem { ...formItemLayout } label='Upline Fee'>
                                    <NumberFormat thousandSeparator={ true } prefix={'Rp '} style={{ ...NumberFormatStyle }}
                                        value={ this.state.upline_fee } onValueChange={ (e) => this.handleUplineFee(e) }  disabled={ viewMode } />
                                </FormItem>
                                
                                <FormItem { ...formItemLayout } label='Agent Fee'>
                                    <NumberFormat thousandSeparator={ true } prefix={'Rp '} style={{ ...NumberFormatStyle }}
                                        value={ this.state.agent_fee } onValueChange={ (e) => this.handleAgentFee(e) }  disabled={ viewMode } />
                                </FormItem>
                                
                                <FormItem { ...formItemLayout } label='Total Fee'>
                                    <NumberFormat thousandSeparator={ true } prefix={'Rp '} style={{ ...NumberFormatStyle }}
                                        value={ this.state.price } disabled />
                                </FormItem>
                            </Col>
                        </Row>
                    </Form>


                </React.Fragment>
            )
        } else {
            return 'You are not authorized to access this page'
        }
    }
}

function mapStateToProps(state) {
    const { user } = state

    return { user }
}

function formatNumber(value) {
    value += '';
    const list = value.split('.');
    const prefix = list[0].charAt(0) === '-' ? '-' : '';
    let num = prefix ? list[0].slice(1) : list[0];
    let result = '';
    while (num.length > 3) {
      result = `,${num.slice(-3)}${result}`;
      num = num.slice(0, num.length - 3);
    }
    if (num) {
      result = num + result;
    }
    return `${prefix}${result}${list[1] ? `.${list[1]}` : ''}`;
  }

export default withRouter(connect(mapStateToProps, null)(SubscriptionForm))