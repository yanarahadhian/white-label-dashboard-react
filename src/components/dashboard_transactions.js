import React, { Component } from 'react'
import { Row, Col, Radio, Checkbox } from 'antd'
import { BarChart, Bar, Cell, CartesianGrid, YAxis, PieChart, Pie } from 'recharts'

class DashboardTransactions extends Component {
    constructor(props) {
        super(props)

        this.state = {
            product : [
                { name : 'PLN Prepaid' ,product : 'pln-prepaid', amount : 9 },
                { name : 'PLN Postpaid' ,product : 'pln-postpaid', amount : 7 },
                { name : 'Pulsa' ,product : 'pulsa', amount : 10 },
                { name : 'Paket Data' ,product : 'paket-data', amount : 11 },
                { name : 'PDAM' ,product : 'pdam', amount : 5 },
                { name : 'Telkom' ,product : 'telkom', amount : 7 },
                { name : 'Infaq' ,product : 'infaq', amount : 1 },
                { name : 'Zakat' ,product : 'zakat', amount : 3 }
            ],
            productTypes : [ { label :  'PLN Prepaid', value : 'pln-prepaid'}, { label :  'PLN Postpaid', value : 'pln-postpaid'},{ label :  'Pulsa', value : 'pulsa'}, { label :  'Paket Data', value : 'paket-data'}, { label :  'PDAM', value : 'pdam'}, { label :  'Telkom', value : 'telkom'}, { label :  'Infaq', value : 'infaq'}, { label :  'Zakat', value : 'zakat'} ],
            userTypes : [ { label : 'Agent', value : 'agent' }, { label : 'Loper', value : 'loper' } ],
            userData : [{ name: 'Agent', value: 35}, {name: 'Loper', value: 40 }],
            barColors : ["#2196f3", "#1565c0", "#ffc107", "#ff8f00", "#00bcd4", "#f06292", "#13796f", "#4db6ac"],
            pieColors : ["#d6e08b", "#9eb6e9"]
        }
    }

    render() {
        let { product, barColors, pieColors, userData, productTypes, userTypes } = this.state
        let CheckboxGroup = Checkbox.Group
        let RadioGroup = Radio.Group

        // const RADIAN = Math.PI / 180;                    
        // const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
        //     const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        //     const x  = cx + radius * Math.cos(-midAngle * RADIAN);
        //     const y = cy  + radius * Math.sin(-midAngle * RADIAN);
            
        //     return (
        //         <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} 	dominantBaseline="central">
        //             {`${(percent * 100).toFixed(0)}%`}
        //         </text>
        //     );
        // };

        return (
            <React.Fragment>
                <Row>
                    <Col>   <p className="transaction-title">Transactions</p>   </Col>
                </Row>

                <Row style={{ marginBottom: '15px' }} type="flex" gutter={ 8 }>
                    <Col>   <p>Transactions |</p>   </Col>
                    <Col>
                        <RadioGroup>
                            <Radio value={1}> Today </Radio>
                            <Radio value={2}> Last 7 Days</Radio>
                            <Radio value={3}> This Month </Radio>
                        </RadioGroup>
                    </Col>
                </Row>

                <Row type="flex" justify="space-between">
                    <Col className="container-transaction bg-white" span={ 17 } >
                        <p className="container-title center">Transaction by Product</p>
                        
                        <Row className="transaction-chart" type="flex" justify="center" algin="middle">
                            <Col>
                                <BarChart
                                    width={ 750 }
                                    height={ 190 }
                                    data={ product }
                                    dataKey={ 'amount' } >

                                    <CartesianGrid vertical={ false } strokeDasharray="3 0" />
                                    <YAxis />

                                    <Bar dataKey="amount" fill="#8884d8">
                                    {
                                        product.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={ barColors[index % 20] }/>
                                        ))
                                    }
                                    </Bar>
                                </BarChart>
                            </Col>
                        </Row>

                        <Row className="mt-20" type="flex" justify="center">
                            <Col>   <CheckboxGroup options={ productTypes } />  </Col>
                        </Row>
                    </Col>

                    <Col className="container-transaction bg-white" span={ 6 }>
                        <Row>   <p className="container-title center"> USERS </p>    </Row>

                        <Row className="transaction-chart" type="flex" justify="center" align="middle">
                                <PieChart width={185} height={200}>
                                    <Pie
                                        data={ userData }  
                                        dataKey={ 'value' } 
                                        labelLine={false} 
                                        label 
                                        // label={ CustomizedLabel }
                                        > 
                                        {
                                            userData.map((entry, index) => <Cell key={ index } fill={ pieColors[index % 20] }/>)
                                        }
                                    </Pie>
                                </PieChart>
                        </Row>

                        <Row className="mt-20" type="flex" justify="center">
                            <Col>   <CheckboxGroup options={ userTypes } />     </Col>
                        </Row>
                    </Col>
                </Row>
            </React.Fragment>
        )
    }
}

export default DashboardTransactions