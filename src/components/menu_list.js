import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Row, Col, Button, message, Spin, Icon, Tooltip } from 'antd'
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table'
import { SetTableStates } from '../actions'
import axios from 'axios'
import { config } from '../config'
import { readFilterData } from '../middleware/read_filter'
import { downloadCSV } from '../middleware/export'

class MenuList extends Component {
    constructor(props) {
        super(props)

        this.state = {
            user_rights : (this.props.user.rights) ? (this.props.user.rights) : (''),
            isAuthorized : false,
            create : false,
            read : false,
            update : false,
            delete : false,
            isLoading : false,
            data : [],
            totalDataSize : 0,
            size : 5,
            page : 1,
            columnFilter : false,
            filterObj : {},
            sortName : undefined,
            sortOrder : undefined,
            selectedRow : {},
            api_url : config().api_url,
            config : { headers : { 'token' : localStorage.getItem('token') } },
            pagepath : this.props.location.pathname
        }
    }

    componentWillMount() {
        const page_url = this.state.pagepath
        const rights = this.state.user_rights
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
            this.props.SetTableStates({})
        }

        for (let item in rights) {
            if (rights[item].page_url === page_url) {
                if (rights[item].read === 1) {
                    this.setState({
                        isAuthorized : true,
                        read : true,
                        create : (rights[item].create === 1) ? (true) : (false),
                        update : (rights[item].update === 1) ? (true) : (false),
                        delete : (rights[item].delete === 1) ? (true) : (false),
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
        this.setState({ isLoading : true, data : [], totalDataSize : 0 })

        const { api_url, config } = this.state
        let url = api_url + '/api/menu/page_list/?page=' + page + '&size=' + size

        // Sort Management
        if (sortName) {
            url += `&orderBy=menu_id,${ sortName }`

            if (sortOrder) {
                url += `&orderDirection=${ sortOrder }`
            } else {
                url += `&orderDirection=ASC`
            }
        } else {
            url += `&orderBy=menu_id,page_order&orderDirection=ASC`
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
                    isLoading : false,
                    data : response.data.ResponseData,
                    totalDataSize : response.data.ResponseTotalResult
                })
            } else {
                if (response.data.status === '401') {
                    this.setState({
                        isLoading : false,
                        isAuthorized : false
                    }, () => {
                        message.error('Login Authentication Expired. Please Login Again!')
                    })
                } else {
                    this.setState({ isLoading : false }, () => {
                        let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : "Fetching Failed"
                        message.error(msg)
                    })
                }
            }
        })
        .catch((err) => {
            this.setState({ isLoading : false })
            console.log(err)
        })
    }

    assignFilter() {
        const { filterObj } = this.state

        if (Object.keys(filterObj).length > 0) {
            
            if (filterObj.menu_name) {
                this.refs.menuNameCol.applyFilter(filterObj.menu_name.value)
            }
            
            if (filterObj.page_name) {
                this.refs.pageNameCol.applyFilter(filterObj.page_name.value)
            }
            
            if (filterObj.hide) {
                this.refs.hideCol.applyFilter(filterObj.hide.value)
            }
        }
    }

    dispatchTableStates() {
        const { page, size, sortName, sortOrder, filterObj, pagepath } = this.state
        const table_states = { page, size, sortName, sortOrder, filterObj, pagepath }

        this.props.SetTableStates(table_states)
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

    onSizePerPageListChange(sizePerPage) {
        this.setState({
            page : 1,
            size : sizePerPage
        }, () => {
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

    onRowSelect(row) {
        const { selectedRow } = this.state
        let replaceRow = {}

        if (row.constructor === Object && Object.keys(row).length > 0) {
            if (row.page_id && row.page_id !== selectedRow.page_id) {
                replaceRow = row
            }

            this.setState({ selectedRow : replaceRow }, () => {
                console.log(this.state.selectedRow)
            })
        }
    }

    editRow(row) {
        this.props.history.push({
            pathname : `/menu/edit/${row.page_id}`
        })
    }

    viewRow(row) {
        this.props.history.push({
            pathname : `/menu/view/${row.page_id}`
        })
    }

    deleteRow() {
        const { api_url, config, selectedRow } = this.state
        
        if (selectedRow.page_id) {
            const remove = window.confirm("Confirm Delete Menu Page?")
            
            if (remove) {
                const url = api_url + '/api/menu/page/?page_id=' + selectedRow.page_id
                
                console.log(url)

                axios.delete(url, config)
                .then((response) => {
                    console.log(response.data)

                    if (response.data.ResponseCode === '200') {
                        this.setState({ selectedRow : {} }, () => {
                            message.success(response.data.ResponseDesc)
                            this.fetchData()
                        })
                    } else {
                        if (response.data.status === '401') {
                            this.setState({ isAuthorized : false }, () => {
                                message.error('Login Authentication Expired. Please Login Again!')
                            })
                        } else {
                            let msg = (response.data.ResponseDesc) ? (response.data.ResponseDesc.sqlMessage) ? response.data.ResponseDesc.sqlMessage : response.data.ResponseDesc : "Delete Failed"
                            message.error(msg)
                        }
                    }
                })
                .catch((err) => {
                    console.log(err)
                })
            }
        }
    }

    handleDeleteButton() {
        const { selectedRow } = this.state

        let isSelectedRowEmpty = selectedRow.page_id === undefined
    
        if (isSelectedRowEmpty) {
          return true
        } else {
          return false
        }
      }

    async exportData() {
        const { api_url, config, sortName, sortOrder, columnFilter, filterObj } = this.state

        let url = api_url + '/api/menu/page_list/?page=all'
        let exportData = false

        // Sort Management
        if (sortName) {
            url += `&orderBy=menu_id,${ sortName }`

            if (sortOrder) {
                url += `&orderDirection=${ sortOrder }`
            } else {
                url += `&orderDirection=ASC`
            }
        } else {
            url += `&orderBy=menu_id,page_order&orderDirection=ASC`
        }

        if (columnFilter && filterObj !== undefined && filterObj !== {} ) {
            // Filter Management
            let filterUrl = readFilterData(filterObj)
            url += filterUrl

            exportData = true
        } else {
            exportData = window.confirm("Do you really want to export all data ?")
        }

        if (exportData) {   
            console.log('Export URL : ', url)
            
            axios.get(url, config)
            .then((response) => {
                if (response.data.ResponseCode === '200') {
                    downloadCSV(response.data.ResponseData, 'menu')
                } else {
                    message.error(response.data.ResponseDesc)
                }
            })
            .catch((err) => {
                console.error(err)
            })
        }
    }

    buttonFormatter(cell, row) {
        const edit = <a onClick={ () => this.editRow(row) }><Tooltip title='Edit Page Details'><Icon type='edit' /></Tooltip></a>
        const view = <a onClick={ () => this.viewRow(row) } style={{ marginLeft : '10px' }} ><Tooltip title='View Page Details'><Icon type='search' /></Tooltip></a>

        return (
            <div>
                {edit} {view}
            </div>
        )
    }

    render() {
        const { isAuthorized, data, totalDataSize } = this.state

        const selectRow = {
            mode : 'radio',
            onSelect : this.onRowSelect.bind(this),
            columnWidth : '50px',
            clickToSelect : true
        }

        const pageHideType = {
            0 : 'False',
            1 : 'True'
        }

        if (isAuthorized) {
            return (
                <React.Fragment>
                    <Row type='flex' justify='end' style={{ marginBottom : '30px' }}>
                        <Col>
                            {
                                (this.state.create) ? (
                                    <Button
                                        className='base_button primary'
                                        onClick={ () => {
                                            this.props.history.push({ pathname : '/menu/new' })
                                        } }
                                    >
                                        Add New Page
                                    </Button>
                                ) : ('')
                            }

                            <Button
                                className='base_button primary'
                                onClick={ () => this.exportData() }
                            >
                                Export CSV
                            </Button>

                            {
                                (this.state.delete) ? (
                                    <Button
                                        className={ (Object.keys(this.state.selectedRow).length > 0 ) ? ('base_button delete') : ('button_disabled delete_disabled') }
                                        onClick={ this.deleteRow.bind(this) }
                                        disabled={ this.handleDeleteButton() }
                                    >
                                        Delete
                                    </Button>
                                ) : ('')
                            }
                        </Col>
                    </Row>

                    <BootstrapTable
                        data={ data }
                        striped={ true }
                        hover={ true }
                        remote={ true }
                        fetchInfo={{ dataTotalSize : totalDataSize }}
                        condensed
                        pagination
                        selectRow={ selectRow }
                        options={{
                            sizePerPageList : [ {
                                    text : '5', value : 5
                                }, {
                                    text : '10', value : 10
                                }, {
                                    text : '15', value : 15
                                }],
                            sizePerPage : this.state.size,
                            onSizePerPageList : this.onSizePerPageListChange.bind(this),
                            page : this.state.page,
                            onPageChange : this.onPageChange.bind(this),
                            noDataText : (this.state.isLoading) ? (<Spin/>) : ('No Data'),
                            sortName : this.state.sortName,
                            sortOrder : this.state.sortOrder,
                            onSortChange : this.onSortChange.bind(this),
                            onFilterChange : this.onFilterChange.bind(this)
                        }}
                    >
                        <TableHeaderColumn isKey hidden dataField='page_id' >Menu</TableHeaderColumn>
                        <TableHeaderColumn ref='menuNameCol' dataField='menu_name' width='150px' dataAlign='center' filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } } >Menu</TableHeaderColumn>
                        <TableHeaderColumn ref='pageNameCol' dataField='page_name' width='150px' dataAlign='center' dataSort={ true } filter={ { type: 'TextFilter', placeholder: 'Please enter a value' } } >Page</TableHeaderColumn>
                        <TableHeaderColumn dataField='page_order' width='100px' dataAlign='center' dataSort={ true } >Sequence</TableHeaderColumn>
                        <TableHeaderColumn dataField='class_icon' width='150px' dataAlign='center' >Icon</TableHeaderColumn>
                        <TableHeaderColumn ref='hideCol' dataField='hide' width='100px' dataAlign='center' dataSort={ true } filterFormatted dataFormat={ enumFormatter } formatExtraData={ pageHideType } filter={ { type: 'SelectFilter', options : pageHideType } }>Hide</TableHeaderColumn>
                        <TableHeaderColumn dataField='button' width='75px' dataAlign='center' dataFormat={ this.buttonFormatter.bind(this) } >Actions</TableHeaderColumn>
                    </BootstrapTable>
                </React.Fragment>
            )
        } else {
            return ('You are not authorized to access this page')
        }
    }
}

function enumFormatter(cell, row, enumObject) {
    return enumObject[cell]
}

function mapStateToProps(state) {
    const { user, table_states } = state

    return { user, table_states }
}

export default withRouter(connect(mapStateToProps, { SetTableStates })(MenuList))