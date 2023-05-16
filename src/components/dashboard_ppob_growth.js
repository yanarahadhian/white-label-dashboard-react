import React, { Component } from 'react'
import { Row, Col, Checkbox } from 'antd'
import { LineChart, CartesianGrid, YAxis, Tooltip, Legend, Line } from 'recharts'

class DashboardPPOB extends Component {
    constructor(props) {
        super(props)

        this.state = {
            productTypes : [ { label :  'PLN-PREPAID', value : 'pln-prepaid'}, { label :  'PLN-POSTPAID', value : 'pln-postpaid'},{ label :  'PULSA', value : 'pulsa'}, { label :  'PAKET DATA', value : 'paket-data'}, { label :  'PDAM', value : 'pdam'}, { label :  'Telkom', value : 'telkom'}, { label :  'Infaq', value : 'infaq'}, { label :  'Zakat', value : 'zakat'} ],
            ppobData : [
                {name: 'Day 1', pulsa: 4000, zakat: 3000, infaq: 2000},
                {name: 'Day 2', pulsa: 3000, zakat: 1000, infaq: 3400},
                {name: 'Day 3', pulsa: 2000, zakat: 4600, infaq: 4300},
                {name: 'Day 4', pulsa: 2780, zakat: 3300, infaq: 1200},
                {name: 'Day 5', pulsa: 1890, zakat: 2300, infaq: 6500},
                {name: 'Day 6', pulsa: 2390, zakat: 4500, infaq: 4300},
                {name: 'Day 7', pulsa: 3490, zakat: 6700, infaq: 2000}
          ]
        }
    }

    render() {
        let { productTypes, ppobData } = this.state
        let CheckboxGroup = Checkbox.Group

        return (
            <React.Fragment>
                <Row type="flex" justify="center">
                    <Col className="container-ppob bg-white" span={ 24 }>
                        <p className="container-title center"> PPOB GROWTH </p>

                        <Row type="flex" justify="center">
                            <Col>
                                <LineChart width={1000} height={195} data={ ppobData }>
                                    <CartesianGrid vertical={ false } strokeDasharray="3 3" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="pulsa" stroke="#8884d8" />
                                    <Line type="monotone" dataKey="zakat" stroke="#82ca9d" />
                                </LineChart>
                            </Col>
                        </Row>

                        <Row className="container-checkbox" type="flex" justify="center">
                            <Col>   <CheckboxGroup options={ productTypes } />  </Col>
                        </Row>
                    </Col>
                </Row>
            </React.Fragment>
        )
    }
}

export default DashboardPPOB