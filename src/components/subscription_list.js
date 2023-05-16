import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Button, Icon, message, Tooltip, Spin, Row, Col } from 'antd'
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table'
import { config } from '../config'
import axios from 'axios'
import { readFilterData } from '../middleware/read_filter'
import { SetTableStates } from '../actions'

class SubscriptionList extends Component {
    constructor(props) {
        super(props)

        this.state = {
            user_rights : (this.props.user.user_rights) ? (this.props.user.rights) : (''),
            isAuthorized : true,
            create : true,
            read : true,
            update : true,
            delete : false,
            data : [],
            totalDataSize : 0,
            size : 5,
            page : 1,
            columnFilter : false,
            filterObj : {},
            sortName : undefined,
            sortOrder : undefined,
            isLoading : false,
            selectedRow : {},
            config : { headers: { 'token' : localStorage.getItem('token')} },
            api_url : config().api_url,
            pagepath : this.props.location.pathname
        }

        this.fetchData = this.fetchData.bind(this)
        this.handleCreate = this.handleCreate.bind(this)
        this.handleEditRow = this.handleEditRow.bind(this)
        this.handleDeleteRow = this.handleDeleteRow.bind(this)
    }

    componentWillMount() {
        const rights = this.props.user.rights
        const page_url = this.props.location.pathname
        const table_states = this.props.table_states
        let page, size, sortName, sortOrder, filterObj = null

        // receive table_states if previous page is still in the same page circle
        if (table_states.pagepath === page_url) {
            page = table_states.page
            size = table_states.size
            sortName = table_states.sortName
            sortOrder = table_states.sortOrder
            filterObj = table_states.filterObj
        } else {
            // reset table_states in store to default value
            this.props.SetTableStates({})
        }

        for (let item in rights) {
            if (rights[item].page_url === page_url) {
                if (rights[item].read === 1 || rights[item].create === 1 || rights[item].update === 1 ) {
                    this.setState({
                        isAuthorized : true,
                        read : true,
                        create : (rights[item].create) ? (true) : (false),
                        update : (rights[item].update) ? (true) : (false),
                        // delete feature currently disabled until bussiness process after delete subscription models clear
                        // delete : (rights[item].delete) ? (true) : (false)
                        page : (page) ? (page) : (this.state.page),
                        size : (size) ? (size) : (this.state.size),
                        sortName : (sortName) ? (sortName) : (this.state.sortName),
                        sortOrder : (sortOrder) ? (sortOrder) : (this.state.sortOrder),
                        filterObj : (filterObj) ? (filterObj) : (this.state.filterObj)
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

    fetchData(page = this.state.page, size = this.state.size, sortName = this.state.sortName, sortOrder = this.state.sortOrder, filterObj = this.state.filterObj) {
        this.setState({ isLoading : true, data : [] })
        
        const { api_url, config } = this.state
        let url = api_url + '/api/subscription/?page=' + page + '&size=' + size

        if (sortName) {
            url += `&orderName=${ sortName }`

            if (sortOrder) {
                url += `&orderBy=${ sortOrder }`
            } else {
                url += `&orderBy=ASC`
            }
        } else {
            url += `&orderName=name&orderBy=ASC`
        }

        if (filterObj && filterObj !== {}) {
            let filterUrl = readFilterData(filterObj)
            url += filterUrl
        }

        console.log(url)

        axios.get(url, config)
        .then((response) => {
            console.log('Subscriptions Response', response)
            
            if (response.data.ResponseCode === '200') {
                this.setState({
                    isLoading : false,
                    data : response.data.ResponseData,
                    totalDataSize : response.data.ResponseTotalData
                })
            } else {
                if (response.data.status === '401') {
                    this.setState({
                        data : [],
                        isLoading : false,
                        isAuthorized : false
                    }, () => {
                        message.error('Login Authentication Expired. Please Login Again!')
                    })
                } else {
                    this.setState({
                        data : [],
                        isLoading : false,
                    }, () => {
                        let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : ""
                        message.error(msg)
                    })
                }
            }
        })
        .catch((err) => {
            console.log(err)
        })
    }

    dispatchTableStates() {
        const { page, size, sortName, sortOrder, filterObj, pagepath } = this.state
        const table_states = { page, size, sortName, sortOrder, filterObj, pagepath }
        
        this.props.SetTableStates(table_states)
    }

    assignFilter() {
        const { filterObj } = this.state

        if (Object.keys(filterObj).length > 0) {

            if (filterObj.name) {
                this.refs.nameCol.applyFilter(filterObj.name.value)
            }

            if (filterObj.periode) {
                this.refs.periodeCol.applyFilter(filterObj.periode.value)
            }
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

    handleSizePerPageChange(sizePerPage) {
        this.setState({
            page : 1,
            size : sizePerPage
        }, () => {
            this.fetchData()
        })
    }

    handleSortChange(sortName, sortOrder) {
        this.setState({ 
            page : 1,
            sortName, 
            sortOrder 
        }, () => {
            this.dispatchTableStates()
            this.fetchData()
        })
    }

    handleFilterChange(filterObj) {
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

    buttonFormatter(cell, row) {
        const { isLoading, update } = this.state

        let readIcon = <a onClick={ () => this.handleViewRow(row) }><Tooltip title="View Subscription's Detail"><Icon type='search' /></Tooltip></a>
        let updateIcon = (update) ? (<a onClick={ () => this.handleEditRow(row) } style={{ marginLeft : '20px' }}><Tooltip title="Edit Subscription"><Icon type='edit' /></Tooltip></a>) : ('')

        let button_group = (isLoading) ? (<Spin />) : (<div> { readIcon } { updateIcon } </div>)

        return ( <div> { button_group } </div> )
    }

    handleSelect(row) {
        this.setState({ selectedRow : (row) ? (row) : {} })
    }

    handleCreate() {
        this.props.history.push({
            pathname : '/subscription/new'
        })
    }

    handleViewRow(row) {
        this.props.history.push({
            pathname : `/subscription/view/${ row.id }`
        })
    }

    handleEditRow(row) {
        this.props.history.push({
            pathname : `/subscription/edit/${ row.id}`
        })
    }

    handleDeleteRow() {
        const { api_url, config, selectedRow } = this.state
        let url = api_url + '/api/subscription/?id=' + selectedRow.id
        let remove = window.confirm(`Do you want to subscription model name ${ selectedRow.name } ?`)

        console.log(url)

        if (remove) {
            axios.delete(url, config)
            .then((response) => {
                if (response.data.ResponseCode === '200') {
                    message.success(response.data.ResponseDesc)
                } else {
                    if (response.data.status === '401') {
                        this.setState({
                            data : [],
                            isAuthorized : false
                        }, () => {
                            message.error('Login Authentication Expired. Please Login Again!')
                        })
                    } else {
                        let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : ""
                        message.error(msg)
                    }
                }
            })
            .catch((error) => {
                console.log(error)
            })
        }
    }

    render() {
        const { isAuthorized } = this.state
        const selectRow = {
             mode : 'radio',
             onSelect : this.handleSelect.bind(this),
             clickToSelect : true,
             hideSelectColumn : (this.state.delete) ? (false) : (true)
        }

        if (isAuthorized) {
            return (
                <React.Fragment>
                    <Row type='flex' justify='end' style={{ marginBottom : '30px' }}>
                        <Col>
                            {
                                (this.state.create) ? (
                                    <Button className='base_button primary' onClick={ () => this.handleCreate() }>
                                        Create
                                    </Button>
                                ) : ('')
                            }
                            {
                                (this.state.delete) ? (
                                    <Button className='base_button primary' onClick={ () => this.handleDeleteRow() } disabled={ (this.state.selectedRow.id) ? (false) : (true) }>
                                        Delete
                                    </Button>
                                ) : ('')
                            }
                        </Col>
                    </Row>

                    <BootstrapTable
                        data = { this.state.data }
                        striped = { true }
                        hover = { true }
                        remote = { true }
                        fetchInfo = { { dataTotalSize : this.state.totalDataSize } }
                        condensed
                        pagination
                        selectRow = { selectRow }
                        options = { { 
                            sizePerPageList: [
                                { text : '5', value : 5 },
                                { text : '10', value : 10},
                                { text : '15', value : 15 } ],
                                sizePerPage : this.state.size,
                                onSizePerPageList : this.handleSizePerPageChange.bind(this),
                                onPageChange : this.onPageChange.bind(this),
                                page : this.state.page,
                                noDataText : (this.state.isLoading) ? (<Spin />) : ('No Data Found'),
                                sortName : this.state.sortName,
                                sortOrder : this.state.sortOrder,
                                onSortChange : this.handleSortChange.bind(this),
                                onFilterChange : this.handleFilterChange.bind(this)
                            }}
                            >
                        <TableHeaderColumn dataField='id' isKey={ true } hidden={ true }>ID</TableHeaderColumn>
                        <TableHeaderColumn ref='nameCol' dataField='name' dataAlign='center' width='200px' dataSort={true} filter={ { type : 'TextFilter', placeholder : 'Type value ..' } }>Name</TableHeaderColumn>
                        <TableHeaderColumn ref='periodeCol' dataField='periode' dataAlign='center' width='150px' dataSort={true} filter={ { type : 'TextFilter', placeholder : 'Type value ..' } }>Period</TableHeaderColumn>
                        <TableHeaderColumn dataField='price' dataAlign='center' width='100px' dataSort={true} >Price</TableHeaderColumn>
                        <TableHeaderColumn dataField='button' dataAlign='center' dataFormat={ this.buttonFormatter.bind(this) } width='100px'>Actions</TableHeaderColumn>
                    </BootstrapTable>
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

export default withRouter(connect(mapStateToProps, { SetTableStates })(SubscriptionList))