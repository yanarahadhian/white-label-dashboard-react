import React, { Component } from 'react'
import { Row, Col, Checkbox } from 'antd'
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Cell } from 'recharts'

class DashboardBB extends Component {
    constructor(props) {
        super(props)

        this.state = {
            bbData : [
                { name : '12 Nov 2018', type : 'in', amount : 45 },
                { name : '12 Nov 2018', type : 'out', amount : 55 },
                // { name : '12 Nov 2018', type : 'in', amount : 37.5 },
                // { name : '12 Nov 2018', type : 'in', amount : 32.5 },
                // { name : 'Date 3', type : 'in', amount : 40 },
                // { name : 'Date 3', type : 'out', amount : 31 },
                // { name : 'Date 3', type : 'in', amount : 29 },
                // { name : 'Date 3', type : 'in', amount : 17 },
                // { name : 'Date 4', type : 'in', amount : 34 },
                // { name : 'Date 4', type : 'out', amount : 39 },
                // { name : 'Date 5', type : 'in', amount : 46 },
                // { name : 'Date 5', type : 'in', amount : 30 },
                // { name : 'Date 6', type : 'in', amount : 25 },
                // { name : 'Date 6', type : 'out', amount : 41 },
                // { name : 'Date 7', type : 'in', amount : 37 },
                // { name : 'Date 7', type : 'in', amount : 28 },
            ],
            optionType : [ { label :  'Cash In', value : 'in'}, { label :  'Cash Out', value : 'out'}],
            color : [ '#f9e78a', '#de84ce' ]
        }
    }

    render() {
        let { bbData, optionType, color } = this.state
        let CheckboxGroup = Checkbox.Group
        let containerClass, chartWidth, chartHeight

        if (bbData.length < 3) {
            containerClass = 'container-bb bb-adjust bg-white'
            chartWidth = 1000
            chartHeight = 215
        } else {
            containerClass = 'container-bb bg-white'
            chartWidth = 1000
            chartHeight = 350
        }
        return (
            <React.Fragment>
                <Row type="flex" justify="center">
                    <Col className={ containerClass } span={ 24 }>
                        <p className="container-title center">BRANCHLESS BANKING</p>
                        
                        <Row  type="flex" justify="center">
                            <Col>
                                <BarChart
                                    width={ chartWidth }
                                    height={ chartHeight }
                                    data={ bbData }
                                    dataKey={ 'amount' }
                                    layout="vertical"
                                    >

                                    <CartesianGrid horizontal={ false } strokeDasharray="3 3" />
                                    <XAxis type="number"/>
                                    <YAxis dataKey="name" type="category"/>

                                    <Bar dataKey='amount' fill="#8884d8">
                                    {
                                        bbData.map((entry, index) => (
                                            <Cell cursor='pointer' key={ `cell-${ index }` } fill={ color[index % 2] } />
                                        ))
                                    }
                                    </Bar>

                                    
                                </BarChart>
                            </Col>
                        </Row>

                        <Row type="flex" justify="center">
                            <Col>   <CheckboxGroup options={ optionType } />    </Col>
                        </Row>

                    </Col>
                </Row>
            </React.Fragment>
        )
    }
}

export default DashboardBB