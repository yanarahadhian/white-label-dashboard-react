import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Button, Input, Form, Row, Col } from 'antd'
import { config } from '../config'
import axios from 'axios'
import moment from 'moment'
const FormItem = Form.Item

class SubscriptionLogsForm extends Component {
    constructor(props) {
        super(props)

        this.state = {
            user_rights : (this.props.user.user_rights) ? (this.props.user.rights) : (''),
            id : (this.props.match.params.id) ? (this.props.match.params.id) : (null),
            agent_fee : '',
            created_at : '',
            invoice : '',
            jpx_fee : '',
            network : '',
            network_fee : '',
            notes : '',
            periode : '',
            price : '',
            role : '',
            subscription_name : '',
            trans_status : '',
            upline_fee : '',
            user_balance_before : '',
            user_balance_after : '',
            user_name : '',
            isAuthorized : false,
            api_url : config().api_url,
            config : { headers : { 'token' : localStorage.getItem('token')} }
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
        const { isAuthorized, api_url, config } = this.state
        const subscriptionLogId = this.props.match.params.id
        const url = api_url + '/api/subscription/logs/?id=' + subscriptionLogId

        console.log(url)

        if (isAuthorized) {
            if (subscriptionLogId) {
                axios.get(url, config)
                .then((response) => {
                    console.log(response.data)

                    if (response.data.ResponseCode === '200') {
                        this.setState({
                            agent_fee : response.data.ResponseData[0].agent_fee,
                            created_at : response.data.ResponseData[0].created_at,
                            invoice : response.data.ResponseData[0].invoice,
                            jpx_fee : response.data.ResponseData[0].jpx_fee,
                            network : response.data.ResponseData[0].network,
                            network_fee : response.data.ResponseData[0].network_fee,
                            notes : response.data.ResponseData[0].notes,
                            periode : response.data.ResponseData[0].periode,
                            price : response.data.ResponseData[0].price,
                            role : response.data.ResponseData[0].role,
                            subscription_name : response.data.ResponseData[0].subscription_name,
                            trans_status : response.data.ResponseData[0].trans_status,
                            upline_fee : response.data.ResponseData[0].upline_fee,
                            user_balance_before : response.data.ResponseData[0].user_balance_before,
                            user_balance_after : response.data.ResponseData[0].user_balance_after,
                            user_name : response.data.ResponseData[0].user_name,
                        })
                    }
                })
                .catch((err) => {
                    console.log(err)
                })
            }
        }
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
                    <Row type='flex' justify='end' style={{ marginBottom: '45px' }}>
                        <Col>
                            <Button
                                className='base_button primary'
                                type='primary'
                                htmlType='submit'
                                onClick={ () => this.props.history.push({ pathname : '/subscription_logs' })}
                            >
                                Back
                            </Button>
                        </Col>
                    </Row>

                    <Row>
                        <Col span={ 16 } style={{ padding : '0 0 0 6px' }}>
                            <FormItem { ...formItemLayout } label='Network' >
                                <Input value={ this.state.network } disabled />
                            </FormItem>
                            <FormItem { ...formItemLayout } label='Invoice ID' >
                                <Input value={ this.state.invoice } disabled />
                            </FormItem>
                            <FormItem { ...formItemLayout } label='Subscription' >
                                <Input value={ this.state.subscription_name } disabled />
                            </FormItem>
                            <FormItem { ...formItemLayout } label='User' >
                                <Input value={ this.state.user_name } disabled />
                            </FormItem>
                            <FormItem { ...formItemLayout } label='Transaction Date' >
                                <Input value={ (this.state.created_at) ? (moment(this.state.created_at, "YYYY-MM-DD HH:mm:ss").format("LLLL")) : ('') } disabled />
                            </FormItem>
                            <FormItem { ...formItemLayout } label='Frequent' >
                                <Input value={ this.state.periode } disabled />
                            </FormItem>
                            <FormItem { ...formItemLayout } label='Role' >
                                <Input value={ this.state.role } disabled />
                            </FormItem>
                            <FormItem { ...formItemLayout } label='Transaction Status' >
                                <Input value={ (this.state.trans_status === 1) ? ('Success') : ('Failed') } disabled />
                            </FormItem>
                            <FormItem { ...formItemLayout } label='Amount' >
                                <Input value={ this.state.price } disabled />
                            </FormItem>
                            <FormItem { ...formItemLayout } label='User Balance Before' >
                                <Input value={ this.state.user_balance_before } disabled />
                            </FormItem>
                            <FormItem { ...formItemLayout } label='User Balance After' >
                                <Input value={ this.state.user_balance_after } disabled />
                            </FormItem>

                        </Col>
                    </Row>

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

export default withRouter(connect(mapStateToProps, null)(SubscriptionLogsForm))