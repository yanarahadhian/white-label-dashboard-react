import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Icon, message, Tooltip, Spin } from 'antd'
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table'
import moment from 'moment'
import { config } from '../config'
import axios from 'axios'
import { readFilterData } from '../middleware/read_filter'
import { SetTableStates } from '../actions'

class SubscriptionLogsList extends Component {
    constructor(props) {
        super(props)

        this.state = {
            user_rights : (this.props.user.user_rights) ? (this.props.user.rights) : (''),
            isAuthorized : false,
            read : true,
            data : [],
            totalDataSize : 0,
            size : 10,
            page : 1,
            columnFilter : false,
            filterObj : {},
            sortName : undefined,
            sortOrder : undefined,
            isLoading : false,
            config : { headers : { 'token' : localStorage.getItem('token') } },
            api_url : config().api_url,
            pagepath : this.props.location.pathname
        }
        
        this.fetchData = this.fetchData.bind(this)
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
                if (rights[item].read === 1) {
                    this.setState({
                        isAuthorized : true,
                        read : true,
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
        let url = api_url + '/api/subscription/logs?page=' + page + '&size=' + size

        if (sortName) {
            url += `&orderName=${ sortName }`

            if (sortOrder) {
                url += `&orderBy=${ sortOrder }`
            } else {
                url += `&orderBy=ASC`
            }
        } else {
            url += `&orderName=id&orderBy=DESC`
        }

        if (filterObj && filterObj !== {}) {
            let filterUrl = readFilterData(filterObj)
            url += filterUrl
        }

        console.log(url)

        axios.get(url, config)
        .then((response) => {
            console.log('Subscription Logs Response', response)
            
            if (response.data.ResponseCode === '200') {
                this.setState({
                    isLoading : false,
                    data : response.data.ResponseData,
                    totalDataSize : response.data.ResponseTotalData
                })
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
                }

                this.setState({ isLoading : false, data : [], totalDataSize : 0 })
            }
        })
        .catch((err) => {
            this.setState({ isLoading : false })
            console.log(err)
        })
    }

	dispatchTableStates() {
        console.log('dispatch table states running ..')

		const { page, size, sortName, sortOrder, filterObj, pagepath } = this.state
		const table_states = { page, size, sortName, sortOrder, filterObj, pagepath }

		this.props.SetTableStates(table_states)
    }
    
    assignFilter() {
        const { filterObj } = this.state

        if (Object.keys(filterObj).length > 0) {

            if (filterObj.network) {
                this.refs.networkCol.applyFilter(filterObj.network.value)
            }
                
            if (filterObj.invoice) {
                this.refs.invoiceCol.applyFilter(filterObj.invoice.value)
            }
                
            if (filterObj.subscription_name) {
                this.refs.subscriptionNameCol.applyFilter(filterObj.subscription_name.value)
            }
                
            if (filterObj.created_at) {
                let newDate = new Date(filterObj.created_at.value.date)
				this.refs.transactionDateCol.applyFilter({ date : newDate, comparator : filterObj.created_at.value.comparator })		
            }
                
            if (filterObj.price) {
                this.refs.amountCol.applyFilter(filterObj.price.value)
            }
                
            if (filterObj.trans_status) {
                this.refs.statusCol.applyFilter(filterObj.trans_status.value)
            }
                
            if (filterObj.user_name) {
                this.refs.usernameCol.applyFilter(filterObj.user_name.value)
            }
                
        }
    }

    handleViewRow(row) {
        this.props.history.push({
            pathname : `/subscription_logs/view/${ row.id }`
        })
    }

    handlePageChange(page, sizePerPage) {
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
            sortName,
            sortOrder
        } , () => {
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
        const { isLoading } = this.state

        let readIcon = <a onClick={ () => this.handleViewRow(row) }><Tooltip title="View Detail"><Icon type='search' /></Tooltip></a>
        let button_group = (isLoading) ? (<Spin />) : (readIcon)

        return ( <div> { button_group } </div> )
    }

    render() {
        const { isAuthorized } = this.state
        
        const transactionStatus = {
            0 : 'Failed',
            1 : 'Success'
        }

        if (isAuthorized) {
            return (
                <React.Fragment>
                    <BootstrapTable
                        data = { this.state.data }
                        striped = { true }
                        hover = { true }
                        remote = { true }
                        fetchInfo = { { dataTotalSize : this.state.totalDataSize } }
                        condensed
                        pagination
                        options = { {
                            sizePerPageList : [
                                { text : '5', value : 5 },
                                { text : '10', value : 10 },
                                { text : '15', value : 15 } ],
                            sizePerPage : this.state.size,
                            onSizePerPageList : this.handleSizePerPageChange.bind(this),
                            onPageChange : this.handlePageChange.bind(this),
                            page : this.state.page,
                            noDataText : (this.state.isLoading) ? (<Spin />) : ('No Data Found'),
                            sortName : this.state.sortName,
                            sortOrder : this.state.sortOrder,
                            onSortChange : this.handleSortChange.bind(this),
                            onFilterChange : this.handleFilterChange.bind(this)
                            
                        } }
                    >
                        <TableHeaderColumn dataField='id' isKey={ true } hidden={ true } >ID</TableHeaderColumn>
                        <TableHeaderColumn ref='networkCol' dataField='network' dataAlign='center' width='145px' dataSort={ true } filter={ { type : 'TextFilter', placeholder : 'Type value ..' } } >Network</TableHeaderColumn>
                        <TableHeaderColumn ref='invoiceCol' dataField='invoice' dataAlign='center' width='250px' dataSort={ true } filter={ { type : 'TextFilter', placeholder : 'Type value ..' } } >Invoice ID</TableHeaderColumn>
                        <TableHeaderColumn ref='subscriptionNameCol' dataField='subscription_name' dataAlign='center' width='175px' dataSort={ true } filter={ { type : 'TextFilter', placeholder : 'Type value ..' } } >Subscription</TableHeaderColumn>
                        <TableHeaderColumn dataField='periode' dataAlign='center' width='100px' dataSort={ true } >Frequent</TableHeaderColumn>
                        <TableHeaderColumn ref='transactionDateCol' dataField='created_at' dataAlign='center' width='200px' dataSort={ true } dataFormat={ dateFormatter } filter={ { type : 'DateFilter' } } >Transaction Date</TableHeaderColumn>
                        <TableHeaderColumn ref='amountCol' dataField='price' dataAlign='center' width='150px' dataSort={ true } filter={ { type : 'TextFilter', placeholder : 'Type value ..' } } >Amount</TableHeaderColumn>
                        <TableHeaderColumn dataField='user_balance_before' dataAlign='center' width='125px' dataSort={ true } >Balance Before</TableHeaderColumn>
                        <TableHeaderColumn dataField='user_balance_after' dataAlign='center' width='125px' dataSort={ true } >Balance After</TableHeaderColumn>
                        <TableHeaderColumn ref='statusCol' dataField='trans_status' dataAlign='center' width='125px' dataSort={ true } filterFormatted dataFormat={ enumFormatter } formatExtraData={ transactionStatus } filter={ { type: 'SelectFilter', options: transactionStatus, placeholder : 'Select ..' } }>Status</TableHeaderColumn>
                        <TableHeaderColumn ref='usernameCol' dataField='user_name' dataAlign='center' width='175px' dataSort={ true } filter={ { type : 'TextFilter', placeholder : 'Type value ..' } } >Username</TableHeaderColumn>
                        <TableHeaderColumn dataField='role' dataAlign='center' width='100px' dataSort={ true } >Role</TableHeaderColumn>
                        <TableHeaderColumn dataField='button' dataAlign='center' width='100px' dataFormat={ this.buttonFormatter.bind(this) } >Actions</TableHeaderColumn>
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

function enumFormatter(cell, row, enumObject) {
    return enumObject[cell]
}

function dateFormatter(cell, row) {
    return (cell) ? (moment(cell, "YYYY-MM-DD HH:mm:ss").format("DD/MM/YYYY HH:mm:ss")) : ('')
}


export default withRouter(connect(mapStateToProps, { SetTableStates })(SubscriptionLogsList))