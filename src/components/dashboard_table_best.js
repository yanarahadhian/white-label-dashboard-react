import React, { Component } from 'react'
import { Row, Col, Table } from 'antd'

class DashboardTableBest extends Component {
    constructor(props) {
        super(props)


        this.state = {
            columnsTrendingTable : [{
                    title: 'PRODUCT',
                    dataIndex: 'product',
                    align: 'center'
                }, {
                    title: '# OF TRANSACTIONS',
                    dataIndex: 'quantity',
                    align: 'center'
                }, {
                    title: 'TOTAL AMOUNT (Rp)',
                    dataIndex: 'amount',
                    align: 'center'
                }],
            dataTrendingTable : [{
                    key: '1',
                    product: 'Telkomsel 5',
                    quantity: '20',
                    amount: '140.000',
                }, {
                    key: '2',
                    product: 'Telkomsel 10',
                    quantity: '20',
                    amount: '240.000',
                }, {
                    key: '3',
                    product: 'XL 5',
                    quantity: '18',
                    amount: '140.000',
                }, {
                    key: '4',
                    product: 'XL 10',
                    quantity: '17',
                    amount: '240.000',
                }, {
                    key: '5',
                    product: 'INDOSAT 5',
                    quantity: '18',
                    amount: '140.000',
                }, {
                    key: '6',
                    product: 'INDOSAT 10',
                    quantity: '22',
                    amount: '140.000',
                }, {
                    key: '7',
                    product: 'PLN 20',
                    quantity: '30',
                    amount: '140.000',
                }, {
                    key: '8',
                    product: 'PLN 50',
                    quantity: '37',
                    amount: '140.000',
                }, {
                    key: '9',
                    product: 'ZAKAT',
                    quantity: '40',
                    amount: '140.000',
                }, {
                    key: '10',
                    product: 'PDAM',
                    quantity: '30',
                    amount: '140.000',
                }],
            columnsTopTable : [{
                    title : 'NAME',
                    dataIndex : 'name',
                    align : 'center'
                }, {
                    title : 'USER',
                    dataIndex : 'user',
                    align : 'center'
                }],
            dataTopTable : [{
                    key : '1',
                    name : 'AGUS',
                    user : 'LOPER'
                }, {
                    key : '2',
                    name : 'ANDRI',
                    user : 'AGENT'
                }, {
                    key : '3',
                    name : 'GUSMAN',
                    user : 'AGENT'
                }, {
                    key : '4',
                    name : 'INDRI',
                    user : 'AGENT'
                }, {
                    key : '5',
                    name : 'JUNDET',
                    user : 'LOPER'
                }, {
                    key : '6',
                    name : 'ANGGA',
                    user : 'AGENT'
                }, {
                    key : '7',
                    name : 'MAMET',
                    user : 'AGENT'
                }, {
                    key : '8',
                    name : 'LINA',
                    user : 'AGENT'
                }, {
                    key : '9',
                    name : 'JUNA',
                    user : 'LOPER'
                }, {
                    key : '10',
                    name : 'BUDI',
                    user : 'LOPER'
                }]
        }
    }

    render() {
        let { columnsTrendingTable, columnsTopTable, dataTrendingTable, dataTopTable } = this.state

        return (
            <React.Fragment>
                <Row type="flex" justify="space-between">
                    <Col className="container-best-product bg-white" span={ 15 }>
                        <Row>
                            <Col>
                                <p className="container-title center">TOP 10 TRENDING PRODUCTS</p>
                            </Col>
                            <Col>
                                <Table columns={ columnsTrendingTable } dataSource={ dataTrendingTable } size="small" pagination={ false } />
                            </Col>
                        </Row>
                    </Col>
                    <Col className="container-best-product bg-white" span={ 8 }>
                        <Row>
                            <Col>
                                <p className="container-title center">TOP 10 PERFORMERS TODAY</p>
                            </Col>
                            <Col>
                                <Table columns={ columnsTopTable } dataSource={ dataTopTable } size="small" pagination={ false } />
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </React.Fragment>
        )
    }
}

export default DashboardTableBest