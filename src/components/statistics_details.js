import React, { Component } from 'react';
import { Row, Col, Select, DatePicker } from 'antd';
import moment from 'moment';
import axios from 'axios';
import { config } from "../config";

const { Option } = Select;
const { RangePicker } = DatePicker;

const base_api_url = config().api_url;
const fetchNetworkURL = base_api_url + '/api/network/?page=all&size=0';
const fetchStatisticsURL = base_api_url + '/api/user_statistics';
const fetchActiveUsersURL = base_api_url + '/api/user_statistics/active_users';
const dateFormatDisplay = 'MM-DD-YYYY';
const defaultDateFrom = '01-01-2000';
const defaultDateUntil = moment().format(dateFormatDisplay);

class StatisticsDetails extends Component {
    constructor(props) {
        super(props);

        this.state = {
            networks: [],
            network: "0",
            registeredAgent: 0,
            registeredLoper: 0,
            totalAgentLoper: 0,
            activeAgent: 0,
            activeLoper: 0,
            totalActiveAgentLoper: 0,
            dateFrom: defaultDateFrom,
            dateUntil: defaultDateUntil,
            fetchConfig: { headers: {'token': localStorage.getItem('token')}}
        };

        this.onNetworkChange = this.onNetworkChange.bind(this);
        this.onDateChange = this.onDateChange.bind(this);
        this.fetchNetworks = this.fetchNetworks.bind(this);
    }

    componentDidMount() {
        this.fetchNetworks();
        this.fetchStatistics();
    }

    async fetchNetworks() {
        const { fetchConfig } = this.state;
        const { data : { ResponseData : networks = [] } } = await axios.get(fetchNetworkURL, fetchConfig);
        this.setState({ networks });
    }

    async fetchStatisticsByRole(fetchUrl, network, role, dateFrom, dateUntil) {
        const { fetchConfig } = this.state;
        const apiDateFormat = (date) => moment(date).format('YYYY-MM-DD HH:mm:ss');
        let fetchStatisticsRoleURL = fetchUrl;

        if (network) {
            fetchStatisticsRoleURL += `?network=${ network }`;
        }

        if (!network) {
            fetchStatisticsRoleURL += `?role=${ role }`;
        } else {
            fetchStatisticsRoleURL += `&role=${ role }`;
        }

        fetchStatisticsRoleURL += `&date_from=${apiDateFormat(dateFrom)}&date_to=${apiDateFormat(dateUntil)}`;

        const fetchResponse = await axios.get(fetchStatisticsRoleURL, fetchConfig);

        if (fetchResponse && fetchResponse.data && fetchResponse.data.ResponseData && fetchResponse.data.ResponseData[0]) {
            return fetchResponse.data.ResponseData[0].total_users;
        } else {
            return 0;
        }
    }

    async fetchStatistics() {
        const { network, dateFrom, dateUntil } = this.state;
        const selectedNetwork = (network === "0") ? (null) : (network);
        const roleAgent = 3;
        const roleLoper = 4;

        const registeredAgent = await this.fetchStatisticsByRole(fetchStatisticsURL, selectedNetwork, roleAgent, dateFrom, dateUntil);
        const registeredLoper = await this.fetchStatisticsByRole(fetchStatisticsURL, selectedNetwork, roleLoper, dateFrom, dateUntil);
        const activeAgent = await this.fetchStatisticsByRole(fetchActiveUsersURL, selectedNetwork, roleAgent, dateFrom, dateUntil);
        const activeLoper = await this.fetchStatisticsByRole(fetchActiveUsersURL, selectedNetwork, roleLoper, dateFrom, dateUntil);

        this.setState({ 
            registeredAgent,
            registeredLoper,
            totalAgentLoper: registeredAgent + registeredLoper,
            activeAgent,
            activeLoper,
            totalActiveAgentLoper: activeAgent + activeLoper
        });
    }

    onNetworkChange(network) {
        this.setState({ network: network }, () => {
            this.fetchStatistics();
        })
    }

    onDateChange(dates) {
        const dateFrom = moment(dates[0]).format(dateFormatDisplay);
        const dateUntil = moment(dates[1]).format(dateFormatDisplay);

        this.setState({ dateFrom, dateUntil }, () => {
            this.fetchStatistics();
        })
    }

    render() {
        const rangesTemplates = { 
            Today: [moment(defaultDateFrom, dateFormatDisplay), moment()],
            'This Month': [moment().startOf('month'), moment()] };

        const rangeDefaultValue = [moment(defaultDateFrom, dateFormatDisplay), moment(defaultDateUntil, dateFormatDisplay)];

        return (
            <React.Fragment>
                 <h3>Users Statistics</h3>
                <Row className='statistics-filter-row' justify='center'>
                    <Col offset={1} xs={24} sm={4} className='grid-flex-left'>
                        <p>Apply Filter : </p>
                    </Col>
                    <Col xs={24} sm={8} className='grid-flex-left'>
                        <Row>
                            <Col xs={24} sm={10}>
                                <p>Network</p>
                            </Col>
                            <Col xs={24} sm={14}>
                                <Select
                                    showSearch
                                    style={{ width: 200 }}
                                    placeholder="Pilih Network"
                                    optionFilterProp="children"
                                    onChange={ this.onNetworkChange }
                                    value={ this.state.network }
                                    defaultValue={ this.state.network }
                                    filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0 }
                                >
                                    <Option key="0">All Networks</Option>
                                {
                                    (this.state.networks && this.state.networks.length) && (this.state.networks.map(({ id, network }) => 
                                        <Option key={ id } value={ id }>{ network }</Option>
                                    ))
                                }
                                </Select>
                            </Col>
                        </Row>
                    </Col>
                    <Col xs={24} sm={10} className='grid-flex-left'>
                        <Row>
                            <Col xs={24} sm={8}>
                                <p>Tanggal</p>
                            </Col>
                            <Col xs={24} sm={16}>
                                <RangePicker 
                                    ranges={rangesTemplates}
                                    defaultValue={rangeDefaultValue}
                                    format={dateFormatDisplay}
                                    onChange={ this.onDateChange }
                                />
                            </Col>
                        </Row>
                    </Col>
                </Row>

                <Row className='statistics-box-row' type='flex' justify='space-around'>
                    <Col xs={24} sm={8} className='grid-flex-center'>
                        <Row className='paper orange'>
                            <Col xs={24}>
                                <p className='num-stat'>{ this.state.totalActiveAgentLoper }</p>
                            </Col>
                            <Col xs={24}>
                                <p>Total Users<br /></p><p className='category-user '>Active</p>
                            </Col>
                        </Row>
                        <Row className='paper blue'>
                            <Col xs={24}>
                                <p className='num-stat'>{ this.state.totalAgentLoper }</p>
                            </Col>
                            <Col xs={24}>
                                <p>Total Users<br /></p><p className='category-user '>Registered</p>
                            </Col>
                        </Row>
                    </Col>
                    <Col xs={24} sm={8} className='grid-flex-center'>
                        <Row className='paper orange'>
                            <Col xs={24}>
                                <p className='num-stat'>{ this.state.activeAgent }</p>
                            </Col>
                            <Col xs={24}>
                                <p>Agent<br /></p><p className='category-user '>Active</p>
                            </Col>
                        </Row>
                        <Row className='paper blue'>
                            <Col xs={24}>
                                <p className='num-stat'>{ this.state.registeredAgent }</p>
                            </Col>
                            <Col xs={24}>
                                <p>Agent<br /></p><p className='category-user '>Registered</p>
                            </Col>
                        </Row>
                    </Col>                    
                    <Col xs={24} sm={8} className='grid-flex-center'>
                        <Row className='paper orange'>
                            <Col xs={24}>
                                <p className='num-stat'>{ this.state.activeLoper }</p>
                            </Col>
                            <Col xs={24}>
                                <p>Lopers<br /></p><p className='category-user '>Active</p>
                            </Col>
                        </Row>
                        <Row className='paper blue'>
                            <Col xs={24}>
                                <p className='num-stat'>{ this.state.registeredLoper }</p>
                            </Col>
                            <Col xs={24}>
                                <p>Lopers<br /></p><p className='category-user '>Registered</p>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </React.Fragment>
        )
    }
}

export default StatisticsDetails;