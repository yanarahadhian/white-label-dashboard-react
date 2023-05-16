import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Button, Row, Col, message, Icon } from 'antd'
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table'
import axios from 'axios'
import { config } from '../config'
import { readFilterData } from '../middleware/read_filter'
import { downloadCSV } from '../middleware/export'
import { SetTableStates } from '../actions'

class BillerHostList extends Component {
    constructor(props) {
        super(props)

        this.state = {
            user_rights : (this.props.user.rights) ? (this.props.user.rights) : (''),
            isAuthorized : false,
            create : false,
            read : false,
            update : false,
            delete : false,
            data : [],
            totalDataSize : 0,
            api_url : config().api_url,
            size : 5,
            page : 1,
            columnFilter : false,
            filterObj : {},
            sortName : undefined,
            sortOrder : undefined,
            isLoading : false,
            selectedRow : [],
            config : { headers : { 'token' : localStorage.getItem('token') } },
            pagepath : this.props.location.pathname
        }
    }

    componentWillMount() {
        // User Right Validation
        const rights = this.state.user_rights
        const page_url = this.props.location.pathname
        const table_states = this.props.table_states
        let page, size, sortName, sortOrder, filterObj = null
        
        // receive table_state if previous page is still in the same page circle
        if (table_states.pagepath === page_url) {
            page = table_states.page
            size = table_states.size
            sortName = table_states.sortName
            sortOrder = table_states.sortOrder
            filterObj = table_states.filterObj
        } else {
            // reset table_state in store to default value
            this.props.SetTableStates({})
        }

        for (let item in rights) {
            if (rights[item].page_url === page_url) {
                if (rights[item].read === 1) {
                    this.setState({
                        isAuthorized : true,
                        read : true,
                        create : (rights[item].create === 1) ? (true) : (false),
                        delete : (rights[item].delete === 1) ? (true) : (false),
                        update : (rights[item].update === 1) ? (true) : (false),
                        page : (page) ? (page) : (this.state.page),
                        size : (size) ? (size) : (this.state.size),
                        sortName : (sortName) ? (sortName) : (this.state.sortName),
                        sortOrder : (sortOrder) ? (sortOrder) : (this.state.sortOrder),
                        filterObj : (filterObj) ? (filterObj) : (this.state.filterObj),
                    }, async () => {
                        if (Object.keys(table_states).length > 0) {
                            await this.assignFilter()
                            await this.fetchData(page, size, sortName, sortOrder, filterObj)
                        } else {
                            this.fetchData()
                        }
                    })
                }
            }
        }
    }

    // Applying default parameters to simplify function call to is's default
    fetchData(page = this.state.page, size = this.state.size, sortName = this.state.sortName, sortOrder = this.state.sortOrder, filterObj = this.state.filterObj) {
        this.setState({ isLoading : true })

        const { api_url, config } = this.state
        let url = api_url + '/api/biller/?page=' + page + '&size=' + size

        // Sort management
        if (sortName) {
            url += `&orderName=${ sortName }`

            if (sortOrder) {
                url += `&orderBy=${ sortOrder }`
            } else {
                url += `&orderBy=ASC`
            }
        } else {
            url += `&orderName=id&orderBy=ASC`
        }

        // Filter Management
		if (filterObj && filterObj !== {}) {
            let filterUrl = readFilterData(filterObj)
            url += filterUrl
        }
        
        console.log(url)

        axios.get(url, config)
        .then((response) => {
            console.log(response.data)

            if (response.data.ResponseCode === '200') {
                this.setState({
                    data : response.data.ResponseData,
                    totalDataSize : response.data.ResponseTotalResult,
                    isLoading : false
                })
            } else {
                if (response.data.status === '401') {
                    this.setState({
                        isAuthorized : false,
                        data : []
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
    }

    assignFilter() {
        const { filterObj } = this.state

        if (Object.keys(filterObj).length > 0) {

            if (filterObj.account_id) {
                this.refs.accountIdCol.applyFilter(filterObj.account_id.value)
            }

            if (filterObj.name) {
                this.refs.nameCol.applyFilter(filterObj.name.value)
            }

            if (filterObj.host_name) {
                this.refs.hostNameCol.applyFilter(filterObj.host_name.value)
            }

            if (filterObj.host_ip) {
                this.refs.hostIpCol.applyFilter(filterObj.host_ip.value)
            }
        }
    }

    dispatchTableStates() {
        const { page, size, sortName, sortOrder, filterObj, pagepath } = this.state
        const returnValue = { page, size, sortName, sortOrder, filterObj, pagepath }

        this.props.SetTableStates(returnValue)
    }

    exportData() {
        const { api_url, config, sortName, columnFilter, sortOrder, filterObj } = this.state
        let url = api_url + '/api/biller/?page=all'
        let exportData = false

        // Sort management
        if (sortName) {
            url += `&orderName=${ sortName }`

            if (sortOrder) {
                url += `&orderBy=${ sortOrder }`
            } else {
                url += `&orderBy=ASC`
            }
        } else {
            url += `&orderName=id&orderBy=ASC`
        }

        if (columnFilter && filterObj !== undefined && filterObj !== {}) {
            // Filter Management
            let filterUrl = readFilterData(filterObj)
            url += filterUrl

            exportData = true
        } else {
            exportData = window.confirm("Do you really want to export all data ?")
        }

        if (exportData) {
            console.log(url)

            axios.get(url, config)
            .then((response) => {
                if (response.data.ResponseCode === '200') {
                    downloadCSV(response.data.ResponseData, 'biller-host')
                } else {
                    if (response.data.status === '401') {
                        this.setState({
                            isAuthorized : false,
                            data : []
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
                console.error(err)
            })
        }
    }

    addRow() {
        this.dispatchTableStates()
        this.props.history.push({
            pathname : '/biller_host/new'
        })
    }

    viewRow(row) {
        this.dispatchTableStates()
        this.props.history.push({
            pathname : `/biller_host/view/${ row.id }`
        })
    }

    editRow(row) {
        this.dispatchTableStates()
        this.props.history.push({
            pathname : `/biller_host/edit/${ row.id }`
        })
    }

    deleteRows() {
        const { api_url, config, selectedRow } = this.state
        const remove = window.confirm("Do you want to delete this data ?");

        if (remove) {
            if (selectedRow.length > 0) {
                let url = api_url + '/api/biller/bulkDelete'
                
                axios.post(url, { biller_hosts : selectedRow }, config)
                .then((response) => {
                    console.log(response.data)
                    
                    if (response.data.ResponseCode === '200') {
                        message.success(response.data.ResponseDesc)
                        this.fetchData()
                    } else {
                        if (response.data.status === '401') {
                            this.setState({
                                isAuthorized : false
                            })
                        } else {
                            let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : "Delete Biller Hosts Failed"
                            message.error(msg)
                        }
                    }
                })
                .catch((err) => {
                    console.log(err)
                })
            } else {
                message.warning('You have to select one value at minimum to perform Delete')
            }
        }
    }

    onRowSelect(row, isSelected) {
        const { selectedRow } = this.state

        if (isSelected) {
            selectedRow.push(row)
        } else {
            let param = selectedRow

            for (let i = 0; i < param.length; i++) {
                if (row.id === param[i].id) {
                    let index = param.indexOf(param[i])
                    param.splice(index, 1)
                }
            }
        }
    }

    onSelectAll(isSelected, rows) {
        const { selectedRow } = this.state
        let param = selectedRow

        if (isSelected) {
            for (let i = 0; i < rows.length; i++) {
                param.push(rows[i])
            }
        } else {
            this.setState({
                selectedRow : []
            })
        }
    }

    onPageChange(page, sizePerPage) {
        this.setState({
            page : page,
            size : sizePerPage
        }, () => {
            this.dispatchTableStates()
            this.fetchData()
        })
    }

    onSortChange(sortName, sortOrder) {
        this.setState({
            page : 1,
            sortName,
            sortOrder
        }, () => {
            this.dispatchTableStates()
            this.fetchData()
        })
    }

    onFilterChange(filterObj) {
        // if filterObj on onFilterChange() compared to filterObj on table_states returns true, set page on state to 1 and the current state on vice versa
        // differentiate conditions when component first loaded with table_state on redux, with onFilterChange after component rendered
        const table_states = this.props.table_states
        const isFilterTableStatesActive = table_states.filterObj && table_states.filterObj.constructor === Object && Object.keys(table_states.filterObj).length > 0
        const isFilterTableStatesChanged = table_states.filterObj === filterObj

        const isFilterActive = filterObj.constructor === Object && Object.keys(filterObj).length > 0

        this.setState({
            page : (isFilterTableStatesActive) ? (isFilterTableStatesChanged === true) ? (1) : (this.state.page) : (1),
            columnFilter : (isFilterActive) ? (true) : (false),
            filterObj : (isFilterActive) ? (filterObj) : ({})
        }, () => {
            this.dispatchTableStates()
            this.fetchData()
        })
    }

    onSizePerPageChange(sizePerPage) {
        this.setState({
            page : 1,
            size : sizePerPage
        }, () => {
            this.fetchData()
        })
    }

    buttonFormatter(cell, row) {
        const { update } = this.state

        const edit = (update) ? (<a onClick={ () => this.editRow(row) }><Icon type='edit' /></a>) : ('')
        const view = <a onClick={ () => this.viewRow(row) } style={{ marginLeft : '10px' }}><Icon type='search' /></a>

        return ( <div> {edit} {view} </div> )
    }

    render() {
        const { isAuthorized, data, totalDataSize, page, size, sortName, sortOrder, create } = this.state

        const selectRow = {
            mode: 'checkbox',
            columnWidth : '50px',
            clickToSelect: true,
            onSelect: this.onRowSelect.bind(this),
            onSelectAll: this.onSelectAll.bind(this)
        }

        if (isAuthorized) {
            return (
                <React.Fragment>
                    <Row type='flex' justify='end' style={{ marginBottom : '30px' }}>
                        <Col>
                            <Button className='base_button primary' type='primary' onClick={ this.exportData.bind(this) }>
                                Export CSV
                            </Button>

                            {
                                (create) ? (
                                    <Button 
                                        className='base_button primary' 
                                        type='primary'
                                        onClick={ () => this.addRow() }
                                    >
                                        Add Biller
                                    </Button>
                                ) : ('')
                            }

                            {
                                (this.state.delete) ? (
                                    <Button
                                        className='base_button delete'
                                        type='primary'
                                        onClick={ () => this.deleteRows() }
                                    >
                                        Delete
                                    </Button>
                                ) : ('')
                            }
                        </Col>
                    </Row>

                    <Row>
                        <Col>
                            <BootstrapTable
                                data={ data }
                                striped
                                hover
                                remote
                                condensed
                                pagination
                                selectRow={ selectRow }
                                fetchInfo={{ dataTotalSize : totalDataSize }}
                                options={{
                                    sizePerPageList : [ 
                                        { text : '5', value : 5 },
                                        { text : '10', value : 10 },
                                        { text : '15', value : 15 } ],
                                    sizePerPage : size,
                                    page : page,
                                    sortName : sortName,
                                    sortOrder : sortOrder,
                                    onPageChange : this.onPageChange.bind(this),
                                    onSortChange : this.onSortChange.bind(this),
                                    onFilterChange : this.onFilterChange.bind(this),
                                    onSizePerPageList : this.onSizePerPageChange.bind(this)
                                }}
                            >
                                <TableHeaderColumn dataField='id' isKey={ true } hidden={ true } >ID</TableHeaderColumn>
                                <TableHeaderColumn ref='accountIdCol' dataField='account_id' width='100px' dataAlign='center' dataSort={ true } filter={{ type : 'TextFilter', placeholder : 'Type a value' }} >Account ID</TableHeaderColumn>
                                <TableHeaderColumn ref='nameCol' dataField='name' width='150px' dataAlign='center' filter={{ type : 'TextFilter', placeholder : 'Type a value' }}>Biller Name</TableHeaderColumn>
                                <TableHeaderColumn ref='hostNameCol' dataField='host_name' width='150px' dataAlign='center' filter={{ type : 'TextFilter', placeholder : 'Type a value' }}>Host Name</TableHeaderColumn>
                                <TableHeaderColumn ref='hostIpCol' dataField='host_ip' width='150px' dataAlign='center' filter={{ type : 'TextFilter', placeholder : 'Type a value' }}>Host IP</TableHeaderColumn>
                                <TableHeaderColumn dataField='buttons' width='75px' dataAlign='center' dataFormat={ this.buttonFormatter.bind(this) } >Actions</TableHeaderColumn>
                            </BootstrapTable>
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
    const { user, table_states } = state

    return { user, table_states }
}

export default withRouter(connect(mapStateToProps, { SetTableStates })(BillerHostList))