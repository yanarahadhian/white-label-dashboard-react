import React, { Component } from 'react'
import { Row, Col } from 'antd'
import '../templates/dashboard.css'

class DashboardStatistic extends Component {
    constructor(props) {
        super(props)

        this.state = {
            time : 30,
            minutes : '00',
            hours : '00',
            days : '00'
        }

        // eslint-disable-next-line
        this.secondsRemaining
        // eslint-disable-next-line
        this.intervalHandle
        this.startCountDown = this.startCountDown.bind(this)
        this.tick = this.tick.bind(this)
    }

    tick() {
        // this.secondsRemaining--
        this.setState({
            minutes : this.secondsRemaining
        })
    }

    startCountDown() {
        this.intervalHandle = setInterval(this.tick, 1000)

        let time = this.state.time

        this.secondsRemaining = time
    }

    componentDidMount() {
        // this.startCountDown()
    }

    render () {
        return (
            <React.Fragment>
                <Row className="container-statistic" type="flex" justify="space-between" align="middle">
                    <Col className="col-deposit" span={ 8 }> 
                        <Row className="statistic-text-title" type="flex" justify="center" align="middle">
                            <p className="m-0">Saldo Deposit</p>
                        </Row>
                        <Row className="statistic-text-content" type="flex" justify="center" align="middle">
                            <p className="m-0">Rp 1.600.256</p>
                        </Row>
                    </Col> 
                    <Col className="col-burn-rate" span={ 8 }> 
                        <Row className="statistic-text-title" type="flex" justify="center" align="middle">
                            <p className="m-0">Burn Rate/ Minute</p>
                        </Row>
                        <Row className="statistic-text-content" type="flex" justify="center" align="middle">
                            <p className="m-0">Rp 15.625</p>
                        </Row>
                    </Col> 
                    <Col className="col-estimate-time" span={ 8 }> 
                        <Row className="statistic-text-title" type="flex" justify="center" align="middle">
                            <p className="m-0">Estimate Run Out</p>
                        </Row>
                        <Row className="statistic-text-content" type="flex" justify="center" align="middle">
                            <p className="m-0">31 Days 17 Hours { this.state.minutes } Minutes</p>
                        </Row>
                        <Row type="flex" justify="end" align="middle">
                            <Col span={ 14 }>
                                <p className="center">* based on 5 past burn rate</p>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </React.Fragment>
        )
    }
}

export default DashboardStatistic